/**
 * LLM bridge — optional remote AI assist. Disabled by default; the user
 * has to set `endpoint` + `token` in localStorage (`gatecraft:llm:v1`).
 *
 * The bridge wraps an Ollama-compatible `/api/chat` endpoint behind a
 * shared bearer token. Errors are caught and returned as a structured
 * `AskResult` so the UI can fall back to the rule-based assistant
 * without crashing.
 *
 * The bridge ships zero PII off the device beyond what the user types
 * into the prompt. We do NOT auto-include the circuit document — the
 * caller controls payload contents.
 */

const STORAGE_KEY = 'gatecraft:llm:v1';

export interface LlmConfig {
  readonly endpoint: string;
  readonly token: string;
  readonly model: string;
}

export type AskResult =
  | { kind: 'ok'; content: string }
  | { kind: 'disabled' }
  | { kind: 'error'; message: string };

export function readLlmConfig(): LlmConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LlmConfig>;
    if (
      typeof parsed.endpoint === 'string' &&
      parsed.endpoint &&
      typeof parsed.token === 'string' &&
      parsed.token &&
      typeof parsed.model === 'string' &&
      parsed.model
    ) {
      return { endpoint: parsed.endpoint, token: parsed.token, model: parsed.model };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeLlmConfig(config: LlmConfig | null): void {
  try {
    if (!config) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* quota / privacy mode — ignore */
  }
}

export function isLlmEnabled(): boolean {
  return readLlmConfig() !== null;
}

/**
 * Send a single user prompt to the configured endpoint. The prompt is
 * already augmented with whatever context the caller wants — we never
 * inspect or modify it here.
 *
 * The endpoint is expected to be Ollama-compatible (path: /api/chat).
 */
export async function askLlm(prompt: string, system?: string): Promise<AskResult> {
  const config = readLlmConfig();
  if (!config) return { kind: 'disabled' };
  const messages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    { role: 'user', content: prompt },
  ];
  try {
    const res = await fetch(`${config.endpoint.replace(/\/+$/, '')}/api/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: false,
      }),
    });
    if (!res.ok) {
      return { kind: 'error', message: `LLM returned ${res.status}` };
    }
    const json = (await res.json()) as { message?: { content?: string }; response?: string };
    const content = json.message?.content ?? json.response ?? '';
    return { kind: 'ok', content };
  } catch (e) {
    return { kind: 'error', message: (e as Error).message };
  }
}
