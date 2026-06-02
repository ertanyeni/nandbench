/**
 * Cloud client unit tests. The client is a thin fetch wrapper, so these
 * verify the wire format (URL, method, headers, body) and the
 * edit-token / cookie plumbing — not server behaviour.
 *
 * `fetch` is mocked per test; localStorage is reset between tests.
 */

// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  claimCircuit,
  createCircuit,
  deleteCircuit,
  forgetEditToken,
  getCircuit,
  getEditToken,
  logout,
  me,
  myCircuits,
  patchCircuit,
  rememberEditToken,
  requestMagicLink,
  type CloudDoc,
} from '../src/model/cloud-client.js';

const SAMPLE_DOC: CloudDoc = {
  version: 3,
  project: { name: 'X', activeDocumentId: 'a', tabs: [] },
  library: [],
  locale: 'en',
};

function mockFetch(responses: { status?: number; json?: unknown }[]): ReturnType<typeof vi.fn> {
  let i = 0;
  const fn = vi.fn(async (): Promise<Response> => {
    const r = responses[i++] ?? { status: 200, json: {} };
    return new Response(JSON.stringify(r.json ?? {}), {
      status: r.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createCircuit', () => {
  it('POSTs /circuits with name + doc + public, persists editToken', async () => {
    const f = mockFetch([{ json: { id: 'cid-1', editToken: 'tok-1' } }]);
    const out = await createCircuit({ name: 'My', doc: SAMPLE_DOC, isPublic: false });
    expect(out).toEqual({ id: 'cid-1', editToken: 'tok-1' });
    expect(f).toHaveBeenCalledOnce();
    const [url, init] = f.mock.calls[0]!;
    expect(String(url)).toMatch(/\/circuits$/);
    expect(init?.method).toBe('POST');
    const body = JSON.parse(init?.body as string) as { name: string; public: boolean };
    expect(body.name).toBe('My');
    expect(body.public).toBe(false);
    expect(getEditToken('cid-1')).toBe('tok-1');
  });

  it('throws on non-OK response', async () => {
    mockFetch([{ status: 500, json: {} }]);
    await expect(createCircuit({ name: 'X', doc: SAMPLE_DOC })).rejects.toThrow();
  });
});

describe('getCircuit', () => {
  it('attaches X-Edit-Token header when one is stored', async () => {
    rememberEditToken('cid-2', 'tok-2');
    const f = mockFetch([
      {
        json: {
          id: 'cid-2',
          name: 'X',
          doc: SAMPLE_DOC,
          public: false,
          ownerEmail: null,
          canEdit: true,
          createdAt: '',
          updatedAt: '',
        },
      },
    ]);
    const c = await getCircuit('cid-2');
    expect(c.id).toBe('cid-2');
    const [, init] = f.mock.calls[0]!;
    const headers = init?.headers as Record<string, string>;
    expect(headers['X-Edit-Token']).toBe('tok-2');
  });
});

describe('patchCircuit', () => {
  it('PATCHes /circuits/:id with merged fields', async () => {
    rememberEditToken('cid-3', 'tok-3');
    const f = mockFetch([{ json: { ok: true } }]);
    await patchCircuit('cid-3', { name: 'New', doc: SAMPLE_DOC });
    const [url, init] = f.mock.calls[0]!;
    expect(String(url)).toMatch(/\/circuits\/cid-3$/);
    expect(init?.method).toBe('PATCH');
    const body = JSON.parse(init?.body as string) as { name: string; doc: CloudDoc };
    expect(body.name).toBe('New');
    expect(body.doc).toEqual(SAMPLE_DOC);
  });

  it('throws on 403', async () => {
    mockFetch([{ status: 403, json: { error: 'forbidden' } }]);
    await expect(patchCircuit('cid-x', { name: 'N' })).rejects.toThrow();
  });
});

describe('deleteCircuit', () => {
  it('DELETEs and clears the stored edit token', async () => {
    rememberEditToken('cid-4', 'tok-4');
    mockFetch([{ json: { ok: true } }]);
    await deleteCircuit('cid-4');
    expect(getEditToken('cid-4')).toBeNull();
  });
});

describe('auth', () => {
  it('requestMagicLink POSTs /auth/request with email', async () => {
    const f = mockFetch([{ json: { ok: true } }]);
    await requestMagicLink('a@b.com');
    const [url, init] = f.mock.calls[0]!;
    expect(String(url)).toMatch(/\/auth\/request$/);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ email: 'a@b.com' });
  });

  it('me returns null on 401', async () => {
    mockFetch([{ status: 401, json: { error: 'unauth' } }]);
    const out = await me();
    expect(out).toBeNull();
  });

  it('me returns { email } on 200', async () => {
    mockFetch([{ json: { email: 'a@b.com' } }]);
    const out = await me();
    expect(out).toEqual({ email: 'a@b.com' });
  });

  it('logout never throws even on failure', async () => {
    mockFetch([{ status: 500, json: {} }]);
    await expect(logout()).resolves.toBeUndefined();
  });
});

describe('myCircuits + claim', () => {
  it('myCircuits returns the list field', async () => {
    mockFetch([{ json: { circuits: [{ id: 'a', name: 'A', public: false, createdAt: '', updatedAt: '' }] } }]);
    const list = await myCircuits();
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe('a');
  });

  it('claimCircuit POSTs id+editToken', async () => {
    const f = mockFetch([{ json: { ok: true } }]);
    await claimCircuit('cid', 'tok');
    const [url, init] = f.mock.calls[0]!;
    expect(String(url)).toMatch(/\/me\/claim$/);
    expect(JSON.parse(init?.body as string)).toEqual({ id: 'cid', editToken: 'tok' });
  });
});

describe('edit-token persistence helpers', () => {
  it('remember / get / forget round-trip', () => {
    expect(getEditToken('x')).toBeNull();
    rememberEditToken('x', 't');
    expect(getEditToken('x')).toBe('t');
    forgetEditToken('x');
    expect(getEditToken('x')).toBeNull();
  });
});
