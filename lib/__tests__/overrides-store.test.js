import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  head: vi.fn(),
}));

import { put } from '@vercel/blob';
import {
  sanitizeOverrides,
  withinSizeLimit,
  isValidPage,
  saveOverrides,
  PAGES,
} from '../overrides.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isValidPage', () => {
  it('accepterar bara kända sidor', () => {
    expect(isValidPage('lokal')).toBe(true);
    expect(isValidPage('detaljplan')).toBe(true);
    expect(isValidPage('annat')).toBe(false);
    expect(isValidPage(undefined)).toBe(false);
    expect(PAGES).toContain('lokal');
  });
});

describe('sanitizeOverrides – text', () => {
  it('behåller sträng→sträng och kapar långa värden', () => {
    const long = 'x'.repeat(5000);
    const out = sanitizeOverrides({ text: { 'p-a-0': 'hej', 'p-b-1': long } });
    expect(out.text['p-a-0']).toBe('hej');
    expect(out.text['p-b-1'].length).toBe(4000);
  });

  it('kastar bort icke-strängvärden och för långa nycklar', () => {
    const out = sanitizeOverrides({
      text: { 'p-a-0': 42, 'p-b-1': { x: 1 }, ['k'.repeat(300)]: 'nej', 'p-c-2': 'ja' },
    });
    expect(out.text).toEqual({ 'p-c-2': 'ja' });
  });
});

describe('sanitizeOverrides – gantt', () => {
  it('behåller forskedeMan och segment med giltiga månader', () => {
    const out = sanitizeOverrides({
      data: {
        gantt: {
          'A|B': { forskedeMan: 6, segment: [{ fas: 'forstudie', man: 3 }, { fas: 'x', man: 5 }] },
        },
      },
    });
    expect(out.data.gantt['A|B'].forskedeMan).toBe(6);
    expect(out.data.gantt['A|B'].segment).toEqual([
      { fas: 'forstudie', man: 3 },
      { fas: 'x', man: 5 },
    ]);
  });

  it('kastar ogiltiga tal och tomma rader tyst', () => {
    const out = sanitizeOverrides({
      data: {
        gantt: {
          'A|B': { forskedeMan: -1, segment: [{ fas: 'x', man: 'nej' }] },
          'C|D': { segment: [{ fas: 'y', man: 4 }] },
          'E|F': {},
        },
      },
    });
    expect(out.data.gantt['A|B']).toBeUndefined();
    expect(out.data.gantt['C|D']).toEqual({ segment: [{ fas: 'y', man: 4 }] });
    expect(out.data.gantt['E|F']).toBeUndefined();
  });
});

describe('sanitizeOverrides – spår', () => {
  it('behåller scenarier med totalText och/eller faser, null annars', () => {
    const out = sanitizeOverrides({
      data: {
        spar: {
          a: {
            scenarios: [
              { totalText: '3 mån', faser: [{ namn: 'F', tid: '1 mån' }] },
              { faser: [{ namn: 'G', tid: 'x', extra: 1 }] },
              { irrelevant: true },
            ],
          },
          b: 'inte-objekt',
        },
      },
    });
    expect(out.data.spar.a.scenarios[0]).toEqual({
      totalText: '3 mån',
      faser: [{ namn: 'F', tid: '1 mån' }],
    });
    expect(out.data.spar.a.scenarios[1]).toEqual({ faser: [{ namn: 'G', tid: 'x' }] });
    expect(out.data.spar.a.scenarios[2]).toBeNull();
    expect(out.data.spar.b).toBeUndefined();
  });
});

describe('sanitizeOverrides – okända nycklar och form', () => {
  it('ger alltid {text, data:{gantt,spar}} och struntar i skräp', () => {
    const out = sanitizeOverrides({ text: null, data: { gantt: 5, spar: [], extra: 1 }, junk: true });
    expect(out).toEqual({ text: {}, data: { gantt: {}, spar: {} } });
    expect(sanitizeOverrides(null)).toEqual({ text: {}, data: { gantt: {}, spar: {} } });
  });
});

describe('withinSizeLimit', () => {
  it('true för litet, false för > 256 kB', () => {
    expect(withinSizeLimit({ text: {}, data: {} })).toBe(true);
    const big = { text: { k: 'x'.repeat(300 * 1024) }, data: {} };
    expect(withinSizeLimit(big)).toBe(false);
  });
});

describe('saveOverrides', () => {
  it('avvisar ogiltig sida utan att skriva', async () => {
    await expect(saveOverrides('fel', { text: {}, data: {} })).rejects.toThrow('Ogiltig sida');
    expect(put).not.toHaveBeenCalled();
  });

  it('skriver sanerat dokument med updatedAt till rätt path', async () => {
    put.mockResolvedValue({});
    const doc = await saveOverrides('lokal', { text: { 'p-a-0': 'hej', bad: 5 }, data: {} });
    expect(put).toHaveBeenCalledTimes(1);
    const [path, body, opts] = put.mock.calls[0];
    expect(path).toBe('overrides/lokal.json');
    expect(opts.allowOverwrite).toBe(true);
    const written = JSON.parse(body);
    expect(written.text).toEqual({ 'p-a-0': 'hej' });
    expect(typeof written.updatedAt).toBe('string');
    expect(doc.updatedAt).toBe(written.updatedAt);
  });
});
