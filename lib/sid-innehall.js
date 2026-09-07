/* eslint-disable no-console */
// Läser innehållet i lokalforsorjning.html så att pptx-exporten kan bygga
// slides av sidans egen text — ingen löptext dupliceras i scripts/popular-slides.json.
//
// Två källor hämtas ur filen:
//   1. DATA-objektet i <script> (spår, gantt, matris, tidGuide, moduler, kontext,
//      lokaltyper, kallor) — skärs ut som objektliteral och evalueras med node:vm.
//   2. Prosaavsnitten i sektionernas HTML (rubriker, stycken, kort, listor).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML_PATH = path.join(__dirname, '..', 'lokalforsorjning.html');

const ENTITETER = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '',
  auml: 'ä', ouml: 'ö', aring: 'å', Auml: 'Ä', Ouml: 'Ö', Aring: 'Å',
  hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘',
  ldquo: '”', rdquo: '”', middot: '·', deg: '°', times: '×',
};

function avkoda(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(\w+);/g, (m, namn) => (namn in ENTITETER ? ENTITETER[namn] : m));
}

// HTML → ren text. Samma normalisering används av trohetstestet, så det som
// hamnar på en slide går att slå upp ordagrant i sidan.
function text(html) {
  const rensad = String(html == null ? '' : html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Blockbrytningar blir mellanslag, inline-taggar försvinner spårlöst så att
    // "3 mån<span>–</span>8 år" blir "3 mån–8 år".
    .replace(/<br\s*\/?>|<\/(p|div|li|ul|ol|h[1-6]|blockquote|section|tr|td|th)>/gi, ' ')
    // Bara det som ser ut som en tagg tas bort — annars äter "< 6 månader" i
    // DATA-strängarna upp texten fram till nästa ">".
    .replace(/<\/?[a-zA-Z][^>]*>/g, '');
  return avkoda(rensad)
    .replace(/[­⁠]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Innehållet i elementet som börjar vid `from` — räknar öppnande/stängande
// taggar så att kort med nästlade div:ar (t.ex. .tldr-kort) klipps rätt.
function balanserat(html, tagg, from) {
  const re = new RegExp(`<${tagg}\\b[^>]*>|</${tagg}>`, 'g');
  re.lastIndex = from;
  let djup = 1;
  let m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') {
      djup -= 1;
      if (djup === 0) return html.slice(from, m.index);
    } else if (!/\/>$/.test(m[0])) {
      djup += 1;
    }
  }
  return html.slice(from);
}

// Inner-HTML för alla element med klassen `cls`.
function block(html, cls) {
  const re = new RegExp(`<(\\w+)[^>]*\\bclass="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, 'g');
  const ut = [];
  let m;
  while ((m = re.exec(html))) ut.push(balanserat(html, m[1], re.lastIndex));
  return ut;
}

function ettBlock(html, cls) {
  return block(html, cls)[0] || '';
}

// Inner-HTML för alla element med taggen `tagg`.
function taggar(html, tagg) {
  const re = new RegExp(`<${tagg}\\b[^>]*>`, 'g');
  const ut = [];
  let m;
  while ((m = re.exec(html))) ut.push(balanserat(html, tagg, re.lastIndex));
  return ut;
}

function enTagg(html, tagg) {
  return taggar(html, tagg)[0] || '';
}

function sektion(html, id) {
  const re = new RegExp(`<section id="${id}"[^>]*>`);
  const m = re.exec(html);
  if (!m) throw new Error(`Sektionen '${id}' saknas i lokalforsorjning.html`);
  return balanserat(html, 'section', m.index + m[0].length);
}

// DATA-objektet ur <script> — objektliteralen evalueras isolerat.
function lasData(raw) {
  const start = raw.indexOf('const DATA = {');
  if (start < 0) throw new Error('DATA-objektet hittades inte i lokalforsorjning.html');
  const oppning = raw.indexOf('{', start);
  const slut = raw.indexOf('\n};', oppning);
  if (slut < 0) throw new Error('DATA-objektets slut hittades inte');
  const literal = raw.slice(oppning, slut + 2);
  return vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 2000 });
}

// ─── Sektionsvisa prosaavsnitt ─────────────────────────────────────────

function intro(html) {
  const s = sektion(html, 'intro');
  return {
    titel: text(ettBlock(s, 'hero-title')),
    eyebrow: text(ettBlock(s, 'hero-eyebrow')),
    ingress: text(ettBlock(s, 'hero-ingress')),
    tagline: text(ettBlock(s, 'hero-tagline')),
  };
}

function sammanfattning(html) {
  const s = sektion(html, 'sammanfattning');
  return {
    etikett: text(ettBlock(s, 'section-label')),
    rubrik: text(enTagg(s, 'h2')),
    kort: block(s, 'tldr-kort').map(k => ({
      siffra: text(ettBlock(k, 'tldr-siffra')),
      etikett: text(ettBlock(k, 'tldr-label')),
      text: text(enTagg(k, 'p')),
    })),
    nycklar: block(s, 'tldr-key').map(k => ({
      ledord: text(enTagg(k, 'strong')),
      text: text(k.replace(/<strong>[\s\S]*?<\/strong>/, '')),
    })),
  };
}

function oversikt(html) {
  const s = sektion(html, 'oversikt');
  const callout = ettBlock(s, 'hierarki-callout');
  return {
    etikett: text(ettBlock(s, 'section-label')),
    rubrik: text(enTagg(s, 'h2')),
    ingress: text(enTagg(s, 'p')),
    hierarki: {
      stamp: text(ettBlock(callout, 'stamp')),
      rubrik: text(enTagg(callout, 'h3')),
      stycken: taggar(callout, 'p').map(text),
    },
  };
}

function jamforelse(html) {
  const s = sektion(html, 'jamforelse');
  return {
    etikett: text(ettBlock(s, 'section-label')),
    rubrik: text(enTagg(s, 'h2')),
    ingress: text(enTagg(s, 'p')),
    referenser: block(s, 'gantt-bench-rad').map(r => ({
      tal: text(enTagg(r, 'strong')),
      text: text(enTagg(r, 'span')),
    })),
    not: text(ettBlock(s, 'gantt-note')),
  };
}

function perTyp(html) {
  const s = sektion(html, 'per-typ');
  return {
    etikett: text(ettBlock(s, 'section-label')),
    rubrik: text(enTagg(s, 'h2')),
    ingress: text(enTagg(s, 'p')),
    metodnot: text(ettBlock(s, 'gantt-note')),
  };
}

function moduler(html) {
  const s = sektion(html, 'moduler');
  const varning = ettBlock(s, 'modul-varning');
  return {
    etikett: text(ettBlock(s, 'section-label')),
    rubrik: text(enTagg(s, 'h2')),
    ingress: text(enTagg(s, 'p')),
    varning: {
      ledord: text(enTagg(varning, 'strong')),
      text: text(varning.replace(/<strong>[\s\S]*?<\/strong>/, '')),
    },
  };
}

function provning(html) {
  const s = sektion(html, 'provning');
  const stycken = taggar(s, 'p').map(text);
  const rubriker = taggar(s, 'h3').map(text);

  // Stegen grupperas under närmast föregående .prov-fas-etikett.
  const grupper = [];
  const re = /<p class="prov-fas">([\s\S]*?)<\/p>|<div class="prov-steg"[^>]*>/g;
  let m;
  while ((m = re.exec(s))) {
    if (m[1] !== undefined) {
      grupper.push({ etikett: text(m[1]), steg: [] });
      continue;
    }
    const inner = balanserat(s, 'div', re.lastIndex);
    const rest = inner.replace(/<div class="nr">[\s\S]*?<\/div>/, '');
    if (!grupper.length) grupper.push({ etikett: '', steg: [] });
    grupper[grupper.length - 1].steg.push({
      nr: text(ettBlock(inner, 'nr')),
      titel: text(enTagg(rest, 'h4')),
      text: text(enTagg(rest, 'p')),
    });
  }

  const slutsats = block(s, 'tldr-key')[0] || '';
  return {
    etikett: text(ettBlock(s, 'section-label')),
    rubrik: text(enTagg(s, 'h2')),
    // De två inledande styckena, i sin helhet.
    inledning: stycken.slice(0, 2),
    stats: block(s, 'prov-stat').map(k => ({
      tal: text(ettBlock(k, 'tal')),
      etikett: text(ettBlock(k, 'etikett')),
    })),
    momentRubrik: rubriker[0] || '',
    grupper,
    momentNot: stycken.find(p => p.startsWith('Utredningar och dialog')) || '',
    varforRubrik: rubriker[1] || '',
    varforIngress: stycken.find(p => p.startsWith('Delar av tiden')) || '',
    varforKort: block(s, 'prov-varfor-kort').map(k => {
      const h4 = enTagg(k, 'h4');
      const chipHtml = ettBlock(h4, 'prov-chip');
      const chipKlass = /prov-chip--(\w+)/.exec(h4);
      return {
        chip: text(chipHtml),
        chipFarg: chipKlass ? chipKlass[1] : 'lag',
        rubrik: text(h4.replace(/<span[\s\S]*?<\/span>/, '')),
        punkter: taggar(enTagg(k, 'ul'), 'li').map(text),
      };
    }),
    slutsats: {
      ledord: text(enTagg(slutsats, 'strong')),
      text: text(slutsats.replace(/<strong>[\s\S]*?<\/strong>/, '')),
    },
  };
}

function kontext(html) {
  const s = sektion(html, 'kontext');
  const citat = ettBlock(s, 'kontext-citat');
  return {
    etikett: text(ettBlock(s, 'section-label')),
    rubrik: text(enTagg(s, 'h2')),
    ingress: text(enTagg(s, 'p')),
    citat: text(enTagg(citat, 'blockquote')),
    citatKalla: text(enTagg(citat, 'cite')),
    primarkallor: text(ettBlock(s, 'gantt-note')),
  };
}

function kostnad(html) {
  const s = sektion(html, 'kostnad');
  return {
    etikett: text(ettBlock(s, 'section-label')),
    rubrik: text(enTagg(s, 'h2')),
    ingress: text(enTagg(s, 'p')),
    // Kurvans axel- och serienamn tas ur diagrammets egen SVG.
    skeden: (ettBlock(s, 'kostnad-kurva-svg').match(/<text[^>]*y="305"[^>]*>([\s\S]*?)<\/text>/g) || [])
      .map(t => text(t)),
    serier: taggar(ettBlock(s, 'kostnad-kurva-legend'), 'span')
      .map(text)
      .filter(Boolean),
    kurvaNot: text(ettBlock(s, 'kostnad-kurva-note')),
    kort: block(s, 'kostnad-kort').map(k => ({
      etikett: text(ettBlock(k, 'label')),
      siffra: text(ettBlock(k, 'siffra')),
      rubrik: text(enTagg(k, 'h3')),
      text: text(enTagg(k, 'p')),
      kalla: text(enTagg(k, 'cite')),
    })),
    nycklar: block(s, 'kostnad-key').map(k => ({
      ledord: text(enTagg(k, 'strong')),
      text: text(k.replace(/<strong>[\s\S]*?<\/strong>/, '')),
    })),
  };
}

function beslut(html) {
  const s = sektion(html, 'beslut');
  const pika = ettBlock(s, 'behov-pika');
  return {
    etikett: text(ettBlock(s, 'section-label')),
    rubrik: text(enTagg(s, 'h2')),
    ingress: text(enTagg(s, 'p')),
    guideRubrik: text(enTagg(ettBlock(s, 'tid-steg') || '<h4>Behov om</h4>', 'h4')),
    matrisKolumner: block(ettBlock(s, 'matris-header'), 'matris-cell').map(text),
    matrisNot: text(ettBlock(s, 'matris-note')),
    forutsattning: {
      rubrik: text(ettBlock(pika, 'behov-pika-header')),
      text: text(enTagg(pika, 'p')),
    },
  };
}

function kallor(html) {
  const s = sektion(html, 'kallor');
  return {
    etikett: text(ettBlock(s, 'section-label')),
    rubrik: text(enTagg(s, 'h2')),
    ingress: text(enTagg(s, 'p')),
  };
}

let cache = null;

function lasSida({ force = false } = {}) {
  if (cache && !force) return cache;
  const raw = fs.readFileSync(HTML_PATH, 'utf-8');
  cache = {
    raw,
    DATA: lasData(raw),
    intro: intro(raw),
    sammanfattning: sammanfattning(raw),
    oversikt: oversikt(raw),
    jamforelse: jamforelse(raw),
    perTyp: perTyp(raw),
    moduler: moduler(raw),
    provning: provning(raw),
    kontext: kontext(raw),
    kostnad: kostnad(raw),
    beslut: beslut(raw),
    kallor: kallor(raw),
  };
  return cache;
}

module.exports = { lasSida, text, HTML_PATH };
