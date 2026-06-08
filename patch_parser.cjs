const fs = require('fs');
let content = fs.readFileSync('src/lib/resumeParser.ts', 'utf8');

// Helper to replace a whole block or line
function replaceSection(oldText, newText) {
  if (content.indexOf(oldText) === -1) {
    console.error('Could not find text:', oldText.substring(0, 100));
    return false;
  }
  content = content.replace(oldText, newText);
  return true;
}

// 1. NON_COMPANY_START_RE
replaceSection(
  'const NON_COMPANY_START_RE = /^(?:build|create|created|customized|developed|design|designed|working|worked|provide|provided|prepare|prepared|coordinate|coordinating|optimi(?:s|z)ed?|implement(?:ed)?|manage(?:d)?|serv(?:e|ed|ing)|architect(?:ed)?|engineer(?:ed)?|ensur(?:e|ed)|integrat(?:e|ed)|enhanc(?:e|ed)|led?)\\b/i;',
  'const NON_COMPANY_START_RE = /^\\b(?:build|create|created|customized|developed|design|designed|working|worked|provide|provided|prepare|prepared|coordinate|coordinating|optimi(?:s|z)ed?|implement(?:ed)?|manage(?:d)?|serv(?:e|ed|ing)|architect(?:ed)?|engineer(?:ed)?|ensur(?:e|ed)|integrat(?:e|ed)|enhanc(?:e|ed)|led?|lead|leading|improve|improving|streamline|streamlined|increase|increasing|achieve|achieved|handle|handled|execute|executed)\\b/i;'
);

// 2. EXPERIENCE_FIELD_LABEL_RE
replaceSection(
  'const EXPERIENCE_FIELD_LABEL_RE = /^(?:key\\s+)?(?:responsibilities?|achievements?|duties|tasks?|description|highlights?|accomplishments?)\\s*:?$/i;',
  'const EXPERIENCE_FIELD_LABEL_RE = /^(?:key\\s+)?(?:responsibilities?|achievements?|duties|tasks?|description|highlights?|accomplishments?)(?:\\s+and\\s+\\w+)?\\s*:?$/i;'
);

// 3. EXPERIENCE_INLINE_LABEL_RE
replaceSection(
  'const EXPERIENCE_INLINE_LABEL_RE = /^(?:key\\s+)?(?:responsibilities?|achievements?|duties|tasks?|description|highlights?|accomplishments?)\\s*:?\\s*/i;',
  'const EXPERIENCE_INLINE_LABEL_RE = /^(?:key\\s+)?(?:responsibilities?|achievements?|duties|tasks?|description|highlights?|accomplishments?)(?:\\s+and\\s+\\w+)?\\s*:?\\s*/i;'
);

// 4. looksLikeStandaloneCompanyLine
replaceSection(
  'return looksLikeCompanyName(normalized) || /^[A-Z][\\w&.-]*(?:\\s+[A-Z][\\w&.-]*){1,4}$/.test(normalized);',
  'const isGenericTitle = /^[A-Z][\\w&.-]*(?:\\s+[A-Z][\\w&.-]*){1,3}$/.test(normalized);\n  return looksLikeCompanyName(normalized) || (isGenericTitle && !looksLikeRoleLabel(normalized) && !NON_COMPANY_START_RE.test(normalized));'
);

// 5. parseExperienceHeaderInfo
replaceSection(
  'if (looksLikeStandaloneCompanyLine(line)) {',
  'if (looksLikeStandaloneCompanyLine(line) || (line.length > 0 && line.length < 50 && looksLikeRoleLine(nextLine))) {'
);

// 6. parseProjects
const oldParseProjects = `function parseProjects(text: string): Project[] {
  if (!text) return [];
  const urlRe = /(?:https?:\\/\\/)?(?:www\\.)?[\\w.-]+\\.[a-z]{2,}(?:\\/[^\\s]*)?/gi;
  const urls = text.match(urlRe) || [];
  
  return urls.map(url => {
    const cleanUrl = url.startsWith('http') ? url : \`https://\${url}\`;
    const name = url.replace(/https?:\\/\\//, '').replace(/www\\./, '').replace(/\\/$/, '');
    return {
      id: uid(),
      name,
      description: '',
      url: cleanUrl,
    };
  });
}`;

const newParseProjects = `function parseProjects(text: string): Project[] {
  if (!text) return [];
  const urlRe = /(?:https?:\\/\\/)?(?:www\\.)?[\\w.-]+\\.[a-z]{2,}(?:\\/[^\\s]*)?/gi;
  const urls = text.match(urlRe) || [];
  
  const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
  if (urls.length > 0 && urls.length >= lines.length / 2) {
    return urls.map(url => {
      const cleanUrl = url.startsWith('http') ? url : \`https://\${url}\`;
      const name = url.replace(/https?:\\/\\//, '').replace(/www\\./, '').replace(/\\/$/, '');
      return { id: uid(), name, description: '', url: cleanUrl };
    });
  }

  const projects: Project[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (PAGE_MARKER_RE.test(line) || isKnownSectionHeader(line)) continue;
    
    const project: Project = { id: uid(), name: normalizeLine(line), description: '', url: '' };
    const urlMatch = line.match(urlRe);
    if (urlMatch) {
      project.url = urlMatch[0].startsWith('http') ? urlMatch[0] : \`https://\${urlMatch[0]}\`;
    }

    while (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (PAGE_MARKER_RE.test(nextLine) || isKnownSectionHeader(nextLine)) break;
      if (BULLET_PREFIX_RE.test(nextLine) || nextLine.length > line.length * 1.2) {
        project.description = [project.description, normalizeLine(nextLine)].filter(Boolean).join(' ');
        i++;
      } else {
        break;
      }
    }
    projects.push(project);
  }
  return projects;
}`;

replaceSection(oldParseProjects, newParseProjects);

fs.writeFileSync('src/lib/resumeParser.ts', content);
