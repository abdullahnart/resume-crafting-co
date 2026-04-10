import { ResumeData, WorkExperience, Education, Skill, Language, Certification, Project } from '@/types/resume';

const uid = () => crypto.randomUUID();

// --- Coordinate-based PDF text extraction ---
async function extractTextWithStructure(page: any): Promise<string> {
  const content = await page.getTextContent();
  const Y_TOLERANCE = 3;

  const lineMap = new Map<number, Array<{ str: string; x: number; width: number }>>();

  for (const item of content.items as any[]) {
    if (!item.str.trim()) continue;
    const y = Math.round(item.transform[5] / Y_TOLERANCE) * Y_TOLERANCE;
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y)!.push({
      str: item.str,
      x: item.transform[4],
      width: item.width || item.str.length * 5,
    });
  }

  const sortedLines = Array.from(lineMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, items]) => {
      items.sort((a, b) => a.x - b.x);
      let line = '';
      for (let i = 0; i < items.length; i++) {
        if (i > 0 && items[i].x - (items[i - 1].x + items[i - 1].width) > 10) {
          line += '  ';
        }
        line += items[i].str;
      }
      return line;
    });

  return sortedLines.join('\n');
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
  projects: /^(?:PROJECTS?|PORTFOLIO)\s*$/im,
  address: /^(?:ADDRESS|CONTACT)\s*$/im,
};

function splitSections(text: string): Record<string, string> {
  const lines = text.split('\n');
  const sections: { key: string; lineIdx: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
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

const DATE_RE = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}|\d{1,2}\/\d{4}|\d{4}/gi;
const DURATION_RE = /(\d+\s*(?:months?|years?)\s*(?:of\s*)?experience|\d+\s*months?\s*experience)/i;
const DATE_RANGE_RE = /(\d{4})\s*(?:to|-|–|—)\s*(\d{4}|present|current|now)/i;

function parseExperience(text: string): WorkExperience[] {
  if (!text) return [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const entries: WorkExperience[] = [];
  let current: Partial<WorkExperience> | null = null;

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
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBullet = /^[•\-–—*►▪]\s/.test(line) || /^\d+\.\s/.test(line);
    const isHr = /^-{3,}$/.test(line) || /^_{3,}$/.test(line) || line === '---PAGE_BREAK---';

    if (isHr) continue;

    // Detect "Company | Role" or "Company | Role | ..." pattern
    const pipeMatch = line.match(/^(.+?)\s*\|\s*(.+?)(?:\s*\|.*)?$/);
    // Detect "Currently Work Here" or duration/date range lines
    const isCurrently = /currently\s*work\s*here/i.test(line);
    const durationMatch = line.match(DURATION_RE);
    const dateRangeMatch = line.match(DATE_RANGE_RE);
    
    if (pipeMatch && !isBullet) {
      // New entry: "Company | Role"
      flushCurrent();
      current = {
        company: pipeMatch[1].trim(),
        role: pipeMatch[2].trim(),
        startDate: '',
        endDate: '',
        current: false,
        bullets: [],
      };
      continue;
    }

    // Bold company + role on separate lines pattern:
    // "**Company Name**" followed by "**Role**"
    const boldMatch = line.match(/^\*?\*?(.+?)\*?\*?$/);
    const isBoldLine = line.startsWith('**') && line.endsWith('**');

    if (isCurrently && current) {
      current.current = true;
      current.endDate = 'Present';
      continue;
    }

    if (durationMatch || dateRangeMatch) {
      // This is a date/duration line for the current or upcoming entry
      if (dateRangeMatch) {
        if (current) {
          current.startDate = dateRangeMatch[1];
          current.endDate = dateRangeMatch[2];
          current.current = /present|current|now/i.test(dateRangeMatch[2]);
        }
      }
      // Check if this line also contains company/role info
      const cleanLine = line.replace(DURATION_RE, '').replace(DATE_RANGE_RE, '').trim();
      if (cleanLine.length > 2 && !current) {
        flushCurrent();
        current = { company: cleanLine, role: '', startDate: '', endDate: '', current: false, bullets: [] };
      }
      continue;
    }

    // Detect bold company + role lines (non-bullet, short, bold markers)
    if (isBoldLine && !isBullet && line.length < 80) {
      const content = line.replace(/\*\*/g, '').trim();
      if (current && !current.role) {
        // This could be the role line after a company
        current.role = content;
      } else if (current && !current.company) {
        current.company = content;
      } else {
        // Could be a new company name
        // Look ahead for role
        const nextLine = lines[i + 1]?.trim() || '';
        const nextBold = nextLine.startsWith('**') && nextLine.endsWith('**');
        if (nextBold) {
          flushCurrent();
          current = {
            company: content,
            role: nextLine.replace(/\*\*/g, '').trim(),
            startDate: '',
            endDate: '',
            current: false,
            bullets: [],
          };
          i++; // skip next line
        }
      }
      continue;
    }

    if (isBullet && current) {
      const bullet = line.replace(/^[•\-–—*►▪]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      // Clean bold markers from bullets
      const cleanBullet = bullet.replace(/\*\*/g, '');
      if (cleanBullet) current.bullets = [...(current.bullets || []), cleanBullet];
      continue;
    }

    // Non-bullet, non-header line - could be a plain text entry header
    if (!isBullet && line.length < 100 && !current) {
      // Possible start of entry without pipe
      flushCurrent();
      current = { company: line, role: '', startDate: '', endDate: '', current: false, bullets: [] };
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

  for (const line of lines) {
    const isBullet = /^[•\-–—*►▪]\s/.test(line);
    const cleanLine = line.replace(/^[•\-–—*►▪]\s*/, '').replace(/\*\*/g, '').trim();
    
    if (!cleanLine) continue;

    // Pattern: "Degree: details" or "Degree from School"
    const colonMatch = cleanLine.match(/^(.+?):\s*(.+)$/);
    const fromMatch = cleanLine.match(/^(.+?)\s+[Ff]rom\s+(.+)$/);

    if (colonMatch) {
      const degree = colonMatch[1].trim();
      const rest = colonMatch[2].trim();
      // Check if rest contains "from"
      const fromInRest = rest.match(/^(.+?)\s+[Ff]rom\s+(.+)$/);
      if (fromInRest) {
        entries.push({
          id: uid(),
          school: fromInRest[2].trim().replace(/\.$/, ''),
          degree: degree,
          field: fromInRest[1].trim(),
          startDate: '',
          endDate: '',
          gpa: '',
        });
      } else {
        // The rest might be "from School" already handled or just a field description
        entries.push({
          id: uid(),
          school: rest.replace(/\.$/, ''),
          degree: degree,
          field: '',
          startDate: '',
          endDate: '',
          gpa: '',
        });
      }
    } else if (fromMatch) {
      entries.push({
        id: uid(),
        school: fromMatch[2].trim().replace(/\.$/, ''),
        degree: fromMatch[1].trim(),
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
      });
    } else if (isBullet || line.startsWith('*')) {
      // Standalone education item
      const degreeMatch = cleanLine.match(/\b(?:B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|M\.?B\.?A\.?|Ph\.?D\.?|Bachelor|Master|Associate|Doctorate|Doctor|Diploma|Intermediate|Matriculation|H\.?S\.?C|S\.?S\.?C|Bachelors?)\b/i);
      if (degreeMatch) {
        entries.push({
          id: uid(),
          school: cleanLine.replace(degreeMatch[0], '').replace(/in\s+/i, '').trim().replace(/\.$/, ''),
          degree: degreeMatch[0],
          field: '',
          startDate: '',
          endDate: '',
          gpa: '',
        });
      }
    } else {
      // Check if previous entry needs school info
      if (entries.length > 0 && !entries[entries.length - 1].school) {
        entries[entries.length - 1].school = cleanLine.replace(/\.$/, '');
      }
    }
  }

  return entries;
}

// --- Skills ---

function parseSkills(text: string): Skill[] {
  if (!text) return [];
  // Remove progress bar characters like [|||||| ]
  const cleaned = text.replace(/\[[\||\s]+\]/g, '');
  const items = cleaned
    .split(/[,•\-–—;\n]/)
    .map(s => s.replace(/\*\*/g, '').replace(/[:\d]/g, '').trim())
    .filter(s => s.length > 1 && s.length < 40);

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
  const urlRe = /(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[\w.]+(?:\/[\w.-]*)?/gi;
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
