/**
 * Verilog testbench generator — takes a lesson's challenge spec and
 * emits a self-checking testbench (`tb_<lesson>.v`) that drives every
 * truth-table case at the DUT and asserts the expected outputs.
 *
 * The DUT module is whatever name `exportVerilog` used (default
 * `nandbench_top`). The user supplies that name to the exporter.
 */

import type { Challenge } from '../challenges.js';

export interface TestbenchOptions {
  readonly dutModuleName: string;
  readonly lessonId: string;
}

export function exportTestbench(challenge: Challenge, opts: TestbenchOptions): string {
  const tbName = `tb_${sanitize(opts.lessonId)}`;
  const dut = sanitize(opts.dutModuleName);

  // Each input/output is declared by name; we trust the user to use the
  // same `name` param on their Pin components that the challenge uses.
  const inputDecls = challenge.inputs.map((n) => `  reg ${sanitize(n)};`).join('\n');
  const outputDecls = challenge.outputs.map((n) => `  wire ${sanitize(n)};`).join('\n');
  const portsAssoc = [
    ...challenge.inputs.map((n) => `.${sanitize(n)}(${sanitize(n)})`),
    ...challenge.outputs.map((n) => `.${sanitize(n)}(${sanitize(n)})`),
  ].join(', ');

  const caseBlocks = challenge.cases
    .map((c, i) => {
      const assigns = challenge.inputs
        .map((name, idx) => `    ${sanitize(name)} = 1'b${c.in[idx] ?? 0};`)
        .join('\n');
      const checks = challenge.outputs
        .map((name, idx) => {
          const exp = c.out[idx] ?? 0;
          return `    if (${sanitize(name)} !== 1'b${exp}) begin\n      $display("FAIL case ${i + 1}: ${name} expected ${exp}, got %b", ${sanitize(name)});\n      fails = fails + 1;\n    end`;
        })
        .join('\n');
      return `  // case ${i + 1}\n${assigns}\n  #5;\n${checks}`;
    })
    .join('\n\n');

  return `// Auto-generated testbench for lesson "${opts.lessonId}".
// Drive the truth-table inputs at the DUT and assert outputs.
//
// Usage with Icarus Verilog:
//   iverilog -o ${tbName} ${tbName}.v ${dut}.v
//   ./${tbName}
//
\`timescale 1ns / 1ps

module ${tbName};
${inputDecls}
${outputDecls}

  integer fails;

  ${dut} dut (${portsAssoc});

  initial begin
    fails = 0;

${caseBlocks}

    if (fails === 0) $display("PASS — all ${challenge.cases.length} cases match.");
    else $display("FAILED — %0d failures.", fails);
    $finish;
  end

endmodule
`;
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1') || 'x';
}
