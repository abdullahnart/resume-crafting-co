import { describe, expect, it } from 'vitest';
import { parseResumeText } from '@/lib/resumeParser';

describe('resume parser issue reproduction', () => {
  it('identifies company names correctly even when achievement starts with capital letter', () => {
    const text = `
WORK EXPERIENCE
Google
Software Engineer
2020 - Present
* Leading the development of a new search feature.
* Improving performance of the main landing page.
Optimized the backend services for better scalability.

Microsoft
Senior Developer
2018 - 2020
Responsibilities:
* Developed a new cloud storage solution.
* Managed a team of 5 developers.
    `;
    const parsed = parseResumeText(text);
    
    // Check that 'Optimized the backend services...' is NOT a company name
    const companies = parsed.experience?.map(e => e.company);
    expect(companies).not.toContain('Optimized the backend services for better scalability');
    expect(companies).toContain('Google');
    expect(companies).toContain('Microsoft');
    
    // Check that 'Responsibilities' is NOT a bullet
    const microsoft = parsed.experience?.find(e => e.company === 'Microsoft');
    expect(microsoft?.bullets).not.toContain('Responsibilities');
    expect(microsoft?.bullets).toContain('Developed a new cloud storage solution');
  });

  it('extracts projects without URLs', () => {
    const text = `
PROJECTS
Personal Website
A custom portfolio built with React and Tailwind CSS.

E-commerce Platform
Built a full-stack e-commerce platform using Next.js and Stripe.
    `;
    const parsed = parseResumeText(text);
    
    expect(parsed.projects).toHaveLength(2);
    expect(parsed.projects?.[0].name).toBe('Personal Website');
    expect(parsed.projects?.[1].name).toBe('E-commerce Platform');
  });
});
