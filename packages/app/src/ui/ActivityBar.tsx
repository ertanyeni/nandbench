import { useEffect, useState } from 'react';
import { t } from '../i18n/index.js';
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
        onClick={() => window.dispatchEvent(new Event('gatecraft:open-assistant'))}
      />
      <ActivityIcon
        icon={<LessonsIcon />}
        label={t('toolbar.lessonsLong')}
        onClick={() => window.dispatchEvent(new Event('gatecraft:open-lessons'))}
      />
      <ActivityIcon
        icon={<GlossaryIcon />}
        label={t('toolbar.glossary')}
        onClick={() => window.dispatchEvent(new Event('gatecraft:open-glossary'))}
      />
      <ActivityIcon
        icon={<HistoryIcon />}
        label={t('toolbar.history')}
        onClick={() => window.dispatchEvent(new Event('gatecraft:open-history'))}
      />
      <ActivityIcon
        icon={<WaveformIcon />}
        label={t('toolbar.waveform')}
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
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: string;
  badge?: boolean;
  onClick: () => void;
}): JSX.Element {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width: 36,
        height: 36,
        background: hover ? '#1c2230' : 'transparent',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        color: hover ? '#dde4ef' : accent ?? SURFACE.itemSubText,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 120ms, color 120ms',
      }}
    >
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
    </button>
  );
}
