import { put, head } from '@vercel/blob';

// Overlay-lager: textredigeringar och tidsjusteringar som sparas per sida i
// Vercel Blob (samma mönster som kommentarer) och läggs på i runtime för alla
// besökare. Ingen ombyggnad, ingen repo-skrivning. Se lib/apply-overrides.js
// för hur dokumentet appliceras på sidan.

const PREFIX = 'overrides/';
export const PAGES = ['lokal', 'detaljplan'];

const MAX_TEXT_VALUE = 4000;   // tecken per redigerad text
const MAX_TEXT_KEYS = 2000;    // antal redigerade element
const MAX_KEY_LEN = 200;
const MAX_DOC_BYTES = 256 * 1024;

export function isValidPage(page) {
  return PAGES.includes(page);
}

function pathFor(page) {
  return `${PREFIX}${page}.json`;
}

function isNonNegNum(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100000;
}

function emptyDoc() {
  return { text: {}, data: { gantt: {}, spar: {} } };
}

function sanitizeText(text) {
  const out = {};
  if (!text || typeof text !== 'object' || Array.isArray(text)) return out;
  let n = 0;
  for (const [k, v] of Object.entries(text)) {
    if (n >= MAX_TEXT_KEYS) break;
    if (typeof k !== 'string' || !k || k.length > MAX_KEY_LEN) continue;
    if (typeof v !== 'string') continue;
    out[k] = v.slice(0, MAX_TEXT_VALUE);
    n++;
  }
  return out;
}

function sanitizeGantt(gantt) {
  const out = {};
  if (!gantt || typeof gantt !== 'object' || Array.isArray(gantt)) return out;
  for (const [key, val] of Object.entries(gantt)) {
    if (typeof key !== 'string' || !key || key.length > MAX_KEY_LEN) continue;
    if (!val || typeof val !== 'object') continue;
    const row = {};
    if (isNonNegNum(val.forskedeMan)) row.forskedeMan = val.forskedeMan;
    if (Array.isArray(val.segment)) {
      const seg = val.segment
        .filter((s) => s && typeof s.fas === 'string' && s.fas.length <= 60 && isNonNegNum(s.man))
        .slice(0, 20)
        .map((s) => ({ fas: s.fas, man: s.man }));
      if (seg.length) row.segment = seg;
    }
    if ('forskedeMan' in row || 'segment' in row) out[key] = row;
  }
  return out;
}

function sanitizeSpar(spar) {
  const out = {};
  if (!spar || typeof spar !== 'object' || Array.isArray(spar)) return out;
  for (const [id, val] of Object.entries(spar)) {
    if (typeof id !== 'string' || !id || id.length > 60) continue;
    if (!val || typeof val !== 'object' || !Array.isArray(val.scenarios)) continue;
    const scenarios = val.scenarios.slice(0, 20).map((sc) => {
      if (!sc || typeof sc !== 'object') return null;
      const o = {};
      if (typeof sc.totalText === 'string') o.totalText = sc.totalText.slice(0, 200);
      if (Array.isArray(sc.faser)) {
        const faser = sc.faser
          .filter((f) => f && typeof f.namn === 'string' && typeof f.tid === 'string')
          .slice(0, 30)
          .map((f) => ({ namn: f.namn.slice(0, 200), tid: f.tid.slice(0, 200) }));
        if (faser.length) o.faser = faser;
      }
      return 'totalText' in o || 'faser' in o ? o : null;
    });
    if (scenarios.some(Boolean)) out[id] = { scenarios };
  }
  return out;
}

// Ren validering/sanering — enhetstestbar utan Blob. Okända nycklar och
// ogiltiga typer tas bort tyst; strängar och listor kapas till gränserna.
export function sanitizeOverrides(input) {
  const src = input && typeof input === 'object' ? input : {};
  const data = src.data && typeof src.data === 'object' ? src.data : {};
  return {
    text: sanitizeText(src.text),
    data: {
      gantt: sanitizeGantt(data.gantt),
      spar: sanitizeSpar(data.spar),
    },
  };
}

export function withinSizeLimit(doc) {
  try {
    return Buffer.byteLength(JSON.stringify(doc), 'utf8') <= MAX_DOC_BYTES;
  } catch {
    return false;
  }
}

export async function getOverrides(page) {
  if (!isValidPage(page)) return emptyDoc();
  try {
    const info = await head(pathFor(page));
    const res = await fetch(info.url, { cache: 'no-store' });
    if (!res.ok) return emptyDoc();
    const doc = await res.json();
    return sanitizeOverrides(doc);
  } catch {
    // Ingen blob ännu, saknad token eller nätverksfel: sidan ska fungera som
    // idag utan overrides.
    return emptyDoc();
  }
}

export async function saveOverrides(page, payload) {
  if (!isValidPage(page)) throw new Error('Ogiltig sida');
  const clean = sanitizeOverrides(payload);
  const doc = { ...clean, updatedAt: new Date().toISOString() };
  if (!withinSizeLimit(doc)) throw new Error('Overlay-dokumentet är för stort');
  await put(pathFor(page), JSON.stringify(doc), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return doc;
}
