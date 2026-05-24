#!/usr/bin/env node
/**
 * gatecraft-check — headless project verifier.
 *
 * Usage:
 *   gatecraft-check <file.json> [--challenge=<lessonId>] [--tab=<id|name>]
 *
 * Reads a Gatecraft project JSON (v3) — compiles the first (or named) tab,
 * runs the simulator to a fixed point, and reports compile + sim
 * diagnostics. If `--challenge` is provided, looks up the corresponding
 * lesson challenge from the app's challenge registry and grades the
 * circuit: exit 0 = pass, 1 = fail / sim error, 2 = invalid usage.
 *
 * Designed for CI: pipe a saved project into a workflow and assert that
 * a student's circuit still matches the expected truth table after edits.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRegistry, createSimulator, registerPrimitives } from '@gatecraft/engine';
import { CHALLENGES } from '@gatecraft/app/src/challenges.js';
import { runChallenge } from '@gatecraft/app/src/model/challenge-runner.js';
import { compileDocument } from '@gatecraft/app/src/model/netlist-sync.js';
import { fromJSON } from '@gatecraft/app/src/model/persistence.js';

interface CliArgs {
  readonly file: string;
  readonly challenge?: string;
  readonly tab?: string;
}

function parseArgs(argv: readonly string[]): CliArgs | null {
  const positional: string[] = [];
  let challenge: string | undefined;
  let tab: string | undefined;
  for (const a of argv) {
    if (a.startsWith('--challenge=')) challenge = a.slice('--challenge='.length);
    else if (a.startsWith('--tab=')) tab = a.slice('--tab='.length);
    else if (a === '--help' || a === '-h') return null;
    else positional.push(a);
  }
  if (positional.length !== 1) return null;
  return { file: positional[0]!, challenge, tab };
}

function usage(): void {
  console.error(
    'Usage: gatecraft-check <file.json> [--challenge=<lessonId>] [--tab=<id|name>]',
  );
  console.error('');
  console.error('Known challenges:');
  for (const id of Object.keys(CHALLENGES)) {
    console.error(`  - ${id}`);
  }
}

const args = parseArgs(process.argv.slice(2));
if (!args) {
  usage();
  process.exit(2);
}

let raw: string;
try {
  raw = readFileSync(resolve(args.file), 'utf8');
} catch (e) {
  console.error(`Cannot read ${args.file}: ${(e as Error).message}`);
  process.exit(2);
}

let project: ReturnType<typeof fromJSON>;
try {
  project = fromJSON(raw);
} catch (e) {
  console.error(`Bad JSON / unsupported version: ${(e as Error).message}`);
  process.exit(2);
}

const tabs = project.project.tabs;
if (tabs.length === 0) {
  console.error('Project has no documents.');
  process.exit(2);
}

const tab =
  args.tab !== undefined
    ? tabs.find((t) => t.id === args.tab || t.name === args.tab)
    : tabs[0];
if (!tab) {
  console.error(`Tab "${args.tab}" not found. Available: ${tabs.map((t) => t.name).join(', ')}`);
  process.exit(2);
}

console.log(
  `[gatecraft-check] tab "${tab.name}" — ${tab.document.components.length} components, ${tab.document.wires.length} wires`,
);

const { netlist, diagnostics: compileDiags } = compileDocument(tab.document, project.library);
if (compileDiags.length > 0) {
  console.log(`Compile diagnostics: ${compileDiags.length}`);
  for (const d of compileDiags.slice(0, 20)) console.log(`  ${d.kind}`);
}

const registry = createRegistry();
registerPrimitives(registry);
const sim = createSimulator(registry);
sim.load(netlist);
sim.settle();
const simDiags = sim.diagnostics();
if (simDiags.length > 0) {
  console.log(`Sim diagnostics: ${simDiags.length}`);
  for (const d of simDiags.slice(0, 20)) console.log(`  ${d.kind}`);
}

if (args.challenge) {
  const challenge = CHALLENGES[args.challenge];
  if (!challenge) {
    console.error(`Unknown challenge "${args.challenge}". Run with --help to list.`);
    process.exit(2);
  }
  const result = runChallenge(tab.document, project.library, challenge);
  if (result.kind === 'pass') {
    console.log(`✓ Challenge "${args.challenge}" PASSED (${challenge.cases.length} cases)`);
    process.exit(0);
  }
  if (result.kind === 'error') {
    console.error(`✗ Challenge "${args.challenge}" ERROR: ${result.message}`);
    process.exit(1);
  }
  console.log(`✗ Challenge "${args.challenge}" FAILED — ${result.failures.length} cases`);
  for (const f of result.failures) {
    console.log(
      `  case ${f.caseIdx + 1}: expected [${f.expected.join(', ')}], got [${f.got.join(', ')}]`,
    );
  }
  process.exit(1);
}

console.log('✓ Document loaded and simulated cleanly');
process.exit(0);
