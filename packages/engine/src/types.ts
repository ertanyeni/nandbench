/**
 * Faz 0 — Engine type contract  (project: gatecraft)
 *
 * This is the SHAPE of the simulation engine, not its implementation.
 * Rules from CLAUDE.md apply:
 *   - This file lives in `packages/engine` and imports NOTHING from React/DOM.
 *   - Everything is unit-testable in isolation, before any UI exists.
 *
 * Reading order: IDs -> SignalValue/ops -> Ports -> Component def/instance
 *                -> Net/CompiledNetlist -> Diagnostics -> Simulator.
 */

/* ------------------------------------------------------------------ */
/* Identifiers — branded so a ComponentId can never be passed as a NetId */
/* ------------------------------------------------------------------ */

export type ComponentId = string & { readonly __brand: 'ComponentId' };
export type NetId = string & { readonly __brand: 'NetId' };

/** key into CompiledNetlist.portToNet, formatted as `${componentId}:${portName}` */
export type PortKey = string & { readonly __brand: 'PortKey' };

/* ------------------------------------------------------------------ */
/* Four-valued logic                                                   */
/* ------------------------------------------------------------------ */

/** Single bit, four-valued. Used for simple gates and wire display. */
export type Logic = 0 | 1 | 'x' | 'z';

/**
 * Immutable multi-bit bus value. Four-valued PER BIT.
 * Invariant for each bit i (0 = LSB):
 *   - if (unknown >> i) & 1n  => X (conflict / undefined)
 *   - else if (hiZ >> i) & 1n => Z (undriven / floating)
 *   - else                    => 0 or 1 from (value >> i) & 1n
 * At most one of { unknown[i], hiZ[i] } may be set.
 */
export interface SignalValue {
  readonly width: number;
  readonly value: bigint;   // logic-1 bits (meaningful only where defined)
  readonly unknown: bigint; // X bits
  readonly hiZ: bigint;     // Z bits
}

/** Pure value algebra. Implement ONCE, test against truth tables hard. */
export interface SignalOps {
  fromLogic(bits: Logic[]): SignalValue;              // LSB-first
  literal(width: number, value: bigint): SignalValue; // defined 0/1 bits only
  allZ(width: number): SignalValue;
  allX(width: number): SignalValue;
  equals(a: SignalValue, b: SignalValue): boolean;
  slice(v: SignalValue, lo: number, hi: number): SignalValue;
  concat(parts: SignalValue[]): SignalValue;          // parts[0] = LSB chunk
  /** Resolve multiple drivers sharing one net (a wired junction). */
  resolve(drivers: SignalValue[]): ResolveResult;
}

export interface ResolveResult {
  readonly value: SignalValue;
  /** Bits where two drivers disagreed (driven 0 vs 1) => forced to X.
   *  Non-zero here is what raises a 'multi-driver' diagnostic. */
  readonly conflictBits: bigint;
}

/* ------------------------------------------------------------------ */
/* Ports                                                               */
/* ------------------------------------------------------------------ */

export type PortDirection = 'in' | 'out' | 'inout';

export interface PortSpec {
  readonly name: string;
  readonly direction: PortDirection;
  readonly width: number;
}

export interface PortRef {
  readonly componentId: ComponentId;
  readonly portName: string;
}

/* ------------------------------------------------------------------ */
/* Components — definition (behavior) vs instance (data)               */
/* ------------------------------------------------------------------ */

export type ParamValue = number | string | boolean;
export type ComponentParams = Readonly<Record<string, ParamValue>>;

/** Passed to evaluate(): read inputs, drive outputs. State is read-only here. */
export interface EvalContext<TState> {
  readonly params: ComponentParams;
  readonly state: Readonly<TState>;
  readonly ops: SignalOps;
  read(port: string): SignalValue;                 // current value on the wired net
  write(port: string, value: SignalValue): void;   // drive an output port
}

/** Passed to clockEdge(): read inputs, mutate state. No output writes here —
 *  outputs are produced by evaluate() reading the new state. */
export interface ClockContext<TState> {
  readonly params: ComponentParams;
  readonly ops: SignalOps;
  state: TState;                                   // mutable: latch next state
  read(port: string): SignalValue;
}

/**
 * The behavior of a primitive kind (AND, MUX, Register, ...) OR a composite
 * (a saved sub-circuit, added later in Faz 5). Registered once by `kind`.
 */
export interface ComponentDefinition<TState = unknown> {
  readonly kind: string;
  readonly isSequential?: boolean;
  /** Ports can depend on params (bus width, fan-in count, ...). */
  ports(params: ComponentParams): readonly PortSpec[];
  initialState?(params: ComponentParams): TState;
  /** Combinational: pure fn of inputs (+ state for sequential outputs like Q). */
  evaluate(ctx: EvalContext<TState>): void;
  /** Sequential only: latch new state on the active clock edge. */
  clockEdge?(ctx: ClockContext<TState>): void;
}

/** A concrete placed component. */
export interface ComponentInstance<TState = unknown> {
  readonly id: ComponentId;
  readonly kind: string;
  readonly params: ComponentParams;
  state: TState;
}

export interface ComponentRegistry {
  register<TState>(def: ComponentDefinition<TState>): void;
  get(kind: string): ComponentDefinition | undefined;
}

/* ------------------------------------------------------------------ */
/* Nets & compiled netlist (output of the union-find net compiler)     */
/* ------------------------------------------------------------------ */

export interface Net {
  readonly id: NetId;
  readonly width: number;
  value: SignalValue;                  // current resolved value
  readonly drivers: readonly PortRef[]; // out/inout ports driving this net
  readonly sinks: readonly PortRef[];   // in/inout ports reading this net
}

/** Consumed by the Simulator. Produced from the document model by the net compiler. */
export interface CompiledNetlist {
  readonly components: ReadonlyMap<ComponentId, ComponentInstance>;
  readonly nets: ReadonlyMap<NetId, Net>;
  readonly portToNet: ReadonlyMap<PortKey, NetId>;
}

/* ------------------------------------------------------------------ */
/* Diagnostics — the live-debugging killer feature, baked into the API */
/* ------------------------------------------------------------------ */

export type Diagnostic =
  | { kind: 'width-mismatch'; net: NetId; port: PortRef; expected: number; got: number }
  | { kind: 'multi-driver'; net: NetId; drivers: readonly PortRef[] }
  | { kind: 'oscillation'; nets: readonly NetId[] }
  | { kind: 'floating-input'; port: PortRef }
  | { kind: 'composite-cycle'; chain: readonly string[] }
  | { kind: 'composite-depth-exceeded'; depth: number };

/* ------------------------------------------------------------------ */
/* Scheduler / simulator                                               */
/* ------------------------------------------------------------------ */

export interface SimEvent {
  readonly netId: NetId;
  readonly newValue: SignalValue;
}

export interface SettleResult {
  readonly stable: boolean;             // false => oscillation cap hit
  readonly deltaCycles: number;
  readonly oscillatingNets: readonly NetId[];
}

/** Sent across the worker boundary to the renderer. Must be structured-clone safe. */
export interface SimSnapshot {
  readonly nets: ReadonlyMap<NetId, SignalValue>;
  readonly tick: number;                // clock edges elapsed
}

export interface Simulator {
  load(netlist: CompiledNetlist): void;
  /** External stimulus (input switch / constant). Schedules dependent re-eval. */
  setInput(port: PortRef, value: SignalValue): void;
  /** Run delta cycles until quiescent OR the cap trips (oscillation guard). */
  settle(maxDeltaCycles?: number): SettleResult;
  /** One clock edge: run every sequential clockEdge(), then settle combinational. */
  tickClock(): SettleResult;
  snapshot(): SimSnapshot;
  diagnostics(): readonly Diagnostic[];
}

/* ------------------------------------------------------------------ */
/* Helpers — ID constructors (branded type entry points)               */
/* ------------------------------------------------------------------ */

export const asComponentId = (s: string): ComponentId => s as ComponentId;
export const asNetId = (s: string): NetId => s as NetId;
export const portKey = (componentId: ComponentId, portName: string): PortKey =>
  `${componentId}:${portName}` as PortKey;
