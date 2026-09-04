#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Hämtar kommunstatistik från Koladas API v3 och skriver data/kolada.json.
 *
 * Katalogen och beräkningarna ligger i lib/kolada.js så att testerna kan
 * importera dem utan nätverksanrop.
 *
 * Användning:
 *   npm run kolada                     # hämtar och skriver data/kolada.json
 *   npm run kolada -- --torrkor        # hämtar och räknar men skriver ingen fil
 *   npm run kolada -- --ut=data/x.json # annan utfil
 *
 * Kolada revideras utan avisering. Kör --torrkor och granska git diff innan
 * resultatet committas.
 */

const fs = require('fs');
const path = require('path');
const {
  REGION,
  ENTITETER,
  ENHETER,
  REFERENSGRUPPER,
  GRUPPER,
  KATALOG,
  VILLKOR,
  avrunda,
  hamta,
  kravTackning,
  totalvarde,
  tillSerier,
  kommunvarden,
  sorteradSerie,
  kandidatAr,
  byggVarden,
  byggBearbetat,
  MIN_KOMMUNER,
} = require('../lib/kolada');

const ROOT = path.join(__dirname, '..');

// Svaren kapas vid 5 000 rader. hamta() följer next_url, men mindre satser
// håller varje svar väl under taket och gör täckningskontrollen skarpare.
const SATS = 12;

function parseArgs(argv) {
  const args = { torrkor: false, ut: 'data/kolada.json' };
  for (const a of argv.slice(2)) {
    if (a === '--torrkor') args.torrkor = true;
    else if (a.startsWith('--ut=')) args.ut = a.slice('--ut='.length);
  }
  return args;
}

function delaUpp(lista, storlek) {
  const ut = [];
  for (let i = 0; i < lista.length; i += storlek) ut.push(lista.slice(i, i + storlek));
  return ut;
}

const decimalerFor = kpi => {
  const m = KATALOG.find(k => k.id === kpi);
  return m ? m.decimaler : 1;
};

async function hamtaMetadata(kpiIdn) {
  const rader = [];
  for (const sats of delaUpp(kpiIdn, SATS)) {
    rader.push(...(await hamta(`/kpi/${sats.join(',')}`)));
  }
  return Object.fromEntries(rader.map(r => [r.id, r]));
}

async function hamtaSerier(kpiIdn, entitetIdn) {
  const rader = [];
  for (const sats of delaUpp(kpiIdn, SATS)) {
    const sokvag = `/data/kpi/${sats.join(',')}/municipality/${entitetIdn.join(',')}`;
    rader.push(...(await hamta(sokvag)));
  }
  return tillSerier(rader, decimalerFor);
}

/**
 * Percentilen kräver hela kommunfördelningen. Ett nyckeltal för ett år ger
 * 3 800–3 950 rader; två slår i 5 000-radstaket. Därför ett anrop per nyckeltal.
 *
 * Senaste året är inte alltid rätt jämförelseår: insamlingen kan vara
 * ofullständig. U00810 hade 24 kommuner inrapporterade för 2025 men 103 för
 * 2024. Vi går därför bakåt tills täckningen räcker, som mest tre år.
 */
async function hamtaFordelningar(matt, serier) {
  const ut = {};
  for (const m of matt) {
    for (const ar of kandidatAr(m, serier).slice(0, 3)) {
      const sokvag = `/data/kpi/${m.id}/year/${ar}`;
      const rader = await hamta(sokvag);
      kravTackning(rader, [m.id], sokvag);
      const varden = kommunvarden(rader, m.id, ar);
      if (varden.length >= MIN_KOMMUNER) {
        ut[m.id] = { ar, varden };
        break;
      }
      console.warn(`  ${m.id}: bara ${varden.length} kommuner för ${ar} — provar tidigare år`);
    }
  }
  return ut;
}

async function hamtaEnheter(kpiIdn) {
  const ouIdn = Object.keys(ENHETER);
  const sokvag = `/oudata/kpi/${kpiIdn.join(',')}/ou/${ouIdn.join(',')}`;
  const rader = await hamta(sokvag);
  const ut = {};
  for (const rad of rader) {
    const v = totalvarde(rad);
    if (v === null || rad.period < 2020) continue;
    ut[rad.ou] ||= { namn: ENHETER[rad.ou].namn, region: ENHETER[rad.ou].region, serier: {} };
    ut[rad.ou].serier[rad.kpi] ||= {};
    ut[rad.ou].serier[rad.kpi][rad.period] = avrunda(v, decimalerFor(rad.kpi));
  }
  for (const ou of Object.values(ut)) {
    for (const kpi of Object.keys(ou.serier)) ou.serier[kpi] = sorteradSerie(ou.serier[kpi]);
  }
  return ut;
}

/** Hårda spärrar innan något skrivs. Fel här är alltid fel i hämtningen. */
function kontrollera(data) {
  const fel = [];

  const saknade = KATALOG.filter(m => !data.varden[m.id]).map(m => m.id);
  if (saknade.length) fel.push(`Nyckeltal utan värden: ${saknade.join(', ')}`);

  for (const id of ['N07926', 'N15009', 'N01951']) {
    if (!data.varden[id]) fel.push(`Kärnnyckeltalet ${id} saknar värde för Linköping`);
  }

  // Literal spärr mot könsuppdelningsbuggen: values[0] gav 82 794 i stället för
  // 168 714, alltså kvinnorna i stället för totalen.
  const inv = data.varden.N01951 && data.varden.N01951.varde;
  if (inv !== undefined && inv !== null && inv < 150000) {
    fel.push(`N01951 för Linköping är ${inv} — under 150 000 tyder på att könsfiltret T inte tillämpats`);
  }

  for (const m of KATALOG.filter(k => k.percentil)) {
    const b = data.bearbetat[m.id];
    if (b && b.fordelning && b.fordelning.n < MIN_KOMMUNER) {
      fel.push(`${m.id} har bara ${b.fordelning.n} kommuner i fördelningen`);
    }
  }

  return fel;
}

async function bygg() {
  const kpiIdn = KATALOG.map(m => m.id);
  const entitetIdn = Object.keys(ENTITETER);

  console.log(`Hämtar metadata för ${kpiIdn.length} nyckeltal …`);
  const metadata = await hamtaMetadata(kpiIdn);

  console.log(`Hämtar tidsserier för ${entitetIdn.length} entiteter …`);
  const serier = await hamtaSerier(kpiIdn, entitetIdn);

  // Region-fastighetsnyckeltalen finns bara för regioner — ingen kommun-
  // fördelning att räkna percentil ur. Absoluta tal får ingen percentil alls,
  // eftersom den bara skulle mäta kommunstorlek.
  const medFordelning = KATALOG.filter(m => m.percentil);
  console.log(`Hämtar kommunfördelning för ${medFordelning.length} nyckeltal (ett anrop per nyckeltal) …`);
  const fordelningar = await hamtaFordelningar(medFordelning, serier);

  const regionKpi = KATALOG.filter(m => m.grupp === 'region-fastighet').map(m => m.id);
  console.log(`Hämtar anläggningsdata för ${Object.keys(ENHETER).length} enheter …`);
  const enhetsdata = await hamtaEnheter(regionKpi);

  const katalog = KATALOG.map(m => ({
    ...m,
    kolada_titel: (metadata[m.id] || {}).title || null,
    publiceringsdatum: (metadata[m.id] || {}).publication_date || null,
  }));

  const varden = {};
  const bearbetat = {};
  for (const m of KATALOG) {
    const fd = fordelningar[m.id];
    // Jämförelseåret styrs av täckningen där percentil beräknas, annars av
    // senaste år med värde för subjektet.
    const ar = fd ? fd.ar : kandidatAr(m, serier)[0];
    if (ar === undefined) continue;
    const v = byggVarden(m, serier, ar);
    if (!v) continue;
    varden[m.id] = v;
    bearbetat[m.id] = byggBearbetat(m, v, fd ? fd.varden : null);
  }

  const senasteAr = Math.max(...Object.values(varden).map(v => v.ar));

  return {
    meta: {
      hamtat: new Date().toISOString().slice(0, 10),
      api_bas: 'https://api.kolada.se/v3',
      skript: 'scripts/fetch-kolada.js',
      senaste_ar: senasteAr,
      villkor: VILLKOR,
    },
    entiteter: ENTITETER,
    referensgrupper: REFERENSGRUPPER,
    grupper: GRUPPER,
    katalog,
    varden,
    bearbetat,
    enhetsdata,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  try {
    const data = await bygg();

    const fel = kontrollera(data);
    if (fel.length) {
      console.error('\nKontrollen misslyckades:');
      for (const f of fel) console.error(`  - ${f}`);
      process.exit(1);
    }

    const medPercentil = Object.values(data.bearbetat).filter(b => b && b.percentil !== null).length;

    if (args.torrkor) {
      console.log('\nTorrkörning — ingen fil skriven.\n');
      for (const m of data.katalog) {
        const v = data.varden[m.id];
        if (!v) continue;
        const b = data.bearbetat[m.id];
        const p = b && b.percentil !== null ? ` · percentil ${b.percentil}` : '';
        console.log(`  ${m.id}  ${m.kort} (${m.enhet}) ${v.ar}: ${v.varde}${p}`);
      }
      console.log(`\n${Object.keys(data.varden).length} nyckeltal med värden, ${medPercentil} med percentil.`);
      return;
    }

    const utPath = path.join(ROOT, args.ut);
    fs.writeFileSync(utPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
    const kb = Math.round(fs.statSync(utPath).size / 1024);
    console.log(
      `✓ Skrev ${Object.keys(data.varden).length} nyckeltal (${medPercentil} med percentil) → ${path.relative(ROOT, utPath)}, ${kb} kB`,
    );
  } catch (err) {
    if (err.code === 'KOLADA_HTTP' || err.code === 'KOLADA_TACKNING' || err.code === 'KOLADA_SIDOR') {
      console.error('Fel mot Kolada:', err.message);
      process.exit(1);
    }
    console.error('Fel vid hämtning:', err);
    process.exit(1);
  }
}

main();
