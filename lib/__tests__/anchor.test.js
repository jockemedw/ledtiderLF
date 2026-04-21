import { describe, it, expect } from 'vitest';
import { slugify, anchorIdForElement, COMMENTABLE_SELECTOR } from '../anchor.js';

describe('slugify', () => {
  it('lowercases och ersätter icke-alfanumeriskt med bindestreck', () => {
    expect(slugify('Hej Världen!')).toBe('hej-världen');
  });
  it('behåller å/ä/ö', () => {
    expect(slugify('Åtgärder för östra')).toBe('åtgärder-för-östra');
  });
  it('trimmar inledande/avslutande bindestreck', () => {
    expect(slugify('  ...hej...  ')).toBe('hej');
  });
  it('tomt blir tomt', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });
  it('begränsar inte själv (anchorIdForElement gör det)', () => {
    expect(slugify('a'.repeat(100)).length).toBe(100);
  });
});

describe('anchorIdForElement', () => {
  function fakeEl(tag, text) {
    return {
      tagName: tag.toUpperCase(),
      textContent: text,
    };
  }

  it('producerar <tag>-<slug>-<index>', () => {
    const el = fakeEl('h2', 'Processen från behov');
    expect(anchorIdForElement(el, 0)).toBe('h2-processen-från-behov-0');
  });

  it('trimmar till första 30 tecken av textContent före slug', () => {
    const el = fakeEl('p', 'Detta är en mycket lång text som fortsätter och fortsätter');
    expect(anchorIdForElement(el, 0)).toBe('p-detta-är-en-mycket-lång-text-s-0');
  });

  it('inkluderar index för att särskilja dubbletter', () => {
    const el = fakeEl('li', 'Initial kontakt');
    expect(anchorIdForElement(el, 3)).toBe('li-initial-kontakt-3');
  });

  it('ger deterministiska ID:n vid samma input', () => {
    const el = fakeEl('h3', 'Samma rubrik');
    expect(anchorIdForElement(el, 2)).toBe(anchorIdForElement(el, 2));
  });

  it('hanterar tom textContent med tom slug', () => {
    const el = fakeEl('p', '');
    expect(anchorIdForElement(el, 0)).toBe('p--0');
  });
});

describe('COMMENTABLE_SELECTOR', () => {
  it('är en sträng med förväntade element', () => {
    expect(COMMENTABLE_SELECTOR).toContain('h2');
    expect(COMMENTABLE_SELECTOR).toContain('p');
    expect(COMMENTABLE_SELECTOR).toContain('li');
  });
});
