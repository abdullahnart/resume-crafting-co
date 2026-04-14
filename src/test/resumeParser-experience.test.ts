import { describe, expect, it } from 'vitest';
import { parseResumeText } from '@/lib/resumeParser';

describe('resume parser experience mapping', () => {
  it('keeps all experience entries and key points from the uploaded resume layout', () => {
    const parsed = parseResumeText(`Abdullah Naseem
+92 324 8204797
+92 300 2173869
abdullah.dev1997@gmail.com

WORK
Al Rehman Technology | CMS Developer
Currently Work
Customized WooCommerce plugin for
Here enhanced functionality and user experience.
Advanced WooCommerce features such as
custom metafields, product filters, AJAX search.
Developed Plugin of woocommerce product
discount and Wishlist by category and tags.
Built custom Shopify themes from
scratch with Liquid, JavaScript, and CSS.
Created and optimized custom
metafields for dynamic products.
Created store in BigCommerce with theme
customization and advance features.
Proficient Digital | Senior Frontend
Developer | CMS Developer
2.5 Years of
Experience
2020 to 2023
Create a custom theme from scratch
More Expertise in Elementor and Elementor Pro
Theme and Plugin Customization
Create a HTML CSS website with advance
animation.
Create lottie website with live animation
Create Online store in Shopify
Create scroll animation website in Webflow
Digitonics Labs | Jr. Executive Web Developer
6
Months Wordpress Custom Functionality
Experience
2019 to 2020
Working on custom theme (scratch theme)
PayPal and Stripe Payment Integration
Expert in WP Bakery and Elementor
Create Custom Post Type
Create Woocommerce website with additional
functionality

ADDRESS
A 4/3 Muhammadi Colony
Azizabad Block # 8
F.B.Area
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
---PAGE_BREAK---
Just Digital Pvt Ltd
Jr. Wordpress Developer
4
Months
Experience  Design a Creative and Professional website
2019 to 2020  Worked in Divi theme and I’m expert in Divi theme also working in Avada theme
 Coordinating QA test plans
 Website Speed Optimization
 Custom Theme Development
 Design Email Template
 PSD to Wordpress
 Theme Customization
PNT Global
Internship Wordpress Developer
Build websites using WordPress.
6
Month
Experience
Prepare website proposals to present to clients.
Provide technical support to clients.
Write coding using HTML and CSS.
2018 to 2019
Design new features for existing websites.

EDUCATION
Bachelors in Commerce
From Premiere Govt. College

Intermediate:
H.S.C (Commerce) from Karachi Board.

Matricualtion:
S.S.C (Science) from Bait-us-Salam H\S School.

PORTFOLIO
https://bridesforacause.com/
https://slcexcavating.com/
https://innerpeaceart.com/
https://gigidev.clickysoft.us/
https://budgetbites.com/
https://www.meccabooks.com/
https://drinkhalfpast.com/
https://revibe.me/
https://sonomarestorations.com/`);

    expect(parsed.experience).toHaveLength(5);
    expect(parsed.experience?.[0]).toMatchObject({ company: 'Al Rehman Technology', role: 'CMS Developer', endDate: 'Present', current: true });
    expect(parsed.experience?.[0]?.bullets).toEqual(expect.arrayContaining([
      'Customized WooCommerce plugin for enhanced functionality and user experience.',
      'Built custom Shopify themes from scratch with Liquid, JavaScript, and CSS.',
    ]));

    expect(parsed.experience?.[1]).toMatchObject({ company: 'Proficient Digital', role: 'Senior Frontend Developer | CMS Developer', startDate: '2020', endDate: '2023' });
    expect(parsed.experience?.[1]?.bullets).toEqual(expect.arrayContaining([
      'Create a custom theme from scratch',
      'Create scroll animation website in Webflow',
    ]));

    expect(parsed.experience?.[2]).toMatchObject({ company: 'Digitonics Labs', role: 'Jr. Executive Web Developer', startDate: '2019', endDate: '2020' });
    expect(parsed.experience?.[2]?.bullets).toEqual(expect.arrayContaining([
      'Wordpress Custom Functionality',
      'PayPal and Stripe Payment Integration',
      'Create Woocommerce website with additional functionality',
    ]));

    expect(parsed.experience?.[3]).toMatchObject({ company: 'Just Digital Pvt Ltd', role: 'Jr. Wordpress Developer', startDate: '2019', endDate: '2020' });
    expect(parsed.experience?.[3]?.bullets).toEqual(expect.arrayContaining([
      'Design a Creative and Professional website',
      'Worked in Divi theme and I’m expert in Divi theme also working in Avada theme',
      'Theme Customization',
    ]));

    expect(parsed.experience?.[4]).toMatchObject({ company: 'PNT Global', role: 'Internship Wordpress Developer', startDate: '2018', endDate: '2019' });
    expect(parsed.experience?.[4]?.bullets).toEqual(expect.arrayContaining([
      'Build websites using WordPress.',
      'Provide technical support to clients.',
      'Design new features for existing websites.',
    ]));

    expect(parsed.skills?.map(skill => skill.name)).toEqual(['Wordpress', 'HTML', 'CSS', 'Customization', 'Javascript', 'Bootstrap', 'JQuery', 'PHP']);
    expect(parsed.education).toHaveLength(3);
    expect(parsed.projects).toHaveLength(9);
  });
});