import { DateFormat } from '@/contexts/ResumeContext';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatSingle(input: string, fmt: DateFormat): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/^(present|current|now|ongoing)$/i.test(trimmed)) return 'Present';

  const iso = trimmed.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?$/);
  const mY = trimmed.match(/^(\d{1,2})[-/](\d{4})$/);
  const yOnly = trimmed.match(/^(\d{4})$/);
  const mNameY = trimmed.match(/^([A-Za-z]+)\.?\s+(\d{4})$/);
  const mNameDY = trimmed.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/);

  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;

  if (iso) { year = +iso[1]; month = +iso[2]; if (iso[3]) day = +iso[3]; }
  else if (mY) { month = +mY[1]; year = +mY[2]; }
  else if (yOnly) { year = +yOnly[1]; }
  else if (mNameDY) {
    const idx = MONTHS_FULL.findIndex(m => m.toLowerCase().startsWith(mNameDY[1].toLowerCase()));
    if (idx >= 0) { month = idx + 1; day = +mNameDY[2]; year = +mNameDY[3]; }
  }
  else if (mNameY) {
    const idx = MONTHS_FULL.findIndex(m => m.toLowerCase().startsWith(mNameY[1].toLowerCase()));
    if (idx >= 0) { month = idx + 1; year = +mNameY[2]; }
  }

  if (year == null) return trimmed;

  switch (fmt) {
    case 'numbers':
      return month ? `${String(month).padStart(2,'0')}/${year}` : `${year}`;
    case 'monthYear':
      return month ? `${MONTHS_SHORT[month-1]} ${year}` : `${year}`;
    case 'fullDate':
      if (month && day) return `${MONTHS_FULL[month-1]} ${day}, ${year}`;
      return month ? `${MONTHS_FULL[month-1]} ${year}` : `${year}`;
  }
}

/** Try to format a free-form date string per the chosen format. Handles ranges like "Jan 2020 - Present". */
export function formatDate(input: string, fmt: DateFormat): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';
  // Split on common dash separators (en/em/hyphen) + " to "
  const rangeMatch = trimmed.split(/\s*(?:[-–—]|to)\s*/i);
  if (rangeMatch.length === 2) {
    const a = formatSingle(rangeMatch[0], fmt);
    const b = formatSingle(rangeMatch[1], fmt);
    return `${a} – ${b}`;
  }
  return formatSingle(trimmed, fmt);
}
