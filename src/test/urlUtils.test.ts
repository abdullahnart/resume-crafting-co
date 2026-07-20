import { describe, it, expect } from 'vitest';
import { sanitizeUrl, displayUrl } from '@/lib/urlUtils';

describe('sanitizeUrl', () => {
  describe('normalizes valid URLs', () => {
    it('keeps https URLs intact', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('keeps http URLs intact', () => {
      expect(sanitizeUrl('http://example.com/path')).toBe('http://example.com/path');
    });

    it('adds https:// to bare domains', () => {
      expect(sanitizeUrl('example.com')).toBe('https://example.com');
    });

    it('adds https:// to www. URLs', () => {
      expect(sanitizeUrl('www.example.com')).toBe('https://www.example.com');
    });

    it('adds https:// to domains with paths', () => {
      expect(sanitizeUrl('github.com/user/repo')).toBe('https://github.com/user/repo');
    });

    it('converts bare emails to mailto:', () => {
      expect(sanitizeUrl('user@example.com')).toBe('mailto:user@example.com');
    });

    it('preserves mailto: URLs', () => {
      expect(sanitizeUrl('mailto:hi@example.com')).toBe('mailto:hi@example.com');
    });

    it('preserves tel: URLs', () => {
      expect(sanitizeUrl('tel:+15551234567')).toBe('tel:+15551234567');
    });
  });

  describe('strips surrounding punctuation', () => {
    it('strips trailing period', () => {
      expect(sanitizeUrl('https://example.com.')).toBe('https://example.com');
    });

    it('strips trailing comma', () => {
      expect(sanitizeUrl('https://example.com,')).toBe('https://example.com');
    });

    it('strips trailing unbalanced parenthesis', () => {
      expect(sanitizeUrl('https://example.com)')).toBe('https://example.com');
    });

    it('strips wrapping quotes', () => {
      expect(sanitizeUrl('"https://example.com"')).toBe('https://example.com');
    });

    it('strips wrapping angle brackets', () => {
      expect(sanitizeUrl('<https://example.com>')).toBe('https://example.com');
    });

    it('trims whitespace', () => {
      expect(sanitizeUrl('   https://example.com   ')).toBe('https://example.com');
    });
  });

  describe('rejects malformed and unsafe URLs', () => {
    it('rejects empty string', () => {
      expect(sanitizeUrl('')).toBeNull();
    });

    it('rejects null and undefined', () => {
      expect(sanitizeUrl(null)).toBeNull();
      expect(sanitizeUrl(undefined)).toBeNull();
    });

    it('rejects whitespace-only', () => {
      expect(sanitizeUrl('   ')).toBeNull();
    });

    it('rejects plain text with no dot', () => {
      expect(sanitizeUrl('not a url')).toBeNull();
    });

    it('rejects single-word text', () => {
      expect(sanitizeUrl('projectname')).toBeNull();
    });

    it('rejects javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('rejects data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('rejects file: URLs', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    });

    it('rejects vbscript: URLs', () => {
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull();
    });

    it('rejects http URL with no dot in hostname', () => {
      expect(sanitizeUrl('http://localhost')).toBeNull();
    });
  });
});

describe('displayUrl', () => {
  it('strips the scheme for display', () => {
    expect(displayUrl('https://example.com/path')).toBe('example.com/path');
  });

  it('strips the mailto: prefix for display', () => {
    expect(displayUrl('user@example.com')).toBe('user@example.com');
  });

  it('returns empty string for invalid URLs', () => {
    expect(displayUrl('javascript:alert(1)')).toBe('');
    expect(displayUrl('')).toBe('');
  });
});
