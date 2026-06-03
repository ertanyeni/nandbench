/**
 * Document + library persistence.
 *
 * On-disk format is a single versioned JSON blob containing both the
 * current document and the saved-circuit library. Stored to localStorage
 * (autosaved) and exportable / importable as a .json file.
 *
 * Schema is intentionally small and explicit — schema migrations between
 * versions are easy because the fields are flat. If we ever need to break
 * the format, bump `FORMAT_VERSION` and add a `migrate(prevDoc) → newDoc`
 * branch.
 */

import type { Locale } from '../i18n/index.js';
import type { CircuitDocument, VisualComponent, VisualWire } from './document.js';
import type { SavedCircuit, SavedCircuitId } from './library.js';

export const FORMAT_VERSION = 3;
const STORAGE_KEY = 'nandbench:state:v3';
const LEGACY_STORAGE_KEY_V2 = 'nandbench:state:v2';
const LEGACY_STORAGE_KEY_V1 = 'nandbench:state:v1';

/**
 * Persistable summary of one tab. Sim/history state is intentionally
 * dropped — it doesn't survive a session.
 */
export interface PersistedTab {
  readonly id: string;
  readonly name: string;
  readonly document: CircuitDocument;
}

export interface PersistedProject {
  readonly name: string;
  readonly activeDocumentId: string;
  readonly tabs: readonly PersistedTab[];
}

export interface PersistedState {
  readonly version: number;
  readonly library: readonly SavedCircuit[];
  readonly locale: Locale;
  readonly project: PersistedProject;
}

interface SerializedComponent {
  id: string;
  kind: string;
  params: Record<string, unknown>;
  position: { x: number; y: number };
  rotation: number;
}

interface SerializedWire {
  id: string;
  endpoints: [
    { componentId: string; portName: string },
    { componentId: string; portName: string },
  ];
  path: { x: number; y: number }[];
}

interface SerializedDocument {
  components: SerializedComponent[];
  wires: SerializedWire[];
}

interface SerializedSavedCircuit {
  id: string;
  name: string;
  doc: SerializedDocument;
  inputs: SerializedPort[];
  outputs: SerializedPort[];
  createdAt: number;
}

interface SerializedPort {
  name: string;
  direction: 'in' | 'out' | 'inout';
  width: number;
  innerComponentId: string;
}

interface SerializedTab {
  id: string;
  name: string;
  document: SerializedDocument;
}

interface SerializedProject {
  name: string;
  activeDocumentId: string;
  tabs: SerializedTab[];
}

interface SerializedRoot {
  version: number;
  /** v1+v2 single-document field (deprecated, still read for migration). */
  document?: SerializedDocument;
  library: SerializedSavedCircuit[];
  locale?: Locale;
  /** v3+ */
  project?: SerializedProject;
}

/* -------------------------- to JSON ----------------------------- */

export function toJSON(state: PersistedState): string {
  const root: SerializedRoot = {
    version: state.version,
    library: state.library.map(serializeSavedCircuit),
    locale: state.locale,
    project: {
      name: state.project.name,
      activeDocumentId: state.project.activeDocumentId,
      tabs: state.project.tabs.map((t) => ({
        id: t.id,
        name: t.name,
        document: serializeDoc(t.document),
      })),
    },
  };
  return JSON.stringify(root, null, 2);
}

function serializeDoc(doc: CircuitDocument): SerializedDocument {
  return {
    components: doc.components.map((c) => ({
      id: c.id,
      kind: c.kind,
      params: { ...c.params },
      position: { x: c.position.x, y: c.position.y },
      rotation: c.rotation,
    })),
    wires: doc.wires.map((w) => ({
      id: w.id,
      endpoints: [
        { componentId: w.endpoints[0].componentId, portName: w.endpoints[0].portName },
        { componentId: w.endpoints[1].componentId, portName: w.endpoints[1].portName },
      ],
      path: w.path.map((p) => ({ x: p.x, y: p.y })),
    })),
  };
}

function serializeSavedCircuit(sc: SavedCircuit): SerializedSavedCircuit {
  return {
    id: sc.id,
    name: sc.name,
    doc: serializeDoc(sc.doc),
    inputs: sc.inputs.map((p) => ({
      name: p.name,
      direction: p.direction,
      width: p.width,
      innerComponentId: p.innerComponentId,
    })),
    outputs: sc.outputs.map((p) => ({
      name: p.name,
      direction: p.direction,
      width: p.width,
      innerComponentId: p.innerComponentId,
    })),
    createdAt: sc.createdAt,
  };
}

/* -------------------------- from JSON --------------------------- */

export function fromJSON(raw: string): PersistedState {
  const parsed = JSON.parse(raw) as SerializedRoot;
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Not a JSON object');
  }
  // v1 / v2 → v3: wrap the single `document` field into a one-tab project.
  if (parsed.version === 1 || parsed.version === 2) {
    if (!parsed.document) throw new Error(`v${parsed.version} blob missing 'document'`);
    const locale: Locale = parsed.version === 2 && parsed.locale === 'tr' ? 'tr' : 'en';
    return {
      version: FORMAT_VERSION,
      library: parsed.library.map(deserializeSavedCircuit),
      locale,
      project: {
        name: 'Untitled',
        activeDocumentId: 'doc_main',
        tabs: [
          {
            id: 'doc_main',
            name: 'main',
            document: deserializeDoc(parsed.document),
          },
        ],
      },
    };
  }
  if (parsed.version !== FORMAT_VERSION) {
    throw new Error(
      `Unsupported file version ${parsed.version} — this build expects v${FORMAT_VERSION}`,
    );
  }
  if (!parsed.project) throw new Error('v3 blob missing project');
  const locale: Locale = parsed.locale === 'tr' ? 'tr' : 'en';
  return {
    version: parsed.version,
    library: parsed.library.map(deserializeSavedCircuit),
    locale,
    project: {
      name: parsed.project.name,
      activeDocumentId: parsed.project.activeDocumentId,
      tabs: parsed.project.tabs.map((t) => ({
        id: t.id,
        name: t.name,
        document: deserializeDoc(t.document),
      })),
    },
  };
}

function deserializeDoc(raw: SerializedDocument): CircuitDocument {
  const components: VisualComponent[] = raw.components.map((c) => ({
    id: c.id as VisualComponent['id'],
    kind: c.kind,
    params: c.params as VisualComponent['params'],
    position: { x: c.position.x, y: c.position.y },
    rotation: (c.rotation ?? 0) as VisualComponent['rotation'],
  }));
  const wires: VisualWire[] = raw.wires.map((w) => ({
    id: w.id as VisualWire['id'],
    endpoints: [
      {
        componentId: w.endpoints[0].componentId as VisualComponent['id'],
        portName: w.endpoints[0].portName,
      },
      {
        componentId: w.endpoints[1].componentId as VisualComponent['id'],
        portName: w.endpoints[1].portName,
      },
    ],
    path: w.path.map((p) => ({ x: p.x, y: p.y })),
  }));
  return { components, wires };
}

function deserializeSavedCircuit(raw: SerializedSavedCircuit): SavedCircuit {
  return {
    id: raw.id as SavedCircuitId,
    name: raw.name,
    doc: deserializeDoc(raw.doc),
    inputs: raw.inputs.map((p) => ({
      name: p.name,
      direction: p.direction,
      width: p.width,
      innerComponentId: p.innerComponentId as VisualComponent['id'],
    })),
    outputs: raw.outputs.map((p) => ({
      name: p.name,
      direction: p.direction,
      width: p.width,
      innerComponentId: p.innerComponentId as VisualComponent['id'],
    })),
    createdAt: raw.createdAt,
  };
}

/* -------------------------- localStorage ------------------------ */

export function loadFromStorage(): PersistedState | null {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_STORAGE_KEY_V2);
    if (!raw) raw = localStorage.getItem(LEGACY_STORAGE_KEY_V1);
    if (!raw) return null;
    return fromJSON(raw);
  } catch (e) {
    console.warn('nandbench: failed to restore state from localStorage', e);
    return null;
  }
}

export function saveToStorage(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, toJSON(state));
  } catch (e) {
    console.warn('nandbench: failed to persist state to localStorage', e);
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
