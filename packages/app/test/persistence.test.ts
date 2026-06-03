import { describe, expect, it } from 'vitest';
import { asComponentId } from '@nandbench/engine';
import { asWireId, type CircuitDocument } from '../src/model/document.js';
import { asSavedCircuitId, snapshotAsSavedCircuit } from '../src/model/library.js';
import { FORMAT_VERSION, fromJSON, toJSON, type PersistedState } from '../src/model/persistence.js';

function sampleDoc(): CircuitDocument {
  return {
    components: [
      {
        id: asComponentId('in_a'),
        kind: 'input',
        params: { width: 1 },
        position: { x: 40, y: 80 },
        rotation: 0,
      },
      {
        id: asComponentId('g'),
        kind: 'and',
        params: { width: 1, inputs: 2 },
        position: { x: 200, y: 80 },
        rotation: 90,
      },
    ],
    wires: [
      {
        id: asWireId('w1'),
        endpoints: [
          { componentId: asComponentId('in_a'), portName: 'out' },
          { componentId: asComponentId('g'), portName: 'in0' },
        ],
        path: [
          { x: 100, y: 95 },
          { x: 200, y: 100 },
        ],
      },
    ],
  };
}

function makeState(
  tabs: { id: string; name: string; document: CircuitDocument }[],
  locale: 'en' | 'tr' = 'en',
  library: PersistedState['library'] = [],
): PersistedState {
  return {
    version: FORMAT_VERSION,
    library,
    locale,
    project: {
      name: 'Untitled',
      activeDocumentId: tabs[0]!.id,
      tabs,
    },
  };
}

describe('Persistence — JSON round-trip', () => {
  it('preserves an empty single-tab project', () => {
    const before = makeState([
      { id: 'doc_main', name: 'main', document: { components: [], wires: [] } },
    ]);
    const after = fromJSON(toJSON(before));
    expect(after).toEqual(before);
  });

  it('preserves multi-tab document + library 1:1', () => {
    const doc = sampleDoc();
    const sc = snapshotAsSavedCircuit(asSavedCircuitId('lib-1'), 'My Adder', doc);
    const before = makeState(
      [
        { id: 'doc_1', name: 'main', document: doc },
        { id: 'doc_2', name: 'ALU', document: { components: [], wires: [] } },
      ],
      'tr',
      [sc],
    );
    const after = fromJSON(toJSON(before));
    expect(after.project.tabs).toHaveLength(2);
    expect(after.project.tabs[0]!.document.components).toHaveLength(2);
    expect(after.project.tabs[0]!.document.components[1]!.rotation).toBe(90);
    expect(after.project.tabs[1]!.name).toBe('ALU');
    expect(after.library).toHaveLength(1);
    expect(after.library[0]!.name).toBe('My Adder');
    expect(after.locale).toBe('tr');
  });

  it('rejects an unknown version with a clear message', () => {
    const bogus = JSON.stringify({
      version: 999,
      document: { components: [], wires: [] },
      library: [],
    });
    expect(() => fromJSON(bogus)).toThrow(/version/);
  });

  it('rejects non-object payloads', () => {
    expect(() => fromJSON('"not an object"')).toThrow();
  });

  it('migrates v1 payloads forward into a single-tab project', () => {
    const v1 = JSON.stringify({
      version: 1,
      document: { components: [], wires: [] },
      library: [],
    });
    const after = fromJSON(v1);
    expect(after.version).toBe(FORMAT_VERSION);
    expect(after.locale).toBe('en');
    expect(after.project.tabs).toHaveLength(1);
    expect(after.project.tabs[0]!.name).toBe('main');
  });

  it('migrates v2 payloads forward preserving locale', () => {
    const v2 = JSON.stringify({
      version: 2,
      document: { components: [], wires: [] },
      library: [],
      locale: 'tr',
    });
    const after = fromJSON(v2);
    expect(after.version).toBe(FORMAT_VERSION);
    expect(after.locale).toBe('tr');
    expect(after.project.tabs).toHaveLength(1);
  });
});
