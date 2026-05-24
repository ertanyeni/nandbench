import { useEffect, useMemo, useState } from 'react';
import { markLessonOpened, readCurriculum } from '../curriculum.js';
import { TEMPLATES } from '../fixtures/templates.js';
import { t } from '../i18n/index.js';
import { LESSONS, type Lesson } from '../lessons.js';
import { useAppStore } from '../model/store.js';
import { ChallengePanel } from './ChallengePanel.js';
import { LessonPreview } from './LessonPreview.js';
import { ModalCloseButton } from './ModalCloseButton.js';

/**
 * Side-by-side lesson reader. Opened via Toolbar's "lessons" button (which
 * dispatches a window event). Left rail lists every lesson; right pane
 * shows the selected lesson's steps plus an "Open the template" jump.
 */
export function LessonsPanel(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const locale = useAppStore((s) => s.locale);
  const loadDocument = useAppStore((s) => s.loadDocument);
  void locale;

  useEffect(() => {
    const handler = (): void => setOpen(true);
    window.addEventListener('gatecraft:open-lessons', handler);
    const esc = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('gatecraft:open-lessons', handler);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  // Hooks must run on every render — keep them above any early returns.
  const active = LESSONS[activeIdx]!;
  const tpl = active.templateId
    ? TEMPLATES.find((tt) => tt.id === active.templateId)
    : undefined;
  // Build the preview doc once per active lesson change. Templates' build()
  // creates fresh ids on each call so we memoize to keep the canvas stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previewDoc = useMemo(() => (tpl ? tpl.build() : null), [active.id]);

  // Record an "opened" marker the first time the user navigates into a lesson.
  useEffect(() => {
    if (open) markLessonOpened(active.id);
  }, [open, active.id]);

  // Re-read completion progress whenever the panel reopens so a fresh
  // challenge pass shows up immediately.
  const completedSet = useMemo<ReadonlySet<string>>(
    () => new Set(readCurriculum().completed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, activeIdx],
  );

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
      className="gc-fade-in"
      onClick={() => setOpen(false)}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(7, 9, 12, 0.7)',
        backdropFilter: 'blur(2px)',
        zIndex: 100,
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
          width: 'min(900px, 92vw)',
          height: 'min(560px, 80vh)',
          background: '#0f1115',
          border: '1px solid #1f2632',
          borderRadius: 12,
          display: 'flex',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}
      >
        <ModalCloseButton onClick={() => setOpen(false)} />
        {/* Left rail */}
        <div
          style={{
            width: 260,
            background: '#0c1018',
            borderRight: '1px solid #1f2632',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #1f2632' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e6e6e6' }}>
              {t('lessons.title')}
            </div>
            <div style={{ fontSize: 11, color: '#9aa4b2', marginTop: 4, lineHeight: 1.5 }}>
              {t('lessons.subtitle')}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '6px 6px 12px' }}>
            {LESSONS.map((l, i) => (
              <LessonRow
                key={l.id}
                lesson={l}
                active={i === activeIdx}
                completed={completedSet.has(l.id)}
                onClick={() => setActiveIdx(i)}
              />
            ))}
          </div>
        </div>

        {/* Right pane */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 22,
            color: '#e6e6e6',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>{t(active.titleKey)}</div>
          <div style={{ fontSize: 12, color: '#9aa4b2', marginTop: 6, lineHeight: 1.5 }}>
            {t(active.summaryKey)}
          </div>
          <ol
            style={{
              marginTop: 18,
              paddingLeft: 22,
              fontSize: 13,
              color: '#cbd5e1',
              lineHeight: 1.7,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {active.stepKeys.map((sk) => (
              <li key={sk}>{t(sk)}</li>
            ))}
          </ol>
          {previewDoc ? (
            <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
              <LessonPreview doc={previewDoc} width={260} height={130} onClick={openTpl} />
              <ChallengePanel lessonId={active.id} />
            </div>
          ) : (
            <ChallengePanel lessonId={active.id} />
          )}
          <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 16 }}>
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
            {tpl ? (
              <button
                onClick={openTpl}
                style={{
                  marginLeft: 'auto',
                  padding: '8px 14px',
                  background: '#1f3a66',
                  border: '1px solid #3b6ec3',
                  color: '#e6e6e6',
                  borderRadius: 6,
                  cursor: 'pointer',
                  font: 'inherit',
                  fontWeight: 600,
                }}
              >
                ▶ {t('lessons.openTemplate')}
              </button>
            ) : null}
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid #1f2632',
                color: '#9aa4b2',
                borderRadius: 6,
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              {t('lessons.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  active,
  completed,
  onClick,
}: {
  lesson: Lesson;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        background: active ? '#1f3a66' : 'transparent',
        border: `1px solid ${active ? '#3b6ec3' : 'transparent'}`,
        borderRadius: 6,
        color: '#e6e6e6',
        padding: '8px 10px',
        cursor: 'pointer',
        font: 'inherit',
        textAlign: 'left',
        width: '100%',
        marginTop: 4,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = '#1c2230';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {completed ? (
          <span style={{ color: '#86efac', fontSize: 12 }} aria-label="completed">
            ✓
          </span>
        ) : null}
        <span style={{ opacity: completed ? 0.65 : 1 }}>{t(lesson.titleKey)}</span>
      </span>
      <span style={{ fontSize: 11, color: '#9aa4b2', lineHeight: 1.4 }}>
        {t(lesson.summaryKey)}
      </span>
    </button>
  );
}

function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: 'transparent',
    border: '1px solid #1f2632',
    color: disabled ? '#3a4150' : '#cbd5e1',
    borderRadius: 6,
    cursor: disabled ? 'default' : 'pointer',
    font: 'inherit',
    opacity: disabled ? 0.5 : 1,
  };
}
