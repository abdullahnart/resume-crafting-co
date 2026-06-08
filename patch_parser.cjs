const fs = require('fs');
let content = fs.readFileSync('src/lib/resumeParser.ts', 'utf8');

function replaceSection(oldText, newText) {
  if (content.indexOf(oldText) === -1) {
    console.error('Could not find text:', oldText.substring(0, 100));
    return false;
  }
  content = content.replace(oldText, newText);
  return true;
}

// Fix NON_COMPANY_START_RE (remove ^\\b)
replaceSection(
  'const NON_COMPANY_START_RE = /^\\b(?:build|create|created|customized|developed|design|designed|working|worked|provide|provided|prepare|prepared|coordinate|coordinating|optimi(?:s|z)ed?|implement(?:ed)?|manage(?:d)?|serv(?:e|ed|ing)|architect(?:ed)?|engineer(?:ed)?|ensur(?:e|ed)|integrat(?:e|ed)|enhanc(?:e|ed)|led?|lead|leading|improve|improving|streamline|streamlined|increase|increasing|achieve|achieved|handle|handled|execute|executed)\\b/i;',
  'const NON_COMPANY_START_RE = /^(?:build|create|created|customized|developed|design|designed|working|worked|provide|provided|prepare|prepared|coordinate|coordinating|optimi(?:s|z)ed?|implement(?:ed)?|manage(?:d)?|serv(?:e|ed|ing)|architect(?:ed)?|engineer(?:ed)?|ensur(?:e|ed)|integrat(?:e|ed)|enhanc(?:e|ed)|led?|lead|leading|improve|improving|streamline|streamlined|increase|increasing|achieve|achieved|handle|handled|execute|executed)\\b/i;'
);

// Fix word count in looksLikeStandaloneCompanyLine
replaceSection(
  'if (words.length < 2 || words.length > 7) return false;',
  'if (words.length < 1 || words.length > 7) return false;'
);

// Add "Personal" and "Portfolio" to NON_COMPANY_START_RE to avoid "Personal Website" being a company
replaceSection(
  'execute|executed)\\b/i;',
  'execute|executed|personal|portfolio)\\b/i;'
);

fs.writeFileSync('src/lib/resumeParser.ts', content);
