/* eslint-disable no-console */
// Bygger en .pptx-populärversion av lokalförsörjningsmaterialet.
//
// Användning:
//   const { buildPptx, slidesForSections, allSlideIds } = require('./lib/pptx-builder');
//   const buffer = await buildPptx({ slideIds: ['oversikt', 'kostnad-80'] });
//
// Slides väljs i scripts/popular-slides.json — den filen bär bara id, ordning,
// ankare, layout och `innehall.typ`. All text hämtas ur lokalforsorjning.html
// via lib/sid-innehall.js och lib/pptx-innehall.js, så presentationen är ett
// uttag av sidan och inte en parallell sammanfattning.
//
// `ankare` pekar mot ett sektion-id på sidan och används av slidesForSections()
// för att gå från sektionsval till slide-val.

const PptxGenJS = require('pptxgenjs');

const CONFIG = require('../scripts/popular-slides.json');
const { byggSlide } = require('./pptx-innehall');

const PALETT = {
  navy:       '1A2744',
  navyMid:    '2C3E62',
  gold:       'B5822A',
  goldLight:  'E8C97A',
  parchment:  'F4F1EB',
  white:      'FFFFFF',
  border:     'DDD8CC',
  muted:      '6B7280',
};

const W = 13.33;
const H = 7.5;
const BOTTEN = 6.9;   // nedersta y-värde för innehåll (sidfoten börjar 7.1)

function allSlides() {
  return [...CONFIG.slides].sort((a, b) => a.ordning - b.ordning);
}

function allSlideIds() {
  return allSlides().map(s => s.id);
}

// Utan angivna id:n byggs den kurerade populärversionen (popular: true) —
// sektionsslides är bara med när de uttryckligen väljs.
function pickSlides(ids) {
  const all = allSlides();
  if (!ids || !ids.length) return all.filter(s => s.popular);
  const map = new Map(all.map(s => [s.id, s]));
  const picked = [];
  const missing = [];
  for (const id of ids) {
    if (map.has(id)) picked.push(map.get(id));
    else missing.push(id);
  }
  if (missing.length) {
    const err = new Error(`Okända slide-id: ${missing.join(', ')}`);
    err.code = 'UNKNOWN_SLIDE_IDS';
    err.unknown = missing;
    err.available = all.map(s => s.id);
    throw err;
  }
  return picked;
}

// Givet en lista sektion-id:n (i webbsidan) → returnera slide-id:n
// i ordningen sektionerna kom, plus markera vilka sektioner som saknar
// kurerad slide (callern kan visa varning eller fallback).
function slidesForSections(sectionIds) {
  const slidesByAnkare = new Map();
  for (const slide of allSlides()) {
    if (!slide.ankare) continue;
    const list = slidesByAnkare.get(slide.ankare) || [];
    list.push(slide);
    slidesByAnkare.set(slide.ankare, list);
  }
  const slideIds = [];
  const missing = [];
  for (const sid of sectionIds || []) {
    const slides = slidesByAnkare.get(sid);
    if (slides && slides.length) {
      for (const s of slides) slideIds.push(s.id);
    } else {
      missing.push(sid);
    }
  }
  return { slideIds, missingSections: missing };
}

// ─── Hjälpare ──────────────────────────────────────────────────────────

// Skydda tal+enhet ("3–12 mån") mot radbrytning mitt i värdet.
function nbUnit(text) {
  return String(text || '')
    .replace(/(\d\+?) (år|mån|månader|veckor|%)/g, '$1 $2')
    .replace(/–/g, '–⁠');
}

// pptxgenjs muterar options-objekt — bygg ett färskt skugg-objekt per anrop.
function mkShadow() {
  return { type: 'outer', color: '1A2744', blur: 7, offset: 2, angle: 90, opacity: 0.16 };
}

// Grov radräkning: hur många rader text tar i en ruta av given bredd.
function rader(text, bredd, fontSize) {
  const perRad = Math.max(8, Math.floor((bredd * 72) / (fontSize * 0.5)));
  return Math.max(1, Math.ceil(String(text || '').length / perRad));
}

function hojdFor(text, bredd, fontSize, min = 0.3) {
  return Math.max(min, rader(text, bredd, fontSize) * (fontSize / 72) * 1.28 + 0.14);
}

const fasFarg = (faser, id) => String((faser && faser[id] && faser[id].farg) || PALETT.navyMid).replace('#', '');

function titelStorlek(titel, stor = 30, liten = 22) {
  const len = Array.isArray(titel) ? titel.map(t => t.text).join('').length : String(titel || '').length;
  return len > 58 ? liten : stor;
}

// Callout i webbens stil: navy band, guldkant vänster, ledordet i guld
// ("Nyckeln:", "Varning:"). Tar antingen en sträng eller { ledord, text }.
function addCallout(slide, callout, { x, y, w, h }) {
  const ledord = typeof callout === 'string' ? '' : (callout.ledord || '');
  const text = typeof callout === 'string' ? callout : callout.text;
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: PALETT.navy }, line: { color: PALETT.navy },
    shadow: mkShadow(),
  });
  slide.addShape('rect', {
    x, y, w: 0.07, h,
    fill: { color: PALETT.gold }, line: { color: PALETT.gold },
  });
  const runs = [];
  if (ledord) runs.push({ text: ledord, options: { color: PALETT.goldLight, bold: true } });
  runs.push({ text: (ledord ? ' ' : '') + text, options: { color: PALETT.white } });
  slide.addText(runs, {
    x: x + 0.25, y: y + 0.05, w: w - 0.5, h: h - 0.1,
    fontSize: 11.5, fontFace: 'Calibri', valign: 'middle', fit: 'shrink',
  });
}

function calloutHojd(callout) {
  const text = typeof callout === 'string' ? callout : `${callout.ledord || ''} ${callout.text}`;
  return Math.min(1.4, hojdFor(text, W - 1.9, 11.5, 0.6));
}

function commonHeader(slide) {
  slide.addText('Lejonfastigheter · Lokalförsörjning', {
    x: 0.5, y: 0.25, w: W - 1, h: 0.3,
    fontSize: 9, fontFace: 'Calibri',
    color: PALETT.gold, bold: true, charSpacing: 2,
  });
}

function commonFooter(slide, idx, total) {
  slide.addText(CONFIG.meta.footer, {
    x: 0.5, y: H - 0.4, w: W - 2, h: 0.3,
    fontSize: 8, fontFace: 'Calibri',
    color: PALETT.muted, italic: true,
  });
  slide.addText(`${idx} / ${total}`, {
    x: W - 1.5, y: H - 0.4, w: 1, h: 0.3,
    fontSize: 9, fontFace: 'Calibri',
    color: PALETT.muted, align: 'right',
  });
}

function addTitel(slide, s, { y = 0.7, h = 0.9, fontSize, underrubrikH = 0.45 } = {}) {
  slide.addText(s.titel, {
    x: 0.7, y, w: W - 1.4, h,
    fontSize: fontSize || titelStorlek(s.titel),
    fontFace: 'Georgia', color: PALETT.navy, bold: true, fit: 'shrink',
  });
  if (s.underrubrik) {
    slide.addText(s.underrubrik, {
      x: 0.7, y: y + h - 0.05, w: W - 1.4, h: underrubrikH,
      fontSize: 12.5, fontFace: 'Calibri',
      color: PALETT.navyMid, italic: true, valign: 'top', fit: 'shrink',
    });
  }
}

function addFotnot(slide, fotnot, y) {
  // Fotnoten hålls ovanför sidfoten även när innehållet slutar långt ned.
  const yy = Math.min(y, H - 1.05);
  slide.addText(fotnot, {
    x: 0.7, y: yy, w: W - 1.4, h: Math.min(0.72, H - 0.45 - yy),
    fontSize: 8, fontFace: 'Calibri',
    color: PALETT.muted, italic: true, valign: 'top', fit: 'shrink',
  });
}

// ─── Layouter ──────────────────────────────────────────────────────────

function layoutTitel(slide, s) {
  slide.background = { color: PALETT.navy };
  // Motiv: de fyra spårbokstäverna som diskret typografiskt element till höger.
  ['A', 'B', 'C', 'D'].forEach((bokstav, i) => {
    slide.addText(bokstav, {
      x: 8.6 + (i % 2) * 2.1, y: 1.7 + Math.floor(i / 2) * 2.3, w: 2.0, h: 2.2,
      fontSize: 130, fontFace: 'Georgia', bold: true,
      color: PALETT.goldLight, transparency: 82, align: 'center', valign: 'middle',
    });
  });
  slide.addText('Lejonfastigheter · Lokalförsörjning', {
    x: 0.7, y: 0.5, w: W - 1, h: 0.4,
    fontSize: 11, fontFace: 'Calibri',
    color: PALETT.goldLight, bold: true, charSpacing: 3,
  });
  slide.addText(s.titel, {
    x: 0.7, y: 2.0, w: W - 1.4, h: 2.0,
    fontSize: 60, fontFace: 'Georgia',
    color: PALETT.white, bold: true, fit: 'shrink',
  });
  slide.addText(s.undertitel, {
    x: 0.7, y: 4.1, w: W - 1.4, h: 0.6,
    fontSize: 18, fontFace: 'Calibri',
    color: PALETT.goldLight,
  });
  slide.addText(s.ingress, {
    x: 0.7, y: 4.9, w: W - 2.5, h: 1.4,
    fontSize: 14, fontFace: 'Calibri',
    color: 'C8CFD8', valign: 'top',
  });
  if (s.tagline) {
    slide.addText(s.tagline, {
      x: 0.7, y: H - 0.85, w: W - 1, h: 0.4,
      fontSize: 10, fontFace: 'Calibri',
      color: PALETT.goldLight, charSpacing: 4, italic: true,
    });
  }
}

function layoutTabell(slide, s) {
  slide.background = { color: PALETT.white };
  commonHeader(slide);
  addTitel(slide, s, { y: 0.7, h: 0.8 });

  const headerStyle = {
    fill: { color: PALETT.navy }, color: PALETT.white,
    bold: true, fontFace: 'Calibri', fontSize: 11,
    align: 'left', valign: 'middle',
  };
  const cellBase = {
    fontFace: 'Calibri', fontSize: 11, color: PALETT.navy,
    valign: 'middle', align: 'left',
  };
  const rows = [];
  rows.push((s.kolumner || []).map(text => ({ text, options: headerStyle })));
  (s.rader || []).forEach((rad, i) => {
    const fill = i % 2 === 0 ? PALETT.parchment : PALETT.white;
    rows.push(rad.map(cell => ({
      text: cell,
      options: { ...cellBase, fill: { color: fill } },
    })));
  });

  // Första kolumnen bredare, resten delar lika — funkar för 2–5 kolumner.
  const total = W - 1.4;
  const antalKol = (s.kolumner || []).length || 3;
  const forsta = antalKol <= 3 ? total * 0.38 : total * 0.24;
  const ovriga = (total - forsta) / Math.max(antalKol - 1, 1);
  slide.addTable(rows, {
    x: 0.7, y: 2.2, w: total,
    colW: [forsta, ...Array(antalKol - 1).fill(ovriga)],
    rowH: 0.5,
    border: { type: 'solid', color: PALETT.border, pt: 1 },
  });

  if (s.fotnot) {
    addFotnot(slide, s.fotnot, Math.min(2.2 + ((s.rader || []).length + 1) * 0.56 + 0.2, BOTTEN - 0.4));
  }
}

// Rutnät av sifferkort (2–5 st) + valfri callout — speglar webbsidans
// tldr-, kontext-, referens- och beslutskort.
function layoutKortGrid(slide, s) {
  slide.background = { color: PALETT.parchment };
  commonHeader(slide);
  addTitel(slide, s, { y: 0.7, h: 0.85 });

  const kort = s.kort || [];
  const gap = 0.35;
  const kortW = (W - 1.4 - gap * (kort.length - 1)) / kort.length;
  const kortY = 2.15;

  let botten = BOTTEN;
  const calloutH = s.callout ? calloutHojd(s.callout) : 0;
  if (s.fotnot) botten -= 0.55;
  if (s.callout) botten -= calloutH + 0.3;
  const kortH = botten - kortY;

  // Textstorlek efter den längsta beskrivningen — kontextkorten är långa.
  const langst = Math.max(0, ...kort.map(k => String(k.text || '').length));
  const textSize = langst > 300 ? 9 : langst > 180 ? 9.5 : 10.5;

  kort.forEach((k, i) => {
    const x = 0.7 + i * (kortW + gap);
    slide.addShape('rect', {
      x, y: kortY, w: kortW, h: kortH,
      fill: { color: PALETT.white }, line: { color: PALETT.border },
      shadow: mkShadow(),
    });
    // Webbens kortmotiv: tunn guldkant i överkant
    const kant = k.farg || PALETT.gold;
    slide.addShape('rect', {
      x, y: kortY, w: kortW, h: 0.055,
      fill: { color: kant }, line: { color: kant },
    });
    const langd = String(k.siffra || '').length;
    const siffraSize = langd <= 4 ? 36 : langd <= 8 ? 26 : 20;
    slide.addText(nbUnit(k.siffra), {
      x: x + 0.2, y: kortY + 0.18, w: kortW - 0.4, h: 0.7,
      fontSize: siffraSize, fontFace: 'Georgia', fit: 'shrink',
      color: PALETT.navy, bold: true, valign: 'middle',
    });
    if (k.etikett) {
      slide.addText(k.etikett, {
        x: x + 0.2, y: kortY + 0.9, w: kortW - 0.4, h: 0.35,
        fontSize: 9.5, fontFace: 'Calibri', fit: 'shrink',
        color: PALETT.gold, bold: true, charSpacing: 0.5, valign: 'middle',
      });
    }
    const textY = kortY + (k.etikett ? 1.27 : 0.95);
    const kallaH = k.kalla ? 0.42 : 0;
    slide.addText(k.text, {
      x: x + 0.2, y: textY, w: kortW - 0.4, h: kortY + kortH - textY - 0.15 - kallaH,
      fontSize: textSize, fontFace: 'Calibri',
      color: PALETT.navyMid, valign: 'top', fit: 'shrink',
    });
    if (k.kalla) {
      slide.addText(k.kalla, {
        x: x + 0.2, y: kortY + kortH - 0.5, w: kortW - 0.4, h: 0.4,
        fontSize: 7.5, fontFace: 'Calibri',
        color: PALETT.muted, italic: true, valign: 'bottom', fit: 'shrink',
      });
    }
  });

  let underY = kortY + kortH + 0.3;
  if (s.callout) {
    addCallout(slide, s.callout, { x: 0.7, y: underY, w: W - 1.4, h: calloutH });
    underY += calloutH + 0.15;
  }
  if (s.fotnot) addFotnot(slide, s.fotnot, underY);
}

// Generisk innehållsslide: stycken eller punkter under rubriken.
function layoutInnehall(slide, s) {
  slide.background = { color: PALETT.white };
  commonHeader(slide);
  addTitel(slide, s, { y: 0.7, h: 0.9 });

  const y = 2.3;
  if (Array.isArray(s.stycken) && s.stycken.length) {
    slide.addText(
      s.stycken.map(t => ({ text: t, options: { breakLine: true } })),
      {
        x: 0.9, y, w: W - 1.8, h: BOTTEN - y,
        fontSize: 13.5, fontFace: 'Calibri',
        color: PALETT.navy, valign: 'top', paraSpaceAfter: 12, fit: 'shrink',
      }
    );
  } else if (Array.isArray(s.punkter) && s.punkter.length) {
    // Fler än sex punkter sätts i två spalter så sliden inte blir en lång lista.
    const spalter = s.punkter.length > 6 ? 2 : 1;
    const perSpalt = Math.ceil(s.punkter.length / spalter);
    const spaltW = (W - 1.8 - (spalter - 1) * 0.5) / spalter;
    for (let sp = 0; sp < spalter; sp++) {
      const del = s.punkter.slice(sp * perSpalt, (sp + 1) * perSpalt);
      slide.addText(
        del.map(t => ({ text: t, options: { bullet: { code: '25CF' }, breakLine: true } })),
        {
          x: 0.9 + sp * (spaltW + 0.5), y, w: spaltW, h: BOTTEN - y,
          fontSize: spalter === 2 ? 12 : 14, fontFace: 'Calibri',
          color: PALETT.navy, valign: 'top', paraSpaceAfter: 8, fit: 'shrink',
        }
      );
    }
  }
}

// Tidsjämförelsen som fasindelad gantt — samma data, färger och nollpunkt
// som webbsidans "Så fördelar sig tiden i svenska lokalprojekt".
function layoutGantt(slide, s) {
  slide.background = { color: PALETT.white };
  commonHeader(slide);
  addTitel(slide, s, { y: 0.62, h: 0.7, fontSize: 26 });

  const rader = s.gantt || [];
  const FORE = 24, EFTER = 84, TOTAL = FORE + EFTER;
  const areaX = 3.55;
  const areaW = W - areaX - 0.8;
  const mx = (man) => areaX + ((man + FORE) / TOTAL) * areaW;
  const startY = 2.2;
  const radH = 0.5;
  const diagramH = rader.length * radH;

  // Årslinjer + etiketter
  for (let ar = -2; ar <= 7; ar++) {
    const x = mx(ar * 12);
    slide.addShape('line', {
      x, y: startY - 0.08, w: 0, h: diagramH + 0.16,
      line: { color: ar === 0 ? PALETT.navy : 'E8E4DA', width: ar === 0 ? 1.5 : 0.75 },
    });
    slide.addText(ar === 0 ? '0' : `${ar} år`, {
      x: x - 0.35, y: startY + diagramH + 0.1, w: 0.7, h: 0.22, margin: 0,
      fontSize: 8, fontFace: 'Calibri', color: PALETT.muted, align: 'center',
    });
  }
  // Nollpunktsmarkering som på webben
  slide.addShape('rect', {
    x: mx(0) - 0.55, y: startY - 0.38, w: 1.1, h: 0.3,
    fill: { color: PALETT.navy }, line: { color: PALETT.navy },
  });
  slide.addText('Uppdrag startar', {
    x: mx(0) - 0.55, y: startY - 0.38, w: 1.1, h: 0.3, margin: 0,
    fontSize: 7, fontFace: 'Calibri', bold: true,
    color: PALETT.white, align: 'center', valign: 'middle',
  });

  rader.forEach((rad, i) => {
    const y = startY + i * radH;
    slide.addText(rad.label, {
      x: 0.7, y: y + 0.02, w: areaX - 0.85, h: 0.26, margin: 0,
      fontSize: 10.5, fontFace: 'Calibri', bold: true,
      color: PALETT.navy, valign: 'middle',
    });
    if (rad.sublabel) {
      slide.addText(rad.sublabel, {
        x: 0.7, y: y + 0.27, w: areaX - 0.85, h: 0.22, margin: 0,
        fontSize: 7.5, fontFace: 'Calibri',
        color: PALETT.muted, valign: 'top', fit: 'shrink',
      });
    }
    const barY = y + 0.09;
    const barH = 0.3;
    // Verksamhetens förskede — dämpat grått före nollpunkten
    const forskedeFarg = fasFarg(s.faser, 'forskede');
    slide.addShape('rect', {
      x: mx(-rad.forskedeMan), y: barY, w: mx(0) - mx(-rad.forskedeMan), h: barH,
      fill: { color: forskedeFarg, transparency: 55 },
      line: { color: forskedeFarg, transparency: 30 },
    });
    // Fassegment i webbens färger
    let man = 0;
    for (const seg of rad.segment || []) {
      const w = seg.andel * rad.totalManader;
      const farg = fasFarg(s.faser, seg.fas);
      slide.addShape('rect', {
        x: mx(man), y: barY, w: mx(man + w) - mx(man), h: barH,
        fill: { color: farg }, line: { color: farg },
      });
      man += w;
    }
    // Totaltid efter stapeln
    const m = rad.totalManader;
    const tid = m < 12 ? `${m} mån` : `${String(Math.round(m / 12 * 10) / 10).replace('.', ',')} år`;
    slide.addText(nbUnit(tid), {
      x: mx(rad.totalManader) + 0.08, y: y + 0.02, w: 1.1, h: 0.4, margin: 0,
      fontSize: 10, fontFace: 'Georgia', bold: true,
      color: PALETT.navy, valign: 'middle',
    });
  });

  // Legend — två rader med webbens fasfärger och etiketter
  const poster = Object.values(s.faser || {});
  const legendY = startY + diagramH + 0.42;
  const kolW = (W - 1.4) / 4;
  poster.forEach((p, i) => {
    const x = 0.7 + (i % 4) * kolW;
    const y = legendY + Math.floor(i / 4) * 0.28;
    slide.addShape('rect', {
      x, y: y + 0.04, w: 0.16, h: 0.16,
      fill: { color: String(p.farg).replace('#', '') }, line: { color: String(p.farg).replace('#', '') },
    });
    slide.addText(p.label, {
      x: x + 0.24, y, w: kolW - 0.3, h: 0.26, margin: 0,
      fontSize: 7.5, fontFace: 'Calibri', color: PALETT.navyMid, valign: 'middle', fit: 'shrink',
    });
  });

  if (s.fotnot) addFotnot(slide, s.fotnot, legendY + Math.ceil(poster.length / 4) * 0.28 + 0.12);
}

// Spåröversikten som webbens fyra spårkort: färgad cirkelbadge, namn,
// beskrivning, tid i spårets färg, förutsättning och varningsruta.
function layoutSparKort(slide, s) {
  slide.background = { color: PALETT.white };
  commonHeader(slide);
  addTitel(slide, s, { y: 0.7, h: 0.85 });

  const kort = s.sparKort || [];
  const gap = 0.35;
  const kortW = (W - 1.4 - gap * (kort.length - 1)) / kort.length;
  const kortY = 2.15;
  const kortH = BOTTEN - kortY;

  kort.forEach((k, i) => {
    const x = 0.7 + i * (kortW + gap);
    slide.addShape('rect', {
      x, y: kortY, w: kortW, h: kortH,
      fill: { color: PALETT.white }, line: { color: PALETT.border },
      shadow: mkShadow(),
    });
    slide.addShape('ellipse', {
      x: x + 0.25, y: kortY + 0.25, w: 0.52, h: 0.52,
      fill: { color: k.farg }, line: { color: k.farg },
    });
    slide.addText(k.bokstav, {
      x: x + 0.25, y: kortY + 0.25, w: 0.52, h: 0.52, margin: 0,
      fontSize: 17, fontFace: 'Georgia', bold: true,
      color: PALETT.white, align: 'center', valign: 'middle',
    });
    if (k.niva) {
      slide.addText(`Nivå ${k.niva}`, {
        x: x + kortW - 1.05, y: kortY + 0.3, w: 0.85, h: 0.3, margin: 0,
        fontSize: 9, fontFace: 'Calibri', bold: true,
        color: PALETT.gold, align: 'right', charSpacing: 1,
      });
    }
    slide.addText(k.namn, {
      x: x + 0.25, y: kortY + 0.92, w: kortW - 0.5, h: 0.35, margin: 0,
      fontSize: 15, fontFace: 'Georgia', bold: true,
      color: PALETT.navy,
    });
    slide.addText(k.subtitle, {
      x: x + 0.25, y: kortY + 1.3, w: kortW - 0.5, h: 0.6, margin: 0,
      fontSize: 9.5, fontFace: 'Calibri',
      color: PALETT.muted, valign: 'top', fit: 'shrink',
    });
    slide.addText(nbUnit(k.tid), {
      x: x + 0.25, y: kortY + 1.92, w: kortW - 0.5, h: 0.42, margin: 0,
      fontSize: 18, fontFace: 'Georgia', bold: true,
      color: k.farg, valign: 'middle', fit: 'shrink',
    });
    if (k.forutsattning) {
      slide.addText('Förutsättning', {
        x: x + 0.25, y: kortY + 2.4, w: kortW - 0.5, h: 0.22, margin: 0,
        fontSize: 8, fontFace: 'Calibri', bold: true,
        color: PALETT.gold, charSpacing: 1,
      });
      slide.addText(k.forutsattning, {
        x: x + 0.25, y: kortY + 2.62, w: kortW - 0.5, h: kortH - 3.6, margin: 0,
        fontSize: 8, fontFace: 'Calibri',
        color: PALETT.navyMid, valign: 'top', fit: 'shrink',
      });
    }
    slide.addShape('rect', {
      x: x + 0.18, y: kortY + kortH - 0.95, w: kortW - 0.36, h: 0.8,
      fill: { color: 'F7F2E4' }, line: { color: 'E3D9BE' },
    });
    slide.addText(k.varning, {
      x: x + 0.28, y: kortY + kortH - 0.92, w: kortW - 0.56, h: 0.74, margin: 0,
      fontSize: 8.5, fontFace: 'Calibri', italic: true,
      color: PALETT.navyMid, valign: 'middle', fit: 'shrink',
    });
  });
}

// Ett spårs scenarier sida vid sida med samtliga faser — motsvarar
// .scenario-card på webbsidan.
function layoutScenario(slide, s) {
  slide.background = { color: PALETT.parchment };
  commonHeader(slide);
  addTitel(slide, s, { y: 0.65, h: 0.8 });

  const kolumner = s.scenarier || [];
  const gap = 0.4;
  const kolW = (W - 1.4 - gap * (kolumner.length - 1)) / kolumner.length;
  const kolY = 1.98;
  const headH = 0.5;

  kolumner.forEach((sc, i) => {
    const x = 0.7 + i * (kolW + gap);
    slide.addShape('rect', {
      x, y: kolY, w: kolW, h: headH,
      fill: { color: sc.farg }, line: { color: sc.farg },
    });
    slide.addText(sc.namn, {
      x: x + 0.18, y: kolY, w: kolW - 1.5, h: headH, margin: 0,
      fontSize: 12.5, fontFace: 'Georgia', bold: true,
      color: PALETT.white, valign: 'middle', fit: 'shrink',
    });
    slide.addText(nbUnit(sc.totalText), {
      x: x + kolW - 1.45, y: kolY, w: 1.3, h: headH, margin: 0,
      fontSize: 12, fontFace: 'Georgia', bold: true,
      color: PALETT.white, align: 'right', valign: 'middle',
    });

    const faser = sc.faser || [];
    const yta = BOTTEN - (kolY + headH + 0.12);
    const radH = Math.min(0.62, yta / Math.max(faser.length, 1));
    faser.forEach((f, j) => {
      const y = kolY + headH + 0.12 + j * radH;
      slide.addShape('rect', {
        x, y, w: kolW, h: radH - 0.06,
        fill: { color: PALETT.white }, line: { color: PALETT.border },
      });
      slide.addShape('ellipse', {
        x: x + 0.14, y: y + 0.13, w: 0.12, h: 0.12,
        fill: { color: fasFarg(s.faser, f.fas) }, line: { color: fasFarg(s.faser, f.fas) },
      });
      slide.addText(nbUnit(f.tid), {
        x: x + 0.32, y: y + 0.02, w: 1.0, h: 0.26, margin: 0,
        fontSize: 9.5, fontFace: 'Georgia', bold: true,
        color: PALETT.navyMid, valign: 'middle', fit: 'shrink',
      });
      slide.addText(f.namn, {
        x: x + 1.35, y: y + 0.02, w: kolW - 1.5, h: 0.26, margin: 0,
        fontSize: 10, fontFace: 'Calibri', bold: true,
        color: PALETT.navy, valign: 'middle', fit: 'shrink',
      });
      if (f.kommentar) {
        slide.addText(f.kommentar, {
          x: x + 1.35, y: y + 0.26, w: kolW - 1.5, h: radH - 0.32, margin: 0,
          fontSize: 7.5, fontFace: 'Calibri',
          color: PALETT.muted, valign: 'top', fit: 'shrink',
        });
      }
    });
  });
}

// Kort med rubrik och rader (etikett/värde), valfri brödtext och källa —
// speglar webbens .typ-kort, .modul-kort och .kostnad-kort.
function layoutTypKort(slide, s) {
  slide.background = { color: PALETT.parchment };
  commonHeader(slide);
  addTitel(slide, s, { y: 0.62, h: 0.75, fontSize: 28 });

  let kortY = 1.95;
  if (s.ingress) {
    slide.addText(s.ingress, {
      x: 0.7, y: 1.72, w: W - 1.4, h: 0.62,
      fontSize: 9.5, fontFace: 'Calibri',
      color: PALETT.navyMid, valign: 'top', fit: 'shrink',
    });
    kortY = 2.42;
  }

  let botten = BOTTEN;
  const calloutH = s.callout ? calloutHojd(s.callout) : 0;
  if (s.fotnot) botten -= 0.55;
  if (s.callout) botten -= calloutH + 0.25;
  const kortH = botten - kortY;

  const kort = s.kort || [];
  const gap = 0.35;
  const kortW = (W - 1.4 - gap * (kort.length - 1)) / kort.length;

  kort.forEach((k, i) => {
    const x = 0.7 + i * (kortW + gap);
    slide.addShape('rect', {
      x, y: kortY, w: kortW, h: kortH,
      fill: { color: PALETT.white }, line: { color: PALETT.border },
      shadow: mkShadow(),
    });
    slide.addShape('rect', {
      x, y: kortY, w: kortW, h: 0.055,
      fill: { color: PALETT.gold }, line: { color: PALETT.gold },
    });
    slide.addText(k.namn, {
      x: x + 0.22, y: kortY + 0.16, w: kortW - 0.44, h: 0.48,
      fontSize: 13.5, fontFace: 'Georgia', bold: true,
      color: PALETT.navy, valign: 'top', fit: 'shrink',
    });
    let y = kortY + 0.66;
    if (k.eyebrow) {
      slide.addText(k.eyebrow, {
        x: x + 0.22, y, w: kortW - 0.44, h: 0.24, margin: 0,
        fontSize: 8.5, fontFace: 'Calibri', bold: true,
        color: PALETT.gold, charSpacing: 0.5, fit: 'shrink',
      });
      y += 0.26;
    }
    const radW = kortW - 0.44;
    for (const rad of k.rader || []) {
      // Höjden följer den rad som behöver flest rader (t.ex. LSS-storleken).
      const radH = Math.max(
        0.32,
        Math.max(rader(rad.label, radW * 0.54, 8.5), rader(rad.val, radW * 0.44, 8.5)) * 0.15 + 0.14
      );
      slide.addShape('line', {
        x: x + 0.22, y, w: radW, h: 0,
        line: { color: PALETT.border, width: 0.75 },
      });
      slide.addText(rad.label, {
        x: x + 0.22, y: y + 0.02, w: radW * 0.54, h: radH - 0.04, margin: 0,
        fontSize: 8.5, fontFace: 'Calibri',
        color: PALETT.muted, valign: 'middle', fit: 'shrink',
      });
      slide.addText(nbUnit(rad.val), {
        x: x + 0.22 + radW * 0.54, y: y + 0.02, w: radW * 0.46, h: radH - 0.04, margin: 0,
        fontSize: 8.5, fontFace: 'Calibri', bold: true,
        color: PALETT.navy, align: 'right', valign: 'middle', fit: 'shrink',
      });
      y += radH;
    }
    // Kort utan värderader (kostnadskorten) har längre källrad.
    const kallaH = k.kalla ? ((k.rader || []).length ? 0.32 : 0.5) : 0;
    if (k.insikt) {
      const langd = String(k.insikt).length;
      slide.addText(k.insikt, {
        x: x + 0.22, y: y + 0.06, w: kortW - 0.44, h: kortY + kortH - y - 0.15 - kallaH,
        fontSize: langd > 400 ? 7.5 : langd > 250 ? 8 : 9.5, fontFace: 'Calibri',
        color: PALETT.navyMid, valign: 'top', fit: 'shrink',
      });
    }
    if (k.kalla) {
      slide.addText(k.kalla, {
        x: x + 0.22, y: kortY + kortH - kallaH - 0.1, w: kortW - 0.44, h: kallaH + 0.04,
        fontSize: 7.5, fontFace: 'Calibri',
        color: PALETT.muted, italic: true, valign: 'bottom', fit: 'shrink',
      });
    }
  });

  let underY = kortY + kortH + 0.25;
  if (s.callout) {
    addCallout(slide, s.callout, { x: 0.7, y: underY, w: W - 1.4, h: calloutH });
    underY += calloutH + 0.15;
  }
  if (s.fotnot) addFotnot(slide, s.fotnot, underY);
}

// Stor siffra + punkter till höger, kostnadslåsningskurvan som native
// linjediagram till vänster — speglar webbsidans S-kurva.
function layoutKurva(slide, s) {
  slide.background = { color: PALETT.parchment };
  commonHeader(slide);
  addTitel(slide, s, { y: 0.7, h: 0.85 });

  const k = s.kurva || {};
  slide.addChart('line', (k.serier || []).map(serie => ({
    name: serie.namn,
    labels: k.skeden || [],
    values: serie.varden || [],
  })), {
    x: 0.7, y: 2.2, w: 6.6, h: 3.9,
    chartColors: [PALETT.gold, PALETT.navyMid],
    lineSmooth: true,
    lineSize: 2.5,
    lineDataSymbol: 'none',
    showLegend: true, legendPos: 'b', legendFontSize: 10, legendColor: PALETT.navy,
    catAxisLabelColor: PALETT.navyMid, catAxisLabelFontSize: 9,
    valAxisLabelColor: PALETT.muted, valAxisLabelFontSize: 9,
    valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25,
    valAxisLabelFormatCode: '0"%"',
    valGridLine: { color: 'E5E1D6', size: 0.75, style: 'solid' },
    catGridLine: { style: 'none' },
    chartArea: { fill: { color: PALETT.white } },
  });

  slide.addText(nbUnit(s.siffra), {
    x: 7.7, y: 2.2, w: W - 8.4, h: 1.1,
    fontSize: 48, fontFace: 'Georgia', fit: 'shrink',
    color: PALETT.navy, bold: true,
  });
  slide.addText(nbUnit(s.siffra_etikett), {
    x: 7.7, y: 3.25, w: W - 8.4, h: 0.5,
    fontSize: 11, fontFace: 'Calibri', bold: true,
    color: PALETT.gold, charSpacing: 1, fit: 'shrink',
  });
  slide.addText(
    (s.punkter || []).map(t => ({ text: t, options: { bullet: { code: '25CF' }, breakLine: true } })),
    {
      x: 7.7, y: 3.85, w: W - 8.4, h: 2.2,
      fontSize: 12, fontFace: 'Calibri',
      color: PALETT.navy, valign: 'top',
      paraSpaceAfter: 6, fit: 'shrink',
    }
  );

  if (s.fotnot) addFotnot(slide, s.fotnot, 6.3);
}

// Stegrader i webbens stil (.prov-steg): grupperade under en guldetikett,
// vit rad med stort guldnummer, rubrik och beskrivning.
function layoutSteg(slide, s) {
  slide.background = { color: PALETT.parchment };
  commonHeader(slide);
  addTitel(slide, s, { y: 0.6, h: 0.65, fontSize: 26 });

  const grupper = s.grupper || [];
  const startY = 1.35;
  const etikettH = 0.28;
  const gap = 0.05;
  const textBredd = W - 2.3;
  const textSize = 9.5;

  // Radhöjd efter textmängd; skalas ned om helheten inte ryms över sidan.
  const hojder = grupper.map(g => (g.steg || []).map(st => {
    const n = rader(st.text, textBredd, textSize);
    return 0.3 + n * 0.24;
  }));
  const summa = hojder.flat().reduce((a, b) => a + b, 0)
    + grupper.length * (etikettH + 0.04)
    + hojder.flat().length * gap;
  const yta = (s.fotnot ? BOTTEN - 0.5 : BOTTEN) - startY;
  const skala = summa > yta ? yta / summa : 1;

  let y = startY;
  grupper.forEach((g, gi) => {
    if (g.etikett) {
      slide.addText(g.etikett.toUpperCase(), {
        x: 0.7, y, w: W - 1.4, h: etikettH,
        fontSize: 9, fontFace: 'Calibri',
        color: PALETT.gold, bold: true, charSpacing: 3, valign: 'bottom',
      });
      y += (etikettH + 0.04) * skala;
    }
    (g.steg || []).forEach((st, si) => {
      const radH = hojder[gi][si] * skala;
      slide.addShape('rect', {
        x: 0.7, y, w: W - 1.4, h: radH,
        fill: { color: PALETT.white }, line: { color: PALETT.border },
      });
      slide.addText(String(st.nr), {
        x: 0.85, y, w: 0.55, h: radH,
        fontSize: 19, fontFace: 'Georgia',
        color: PALETT.gold, bold: true, valign: 'middle',
      });
      slide.addText(st.titel, {
        x: 1.45, y: y + 0.03, w: textBredd, h: 0.24,
        fontSize: 12, fontFace: 'Georgia',
        color: PALETT.navy, bold: true, valign: 'top',
      });
      slide.addText(st.text, {
        x: 1.45, y: y + 0.25, w: textBredd, h: radH - 0.28,
        fontSize: textSize, fontFace: 'Calibri',
        color: PALETT.navyMid, valign: 'top', fit: 'shrink',
      });
      y += radH + gap;
    });
  });

  if (s.fotnot) addFotnot(slide, s.fotnot, Math.min(y + 0.15, BOTTEN - 0.45));
}

// Två–tre vita kort med rubrik (ev. chip) och punktlista — samma motiv som
// webbens "Varför drar det ut på tiden?", spårens meta-boxar och källgrupper.
const CHIP = {
  lag:    { fill: 'E9EFFD', text: '2563EB' },
  kommun: { fill: 'E6F4EF', text: '059669' },
  risk:   { fill: 'FBEAE7', text: 'C0392B' },
  passar: { fill: 'E6F4EF', text: '059669' },
};
function layoutPunktKort(slide, s) {
  slide.background = { color: PALETT.parchment };
  commonHeader(slide);
  addTitel(slide, s, { y: 0.7, h: 0.75, fontSize: 28, underrubrikH: 0.62 });

  const kort = s.kort || [];
  const gap = 0.4;
  const kortW = (W - 1.4 - gap * (kort.length - 1)) / kort.length;
  const kortY = 2.05;

  let botten = BOTTEN;
  const calloutH = s.callout ? calloutHojd(s.callout) : 0;
  if (s.callout) botten -= calloutH + 0.3;
  const kortH = botten - kortY;

  kort.forEach((k, i) => {
    const x = 0.7 + i * (kortW + gap);
    slide.addShape('rect', {
      x, y: kortY, w: kortW, h: kortH,
      fill: { color: PALETT.white }, line: { color: PALETT.border },
      shadow: mkShadow(),
    });
    const chip = CHIP[k.chipFarg] || CHIP.lag;
    slide.addShape('rect', {
      x, y: kortY, w: kortW, h: 0.055,
      fill: { color: chip.text }, line: { color: chip.text },
    });
    let rubrikX = x + 0.3;
    let rubrikW = kortW - 0.6;
    if (k.chip) {
      const chipW = 0.3 + k.chip.length * 0.085;
      slide.addShape('roundRect', {
        x: x + 0.3, y: kortY + 0.3, w: chipW, h: 0.3, rectRadius: 0.15,
        fill: { color: chip.fill }, line: { color: chip.text, width: 0.75 },
      });
      slide.addText(k.chip.toUpperCase(), {
        x: x + 0.3, y: kortY + 0.3, w: chipW, h: 0.3,
        fontSize: 8, fontFace: 'Calibri', bold: true, charSpacing: 1.5,
        color: chip.text, align: 'center', valign: 'middle',
      });
      rubrikX = x + 0.3 + chipW + 0.1;
      rubrikW = kortW - chipW - 0.7;
    }
    if (k.rubrik) {
      slide.addText(k.rubrik, {
        x: rubrikX, y: kortY + 0.25, w: rubrikW, h: 0.4,
        fontSize: 13, fontFace: 'Georgia',
        color: PALETT.navy, bold: true, valign: 'middle', fit: 'shrink',
      });
    }
    slide.addText(
      (k.punkter || []).map(t => ({ text: t, options: { bullet: { code: '25CF' }, breakLine: true } })),
      {
        x: x + 0.3, y: kortY + 0.8, w: kortW - 0.6, h: kortH - 1.0,
        fontSize: 10.5, fontFace: 'Calibri',
        color: PALETT.navyMid, valign: 'top', paraSpaceAfter: 6, fit: 'shrink',
      }
    );
  });

  if (s.callout) {
    addCallout(slide, s.callout, { x: 0.7, y: kortY + kortH + 0.3, w: W - 1.4, h: calloutH });
  }
}

const LAYOUTER = {
  'titel':       layoutTitel,
  'tabell':      layoutTabell,
  'kort-grid':   layoutKortGrid,
  'innehall':    layoutInnehall,
  'gantt':       layoutGantt,
  'spar-kort':   layoutSparKort,
  'scenario':    layoutScenario,
  'typ-kort':    layoutTypKort,
  'kurva':       layoutKurva,
  'steg':        layoutSteg,
  'punkt-kort':  layoutPunktKort,
};

function newDeck() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = 'Lejonfastigheter — Från behov till inflyttning (populärversion)';
  pptx.subject = 'Lokalförsörjning · Internt arbetsmaterial';
  pptx.author = 'Lejonfastigheter AB';
  pptx.company = 'Lejonfastigheter AB';
  return pptx;
}

// Slide-poster ur JSON + sidans innehåll → renderklara slide-objekt.
function byggSlides(ids) {
  return pickSlides(ids).map(cfg => byggSlide(cfg));
}

function renderSlides(pptx, slides, { spela } = {}) {
  slides.forEach((s, i) => {
    const layoutFn = LAYOUTER[s.layout];
    if (!layoutFn) {
      throw new Error(`Okänd layout '${s.layout}' för slide '${s.id}'.`);
    }
    const slide = pptx.addSlide();
    if (spela) spela(slide, s);
    layoutFn(slide, s);
    if (s.layout !== 'titel') commonFooter(slide, i + 1, slides.length);
  });
}

// Alla textsträngar som faktiskt ritas ut, per slide — underlag för
// lib/__tests__/pptx-trohet.test.js.
function slideTexter(ids) {
  const pptx = newDeck();
  const slides = byggSlides(ids);
  const ut = [];
  renderSlides(pptx, slides, {
    spela(slide, s) {
      const post = { id: s.id, layout: s.layout, texter: [] };
      ut.push(post);
      const samla = (t) => {
        if (t == null) return;
        if (Array.isArray(t)) return t.forEach(samla);
        if (typeof t === 'object') return samla(t.text);
        const str = String(t).trim();
        if (str) post.texter.push(str);
      };
      const origText = slide.addText.bind(slide);
      slide.addText = (t, o) => { samla(t); return origText(t, o); };
      const origTable = slide.addTable.bind(slide);
      slide.addTable = (rows, o) => { samla(rows); return origTable(rows, o); };
      const origChart = slide.addChart.bind(slide);
      slide.addChart = (typ, data, o) => {
        (data || []).forEach(d => { samla(d.name); samla(d.labels); });
        return origChart(typ, data, o);
      };
    },
  });
  return ut;
}

// Mappa sektion-val till slide-id:n och sätt en titelslide som omslag
// så att en skräddarsydd export blir en komplett presentation.
function idsForSections(sectionIds) {
  const mapped = slidesForSections(sectionIds);
  let ids = mapped.slideIds;
  if (ids.length && !ids.includes('titel')) ids = ['titel', ...ids];
  return { ids, missingSections: mapped.missingSections };
}

// Bygger en pptx. Antingen anges `slideIds` direkt eller `sectionIds` —
// i andra fallet mappas sektion-id:n till slide-id:n via `ankare`-fältet.
// Returnerar { buffer, slideIds, missingSections }.
async function buildPptx({ slideIds, sectionIds } = {}) {
  let ids = slideIds;
  let missingSections = [];
  if (!ids && sectionIds) {
    const mapped = idsForSections(sectionIds);
    ids = mapped.ids;
    missingSections = mapped.missingSections;
    // Angivna sektioner som inte gav en enda slide får inte falla tillbaka
    // till populärversionen — tomt resultat låter API:t svara 400.
    if (sectionIds.length && !ids.length) {
      return { buffer: null, slideIds: [], missingSections };
    }
  }
  const slides = byggSlides(ids);
  const pptx = newDeck();
  renderSlides(pptx, slides);
  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  return {
    buffer,
    slideIds: slides.map(s => s.id),
    missingSections,
  };
}

// Skriver pptx direkt till disk (används av CLI).
async function writePptxToFile({ slideIds, sectionIds, outPath }) {
  let ids = slideIds;
  let missingSections = [];
  if (!ids && sectionIds) {
    const mapped = idsForSections(sectionIds);
    ids = mapped.ids;
    missingSections = mapped.missingSections;
    if (sectionIds.length && !ids.length) {
      throw new Error(`Ingen av sektionerna har en kurerad slide: ${missingSections.join(', ')}`);
    }
  }
  const slides = byggSlides(ids);
  const pptx = newDeck();
  renderSlides(pptx, slides);
  await pptx.writeFile({ fileName: outPath });
  return {
    slideIds: slides.map(s => s.id),
    missingSections,
  };
}

module.exports = {
  buildPptx,
  writePptxToFile,
  slidesForSections,
  allSlideIds,
  byggSlides,
  slideTexter,
  CONFIG,
};
