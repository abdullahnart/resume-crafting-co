import { DesignSettings, FontWeight, TextTransform, LetterSpacing, LineHeightPreset } from '@/contexts/ResumeContext';
import { Skill } from '@/types/resume';
import { formatDate as fmtDate } from '@/lib/resumeFormat';

export function getDesign(d?: DesignSettings) {
  return {
    dateFormat: d?.dateFormat ?? 'numbers',
    headerAlign: d?.headerAlign ?? 'center',
    dateAlign: d?.dateAlign ?? 'right',
    locationAlign: d?.locationAlign ?? 'right',
    skillsLayout: d?.skillsLayout ?? 'commaList',
    skillsColumns: d?.skillsColumns ?? 2,
    lineHeight: d?.lineHeight ?? 1.4,
    listLineHeight: d?.listLineHeight ?? 1.4,
  } as Required<Pick<DesignSettings,
    'dateFormat'|'headerAlign'|'dateAlign'|'locationAlign'|'skillsLayout'|'skillsColumns'|'lineHeight'|'listLineHeight'>>;
}

export function fmt(input: string, d?: DesignSettings) {
  return fmtDate(input || '', d?.dateFormat ?? 'numbers');
}

export function dateRange(start: string, end: string, current: boolean, d?: DesignSettings, sep = '—') {
  const s = fmt(start, d);
  const e = current ? 'Present' : fmt(end, d);
  if (!s && !e) return '';
  if (!s) return e;
  if (!e) return s;
  return `${s} ${sep} ${e}`;
}

export function alignClass(a: 'left'|'center'|'right') {
  return a === 'left' ? 'text-left' : a === 'right' ? 'text-right' : 'text-center';
}

export function SkillsList({ skills, design, className = '', textColor = '' }: {
  skills: Skill[]; design?: DesignSettings; className?: string; textColor?: string;
}) {
  const dd = getDesign(design);
  const names = skills.map(s => s.name).filter(Boolean);
  if (names.length === 0) return null;
  const style = { lineHeight: dd.listLineHeight };
  if (dd.skillsLayout === 'comma') {
    return <p className={`${textColor} ${className}`} style={style}>{names.join(', ')}</p>;
  }
  if (dd.skillsLayout === 'columns') {
    return (
      <ul
        className={`${textColor} ${className} list-disc list-inside`}
        style={{ ...style, columnCount: dd.skillsColumns, columnGap: '1rem' }}
      >
        {names.map(n => <li key={n} style={{ breakInside: 'avoid' }}>{n}</li>)}
      </ul>
    );
  }
  return (
    <ul className={`${textColor} ${className} list-disc list-inside`} style={style}>
      {names.map(n => <li key={n}>{n}</li>)}
    </ul>
  );
}

/* ---------- Advanced design CSS injection ---------- */

const WEIGHT_MAP: Record<FontWeight, number> = {
  thin: 100, extralight: 200, light: 300, regular: 400,
  medium: 500, semibold: 600, bold: 700, extrabold: 800,
};
const TRANSFORM_MAP: Record<TextTransform, string> = {
  none: 'none', uppercase: 'uppercase', lowercase: 'lowercase',
  capitalize: 'capitalize', 'small-caps': 'none', // small-caps via font-variant
};
const SPACING_MAP: Record<LetterSpacing, string> = {
  tight: '-0.02em', normal: '0', wide: '0.05em', extrawide: '0.12em',
};
const LH_MAP: Record<LineHeightPreset, number> = {
  compact: 1.1, normal: 1.4, relaxed: 1.6, loose: 1.9,
};

export function AdvancedDesignStyles({ design, scopeId }: { design?: DesignSettings; scopeId: string }) {
  if (!design) return null;
  const t = design.textSizes;
  const w = design.textWeights;
  const tr = design.textTransforms;
  const ls = SPACING_MAP[design.letterSpacing] ?? '0';
  const baseLH = LH_MAP[design.lineHeightPreset] ?? design.lineHeight;
  const sc = (k: TextTransform) => k === 'small-caps' ? 'small-caps' : 'normal';
  const css = `
[data-resume-scope="${scopeId}"] { letter-spacing: ${ls}; line-height: ${baseLH}; font-size: ${t.bodyCopy}pt; }
[data-resume-scope="${scopeId}"] p, [data-resume-scope="${scopeId}"] li, [data-resume-scope="${scopeId}"] div:not(:has(> *)) {
  font-size: ${t.bodyCopy}pt; font-weight: ${WEIGHT_MAP[w.bodyCopy]}; text-transform: ${TRANSFORM_MAP[tr.bodyCopy]}; font-variant: ${sc(tr.bodyCopy)};
}
[data-resume-scope="${scopeId}"] h1 {
  font-size: ${t.fullName}pt !important; font-weight: ${WEIGHT_MAP[w.fullName]} !important;
  text-transform: ${TRANSFORM_MAP[tr.fullName]} !important; font-variant: ${sc(tr.fullName)};
}
[data-resume-scope="${scopeId}"] h2 {
  font-size: ${t.sectionTitle}pt !important; font-weight: ${WEIGHT_MAP[w.sectionTitle]} !important;
  text-transform: ${TRANSFORM_MAP[tr.sectionTitle]} !important; font-variant: ${sc(tr.sectionTitle)};
}
[data-resume-scope="${scopeId}"] h3, [data-resume-scope="${scopeId}"] .role, [data-resume-scope="${scopeId}"] .font-bold {
  font-size: ${t.primaryHeading}pt; font-weight: ${WEIGHT_MAP[w.primaryHeading]};
  text-transform: ${TRANSFORM_MAP[tr.primaryHeading]}; font-variant: ${sc(tr.primaryHeading)};
}
[data-resume-scope="${scopeId}"] .text-\\[10px\\], [data-resume-scope="${scopeId}"] .text-\\[9px\\], [data-resume-scope="${scopeId}"] .text-\\[9\\.5px\\] {
  font-size: ${t.minorCopy}pt !important; font-weight: ${WEIGHT_MAP[w.minorCopy]};
  text-transform: ${TRANSFORM_MAP[tr.minorCopy]}; font-variant: ${sc(tr.minorCopy)};
}
`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export { sanitizeUrl, displayUrl } from './urlUtils';

import { sanitizeUrl as _sanitize } from './urlUtils';

export function ProjectLink({
  url,
  name,
  className = '',
}: { url?: string; name: string; className?: string }) {
  const safe = _sanitize(url);
  if (!safe) return <span className={className}>{name || url || ''}</span>;
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer nofollow" className={className}>
      {name || safe}
    </a>
  );
}
