import { useState } from 'react';
import { challengeFor } from '../challenges.js';
import { markLessonCompleted } from '../curriculum.js';
import { t } from '../i18n/index.js';
import { runChallenge, type ChallengeResult } from '../model/challenge-runner.js';
import { useAppStore } from '../model/store.js';
import { exportTestbench } from '../model/verilog-testbench.js';

/**
 * Lesson-side challenge launcher. If a challenge spec exists for this
 * lesson, render a "Check my circuit" button + the latest grading result.
 */
export function ChallengePanel({ lessonId }: { lessonId: string }): JSX.Element | null {
  const challenge = challengeFor(lessonId);
  const [result, setResult] = useState<ChallengeResult | null>(null);

  if (!challenge) {
    return (
      <div
        style={{
          fontSize: 11,
          color: '#7c8696',
          padding: '8px 10px',
          border: '1px dashed #1f2632',
          borderRadius: 6,
          alignSelf: 'flex-start',
          flex: 1,
        }}
      >
        {t('challenge.missing')}
      </div>
    );
  }

  const run = (): void => {
    const s = useAppStore.getState();
    const r = runChallenge(s.document, s.library, challenge);
    setResult(r);
    if (r.kind === 'pass') {
      markLessonCompleted(lessonId);
      window.dispatchEvent(new Event('nandbench:lesson-progress-changed'));
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 10,
        background: '#0c1018',
        border: '1px solid #1f2632',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            color: '#9aa4b2',
            fontWeight: 700,
          }}
        >
          {t('challenge.title')}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={run}
            style={{
              background: '#1f3a66',
              border: '1px solid #3b6ec3',
              color: '#e6e6e6',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            {t('challenge.run')}
          </button>
          <button
            onClick={() => downloadTestbench(lessonId, challenge)}
            title={t('challenge.downloadTbTooltip')}
            style={{
              background: 'transparent',
              border: '1px solid #2a3548',
              color: '#cbd5e1',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            {t('challenge.downloadTb')}
          </button>
        </div>
      </div>
      <Outcome result={result} />
    </div>
  );
}

function Outcome({ result }: { result: ChallengeResult | null }): JSX.Element | null {
  if (!result) return null;
  if (result.kind === 'pass') {
    return (
      <div style={{ color: '#86efac', fontSize: 12, fontWeight: 700 }}>{t('challenge.pass')}</div>
    );
  }
  if (result.kind === 'error') {
    return (
      <div style={{ color: '#f59e0b', fontSize: 11, lineHeight: 1.5 }}>
        {t('challenge.error', { message: result.message })}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ color: '#ef4444', fontSize: 12, fontWeight: 700 }}>
        {t('challenge.fail', { n: result.failures.length })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 110, overflowY: 'auto' }}>
        {result.failures.slice(0, 5).map((f) => (
          <div
            key={f.caseIdx}
            style={{
              fontSize: 10,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: '#fca5a5',
              padding: '2px 0',
            }}
          >
            <strong>{t('challenge.case', { n: f.caseIdx + 1 })}:</strong>{' '}
            <span style={{ color: '#9aa4b2' }}>{t('challenge.expected')}</span>{' '}
            <code>[{f.expected.join(', ')}]</code> ·{' '}
            <span style={{ color: '#9aa4b2' }}>{t('challenge.actual')}</span>{' '}
            <code>[{f.got.join(', ')}]</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function downloadTestbench(
  lessonId: string,
  challenge: ReturnType<typeof challengeFor> & {},
): void {
  const v = exportTestbench(challenge, {
    dutModuleName: useAppStore.getState().activeDocumentName || 'nandbench_top',
    lessonId,
  });
  const blob = new Blob([v], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tb_${lessonId.replace(/[^a-zA-Z0-9_]/g, '_')}.v`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
