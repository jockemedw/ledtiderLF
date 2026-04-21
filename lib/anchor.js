export const COMMENTABLE_SELECTOR = 'h1, h2, h3, h4, p, li, .card, .section';

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9åäö]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function anchorIdForElement(element, index) {
  const tag = element.tagName.toLowerCase();
  const trimmed = (element.textContent || '').trim().slice(0, 30);
  const slug = slugify(trimmed);
  return `${tag}-${slug}-${index}`;
}

export function assignAnchorsInDocument(root = document) {
  const elements = Array.from(root.querySelectorAll(COMMENTABLE_SELECTOR));
  const counts = new Map();
  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    const trimmed = (el.textContent || '').trim().slice(0, 30);
    const slug = slugify(trimmed);
    const key = `${tag}-${slug}`;
    const n = counts.get(key) ?? 0;
    counts.set(key, n + 1);
    el.setAttribute('data-comment-anchor', `${key}-${n}`);
  }
  return elements;
}
