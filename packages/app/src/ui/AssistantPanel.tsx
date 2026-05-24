import { useEffect, useMemo, useState } from 'react';
import type { ComponentId, ComponentParams } from '@gatecraft/engine';
import { evaluateAssistant, type AssistantAction, type AssistantResponse } from '../assistant/index.js';
import { askLlm, isLlmEnabled } from '../assistant/llm-bridge.js';
import { TEMPLATES } from '../fixtures/templates.js';
import { t } from '../i18n/index.js';
import { useAppStore } from '../model/store.js';

/**
 * Right-side slide-in assistant panel. Opens via Toolbar event
 * (`gatecraft:open-assistant`). Subscribes to enough store slices to
 * rebuild the assistant context on every relevant change. Each response
 * is rendered as an expandable card grouped by category.
 */
const SECTION_ORDER: readonly AssistantResponse['category'][] = [
  'onboarding',
  'nextStep',
  'diagnostic',
  'pattern',
  'concept',
  'quality',
];

const PANEL_WIDTH_KEY = 'gatecraft:assistant-width';
const MIN_WIDTH = 320;
const MAX_WIDTH = 720;

function readSavedWidth(): number {
  try {
    const raw = localStorage.getItem(PANEL_WIDTH_KEY);
    const n = raw ? Number(raw) : NaN;
    if (Number.isFinite(n) && n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
  } catch {
    /* ignore */
  }
  return 440;
}

export function AssistantPanel(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [width, setWidth] = useState(readSavedWidth);

  const document = useAppStore((s) => s.document);
  const library = useAppStore((s) => s.library);
  const compileDiags = useAppStore((s) => s.compiled.diagnostics);
  const simDiags = useAppStore((s) => s.simDiagnostics);
  const lastPlacedKind = useAppStore((s) => s.lastPlacedKind);
  const running = useAppStore((s) => s.running);
  const selection = useAppStore((s) => s.selection);
  const locale = useAppStore((s) => s.locale);
  void locale;

  // The assistant panel is strictly opt-in now — the user has to click the
  // toolbar's "asistan" button (or invoke the open-assistant event some
  // other way). No auto-popping on new diagnostics: the toolbar button
  // grows a colored dot instead, so we surface "something new" without
  // ever stealing focus from the canvas.
  useEffect(() => {
    const onOpen = (): void => {
      // Side panels are mutually exclusive — tell siblings to close,
      // then open ourselves. Siblings listen on `gatecraft:close-side-panels`.
      window.dispatchEvent(
        new CustomEvent('gatecraft:close-side-panels', { detail: { except: 'assistant' } }),
      );
      setOpen(true);
    };
    const onCloseSiblings = (ev: Event): void => {
      const except = (ev as CustomEvent<{ except?: string }>).detail?.except;
      if (except !== 'assistant') setOpen(false);
    };
    window.addEventListener('gatecraft:open-assistant', onOpen);
    window.addEventListener('gatecraft:close-side-panels', onCloseSiblings);
    const onKey = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('gatecraft:open-assistant', onOpen);
      window.removeEventListener('gatecraft:close-side-panels', onCloseSiblings);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const evaluation = useMemo(() => {
    return evaluateAssistant({
      document,
      library,
      diagnostics: [...compileDiags, ...simDiags],
      lastPlacedKind,
      running,
      selectedIds: new Set(selection.componentIds),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, library, compileDiags, simDiags, lastPlacedKind, running, selection, locale]);

  if (!open) return null;

  const toggleCard = (id: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const performAction = (a: AssistantAction): void => {
    switch (a.kind) {
      case 'open-template': {
        const tpl = TEMPLATES.find((tt) => tt.id === a.templateId);
        if (!tpl) return;
        if (
          useAppStore.getState().document.components.length > 0 &&
          !window.confirm(t('templates.confirmOverwrite'))
        ) {
          return;
        }
        useAppStore.getState().loadDocument(tpl.build());
        return;
      }
      case 'open-lesson': {
        window.dispatchEvent(new Event('gatecraft:open-lessons'));
        return;
      }
      case 'open-lessons':
        window.dispatchEvent(new Event('gatecraft:open-lessons'));
        return;
      case 'open-glossary':
        window.dispatchEvent(new Event('gatecraft:open-glossary'));
        return;
      case 'open-tour':
        window.dispatchEvent(new Event('gatecraft:open-tour'));
        return;
      case 'place-kind': {
        // Enter "place" tool for the given kind with empty params — the
        // user then clicks on the canvas to drop it.
        useAppStore.getState().setTool({
          type: 'place',
          kind: a.componentKind,
          params: defaultParamsFor(a.componentKind),
          ghostWorld: null,
        });
        return;
      }
      case 'select': {
        useAppStore.getState().setSelection([a.componentId as ComponentId]);
        return;
      }
    }
  };

  return (
    <div
      className="gc-fade-in"
      style={{
        // Wrapper anchors the slide-in but leaves clicks falling through
        // to the canvas — the assistant is informational, not modal.
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 110,
        display: 'flex',
        pointerEvents: 'none',
      }}
    >
      <div
        className="gc-slide-right"
        role="complementary"
        aria-label={t('assistant.title')}
        style={{
          width: Math.min(width, window.innerWidth * 0.92),
          height: '100%',
          background: '#0f1115',
          borderLeft: '1px solid #2a3548',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 32px rgba(0,0,0,0.5)',
          position: 'relative',
          pointerEvents: 'auto',
        }}
      >
        <ResizeHandle
          onResize={(dx) => {
            setWidth((w) => {
              const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w - dx));
              try {
                localStorage.setItem(PANEL_WIDTH_KEY, String(next));
              } catch {
                /* ignore */
              }
              return next;
            });
          }}
        />
        <div
          style={{
            padding: '14px 16px 12px',
            borderBottom: '1px solid #1f2632',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e6e6e6' }}>
              {t('assistant.title')}
            </div>
            <div style={{ fontSize: 11, color: '#9aa4b2', marginTop: 4, lineHeight: 1.5 }}>
              {t('assistant.subtitle')}
            </div>
            <div style={{ fontSize: 10, color: '#7c8696', marginTop: 6 }}>
              {document.components.length} components · {document.wires.length} wires ·{' '}
              {compileDiags.length + simDiags.length} diagnostics
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label={t('assistant.close')}
            title={t('assistant.close')}
            style={{
              background: 'transparent',
              border: '1px solid #2a3548',
              color: '#9aa4b2',
              borderRadius: 5,
              padding: '3px 8px',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 13,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '6px 4px 16px' }}>
          {evaluation.responses.length === 0 ? (
            <div style={{ padding: '20px 16px', color: '#7c8696', fontSize: 12 }}>
              {t('assistant.empty')}
            </div>
          ) : (
            SECTION_ORDER.map((category) => {
              const cards = evaluation.byCategory.get(category) ?? [];
              if (cards.length === 0) return null;
              return (
                <div key={category} style={{ marginTop: 10 }}>
                  <div
                    style={{
                      padding: '10px 14px 6px',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.9,
                      color: '#dde4ef',
                      fontWeight: 800,
                      borderTop: '1px solid #1c2230',
                      marginTop: 4,
                    }}
                  >
                    {t(`assistant.section.${category}`)}
                  </div>
                  {cards.map((card) => (
                    <Card
                      key={card.id}
                      card={card}
                      open={expanded.has(card.id)}
                      onToggle={() => toggleCard(card.id)}
                      onAction={performAction}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function Card({
  card,
  open,
  onToggle,
  onAction,
}: {
  card: AssistantResponse;
  open: boolean;
  onToggle: () => void;
  onAction: (a: AssistantAction) => void;
}): JSX.Element {
  return (
    <div
      className="gc-slide-up gc-hover-lift"
      style={{
        position: 'relative',
        margin: '4px 8px',
        padding: '12px 14px 12px 18px',
        background: '#161b25',
        border: '1px solid #1f2632',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: severityColor(card.category),
        }}
      />
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: '#e6e6e6',
          font: 'inherit',
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'left',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>{card.title}</span>
        <span style={{ color: '#7c8696', fontSize: 10 }}>{open ? '▾' : '▸'}</span>
      </button>
      {card.tags && card.tags.length > 0 ? (
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          {card.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: '#a8b4c7',
                background: '#0f1115',
                border: '1px solid #2a3548',
                borderRadius: 3,
                padding: '2px 6px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {open ? (
        <>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#cbd5e1',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {card.body}
          </div>
          {card.actions && card.actions.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {card.actions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => onAction(a)}
                  style={{
                    background: '#1f3a66',
                    border: '1px solid #3b6ec3',
                    color: '#e6e6e6',
                    borderRadius: 5,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          ) : null}
          <AskLlmRow card={card} />
        </>
      ) : null}
    </div>
  );
}

/**
 * Per-card "ask the LLM about this" footer. Only renders if the user has
 * configured a self-hosted LLM endpoint. The prompt bundles the card's
 * own body so the model has the educational context to expand from.
 */
function AskLlmRow({ card }: { card: AssistantResponse }): JSX.Element | null {
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (!isLlmEnabled()) return null;
  const ask = async (): Promise<void> => {
    setLoading(true);
    setReply(null);
    try {
      const r = await askLlm(
        `Context (from rule-based assistant):\n${card.title}\n${card.body}\n\nExplain this for a beginner, in 3-4 sentences, plain language.`,
        'You are a friendly digital-logic tutor. Keep replies short and practical.',
      );
      if (r.kind === 'ok') setReply(r.content);
      else if (r.kind === 'error') setReply(`(LLM error: ${r.message})`);
      else setReply('(LLM not configured)');
    } catch (e) {
      setReply(`(LLM error: ${(e as Error).message})`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #1f2632' }}>
      <button
        onClick={() => void ask()}
        disabled={loading}
        style={{
          background: 'transparent',
          border: '1px solid #4b3a66',
          color: '#cbb8e8',
          borderRadius: 5,
          padding: '3px 8px',
          font: 'inherit',
          fontSize: 10,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? t('assistant.action.askLlmLoading') : t('assistant.action.askLlm')}
      </button>
      {reply ? (
        <div
          style={{
            marginTop: 8,
            padding: '8px 10px',
            background: '#13101c',
            border: '1px solid #4b3a66',
            borderRadius: 6,
            fontSize: 11,
            color: '#dbcaf2',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
          }}
        >
          {reply}
        </div>
      ) : null}
    </div>
  );
}

function ResizeHandle({ onResize }: { onResize: (dx: number) => void }): JSX.Element {
  return (
    <div
      onPointerDown={(ev) => {
        ev.preventDefault();
        const startX = ev.clientX;
        let lastX = startX;
        const onMove = (e: PointerEvent): void => {
          const dx = e.clientX - lastX;
          lastX = e.clientX;
          onResize(dx);
        };
        const onUp = (): void => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: -2,
        width: 6,
        height: '100%',
        cursor: 'ew-resize',
        zIndex: 2,
      }}
    />
  );
}

function severityColor(category: AssistantResponse['category']): string {
  switch (category) {
    case 'diagnostic':
      return '#ef4444';
    case 'quality':
      return '#facc15';
    case 'pattern':
      return '#a855f7';
    case 'concept':
      return '#60a5fa';
    case 'nextStep':
      return '#3b82f6';
    case 'onboarding':
      return '#22c55e';
  }
}

function defaultParamsFor(kind: string): ComponentParams {
  // Small lookup for the place-kind action — the more permanent home for
  // these defaults is `param-schema.ts withDefaults()`, but the assistant
  // can prime a sensible starting set up front.
  switch (kind) {
    case 'and':
    case 'or':
    case 'not':
    case 'nand':
    case 'nor':
    case 'xor':
    case 'xnor':
    case 'buffer':
      return { width: 1, inputs: 2 };
    case 'input':
    case 'output':
    case 'led':
    case 'button':
    case 'probe':
      return { width: 1 };
    case 'constant':
      return { width: 1, value: '1' };
    case 'tunnel':
      return { width: 1, label: 'X' };
    case 'splitter':
      return { width: 4, fanout: 4 };
    case 'register':
      return { width: 1 };
    case 'controlled-buffer':
    case 'controlled-inverter':
      return { width: 1 };
    case '7seg':
      return {};
    default:
      return {};
  }
}
