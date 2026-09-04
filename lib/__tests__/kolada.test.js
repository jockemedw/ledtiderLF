import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  ENTITETER,
  GRUPPER,
  KATALOG,
  KLASSER,
  RIKTNINGAR,
  MIN_KOMMUNER,
  totalvarde,
  percentilFor,
  avvikelse,
  avvikelseStil,
  fordelning,
  median,
} from '../kolada.js';

const ROT = path.join(__dirname, '..', '..');
const data = JSON.parse(fs.readFileSync(path.join(ROT, 'data', 'kolada.json'), 'utf-8'));

describe('Kolada — katalogen', () => {
  it('har unika id och kända klasser, riktningar och grupper', () => {
    const idn = new Set();
    const gruppIdn = new Set(GRUPPER.map(g => g.id));
    for (const m of KATALOG) {
      expect(idn.has(m.id), `dubblett-id ${m.id}`).toBe(false);
      idn.add(m.id);
      expect(KLASSER, `okänd klass på ${m.id}`).toContain(m.klass);
      expect(RIKTNINGAR, `okänd riktning på ${m.id}`).toContain(m.riktning);
      expect(gruppIdn, `okänd grupp på ${m.id}`).toContain(m.grupp);
      expect(m.kort.length, `tom etikett på ${m.id}`).toBeGreaterThan(0);
      expect(m.enhet.length, `tom enhet på ${m.id}`).toBeGreaterThan(0);
      if (m.liknande !== null) expect(m.liknande, `okänd liknande-grupp på ${m.id}`).toMatch(/^G\d+$/);
    }
  });

  it('kopplar klass och riktning konsekvent', () => {
    for (const m of KATALOG) {
      // Ett styrmått utan riktning kan inte tolkas som bättre eller sämre.
      if (m.klass === 'styrmatt') expect(m.riktning, `${m.id} är styrmått utan riktning`).not.toBe('ingen');
      // Ett kontextmått beskriver förutsättningar och får aldrig bära en riktning.
      if (m.klass === 'kontextmatt') expect(m.riktning, `${m.id} är kontextmått med riktning`).toBe('ingen');
      if (m.klass === 'kostnadsmatt') expect(m.riktning, `${m.id} är kostnadsmått med riktning`).toBe('ingen');
    }
  });

  it('pekar varje liknande-grupp på en känd entitet', () => {
    for (const m of KATALOG) {
      if (m.liknande) expect(Object.keys(ENTITETER), `${m.id}`).toContain(m.liknande);
    }
  });
});

describe('Kolada — analysmodellen', () => {
  it('färgar aldrig avvikelsen på ett kostnadsmått eller kontextmått', () => {
    // Riktningen är inte entydig där, och en färg vore ett betyg vi inte kan belägga.
    for (const m of KATALOG.filter(k => k.klass !== 'styrmatt')) {
      for (const avv of [-50, -1, 0, 1, 50]) {
        expect(avvikelseStil(m, avv).ton, `${m.id} färgades vid ${avv}`).toBe('neutral');
      }
    }
  });

  it('färgar styrmått efter riktningen', () => {
    const lagre = { klass: 'styrmatt', riktning: 'lagre_battre' };
    const hogre = { klass: 'styrmatt', riktning: 'hogre_battre' };
    expect(avvikelseStil(lagre, -10).ton).toBe('bra');
    expect(avvikelseStil(lagre, 10).ton).toBe('daligt');
    expect(avvikelseStil(hogre, -10).ton).toBe('daligt');
    expect(avvikelseStil(hogre, 10).ton).toBe('bra');
    expect(avvikelseStil(lagre, null).ton).toBe('neutral');
  });

  it('räknar percentil, avvikelse, median och fördelning', () => {
    expect(percentilFor([1, 2, 3, 4], 3)).toBe(50);
    expect(percentilFor([], 3)).toBeNull();
    expect(percentilFor([1, 2], null)).toBeNull();
    expect(avvikelse(110, 100)).toBe(10);
    expect(avvikelse(90, 100)).toBe(-10);
    expect(avvikelse(10, null)).toBeNull();
    expect(avvikelse(10, 0)).toBeNull();
    expect(avvikelse(null, 100)).toBeNull();
    // Negativ referens får inte invertera tecknet. Avskrivningar är negativa i
    // Kolada: −1 962 mot −4 118 är ett HÖGRE värde och ska ge positiv avvikelse.
    expect(avvikelse(-1962, -4118)).toBe(52.4);
    expect(avvikelse(-5000, -4118)).toBe(-21.4);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(fordelning([])).toBeNull();
    expect(fordelning([1, 2, 3, 4, 5]).median).toBe(3);
  });

  it('plockar alltid totalvärdet, aldrig kvinnors eller mäns', () => {
    // values[0] gav 82 794 invånare i Linköping i stället för 168 714.
    const rad = {
      values: [
        { gender: 'K', value: 82794 },
        { gender: 'M', value: 85920 },
        { gender: 'T', value: 168714 },
      ],
    };
    expect(totalvarde(rad)).toBe(168714);
    expect(totalvarde({ values: [{ gender: 'K', value: 1 }, { gender: 'M', value: 2 }] })).toBeNull();
    expect(totalvarde({ values: [] })).toBeNull();
    expect(totalvarde({ values: [{ gender: 'T', value: null }] })).toBeNull();
  });
});

describe('data/kolada.json', () => {
  it('har hämtdatum och referensår', () => {
    expect(data.meta.hamtat).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.meta.senaste_ar).toBeGreaterThan(2000);
    expect(data.meta.senaste_ar).toBeLessThan(2100);
  });

  it('håller isär råa och bearbetade värden', () => {
    // Koladas villkor: råa värden får anges med "Källa: Kolada", egna
    // bearbetningar får det inte. Uppdelningen måste därför vara strukturell.
    const HARLETT = ['avvikelse', 'percentil', 'fordelning', 'forandring'];
    const RATT = ['varde', 'serie', 'referenser'];
    for (const [kpi, v] of Object.entries(data.varden)) {
      for (const nyckel of HARLETT) {
        expect(Object.keys(v), `${kpi}: härlett fält under varden`).not.toContain(nyckel);
      }
    }
    for (const [kpi, b] of Object.entries(data.bearbetat)) {
      for (const nyckel of RATT) {
        expect(Object.keys(b), `${kpi}: rått fält under bearbetat`).not.toContain(nyckel);
      }
    }
  });

  it('korsrefererar katalog, entiteter och värden', () => {
    const katalogIdn = new Set(data.katalog.map(m => m.id));
    const entitetIdn = new Set(Object.keys(data.entiteter));
    for (const kpi of Object.keys(data.varden)) expect(katalogIdn, kpi).toContain(kpi);
    for (const kpi of Object.keys(data.bearbetat)) expect(katalogIdn, kpi).toContain(kpi);
    for (const [kpi, v] of Object.entries(data.varden)) {
      expect(entitetIdn, `${kpi}: okänt subjekt`).toContain(v.subjekt);
      for (const ref of Object.values(v.referenser)) {
        if (ref.entitet) expect(entitetIdn, `${kpi}: okänd referensentitet`).toContain(ref.entitet);
      }
    }
  });

  it('substituerar aldrig kommunmedianen in i Riket-kolumnen', () => {
    // Riket saknas för planmåtten. Medianen är vår beräkning och hör hemma i
    // en egen kolumn, aldrig i en kolumn läsaren tror är Koladas riksvärde.
    for (const [kpi, v] of Object.entries(data.varden)) {
      const riket = v.referenser.riket;
      if (riket.varde === null) expect(riket.saknas, `${kpi}`).toBeTruthy();
    }
  });

  it('har tillräcklig kommuntäckning där percentil redovisas', () => {
    for (const [kpi, b] of Object.entries(data.bearbetat)) {
      if (b && b.percentil !== null) {
        expect(b.fordelning.n, `${kpi}`).toBeGreaterThanOrEqual(MIN_KOMMUNER);
        expect(b.percentil).toBeGreaterThanOrEqual(0);
        expect(b.percentil).toBeLessThanOrEqual(100);
      }
    }
  });

  it('har rimliga kärnvärden för Linköping', () => {
    // Spärr mot könsuppdelningsbuggen — kvinnovärdet är 82 794.
    expect(data.varden.N01951.varde).toBeGreaterThan(150000);
    expect(data.varden.N07926.varde).toBeGreaterThan(0);
    expect(data.varden.N15009.varde).toBeGreaterThan(0);
  });


  it('förväxlar aldrig Koladas 44 med Ledtidsindex 46', () => {
    // Hårdkontrollen 2026-08-26 strök ett obelagt "44 mån mediantid" och
    // ersatte det med Ledtidsindex 46 mån. Koladas 44,0 är en annan mätning:
    // median i stället för genomsnitt, antagande i stället för laga kraft,
    // Linköping i stället för riket. Skrivsättet måste hålla dem isär.
    for (const fil of ['lokalforsorjning.html', 'detaljplan.html']) {
      const h = fs.readFileSync(path.join(ROT, fil), 'utf-8');
      expect(h, `${fil}: den strukna lydelsen "44 mån" har återuppstått`).not.toMatch(/\b44 mån\b/);
      if (h.includes('44,0')) {
        expect(h, `${fil}: 44,0 visas utan att ändpunkten anges`).toMatch(/antagande/);
      }
    }
    // Disambigueringen bor i katalogens not för N07926 och följer därmed med
    // överallt där talet visas, i stället för att vara knuten till en sida.
    const notN07926 = KATALOG.find(m => m.id === 'N07926').not;
    expect(notN07926, 'N07926 saknar disambigueringen mot Ledtidsindex').toMatch(/46 månader/);
    expect(notN07926, 'N07926 saknar ändpunkten för Koladas mått').toMatch(/antagande/);
    expect(data.katalog.find(m => m.id === 'N07926').not, 'noten nådde inte datafilen').toMatch(
      /46 månader/,
    );
  });

  it('avrundar alla tal för läsbar diff', () => {
    const kolla = (v, stig) => {
      if (typeof v === 'number') {
        const dec = (String(v).split('.')[1] || '').length;
        expect(dec, `${stig} = ${v}`).toBeLessThanOrEqual(2);
      } else if (v && typeof v === 'object') {
        for (const [k, x] of Object.entries(v)) kolla(x, `${stig}.${k}`);
      }
    };
    kolla(data.varden, 'varden');
    kolla(data.bearbetat, 'bearbetat');
    kolla(data.enhetsdata, 'enhetsdata');
  });
});
