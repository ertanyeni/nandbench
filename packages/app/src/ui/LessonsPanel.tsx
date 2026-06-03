import { useEffect, useMemo, useRef, useState } from 'react';
import {
  markLessonCompleted,
  markLessonOpened,
  readCurriculum,
  unmarkLessonCompleted,
} from '../curriculum.js';
import { TEMPLATES } from '../fixtures/templates.js';
import { t } from '../i18n/index.js';
import { LESSONS, UNIT_ORDER, type Lesson, type LessonUnit } from '../lessons.js';
import { useAppStore } from '../model/store.js';
import { BrandMark } from './BrandLogo.js';
import { ChallengePanel } from './ChallengePanel.js';
import { LessonFigure } from './LessonFigure.js';
import { LessonPreview } from './LessonPreview.js';
import { SURFACE } from './palette-tokens.js';

/**
 * Full-screen lessons "route". When open, it overlays the entire editor
 * body (between the activity bar and status bar) — it is not a modal.
 *
 * Layout:
 *   [ left nav (units → lessons) | step reader | right split (Sample / Workspace) ]
 *
 * The right split's tab strip mimics VSCode editor groups: the first
 * tab is a read-only canvas snapshot of the lesson's template; the
 * second is a CTA that loads that template into the live editor and
 * closes the lessons route so the user can experiment.
 */
export function LessonsPanel(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [rightTab, setRightTab] = useState<'sample' | 'workspace'>('sample');
  const locale = useAppStore((s) => s.locale);
  const loadDocument = useAppStore((s) => s.loadDocument);
  void locale;

  useEffect(() => {
    const handler = (): void => setOpen(true);
    window.addEventListener('nandbench:open-lessons', handler);
    const esc = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('nandbench:open-lessons', handler);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  const active = LESSONS[activeIdx]!;
  const tpl = active.templateId
    ? TEMPLATES.find((tt) => tt.id === active.templateId)
    : undefined;
  // Build the preview doc once per active lesson change. Templates' build()
  // creates fresh ids on each call so memoize to keep the canvas stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previewDoc = useMemo(() => (tpl ? tpl.build() : null), [active.id]);

  useEffect(() => {
    if (open) markLessonOpened(active.id);
  }, [open, active.id]);

  // Bump on toggle so progress UI rerenders.
  const [progressTick, setProgressTick] = useState(0);
  const completedSet = useMemo<ReadonlySet<string>>(
    () => new Set(readCurriculum().completed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, activeIdx, progressTick],
  );
  const openedSet = useMemo<ReadonlySet<string>>(
    () => new Set(readCurriculum().opened),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, activeIdx, progressTick],
  );

  const toggleCompleted = (): void => {
    if (completedSet.has(active.id)) unmarkLessonCompleted(active.id);
    else markLessonCompleted(active.id);
    setProgressTick((n) => n + 1);
    window.dispatchEvent(new Event('nandbench:lesson-progress-changed'));
  };

  // Group lessons by unit for the left nav.
  const grouped = useMemo(() => {
    const out = new Map<LessonUnit, Lesson[]>();
    for (const l of LESSONS) {
      const list = out.get(l.unit) ?? [];
      list.push(l);
      out.set(l.unit, list);
    }
    return out;
  }, []);

  // Auto-scroll active row into view when activeIdx changes.
  const navRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const el = navRef.current?.querySelector(`[data-lesson-id="${active.id}"]`);
    if (el && 'scrollIntoView' in el) {
      (el as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [open, active.id]);

  if (!open) return null;

  const openTpl = (): void => {
    if (!tpl) return;
    if (
      useAppStore.getState().document.components.length > 0 &&
      !window.confirm(t('templates.confirmOverwrite'))
    ) {
      return;
    }
    loadDocument(tpl.build());
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label={t('lessons.title')}
      style={{
        position: 'absolute',
        top: 0,
        left: 44,
        right: 0,
        bottom: 24,
        background: SURFACE.editorBg,
        display: 'grid',
        gridTemplateRows: '44px 1fr',
        gridTemplateColumns: '1fr',
        zIndex: 90,
      }}
    >
      {/* ===== Top bar: brand (→ editor) + breadcrumb + close ===== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '0 16px',
          borderBottom: `1px solid ${SURFACE.borderColor}`,
          background: SURFACE.chromeBg,
        }}
      >
        <button
          onClick={() => setOpen(false)}
          title={t('lessons.backToEditor')}
          aria-label={t('lessons.backToEditor')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            color: '#e6e6e6',
            cursor: 'pointer',
            font: 'inherit',
            padding: '4px 6px',
            borderRadius: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1a1f29';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <BrandMark logoSize={20} fontSize={14} />
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: SURFACE.itemSubText,
            fontSize: 12,
          }}
        >
          <span style={{ color: '#5b6573' }}>/</span>
          <span style={{ color: '#dde4ef', fontWeight: 600 }}>{t('lessons.title')}</span>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setOpen(false)}
          aria-label={t('lessons.backToEditor')}
          title={t('lessons.backToEditor')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: `1px solid ${SURFACE.borderColor}`,
            color: '#cbd5e1',
            borderRadius: 6,
            padding: '5px 10px',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          ⌂ {t('lessons.backToEditor')}
        </button>
        <button
          onClick={() => setOpen(false)}
          aria-label={t('lessons.close')}
          title={`${t('lessons.close')} (Esc)`}
          style={{
            background: 'transparent',
            border: `1px solid ${SURFACE.borderColor}`,
            color: SURFACE.itemSubText,
            borderRadius: 5,
            padding: '3px 9px',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 13,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* ===== Inner: 3-column workspace ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 360px',
          overflow: 'hidden',
        }}
      >
      {/* ===== Left nav: units + lessons ===== */}
      <div
        ref={navRef}
        style={{
          background: SURFACE.sidebarBg,
          borderRight: `1px solid ${SURFACE.borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 14px 10px',
            borderBottom: `1px solid ${SURFACE.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                color: SURFACE.headerSubtext,
                fontWeight: 700,
              }}
            >
              {t('lessons.title')}
            </div>
            <div style={{ fontSize: 11, color: SURFACE.itemSubText, marginTop: 4 }}>
              {completedSet.size} / {LESSONS.length} {t('lessons.completedShort')}
            </div>
            <div
              style={{
                marginTop: 6,
                height: 4,
                background: '#1f2632',
                borderRadius: 2,
                overflow: 'hidden',
              }}
              aria-label="progress"
            >
              <div
                style={{
                  height: '100%',
                  width: `${(completedSet.size / LESSONS.length) * 100}%`,
                  background: '#86efac',
                  transition: 'width 220ms ease-out',
                }}
              />
            </div>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0 16px' }}>
          {UNIT_ORDER.map((unit) => {
            const items = grouped.get(unit) ?? [];
            if (items.length === 0) return null;
            const unitDone = items.every((l) => completedSet.has(l.id));
            return (
              <div key={unit} style={{ marginTop: 8 }}>
                <div
                  style={{
                    padding: '6px 14px',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    color: unitDone ? '#86efac' : '#b5c1d6',
                    fontWeight: 700,
                    borderTop: `1px solid ${SURFACE.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {unitDone ? '✓' : null}
                  <span>{t(`unit.${unit}.name`)}</span>
                </div>
                {items.map((l) => {
                  const i = LESSONS.indexOf(l);
                  return (
                    <LessonRow
                      key={l.id}
                      lesson={l}
                      opened={openedSet.has(l.id)}
                      active={i === activeIdx}
                      completed={completedSet.has(l.id)}
                      onClick={() => setActiveIdx(i)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Middle: lesson reader ===== */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 28px 24px',
          color: '#e6e6e6',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 11, color: SURFACE.headerSubtext, letterSpacing: 0.6 }}>
          {t(`unit.${active.unit}.name`).toUpperCase()}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{t(active.titleKey)}</div>
        <div style={{ fontSize: 13, color: '#9aa4b2', marginTop: 6, lineHeight: 1.5 }}>
          {t(active.summaryKey)}
        </div>
        <LessonFigure lessonId={active.id} />
        <ol
          style={{
            marginTop: 22,
            paddingLeft: 22,
            fontSize: 14,
            color: '#dde4ef',
            lineHeight: 1.7,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {active.stepKeys.map((sk) => (
            <li key={sk}>{t(sk)}</li>
          ))}
        </ol>
        <div style={{ marginTop: 16 }}>
          <ChallengePanel lessonId={active.id} />
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={toggleCompleted}
            style={{
              padding: '8px 14px',
              background: completedSet.has(active.id) ? '#1b2c20' : '#1f3a66',
              border: `1px solid ${completedSet.has(active.id) ? '#3a7a52' : '#3b6ec3'}`,
              color: '#e6e6e6',
              borderRadius: 6,
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {completedSet.has(active.id)
              ? `✓ ${t('lessons.markedDone')}`
              : t('lessons.markDone')}
          </button>
          <div style={{ fontSize: 11, color: '#7c8696' }}>
            {completedSet.has(active.id)
              ? t('lessons.markedDoneHint')
              : t('lessons.markDoneHint')}
          </div>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 18 }}>
          <button
            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
            disabled={activeIdx === 0}
            style={navBtnStyle(activeIdx === 0)}
          >
            ← {t('lessons.previous')}
          </button>
          <button
            onClick={() => setActiveIdx((i) => Math.min(LESSONS.length - 1, i + 1))}
            disabled={activeIdx === LESSONS.length - 1}
            style={navBtnStyle(activeIdx === LESSONS.length - 1)}
          >
            {t('lessons.next')} →
          </button>
        </div>
      </div>

      {/* ===== Right split: Sample / Workspace ===== */}
      <div
        style={{
          background: SURFACE.sidebarBg,
          borderLeft: `1px solid ${SURFACE.borderColor}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          role="tablist"
          style={{
            display: 'flex',
            borderBottom: `1px solid ${SURFACE.borderColor}`,
            background: SURFACE.chromeBg,
          }}
        >
          <RightTab
            label={t('lessons.tab.sample')}
            active={rightTab === 'sample'}
            onClick={() => setRightTab('sample')}
          />
          <RightTab
            label={t('lessons.tab.workspace')}
            active={rightTab === 'workspace'}
            onClick={() => setRightTab('workspace')}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 14,
            overflow: 'hidden',
          }}
        >
          {rightTab === 'sample' ? (
            previewDoc ? (
              <>
                <div
                  style={{
                    fontSize: 11,
                    color: SURFACE.itemSubText,
                    marginBottom: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {t('lessons.sample.hint')}
                </div>
                <LessonPreview doc={previewDoc} width={320} height={210} />
              </>
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: SURFACE.itemSubText,
                  fontStyle: 'italic',
                  padding: 12,
                }}
              >
                {t('lessons.sample.none')}
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  color: SURFACE.itemSubText,
                  lineHeight: 1.5,
                }}
              >
                {t('lessons.workspace.hint')}
              </div>
              {tpl ? (
                <button
                  onClick={openTpl}
                  style={{
                    padding: '10px 14px',
                    background: '#1f3a66',
                    border: '1px solid #3b6ec3',
                    color: '#e6e6e6',
                    borderRadius: 6,
                    cursor: 'pointer',
                    font: 'inherit',
                    fontWeight: 700,
                  }}
                >
                  ▶ {t('lessons.workspace.openCta')}
                </button>
              ) : (
                <div style={{ fontSize: 12, color: SURFACE.itemSubText, fontStyle: 'italic' }}>
                  {t('lessons.workspace.noTemplate')}
                </div>
              )}
              <button
                onClick={() => {
                  loadDocument({ components: [], wires: [] });
                  setOpen(false);
                }}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: `1px solid ${SURFACE.borderColor}`,
                  color: SURFACE.itemText,
                  borderRadius: 6,
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                {t('lessons.workspace.blank')}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function RightTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? SURFACE.editorBg : 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? SURFACE.accent : 'transparent'}`,
        color: active ? SURFACE.itemText : SURFACE.itemSubText,
        font: 'inherit',
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        padding: '8px 10px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function LessonRow({
  lesson,
  active,
  completed,
  opened,
  onClick,
}: {
  lesson: Lesson;
  active: boolean;
  completed: boolean;
  opened: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      data-lesson-id={lesson.id}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        background: active ? SURFACE.itemBgActive : 'transparent',
        border: `1px solid ${active ? SURFACE.itemBorderActive : 'transparent'}`,
        borderLeft: active ? `3px solid ${SURFACE.accent}` : `3px solid transparent`,
        color: SURFACE.itemText,
        padding: '6px 10px',
        cursor: 'pointer',
        font: 'inherit',
        textAlign: 'left',
        width: 'calc(100% - 8px)',
        margin: '2px 4px',
        borderRadius: 4,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = SURFACE.itemBgHover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {completed ? (
          <span style={{ color: '#86efac', fontSize: 11 }} aria-label="completed">
            ✓
          </span>
        ) : opened ? (
          <span
            aria-label="opened"
            title="opened — not marked done yet"
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: '#7ea7d7',
              display: 'inline-block',
              marginRight: 1,
            }}
          />
        ) : null}
        <span style={{ opacity: completed ? 0.7 : 1 }}>{t(lesson.titleKey)}</span>
      </span>
    </button>
  );
}

function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: 'transparent',
    border: `1px solid ${SURFACE.borderColor}`,
    color: disabled ? '#3a4150' : '#cbd5e1',
    borderRadius: 6,
    cursor: disabled ? 'default' : 'pointer',
    font: 'inherit',
    opacity: disabled ? 0.5 : 1,
  };
}
