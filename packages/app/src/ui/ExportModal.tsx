/**
 * Unified export modal. One modal, six tabs:
 *   - Schematic   → PNG / SVG
 *   - Truth table → Markdown / CSV
 *   - Verilog     → module / module + testbench
 *   - Analysis    → readable stats
 *   - Waveform    → VCD (delegates to the Waveform panel's recorded
 *     traces via a window event; if nothing's recorded the tab shows
 *     a note)
 *   - Full report → single .md
 *
 * Opens via `gatecraft:open-export`. Back-compat: the existing
 * `gatecraft:open-verilog-export` event also opens this modal and
 * jumps to the Verilog tab.
 */

import { useEffect, useState } from 'react';
import { challengeFor } from '../challenges.js';
import { LESSONS } from '../lessons.js';
import { t } from '../i18n/index.js';
import {
  analysisToMarkdown,
  analyzeCircuit,
  type CircuitAnalysis,
} from '../model/circuit-analysis.js';
import {
  exportSchematicPNG,
  exportSchematicSVG,
} from '../model/schematic-export.js';
import { useAppStore } from '../model/store.js';
import { generateMarkdownReport } from '../model/report-export.js';
import {
  extractTruthTable,
  tableToCSV,
  tableToMarkdown,
  type ExtractionResult,
} from '../model/truth-table-extractor.js';
import { exportVerilog } from '../model/verilog-export.js';
import { exportTestbench } from '../model/verilog-testbench.js';
import { ModalCloseButton } from './ModalCloseButton.js';

type Tab = 'schematic' | 'truth' | 'verilog' | 'analysis' | 'waveform' | 'report';

const TAB_ORDER: readonly Tab[] = [
  'schematic',
  'truth',
  'verilog',
  'analysis',
  'waveform',
  'report',
];

function tabLabel(tab: Tab): string {
  switch (tab) {
    case 'schematic':
      return t('export.tab.schematic');
    case 'truth':
      return t('export.tab.truth');
    case 'verilog':
      return t('export.tab.verilog');
    case 'analysis':
      return t('export.tab.analysis');
    case 'waveform':
      return t('export.tab.waveform');
    case 'report':
      return t('export.tab.report');
  }
}

function download(filename: string, content: Blob | string, mime = 'text/plain'): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeId(name: string): string {
  const cleaned = (name || 'circuit').replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `m_${cleaned}`;
}

export function ExportModal(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('schematic');
  const [moduleName, setModuleName] = useState('');
  const [withTb, setWithTb] = useState(false);
  const [lessonId, setLessonId] = useState<string>('');
  const locale = useAppStore((s) => s.locale);
  void locale;

  useEffect(() => {
    const onOpen = (initialTab: Tab) => (): void => {
      const tabName = useAppStore.getState().activeDocumentName || 'top';
      setModuleName(tabName);
      setWithTb(false);
      setLessonId('');
      setTab(initialTab);
      setOpen(true);
    };
    window.addEventListener('gatecraft:open-export', onOpen('schematic'));
    window.addEventListener('gatecraft:open-verilog-export', onOpen('verilog'));
    const esc = (ev: KeyboardEvent): void => {
      if (open && ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('gatecraft:open-export', onOpen('schematic'));
      window.removeEventListener('gatecraft:open-verilog-export', onOpen('verilog'));
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!open) return null;

  const s = useAppStore.getState();
  const doc = s.document;
  const library = s.library;
  const safeName = sanitizeId(moduleName);
  const lessonsWithChallenges = LESSONS.filter((l) => challengeFor(l.id) !== null);

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
          width: 'min(720px, 96vw)',
          maxHeight: '92vh',
          background: '#0f1115',
          border: '1px solid #2a3548',
          borderRadius: 12,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        }}
      >
        <ModalCloseButton onClick={() => setOpen(false)} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e6e6e6' }}>
            {t('export.title')}
          </div>
          <div style={{ fontSize: 12, color: '#9aa4b2', marginTop: 6, lineHeight: 1.55 }}>
            {t('export.subtitle')}
          </div>
        </div>
        <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1f2632' }}>
          {TAB_ORDER.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              style={{
                background: tab === id ? '#1c2230' : 'transparent',
                color: tab === id ? '#eef1f6' : '#9aa4b2',
                border: 'none',
                borderBottom: tab === id ? '2px solid #60a5fa' : '2px solid transparent',
                padding: '8px 12px',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {tabLabel(id)}
            </button>
          ))}
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(92vh - 180px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FilenameInput value={moduleName} onChange={setModuleName} />
          {tab === 'schematic' && (
            <SchematicTab
              onPng={async () => {
                const blob = await exportSchematicPNG(doc, library);
                download(`${safeName}.png`, blob, 'image/png');
              }}
              onSvg={() => {
                const svg = exportSchematicSVG(doc, library);
                download(`${safeName}.svg`, svg, 'image/svg+xml');
              }}
            />
          )}
          {tab === 'truth' && (
            <TruthTab
              result={extractTruthTable(doc, library)}
              onMarkdown={(md) => download(`${safeName}-truth.md`, md, 'text/markdown')}
              onCsv={(csv) => download(`${safeName}-truth.csv`, csv, 'text/csv')}
            />
          )}
          {tab === 'verilog' && (
            <VerilogTab
              withTb={withTb}
              setWithTb={setWithTb}
              lessonId={lessonId}
              setLessonId={setLessonId}
              lessonsWithChallenges={lessonsWithChallenges}
              onExport={() => {
                const v = exportVerilog(doc, library, moduleName || 'top');
                if (withTb && lessonId) {
                  const ch = challengeFor(lessonId);
                  if (ch) {
                    const tb = exportTestbench(ch, {
                      dutModuleName: moduleName || 'top',
                      lessonId,
                    });
                    download(`${safeName}_with_tb.v`, `${v}\n\n${tb}\n`);
                    return;
                  }
                }
                download(`${safeName}.v`, v);
              }}
            />
          )}
          {tab === 'analysis' && <AnalysisTab analysis={analyzeCircuit(doc, library)} />}
          {tab === 'waveform' && (
            <WaveformTab
              onDownload={() => {
                window.dispatchEvent(
                  new CustomEvent('gatecraft:waveform-export-vcd', {
                    detail: { filename: `${safeName}.vcd` },
                  }),
                );
              }}
            />
          )}
          {tab === 'report' && (
            <ReportTab
              onDownload={(description) => {
                const md = generateMarkdownReport(doc, library, {
                  title: moduleName || 'circuit',
                  description,
                });
                download(`${safeName}-report.md`, md, 'text/markdown');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FilenameInput({ value, onChange }: { value: string; onChange: (s: string) => void }): JSX.Element {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: '#9aa4b2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {t('export.fileBase')}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: '#0c1018',
          border: '1px solid #2a3548',
          borderRadius: 5,
          color: '#dde4ef',
          padding: '6px 10px',
          font: 'inherit',
          fontSize: 13,
          outline: 'none',
        }}
      />
    </label>
  );
}

function SchematicTab({ onPng, onSvg }: { onPng: () => void; onSvg: () => void }): JSX.Element {
  return (
    <Section subtitle={t('export.schematic.hint')}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={onPng} style={btn('primary')}>
          {t('export.schematic.downloadPng')}
        </button>
        <button type="button" onClick={onSvg} style={btn('ghost')}>
          {t('export.schematic.downloadSvg')}
        </button>
      </div>
    </Section>
  );
}

function TruthTab({
  result,
  onMarkdown,
  onCsv,
}: {
  result: ExtractionResult;
  onMarkdown: (md: string) => void;
  onCsv: (csv: string) => void;
}): JSX.Element {
  if (result.kind === 'empty') {
    return (
      <Section subtitle={t(`export.truth.empty.${result.reason === 'no-inputs' ? 'noInputs' : 'noOutputs'}`)}>
        <div />
      </Section>
    );
  }
  if (result.kind === 'too-large') {
    return (
      <Section subtitle={t('export.truth.tooLarge', { rows: String(result.rowCount), cap: String(result.cap) })}>
        <div />
      </Section>
    );
  }
  if (result.kind === 'error') {
    return (
      <Section subtitle={t('export.truth.error', { message: result.message })}>
        <div />
      </Section>
    );
  }
  const md = tableToMarkdown(result.table);
  return (
    <Section subtitle={t('export.truth.hint', { rows: String(result.table.rows.length) })}>
      <pre
        style={{
          fontSize: 11,
          fontFamily: 'ui-monospace, monospace',
          background: '#0c1018',
          border: '1px solid #1f2632',
          borderRadius: 6,
          padding: 10,
          maxHeight: 240,
          overflow: 'auto',
          color: '#dde4ef',
          margin: 0,
        }}
      >
        {md}
      </pre>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => onMarkdown(md)} style={btn('primary')}>
          {t('export.truth.downloadMd')}
        </button>
        <button type="button" onClick={() => onCsv(tableToCSV(result.table))} style={btn('ghost')}>
          {t('export.truth.downloadCsv')}
        </button>
        <button type="button" onClick={() => void navigator.clipboard.writeText(md)} style={btn('ghost')}>
          {t('export.copy')}
        </button>
      </div>
    </Section>
  );
}

function VerilogTab({
  withTb,
  setWithTb,
  lessonId,
  setLessonId,
  lessonsWithChallenges,
  onExport,
}: {
  withTb: boolean;
  setWithTb: (v: boolean) => void;
  lessonId: string;
  setLessonId: (s: string) => void;
  lessonsWithChallenges: readonly typeof LESSONS[number][];
  onExport: () => void;
}): JSX.Element {
  return (
    <Section subtitle={t('verilog.subtitle')}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1' }}>
        <input type="checkbox" checked={withTb} onChange={(e) => setWithTb(e.target.checked)} style={{ accentColor: '#60a5fa' }} />
        {t('verilog.includeTb')}
      </label>
      {withTb && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#9aa4b2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {t('verilog.tbLessonSource')}
          </span>
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            style={{
              background: '#0c1018',
              border: '1px solid #2a3548',
              borderRadius: 5,
              color: '#dde4ef',
              padding: '6px 10px',
              font: 'inherit',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="">{t('verilog.tbPickLesson')}</option>
            {lessonsWithChallenges.map((l) => (
              <option key={l.id} value={l.id}>
                {t(l.titleKey)}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: '#7c8696', marginTop: 4 }}>{t('verilog.tbHint')}</span>
        </label>
      )}
      <button type="button" onClick={onExport} style={btn('primary')}>
        {t('verilog.download')}
      </button>
    </Section>
  );
}

function AnalysisTab({ analysis }: { analysis: CircuitAnalysis }): JSX.Element {
  const md = analysisToMarkdown(analysis);
  return (
    <Section subtitle={t('export.analysis.hint')}>
      <pre
        style={{
          fontSize: 11,
          fontFamily: 'ui-monospace, monospace',
          background: '#0c1018',
          border: '1px solid #1f2632',
          borderRadius: 6,
          padding: 10,
          maxHeight: 320,
          overflow: 'auto',
          color: '#dde4ef',
          margin: 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {md}
      </pre>
      <button type="button" onClick={() => void navigator.clipboard.writeText(md)} style={btn('ghost')}>
        {t('export.copy')}
      </button>
    </Section>
  );
}

function WaveformTab({ onDownload }: { onDownload: () => void }): JSX.Element {
  return (
    <Section subtitle={t('export.waveform.hint')}>
      <button type="button" onClick={onDownload} style={btn('primary')}>
        {t('export.waveform.downloadVcd')}
      </button>
    </Section>
  );
}

function ReportTab({ onDownload }: { onDownload: (description: string) => void }): JSX.Element {
  const [desc, setDesc] = useState('');
  return (
    <Section subtitle={t('export.report.hint')}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, color: '#9aa4b2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {t('export.report.description')}
        </span>
        <textarea
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t('export.report.descriptionPlaceholder')}
          style={{
            background: '#0c1018',
            border: '1px solid #2a3548',
            borderRadius: 5,
            color: '#dde4ef',
            padding: '6px 10px',
            font: 'inherit',
            fontSize: 13,
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </label>
      <button type="button" onClick={() => onDownload(desc)} style={btn('primary')}>
        {t('export.report.download')}
      </button>
    </Section>
  );
}

function Section({ subtitle, children }: { subtitle: string; children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: '#9aa4b2', lineHeight: 1.55 }}>{subtitle}</div>
      {children}
    </div>
  );
}

function btn(variant: 'primary' | 'ghost'): React.CSSProperties {
  return {
    background: variant === 'primary' ? '#3a82d6' : 'transparent',
    color: variant === 'primary' ? '#fff' : '#cbd5e1',
    border: variant === 'primary' ? '1px solid #3a82d6' : '1px solid #2a3548',
    borderRadius: 5,
    padding: '6px 12px',
    font: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
  };
}
