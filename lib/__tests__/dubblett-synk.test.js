import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Samma siffror lever i tre osynkade lager: siffror.json, HTML-innehållet och
// pptx-datat. Hårdkontrollen 2026-08-26 hittade flera glidningar ("44 mån",
// "7 850 m²", Vk5A) som uppstått just så. Tabellen nedan binder de mest
// bärande dubbletterna: ändras ett nyckeltalsvärde eller en HTML-förekomst
// utan att övriga lager följer med, larmar testet. Uppdatera då ALLA ställen
// och raden här.

const root = path.join(__dirname, '..', '..');
const siffror = JSON.parse(fs.readFileSync(path.join(root, 'data', 'siffror.json'), 'utf-8'));
const filer = {
  'lokalforsorjning.html': fs.readFileSync(path.join(root, 'lokalforsorjning.html'), 'utf-8'),
  'detaljplan.html': fs.readFileSync(path.join(root, 'detaljplan.html'), 'utf-8'),
  'scripts/popular-slides.json': fs.readFileSync(path.join(root, 'scripts', 'popular-slides.json'), 'utf-8'),
};

// forekomster: [fil, sträng, minsta antal förekomster]
const KRAV = [
  { nyckeltal: 'ledtid-detaljplan-snitt-2025', varde: '4,8 år', forekomster: [
    ['lokalforsorjning.html', '4,8 år', 1],
    ['detaljplan.html', '4,8 år', 1],
  ]},
  { nyckeltal: 'ledtid-overklagande', varde: '+14 mån', forekomster: [
    ['lokalforsorjning.html', '+14 mån', 2],
    ['detaljplan.html', '+14 mån', 2],
    ['scripts/popular-slides.json', '+14 mån', 1],
  ]},
  { nyckeltal: 'dem-linkoping-hyresnota', varde: '1 392 → 1 666 mnkr/år', forekomster: [
    ['lokalforsorjning.html', '1 392', 1],
    ['lokalforsorjning.html', '1 666', 1],
  ]},
  { nyckeltal: 'kr-grundskola-medel', varde: 'ca 28 500–35 000 kr/m² BTA', forekomster: [
    ['lokalforsorjning.html', '8 819', 1],
  ]},
  { nyckeltal: 'kr-lss', varde: '24 000–36 000 kr/m² BTA', forekomster: [
    ['lokalforsorjning.html', '20–30 mkr', 1],
    ['scripts/popular-slides.json', '20–30 mkr', 1],
  ]},
  { nyckeltal: 'ledtid-spar-a', varde: '3–12 mån', forekomster: [
    ['lokalforsorjning.html', '3–12 mån', 1],
    ['scripts/popular-slides.json', '3–12 mån', 1],
  ]},
  { nyckeltal: 'ledtid-spar-b', varde: '2–5 år', forekomster: [
    ['lokalforsorjning.html', '2–5 år', 1],
  ]},
  { nyckeltal: 'ledtid-spar-d-nydp', varde: '5–8 år', forekomster: [
    ['lokalforsorjning.html', '5–8 år', 1],
    ['scripts/popular-slides.json', '5–8 år', 1],
  ]},
  // Filbundna påståenden utan eget nyckeltal
  { etikett: 'Ledtidsindex-snittet 46 mån (ersatte obelagda "44 mån median")', forekomster: [
    ['lokalforsorjning.html', '46 mån', 2],
    ['scripts/popular-slides.json', '46 mån', 1],
  ]},
  { etikett: 'VoB är verksamhetsklass 5B (rättat från 5A)', forekomster: [
    ['lokalforsorjning.html', 'verksamhetsklass 5B', 1],
  ]},
  { etikett: '80 %-tumregeln uttrycks som branschtolkningens 70–80 %', forekomster: [
    ['lokalforsorjning.html', '70–80 %', 1],
    ['detaljplan.html', '70–80 %', 1],
    ['scripts/popular-slides.json', '70–80 %', 1],
  ]},
  { etikett: 'Tidsbegränsat bygglov: PBL 9 kap. 71–72 §§ (omnumrerat dec 2025)', forekomster: [
    ['detaljplan.html', '9 kap. 71–72', 2],
  ]},
];

const antal = (text, strang) => text.split(strang).length - 1;

describe('dubblettsynk mellan siffror.json, HTML och pptx-data', () => {
  const perId = Object.fromEntries(siffror.nyckeltal.map(n => [n.id, n]));

  for (const krav of KRAV) {
    const namn = krav.nyckeltal || krav.etikett;
    it(namn, () => {
      if (krav.nyckeltal) {
        const n = perId[krav.nyckeltal];
        expect(n, `nyckeltal '${krav.nyckeltal}' saknas i siffror.json`).toBeTruthy();
        expect(n.varde, `värdet för '${krav.nyckeltal}' har ändrats — uppdatera HTML/pptx och denna tabell`).toBe(krav.varde);
      }
      for (const [fil, strang, minst] of krav.forekomster) {
        const funna = antal(filer[fil], strang);
        expect(funna, `'${strang}' förekommer ${funna} ggr i ${fil}, förväntat minst ${minst}`).toBeGreaterThanOrEqual(minst);
      }
    });
  }
});
