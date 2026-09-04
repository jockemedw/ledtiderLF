import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { byggKallindex, kortEtikett, parseIds, refMarkup, slaUppKallor } from '../kallhanvisning.js';

const root = path.join(__dirname, '..', '..');
const register = JSON.parse(fs.readFileSync(path.join(root, 'data', 'kallregister.json'), 'utf-8'));
const siffror = JSON.parse(fs.readFileSync(path.join(root, 'data', 'siffror.json'), 'utf-8'));
const index = byggKallindex(register, siffror);

const HTML_FILER = ['lokalforsorjning.html', 'detaljplan.html'];

// Alla data-kalla-attribut i innehålls-HTML:en, inkl. de som skrivs ut av
// renderfunktionerna via kalla_ids i DATA-objektet.
function refIdsIFil(fil) {
  const html = fs.readFileSync(path.join(root, fil), 'utf-8');
  const ut = [];
  // Hoppar över mallsträngen i renderfunktionerna (${...}) och CSS-kommentaren
  // som beskriver attributet — bara verkliga attributvärden ska kontrolleras.
  for (const m of html.matchAll(/data-kalla="([^"]+)"/g)) {
    if (/[<$]/.test(m[1])) continue;
    ut.push({ fil, ids: parseIds(m[1]) });
  }
  for (const m of html.matchAll(/kalla_ids:\s*\[([^\]]*)\]/g)) {
    ut.push({ fil, ids: [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]) });
  }
  return ut;
}

describe('källhänvisningar', () => {
  it('käll-id och nyckeltal-id krockar inte', () => {
    const kallIds = new Set(Object.keys(index.kallor));
    const krock = Object.keys(index.nyckeltal).filter(id => kallIds.has(id));
    expect(krock, `id finns både som källa och nyckeltal: ${krock.join(', ')}`).toEqual([]);
  });

  it('varje data-kalla i HTML pekar på känd källa eller känt nyckeltal', () => {
    for (const fil of HTML_FILER) {
      for (const { ids } of refIdsIFil(fil)) {
        expect(ids.length, `tom data-kalla i ${fil}`).toBeGreaterThan(0);
        for (const id of ids) {
          const kand = !!index.kallor[id] || !!index.nyckeltal[id];
          expect(kand, `${fil}: okänt käll-/nyckeltal-id '${id}'`).toBe(true);
        }
      }
    }
  });

  it('detaljplansidan har källhänvisningar i varje innehållssektion', () => {
    const html = fs.readFileSync(path.join(root, 'detaljplan.html'), 'utf-8');
    const sektioner = html.split(/<section /).slice(1);
    const utan = sektioner
      .filter(sek => !/data-kalla=/.test(sek))
      .map(sek => (sek.match(/id="([^"]+)"/) || [])[1]);
    // Hero och det inledande missuppfattningsavsnittet bär inga egna siffror.
    expect(utan).toEqual(['dp-hero']);
  });

  it('nyckeltal-id expanderas till sina källor', () => {
    const refs = slaUppKallor('ledtid-overklagande', index);
    expect(refs.map(r => r.id)).toEqual(['evidens-overklagande-2023', 'evidens-samhallseffekter-2022']);
    expect(refs[0].titel).toContain('Förlängning vid överklagad detaljplan');
  });

  it('nyckeltal utan källa märks som ej källbelagt i stället för att försvinna', () => {
    const refs = slaUppKallor('ledtid-spar-a', index);
    expect(refs).toHaveLength(1);
    expect(refs[0].saknar_kalla).toBe(true);
    expect(refMarkup('ledtid-spar-a', index)).toContain('/nyckeltal#ledtid-spar-a');
  });

  it('dubbletter slås ihop och okända id syns', () => {
    const refs = slaUppKallor('pbl-2010-900 pbl-2010-900 hittepa-2026', index);
    expect(refs.map(r => r.id)).toEqual(['pbl-2010-900', 'hittepa-2026']);
    expect(refs[1].saknas).toBe(true);
  });

  it('markup länkar till källregistret och escapar attributtext', () => {
    const markup = refMarkup('skr-jamforelser-detaljplan', index);
    expect(markup).toContain('href="/kallregister#skr-jamforelser-detaljplan"');
    expect(markup).toContain('SKR Jämförelser DP');
    expect(refMarkup('pbl-2010-900', index)).not.toMatch(/title="[^"]*"[^"]*"/);
  });

  it('kortEtikett använder kort-fältet, annars organisation och år', () => {
    expect(kortEtikett({ kort: 'PBL (2010:900)', organisation: 'Sveriges riksdag' })).toBe('PBL (2010:900)');
    expect(kortEtikett({ organisation: 'Sveriges Kommuner och Regioner (SKR)', datum: '2024-09' })).toBe('SKR 2024');
    expect(kortEtikett({ organisation: 'Lunds kommun', datum: 'löpande' })).toBe('Lunds kommun');
  });
});
