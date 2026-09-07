import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { slideTexter, allSlideIds, CONFIG } from '../pptx-builder.js';
import { text, HTML_PATH } from '../sid-innehall.js';

// Pptx-exporten ska vara ett uttag av lokalforsorjning.html — ingen slide får
// bära text som inte står på sidan. Testet renderar varje slide, fångar allt
// som ritas ut och slår upp strängen i sidans egen text.

const sidtext = normalisera(
  text(fs.readFileSync(HTML_PATH, 'utf-8').replace(/<style>[\s\S]*?<\/style>/g, ' '))
);

function normalisera(s) {
  return String(s)
    .normalize('NFC')
    .replace(/ /g, ' ')          // hårt mellanslag
    .replace(/[⁠­]/g, '')   // ordfog och mjukt bindestreck (nbUnit)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Rent grafiska etiketter som inte har någon motsvarighet i sidans text:
// sidhuvud, sidfot, sidnummer, diagrammets axel och rubrikernas prefix.
const VITLISTA = [
  CONFIG.meta.footer,
  'Lejonfastigheter · Lokalförsörjning',
  'Förutsättning',
  /^\d+ \/ \d+$/,                                   // sidnummer
  /^Nivå \d$/,                                      // spårkortens nivåmärke
  /^Spår [A-D]:$/,                                  // rubrikprefix, namnet checkas separat
  /^-?\d+ år$/,                                     // gantt-axelns årsmarkeringar
  /^\d+([,.]\d+)? (mån|år)$/,                       // totaltid efter gantt-stapeln
  /^\d+([,.]\d+)?( mån)?–\d+([,.]\d+)? (år|månader)$/, // spårkortens tidsspann
];

// nbUnit() sätter hårt mellanslag och ordfog i tal — jämför utan dem.
const rensa = (t) => String(t).replace(/ /g, ' ').replace(/[⁠­]/g, '');
const vitlistad = (t) => VITLISTA.some(v => (typeof v === 'string' ? v === rensa(t) : v.test(rensa(t))));

describe('pptx-trohet mot lokalforsorjning.html', () => {
  const slides = slideTexter(allSlideIds());

  it('varje slide har text', () => {
    expect(slides.length).toBe(CONFIG.slides.length);
    for (const s of slides) {
      expect(s.texter.length, `slide '${s.id}' ritar ingen text`).toBeGreaterThan(3);
    }
  });

  for (const s of slideTexter(allSlideIds())) {
    it(`${s.id} hämtar all text ur sidan`, () => {
      const avvikande = s.texter
        .filter(t => !vitlistad(t))
        .filter(t => !sidtext.includes(normalisera(t)));
      expect(
        avvikande,
        `slide '${s.id}' har text som inte finns i lokalforsorjning.html`
      ).toEqual([]);
    });
  }
});
