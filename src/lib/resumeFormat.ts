import { DateFormat } from '@/contexts/ResumeContext';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** Try to format a free-form date string per the chosen format. Falls back to original. */
export function formatDate(input: string, fmt: DateFormat): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Try ISO-ish: YYYY-MM or YYYY-MM-DD or YYYY/MM
  const iso = trimmed.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?$/);
  // Try MM/YYYY or M-YYYY
  const mY = trimmed.match(/^(\d{1,2})[-/](\d{4})$/);
  // Try just YYYY
  const yOnly = trimmed.match(/^(\d{4})$/);
  // Try "Month YYYY" or "Mon YYYY"
  const mNameY = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);

  let year: number | null = null;
  let month: number | null = null; // 1-12
  let day: number | null = null;

  if (iso) { year = +iso[1]; month = +iso[2]; if (iso[3]) day = +iso[3]; }
  else if (mY) { month = +mY[1]; year = +mY[2]; }
  else if (yOnly) { year = +yOnly[1]; }
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
