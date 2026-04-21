export const COMMENTABLE_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, li, figure, img, svg, table, blockquote, .card, .section';

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

// Räkna fram ett stabilt ankar-id för godtyckligt element (används när
// markeringsläget låter användaren klicka på element utanför COMMENTABLE_SELECTOR).
export function computeAnchorId(el, root = document) {
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent || '').trim().slice(0, 30);
  const slug = slugify(text);
  const key = slug ? `${tag}-${slug}` : tag;
  const all = root.getElementsByTagName(tag);
  let index = 0;
  for (const candidate of all) {
    if (candidate === el) break;
    const ctext = (candidate.textContent || '').trim().slice(0, 30);
    const cslug = slugify(ctext);
    const ckey = cslug ? `${tag}-${cslug}` : tag;
    if (ckey === key) index++;
  }
  return `${key}-${index}`;
}

export function ensureAnchor(el) {
  const existing = el.getAttribute('data-comment-anchor');
  if (existing) return existing;
  const id = computeAnchorId(el);
  el.setAttribute('data-comment-anchor', id);
  return id;
}
