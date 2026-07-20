// Shared URL normalization + validation used by parser and templates.
// Ensures every rendered project link is safe, absolute, and clickable.

const TRAILING_JUNK_RE = /[\s)\].,;:!?'"”’>]+$/;
const LEADING_JUNK_RE = /^[\s(\[<'"“‘]+/;
const SAFE_SCHEME_RE = /^(https?:|mailto:|tel:)/i;
const HAS_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const LOOKS_LIKE_DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalize a raw URL string into a safe, absolute URL, or return null if invalid.
 * - Strips surrounding punctuation/quotes
 * - Adds https:// when scheme is missing
 * - Converts bare emails to mailto:
 * - Blocks unsafe schemes (javascript:, data:, etc.)
 */
export function sanitizeUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let value = String(raw).trim().replace(LEADING_JUNK_RE, '').replace(TRAILING_JUNK_RE, '');
  if (!value) return null;

  // Balance trailing ) if not opened
  while (value.endsWith(')') && (value.match(/\(/g)?.length ?? 0) < (value.match(/\)/g)?.length ?? 0)) {
    value = value.slice(0, -1);
  }

  if (EMAIL_RE.test(value)) value = `mailto:${value}`;

  if (HAS_SCHEME_RE.test(value)) {
    if (!SAFE_SCHEME_RE.test(value)) return null;
  } else if (LOOKS_LIKE_DOMAIN_RE.test(value)) {
    value = `https://${value.replace(/^\/+/, '')}`;
  } else {
    return null;
  }

  try {
    const u = new URL(value);
    if (!SAFE_SCHEME_RE.test(u.protocol)) return null;
    if ((u.protocol === 'http:' || u.protocol === 'https:') && !u.hostname.includes('.')) return null;
    return u.toString().replace(/\/$/, u.pathname === '/' ? '/' : '');
  } catch {
    return null;
  }
}

/** Human-readable label for a URL (host + path, no scheme). */
export function displayUrl(raw: string | undefined | null): string {
  const safe = sanitizeUrl(raw);
  if (!safe) return '';
  try {
    const u = new URL(safe);
    if (u.protocol === 'mailto:') return safe.replace(/^mailto:/i, '');
    return (u.host + (u.pathname === '/' ? '' : u.pathname) + u.search).replace(/\/$/, '');
  } catch {
    return safe;
  }
}
