import { ResumeData, WorkExperience, Education, Skill, Language, Certification, Project } from '@/types/resume';

const uid = () => crypto.randomUUID();

type PositionedTextItem = {
  str: string;
  x: number;
  y: number;
  width: number;
};

type ExperienceDateInfo = Pick<WorkExperience, 'startDate' | 'endDate' | 'current'>;

// --- Coordinate-based PDF text extraction ---
async function extractTextWithStructure(page: any): Promise<string> {
  const content = await page.getTextContent();
  const Y_TOLERANCE = 3;
  const X_GAP_THRESHOLD = 12;
  const viewport = page.getViewport({ scale: 1 });

  const items: PositionedTextItem[] = (content.items as any[])
    .filter(item => item.str?.trim())
    .map(item => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width || item.str.length * 5,
    }));

  const buildStructuredText = (pageItems: PositionedTextItem[]) => {
    const lineMap = new Map<number, Array<{ str: string; x: number; width: number }>>();

    for (const item of pageItems) {
      const y = Math.round(item.y / Y_TOLERANCE) * Y_TOLERANCE;
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({
        str: item.str,
        x: item.x,
        width: item.width,
      });
    }

    return Array.from(lineMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([_, lineItems]) => {
        lineItems.sort((a, b) => a.x - b.x);
        let line = '';

        for (let i = 0; i < lineItems.length; i++) {
          if (i > 0 && lineItems[i].x - (lineItems[i - 1].x + lineItems[i - 1].width) > X_GAP_THRESHOLD) {
            line += '  ';
          }

          line += lineItems[i].str;
        }

        return line;
      })
      .join('\n');
  };

  const midX = viewport.width / 2;
  const leftItems = items.filter(item => item.x + item.width / 2 < midX);
  const rightItems = items.filter(item => item.x + item.width / 2 >= midX);
  const hasTwoColumns = leftItems.length >= 12 && rightItems.length >= 12;

  if (hasTwoColumns) {
    return [buildStructuredText(leftItems), buildStructuredText(rightItems)]
      .filter(Boolean)
      .join('\n');
  }

  return buildStructuredText(items);
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await extractTextWithStructure(page);
    pages.push(text);
  }

  return pages.join('\n---PAGE_BREAK---\n');
}

export async function extractTextFromDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return extractTextFromPDF(file);
  if (ext === 'docx' || ext === 'doc') return extractTextFromDOCX(file);
  throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
}

// --- Section splitting ---

const SECTION_HEADERS: Record<string, RegExp> = {
  summary: /^(?:SUMMARY|OBJECTIVE|PROFILE|ABOUT\s*ME|PROFESSIONAL\s*SUMMARY)\s*$/im,
  experience: /^(?:EXPERIENCE|WORK\s*HISTORY|EMPLOYMENT|PROFESSIONAL\s*EXPERIENCE|WORK\s*EXPERIENCE|WORK)\s*$/im,
  education: /^(?:EDUCATION|ACADEMIC|QUALIFICATIONS|DEGREES?)\s*$/im,
  skills: /^(?:SKILLS|TECHNICAL\s*SKILLS|CORE\s*COMPETENCIES|PROFICIENCIES|TECHNOLOGIES)\s*$/im,
  languages: /^(?:LANGUAGES?)\s*$/im,
  certifications: /^(?:CERTIFICATIONS?|LICENSES?|CREDENTIALS?)\s*$/im,
  projects: /^(?:PROJECTS?|PORTFOLIO|LINKS?)\s*$/im,
  address: /^(?:ADDRESS|CONTACT)\s*$/im,
};

const PAGE_MARKER_RE = /^page\s+\d+$/i;

const stripFormatting = (value: string) => value.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
const normalizeLine = (value: string) => stripFormatting(value).replace(/\s+/g, ' ').trim();
const normalizeSectionCandidate = (value: string) => normalizeLine(value).replace(/:$/, '').trim();

function isKnownSectionHeader(line: string): boolean {
  const normalized = normalizeSectionCandidate(line);
  return Object.values(SECTION_HEADERS).some(re => re.test(normalized));
}

function splitSections(text: string): Record<string, string> {
  const lines = text.split('\n');
  const sections: { key: string; lineIdx: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = normalizeSectionCandidate(lines[i]);
    if (!trimmed) continue;
    if (PAGE_MARKER_RE.test(trimmed)) continue;
    for (const [key, re] of Object.entries(SECTION_HEADERS)) {
      if (re.test(trimmed)) {
        sections.push({ key, lineIdx: i });
        break;
      }
    }
  }

  sections.sort((a, b) => a.lineIdx - b.lineIdx);

  const result: Record<string, string> = {};
  if (sections.length > 0) {
    result.header = lines.slice(0, sections[0].lineIdx).join('\n').trim();
  } else {
    result.header = text;
  }

  for (let i = 0; i < sections.length; i++) {
    const endLine = i + 1 < sections.length ? sections[i + 1].lineIdx : lines.length;
    const sectionContent = lines.slice(sections[i].lineIdx + 1, endLine).join('\n').trim();
    // Append if same section key appears again (e.g. work on page 2)
    if (result[sections[i].key]) {
      result[sections[i].key] += '\n' + sectionContent;
    } else {
      result[sections[i].key] = sectionContent;
    }
  }

  return result;
}

// --- Personal info ---

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
const LINKEDIN_RE = /linkedin\.com\/in\/[\w-]+/i;

function parsePersonalInfo(header: string, addressSection?: string) {
  const lines = header.split('\n').map(l => l.trim()).filter(Boolean);
  const email = header.match(EMAIL_RE)?.[0] || '';
  const phones = header.match(PHONE_RE) || [];
  const phone = phones[0] || '';
  const linkedin = header.match(LINKEDIN_RE)?.[0] || '';

  const cleanLines = lines
    .map(l => l.replace(EMAIL_RE, '').replace(PHONE_RE, '').replace(LINKEDIN_RE, '').replace(/[|•·,]/g, ' ').trim())
    .filter(l => l.length > 1);

  const fullName = cleanLines[0] || '';
  const jobTitle = cleanLines[1] || '';

  // Location from address section or header
  let location = '';
  if (addressSection) {
    const addrLines = addressSection.split('\n').map(l => l.trim()).filter(Boolean);
    location = addrLines.join(', ');
  } else {
    const locationMatch = header.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2})\b/);
    location = locationMatch?.[1] || '';
  }

  const urls = header.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w.]+(?:\/[\w-]*)?/gi) || [];
  const website = urls.find(u => !u.includes('linkedin.com')) || '';

  return { fullName, jobTitle, email, phone, location, linkedin, website };
}

// --- Work experience ---

const DURATION_RE = /(\d+(?:\.\d+)?\s*(?:months?|years?)\s*(?:of\s*)?experience|\d+(?:\.\d+)?\s*months?\s*experience)/i;
const DATE_TOKEN = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s*\\d{4}|\\d{1,2}[/-]\\d{4}|\\d{4}|present|current|now';
const DATE_RANGE_RE = new RegExp(`(${DATE_TOKEN})\\s*(?:to|-|–|—)\\s*(${DATE_TOKEN})`, 'i');
const CURRENTLY_WORKING_RE = /currently\s*(?:work|working)\s*here/i;

function normalizeDateValue(value: string): string {
  const cleaned = normalizeLine(value).replace(/\.$/, '');
  if (/present|current|now/i.test(cleaned)) return 'Present';
  return cleaned;
}

function extractDateInfo(line: string): ExperienceDateInfo | null {
  const normalized = normalizeLine(line);
  const dateRangeMatch = normalized.match(DATE_RANGE_RE);

  if (dateRangeMatch) {
    const startDate = normalizeDateValue(dateRangeMatch[1]);
    const endDate = normalizeDateValue(dateRangeMatch[2]);
    return {
      startDate,
      endDate,
      current: endDate === 'Present',
    };
  }

  if (CURRENTLY_WORKING_RE.test(normalized)) {
    return {
      startDate: '',
      endDate: 'Present',
      current: true,
    };
  }

  return null;
}

function cleanExperienceLine(line: string): string {
  return normalizeLine(line)
    .replace(DURATION_RE, '')
    .replace(DATE_RANGE_RE, '')
    .replace(CURRENTLY_WORKING_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function applyDateInfo(target: Partial<WorkExperience>, dateInfo?: Partial<ExperienceDateInfo> | null) {
  if (!target || !dateInfo) return;
  if (dateInfo.startDate) target.startDate = dateInfo.startDate;
  if (dateInfo.endDate) target.endDate = dateInfo.endDate;
  if (typeof dateInfo.current === 'boolean') target.current = dateInfo.current;
}

function parseExperience(text: string): WorkExperience[] {
  if (!text) return [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const entries: WorkExperience[] = [];
  let current: Partial<WorkExperience> | null = null;
  let pendingDateInfo: Partial<ExperienceDateInfo> | null = null;

  const flushCurrent = () => {
    if (current && (current.company || current.role)) {
      entries.push({
        id: uid(),
        company: current.company || '',
        role: current.role || '',
        startDate: current.startDate || '',
        endDate: current.endDate || '',
        current: current.current || false,
        bullets: current.bullets || [],
      });
    }
     current = null;
  };

  const startEntry = (company: string, role = '') => {
    flushCurrent();
    current = {
      company: normalizeLine(company),
      role: normalizeLine(role),
      startDate: '',
      endDate: '',
      current: false,
      bullets: [],
    };
    applyDateInfo(current, pendingDateInfo);
    pendingDateInfo = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = normalizeLine(rawLine);
    const nextRawLine = lines[i + 1] || '';
    const nextLine = normalizeLine(nextRawLine);
    const isBullet = /^[•\-–—*►▪]\s/.test(rawLine) || /^\d+\.\s/.test(rawLine);
    const isHr = /^-{3,}$/.test(rawLine) || /^_{3,}$/.test(rawLine) || rawLine === '---PAGE_BREAK---';
    const isBoldLine = rawLine.startsWith('**') && rawLine.endsWith('**');
    const isNextBoldLine = nextRawLine.startsWith('**') && nextRawLine.endsWith('**');

    if (isHr || PAGE_MARKER_RE.test(line) || isKnownSectionHeader(line)) continue;

    if (CURRENTLY_WORKING_RE.test(line)) {
      if (current) {
        applyDateInfo(current, { endDate: 'Present', current: true });
      } else {
        pendingDateInfo = { ...(pendingDateInfo || {}), endDate: 'Present', current: true };
      }
      continue;
    }

    const dateInfo = extractDateInfo(line);
    if (dateInfo) {
      if (current && (current.company || current.role) && !current.startDate && !current.endDate) {
        applyDateInfo(current, dateInfo);
      } else {
        pendingDateInfo = { ...(pendingDateInfo || {}), ...dateInfo };
      }

      if (!cleanExperienceLine(line)) {
        continue;
      }
    }

    const pipeParts = line.split('|').map(part => part.trim()).filter(Boolean);
    if (pipeParts.length >= 2 && !isBullet) {
      startEntry(pipeParts[0], pipeParts.slice(1).join(' | '));
      continue;
    }

    if (isBoldLine && isNextBoldLine && !isBullet) {
      startEntry(line, nextLine);
      i++;
      continue;
    }

    if (isBullet && current) {
      const cleanBullet = line.replace(/^[•\-–—*►▪]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (cleanBullet) current.bullets = [...(current.bullets || []), cleanBullet];
      continue;
    }

    if (current && !current.role && line.length < 100 && !extractDateInfo(line)) {
      current.role = line;
      continue;
    }

    if (!isBullet && line.length < 100 && !current) {
      startEntry(line);
    }
  }

  flushCurrent();
  return entries;
}

// --- Education ---

function parseEducation(text: string): Education[] {
  if (!text) return [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const entries: Education[] = [];
  let current: Partial<Education> | null = null;

  const EDUCATION_KEYWORD_RE = /\b(?:B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|M\.?B\.?A\.?|Ph\.?D\.?|Bachelor|Bachelors?|Master|Associate|Doctorate|Doctor|Diploma|Intermediate|Matric(?:ulation|ualtion)?|H\.?S\.?C|S\.?S\.?C)\b/i;

  const flushCurrent = () => {
    if (current && (current.degree || current.school || current.field)) {
      entries.push({
        id: uid(),
        school: current.school || '',
        degree: current.degree || '',
        field: current.field || '',
        startDate: current.startDate || '',
        endDate: current.endDate || '',
        gpa: current.gpa || '',
      });
    }
    current = null;
  };

  for (const rawLine of lines) {
    const isBullet = /^[•\-–—*►▪]\s/.test(rawLine);
    const cleanLine = normalizeLine(rawLine.replace(/^[•\-–—*►▪]\s*/, ''));
    
    if (!cleanLine || PAGE_MARKER_RE.test(cleanLine) || isKnownSectionHeader(cleanLine)) continue;

    const headingOnlyMatch = cleanLine.match(/^(.+?):$/);
    const inlineFromMatch = cleanLine.match(/^(.+?)\s+[Ff]rom\s+(.+)$/);
    const fromOnlyMatch = cleanLine.match(/^[Ff]rom\s+(.+)$/);

    if (fromOnlyMatch && current) {
      current.school = fromOnlyMatch[1].trim().replace(/\.$/, '');
      continue;
    }

    if (inlineFromMatch) {
      const left = inlineFromMatch[1].trim().replace(/:$/, '');
      const right = inlineFromMatch[2].trim().replace(/\.$/, '');

      if (current && !current.school) {
        if (!current.field && current.degree && left.toLowerCase() !== current.degree.toLowerCase()) {
          current.field = left;
        } else if (!current.degree) {
          current.degree = left;
        }
        current.school = right;
        continue;
      }

      flushCurrent();
      current = { degree: left, school: right, field: '', startDate: '', endDate: '', gpa: '' };
      continue;
    }

    const looksLikeDegreeLine = Boolean(headingOnlyMatch) || EDUCATION_KEYWORD_RE.test(cleanLine) || isBullet;
    if (looksLikeDegreeLine) {
      flushCurrent();
      current = {
        degree: cleanLine.replace(/:$/, '').replace(/\.$/, ''),
        school: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
      };
      continue;
    }

    if (current && !current.field && !/(college|school|university|board)/i.test(cleanLine)) {
      current.field = cleanLine.replace(/\.$/, '');
      continue;
    }

    if (current && !current.school) {
      current.school = cleanLine.replace(/\.$/, '');
    }
  }

  flushCurrent();
  return entries;
}

// --- Skills ---

function parseSkills(text: string): Skill[] {
  if (!text) return [];
  const cleaned = text.replace(/\[[\]|\s]+\]/g, '');
  const seen = new Set<string>();
  const items = cleaned
    .split(/\n|,|;|•|·|\|/)
    .map(s => normalizeLine(s))
    .filter(s => s.length > 1 && s.length < 40 && !isKnownSectionHeader(s) && !PAGE_MARKER_RE.test(s))
    .filter(s => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return items.map(name => ({
    id: uid(),
    name,
    level: 'intermediate' as const,
  }));
}

// --- Summary ---

function parseSummary(text: string): string {
  if (!text) return '';
  return text.replace(/\*\*/g, '').trim();
}

// --- Projects/Portfolio ---

function parseProjects(text: string): Project[] {
  if (!text) return [];
  const urlRe = /(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-z]{2,}(?:\/[^\s]*)?/gi;
  const urls = text.match(urlRe) || [];
  
  return urls.map(url => {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    const name = url.replace(/https?:\/\//, '').replace(/www\./, '').replace(/\/$/, '');
    return {
      id: uid(),
      name,
      description: '',
      url: cleanUrl,
    };
  });
}

// --- Main export ---

export function parseResumeText(text: string): Partial<ResumeData> {
  const sections = splitSections(text);

  return {
    personalInfo: parsePersonalInfo(sections.header || '', sections.address),
    summary: parseSummary(sections.summary || ''),
    experience: parseExperience(sections.experience || ''),
    education: parseEducation(sections.education || ''),
    skills: parseSkills(sections.skills || ''),
    languages: [] as Language[],
    certifications: [] as Certification[],
    projects: parseProjects(sections.projects || ''),
  };
}
