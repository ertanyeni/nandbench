/**
 * Net compiler — takes the document model (component instances + port-to-port
 * connections) and produces a CompiledNetlist the Simulator consumes.
 *
 * Two ports are electrically equivalent iff they are unioned by a Connection.
 * The compiler walks the union-find roots, builds one Net per equivalence
 * class, and classifies each member port as driver/sink based on its
 * direction.
 *
 * Width-mismatch diagnostics are emitted here (compile-time) since they're
 * structural — they don't depend on simulation state.
 */

import { signalOps } from './signal.js';
import type {
  ComponentDefinition,
  ComponentId,
  ComponentInstance,
  ComponentRegistry,
  CompiledNetlist,
  Diagnostic,
  Net,
  NetId,
  PortKey,
  PortRef,
} from './types.js';
import { asNetId, portKey } from './types.js';
import { UnionFind } from './union-find.js';

/** Input to the net compiler. Connections wire one PortRef to another. */
export interface NetlistInput {
  readonly components: readonly ComponentInstance[];
  /** Each pair declares that A and B are electrically connected. */
  readonly connections: readonly { readonly a: PortRef; readonly b: PortRef }[];
}

export interface CompileResult {
  readonly netlist: CompiledNetlist;
  readonly diagnostics: readonly Diagnostic[];
}

function keyOf(port: PortRef): PortKey {
  return portKey(port.componentId, port.portName);
}

function lookupPortSpec(
  def: ComponentDefinition,
  inst: ComponentInstance,
  portName: string,
): { width: number; direction: 'in' | 'out' | 'inout' } | undefined {
  const specs = def.ports(inst.params);
  for (const s of specs) {
    if (s.name === portName) return { width: s.width, direction: s.direction };
  }
  return undefined;
}

export function compileNetlist(
  input: NetlistInput,
  registry: ComponentRegistry,
): CompileResult {
  const diagnostics: Diagnostic[] = [];

  // 1. Resolve every component's ComponentDefinition and prepare a flat
  //    list of (PortKey, PortRef, width, direction) records.
  type PortRecord = {
    key: PortKey;
    ref: PortRef;
    width: number;
    direction: 'in' | 'out' | 'inout';
  };
  const portRecords: PortRecord[] = [];
  const componentsById = new Map<ComponentId, ComponentInstance>();

  for (const inst of input.components) {
    if (componentsById.has(inst.id)) {
      throw new Error(`Duplicate component id: ${inst.id}`);
    }
    componentsById.set(inst.id, inst);
    const def = registry.get(inst.kind);
    if (!def) {
      throw new Error(`Unknown component kind "${inst.kind}" for ${inst.id}`);
    }
    for (const spec of def.ports(inst.params)) {
      const ref: PortRef = { componentId: inst.id, portName: spec.name };
      portRecords.push({
        key: portKey(inst.id, spec.name),
        ref,
        width: spec.width,
        direction: spec.direction,
      });
    }
  }

  const portIndex = new Map<PortKey, PortRecord>();
  for (const rec of portRecords) {
    if (portIndex.has(rec.key)) {
      throw new Error(`Duplicate port key ${rec.key}`);
    }
    portIndex.set(rec.key, rec);
  }

  // 2. Union-Find over PortKeys.
  const uf = new UnionFind<PortKey>();
  for (const rec of portRecords) uf.add(rec.key);

  for (const conn of input.connections) {
    const ka = keyOf(conn.a);
    const kb = keyOf(conn.b);
    if (!portIndex.has(ka)) {
      throw new Error(
        `Connection references unknown port ${ka} (component or port name not in netlist)`,
      );
    }
    if (!portIndex.has(kb)) {
      throw new Error(
        `Connection references unknown port ${kb} (component or port name not in netlist)`,
      );
    }
    uf.union(ka, kb);
  }

  // 3. Group ports by root. Each group becomes one Net.
  const groupsByRoot = new Map<PortKey, PortRecord[]>();
  for (const rec of portRecords) {
    const root = uf.find(rec.key);
    let group = groupsByRoot.get(root);
    if (!group) {
      group = [];
      groupsByRoot.set(root, group);
    }
    group.push(rec);
  }

  // 4. Build Net objects + portToNet map.
  const nets = new Map<NetId, Net>();
  const portToNet = new Map<PortKey, NetId>();
  let netCounter = 0;

  for (const group of groupsByRoot.values()) {
    // Skip "nets" that are just a single isolated port with nothing wired to it.
    // We still need an entry in portToNet though, so that the simulator can
    // ask "what net is this port on?" for every port. So we build a net for
    // every group, even singletons.
    const netId = asNetId(`n${netCounter++}`);

    // Choose the net's nominal width: the modal width across members.
    // Anything inconsistent emits a width-mismatch diagnostic.
    const widthCounts = new Map<number, number>();
    for (const rec of group) {
      widthCounts.set(rec.width, (widthCounts.get(rec.width) ?? 0) + 1);
    }
    let netWidth = 0;
    let bestCount = -1;
    for (const [w, c] of widthCounts) {
      if (c > bestCount || (c === bestCount && w > netWidth)) {
        netWidth = w;
        bestCount = c;
      }
    }

    const drivers: PortRef[] = [];
    const sinks: PortRef[] = [];
    for (const rec of group) {
      if (rec.width !== netWidth) {
        diagnostics.push({
          kind: 'width-mismatch',
          net: netId,
          port: rec.ref,
          expected: netWidth,
          got: rec.width,
        });
      }
      if (rec.direction === 'out' || rec.direction === 'inout') {
        drivers.push(rec.ref);
      }
      if (rec.direction === 'in' || rec.direction === 'inout') {
        sinks.push(rec.ref);
      }
      portToNet.set(rec.key, netId);
    }

    const net: Net = {
      id: netId,
      width: netWidth,
      value: signalOps.allZ(netWidth),
      drivers,
      sinks,
    };
    nets.set(netId, net);
  }

  const netlist: CompiledNetlist = {
    components: componentsById,
    nets,
    portToNet,
  };

  return { netlist, diagnostics };
}
