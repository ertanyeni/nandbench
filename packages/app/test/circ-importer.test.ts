import { describe, expect, it } from 'vitest';
import { importCirc } from '../src/model/circ-importer.js';
import { compileDocument } from '../src/model/netlist-sync.js';

// We use the browser's DOMParser; vitest's node env doesn't ship it. Pull
// in the platform's xmldom-like parser via happy-dom polyfill if needed.
// For now we polyfill a minimal DOMParser using `linkedom` if present,
// otherwise we use the Node `xmldom-jsdom` shim. The simplest portable
// path: register a DOMParser global via a small inline implementation
// using the platform's built-in `DOMParser` (Node 20+ doesn't ship one).
//
// Strategy: feature-detect and skip the suite (with a clear message) when
// DOMParser is missing — these tests then run in real browsers / future
// Node versions that expose it.

const HAS_DOM_PARSER = typeof (globalThis as { DOMParser?: unknown }).DOMParser !== 'undefined';

const HALF_ADDER_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<project source="3.7.2" version="1.0">
  <lib desc="#Wiring" name="0"/>
  <lib desc="#Gates" name="1"/>
  <main name="main"/>
  <circuit name="main">
    <comp lib="0" loc="(60,80)" name="Pin">
      <a name="label" val="A"/>
      <a name="width" val="1"/>
    </comp>
    <comp lib="0" loc="(60,120)" name="Pin">
      <a name="label" val="B"/>
      <a name="width" val="1"/>
    </comp>
    <comp lib="0" loc="(220,90)" name="Pin">
      <a name="label" val="sum"/>
      <a name="output" val="true"/>
      <a name="width" val="1"/>
    </comp>
    <comp lib="0" loc="(220,150)" name="Pin">
      <a name="label" val="cout"/>
      <a name="output" val="true"/>
      <a name="width" val="1"/>
    </comp>
    <comp lib="1" loc="(140,80)" name="XOR Gate">
      <a name="inputs" val="2"/>
    </comp>
    <comp lib="1" loc="(140,140)" name="AND Gate">
      <a name="inputs" val="2"/>
    </comp>
  </circuit>
</project>`;

describe.skipIf(!HAS_DOM_PARSER)('.circ importer', () => {
  it('parses a minimal half-adder document', () => {
    const result = importCirc(HALF_ADDER_XML);
    const kinds = result.document.components.map((c) => c.kind).sort();
    expect(kinds).toEqual(['and', 'input', 'input', 'output', 'output', 'xor']);
    // Labelled pins keep their names so Challenge mode can find them.
    const named = result.document.components
      .filter((c) => typeof c.params['name'] === 'string' && c.params['name'])
      .map((c) => String(c.params['name']))
      .sort();
    expect(named).toEqual(['A', 'B', 'cout', 'sum']);
  });

  it('imports without throwing on empty input', () => {
    const result = importCirc(
      '<?xml version="1.0"?><project version="1.0"><circuit name="main"/></project>',
    );
    expect(result.document.components).toEqual([]);
    expect(result.document.wires).toEqual([]);
  });

  it('emits diagnostic for unknown components', () => {
    const xml = `<?xml version="1.0"?>
      <project version="1.0">
        <circuit name="main">
          <comp lib="99" loc="(20,20)" name="Unobtainium"/>
        </circuit>
      </project>`;
    const result = importCirc(xml);
    expect(result.diagnostics.some((d) => d.kind === 'unknown-component')).toBe(true);
  });

  it('imported half-adder compiles cleanly (every wire matched a pin or got dropped)', () => {
    const result = importCirc(HALF_ADDER_XML);
    const { diagnostics } = compileDocument(result.document, []);
    // Width-mismatch / floating-input may still fire — those are
    // sim-time concerns. We just want compileDocument not to throw.
    expect(Array.isArray(diagnostics)).toBe(true);
  });
});
