import { describe, it, expect } from 'vitest';
import { applyDataOverrides, collectTextTargets } from '../apply-overrides.js';

function baseDATA() {
  return {
    gantt: [
      {
        label: 'A1. Hyra in',
        sublabel: 'Befintlig lokal',
        forskedeMan: 6,
        totalManader: 8,
        segment: [
          { fas: 'forstudie', andel: 0.25 },
          { fas: 'upphandling', andel: 0.25 },
          { fas: 'anpassning', andel: 0.5 },
        ],
      },
    ],
    spar: [
      {
        id: 'a',
        scenarios: [
          {
            totalText: '3–12 månader',
            faser: [
              { namn: 'Förstudie', fas: 'forstudie', tid: '1–3 mån' },
              { namn: 'Inflyttning', fas: 'anpassning', tid: '1–2 mån' },
            ],
          },
        ],
      },
    ],
  };
}

describe('applyDataOverrides – gantt', () => {
  it('bygger om segment från månader: total = Σ man, andel = man/total', () => {
    const DATA = baseDATA();
    applyDataOverrides(DATA, {
      gantt: {
        'A1. Hyra in|Befintlig lokal': {
          forskedeMan: 10,
          segment: [
            { fas: 'forstudie', man: 3 },
            { fas: 'upphandling', man: 3 },
            { fas: 'anpassning', man: 6 },
          ],
        },
      },
    });
    const rad = DATA.gantt[0];
    expect(rad.forskedeMan).toBe(10);
    expect(rad.totalManader).toBe(12);
    expect(rad.segment.map((s) => s.andel)).toEqual([0.25, 0.25, 0.5]);
    expect(rad.segment.map((s) => s.fas)).toEqual(['forstudie', 'upphandling', 'anpassning']);
  });

  it('hoppar tyst över gantt-rad som inte finns', () => {
    const DATA = baseDATA();
    applyDataOverrides(DATA, { gantt: { 'Finns inte|alls': { forskedeMan: 99 } } });
    expect(DATA.gantt[0].forskedeMan).toBe(6);
  });

  it('ignorerar segment med noll total (odefinierat andel undviks)', () => {
    const DATA = baseDATA();
    applyDataOverrides(DATA, {
      gantt: { 'A1. Hyra in|Befintlig lokal': { segment: [{ fas: 'forstudie', man: 0 }] } },
    });
    // Oförändrad total och segment
    expect(DATA.gantt[0].totalManader).toBe(8);
    expect(DATA.gantt[0].segment).toHaveLength(3);
  });
});

describe('applyDataOverrides – spår', () => {
  it('sätter totalText och per fas tid (matchad på namn)', () => {
    const DATA = baseDATA();
    applyDataOverrides(DATA, {
      spar: {
        a: {
          scenarios: [
            { totalText: '4–14 månader', faser: [{ namn: 'Inflyttning', tid: '2–3 mån' }] },
          ],
        },
      },
    });
    const sc = DATA.spar[0].scenarios[0];
    expect(sc.totalText).toBe('4–14 månader');
    expect(sc.faser.find((f) => f.namn === 'Inflyttning').tid).toBe('2–3 mån');
    // Ej nämnd fas orörd
    expect(sc.faser.find((f) => f.namn === 'Förstudie').tid).toBe('1–3 mån');
  });

  it('hoppar tyst över okänt spår-id och okänt fasnamn', () => {
    const DATA = baseDATA();
    applyDataOverrides(DATA, {
      spar: {
        x: { scenarios: [{ totalText: 'nej' }] },
        a: { scenarios: [{ faser: [{ namn: 'Finns inte', tid: '9 mån' }] }] },
      },
    });
    expect(DATA.spar[0].scenarios[0].totalText).toBe('3–12 månader');
    expect(DATA.spar[0].scenarios[0].faser.every((f) => f.tid !== '9 mån')).toBe(true);
  });

  it('null-scenario i overridet hoppas (index-luckor tillåtna)', () => {
    const DATA = baseDATA();
    applyDataOverrides(DATA, { spar: { a: { scenarios: [null] } } });
    expect(DATA.spar[0].scenarios[0].totalText).toBe('3–12 månader');
  });
});

describe('applyDataOverrides – robusthet', () => {
  it('tål saknat/ogiltigt override utan att kasta', () => {
    const DATA = baseDATA();
    expect(() => applyDataOverrides(DATA, null)).not.toThrow();
    expect(() => applyDataOverrides(DATA, {})).not.toThrow();
    expect(() => applyDataOverrides(null, { gantt: {} })).not.toThrow();
  });
});

describe('collectTextTargets', () => {
  function fakeRoot(map) {
    return {
      querySelector(sel) {
        const m = sel.match(/data-comment-anchor="(.*)"/);
        const id = m ? m[1] : '';
        return map[id] || null;
      },
    };
  }

  it('returnerar bara ankare som finns, med sina värden', () => {
    const root = fakeRoot({ 'p-hej-0': { tag: 'p' } });
    const out = collectTextTargets(root, { 'p-hej-0': 'Ny text', 'p-saknas-1': 'Ignoreras' });
    expect(out).toHaveLength(1);
    expect(out[0].anchor).toBe('p-hej-0');
    expect(out[0].value).toBe('Ny text');
  });

  it('hoppar över icke-strängvärden och tom map', () => {
    const root = fakeRoot({ 'p-hej-0': {} });
    expect(collectTextTargets(root, { 'p-hej-0': 42 })).toHaveLength(0);
    expect(collectTextTargets(root, {})).toHaveLength(0);
    expect(collectTextTargets(null, { 'p-hej-0': 'x' })).toHaveLength(0);
  });
});
