/**
 * Verilog exporter — turns a CircuitDocument into synthesizable structural
 * Verilog. The output is intentionally plain (no SystemVerilog niceties)
 * so it round-trips through Icarus / Yosys / Vivado free editions.
 *
 * Strategy:
 *   1. Each VisualComponent becomes a module instance with a unique name.
 *   2. Each net becomes a `wire [W-1:0] net_<i>;`.
 *   3. Primitive kinds map to small hand-written Verilog modules (emitted
 *      once at the top of the output as a "stdlib" preamble).
 *   4. `input` / `output` pins become module-level ports.
 *
 * Untestable in vitest without a Verilog simulator on the path, so the
 * exporter is text-only — the round-trip is validated by eye via Icarus.
 */

import { portKey } from '@nandbench/engine';
import type { CircuitDocument } from './document.js';
import { compileDocument } from './netlist-sync.js';
import type { SavedCircuit } from './library.js';

/** Sanitise a string into a legal Verilog identifier. */
function sanitize(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');
}

/** Emit `wire [W-1:0]` (or just `wire` for single-bit). */
function wireDecl(name: string, width: number): string {
  if (width <= 1) return `wire ${name};`;
  return `wire [${width - 1}:0] ${name};`;
}

const PREAMBLE = `// nandbench → Verilog (structural)
// Auto-generated. Edit at your own risk.

\`timescale 1ns / 1ps

module gc_and #(parameter W=1) (input [W-1:0] a, b, output [W-1:0] y); assign y = a & b; endmodule
module gc_or  #(parameter W=1) (input [W-1:0] a, b, output [W-1:0] y); assign y = a | b; endmodule
module gc_not #(parameter W=1) (input [W-1:0] a, output [W-1:0] y); assign y = ~a; endmodule
module gc_xor #(parameter W=1) (input [W-1:0] a, b, output [W-1:0] y); assign y = a ^ b; endmodule
module gc_nand #(parameter W=1) (input [W-1:0] a, b, output [W-1:0] y); assign y = ~(a & b); endmodule
module gc_nor  #(parameter W=1) (input [W-1:0] a, b, output [W-1:0] y); assign y = ~(a | b); endmodule
module gc_xnor #(parameter W=1) (input [W-1:0] a, b, output [W-1:0] y); assign y = ~(a ^ b); endmodule
module gc_buf  #(parameter W=1) (input [W-1:0] a, output [W-1:0] y); assign y = a; endmodule

module gc_adder #(parameter W=1) (input [W-1:0] a, b, input cin, output [W-1:0] sum, output cout);
  assign {cout, sum} = a + b + cin;
endmodule

module gc_register #(parameter W=1) (input clk, en, input [W-1:0] d, output reg [W-1:0] q);
  always @(posedge clk) if (en) q <= d;
endmodule

module gc_counter #(parameter W=4) (input clk, en, rst, output reg [W-1:0] q, output co);
  always @(posedge clk) begin
    if (rst) q <= 0;
    else if (en) q <= q + 1;
  end
  assign co = &q;
endmodule
`;

/* ----------------------- per-primitive emitters ----------------------- */

interface Conn {
  readonly portName: string;
  readonly netName: string;
}

function emitInstance(
  kind: string,
  instName: string,
  width: number,
  conns: readonly Conn[],
): string {
  const conn = (name: string): string => conns.find((c) => c.portName === name)?.netName ?? "1'bz";
  switch (kind) {
    case 'and':
      return `  gc_and #(.W(${width})) ${instName} (.a(${conn('in0')}), .b(${conn('in1')}), .y(${conn('out')}));`;
    case 'or':
      return `  gc_or  #(.W(${width})) ${instName} (.a(${conn('in0')}), .b(${conn('in1')}), .y(${conn('out')}));`;
    case 'not':
      return `  gc_not #(.W(${width})) ${instName} (.a(${conn('in')}), .y(${conn('out')}));`;
    case 'xor':
      return `  gc_xor #(.W(${width})) ${instName} (.a(${conn('in0')}), .b(${conn('in1')}), .y(${conn('out')}));`;
    case 'nand':
      return `  gc_nand #(.W(${width})) ${instName} (.a(${conn('in0')}), .b(${conn('in1')}), .y(${conn('out')}));`;
    case 'nor':
      return `  gc_nor  #(.W(${width})) ${instName} (.a(${conn('in0')}), .b(${conn('in1')}), .y(${conn('out')}));`;
    case 'xnor':
      return `  gc_xnor #(.W(${width})) ${instName} (.a(${conn('in0')}), .b(${conn('in1')}), .y(${conn('out')}));`;
    case 'buffer':
      return `  gc_buf #(.W(${width})) ${instName} (.a(${conn('in')}), .y(${conn('out')}));`;
    case 'adder':
      return `  gc_adder #(.W(${width})) ${instName} (.a(${conn('a')}), .b(${conn('b')}), .cin(${conn('cin')}), .sum(${conn('sum')}), .cout(${conn('cout')}));`;
    case 'register':
      return `  gc_register #(.W(${width})) ${instName} (.clk(${conn('clk')}), .en(${conn('en')}), .d(${conn('d')}), .q(${conn('q')}));`;
    case 'counter':
      return `  gc_counter #(.W(${width})) ${instName} (.clk(${conn('clk')}), .en(${conn('en')}), .rst(${conn('rst')}), .q(${conn('q')}), .co(${conn('co')}));`;
    default:
      return `  // unsupported kind "${kind}" — instance ${instName} skipped`;
  }
}

/* ----------------------- main entry point ----------------------- */

export function exportVerilog(
  doc: CircuitDocument,
  library: readonly SavedCircuit[] = [],
  moduleName = 'nandbench_top',
): string {
  // Verilog identifiers can only contain [a-zA-Z0-9_$], so scrub the
  // user-supplied module name before stamping it into the source.
  const moduleId = sanitize(moduleName);
  const { netlist } = compileDocument(doc, library);

  // Assign each net a sanitized name.
  const netNames = new Map<string, string>();
  let netIdx = 0;
  for (const id of netlist.nets.keys()) {
    netNames.set(id, `net_${netIdx++}`);
  }

  // Module-level ports: every `input` / `output` primitive becomes a port.
  const inputPorts: { name: string; width: number; netName: string }[] = [];
  const outputPorts: { name: string; width: number; netName: string }[] = [];
  for (const inst of netlist.components.values()) {
    if (inst.kind !== 'input' && inst.kind !== 'output') continue;
    const width = Number(inst.params['width'] ?? 1);
    const portName = sanitize(String(inst.params['name'] ?? inst.id));
    const portToNet = netlist.portToNet;
    const internalPort = inst.kind === 'input' ? 'out' : 'in';
    const netId = portToNet.get(portKey(inst.id, internalPort));
    const netName = netId ? netNames.get(netId)! : `net_unbound_${inst.id}`;
    if (inst.kind === 'input') inputPorts.push({ name: portName, width, netName });
    else outputPorts.push({ name: portName, width, netName });
  }

  // Wires for every net (skip those bound to a module port — those become
  // ports proper).
  const portNetNames = new Set([
    ...inputPorts.map((p) => p.netName),
    ...outputPorts.map((p) => p.netName),
  ]);
  const wireLines: string[] = [];
  for (const [id, net] of netlist.nets) {
    const name = netNames.get(id)!;
    if (portNetNames.has(name)) continue;
    wireLines.push(`  ${wireDecl(name, net.width)}`);
  }

  // Instance lines.
  const instLines: string[] = [];
  let instCounter = 0;
  for (const inst of netlist.components.values()) {
    if (inst.kind === 'input' || inst.kind === 'output' || inst.kind === 'tunnel') continue;
    const width = Number(inst.params['width'] ?? 1);
    const conns: Conn[] = [];
    // Resolve every port of this instance to its net name.
    for (const [portKey, netId] of netlist.portToNet) {
      const [compId, portName] = portKey.split('::');
      if (compId !== inst.id) continue;
      const netName = netNames.get(netId)!;
      conns.push({ portName: portName!, netName });
    }
    instLines.push(emitInstance(inst.kind, `u${instCounter++}_${sanitize(inst.id).slice(0, 8)}`, width, conns));
  }

  const portList = [
    ...inputPorts.map((p) => `input ${p.width > 1 ? `[${p.width - 1}:0] ` : ''}${p.name}`),
    ...outputPorts.map((p) => `output ${p.width > 1 ? `[${p.width - 1}:0] ` : ''}${p.name}`),
  ].join(',\n    ');

  // Assign external module ports to their internal nets.
  const portAssigns: string[] = [];
  for (const p of outputPorts) portAssigns.push(`  assign ${p.name} = ${p.netName};`);
  for (const p of inputPorts) portAssigns.push(`  // input ${p.name} → ${p.netName}`);

  return [
    PREAMBLE,
    '',
    `module ${moduleId} (\n    ${portList}\n);`,
    ...wireLines,
    ...portAssigns,
    '',
    ...instLines,
    'endmodule',
  ].join('\n');
}
