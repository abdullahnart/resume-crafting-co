import { ResumeData, WorkExperience, Education, Skill } from '@/types/resume';

const uid = () => crypto.randomUUID();

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n');
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

// --- Parsing logic ---

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
const LINKEDIN_RE = /linkedin\.com\/in\/[\w-]+/i;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w.]+(?:\/[\w-]*)?/i;
const DATE_RE = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}|\d{1,2}\/\d{4}|\d{4}/gi;

const SECTION_HEADERS: Record<string, RegExp> = {
  summary: /\b(?:summary|objective|profile|about\s*me|professional\s*summary)\b/i,
  experience: /\b(?:experience|work\s*history|employment|professional\s*experience|work\s*experience)\b/i,
  education: /\b(?:education|academic|qualifications|degrees?)\b/i,
  skills: /\b(?:skills|technical\s*skills|core\s*competencies|proficiencies|technologies)\b/i,
  languages: /\b(?:languages?)\b/i,
  certifications: /\b(?:certifications?|licenses?|credentials?)\b/i,
  projects: /\b(?:projects?|portfolio)\b/i,
};

function splitSections(text: string): Record<string, string> {
  const lines = text.split('\n');
  const fullText = lines.join('\n');
  const sections: { key: string; start: number }[] = [];

  for (const [key, re] of Object.entries(SECTION_HEADERS)) {
    const match = re.exec(fullText);
    if (match) sections.push({ key, start: match.index });
  }

  sections.sort((a, b) => a.start - b.start);

  const result: Record<string, string> = {};
  // Everything before first section is "header"
  if (sections.length > 0) {
    result.header = fullText.slice(0, sections[0].start).trim();
  } else {
    result.header = fullText;
  }

  for (let i = 0; i < sections.length; i++) {
    const end = i + 1 < sections.length ? sections[i + 1].start : fullText.length;
    result[sections[i].key] = fullText.slice(sections[i].start, end).trim();
  }

  return result;
}

function parsePersonalInfo(header: string) {
  const lines = header.split('\n').map(l => l.trim()).filter(Boolean);
  const email = header.match(EMAIL_RE)?.[0] || '';
  const phone = header.match(PHONE_RE)?.[0] || '';
  const linkedin = header.match(LINKEDIN_RE)?.[0] || '';

  // Remove email/phone/linkedin from lines to find name and title
  const cleanLines = lines
    .map(l => l.replace(EMAIL_RE, '').replace(PHONE_RE, '').replace(LINKEDIN_RE, '').replace(/[|•·,]/g, ' ').trim())
    .filter(l => l.length > 1);

  const fullName = cleanLines[0] || '';
  const jobTitle = cleanLines[1] || '';

  // Try to find location (city, state pattern)
  const locationMatch = header.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2})\b/);
  const location = locationMatch?.[1] || '';

  // Find website (non-linkedin URL)
  const urls = header.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w.]+(?:\/[\w-]*)?/gi) || [];
  const website = urls.find(u => !u.includes('linkedin.com')) || '';

  return { fullName, jobTitle, email, phone, location, linkedin, website };
}

function parseExperience(text: string): WorkExperience[] {
  if (!text) return [];
  // Remove section header
  const content = text.replace(SECTION_HEADERS.experience, '').trim();
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  const entries: WorkExperience[] = [];
  let current: Partial<WorkExperience> | null = null;

  for (const line of lines) {
    const dates = line.match(DATE_RE);
    const hasDates = dates && dates.length >= 1;
    const isBullet = /^[•\-–—*►▪]/.test(line) || /^\d+\./.test(line);

    if (!isBullet && (hasDates || (line.length < 100 && !line.startsWith(' ')))) {
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
      const cleanLine = line.replace(DATE_RE, '').replace(/[|–—-]/g, ' ').trim();
      const parts = cleanLine.split(/\s{2,}|,\s*/).filter(Boolean);
      current = {
        role: parts[0] || '',
        company: parts[1] || parts[0] || '',
        startDate: dates?.[0] || '',
        endDate: dates?.[1] || '',
        current: /present|current|now/i.test(line),
        bullets: [],
      };
    } else if (current && (isBullet || line.length > 20)) {
      const bullet = line.replace(/^[•\-–—*►▪]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (bullet) current.bullets = [...(current.bullets || []), bullet];
    }
  }

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

  return entries;
}

function parseEducation(text: string): Education[] {
  if (!text) return [];
  const content = text.replace(SECTION_HEADERS.education, '').trim();
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  const entries: Education[] = [];
  let current: Partial<Education> | null = null;

  for (const line of lines) {
    const dates = line.match(DATE_RE);
    const degreeMatch = line.match(/\b(?:B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|M\.?B\.?A\.?|Ph\.?D\.?|Bachelor|Master|Associate|Doctorate|Doctor|Diploma)\b/i);

    if (degreeMatch || dates) {
      if (current) {
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
      const cleanLine = line.replace(DATE_RE, '').replace(/[|–—-]/g, ' ').trim();
      const gpaMatch = line.match(/(?:GPA|gpa)[:\s]*(\d\.\d+)/);
      current = {
        school: cleanLine.replace(degreeMatch?.[0] || '', '').replace(/,/g, '').trim().split(/\s{2,}/)[0] || '',
        degree: degreeMatch?.[0] || '',
        field: '',
        startDate: dates?.[0] || '',
        endDate: dates?.[1] || dates?.[0] || '',
        gpa: gpaMatch?.[1] || '',
      };
    } else if (current && line.length > 2) {
      if (!current.field) current.field = line;
    }
  }

  if (current) {
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

  return entries;
}

function parseSkills(text: string): Skill[] {
  if (!text) return [];
  const content = text.replace(SECTION_HEADERS.skills, '').trim();
  const items = content
    .split(/[,•\-–—|;\n]/)
    .map(s => s.replace(/[:\d]/g, '').trim())
    .filter(s => s.length > 1 && s.length < 40);

  return items.map(name => ({
    id: uid(),
    name,
    level: 'intermediate' as const,
  }));
}

function parseSummary(text: string): string {
  if (!text) return '';
  return text.replace(SECTION_HEADERS.summary, '').trim();
}

export function parseResumeText(text: string): Partial<ResumeData> {
  const sections = splitSections(text);

  return {
    personalInfo: parsePersonalInfo(sections.header || ''),
    summary: parseSummary(sections.summary || ''),
    experience: parseExperience(sections.experience || ''),
    education: parseEducation(sections.education || ''),
    skills: parseSkills(sections.skills || ''),
    languages: [],
    certifications: [],
    projects: [],
  };
}
