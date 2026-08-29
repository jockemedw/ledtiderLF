// URL-state för "Skräddarsydd sammanställning" — håller en ordnad lista
// med sektion-id:n i query-paramtern `ids` (komma-separerad).
//
// Exempel: ?ids=oversikt,kostnad,spar-b

const PARAM = 'ids';

export function parse(search) {
  if (!search) return [];
  const s = String(search);
  const i = s.indexOf('?');
  const qs = i >= 0 ? s.slice(i + 1) : s;
  const params = new URLSearchParams(qs);
  const raw = params.get(PARAM);
  if (!raw) return [];
  return dedupe(raw.split(',').map(t => t.trim()).filter(Boolean));
}

export function serialize(ids) {
  const clean = dedupe((ids || []).map(t => String(t).trim()).filter(Boolean));
  if (!clean.length) return '';
  const params = new URLSearchParams();
  params.set(PARAM, clean.join(','));
  return '?' + params.toString();
}

export function toggle(ids, id) {
  const list = dedupe(ids || []);
  const i = list.indexOf(id);
  if (i >= 0) {
    list.splice(i, 1);
    return list;
  }
  list.push(id);
  return list;
}

export function move(ids, id, delta) {
  const list = dedupe(ids || []);
  const i = list.indexOf(id);
  if (i < 0) return list;
  const j = Math.max(0, Math.min(list.length - 1, i + delta));
  if (j === i) return list;
  list.splice(i, 1);
  list.splice(j, 0, id);
  return list;
}

export function reorder(ids, fromIndex, toIndex) {
  const list = dedupe(ids || []);
  if (fromIndex < 0 || fromIndex >= list.length) return list;
  const to = Math.max(0, Math.min(list.length - 1, toIndex));
  if (to === fromIndex) return list;
  const [moved] = list.splice(fromIndex, 1);
  list.splice(to, 0, moved);
  return list;
}

// Tar bort id:n som inte finns i den tillåtna mängden (XSS-skydd för
// `pages/skraddarsydd.js` som väljer ut sektioner via id).
export function normalize(ids, allowed) {
  const allow = new Set(allowed || []);
  return dedupe(ids || []).filter(id => allow.has(id));
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!item) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}
