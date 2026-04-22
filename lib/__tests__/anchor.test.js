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

describe('anchorIdForElement - exkluderar kommentars-UI från text', () => {
  function textNode(value) {
    return { nodeType: 3, nodeValue: value };
  }
  function uiChild(value) {
    return {
      nodeType: 1,
      hasAttribute: (name) => name === 'data-comment-ui',
      classList: { contains: () => false },
      childNodes: [textNode(value)],
    };
  }
  function bubbleChild(value) {
    return {
      nodeType: 1,
      hasAttribute: () => false,
      classList: { contains: (c) => c === 'comment-inline-bubble' },
      childNodes: [textNode(value)],
    };
  }

  it('ignorerar barn med data-comment-ui när text läses', () => {
    const el = {
      tagName: 'H2',
      textContent: 'RubrikenIGNORERA',
      childNodes: [textNode('Rubriken'), uiChild('💬 3')],
    };
    expect(anchorIdForElement(el, 0)).toBe('h2-rubriken-0');
  });

  it('ignorerar comment-inline-bubble klass när text läses', () => {
    const el = {
      tagName: 'H2',
      textContent: 'Rubriken💬 1',
      childNodes: [textNode('Rubriken'), bubbleChild('💬 1')],
    };
    expect(anchorIdForElement(el, 0)).toBe('h2-rubriken-0');
  });

  it('samma id före och efter bubbla lagts till (regression)', () => {
    const before = { tagName: 'H2', textContent: 'Test', childNodes: [textNode('Test')] };
    const after = {
      tagName: 'H2',
      textContent: 'Test💬 1',
      childNodes: [textNode('Test'), bubbleChild('💬 1')],
    };
    expect(anchorIdForElement(before, 0)).toBe(anchorIdForElement(after, 0));
  });
});

describe('COMMENTABLE_SELECTOR', () => {
  it('är en sträng med förväntade element', () => {
    expect(COMMENTABLE_SELECTOR).toContain('h2');
    expect(COMMENTABLE_SELECTOR).toContain('p');
    expect(COMMENTABLE_SELECTOR).toContain('li');
  });
});
