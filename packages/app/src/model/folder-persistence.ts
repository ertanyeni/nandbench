/**
 * Folder-based project persistence using the FileSystem Access API.
 *
 * Layout:
 *
 *   my-project/
 *     project.json         — meta (version, locale, active tab, ordered tabs)
 *     library.json         — saved-circuit library (one big array)
 *     docs/
 *       doc_<id>.gcraft.json — one CircuitDocument per tab
 *
 * Why split? It makes the on-disk shape diffable in git: each circuit lives
 * in its own file, so editing one tab doesn't churn the others. The single
 * `.gcraft.json` JSON export still works as the portable share format.
 *
 * Supported in Chromium-based browsers (Chrome, Edge, Opera, Brave). Safari
 * and Firefox don't yet ship `showDirectoryPicker`; callers should check
 * [[isFolderApiAvailable]] before exposing UI.
 */

import type { CircuitDocument } from './document.js';
import type { Locale } from '../i18n/index.js';
import type { SavedCircuit } from './library.js';
import { FORMAT_VERSION } from './persistence.js';

export function isFolderApiAvailable(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: () => unknown }).showDirectoryPicker === 'function';
}

interface ProjectManifest {
  readonly version: number;
  readonly name: string;
  readonly locale: Locale;
  readonly activeDocumentId: string;
  readonly tabs: readonly { id: string; name: string; docFile: string }[];
}

export interface FolderProject {
  readonly name: string;
  readonly locale: Locale;
  readonly activeDocumentId: string;
  readonly library: readonly SavedCircuit[];
  readonly tabs: readonly { id: string; name: string; document: CircuitDocument }[];
}

interface FileSystemDirHandle {
  readonly name: string;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<FileSystemDirHandle>;
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirHandle>;
}
interface FileSystemFileHandle {
  readonly kind: 'file';
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}
interface FileSystemWritableFileStream {
  write(data: string | ArrayBuffer | Blob): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    showDirectoryPicker?: (opts?: {
      mode?: 'read' | 'readwrite';
    }) => Promise<FileSystemDirHandle>;
  }
}

/* ------------------------------ Save ----------------------------- */

export async function saveProjectToFolder(
  project: FolderProject,
  options: { name?: string } = {},
): Promise<{ folderName: string }> {
  if (!window.showDirectoryPicker) {
    throw new Error('Folder save is unsupported in this browser.');
  }
  const root = await window.showDirectoryPicker({ mode: 'readwrite' });
  const docsDir = await root.getDirectoryHandle('docs', { create: true });

  const manifestTabs: ProjectManifest['tabs'] = project.tabs.map((t) => ({
    id: t.id,
    name: t.name,
    docFile: `docs/doc_${t.id}.gcraft.json`,
  }));

  // Write each document file.
  for (const t of project.tabs) {
    const fname = `doc_${t.id}.gcraft.json`;
    await writeJSON(docsDir, fname, t.document);
  }

  // Library.
  await writeJSON(root, 'library.json', project.library);

  // Manifest.
  const manifest: ProjectManifest = {
    version: FORMAT_VERSION,
    name: options.name ?? project.name ?? 'Untitled',
    locale: project.locale,
    activeDocumentId: project.activeDocumentId,
    tabs: manifestTabs,
  };
  await writeJSON(root, 'project.json', manifest);

  return { folderName: root.name };
}

async function writeJSON(
  dir: FileSystemDirHandle,
  name: string,
  data: unknown,
): Promise<void> {
  const fh = await dir.getFileHandle(name, { create: true });
  const writable = await fh.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

/* ------------------------------ Load ----------------------------- */

export async function loadProjectFromFolder(): Promise<FolderProject> {
  if (!window.showDirectoryPicker) {
    throw new Error('Folder open is unsupported in this browser.');
  }
  const root = await window.showDirectoryPicker({ mode: 'read' });
  const manifest = (await readJSON(root, 'project.json')) as ProjectManifest;
  if (manifest.version !== FORMAT_VERSION) {
    throw new Error(
      `project.json version ${manifest.version} not supported (expected v${FORMAT_VERSION})`,
    );
  }
  const library = (await readJSON(root, 'library.json').catch(() => [])) as SavedCircuit[];
  const docsDir = await root.getDirectoryHandle('docs');
  const tabs: { id: string; name: string; document: CircuitDocument }[] = [];
  for (const t of manifest.tabs) {
    const fname = t.docFile.replace(/^docs\//, '');
    const doc = (await readJSON(docsDir, fname)) as CircuitDocument;
    tabs.push({ id: t.id, name: t.name, document: doc });
  }
  return {
    name: manifest.name,
    locale: manifest.locale,
    activeDocumentId: manifest.activeDocumentId,
    library,
    tabs,
  };
}

async function readJSON(dir: FileSystemDirHandle, name: string): Promise<unknown> {
  const fh = await dir.getFileHandle(name);
  const file = await fh.getFile();
  const text = await file.text();
  return JSON.parse(text);
}
