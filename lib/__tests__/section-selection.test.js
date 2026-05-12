import { describe, it, expect } from 'vitest';
import {
  parse,
  serialize,
  toggle,
  move,
  reorder,
  normalize,
} from '../section-selection.js';

describe('parse', () => {
  it('läser ?ids=a,b,c', () => {
    expect(parse('?ids=hierarki,kostnad,spar-b')).toEqual(['hierarki', 'kostnad', 'spar-b']);
  });
  it('accepterar query utan inledande ?', () => {
    expect(parse('ids=a,b')).toEqual(['a', 'b']);
  });
  it('tom/saknad → tom lista', () => {
    expect(parse('')).toEqual([]);
    expect(parse('?ids=')).toEqual([]);
    expect(parse('?foo=bar')).toEqual([]);
  });
  it('trimmar och tar bort dubbletter', () => {
    expect(parse('?ids=a,, b ,a')).toEqual(['a', 'b']);
  });
});

describe('serialize', () => {
  it('serialiserar lista till ?ids=a,b', () => {
    expect(serialize(['a', 'b'])).toBe('?ids=a%2Cb');
  });
  it('tom lista → tom sträng', () => {
    expect(serialize([])).toBe('');
    expect(serialize(null)).toBe('');
  });
  it('round-trip parse→serialize→parse är stabil', () => {
    const a = ['hierarki', 'kostnad', 'spar-b'];
    expect(parse(serialize(a))).toEqual(a);
  });
});

describe('toggle', () => {
  it('lägger till nytt id sist', () => {
    expect(toggle(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });
  it('tar bort befintligt id', () => {
    expect(toggle(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });
  it('hanterar tom indata', () => {
    expect(toggle([], 'a')).toEqual(['a']);
    expect(toggle(undefined, 'a')).toEqual(['a']);
  });
});

describe('move', () => {
  it('flyttar uppåt med negativ delta', () => {
    expect(move(['a', 'b', 'c'], 'c', -1)).toEqual(['a', 'c', 'b']);
  });
  it('flyttar nedåt med positiv delta', () => {
    expect(move(['a', 'b', 'c'], 'a', 1)).toEqual(['b', 'a', 'c']);
  });
  it('klampar vid kanterna', () => {
    expect(move(['a', 'b'], 'a', -5)).toEqual(['a', 'b']);
    expect(move(['a', 'b'], 'b', 5)).toEqual(['a', 'b']);
  });
  it('ignorerar okänt id', () => {
    expect(move(['a', 'b'], 'x', 1)).toEqual(['a', 'b']);
  });
});

describe('reorder', () => {
  it('flyttar från index till index', () => {
    expect(reorder(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });
  it('no-op när index är lika', () => {
    expect(reorder(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
});

describe('normalize', () => {
  it('filtrerar bort id:n utanför whitelist', () => {
    expect(normalize(['a', 'evil', 'b'], ['a', 'b', 'c'])).toEqual(['a', 'b']);
  });
  it('behåller ordningen från input', () => {
    expect(normalize(['c', 'a'], ['a', 'b', 'c'])).toEqual(['c', 'a']);
  });
  it('tom whitelist → tom lista', () => {
    expect(normalize(['a', 'b'], [])).toEqual([]);
  });
});
