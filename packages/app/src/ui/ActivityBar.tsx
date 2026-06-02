import { useEffect, useState } from 'react';
import { readCurriculum } from '../curriculum.js';
import { t } from '../i18n/index.js';
import { LESSONS } from '../lessons.js';
import { useAppStore } from '../model/store.js';
import {
  AssistantIcon,
  GlossaryIcon,
  HistoryIcon,
  LessonsIcon,
  WaveformIcon,
} from './icons.js';
import { SURFACE } from './palette-tokens.js';

/**
 * VSCode-style activity bar — narrow vertical strip on the left edge of
 * the window. Hosts quick toggles for the side-mounted feature panels
 * (assistant, lessons, glossary, history). Width matches the 44px gap
 * the Toolbar leaves on its left.
 *
 * Buttons surface a colored dot when their panel has unread state
 * (assistant: new diagnostics). The actual panel opening still goes
 * through the existing window events — no store/panel refactor needed.
 */
export function ActivityBar(): JSX.Element {
  const assistantDiagCount = useAppStore(
    (s) => s.compiled.diagnostics.length + s.simDiagnostics.length,
  );
  const locale = useAppStore((s) => s.locale);
  void locale;
  // Track which side panel is open so we can highlight its icon. We
  // listen on the existing `open-*` events and the mutual-exclusivity
  // `close-side-panels` event, plus Esc keypress for the catch-all.
  const [active, setActive] = useState<string | null>(null);
  // Lessons progress count — rerendered on completion-toggle events.
  const [lessonsDone, setLessonsDone] = useState<number>(() => readCurriculum().completed.length);
  useEffect(() => {
    const sync = (): void => setLessonsDone(readCurriculum().completed.length);
    sync();
    window.addEventListener('gatecraft:lesson-progress-changed', sync);
    return () => window.removeEventListener('gatecraft:lesson-progress-changed', sync);
  }, []);
  useEffect(() => {
    const onOpen = (which: string) => () => setActive(which);
    const onClose = (ev: Event): void => {
      const except = (ev as CustomEvent<{ except?: string }>).detail?.except;
      // The newly-opened panel sends the close event with its own name;
      // anything else means the user dismissed everything.
      setActive(except ?? null);
    };
    const onEsc = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') setActive(null);
    };
    const handlers: Array<[string, EventListener]> = [
      ['gatecraft:open-assistant', onOpen('assistant')],
      ['gatecraft:open-lessons', onOpen('lessons')],
      ['gatecraft:open-glossary', onOpen('glossary')],
      ['gatecraft:open-history', onOpen('history')],
      ['gatecraft:open-waveform', onOpen('waveform')],
      ['gatecraft:close-side-panels', onClose as EventListener],
    ];
    for (const [k, h] of handlers) window.addEventListener(k, h);
    window.addEventListener('keydown', onEsc);
    return () => {
      for (const [k, h] of handlers) window.removeEventListener(k, h);
      window.removeEventListener('keydown', onEsc);
    };
  }, []);

  return (
    <div
      role="toolbar"
      aria-label="Activity bar"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 24,
        width: 44,
        background: SURFACE.chromeBg,
        borderRight: `1px solid ${SURFACE.borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 6,
        gap: 2,
        zIndex: 11,
      }}
    >
      <ActivityIcon
        icon={<AssistantIcon />}
        label={t('toolbar.assistantLong')}
        accent="#a78bfa"
        badge={assistantDiagCount > 0}
        isActive={active === 'assistant'}
        onClick={() => window.dispatchEvent(new Event('gatecraft:open-assistant'))}
      />
      <ActivityIcon
        icon={<LessonsIcon />}
        label={t('lessons.progressTooltip', { done: String(lessonsDone), total: String(LESSONS.length) })}
        isActive={active === 'lessons'}
        countLabel={lessonsDone > 0 ? `${lessonsDone}` : undefined}
        onClick={() => window.dispatchEvent(new Event('gatecraft:open-lessons'))}
      />
      <ActivityIcon
        icon={<GlossaryIcon />}
        label={t('toolbar.glossary')}
        isActive={active === 'glossary'}
        onClick={() => window.dispatchEvent(new Event('gatecraft:open-glossary'))}
      />
      <ActivityIcon
        icon={<HistoryIcon />}
        label={t('toolbar.history')}
        isActive={active === 'history'}
        onClick={() => window.dispatchEvent(new Event('gatecraft:open-history'))}
      />
      <ActivityIcon
        icon={<WaveformIcon />}
        label={t('toolbar.waveform')}
        isActive={active === 'waveform'}
        onClick={() => window.dispatchEvent(new Event('gatecraft:open-waveform'))}
      />
    </div>
  );
}

function ActivityIcon({
  icon,
  label,
  accent,
  badge,
  countLabel,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: string;
  badge?: boolean;
  /** Optional numeric badge text shown next to the icon (e.g. "12"). */
  countLabel?: string;
  isActive?: boolean;
  onClick: () => void;
}): JSX.Element {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width: 36,
        height: 36,
        background: isActive ? '#1c2230' : hover ? '#1a1f29' : 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        color: isActive || hover ? '#eef1f6' : accent ?? SURFACE.itemSubText,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 120ms, color 120ms',
      }}
    >
      {/* Active item: 2px left accent rail — VSCode pattern. */}
      {isActive ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: -4,
            top: 4,
            bottom: 4,
            width: 2,
            background: '#60a5fa',
            borderRadius: 1,
          }}
        />
      ) : null}
      {icon}
      {badge ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: `0 0 0 1.5px ${SURFACE.chromeBg}`,
          }}
        />
      ) : null}
      {countLabel ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            minWidth: 14,
            height: 13,
            padding: '0 3px',
            borderRadius: 7,
            background: '#1f3a66',
            border: `1px solid ${SURFACE.chromeBg}`,
            color: '#86efac',
            fontSize: 9,
            fontWeight: 800,
            lineHeight: '12px',
            textAlign: 'center',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {countLabel}
        </span>
      ) : null}
    </button>
  );
}
