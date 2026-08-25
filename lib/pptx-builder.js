/* eslint-disable no-console */
// Bygger en .pptx-populärversion av lokalförsörjningsmaterialet.
//
// Användning:
//   const { buildPptx, slidesForSections, allSlideIds } = require('./lib/pptx-builder');
//   const buffer = await buildPptx({ slideIds: ['hierarki', 'kostnad-80'] });
//
// Slides definieras i scripts/popular-slides.json. Varje slide har ett
// `ankare`-fält som pekar mot ett sektion-id i lokalforsorjning.html — det
// används av slidesForSections() för att gå från sektion-val till slide-val.

const PptxGenJS = require('pptxgenjs');

const CONFIG = require('../scripts/popular-slides.json');

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

// ─── Layouter ──────────────────────────────────────────────────────────

// Skydda tal+enhet ("3–12 mån") mot radbrytning mitt i värdet.
function nbUnit(text) {
  return String(text || '')
    .replace(/(\d\+?) (år|mån|månader|veckor|%)/g, '$1 $2')
    .replace(/–/g, '–⁠');
}

// pptxgenjs muterar options-objekt — bygg ett färskt skugg-objekt per anrop.
function mkShadow() {
  return { type: 'outer', color: '1A2744', blur: 7, offset: 2, angle: 90, opacity: 0.16 };
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
    color: PALETT.white, bold: true,
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

function layoutSiffraStor(slide, s) {
  slide.background = { color: PALETT.parchment };
  commonHeader(slide);

  slide.addText(s.titel, {
    x: 0.7, y: 0.7, w: W - 1.4, h: 0.9,
    fontSize: 32, fontFace: 'Georgia',
    color: PALETT.navy, bold: true,
  });
  if (s.underrubrik) {
    slide.addText(s.underrubrik, {
      x: 0.7, y: 1.55, w: W - 1.4, h: 0.4,
      fontSize: 14, fontFace: 'Calibri',
      color: PALETT.navyMid, italic: true,
    });
  }

  const boxH = s.faser ? 3.1 : 3.7;
  slide.addShape('rect', {
    x: 0.7, y: 2.25, w: 4.8, h: boxH,
    fill: { color: PALETT.navy }, line: { color: PALETT.navy },
    shadow: mkShadow(),
  });
  if (s.badge) {
    slide.addShape('ellipse', {
      x: 0.95, y: 2.5, w: 0.55, h: 0.55,
      fill: { color: PALETT.gold }, line: { color: PALETT.gold },
    });
    slide.addText(s.badge, {
      x: 0.95, y: 2.5, w: 0.55, h: 0.55, margin: 0,
      fontSize: 20, fontFace: 'Georgia', bold: true,
      color: PALETT.navy, align: 'center', valign: 'middle',
    });
  }
  // Siffra + etikett centrerade som grupp; nbsp hindrar brytning mitt i värdet.
  const siffraLen = String(s.siffra || '').length;
  const siffraSize = siffraLen <= 6 ? 72 : siffraLen <= 8 ? 44 : 40;
  slide.addText(nbUnit(s.siffra), {
    x: 0.95, y: 2.45, w: 4.3, h: boxH - 1.05,
    fontSize: siffraSize, fontFace: 'Georgia', fit: 'shrink',
    color: PALETT.goldLight, bold: true, align: 'center', valign: 'middle',
  });
  slide.addText(nbUnit(s.siffra_etikett), {
    x: 1.0, y: 2.25 + boxH - 0.95, w: 4.2, h: 0.8,
    fontSize: 12, fontFace: 'Calibri',
    color: PALETT.white, align: 'center', valign: 'middle',
  });

  slide.addText(
    (s.punkter || []).map(t => ({ text: t, options: { bullet: { code: '25CF' }, breakLine: true } })),
    {
      x: 6.0, y: 2.35, w: W - 6.7, h: boxH,
      fontSize: 14, fontFace: 'Calibri',
      color: PALETT.navy, valign: 'top',
      paraSpaceAfter: 8,
    }
  );

  // Horisontell fas-tidslinje över hela bredden — fyller nederdelen och
  // visar skedena bakom totalsiffran.
  if (Array.isArray(s.faser) && s.faser.length) {
    const stripY = 2.25 + boxH + 0.45;
    slide.addText('TYPISKA SKEDEN', {
      x: 0.7, y: stripY - 0.32, w: 4, h: 0.28, margin: 0,
      fontSize: 9, fontFace: 'Calibri',
      color: PALETT.gold, bold: true, charSpacing: 2,
    });
    const stripW = W - 1.4;
    const gap = 0.06;
    const segW = (stripW - gap * (s.faser.length - 1)) / s.faser.length;
    const toner = [PALETT.navyMid, '3D5178', PALETT.navy, '52659B', PALETT.navyMid];
    s.faser.forEach((fas, i) => {
      const x = 0.7 + i * (segW + gap);
      slide.addShape('rect', {
        x, y: stripY, w: segW, h: 0.72,
        fill: { color: toner[i % toner.length] }, line: { color: toner[i % toner.length] },
      });
      slide.addText(fas.namn, {
        x: x + 0.12, y: stripY + 0.07, w: segW - 0.24, h: 0.3, margin: 0,
        fontSize: 9.5, fontFace: 'Calibri', bold: true,
        color: PALETT.white, fit: 'shrink',
      });
      slide.addText(nbUnit(fas.tid), {
        x: x + 0.12, y: stripY + 0.37, w: segW - 0.24, h: 0.3, margin: 0,
        fontSize: 11, fontFace: 'Georgia', bold: true,
        color: PALETT.goldLight,
      });
      if (i < s.faser.length - 1) {
        slide.addText('›', {
          x: x + segW - 0.08, y: stripY + 0.16, w: 0.22, h: 0.4, margin: 0,
          fontSize: 16, fontFace: 'Georgia', bold: true,
          color: PALETT.gold, align: 'center',
        });
      }
    });
  }

  if (s.kalla) {
    slide.addText('Källa: ' + s.kalla, {
      x: 0.7, y: H - 0.78, w: W - 1.4, h: 0.3,
      fontSize: 9, fontFace: 'Calibri',
      color: PALETT.muted, italic: true,
    });
  }
}

function layoutTrappa(slide, s) {
  slide.background = { color: PALETT.white };
  commonHeader(slide);

  slide.addText(s.titel, {
    x: 0.7, y: 0.7, w: W - 1.4, h: 0.8,
    fontSize: 30, fontFace: 'Georgia',
    color: PALETT.navy, bold: true,
  });
  if (s.underrubrik) {
    slide.addText(s.underrubrik, {
      x: 0.7, y: 1.45, w: W - 1.4, h: 0.4,
      fontSize: 13, fontFace: 'Calibri',
      color: PALETT.navyMid, italic: true,
    });
  }

  const startY = 2.1;
  const stegHojd = 0.78;
  const fyll = [0.22, 0.45, 0.68, 0.92];
  (s.steg || []).forEach((steg, i) => {
    const f = fyll[Math.min(i, fyll.length - 1)];
    const y = startY + i * (stegHojd + 0.12);
    slide.addShape('rect', {
      x: 0.7, y: y, w: 0.12, h: stegHojd,
      fill: { color: PALETT.gold, transparency: Math.round((1 - f) * 100) },
      line: { color: PALETT.gold, transparency: Math.round((1 - f) * 100) }
    });
    slide.addShape('rect', {
      x: 0.82, y: y, w: W - 1.5, h: stegHojd,
      fill: { color: PALETT.parchment }, line: { color: PALETT.border }
    });
    slide.addText(String(steg.niva), {
      x: 0.92, y: y, w: 0.7, h: stegHojd,
      fontSize: 36, fontFace: 'Georgia',
      color: PALETT.gold, bold: true, align: 'center', valign: 'middle',
    });
    slide.addText(steg.namn, {
      x: 1.7, y: y + 0.05, w: 6.5, h: 0.4,
      fontSize: 16, fontFace: 'Georgia',
      color: PALETT.navy, bold: true, valign: 'middle',
    });
    slide.addText(steg.beskrivning, {
      x: 1.7, y: y + 0.42, w: 6.5, h: 0.34,
      fontSize: 11, fontFace: 'Calibri',
      color: PALETT.navyMid, valign: 'middle',
    });
    slide.addText(steg.ledtid, {
      x: 8.4, y: y, w: W - 9.1, h: stegHojd,
      fontSize: 18, fontFace: 'Georgia',
      color: PALETT.navy, bold: true, align: 'right', valign: 'middle',
    });
  });

  if (s.callout) {
    const calloutY = startY + (s.steg || []).length * (stegHojd + 0.12) + 0.15;
    slide.addShape('rect', {
      x: 0.7, y: calloutY, w: W - 1.4, h: 0.85,
      fill: { color: 'FFF5DC' }, line: { color: PALETT.goldLight }
    });
    slide.addText(s.callout, {
      x: 0.95, y: calloutY + 0.05, w: W - 1.7, h: 0.75,
      fontSize: 11, fontFace: 'Calibri',
      color: PALETT.navy, italic: true, valign: 'middle',
    });
  }
}

function layoutTabell(slide, s) {
  slide.background = { color: PALETT.white };
  commonHeader(slide);

  slide.addText(s.titel, {
    x: 0.7, y: 0.7, w: W - 1.4, h: 0.8,
    fontSize: 30, fontFace: 'Georgia',
    color: PALETT.navy, bold: true,
  });
  if (s.underrubrik) {
    slide.addText(s.underrubrik, {
      x: 0.7, y: 1.45, w: W - 1.4, h: 0.4,
      fontSize: 13, fontFace: 'Calibri',
      color: PALETT.navyMid, italic: true,
    });
  }

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
    x: 0.7, y: 2.1, w: total,
    colW: [forsta, ...Array(antalKol - 1).fill(ovriga)],
    rowH: 0.5,
    border: { type: 'solid', color: PALETT.border, pt: 1 },
  });

  if (s.fotnot) {
    const fotnotY = Math.min(2.1 + ((s.rader || []).length + 1) * 0.56 + 0.2, H - 1.0);
    slide.addText(s.fotnot, {
      x: 0.7, y: fotnotY, w: W - 1.4, h: 0.5,
      fontSize: 9, fontFace: 'Calibri',
      color: PALETT.muted, italic: true,
    });
  }
}

function layoutTvaSpalter(slide, s) {
  slide.background = { color: PALETT.navy };
  slide.addText('Lejonfastigheter · Lokalförsörjning', {
    x: 0.7, y: 0.3, w: W - 1, h: 0.3,
    fontSize: 9, fontFace: 'Calibri',
    color: PALETT.goldLight, bold: true, charSpacing: 2,
  });

  slide.addText(s.titel, {
    x: 0.7, y: 0.8, w: W - 1.4, h: 1.25,
    fontSize: 28, fontFace: 'Georgia',
    color: PALETT.white, bold: true, valign: 'top',
  });
  if (s.underrubrik) {
    slide.addText(s.underrubrik, {
      x: 0.7, y: 2.05, w: W - 1.4, h: 0.4,
      fontSize: 13, fontFace: 'Calibri',
      color: PALETT.goldLight, italic: true,
    });
  }

  const colW = (W - 1.4 - 0.4) / 2;
  const colY = 2.6;
  const colH = 3.8;
  (s.kolumner || []).forEach((col, i) => {
    const x = 0.7 + i * (colW + 0.4);
    slide.addShape('rect', {
      x, y: colY, w: colW, h: colH,
      fill: { color: '23375B' },
      line: { color: 'FFFFFF', transparency: 75 }
    });
    if (col.stamp) {
      slide.addText(col.stamp, {
        x: x + 0.3, y: colY + 0.25, w: colW - 0.6, h: 0.35,
        fontSize: 9, fontFace: 'Calibri',
        color: i === 0 ? 'FCA5A5' : PALETT.goldLight,
        bold: true, charSpacing: 3,
      });
    }
    slide.addText(col.rubrik, {
      x: x + 0.3, y: colY + 0.65, w: colW - 0.6, h: 0.6,
      fontSize: 18, fontFace: 'Georgia',
      color: PALETT.white, bold: true,
    });
    slide.addText(col.innehall, {
      x: x + 0.3, y: colY + 1.4, w: colW - 0.6, h: colH - 1.7,
      fontSize: 12, fontFace: 'Calibri',
      color: 'D8DBE6', valign: 'top',
      paraSpaceAfter: 6,
    });
  });

  if (s.fotnot) {
    slide.addText(s.fotnot, {
      x: 0.7, y: H - 0.9, w: W - 1.4, h: 0.4,
      fontSize: 9, fontFace: 'Calibri',
      color: 'A9B2C4', italic: true,
    });
  }
}

// Rutnät av sifferkort (2–4 st) + valfri callout — speglar webbsidans
// tldr-/kontext-/modulkort.
function layoutKortGrid(slide, s) {
  slide.background = { color: PALETT.parchment };
  commonHeader(slide);

  slide.addText(s.titel, {
    x: 0.7, y: 0.7, w: W - 1.4, h: 0.9,
    fontSize: 30, fontFace: 'Georgia',
    color: PALETT.navy, bold: true,
  });
  if (s.underrubrik) {
    slide.addText(s.underrubrik, {
      x: 0.7, y: 1.55, w: W - 1.4, h: 0.4,
      fontSize: 13, fontFace: 'Calibri',
      color: PALETT.navyMid, italic: true,
    });
  }

  const kort = s.kort || [];
  const gap = 0.35;
  const kortW = (W - 1.4 - gap * (kort.length - 1)) / kort.length;
  const kortY = 2.2;
  const kortH = s.callout ? 2.95 : 3.4;
  kort.forEach((k, i) => {
    const x = 0.7 + i * (kortW + gap);
    slide.addShape('rect', {
      x, y: kortY, w: kortW, h: kortH,
      fill: { color: PALETT.white }, line: { color: PALETT.border },
      shadow: mkShadow(),
    });
    const siffraSize = String(k.siffra || '').length <= 4 ? 40 : 24;
    slide.addText(nbUnit(k.siffra), {
      x: x + 0.2, y: kortY + 0.22, w: kortW - 0.4, h: 0.85,
      fontSize: siffraSize, fontFace: 'Georgia', fit: 'shrink',
      color: PALETT.navy, bold: true, valign: 'middle',
    });
    slide.addText(k.etikett, {
      x: x + 0.2, y: kortY + 1.1, w: kortW - 0.4, h: 0.45,
      fontSize: 10, fontFace: 'Calibri',
      color: PALETT.gold, bold: true, charSpacing: 1,
    });
    slide.addText(k.text, {
      x: x + 0.2, y: kortY + 1.55, w: kortW - 0.4, h: kortH - 1.75,
      fontSize: 10.5, fontFace: 'Calibri',
      color: PALETT.navyMid, valign: 'top',
    });
  });

  let underY = kortY + kortH + 0.3;
  if (s.callout) {
    slide.addShape('rect', {
      x: 0.7, y: underY, w: W - 1.4, h: 0.85,
      fill: { color: PALETT.navy }, line: { color: PALETT.navy },
      shadow: mkShadow(),
    });
    slide.addText(s.callout, {
      x: 0.95, y: underY + 0.05, w: W - 1.7, h: 0.75,
      fontSize: 11.5, fontFace: 'Calibri',
      color: PALETT.white, valign: 'middle',
    });
    underY += 1.05;
  }

  if (s.fotnot) {
    slide.addText(s.fotnot, {
      x: 0.7, y: underY, w: W - 2.5, h: 0.3,
      fontSize: 8.5, fontFace: 'Calibri',
      color: PALETT.muted, italic: true,
    });
  }
}

// Generisk "innehållsslide" — används som fallback för sektioner som saknar
// kurerad slide i popular-slides.json. Renderar titel + en blockstycke
// brödtext + ev. källa.
function layoutInnehall(slide, s) {
  slide.background = { color: PALETT.white };
  commonHeader(slide);

  slide.addText(s.titel, {
    x: 0.7, y: 0.7, w: W - 1.4, h: 0.9,
    fontSize: 30, fontFace: 'Georgia',
    color: PALETT.navy, bold: true,
  });
  if (s.underrubrik) {
    slide.addText(s.underrubrik, {
      x: 0.7, y: 1.6, w: W - 1.4, h: 0.4,
      fontSize: 13, fontFace: 'Calibri',
      color: PALETT.navyMid, italic: true,
    });
  }
  if (Array.isArray(s.punkter) && s.punkter.length) {
    // Fler än sex punkter sätts i två spalter så sliden inte blir en lång lista.
    const spalter = s.punkter.length > 6 ? 2 : 1;
    const perSpalt = Math.ceil(s.punkter.length / spalter);
    const spaltW = (W - 1.8 - (spalter - 1) * 0.5) / spalter;
    for (let sp = 0; sp < spalter; sp++) {
      const del = s.punkter.slice(sp * perSpalt, (sp + 1) * perSpalt);
      slide.addText(
        del.map(t => ({ text: t, options: { bullet: { code: '25CF' }, breakLine: true } })),
        {
          x: 0.9 + sp * (spaltW + 0.5), y: 2.3, w: spaltW, h: 4.0,
          fontSize: spalter === 2 ? 12 : 14, fontFace: 'Calibri',
          color: PALETT.navy, valign: 'top', paraSpaceAfter: 8,
        }
      );
    }
  } else if (s.brodtext) {
    slide.addText(s.brodtext, {
      x: 0.9, y: 2.3, w: W - 1.8, h: 4.0,
      fontSize: 14, fontFace: 'Calibri',
      color: PALETT.navy, valign: 'top',
    });
  }
  if (s.kalla) {
    slide.addText('Källa: ' + s.kalla, {
      x: 0.7, y: H - 0.78, w: W - 1.4, h: 0.3,
      fontSize: 9, fontFace: 'Calibri',
      color: PALETT.muted, italic: true,
    });
  }
}

// Liggande intervallstaplar på en årsaxel — varje rad har {min, max} i år.
// Mer omedelbart läsbart än tabellen för ledtidsspann.
function layoutIntervall(slide, s) {
  slide.background = { color: PALETT.white };
  commonHeader(slide);

  slide.addText(s.titel, {
    x: 0.7, y: 0.7, w: W - 1.4, h: 0.8,
    fontSize: 30, fontFace: 'Georgia',
    color: PALETT.navy, bold: true,
  });
  if (s.underrubrik) {
    slide.addText(s.underrubrik, {
      x: 0.7, y: 1.45, w: W - 1.4, h: 0.4,
      fontSize: 13, fontFace: 'Calibri',
      color: PALETT.navyMid, italic: true,
    });
  }

  const rader = s.rader || [];
  const maxAr = s.maxAr || 8;
  const labelW = 3.3;
  const axelX = 0.7 + labelW;
  const axelW = W - 1.4 - labelW - 0.2;
  const radH = 0.58;
  const startY = 2.3;
  const diagramH = rader.length * radH;

  // Årslinjer + skala
  for (let ar = 0; ar <= maxAr; ar++) {
    const x = axelX + (ar / maxAr) * axelW;
    slide.addShape('line', {
      x, y: startY - 0.1, w: 0, h: diagramH + 0.2,
      line: { color: ar === 0 ? PALETT.navy : 'E5E1D6', width: ar === 0 ? 1.5 : 0.75 },
    });
    slide.addText(String(ar), {
      x: x - 0.2, y: startY + diagramH + 0.12, w: 0.4, h: 0.25, margin: 0,
      fontSize: 9, fontFace: 'Calibri', color: PALETT.muted, align: 'center',
    });
  }
  slide.addText('år', {
    x: axelX + axelW + 0.05, y: startY + diagramH + 0.12, w: 0.4, h: 0.25, margin: 0,
    fontSize: 9, fontFace: 'Calibri', color: PALETT.muted, italic: true,
  });

  rader.forEach((rad, i) => {
    const y = startY + i * radH;
    slide.addText(rad.namn, {
      x: 0.7, y: y, w: labelW - 0.15, h: 0.3, margin: 0,
      fontSize: 12, fontFace: 'Calibri', bold: true,
      color: PALETT.navy, valign: 'middle',
    });
    if (rad.driver) {
      slide.addText(rad.driver, {
        x: 0.7, y: y + 0.27, w: labelW - 0.15, h: 0.24, margin: 0,
        fontSize: 8.5, fontFace: 'Calibri',
        color: PALETT.muted, valign: 'top', fit: 'shrink',
      });
    }
    const x1 = axelX + (rad.min / maxAr) * axelW;
    const bredd = Math.max(((rad.max - rad.min) / maxAr) * axelW, 0.12);
    slide.addShape('roundRect', {
      x: x1, y: y + 0.08, w: bredd, h: 0.3, rectRadius: 0.05,
      fill: { color: rad.farg || PALETT.navyMid }, line: { color: rad.farg || PALETT.navyMid },
    });
    // Etiketten hamnar inuti stapeln när den slutar nära högerkanten.
    const inuti = rad.max >= maxAr - 0.6;
    slide.addText(nbUnit(rad.tid), inuti ? {
      x: x1, y: y + 0.05, w: bredd - 0.12, h: 0.36, margin: 0,
      fontSize: 10.5, fontFace: 'Georgia', bold: true,
      color: PALETT.white, align: 'right', valign: 'middle',
    } : {
      x: x1 + bredd + 0.1, y: y + 0.05, w: 1.7, h: 0.36, margin: 0,
      fontSize: 10.5, fontFace: 'Georgia', bold: true,
      color: PALETT.navy, valign: 'middle',
    });
  });

  if (s.fotnot) {
    slide.addText(s.fotnot, {
      x: 0.7, y: startY + diagramH + 0.42, w: W - 1.4, h: 0.35,
      fontSize: 8.5, fontFace: 'Calibri',
      color: PALETT.muted, italic: true,
    });
  }
}

// Stor siffra + punkter till höger, kostnadslåsningskurvan som native
// linjediagram till vänster — speglar webbsidans S-kurva.
function layoutKurva(slide, s) {
  slide.background = { color: PALETT.parchment };
  commonHeader(slide);

  slide.addText(s.titel, {
    x: 0.7, y: 0.7, w: W - 1.4, h: 0.9,
    fontSize: 32, fontFace: 'Georgia',
    color: PALETT.navy, bold: true,
  });
  if (s.underrubrik) {
    slide.addText(s.underrubrik, {
      x: 0.7, y: 1.55, w: W - 1.4, h: 0.4,
      fontSize: 14, fontFace: 'Calibri',
      color: PALETT.navyMid, italic: true,
    });
  }

  const k = s.kurva || {};
  slide.addChart('line', (k.serier || []).map(serie => ({
    name: serie.namn,
    labels: k.skeden || [],
    values: serie.varden || [],
  })), {
    x: 0.7, y: 2.2, w: 6.6, h: 4.1,
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
    x: 7.7, y: 2.2, w: W - 8.4, h: 1.2,
    fontSize: 48, fontFace: 'Georgia', fit: 'shrink',
    color: PALETT.navy, bold: true,
  });
  slide.addText(nbUnit(s.siffra_etikett), {
    x: 7.7, y: 3.35, w: W - 8.4, h: 0.5,
    fontSize: 11, fontFace: 'Calibri', bold: true,
    color: PALETT.gold, charSpacing: 1,
  });
  slide.addText(
    (s.punkter || []).map(t => ({ text: t, options: { bullet: { code: '25CF' }, breakLine: true } })),
    {
      x: 7.7, y: 3.95, w: W - 8.4, h: 2.4,
      fontSize: 12, fontFace: 'Calibri',
      color: PALETT.navy, valign: 'top',
      paraSpaceAfter: 6,
    }
  );

  if (s.kalla) {
    slide.addText('Källa: ' + s.kalla, {
      x: 0.7, y: H - 0.78, w: W - 1.4, h: 0.3,
      fontSize: 9, fontFace: 'Calibri',
      color: PALETT.muted, italic: true,
    });
  }
}

const LAYOUTER = {
  'titel':       layoutTitel,
  'siffra-stor': layoutSiffraStor,
  'trappa':      layoutTrappa,
  'tabell':      layoutTabell,
  'tva-spalter': layoutTvaSpalter,
  'kort-grid':   layoutKortGrid,
  'innehall':    layoutInnehall,
  'intervall':   layoutIntervall,
  'kurva':       layoutKurva,
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

function renderSlides(pptx, slides) {
  slides.forEach((s, i) => {
    const layoutFn = LAYOUTER[s.layout];
    if (!layoutFn) {
      throw new Error(`Okänd layout '${s.layout}' för slide '${s.id}'.`);
    }
    const slide = pptx.addSlide();
    layoutFn(slide, s);
    if (s.layout !== 'titel') commonFooter(slide, i + 1, slides.length);
  });
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
  const slides = pickSlides(ids);
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
  const slides = pickSlides(ids);
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
  CONFIG,
};
