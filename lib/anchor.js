export const COMMENTABLE_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, li, figure, img, svg, table, blockquote, .card, .section';

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9åäö]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Läser textContent men hoppar över barn som tillhör kommentars-UI
// (t.ex. inline-bubblor). Utan detta ändras slug:en när bubblan appenderas,
// vilket i sin tur gör att sparade kommentarer "hoppar" till orphans.
function readAnchorText(element) {
  if (!element) return '';
  const children = element.childNodes;
  if (!children || typeof children[Symbol.iterator] !== 'function') {
    return element.textContent || '';
  }
  let out = '';
  for (const node of children) {
    if (node.nodeType === 1) {
      const el = node;
      if (el.hasAttribute?.('data-comment-ui')) continue;
      if (el.classList?.contains?.('comment-inline-bubble')) continue;
      out += readAnchorText(el);
    } else if (node.nodeType === 3) {
      out += node.nodeValue || '';
    }
  }
  return out;
}

export function anchorIdForElement(element, index) {
  const tag = element.tagName.toLowerCase();
  const trimmed = readAnchorText(element).trim().slice(0, 30);
  const slug = slugify(trimmed);
  return `${tag}-${slug}-${index}`;
}

export function assignAnchorsInDocument(root = document) {
  const elements = Array.from(root.querySelectorAll(COMMENTABLE_SELECTOR));

  // Behåll existerande ankare — annars skiftas id:n när textContent
  // ändras (t.ex. när en inline-bubbla läggs till eller dynamiskt innehåll
  // ändras), och sparade kommentarer tappar kopplingen till sitt element.
  const usedIndexPerKey = new Map();
  for (const el of elements) {
    const existing = el.getAttribute('data-comment-anchor');
    if (!existing) continue;
    const m = existing.match(/^(.*)-(\d+)$/);
    if (!m) continue;
    const key = m[1];
    const n = parseInt(m[2], 10);
    const cur = usedIndexPerKey.get(key);
    if (cur === undefined || n > cur) usedIndexPerKey.set(key, n);
  }

  const nextOffsetPerKey = new Map();
  for (const el of elements) {
    if (el.getAttribute('data-comment-anchor')) continue;
    const tag = el.tagName.toLowerCase();
    const trimmed = readAnchorText(el).trim().slice(0, 30);
    const slug = slugify(trimmed);
    const key = `${tag}-${slug}`;
    const base = usedIndexPerKey.has(key) ? usedIndexPerKey.get(key) + 1 : 0;
    const offset = nextOffsetPerKey.get(key) ?? 0;
    const n = base + offset;
    nextOffsetPerKey.set(key, offset + 1);
    el.setAttribute('data-comment-anchor', `${key}-${n}`);
  }
  return elements;
}

// Räkna fram ett stabilt ankar-id för godtyckligt element (används när
// markeringsläget låter användaren klicka på element utanför COMMENTABLE_SELECTOR).
export function computeAnchorId(el, root = document) {
  const tag = el.tagName.toLowerCase();
  const text = readAnchorText(el).trim().slice(0, 30);
  const slug = slugify(text);
  const key = slug ? `${tag}-${slug}` : tag;
  const all = root.getElementsByTagName(tag);
  let index = 0;
  for (const candidate of all) {
    if (candidate === el) break;
    const ctext = readAnchorText(candidate).trim().slice(0, 30);
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
