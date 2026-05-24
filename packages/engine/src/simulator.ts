/**
 * Event-driven simulator (Faz 0 core).
 *
 * Model
 * -----
 *   driverValues : PortKey -> SignalValue
 *     The value each *output* port is currently driving onto its net.
 *     evaluate() updates these via ctx.write().
 *
 *   netValues    : NetId   -> SignalValue
 *     The resolved value on each net, computed by SignalOps.resolve()
 *     across that net's drivers. This is what ctx.read() returns and
 *     what snapshot() exposes.
 *
 *   pending      : Set<ComponentId>
 *     Components scheduled to re-run evaluate() because some net they
 *     read just changed.
 *
 * Algorithm
 * ---------
 *   load(netlist) — initialize every output to all-Z, run evaluate() on every
 *     component once, then settle to a fixed point.
 *
 *   setInput(port, value) — update driverValues for that port (an Input pin's
 *     `out`), recompute its net, enqueue dependent components.
 *
 *   settle(cap) — pop components off the queue, evaluate, propagate. Stop when
 *     queue empties (stable) OR cap trips (oscillation diagnostic).
 *
 *   tickClock() — call clockEdge() on every sequential component, then
 *     re-evaluate them and settle. tick++.
 *
 * Performance notes
 * -----------------
 *   - Components are the unit of work, not nets, because evaluate() of a
 *     component is the indivisible thing we know how to do. Nets re-resolve
 *     opportunistically inside ctx.write().
 *   - Re-evaluating a component that hasn't actually had any input change is
 *     wasteful but harmless; we keep the bookkeeping simple by enqueueing on
 *     net changes, then letting evaluate() be a pure function of current
 *     inputs. Cost is O(fanout) per net-value change in the steady state.
 */

import { signalOps } from './signal.js';
import type {
  ClockContext,
  ComponentDefinition,
  ComponentId,
  ComponentInstance,
  ComponentRegistry,
  CompiledNetlist,
  Diagnostic,
  EvalContext,
  Net,
  NetId,
  PortKey,
  PortRef,
  SettleResult,
  SignalValue,
  SimSnapshot,
  Simulator,
} from './types.js';
import { portKey } from './types.js';

interface PortInfo {
  width: number;
  direction: 'in' | 'out' | 'inout';
  netId: NetId;
}

const DEFAULT_DELTA_CAP = 10_000;

class SimulatorImpl implements Simulator {
  private netlist!: CompiledNetlist;
  private readonly registry: ComponentRegistry;

  /** Cached lookup: PortKey -> { width, direction, netId }. */
  private readonly portInfo = new Map<PortKey, PortInfo>();
  /** Cached lookup: ComponentId -> resolved ComponentDefinition. */
  private readonly defByComponent = new Map<ComponentId, ComponentDefinition>();
  /** Cached lookup: ComponentId -> input port names (for read-dependency wakeups). */
  private readonly inputPortsByComponent = new Map<ComponentId, string[]>();

  private readonly driverValues = new Map<PortKey, SignalValue>();
  private readonly netValues = new Map<NetId, SignalValue>();

  private pending: Set<ComponentId> = new Set();
  private tick = 0;
  private readonly _diagnostics: Diagnostic[] = [];
  /** Conflict mask per net from the most recent resolve() — for multi-driver diagnostics. */
  private readonly netConflicts = new Map<NetId, bigint>();

  constructor(registry: ComponentRegistry) {
    this.registry = registry;
  }

  load(netlist: CompiledNetlist): void {
    this.netlist = netlist;
    this.portInfo.clear();
    this.defByComponent.clear();
    this.inputPortsByComponent.clear();
    this.driverValues.clear();
    this.netValues.clear();
    this.pending = new Set();
    this.tick = 0;
    this._diagnostics.length = 0;
    this.netConflicts.clear();

    // Resolve definitions + cache port info.
    for (const inst of netlist.components.values()) {
      const def = this.registry.get(inst.kind);
      if (!def) {
        throw new Error(`Unknown component kind "${inst.kind}" for ${inst.id}`);
      }
      this.defByComponent.set(inst.id, def);
      const inputs: string[] = [];
      for (const spec of def.ports(inst.params)) {
        const netId = netlist.portToNet.get(portKey(inst.id, spec.name));
        if (!netId) {
          throw new Error(
            `Port ${inst.id}:${spec.name} is not on any net (compileNetlist invariant violated)`,
          );
        }
        this.portInfo.set(portKey(inst.id, spec.name), {
          width: spec.width,
          direction: spec.direction,
          netId,
        });
        if (spec.direction === 'in' || spec.direction === 'inout') {
          inputs.push(spec.name);
        }
      }
      this.inputPortsByComponent.set(inst.id, inputs);
    }

    // Seed every net to all-Z and every output port to all-Z.
    for (const net of netlist.nets.values()) {
      this.netValues.set(net.id, signalOps.allZ(net.width));
    }
    for (const [pk, info] of this.portInfo) {
      if (info.direction === 'out' || info.direction === 'inout') {
        this.driverValues.set(pk, signalOps.allZ(info.width));
      }
    }

    // Initialize component states from their definitions.
    for (const inst of netlist.components.values()) {
      const def = this.defByComponent.get(inst.id)!;
      if (def.initialState && inst.state === undefined) {
        // Only auto-initialize if the loader hasn't provided one.
        (inst as { state: unknown }).state = def.initialState(inst.params);
      }
    }

    // Enqueue every component for an initial evaluate.
    for (const id of netlist.components.keys()) {
      this.pending.add(id);
    }

    // Scan for floating-input diagnostics (declared input never driven).
    this.scanFloatingInputs();
  }

  setInput(port: PortRef, value: SignalValue): void {
    const pk = portKey(port.componentId, port.portName);
    const info = this.portInfo.get(pk);
    if (!info) {
      throw new Error(`setInput: unknown port ${pk}`);
    }
    if (info.direction === 'in') {
      throw new Error(
        `setInput must target a driving (out/inout) port. ${pk} is an input. ` +
          `Drive its source pin instead.`,
      );
    }
    if (value.width !== info.width) {
      throw new Error(
        `setInput width mismatch on ${pk}: pin is ${info.width}-bit, value is ${value.width}-bit`,
      );
    }
    // For Input pins, also update the component's state so a future evaluate()
    // doesn't clobber the override on the next settle.
    const inst = this.netlist.components.get(port.componentId);
    if (inst && inst.kind === 'input') {
      (inst as ComponentInstance<{ driven: SignalValue }>).state = { driven: value };
    }
    this.driverValues.set(pk, value);
    this.recomputeNet(info.netId);
  }

  settle(maxDeltaCycles: number = DEFAULT_DELTA_CAP): SettleResult {
    let cycles = 0;
    while (this.pending.size > 0 && cycles < maxDeltaCycles) {
      const next = this.pending.values().next().value as ComponentId;
      this.pending.delete(next);
      this.runEvaluate(next);
      cycles++;
    }
    if (this.pending.size > 0) {
      // Oscillation cap tripped. Collect the nets that are still being agitated:
      // anything an as-yet-unevaluated component drives.
      const oscillatingNets = new Set<NetId>();
      for (const id of this.pending) {
        const def = this.defByComponent.get(id)!;
        const inst = this.netlist.components.get(id)!;
        for (const spec of def.ports(inst.params)) {
          if (spec.direction === 'out' || spec.direction === 'inout') {
            const info = this.portInfo.get(portKey(id, spec.name));
            if (info) oscillatingNets.add(info.netId);
          }
        }
      }
      const list = [...oscillatingNets];
      this._diagnostics.push({ kind: 'oscillation', nets: list });
      // Mark oscillating nets as X.
      for (const netId of list) {
        const net = this.netlist.nets.get(netId)!;
        this.netValues.set(netId, signalOps.allX(net.width));
      }
      this.pending.clear();
      return { stable: false, deltaCycles: cycles, oscillatingNets: list };
    }
    // Refresh multi-driver diagnostics from the latest resolve() conflicts.
    this.refreshMultiDriverDiagnostics();
    return { stable: true, deltaCycles: cycles, oscillatingNets: [] };
  }

  tickClock(): SettleResult {
    // 1. Capture next-state for every sequential component.
    for (const inst of this.netlist.components.values()) {
      const def = this.defByComponent.get(inst.id)!;
      if (!def.isSequential || !def.clockEdge) continue;
      const ctx: ClockContext<unknown> = {
        params: inst.params,
        ops: signalOps,
        state: inst.state,
        read: (portName) => this.readPort(inst.id, portName),
      };
      def.clockEdge(ctx);
      // Apply mutations to the canonical instance.state.
      (inst as ComponentInstance<unknown>).state = ctx.state;
      // Re-evaluate this sequential component so its outputs reflect the new state.
      this.pending.add(inst.id);
    }
    this.tick++;
    return this.settle();
  }

  snapshot(): SimSnapshot {
    // Structured-clone-safe payload: copy the maps so the consumer can't mutate ours.
    const nets = new Map<NetId, SignalValue>();
    for (const [id, v] of this.netValues) nets.set(id, v);
    return { nets, tick: this.tick };
  }

  diagnostics(): readonly Diagnostic[] {
    return this._diagnostics.slice();
  }

  /* -------------------------- internals -------------------------- */

  private readPort(componentId: ComponentId, portName: string): SignalValue {
    const pk = portKey(componentId, portName);
    const info = this.portInfo.get(pk);
    if (!info) {
      throw new Error(`read: unknown port ${pk}`);
    }
    const v = this.netValues.get(info.netId);
    if (!v) return signalOps.allZ(info.width);
    return v;
  }

  private runEvaluate(componentId: ComponentId): void {
    const inst = this.netlist.components.get(componentId);
    if (!inst) return;
    const def = this.defByComponent.get(componentId)!;
    const dirtyNets = new Set<NetId>();
    const ctx: EvalContext<unknown> = {
      params: inst.params,
      state: inst.state as Readonly<unknown>,
      ops: signalOps,
      read: (portName) => this.readPort(componentId, portName),
      write: (portName, value) => {
        const pk = portKey(componentId, portName);
        const info = this.portInfo.get(pk);
        if (!info) {
          throw new Error(`write: unknown port ${pk}`);
        }
        if (info.direction !== 'out' && info.direction !== 'inout') {
          throw new Error(`write: ${pk} is not an output port`);
        }
        if (value.width !== info.width) {
          throw new Error(
            `write: ${pk} declared ${info.width}-bit but got ${value.width}-bit value`,
          );
        }
        const prev = this.driverValues.get(pk);
        if (prev && signalOps.equals(prev, value)) return;
        this.driverValues.set(pk, value);
        dirtyNets.add(info.netId);
      },
    };
    def.evaluate(ctx);
    for (const netId of dirtyNets) {
      this.recomputeNet(netId);
    }
  }

  /** Re-resolve a net's value from its drivers; wake sinks if the net changed. */
  private recomputeNet(netId: NetId): void {
    const net = this.netlist.nets.get(netId);
    if (!net) return;
    const drivers = net.drivers.map((ref) => {
      const v = this.driverValues.get(portKey(ref.componentId, ref.portName));
      return v ?? signalOps.allZ(net.width);
    });
    let newValue: SignalValue;
    let conflictBits = 0n;
    if (drivers.length === 0) {
      newValue = signalOps.allZ(net.width);
    } else {
      const resolved = signalOps.resolve(drivers);
      newValue = resolved.value;
      conflictBits = resolved.conflictBits;
    }
    const prev = this.netValues.get(netId);
    this.netConflicts.set(netId, conflictBits);
    if (prev && signalOps.equals(prev, newValue)) return;
    this.netValues.set(netId, newValue);
    // Wake all components reading this net.
    for (const sink of net.sinks) {
      this.pending.add(sink.componentId);
    }
  }

  private refreshMultiDriverDiagnostics(): void {
    // Drop previous multi-driver diagnostics; oscillation/floating-input persist.
    for (let i = this._diagnostics.length - 1; i >= 0; i--) {
      const d = this._diagnostics[i]!;
      if (d.kind === 'multi-driver') this._diagnostics.splice(i, 1);
    }
    for (const [netId, conflict] of this.netConflicts) {
      if (conflict === 0n) continue;
      const net = this.netlist.nets.get(netId);
      if (!net) continue;
      this._diagnostics.push({
        kind: 'multi-driver',
        net: netId,
        drivers: net.drivers.slice(),
      });
    }
  }

  private scanFloatingInputs(): void {
    // An input port is "floating" if its net has no drivers at all.
    for (const net of this.netlist.nets.values()) {
      if (net.drivers.length > 0) continue;
      for (const sink of net.sinks) {
        this._diagnostics.push({ kind: 'floating-input', port: sink });
      }
    }
  }
}

export function createSimulator(registry: ComponentRegistry): Simulator {
  return new SimulatorImpl(registry);
}
