/**
 * Persistence migration paths — v1 + v2 → v3 wrap-into-tab. Also covers
 * defensive parsing: malformed JSON, unsupported future versions,
 * missing required fields.
 */

import { describe, expect, it } from 'vitest';
import { FORMAT_VERSION, fromJSON } from '../src/model/persistence.js';

const v1Blob = JSON.stringify({
  version: 1,
  library: [],
  document: {
    components: [
      {
        id: 'in1',
        kind: 'input',
        params: { width: 1 },
        position: { x: 0, y: 0 },
        rotation: 0,
      },
    ],
    wires: [],
  },
});

const v2Blob = JSON.stringify({
  version: 2,
  library: [],
  locale: 'tr',
  document: {
    components: [
      {
        id: 'in1',
        kind: 'input',
        params: { width: 1 },
        position: { x: 0, y: 0 },
        rotation: 0,
      },
    ],
    wires: [],
  },
});

describe('persistence migration', () => {
  it('v1 blob is wrapped into a single-tab v3 project with EN default', () => {
    const out = fromJSON(v1Blob);
    expect(out.version).toBe(FORMAT_VERSION);
    expect(out.locale).toBe('en');
    expect(out.project.tabs).toHaveLength(1);
    expect(out.project.tabs[0]!.name).toBe('main');
    expect(out.project.tabs[0]!.document.components).toHaveLength(1);
  });

  it('v2 blob preserves locale on migration', () => {
    const out = fromJSON(v2Blob);
    expect(out.locale).toBe('tr');
  });

  it('v1 blob with missing document field throws', () => {
    const bad = JSON.stringify({ version: 1, library: [] });
    expect(() => fromJSON(bad)).toThrow(/v1 blob missing/);
  });

  it('unsupported future versions throw a clear error', () => {
    const future = JSON.stringify({ version: 99, library: [] });
    expect(() => fromJSON(future)).toThrow(/Unsupported file version/);
  });

  it('non-object payload throws', () => {
    expect(() => fromJSON('null')).toThrow(/Not a JSON object/);
    expect(() => fromJSON('42')).toThrow(/Not a JSON object/);
  });

  it('v3 blob missing project throws', () => {
    const bad = JSON.stringify({ version: FORMAT_VERSION, library: [] });
    expect(() => fromJSON(bad)).toThrow(/v3 blob missing project/);
  });

  it('round-trips an active tab document through v3', () => {
    const v3Blob = JSON.stringify({
      version: FORMAT_VERSION,
      library: [],
      locale: 'en',
      project: {
        name: 'Round-trip',
        activeDocumentId: 'doc_x',
        tabs: [
          {
            id: 'doc_x',
            name: 'Tab X',
            document: { components: [], wires: [] },
          },
        ],
      },
    });
    const out = fromJSON(v3Blob);
    expect(out.project.name).toBe('Round-trip');
    expect(out.project.activeDocumentId).toBe('doc_x');
    expect(out.project.tabs).toHaveLength(1);
    expect(out.project.tabs[0]!.name).toBe('Tab X');
  });
});
