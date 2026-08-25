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
      expect(['verifierad', 'preliminar', 'falsk']).toContain(n.verifiering);
    }
  });

  it('varje källa har giltigt område', () => {
    for (const k of register.kallor) {
      expect(omradeIds.has(k.omrade), `källa '${k.id}' har okänt område '${k.omrade}'`).toBe(true);
    }
  });
});
