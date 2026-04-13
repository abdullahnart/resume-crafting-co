import { describe, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { extractTextFromPDF, parseResumeText } from '@/lib/resumeParser';

describe('debug uploaded resume', () => {
  it('prints extracted content', async () => {
    const bytes = readFileSync('/tmp/Abdullah-naseem-resume-web-developer.pdf');
    const file = new File([bytes], 'Abdullah-naseem-resume-web-developer.pdf', { type: 'application/pdf' });
    const text = await extractTextFromPDF(file);
    console.log('===TEXT START===');
    console.log(text);
    console.log('===TEXT END===');
    console.log('===PARSED START===');
    console.log(JSON.stringify(parseResumeText(text), null, 2));
    console.log('===PARSED END===');
  });
});
