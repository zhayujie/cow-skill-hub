/** Slug for community submit: 2–64 chars, lowercase alphanumeric with single hyphens between segments. */
export const SUBMIT_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

export function isValidSubmitSlug(s: string): boolean {
  return typeof s === 'string' && s.length >= 2 && s.length <= 64 && SUBMIT_SLUG_RE.test(s);
}

export function normalizeSlugInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function slugToDisplayName(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
