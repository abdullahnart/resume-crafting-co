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
type ExperienceBlock = {
  prelude: string[];
  lines: string[];
};

const STRUCTURED_LINE_Y_TOLERANCE = 3;
const STRUCTURED_LINE_X_GAP_THRESHOLD = 12;
const STRUCTURED_LINE_SEGMENT_GAP_THRESHOLD = 72;
const BULLET_LINE_RE = /(^|\n)\s*[•\-–—*►▪]/g;
const BULLET_PREFIX_RE = /^[•\-–—*►▪]\s*/;

const normalizeStructuredText = (value: string) => value.replace(/\s+/g, ' ').trim();

const STRUCTURAL_SECTION_WORDS = new Set([
  'WORK',
  'EXPERIENCE',
  'WORK EXPERIENCE',
  'WORK HISTORY',
  'EMPLOYMENT',
  'PROFESSIONAL EXPERIENCE',
  'ADDRESS',
  'CONTACT',
  'ABOUT ME',
  'SUMMARY',
  'OBJECTIVE',
  'PROFILE',
  'PROFESSIONAL SUMMARY',
  'SKILLS',
  'TECHNICAL SKILLS',
  'CORE COMPETENCIES',
  'PROFICIENCIES',
  'TECHNOLOGIES',
  'EDUCATION',
  'ACADEMIC',
  'QUALIFICATIONS',
  'LANGUAGE',
  'LANGUAGES',
  'CERTIFICATION',
  'CERTIFICATIONS',
  'LICENSE',
  'LICENSES',
  'CREDENTIALS',
  'PROJECT',
  'PROJECTS',
  'PORTFOLIO',
  'LINKS',
]);

const isStructuralSectionHeading = (value: string) => STRUCTURAL_SECTION_WORDS.has(normalizeStructuredText(value).replace(/:$/, '').toUpperCase());

function splitLineAtSectionHeadings(line: StructuredLine): StructuredLine[] {
  const raw = normalizeStructuredText(line.text);
  const pattern = /\b(?:WORK|EXPERIENCE|WORK\s+EXPERIENCE|WORK\s+HISTORY|EMPLOYMENT|PROFESSIONAL\s+EXPERIENCE|ADDRESS|CONTACT|ABOUT\s+ME|SUMMARY|OBJECTIVE|PROFILE|PROFESSIONAL\s+SUMMARY|SKILLS|TECHNICAL\s+SKILLS|CORE\s+COMPETENCIES|PROFICIENCIES|TECHNOLOGIES|EDUCATION|ACADEMIC|QUALIFICATIONS|LANGUAGES?|CERTIFICATIONS?|LICENSES?|CREDENTIALS|PROJECTS?|PORTFOLIO|LINKS):?\b/gi;
  const matches = Array.from(raw.matchAll(pattern)).filter(match => match.index !== undefined && isStructuralSectionHeading(match[0]));
  if (!matches.length) return [line];

  const pieces: string[] = [];
  let cursor = 0;

  for (const match of matches) {
    const index = match.index || 0;
    if (index > cursor) pieces.push(raw.slice(cursor, index).trim());
    pieces.push(match[0].trim());
    cursor = index + match[0].length;
  }

  if (cursor < raw.length) pieces.push(raw.slice(cursor).trim());
  const cleanPieces = pieces.filter(Boolean);
  if (cleanPieces.length <= 1) return [line];

  const approximateCharWidth = raw.length ? line.width / raw.length : line.width;
  let offset = 0;

  return cleanPieces.map(piece => {
    const index = raw.indexOf(piece, offset);
    if (index >= 0) offset = index + piece.length;
    return {
      ...line,
      text: piece,
      x: line.x + Math.max(0, index) * approximateCharWidth,
      width: Math.max(approximateCharWidth * piece.length, 1),
    };
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise(resolve => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, timeoutMs);

    promise
      .then(value => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(value);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(fallback);
        }
      });
  });
}

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

  const lines = buildStructuredLines(items).flatMap(splitLineAtSectionHeadings);

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

export async function extractFirstImageFromPDF(file: File): Promise<string> {
  try {
    const pdfjsLib: any = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const page = await pdf.getPage(1);
    const ops = await page.getOperatorList();
    const OPS = pdfjsLib.OPS;
    const imgNames: string[] = [];
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintInlineImageXObject) {
        const arg = ops.argsArray[i]?.[0];
        if (typeof arg === 'string') imgNames.push(arg);
      }
    }
    type Candidate = { name: string; img: any; w: number; h: number; score: number };
    const candidates: Candidate[] = [];
    const startedAt = Date.now();
    for (const name of Array.from(new Set(imgNames))) {
      if (Date.now() - startedAt > 2500) break;

      const img: any = await withTimeout(new Promise(resolve => {
        try {
          page.objs.get(name, (o: any) => resolve(o));
        } catch {
          resolve(null);
        }
      }), 250, null);
      if (!img) continue;
      const w = img.width || img.bitmap?.width;
      const h = img.height || img.bitmap?.height;
      if (!w || !h || w < 40 || h < 40) continue;
      const ratio = w / h;
      // Score: prefer square/portrait images close to ratio 1
      const ratioScore = 1 - Math.min(1, Math.abs(1 - ratio));
      const sizeScore = Math.min(1, (w * h) / (300 * 300));
      candidates.push({ name, img, w, h, score: ratioScore * 0.7 + sizeScore * 0.3 });
    }
    // Sort best candidates first; fall back to any image if none look like a photo
    candidates.sort((a, b) => b.score - a.score);
    for (const { img, w, h } of candidates) {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      try {
        if (img.bitmap) {
          ctx.drawImage(img.bitmap, 0, 0);
        } else if (img.data) {
          const imageData = ctx.createImageData(w, h);
          const src = img.data;
          if (src.length === w * h * 3) {
            for (let j = 0, k = 0; j < src.length; j += 3, k += 4) {
              imageData.data[k] = src[j];
              imageData.data[k + 1] = src[j + 1];
              imageData.data[k + 2] = src[j + 2];
              imageData.data[k + 3] = 255;
            }
          } else if (src.length === w * h * 4) {
            imageData.data.set(src);
          } else {
            continue;
          }
          ctx.putImageData(imageData, 0, 0);
        } else {
          continue;
        }
        return canvas.toDataURL('image/jpeg', 0.85);
      } catch {
        continue;
      }
    }

  } catch {
    // ignore
  }
  return '';
}

export async function extractFirstImageFromDOCX(file: File): Promise<string> {
  try {
    const mammoth: any = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    let firstImage = '';
    await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammoth.images.imgElement((image: any) =>
          image.read('base64').then((data: string) => {
            if (!firstImage) firstImage = `data:${image.contentType};base64,${data}`;
            return { src: '' };
          })
        ),
      }
    );
    return firstImage;
  } catch {
    return '';
  }
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

export async function extractFirstImageFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return extractFirstImageFromPDF(file);
  if (ext === 'docx' || ext === 'doc') return extractFirstImageFromDOCX(file);
  return '';
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
  const hasRoleKeyword = JOB_TITLE_RE.test(normalized);

  return bulletCount >= 2 && hasDateInfo && hasRoleKeyword;
}

function looksLikeExperienceEntryStart(line: string): boolean {
  const normalized = normalizeLine(line);
  if (!normalized || PAGE_MARKER_RE.test(normalized) || isKnownSectionHeader(normalized)) return false;

  if (normalized.includes('|')) return true;

  return JOB_TITLE_RE.test(normalized)
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
const JOB_TITLE_RE = /\b(?:developer|engineer|designer|manager|internship|intern|executive|lead|specialist)\b/i;
const ROLE_HINT_RE = /\b(?:jr\.?|sr\.?|junior|senior|lead|principal|staff|assistant|associate|internship|intern|frontend|front\s*end|backend|back\s*end|full\s*stack|cms|wordpress|web|software|product|project|qa|ui|ux)\b/i;
const ACHIEVEMENT_START_RE = /^(?:advanced|more\s+expertise|theme\s+and\s+plugin\s+customization|wordpress\s+custom\s+functionality|website\s+speed\s+optimization|custom\s+theme\s+development|design\s+email\s+template|psd\s+to\s+wordpress|theme\s+customization|paypal|stripe|expert\s+in|create|created|build|built|custom(?:ize|ized)|develop|developed|design|designed|working|worked|provide|provided|prepare|prepared|write|wrote|coordinate|coordinating|optimi(?:s|z)e(?:d)?|implement|implemented|manage|managed|lead|led)\b/i;
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

function extractAchievementCandidate(value: string): string {
  return cleanExperienceBullet(value)
    .replace(/^(?:\d+(?:\.\d+)?\s*)?(?:(?:months?|month|years?|year)(?:\s+of)?\s*)?(?:experience\b\s*)?/i, '')
    .replace(/^(?:of\b\s*)+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function isBareExperienceMetadata(value: string): boolean {
  const normalized = normalizeLine(value);
  if (!normalized) return true;
  if (PAGE_MARKER_RE.test(normalized) || isKnownSectionHeader(normalized)) return true;
  if (CURRENTLY_WORKING_RE.test(normalized) || Boolean(extractDateInfo(normalized))) return true;
  return !extractAchievementCandidate(normalized);
}

function looksLikeCompanyName(value: string): boolean {
  return /\b(?:ltd|pvt|labs?|technology|digital|global|solutions?|company|studio|agency)\b/i.test(value)
    && !value.includes('|');
}

function looksLikeRoleLabel(value: string): boolean {
  const normalized = normalizeLine(value);
  if (!normalized) return false;

  return JOB_TITLE_RE.test(normalized)
    || ROLE_HINT_RE.test(normalized)
    || /\b(?:developer|engineer|designer|manager|specialist|executive|internship|intern|consultant|architect|analyst|coordinator)\b$/i.test(normalized);
}

function expandExperienceLines(text: string): string[] {
  return text
    .split('\n')
    .flatMap(rawLine => {
      const trimmed = rawLine.trim();
      if (!trimmed) return [];

      const inlineBulletMatch = trimmed.match(/^(.*?)([•►▪].+)$/);
      if (inlineBulletMatch && inlineBulletMatch[1].trim()) {
        return [inlineBulletMatch[1].trim(), inlineBulletMatch[2].trim()];
      }

      return [trimmed];
    });
}

function looksLikeStandaloneCompanyLine(value: string): boolean {
  const normalized = normalizeLine(value);
  if (!normalized || normalized.includes('|') || PAGE_MARKER_RE.test(normalized) || isKnownSectionHeader(normalized)) return false;
  if (Boolean(extractDateInfo(normalized)) || CURRENTLY_WORKING_RE.test(normalized)) return false;
  if (/[.!?]$/.test(normalized)) return false;
  if (/^(?:build|create|created|customized|developed|design|designed|working|worked|provide|provided|prepare|prepared|coordinate|coordinating|optimi(?:s|z)ed?|implement(?:ed)?|manage(?:d)?)\b/i.test(normalized)) return false;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 7) return false;
  if (looksLikeRoleLabel(normalized) && !looksLikeCompanyName(normalized)) return false;

  return looksLikeCompanyName(normalized) || /^[A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*){1,4}$/.test(normalized);
}

function looksLikeRoleLine(value: string): boolean {
  const normalized = normalizeLine(value);
  if (!normalized || PAGE_MARKER_RE.test(normalized) || isKnownSectionHeader(normalized)) return false;
  if (Boolean(extractDateInfo(normalized)) || CURRENTLY_WORKING_RE.test(normalized)) return false;
  if (looksLikeStandaloneCompanyLine(normalized) || looksLikeCompanyName(normalized)) return false;

  return looksLikeRoleLabel(normalized);
}

function looksLikeRoleTail(value: string): boolean {
  const normalized = normalizeLine(value);
  return /^(?:web\s+developer|wordpress\s+developer|developer|engineer|designer|manager|specialist)$/i.test(normalized);
}

function cleanExperienceBullet(value: string): string {
  return normalizeLine(value)
    .replace(/^here\b\s*/i, '')
    .replace(/^(?:months?|month|years?|experience)\b\s*/i, '')
    .replace(DURATION_RE, '')
    .replace(DATE_RANGE_RE, '')
    .replace(CURRENTLY_WORKING_RE, '')
    .replace(BULLET_PREFIX_RE, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function looksLikeAchievementLine(value: string): boolean {
  const normalized = extractAchievementCandidate(value);
  if (!normalized || PAGE_MARKER_RE.test(normalized) || isKnownSectionHeader(normalized)) return false;
  if (Boolean(extractDateInfo(normalized)) || CURRENTLY_WORKING_RE.test(normalized)) return false;
  if (looksLikeStandaloneCompanyLine(normalized) || looksLikeCompanyName(normalized)) return false;
  if (looksLikeRoleLine(normalized) && !ACHIEVEMENT_START_RE.test(normalized)) return false;
  if (normalized.length < 3 || normalized.length > 220) return false;

  return ACHIEVEMENT_START_RE.test(normalized)
    || /^[a-z]/.test(normalized)
    || /[.!?]$/.test(normalized)
    || /\b(?:woocommerce|shopify|webflow|elementor|wordpress|divi|avada|lottie|bigcommerce|wishlist|metafields?|optimization|portfolio|website|theme|plugin|qa|html|css|javascript|php)\b/i.test(normalized);
}

function looksLikeRoleContinuation(value: string): boolean {
  const normalized = normalizeLine(value);
  if (!normalized || PAGE_MARKER_RE.test(normalized) || isKnownSectionHeader(normalized)) return false;
  if (looksLikeCompanyName(normalized)) return false;
  if (Boolean(extractDateInfo(normalized)) || CURRENTLY_WORKING_RE.test(normalized)) return false;
  if (/\b(?:months?|month|years?|year|experience)\b/i.test(normalized)) return false;
  if (/[.!?]$/.test(normalized)) return false;
  if (/^(?:build|create|created|customized|developed|design|designed|working|worked|provide|provided|prepare|prepared|coordinate|coordinating)\b/i.test(normalized)) return false;
  return normalized.length < 100
    && (normalized.includes('|') || JOB_TITLE_RE.test(normalized));
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

function getExperienceHeaderConsumption(rawLine: string, nextRawLine: string): 0 | 1 | 2 {
  const line = normalizeLine(rawLine);
  const nextLine = normalizeLine(nextRawLine);
  const isBullet = /^[•\-–—*►▪]\s/.test(rawLine) || /^\d+\.\s/.test(rawLine);
  const pipeParts = line.split('|').map(part => part.trim()).filter(Boolean);

  if (isBullet || !line || PAGE_MARKER_RE.test(line) || isKnownSectionHeader(line)) return 0;
  if (splitCombinedCompanyRole(line)) return 1;
  if (pipeParts.length >= 2) {
    if (looksLikeRoleLabel(pipeParts[0]) || looksLikeRoleTail(pipeParts[0])) return 0;
    return 1;
  }
  if (looksLikeStandaloneCompanyLine(line) && looksLikeRoleLine(nextLine)) return 2;
  if (looksLikeStandaloneCompanyLine(line)) return 1;

  return 0;
}

function buildExperienceBlocks(text: string): ExperienceBlock[] {
  const lines = expandExperienceLines(text);
  const blocks: ExperienceBlock[] = [];
  let currentPrelude: string[] = [];
  let currentBlock: string[] = [];
  let trailingMetadata: string[] = [];

  const flushCurrentBlock = () => {
    if (!currentBlock.length) return;
    if (trailingMetadata.length) {
      currentBlock.push(...trailingMetadata);
      trailingMetadata = [];
    }

    blocks.push({
      prelude: currentPrelude,
      lines: currentBlock,
    });

    currentPrelude = [];
    currentBlock = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = normalizeLine(rawLine);
    const nextRawLine = lines[i + 1] || '';

    if (!line || PAGE_MARKER_RE.test(line) || isKnownSectionHeader(line)) continue;

    const headerConsumption = getExperienceHeaderConsumption(rawLine, nextRawLine);
    if (headerConsumption) {
      if (currentBlock.length) {
        blocks.push({ prelude: currentPrelude, lines: currentBlock });
        currentPrelude = trailingMetadata;
      }

      currentBlock = [rawLine];
      trailingMetadata = [];

      if (headerConsumption === 2) {
        currentBlock.push(nextRawLine);
        i++;
      }

      continue;
    }

    const metadataOnly = isBareExperienceMetadata(rawLine);

    if (!currentBlock.length) {
      if (metadataOnly) currentPrelude.push(rawLine);
      continue;
    }

    if (metadataOnly) {
      trailingMetadata.push(rawLine);
      continue;
    }

    if (trailingMetadata.length) {
      currentBlock.push(...trailingMetadata);
      trailingMetadata = [];
    }

    currentBlock.push(rawLine);
  }

  flushCurrentBlock();
  return blocks;
}

function parseExperience(text: string): WorkExperience[] {
  if (!text) return [];
  const entries: WorkExperience[] = [];
  const appendBullet = (target: Partial<WorkExperience>, value: string) => {
    const cleanBullet = extractAchievementCandidate(value);
    if (!cleanBullet) return;

    const existingBullets = [...(target.bullets || [])];
    const shouldMergeWithPrevious = existingBullets.length > 0
      && /^[a-z]/.test(cleanBullet)
      && !/^(?:create|created|build|built|custom(?:ize|ized)|develop|developed|design|designed|working|worked|provide|provided|prepare|prepared|write|wrote|coordinate|coordinating|optimi(?:s|z)e(?:d)?|implement|implemented|manage|managed|lead|led|advanced|more\s+expertise|theme\s+and\s+plugin\s+customization|wordpress\s+custom\s+functionality|paypal|stripe|expert\s+in)\b/i.test(cleanBullet);

    if (shouldMergeWithPrevious) {
      existingBullets[existingBullets.length - 1] = `${existingBullets[existingBullets.length - 1]} ${cleanBullet}`.replace(/\s{2,}/g, ' ').trim();
      target.bullets = existingBullets;
      return;
    }

    target.bullets = [...existingBullets, cleanBullet];
  };

  const blocks = buildExperienceBlocks(text);

  for (const block of blocks) {
    const entry: Partial<WorkExperience> = {
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [],
    };

    const blockLines = [...block.lines];
    let lineIndex = 0;
    const firstLine = normalizeLine(blockLines[0] || '');
    const secondLine = normalizeLine(blockLines[1] || '');
    const firstCombinedEntry = splitCombinedCompanyRole(firstLine);
    const firstPipeParts = firstLine.split('|').map(part => part.trim()).filter(Boolean);

    if (firstCombinedEntry) {
      entry.company = firstCombinedEntry.company;
      entry.role = firstCombinedEntry.role;
      lineIndex = 1;
    } else if (firstPipeParts.length >= 2) {
      entry.company = firstPipeParts[0];
      entry.role = firstPipeParts.slice(1).join(' | ');
      lineIndex = 1;
    } else if (looksLikeStandaloneCompanyLine(firstLine)) {
      entry.company = firstLine;
      lineIndex = 1;

      if (looksLikeRoleLine(secondLine)) {
        entry.role = secondLine;
        lineIndex = 2;
      }
    } else {
      entry.company = firstLine;
      lineIndex = 1;
    }

    for (const rawPreludeLine of block.prelude) {
      const preludeLine = normalizeLine(rawPreludeLine);
      if (CURRENTLY_WORKING_RE.test(preludeLine)) {
        applyDateInfo(entry, { endDate: 'Present', current: true });
        continue;
      }

      const preludeDateInfo = extractDateInfo(preludeLine);
      if (preludeDateInfo && !entry.startDate && !entry.endDate) {
        applyDateInfo(entry, preludeDateInfo);
      }
    }

    for (let i = lineIndex; i < blockLines.length; i++) {
      const rawLine = blockLines[i];
      const line = normalizeLine(rawLine);
      const isBullet = /^[•\-–—*►▪]\s/.test(rawLine) || /^\d+\.\s/.test(rawLine);

      if (!line || PAGE_MARKER_RE.test(line) || isKnownSectionHeader(line)) continue;

      if (CURRENTLY_WORKING_RE.test(line)) {
        applyDateInfo(entry, { endDate: 'Present', current: true });
        continue;
      }

      const dateInfo = extractDateInfo(line);
      if (dateInfo) {
        if (!entry.startDate && !entry.endDate) {
          applyDateInfo(entry, dateInfo);
        }

        if (!cleanExperienceLine(line)) continue;
      }

      if (!entry.role && looksLikeRoleLine(line)) {
        entry.role = line;
        continue;
      }

      if (entry.role && looksLikeRoleContinuation(rawLine) && !(entry.bullets?.length) && !isBullet) {
        entry.role = [entry.role, line].filter(Boolean).join(' ').replace(/\s{2,}/g, ' ').trim();
        continue;
      }

      if (isBareExperienceMetadata(rawLine)) continue;

      if (isBullet || looksLikeAchievementLine(rawLine)) {
        appendBullet(entry, rawLine);
        continue;
      }

      if (entry.role && !looksLikeStandaloneCompanyLine(line) && !looksLikeCompanyName(line) && !looksLikeRoleLine(line)) {
        appendBullet(entry, rawLine);
        continue;
      }

      if (!entry.role && line.length < 100) {
        entry.role = line;
      }
    }

    if (entry.company || entry.role) {
      entries.push({
        id: uid(),
        company: entry.company || '',
        role: entry.role || '',
        startDate: entry.startDate || '',
        endDate: entry.endDate || '',
        current: entry.current || false,
        bullets: entry.bullets || [],
      });
    }
  }

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
