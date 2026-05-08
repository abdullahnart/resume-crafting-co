import { DesignSettings } from '@/contexts/ResumeContext';
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
