import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { slidesForSections, allSlideIds, buildPptx, CONFIG } from '../pptx-builder.js';

describe('slidesForSections', () => {
  it('mappar sektion-id till slide-id via ankare', () => {
    const { slideIds, missingSections } = slidesForSections(['oversikt', 'kostnad']);
    expect(slideIds).toEqual(['oversikt', 'kostnad-80']);
    expect(missingSections).toEqual([]);
  });

  it('bevarar sektionernas ordning i resultatet', () => {
    const a = slidesForSections(['kostnad', 'oversikt']);
    const b = slidesForSections(['oversikt', 'kostnad']);
    expect(a.slideIds).toEqual(['kostnad-80', 'oversikt']);
    expect(b.slideIds).toEqual(['oversikt', 'kostnad-80']);
  });

  it('rapporterar sektioner utan kurerad slide', () => {
    const { slideIds, missingSections } = slidesForSections(['oversikt', 'finns-inte']);
    expect(slideIds).toEqual(['oversikt']);
    expect(missingSections).toEqual(['finns-inte']);
  });

  it('tom input → tomma listor', () => {
    expect(slidesForSections([])).toEqual({ slideIds: [], missingSections: [] });
    expect(slidesForSections(undefined)).toEqual({ slideIds: [], missingSections: [] });
  });

  it('varje valbar sektion på sidan har en kurerad slide', () => {
    const raw = fs.readFileSync(
      path.join(__dirname, '..', '..', 'lokalforsorjning.html'),
      'utf-8'
    );
    // Samma semantik som PickModes selektor .nav-subtab[data-section] —
    // oberoende av attributordning och extra klasser.
    const sectionIds = [...raw.matchAll(/<[^>]+data-section="([^"]+)"[^>]*>/g)]
      .filter(m => /\bnav-subtab\b/.test(m[0]))
      .map(m => m[1]);
    expect(sectionIds.length).toBeGreaterThanOrEqual(14);
    const { missingSections } = slidesForSections(sectionIds);
    expect(missingSections).toEqual([]);
  });

  it('varje kurerad slide pekar på en sektion som finns på sidan', () => {
    const raw = fs.readFileSync(
      path.join(__dirname, '..', '..', 'lokalforsorjning.html'),
      'utf-8'
    );
    const idnPaSidan = new Set([...raw.matchAll(/<section id="([^"]+)"/g)].map(m => m[1]));
    for (const s of CONFIG.slides) {
      if (!s.ankare) continue;
      expect(idnPaSidan.has(s.ankare), `slide '${s.id}' pekar på saknad sektion '${s.ankare}'`).toBe(true);
    }
  });
});

describe('allSlideIds', () => {
  it('returnerar alla slides i ordning', () => {
    const ids = allSlideIds();
    expect(ids).toContain('titel');
    expect(ids).toContain('oversikt');
    expect(ids[0]).toBe('titel');
  });
});

describe('buildPptx', () => {
  it('enbart okända sektioner ger tomt resultat — inte populärversionen', async () => {
    const result = await buildPptx({ sectionIds: ['finns-inte-alls'] });
    expect(result.buffer).toBeNull();
    expect(result.slideIds).toEqual([]);
    expect(result.missingSections).toEqual(['finns-inte-alls']);
  });

  it('utan ids byggs den kurerade populärversionen', async () => {
    const popularIds = CONFIG.slides.filter(s => s.popular).map(s => s.id);
    const result = await buildPptx({});
    expect(result.slideIds).toEqual(['titel', 'kostnad-80', 'oversikt', 'ledtider', 'provning']);
    expect(result.slideIds.sort()).toEqual([...popularIds].sort());
    expect(result.buffer.length).toBeGreaterThan(10000);
  });

  it('sektionsexport får titelslide som omslag + en slide per sektion', async () => {
    const result = await buildPptx({ sectionIds: ['moduler', 'beslut'] });
    expect(result.slideIds).toEqual(['titel', 'moduler', 'beslut']);
    expect(result.missingSections).toEqual([]);
  });

  it('alla layouter i katalogen kan renderas', async () => {
    const result = await buildPptx({ slideIds: allSlideIds() });
    expect(result.slideIds.length).toBe(CONFIG.slides.length);
    expect(result.buffer.length).toBeGreaterThan(10000);
  });
});
