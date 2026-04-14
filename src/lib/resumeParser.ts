import { ResumeData, WorkExperience, Education, Skill, Language, Certification, Project } from '@/types/resume';

const uid = () => crypto.randomUUID();

type PositionedTextItem = {
  str: string;
  x: number;
  y: number;
  width: number;
};

type StructuredLine = {
  text: string;
  x: number;
  y: number;
  width: number;
};

type ExperienceDateInfo = Pick<WorkExperience, 'startDate' | 'endDate' | 'current'>;

const STRUCTURED_LINE_Y_TOLERANCE = 3;
const STRUCTURED_LINE_X_GAP_THRESHOLD = 12;
const STRUCTURED_LINE_SEGMENT_GAP_THRESHOLD = 72;
const BULLET_LINE_RE = /(^|\n)\s*[•\-–—*►▪]/g;
const BULLET_PREFIX_RE = /^[•\-–—*►▪]\s*/;

const normalizeStructuredText = (value: string) => value.replace(/\s+/g, ' ').trim();

function buildStructuredLines(pageItems: PositionedTextItem[]): StructuredLine[] {
  const lineMap = new Map<number, Array<{ str: string; x: number; width: number }>>();

  for (const item of pageItems) {
    const y = Math.round(item.y / STRUCTURED_LINE_Y_TOLERANCE) * STRUCTURED_LINE_Y_TOLERANCE;
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y)!.push({
      str: item.str,
      x: item.x,
      width: item.width,
    });
  }

  return Array.from(lineMap.entries())
    .sort((a, b) => b[0] - a[0])
    .flatMap(([y, lineItems]) => {
      lineItems.sort((a, b) => a.x - b.x);

      const segments: Array<Array<{ str: string; x: number; width: number }>> = [];
      let currentSegment: Array<{ str: string; x: number; width: number }> = [];

      lineItems.forEach((item, index) => {
        const previous = lineItems[index - 1];
        const gap = previous ? item.x - (previous.x + previous.width) : 0;

        if (currentSegment.length && gap > STRUCTURED_LINE_SEGMENT_GAP_THRESHOLD) {
          segments.push(currentSegment);
          currentSegment = [];
        }

        currentSegment.push(item);
      });

      if (currentSegment.length) segments.push(currentSegment);

      return segments.map(segment => {
        let text = '';

        for (let i = 0; i < segment.length; i++) {
          if (i > 0 && segment[i].x - (segment[i - 1].x + segment[i - 1].width) > STRUCTURED_LINE_X_GAP_THRESHOLD) {
            text += '  ';
          } else if (i > 0) {
            text += ' ';
          }

          text += segment[i].str;
        }

        const minX = Math.min(...segment.map(item => item.x));
        const maxX = Math.max(...segment.map(item => item.x + item.width));

        return {
          text: normalizeStructuredText(text),
          x: minX,
          y,
          width: maxX - minX,
        };
      });
    })
    .filter(line => line.text);
}

const linesToText = (lines: StructuredLine[]) => lines.map(line => line.text).join('\n');

// --- Coordinate-based PDF text extraction ---
async function extractTextWithStructure(page: any): Promise<string> {
  const content = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });

  const items: PositionedTextItem[] = (content.items as any[])
    .filter(item => item.str?.trim())
    .map(item => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width || item.str.length * 5,
    }));

  const lines = buildStructuredLines(items);

  const midX = viewport.width / 2;
  const leftLines = lines.filter(line => line.x + line.width / 2 < midX);
  const rightLines = lines.filter(line => line.x + line.width / 2 >= midX);

  const leftText = linesToText(leftLines);
  const rightText = linesToText(rightLines);
  const sidebarRe = /(^|\n)(ADDRESS|ABOUT\s*ME|SKILLS|CONTACT)(\n|$)/i;
  const mainContentScore = (value: string) => {
    const bullets = (value.match(BULLET_LINE_RE) || []).length;
    const jobs = (value.match(/\|/g) || []).length;
    return bullets * 2 + jobs;
  };

  const hasSidebarSplit = leftLines.length >= 12
    && rightLines.length >= 12
    && (sidebarRe.test(leftText) || sidebarRe.test(rightText));

  if (hasSidebarSplit) {
    const [primaryLines, secondaryLines] = mainContentScore(leftText) >= mainContentScore(rightText)
      ? [leftLines, rightLines]
      : [rightLines, leftLines];

    const metadataLines: StructuredLine[] = [];
    const sidebarLines: StructuredLine[] = [];
    let insideSidebar = false;

    for (const line of secondaryLines) {
      const normalized = normalizeStructuredText(line.text);
      if (!normalized) continue;

      if (sidebarRe.test(normalized)) {
        insideSidebar = true;
        sidebarLines.push(line);
        continue;
      }

      const looksLikeMainMetadata = /^(?:WORK|EXPERIENCE|WORK\s*EXPERIENCE|WORK\s*HISTORY|EMPLOYMENT)$/i.test(normalized)
        || CURRENTLY_WORKING_RE.test(normalized)
        || DATE_RANGE_RE.test(normalized)
        || DURATION_RE.test(normalized)
        || /^\d{4}\s*(?:to|-|–|—)\s*(?:\d{4}|present|current|now)$/i.test(normalized)
        || /^(?:\d+(?:\.\d+)?(?:\s+years?(?:\s+of)?|\s+months?)?|years?(?:\s+of)?|months?|month|experience)$/i.test(normalized)
        || line.x >= midX * 0.55;

      if (looksLikeMainMetadata) {
        metadataLines.push(line);
        continue;
      }

      if (insideSidebar) {
        sidebarLines.push(line);
        continue;
      }

      metadataLines.push(line);
    }

    const sortLines = (a: StructuredLine, b: StructuredLine) => b.y - a.y || a.x - b.x;

    return [
      linesToText([...primaryLines, ...metadataLines].sort(sortLines)),
      linesToText([...sidebarLines].sort(sortLines)),
    ].filter(Boolean).join('\n');
  }

  return linesToText(lines);
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

const PAGE_MARKER_RE = /^(?:page\s+\d+|---PAGE_BREAK---)$/i;

const stripFormatting = (value: string) => value
  .replace(/^#+\s*/, '')
  .replace(/^\*+|\*+$/g, '')
  .replace(/\*\*/g, '')
  .trim();
const normalizeLine = (value: string) => stripFormatting(value).replace(/\s+/g, ' ').trim();
const normalizeSectionCandidate = (value: string) => normalizeLine(value).replace(/:$/, '').trim();

function isKnownSectionHeader(line: string): boolean {
  const normalized = normalizeSectionCandidate(line);
  return Object.values(SECTION_HEADERS).some(re => re.test(normalized));
}

function looksLikeExperienceContinuation(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;

  const bulletCount = (normalized.match(BULLET_LINE_RE) || []).length;
  const hasDateInfo = DATE_RANGE_RE.test(normalized) || DURATION_RE.test(normalized) || CURRENTLY_WORKING_RE.test(normalized);
  const hasRoleKeyword = /\b(?:developer|engineer|designer|manager|internship|intern|executive|lead|specialist)\b/i.test(normalized);

  return bulletCount >= 2 && hasDateInfo && hasRoleKeyword;
}

function looksLikeExperienceEntryStart(line: string): boolean {
  const normalized = normalizeLine(line);
  if (!normalized || PAGE_MARKER_RE.test(normalized) || isKnownSectionHeader(normalized)) return false;

  if (normalized.includes('|')) return true;

  return /\b(?:developer|engineer|designer|manager|internship|intern|executive|lead|specialist)\b/i.test(normalized)
    && /\b(?:ltd|pvt|labs?|technology|digital|global|solutions?|company|studio)\b/i.test(normalized);
}

function moveHeaderExperienceBlock(result: Record<string, string>) {
  const header = result.header;
  if (!header) return;

  const lines = header.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length < 4) return;

  const experienceStartIndex = lines.findIndex((line, index) => index >= 2 && (
    looksLikeExperienceEntryStart(line)
    || CURRENTLY_WORKING_RE.test(normalizeLine(line))
    || Boolean(extractDateInfo(line))
  ));

  if (experienceStartIndex <= 0) return;

  const preservedHeader = lines.slice(0, experienceStartIndex).join('\n').trim();
  const recoveredExperience = lines.slice(experienceStartIndex).join('\n').trim();
  if (!recoveredExperience) return;

  result.header = preservedHeader;
  result.experience = [recoveredExperience, result.experience].filter(Boolean).join('\n').trim();
}

function moveContinuationBlock(
  result: Record<string, string>,
  sourceKey: string,
  targetKey: string,
  predicate: (value: string) => boolean,
) {
  const source = result[sourceKey];
  if (!source?.includes('---PAGE_BREAK---')) return;

  const blocks = source.split(/\n?---PAGE_BREAK---\n?/).map(block => block.trim()).filter(Boolean);
  if (blocks.length < 2) return;

  const keptBlocks: string[] = [];
  const movedBlocks: string[] = [];

  blocks.forEach((block, index) => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const nextSectionIndex = lines.findIndex((line, lineIndex) => lineIndex > 0 && isKnownSectionHeader(line));
    const candidate = (nextSectionIndex === -1 ? lines : lines.slice(0, nextSectionIndex)).join('\n').trim();
    const remainder = (nextSectionIndex === -1 ? [] : lines.slice(nextSectionIndex)).join('\n').trim();

    if (index > 0 && predicate(candidate)) {
      movedBlocks.push(candidate);
      if (remainder) keptBlocks.push(remainder);
      return;
    }

    keptBlocks.push(block);
  });

  if (!movedBlocks.length) return;

  result[sourceKey] = keptBlocks.join('\n').trim();
  result[targetKey] = [result[targetKey], ...movedBlocks].filter(Boolean).join('\n').trim();
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

  moveContinuationBlock(result, 'skills', 'experience', looksLikeExperienceContinuation);
  moveHeaderExperienceBlock(result);

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
const CURRENTLY_WORKING_RE = /currently\s*(?:work|working)(?:\s*here)?/i;

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

function looksLikeCompanyName(value: string): boolean {
  return /\b(?:ltd|pvt|labs?|technology|digital|global|solutions?|company|studio|agency)\b/i.test(value)
    && !value.includes('|');
}

function looksLikeRoleContinuation(value: string): boolean {
  const normalized = normalizeLine(value);
  if (!normalized || PAGE_MARKER_RE.test(normalized) || isKnownSectionHeader(normalized)) return false;
  if (looksLikeCompanyName(normalized)) return false;
  if (Boolean(extractDateInfo(normalized)) || CURRENTLY_WORKING_RE.test(normalized)) return false;
  if (/[.!?]$/.test(normalized)) return false;
  if (/^(?:build|create|created|customized|developed|design|designed|working|worked|provide|provided|prepare|prepared|coordinate|coordinating)\b/i.test(normalized)) return false;
  return normalized.length < 100
    && (normalized.includes('|') || /\b(?:developer|engineer|designer|manager|internship|intern|executive|lead|specialist|wordpress|frontend|backend|cms)\b/i.test(normalized));
}

function splitCombinedCompanyRole(value: string): { company: string; role: string } | null {
  const normalized = normalizeLine(value);
  if (!normalized || normalized.includes('|')) return null;
  if (!/^[A-Z]/.test(normalized)) return null;
  if (/^(?:build|create|created|customized|developed|design|designed|working|worked|provide|provided|prepare|prepared|coordinate|coordinating)\b/i.test(normalized)) return null;

  const roleMatch = normalized.match(/\b(?:Internship|Intern|Jr\.?|Junior|Sr\.?|Senior|Lead|Executive|Frontend|Backend|Full\s*Stack|CMS|Wordpress|Developer|Engineer|Designer|Manager|Specialist)\b/i);
  if (!roleMatch || roleMatch.index === undefined || roleMatch.index <= 0) return null;

  const company = normalized.slice(0, roleMatch.index).trim();
  const role = normalized.slice(roleMatch.index).trim();

  if (!company || !role) return null;
  if (company.split(/\s+/).length < 2) return null;

  return { company, role };
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
  let pendingCurrentEntry = false;

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

  const isStubEntry = () => Boolean(current?.company && !current.role && !(current.bullets?.length));

  const startEntry = (company: string, role = '') => {
    if (isStubEntry()) {
      current = {
        ...current,
        company: normalizeLine(company),
        role: normalizeLine(role),
      };
    } else {
      flushCurrent();
      current = {
        company: normalizeLine(company),
        role: normalizeLine(role),
        startDate: '',
        endDate: '',
        current: false,
        bullets: [],
      };
    }

    if (pendingCurrentEntry) {
      applyDateInfo(current, { endDate: 'Present', current: true });
      pendingCurrentEntry = false;
    } else if (pendingDateInfo) {
      applyDateInfo(current, pendingDateInfo);
      pendingDateInfo = null;
    }
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

    if (pendingCurrentEntry && /^here$/i.test(line)) continue;

    if (CURRENTLY_WORKING_RE.test(line)) {
      if (current) {
        applyDateInfo(current, { endDate: 'Present', current: true });
      } else {
        pendingCurrentEntry = true;
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
      if (current && current.role && !(current.bullets?.length) && !looksLikeCompanyName(pipeParts[0])) {
        current.role = [current.role, line].filter(Boolean).join(' | ').replace(/\s*\|\s*/g, ' | ').trim();
        continue;
      }

      startEntry(pipeParts[0], pipeParts.slice(1).join(' | '));
      continue;
    }

    if (isBoldLine && isNextBoldLine && !isBullet) {
      startEntry(line, nextLine);
      i++;
      continue;
    }

    if (current && current.role && !(current.bullets?.length) && !isBullet && looksLikeRoleContinuation(rawLine)) {
      current.role = [current.role, line].filter(Boolean).join(' ').replace(/\s{2,}/g, ' ').trim();
      continue;
    }

    if (isBullet && current) {
      const cleanBullet = line.replace(BULLET_PREFIX_RE, '').replace(/^\d+\.\s*/, '').trim();
      if (cleanBullet) current.bullets = [...(current.bullets || []), cleanBullet];
      continue;
    }

    if (current && !current.role && line.length < 100 && !extractDateInfo(line)) {
      current.role = line;
      continue;
    }

    if (!isBullet && line.length < 100 && !current) {
      const combinedEntry = splitCombinedCompanyRole(line);
      if (combinedEntry) {
        startEntry(combinedEntry.company, combinedEntry.role);
      } else {
        startEntry(line);
      }
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
    const isBullet = /^[•\-–—►▪]\s/.test(rawLine) || /^\d+\.\s/.test(rawLine);
    const cleanLine = normalizeLine(rawLine.replace(/^[•\-–—►▪]\s*/, '').replace(/^\d+\.\s*/, ''));
    
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
    .split(/\n|,|;|•|·|/)
    .map(s => normalizeLine(s))
    .filter(s => s.length > 1 && s.length < 40 && !isKnownSectionHeader(s) && !PAGE_MARKER_RE.test(s))
    .filter(s => !DATE_RANGE_RE.test(s) && !DURATION_RE.test(s) && !CURRENTLY_WORKING_RE.test(s))
    .filter(s => !/(https?:\/\/|www\.|linkedin\.com)/i.test(s))
    .filter(s => !looksLikeExperienceEntryStart(s))
    .filter(s => !looksLikeCompanyName(s))
    .filter(s => !/\b(?:developer|engineer|designer|manager|internship|intern|executive|lead|specialist)\b/i.test(s))
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
