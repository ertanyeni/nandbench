/**
 * Cloud API client — thin fetch wrapper around the gatecraft API.
 *
 * The API base is picked from `VITE_GATECRAFT_API` at build time, falling
 * back to `http://localhost:4555` for local dev. All calls include
 * `credentials: 'include'` so the session cookie travels round-trip.
 *
 * Anonymous saves return an `editToken` that the client persists in
 * localStorage (keyed by circuit id), so a returning anonymous browser
 * can still PATCH/DELETE its own circuit without an account.
 */

import { FORMAT_VERSION, type PersistedProject } from './persistence.js';
import type { SavedCircuit } from './library.js';
import type { Locale } from '../i18n/index.js';

const API_BASE =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import.meta as any).env?.VITE_GATECRAFT_API ?? 'http://localhost:4555';

const EDIT_TOKEN_PREFIX = 'gatecraft:editToken:';

export interface CloudDoc {
  version: number;
  project: PersistedProject;
  library: readonly SavedCircuit[];
  locale: Locale;
}

export interface CloudCircuitSummary {
  id: string;
  name: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CloudCircuitDetail extends CloudCircuitSummary {
  doc: CloudDoc;
  ownerEmail: string | null;
  canEdit: boolean;
}

/* ------------------------------ create ------------------------------ */

export async function createCircuit(input: {
  name: string;
  doc: CloudDoc;
  isPublic?: boolean;
}): Promise<{ id: string; editToken: string }> {
  const r = await fetch(`${API_BASE}/circuits`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: input.name, doc: input.doc, public: input.isPublic ?? false }),
  });
  if (!r.ok) throw new Error(`createCircuit failed: ${r.status}`);
  const out = (await r.json()) as { id: string; editToken: string };
  rememberEditToken(out.id, out.editToken);
  return out;
}

/* ------------------------------- read ------------------------------- */

export async function getCircuit(id: string): Promise<CloudCircuitDetail> {
  const r = await fetch(`${API_BASE}/circuits/${id}`, {
    credentials: 'include',
    headers: editTokenHeader(id),
  });
  if (!r.ok) throw new Error(`getCircuit failed: ${r.status}`);
  const out = (await r.json()) as {
    id: string;
    name: string;
    doc: CloudDoc;
    public: boolean;
    ownerEmail: string | null;
    canEdit: boolean;
    createdAt: string;
    updatedAt: string;
  };
  // Backfill version field on the doc in case the server stored an
  // older shape.
  if (!out.doc.version) out.doc.version = FORMAT_VERSION;
  return out;
}

/* ------------------------------ update ------------------------------ */

export async function patchCircuit(
  id: string,
  patch: { name?: string; doc?: CloudDoc; isPublic?: boolean },
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.doc !== undefined) body.doc = patch.doc;
  if (patch.isPublic !== undefined) body.public = patch.isPublic;
  const r = await fetch(`${API_BASE}/circuits/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...editTokenHeader(id) },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`patchCircuit failed: ${r.status}`);
}

export async function deleteCircuit(id: string): Promise<void> {
  const r = await fetch(`${API_BASE}/circuits/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: editTokenHeader(id),
  });
  if (!r.ok) throw new Error(`deleteCircuit failed: ${r.status}`);
  forgetEditToken(id);
}

/* ------------------------------- auth ------------------------------- */

export async function requestMagicLink(email: string): Promise<void> {
  const r = await fetch(`${API_BASE}/auth/request`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!r.ok) throw new Error(`requestMagicLink failed: ${r.status}`);
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}

export async function me(): Promise<{ email: string } | null> {
  const r = await fetch(`${API_BASE}/me`, { credentials: 'include' });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(`me failed: ${r.status}`);
  return (await r.json()) as { email: string };
}

export async function myCircuits(): Promise<readonly CloudCircuitSummary[]> {
  const r = await fetch(`${API_BASE}/me/circuits`, { credentials: 'include' });
  if (!r.ok) throw new Error(`myCircuits failed: ${r.status}`);
  const out = (await r.json()) as { circuits: CloudCircuitSummary[] };
  return out.circuits;
}

export async function claimCircuit(id: string, editToken: string): Promise<void> {
  const r = await fetch(`${API_BASE}/me/claim`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, editToken }),
  });
  if (!r.ok) throw new Error(`claimCircuit failed: ${r.status}`);
}

/* --------------------- edit-token persistence ----------------------- */

export function getEditToken(id: string): string | null {
  return localStorage.getItem(EDIT_TOKEN_PREFIX + id);
}

export function rememberEditToken(id: string, token: string): void {
  localStorage.setItem(EDIT_TOKEN_PREFIX + id, token);
}

export function forgetEditToken(id: string): void {
  localStorage.removeItem(EDIT_TOKEN_PREFIX + id);
}

function editTokenHeader(id: string): Record<string, string> {
  const t = getEditToken(id);
  return t ? { 'X-Edit-Token': t } : {};
}

/* ----------------------------- helpers ------------------------------ */

export const API_BASE_URL = API_BASE;
