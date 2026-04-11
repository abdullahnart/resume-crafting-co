import { describe, expect, it } from 'vitest';
import { parseResumeText } from '@/lib/resumeParser';

describe('resume parser', () => {
  it('extracts all work entries, education, skills, and portfolio links from the sample structure', () => {
    const parsed = parseResumeText(`Abdullah Naseem
+92 324 8204797
abdullah.dev1997@gmail.com

WORK
**Al Rehman Technology | CMS Developer**
Currently Work Here
* Customized WooCommerce plugin for enhanced functionality and user experience.

**Proficient Digital | Senior Frontend Developer | CMS Developer**
2.5 Years of Experience 2020 to 2023
* Create a custom theme from scratch

**Digitonics Labs | Jr. Executive Web Developer**
6 Months Experience 2019 to 2020
* Working on custom theme (scratch theme)

4 Months Experience 2019 to 2020
**Just Digital Pvt Ltd**
**Jr. Wordpress Developer**
* Design a Creative and Professional website

6 Month Experience 2018 to 2019
**PNT Global**
**Internship Wordpress Developer**
* Build websites using WordPress.

ADDRESS
A 4/3 Muhammadi Colony
Karachi

ABOUT ME
I am Experienced WordPress developer.

SKILLS
Wordpress
HTML
CSS
Customization
Javascript
Bootstrap
JQuery
PHP

EDUCATION
**Bachelors in Commerce**
From Premiere Govt. College

**Intermediate:**
H.S.C (Commerce) from Karachi Board.

**Matricualtion:**
S.S.C (Science) from Bait-us-Salam H\\S School.

PORTFOLIO
https://bridesforacause.com/
https://slcexcavating.com/
https://innerpeaceart.com/`);

    expect(parsed.experience).toHaveLength(5);
    expect(parsed.experience?.[0]).toMatchObject({
      company: 'Al Rehman Technology',
      role: 'CMS Developer',
      endDate: 'Present',
      current: true,
    });
    expect(parsed.experience?.[1]).toMatchObject({
      company: 'Proficient Digital',
      role: 'Senior Frontend Developer | CMS Developer',
      startDate: '2020',
      endDate: '2023',
    });
    expect(parsed.experience?.[3]).toMatchObject({
      company: 'Just Digital Pvt Ltd',
      role: 'Jr. Wordpress Developer',
      startDate: '2019',
      endDate: '2020',
    });
    expect(parsed.experience?.[4]).toMatchObject({
      company: 'PNT Global',
      role: 'Internship Wordpress Developer',
      startDate: '2018',
      endDate: '2019',
    });

    expect(parsed.education).toEqual([
      expect.objectContaining({ degree: 'Bachelors in Commerce', school: 'Premiere Govt. College' }),
      expect.objectContaining({ degree: 'Intermediate', school: 'Karachi Board', field: 'H.S.C (Commerce)' }),
      expect.objectContaining({ degree: 'Matricualtion', school: 'Bait-us-Salam H\\S School', field: 'S.S.C (Science)' }),
    ]);

    expect(parsed.skills?.map(skill => skill.name)).toEqual([
      'Wordpress',
      'HTML',
      'CSS',
      'Customization',
      'Javascript',
      'Bootstrap',
      'JQuery',
      'PHP',
    ]);

    expect(parsed.projects).toEqual([
      expect.objectContaining({ name: 'bridesforacause.com', url: 'https://bridesforacause.com/' }),
      expect.objectContaining({ name: 'slcexcavating.com', url: 'https://slcexcavating.com/' }),
      expect.objectContaining({ name: 'innerpeaceart.com', url: 'https://innerpeaceart.com/' }),
    ]);
  });
});
