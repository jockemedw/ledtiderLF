import { describe, it, expect } from 'vitest';
import { slidesForSections, allSlideIds } from '../pptx-builder.js';

describe('slidesForSections', () => {
  it('mappar sektion-id till slide-id via ankare', () => {
    const { slideIds, missingSections } = slidesForSections(['hierarki', 'kostnad']);
    expect(slideIds).toEqual(['hierarki', 'kostnad-80']);
    expect(missingSections).toEqual([]);
  });

  it('bevarar sektionernas ordning i resultatet', () => {
    const a = slidesForSections(['kostnad', 'hierarki']);
    const b = slidesForSections(['hierarki', 'kostnad']);
    expect(a.slideIds).toEqual(['kostnad-80', 'hierarki']);
    expect(b.slideIds).toEqual(['hierarki', 'kostnad-80']);
  });

  it('rapporterar sektioner utan kurerad slide', () => {
    const { slideIds, missingSections } = slidesForSections(['hierarki', 'sammanfattning']);
    expect(slideIds).toEqual(['hierarki']);
    expect(missingSections).toEqual(['sammanfattning']);
  });

  it('tom input → tomma listor', () => {
    expect(slidesForSections([])).toEqual({ slideIds: [], missingSections: [] });
    expect(slidesForSections(undefined)).toEqual({ slideIds: [], missingSections: [] });
  });
});

describe('allSlideIds', () => {
  it('returnerar alla slides i ordning', () => {
    const ids = allSlideIds();
    expect(ids).toContain('titel');
    expect(ids).toContain('hierarki');
    expect(ids[0]).toBe('titel');
  });
});
