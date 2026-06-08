const fs = require('fs');
let content = fs.readFileSync('src/lib/resumeParser.ts', 'utf8');

content = content.replace('|software|consulting|corp', '|consulting|corp');
content = content.replace(
  /const JOB_TITLE_RE = \/\\b\(\?:developer\|engineer\|designer\|manager\|internship\|intern\|executive\|lead\|specialist\)\\b\/i;/,
  'const JOB_TITLE_RE = /\\\\b(?:developer|engineer|designer|manager|internship|intern|executive|lead|specialist|officer|associate|consultant|architect|analyst|coordinator|representative|technician|supervisor|principal|staff|junior|senior|jr\\\\.?|sr\\\\.?)\\\\b/i;'
);

fs.writeFileSync('src/lib/resumeParser.ts', content);
