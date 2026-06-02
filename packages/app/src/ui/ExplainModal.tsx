/**
 * Pop-up "explain this circuit" modal.
 *
 * Two modes:
 *   - **No selection** → whole-circuit explain. Summarises the doc
 *     and asks the LLM (or falls back to a rule-based heading +
 *     analysis dump).
 *   - **Single component selected** → focused explain. Sends the
 *     component + a 1-hop neighbourhood as prompt context.
 *
 * If the LLM is not configured, we still show something useful: the
 * concept card from the existing assistant rules (for single
 * selection) or a one-paragraph summary derived from the static
 * `circuit-analysis` (for whole-circuit).
 */

import { useEffect, useState } from 'react';
import { isLlmEnabled, askLlm } from '../assistant/llm-bridge.js';
import { t } from '../i18n/index.js';
import { analyzeCircuit } from '../model/circuit-analysis.js';
import type { VisualComponent } from '../model/document.js';
import { helpForKind } from '../model/kind-help.js';
import { useAppStore } from '../model/store.js';
import { ModalCloseButton } from './ModalCloseButton.js';

interface OpenDetail {
  componentId?: string;
}

export function ExplainModal(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState<string>('');
  const [source, setSource] = useState<'llm' | 'rule' | 'none'>('none');

  useEffect(() => {
    const onOpen = (ev: Event): void => {
      const detail = (ev as CustomEvent<OpenDetail>).detail ?? {};
      setOpen(true);
      setBusy(true);
      setContent('');
      void run(detail.componentId).then((res) => {
        setContent(res.text);
        setSource(res.source);
        setBusy(false);
      });
    };
    window.addEventListener('gatecraft:explain', onOpen);
    const esc = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('gatecraft:explain', onOpen);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="gc-fade-in"
      onClick={() => setOpen(false)}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(7, 9, 12, 0.7)',
        backdropFilter: 'blur(3px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="gc-modal-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: 'min(560px, 92vw)',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: '#0f1115',
          border: '1px solid #2a3548',
          borderRadius: 12,
          padding: 22,
          color: '#e6e6e6',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <ModalCloseButton onClick={() => setOpen(false)} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>
            ✦ {t('explain.title')}
          </div>
          <div style={{ fontSize: 11, color: '#7c8696', marginTop: 4 }}>
            {source === 'llm'
              ? t('explain.viaLlm')
              : source === 'rule'
                ? t('explain.viaRule')
                : ''}
          </div>
        </div>
        {busy ? (
          <div style={{ fontSize: 13, color: '#9aa4b2', fontStyle: 'italic' }}>
            {t('explain.thinking')}
          </div>
        ) : (
          <pre
            style={{
              fontSize: 13,
              color: '#dde4ef',
              background: '#0c1018',
              border: '1px solid #1f2632',
              borderRadius: 6,
              padding: 12,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              lineHeight: 1.6,
            }}
          >
            {content}
          </pre>
        )}
        {!isLlmEnabled() ? (
          <button
            onClick={() => window.dispatchEvent(new Event('gatecraft:open-llm-settings'))}
            style={{
              background: 'transparent',
              border: '1px solid #2a3548',
              color: '#7ea7d7',
              borderRadius: 5,
              padding: '6px 12px',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 12,
              alignSelf: 'flex-start',
            }}
          >
            {t('explain.configureLlm')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

async function run(
  componentId: string | undefined,
): Promise<{ text: string; source: 'llm' | 'rule' }> {
  const state = useAppStore.getState();
  const doc = state.document;
  const library = state.library;

  // Build the prompt context. For a selected component, include the
  // component itself + every directly-wired neighbour (so the LLM sees
  // its inputs and downstream sinks).
  let context: string;
  let prompt: string;
  if (componentId) {
    const comp = doc.components.find((c) => c.id === componentId);
    if (!comp) {
      return {
        text: 'Selected component is no longer in the document.',
        source: 'rule',
      };
    }
    const neighbours = directlyWired(componentId, doc);
    context = [
      'You are an expert digital-logic tutor. Explain in 3–5 short sentences.',
      `Selected component: kind=${comp.kind}, name=${describe(comp)}.`,
      `Direct neighbours (${neighbours.length}): ${neighbours.map((n) => `${n.kind}:${describe(n)}`).join(', ')}.`,
    ].join('\n');
    prompt = `What is the role of the ${comp.kind} component in this circuit?`;
  } else {
    const analysis = analyzeCircuit(doc, library);
    context = [
      'You are an expert digital-logic tutor. Explain the circuit in 3–5 short sentences.',
      `Components: ${analysis.componentCount} total — by kind: ${Object.entries(analysis.byKind).map(([k, v]) => `${k}×${v}`).join(', ')}.`,
      `Inputs: ${analysis.inputs.map((p) => p.name).join(', ') || '(none)'}. Outputs: ${analysis.outputs.map((p) => p.name).join(', ') || '(none)'}.`,
      `Sequential: ${analysis.isSequential ? 'yes' : 'no'}. Critical-path depth: ${analysis.criticalPathDepth}.`,
    ].join('\n');
    prompt = 'What does this circuit do?';
  }

  if (isLlmEnabled()) {
    const res = await askLlm(prompt, context);
    if (res.kind === 'ok' && res.content.trim()) {
      return { text: res.content.trim(), source: 'llm' };
    }
  }
  // Fallback: rule-based summary.
  if (componentId) {
    const comp = doc.components.find((c) => c.id === componentId);
    if (!comp) return { text: 'Selected component missing.', source: 'rule' };
    const help = helpForKind(comp.kind);
    const text = help
      ? `${help.title} — ${help.description}\n\n${(help.cheats ?? []).map((c) => `• ${c}`).join('\n')}`
      : `${comp.kind} (no rule-based help yet). Hook up an LLM under "AI provider…" for a richer answer.`;
    return { text, source: 'rule' };
  }
  const analysis = analyzeCircuit(doc, library);
  const parts: string[] = [];
  parts.push(
    `This circuit has ${analysis.componentCount} components (${Object.entries(analysis.byKind).map(([k, v]) => `${k}×${v}`).join(', ')}).`,
  );
  if (analysis.inputs.length > 0) {
    parts.push(
      `Top-level inputs: ${analysis.inputs.map((p) => `${p.name} [${p.width}b]`).join(', ')}.`,
    );
  }
  if (analysis.outputs.length > 0) {
    parts.push(
      `Top-level outputs: ${analysis.outputs.map((p) => `${p.name} [${p.width}b]`).join(', ')}.`,
    );
  }
  parts.push(
    analysis.isSequential
      ? `It's sequential — outputs depend on history (registers / flip-flops present).`
      : `It's combinational — outputs depend only on the current inputs.`,
  );
  parts.push(`Longest gate chain: ${analysis.criticalPathDepth} levels.`);
  parts.push(
    'Hook up an LLM under "AI provider…" (toolbar overflow) to get a richer English explanation of what this circuit does.',
  );
  return { text: parts.join('\n\n'), source: 'rule' };
}

function directlyWired(
  componentId: string,
  doc: { components: readonly VisualComponent[]; wires: readonly { endpoints: readonly { componentId: string; portName: string }[] }[] },
): VisualComponent[] {
  const neighbourIds = new Set<string>();
  for (const w of doc.wires) {
    const a = w.endpoints[0];
    const b = w.endpoints[1];
    if (!a || !b) continue;
    if (a.componentId === componentId) neighbourIds.add(String(b.componentId));
    else if (b.componentId === componentId) neighbourIds.add(String(a.componentId));
  }
  return doc.components.filter((c) => neighbourIds.has(String(c.id)));
}

function describe(c: VisualComponent): string {
  const name = c.params['name'];
  if (typeof name === 'string' && name) return name;
  return c.id.slice(0, 6);
}
