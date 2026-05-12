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

function pickSlides(ids) {
  const all = allSlides();
  if (!ids || !ids.length) return all;
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
function commonHeader(slide) {
  slide.addShape('rect', {
    x: 0, y: 0, w: W, h: 0.12,
    fill: { color: PALETT.gold }, line: { color: PALETT.gold }
  });
  slide.addText('Lejonfastigheter · Lokalförsörjning', {
    x: 0.5, y: 0.25, w: W - 1, h: 0.3,
    fontSize: 9, fontFace: 'Calibri',
    color: PALETT.gold, bold: true, charSpacing: 2,
  });
}

function commonFooter(slide, idx, total) {
  slide.addText(CONFIG.meta.fooFooter, {
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
  slide.addShape('rect', {
    x: 0, y: 0, w: W, h: 0.12,
    fill: { color: PALETT.gold }, line: { color: PALETT.gold }
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
      color: PALETT.gold, italic: true,
    });
  }

  slide.addShape('rect', {
    x: 0.7, y: 2.3, w: 5.0, h: 4.0,
    fill: { color: PALETT.navy }, line: { color: PALETT.navy }
  });
  slide.addText(s.siffra, {
    x: 0.7, y: 2.6, w: 5.0, h: 2.4,
    fontSize: 110, fontFace: 'Georgia',
    color: PALETT.goldLight, bold: true, align: 'center', valign: 'middle',
  });
  slide.addText(s.siffra_etikett, {
    x: 1.0, y: 5.1, w: 4.4, h: 1.0,
    fontSize: 12, fontFace: 'Calibri',
    color: PALETT.white, align: 'center',
  });

  slide.addText(
    (s.punkter || []).map(t => ({ text: t, options: { bullet: { code: '25CF' }, breakLine: true } })),
    {
      x: 6.1, y: 2.5, w: W - 6.8, h: 4.0,
      fontSize: 14, fontFace: 'Calibri',
      color: PALETT.navy, valign: 'top',
      paraSpaceAfter: 8,
    }
  );

  if (s.kalla) {
    slide.addText('Källa: ' + s.kalla, {
      x: 0.7, y: H - 0.9, w: W - 1.4, h: 0.3,
      fontSize: 9, fontFace: 'Calibri',
      color: PALETT.gold, italic: true,
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
      color: PALETT.gold, italic: true,
    });
  }

  const startY = 2.1;
  const stegHojd = 0.78;
  const fyll = [0.22, 0.45, 0.68, 0.92];
  (s.steg || []).forEach((steg, i) => {
    const y = startY + i * (stegHojd + 0.12);
    slide.addShape('rect', {
      x: 0.7, y: y, w: 0.12, h: stegHojd,
      fill: { color: PALETT.gold, transparency: Math.round((1 - fyll[i]) * 100) },
      line: { color: PALETT.gold, transparency: Math.round((1 - fyll[i]) * 100) }
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
    slide.addShape('rect', {
      x: 0.7, y: calloutY, w: 0.08, h: 0.85,
      fill: { color: PALETT.gold }, line: { color: PALETT.gold }
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
      color: PALETT.gold, italic: true,
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

  slide.addTable(rows, {
    x: 0.7, y: 2.1, w: W - 1.4,
    colW: [4.6, 2.4, W - 1.4 - 4.6 - 2.4],
    rowH: 0.5,
    border: { type: 'solid', color: PALETT.border, pt: 1 },
  });

  if (s.fotnot) {
    slide.addText(s.fotnot, {
      x: 0.7, y: H - 1.0, w: W - 1.4, h: 0.5,
      fontSize: 9, fontFace: 'Calibri',
      color: PALETT.muted, italic: true,
    });
  }
}

function layoutTvaSpalter(slide, s) {
  slide.background = { color: PALETT.navy };
  slide.addShape('rect', {
    x: 0, y: 0, w: W, h: 0.12,
    fill: { color: PALETT.gold }, line: { color: PALETT.gold }
  });
  slide.addText('Lejonfastigheter · Lokalförsörjning', {
    x: 0.7, y: 0.3, w: W - 1, h: 0.3,
    fontSize: 9, fontFace: 'Calibri',
    color: PALETT.goldLight, bold: true, charSpacing: 2,
  });

  slide.addText(s.titel, {
    x: 0.7, y: 0.85, w: W - 1.4, h: 0.95,
    fontSize: 32, fontFace: 'Georgia',
    color: PALETT.white, bold: true,
  });
  if (s.underrubrik) {
    slide.addText(s.underrubrik, {
      x: 0.7, y: 1.75, w: W - 1.4, h: 0.4,
      fontSize: 13, fontFace: 'Calibri',
      color: PALETT.goldLight, italic: true,
    });
  }

  const colW = (W - 1.4 - 0.4) / 2;
  const colY = 2.4;
  const colH = 4.0;
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
      color: PALETT.goldLight, italic: true,
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
      color: PALETT.gold, italic: true,
    });
  }
  if (Array.isArray(s.punkter) && s.punkter.length) {
    slide.addText(
      s.punkter.map(t => ({ text: t, options: { bullet: { code: '25CF' }, breakLine: true } })),
      {
        x: 0.9, y: 2.3, w: W - 1.8, h: 4.0,
        fontSize: 14, fontFace: 'Calibri',
        color: PALETT.navy, valign: 'top', paraSpaceAfter: 8,
      }
    );
  } else if (s.brodtext) {
    slide.addText(s.brodtext, {
      x: 0.9, y: 2.3, w: W - 1.8, h: 4.0,
      fontSize: 14, fontFace: 'Calibri',
      color: PALETT.navy, valign: 'top',
    });
  }
  if (s.kalla) {
    slide.addText('Källa: ' + s.kalla, {
      x: 0.7, y: H - 0.9, w: W - 1.4, h: 0.3,
      fontSize: 9, fontFace: 'Calibri',
      color: PALETT.gold, italic: true,
    });
  }
}

const LAYOUTER = {
  'titel':       layoutTitel,
  'siffra-stor': layoutSiffraStor,
  'trappa':      layoutTrappa,
  'tabell':      layoutTabell,
  'tva-spalter': layoutTvaSpalter,
  'innehall':    layoutInnehall,
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

// Bygger en pptx. Antingen anges `slideIds` direkt eller `sectionIds` —
// i andra fallet mappas sektion-id:n till slide-id:n via `ankare`-fältet.
// Returnerar { buffer, slideIds, missingSections }.
async function buildPptx({ slideIds, sectionIds } = {}) {
  let ids = slideIds;
  let missingSections = [];
  if (!ids && sectionIds) {
    const mapped = slidesForSections(sectionIds);
    ids = mapped.slideIds;
    missingSections = mapped.missingSections;
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
    const mapped = slidesForSections(sectionIds);
    ids = mapped.slideIds;
    missingSections = mapped.missingSections;
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
