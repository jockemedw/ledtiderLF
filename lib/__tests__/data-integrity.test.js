import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Skyddar korsreferenserna mellan data/siffror.json och data/kallregister.json —
// brutna kalla_ids och okända kategorier filtreras annars bort tyst på undersidorna.

const root = path.join(__dirname, '..', '..');
const siffror = JSON.parse(fs.readFileSync(path.join(root, 'data', 'siffror.json'), 'utf-8'));
const register = JSON.parse(fs.readFileSync(path.join(root, 'data', 'kallregister.json'), 'utf-8'));

describe('dataintegritet', () => {
  const kallIds = register.kallor.map(k => k.id);
  const kategoriIds = new Set(siffror.kategorier.map(k => k.id));
  const omradeIds = new Set(register.omraden.map(o => o.id));

  it('alla käll-id är unika', () => {
    expect(new Set(kallIds).size).toBe(kallIds.length);
  });

  it('alla nyckeltal-id är unika', () => {
    const ids = siffror.nyckeltal.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('varje kalla_id i siffror.json finns i källregistret', () => {
    const known = new Set(kallIds);
    for (const n of siffror.nyckeltal) {
      for (const id of n.kalla_ids) {
        expect(known.has(id), `nyckeltal '${n.id}' pekar på okänd källa '${id}'`).toBe(true);
      }
    }
  });

  it('varje nyckeltal har giltig kategori och känt verifieringsvärde', () => {
    for (const n of siffror.nyckeltal) {
      expect(kategoriIds.has(n.kategori), `nyckeltal '${n.id}' har okänd kategori '${n.kategori}'`).toBe(true);
      expect(['verifierad', 'preliminar', 'falsk', 'ej-verifierbar']).toContain(n.verifiering);
    }
  });

  it('varje källa har giltigt område', () => {
    for (const k of register.kallor) {
      expect(omradeIds.has(k.omrade), `källa '${k.id}' har okänt område '${k.omrade}'`).toBe(true);
    }
  });

  // Speglar TYP_LABELS i pages/kallregister.js — okänd typ renderas annars som rå slug.
  const KANDA_TYPER = [
    'rapport', 'slutrapport', 'branschindex', 'vagledning', 'kommunal-plan',
    'lagstiftning', 'statistik', 'forskning', 'branschorganisation',
    'finansiering', 'samhallsfastighetsbolag',
  ];

  it('varje källa har alla obligatoriska fält, känd typ och https-URL', () => {
    for (const k of register.kallor) {
      for (const falt of ['id', 'omrade', 'typ', 'titel', 'organisation', 'datum', 'url', 'sammandrag']) {
        expect(typeof k[falt] === 'string' && k[falt].length > 0, `källa '${k.id}' saknar fältet '${falt}'`).toBe(true);
      }
      expect(KANDA_TYPER, `källa '${k.id}' har okänd typ '${k.typ}'`).toContain(k.typ);
      expect(k.url.startsWith('https://'), `källa '${k.id}' har icke-https-URL`).toBe(true);
    }
  });

  // Hårdkontrollen (2026-08): varje källa och nyckeltal bär ett revisionsspår.
  // Kraven aktiveras automatiskt när första hardkontroll-fältet finns i datat.
  const HK_STATUS = ['godkand', 'anmarkning', 'underkand', 'ej-kontrollerbar'];
  const HK_METOD = ['webfetch', 'websearch', 'pdf-nedladdning', 'manuell'];
  const DATUM_RE = /^\d{4}-\d{2}-\d{2}$/;
  const hkAktiv = register.kallor.some(k => k.hardkontroll) || siffror.nyckeltal.some(n => n.hardkontroll);

  it.runIf(hkAktiv)('varje källa har giltig hardkontroll', () => {
    for (const k of register.kallor) {
      const hk = k.hardkontroll;
      expect(hk, `källa '${k.id}' saknar hardkontroll`).toBeTruthy();
      expect(HK_STATUS, `källa '${k.id}' har okänd hardkontroll-status '${hk?.status}'`).toContain(hk.status);
      expect(HK_METOD, `källa '${k.id}' har okänd hardkontroll-metod '${hk?.metod}'`).toContain(hk.metod);
      expect(DATUM_RE.test(hk.datum), `källa '${k.id}' har ogiltigt hardkontroll-datum '${hk?.datum}'`).toBe(true);
      if (hk.status !== 'godkand') {
        expect(typeof hk.not === 'string' && hk.not.length > 0, `källa '${k.id}' med status '${hk.status}' saknar not`).toBe(true);
      }
    }
  });

  it.runIf(hkAktiv)('varje nyckeltal har hardkontroll-datum och källkrav', () => {
    for (const n of siffror.nyckeltal) {
      expect(n.hardkontroll, `nyckeltal '${n.id}' saknar hardkontroll`).toBeTruthy();
      expect(DATUM_RE.test(n.hardkontroll.datum), `nyckeltal '${n.id}' har ogiltigt hardkontroll-datum`).toBe(true);
      if (n.kalla_ids.length === 0) {
        expect(['preliminar', 'ej-verifierbar'], `nyckeltal '${n.id}' saknar källa men är '${n.verifiering}'`).toContain(n.verifiering);
      }
    }
  });
});
