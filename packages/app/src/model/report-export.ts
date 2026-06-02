/**
 * Single-file Markdown report — everything a student needs to hand in.
 * Sections in order:
 *   1. Title + (optional) free-text description
 *   2. Interface (inputs + outputs)
 *   3. Truth table (only for combinational circuits)
 *   4. Analysis (gate count, depth, fan-out)
 *   5. Verilog module
 *   6. Embedded schematic SVG
 */

import type { CircuitDocument } from './document.js';
import type { SavedCircuit } from './library.js';
import {
  analyzeCircuit,
  analysisToMarkdown,
  type CircuitAnalysis,
} from './circuit-analysis.js';
import { exportSchematicSVG } from './schematic-export.js';
import {
  extractTruthTable,
  tableToMarkdown,
  type ExtractionResult,
} from './truth-table-extractor.js';
import { exportVerilog } from './verilog-export.js';

export interface ReportOptions {
  title: string;
  description?: string;
}

export function generateMarkdownReport(
  doc: CircuitDocument,
  library: readonly SavedCircuit[],
  options: ReportOptions,
): string {
  const analysis = analyzeCircuit(doc, library);
  const verilog = exportVerilog(doc, library, options.title || 'top');
  const tt = extractTruthTable(doc, library);

  const lines: string[] = [];
  lines.push(`# ${options.title}`);
  lines.push('');
  if (options.description?.trim()) {
    lines.push(options.description.trim());
    lines.push('');
  }
  lines.push('## Interface');
  lines.push('');
  lines.push(renderInterface(analysis));

  // Skip truth table for sequential circuits — table semantics break
  // down once flip-flops introduce state.
  if (!analysis.isSequential) {
    lines.push('');
    lines.push('## Truth table');
    lines.push('');
    lines.push(renderTruthTable(tt));
  } else {
    lines.push('');
    lines.push('## Truth table');
    lines.push('');
    lines.push(
      '_Skipped — this circuit is sequential. Outputs depend on history as well as inputs._',
    );
  }

  lines.push('');
  lines.push(analysisToMarkdown(analysis));
  lines.push('');
  lines.push('## Verilog module');
  lines.push('');
  lines.push('```verilog');
  lines.push(verilog);
  lines.push('```');
  lines.push('');
  lines.push('## Schematic');
  lines.push('');
  // Embed as a data: URL so the .md file is self-contained.
  const svg = exportSchematicSVG(doc, library);
  const dataUrl = `data:image/svg+xml;base64,${base64(svg)}`;
  lines.push(`![Schematic](${dataUrl})`);
  return lines.join('\n');
}

function renderInterface(a: CircuitAnalysis): string {
  if (a.inputs.length === 0 && a.outputs.length === 0) {
    return '_No top-level inputs or outputs._';
  }
  const lines: string[] = [];
  lines.push('| Direction | Name | Width |');
  lines.push('| --- | --- | --- |');
  for (const p of a.inputs) lines.push(`| in | ${p.name} | ${p.width} |`);
  for (const p of a.outputs) lines.push(`| out | ${p.name} | ${p.width} |`);
  return lines.join('\n');
}

function renderTruthTable(result: ExtractionResult): string {
  switch (result.kind) {
    case 'ok':
      return tableToMarkdown(result.table);
    case 'empty':
      return `_Not generated — ${
        result.reason === 'no-inputs' ? 'no named top-level inputs' : 'no named top-level outputs'
      }._`;
    case 'too-large':
      return `_Not generated — ${result.rowCount.toLocaleString()} rows exceeds the cap of ${result.cap}._`;
    case 'error':
      return `_Truth-table extraction failed: ${result.message}_`;
  }
}

// Browser-safe base64 of UTF-8 string.
function base64(s: string): string {
  // unescape(encodeURIComponent) round-trips multi-byte chars into
  // single-byte chars before btoa, which only accepts Latin-1.
  return btoa(unescape(encodeURIComponent(s)));
}
