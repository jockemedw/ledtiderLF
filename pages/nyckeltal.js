import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import { useMemo, useState } from 'react';
import MinimalNav from '../components/MinimalNav.jsx';

export async function getStaticProps() {
  const root = process.cwd();
  const sharedRaw = fs.readFileSync(path.join(root, 'lokalforsorjning.html'), 'utf-8');
  const styleMatch = sharedRaw.match(/<style>([\s\S]*?)<\/style>/);
  const sharedCss = styleMatch ? styleMatch[1] : '';

  const siffror = JSON.parse(fs.readFileSync(path.join(root, 'data/siffror.json'), 'utf-8'));
  const kallregister = JSON.parse(fs.readFileSync(path.join(root, 'data/kallregister.json'), 'utf-8'));

  const kallorById = Object.fromEntries(kallregister.kallor.map(k => [k.id, {
    id: k.id,
    titel: k.titel,
    organisation: k.organisation,
    url: k.url,
    datum: k.datum,
  }]));

  return { props: { sharedCss, ...siffror, kallorById } };
}

const VERIFIERING_LABELS = {
  verifierad: 'Verifierad',
  preliminar: 'Preliminär',
  falsk: 'Falsk — uppdatera',
  'ej-verifierbar': 'Ej verifierbar',
};

const VERIFIERING_FARG = {
  verifierad: '#059669',
  preliminar: '#D97706',
  falsk: '#DC2626',
  'ej-verifierbar': '#6B7280',
};

export default function Nyckeltal({ sharedCss, uppdaterad, kategorier, nyckeltal, kallorById }) {
  const [sok, setSok] = useState('');
  const [visaTangerande, setVisaTangerande] = useState(false);
  const [endastVerifierade, setEndastVerifierade] = useState(false);
  const [valdaKategorier, setValdaKategorier] = useState(
    () => new Set(kategorier.map(k => k.id))
  );

  const kategoriMap = useMemo(
    () => Object.fromEntries(kategorier.map(k => [k.id, k])),
    [kategorier]
  );

  const filtrerade = useMemo(() => {
    const sokLower = sok.trim().toLowerCase();
    return nyckeltal.filter(n => {
      if (!valdaKategorier.has(n.kategori)) return false;
      if (!visaTangerande && n.tangerande) return false;
      if (endastVerifierade && n.verifiering !== 'verifierad') return false;
      if (sokLower) {
        const haystack = `${n.etikett} ${n.varde} ${n.not || ''}`.toLowerCase();
        if (!haystack.includes(sokLower)) return false;
      }
      return true;
    });
  }, [nyckeltal, sok, valdaKategorier, visaTangerande, endastVerifierade]);

  const perKategori = useMemo(() => {
    const out = new Map();
    for (const k of kategorier) out.set(k.id, []);
    for (const n of filtrerade) {
      if (out.has(n.kategori)) out.get(n.kategori).push(n);
    }
    return out;
  }, [filtrerade, kategorier]);

  const toggleKategori = (id) => {
    setValdaKategorier(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) return new Set(kategorier.map(k => k.id));
      return next;
    });
  };

  const totalt = nyckeltal.filter(n => visaTangerande || !n.tangerande).length;
  const synliga = filtrerade.length;

  return (
    <>
      <Head>
        <title>Nyckeltal — rå fakta från källorna · Lokalförsörjning</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Citerbara nyckeltal — ledtider, kostnad, bestånd, demografi, klimat och verifieringsstatus — för svensk kommunal lokalförsörjning. Varje rad med källa och datum." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: sharedCss }} />
        <style dangerouslySetInnerHTML={{ __html: nyckeltalCss }} />
      </Head>

      <MinimalNav title="Nyckeltal" />

      <section className="nt-hero">
        <div className="nt-hero-inner">
          <p className="hero-eyebrow">Nyckeltal</p>
          <h1>Rå fakta från källorna</h1>
          <p className="nt-hero-ingress">
            {totalt} citerbara nyckeltal som översikten bygger på — ledtider, kostnader,
            bestånd, demografi, regelverk och verifieringsstatus. Varje rad har en
            klickbar källa och en verifieringsmarkör. Intervall där spridning är meningsfull.
            Samtliga rader har genomgått en hårdkontroll mot primärkällorna — håll muspekaren
            över statusmarkören för datum och detaljer.
          </p>
          <span className="nt-meta">Uppdaterat {uppdaterad}</span>
        </div>
      </section>

      <section className="nt-controls" aria-label="Filtrera och sök">
        <div className="container">
          <div className="nt-control-rad">
            <input
              type="search"
              placeholder="Sök i etikett, värde eller not…"
              className="nt-sok"
              value={sok}
              onChange={(e) => setSok(e.target.value)}
              aria-label="Sök bland nyckeltalen"
            />
            <label className="nt-toggle">
              <input
                type="checkbox"
                checked={endastVerifierade}
                onChange={(e) => setEndastVerifierade(e.target.checked)}
              />
              <span>Endast verifierade</span>
            </label>
            <label className="nt-toggle">
              <input
                type="checkbox"
                checked={visaTangerande}
                onChange={(e) => setVisaTangerande(e.target.checked)}
              />
              <span>Inkludera tangerande (bostadsdata)</span>
            </label>
          </div>

          <div className="nt-kategori-rad" role="group" aria-label="Filtrera kategorier">
            {kategorier.map(k => {
              const aktiv = valdaKategorier.has(k.id);
              const antal = nyckeltal.filter(n =>
                n.kategori === k.id && (visaTangerande || !n.tangerande)
              ).length;
              return (
                <button
                  key={k.id}
                  type="button"
                  className={`nt-chip${aktiv ? ' is-active' : ''}`}
                  onClick={() => toggleKategori(k.id)}
                  style={aktiv ? { '--chip-farg': k.farg } : undefined}
                  aria-pressed={aktiv}
                >
                  <span className="nt-chip-prick" aria-hidden="true" style={{ background: k.farg }} />
                  {k.namn}
                  <span className="nt-chip-antal">{antal}</span>
                </button>
              );
            })}
          </div>

          <p className="nt-status">
            Visar {synliga} av {totalt} nyckeltal
            {sok ? <> · sökord: <strong>{sok}</strong></> : null}
          </p>
        </div>
      </section>

      <section className="nt-lista">
        <div className="container">
          {kategorier.map(k => {
            const rader = perKategori.get(k.id) || [];
            if (!valdaKategorier.has(k.id) || rader.length === 0) return null;
            return (
              <KategoriSektion
                key={k.id}
                kategori={k}
                rader={rader}
                kallorById={kallorById}
              />
            );
          })}
          {synliga === 0 && (
            <div className="nt-tom">
              <p>Inga nyckeltal matchar dina filter. Justera sökord eller välj fler kategorier.</p>
            </div>
          )}
        </div>
      </section>

      <footer>
        <strong>Lejonfastigheter AB</strong> · Lokalförsörjningsguide · Nyckeltal · Internt arbetsmaterial
      </footer>
    </>
  );
}

function KategoriSektion({ kategori, rader, kallorById }) {
  return (
    <section className="nt-sektion" id={`sektion-${kategori.id}`}>
      <header className="nt-sektion-head" style={{ '--sektion-farg': kategori.farg }}>
        <span className="nt-sektion-kort" style={{ background: kategori.farg }}>
          {kategori.kort}
        </span>
        <div>
          <h2>{kategori.namn}</h2>
          {kategori.ingress && <p className="nt-sektion-ingress">{kategori.ingress}</p>}
        </div>
      </header>

      <div className="nt-tabell-wrap">
        <table className="nt-tabell">
          <thead>
            <tr>
              <th>Vad</th>
              <th>Värde</th>
              <th>Datum</th>
              <th>Källa</th>
              <th className="nt-th-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {rader.map(r => (
              <NyckeltalRad key={r.id} rad={r} kallorById={kallorById} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NyckeltalRad({ rad, kallorById }) {
  const kallor = (rad.kalla_ids || []).map(id => kallorById[id]).filter(Boolean);
  const farg = VERIFIERING_FARG[rad.verifiering] || '#6B7280';
  return (
    <tr className={`nt-rad${rad.tangerande ? ' is-tangerande' : ''}`}>
      <td className="nt-td-etikett">
        <span className="nt-etikett">{rad.etikett}</span>
        {rad.tangerande && <span className="nt-tag-tangerande">tangerande</span>}
        {rad.not && <span className="nt-not">{rad.not}</span>}
      </td>
      <td className="nt-td-varde">
        <strong>{rad.varde}</strong>
      </td>
      <td className="nt-td-datum">{rad.datum || ''}</td>
      <td className="nt-td-kalla">
        {kallor.length === 0 ? (
          <span className="nt-saknas">—</span>
        ) : (
          <ul className="nt-kallor">
            {kallor.map(k => (
              <li key={k.id}>
                <a href={`/kallregister#${k.id}`} title={`${k.titel} (${k.organisation})`}>
                  {kortaKalla(k)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className="nt-td-status">
        <span className="nt-status-dot" style={{ background: farg }} aria-hidden="true" />
        <span
          className="nt-status-text"
          title={rad.hardkontroll ? `Hårdkontroll ${rad.hardkontroll.datum}${rad.hardkontroll.not ? ' — ' + rad.hardkontroll.not : ''}` : undefined}
        >
          {VERIFIERING_LABELS[rad.verifiering] || rad.verifiering}
        </span>
      </td>
    </tr>
  );
}

// Komprimera källtitel till organisation eller första 3 ord
function kortaKalla(k) {
  if (!k) return '';
  const org = (k.organisation || '').split(/[,(/]/)[0].trim();
  if (org && org.length <= 38) return org;
  const ord = (k.titel || '').split(/\s+/).slice(0, 3).join(' ');
  return ord || k.titel || k.id;
}

const nyckeltalCss = `
.nt-hero {
  background: linear-gradient(135deg, #1A2744 0%, #2C3E62 60%, #1A2744 100%);
  color: #fff;
  padding: 5rem 2rem 4rem;
  text-align: center;
}
.nt-hero-inner { max-width: 760px; margin: 0 auto; }
.nt-hero h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.2rem, 4.5vw, 3.4rem);
  font-weight: 600; line-height: 1.12;
  color: #fff; margin: 0.5rem 0 1.2rem;
}
.nt-hero-ingress {
  max-width: 60ch; margin: 0 auto;
  color: rgba(255,255,255,0.82);
  font-size: 1.05rem; line-height: 1.65;
}
.nt-meta {
  display: inline-block; margin-top: 1.4rem;
  color: var(--gold-light);
  font-size: 0.78rem; letter-spacing: 0.16em;
  text-transform: uppercase; font-weight: 500;
}

.nt-controls {
  background: var(--white);
  border-bottom: 1px solid var(--border);
  padding: 1.4rem 2rem 1.2rem;
  position: sticky;
  top: 44px;
  z-index: 50;
}
.nt-control-rad {
  display: flex; gap: 0.7rem;
  align-items: center; flex-wrap: wrap;
  margin-bottom: 0.7rem;
}
.nt-sok {
  flex: 1 1 300px;
  font-family: 'Jost', sans-serif; font-size: 0.95rem;
  padding: 0.6rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--r);
  background: var(--parchment);
  color: var(--navy);
  min-width: 0;
}
.nt-sok:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(232,201,122,0.25);
  background: #fff;
}
.nt-toggle {
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-family: 'Jost', sans-serif; font-size: 0.85rem;
  color: var(--navy-mid);
  cursor: pointer;
  user-select: none;
  padding: 0.35rem 0.65rem;
  border-radius: var(--r);
  border: 1px solid transparent;
}
.nt-toggle:hover { background: var(--parchment); }
.nt-toggle input { accent-color: var(--gold); margin: 0; cursor: pointer; }

.nt-kategori-rad {
  display: flex; flex-wrap: wrap; gap: 0.45rem;
  margin-bottom: 0.55rem;
}
.nt-chip {
  --chip-farg: var(--border);
  display: inline-flex; align-items: center; gap: 0.45rem;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--muted);
  font-family: 'Jost', sans-serif; font-size: 0.78rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
}
.nt-chip:hover { color: var(--navy); border-color: var(--navy); }
.nt-chip.is-active {
  background: var(--parchment);
  border-color: var(--chip-farg);
  color: var(--navy);
  font-weight: 500;
}
.nt-chip-prick {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--muted);
  flex-shrink: 0;
}
.nt-chip-antal {
  background: rgba(0,0,0,0.06);
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  font-size: 0.68rem;
  color: var(--muted);
  font-weight: 600;
}
.nt-chip.is-active .nt-chip-antal { background: rgba(0,0,0,0.08); color: var(--navy); }
.nt-status {
  font-size: 0.8rem;
  color: var(--muted);
  margin: 0;
}

.nt-lista {
  background: var(--parchment);
  padding: 2.5rem 2rem 4rem;
  min-height: 60vh;
}

.nt-sektion {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--r);
  margin-bottom: 1.6rem;
  overflow: hidden;
}
.nt-sektion-head {
  display: flex; align-items: flex-start; gap: 1rem;
  padding: 1.2rem 1.4rem;
  border-bottom: 2px solid var(--sektion-farg, var(--border));
  background: linear-gradient(to right, var(--white), var(--parchment));
}
.nt-sektion-kort {
  flex-shrink: 0;
  display: inline-block;
  color: #fff;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  font-weight: 600;
  margin-top: 0.2rem;
}
.nt-sektion-head h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--navy);
  margin: 0 0 0.25rem;
  line-height: 1.2;
}
.nt-sektion-ingress {
  font-size: 0.9rem;
  color: var(--navy-mid);
  line-height: 1.55;
  margin: 0;
  max-width: 75ch;
}

.nt-tabell-wrap {
  overflow-x: auto;
}
.nt-tabell {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Jost', sans-serif;
  font-size: 0.92rem;
}
.nt-tabell thead {
  background: var(--parchment);
  border-bottom: 1px solid var(--border);
}
.nt-tabell th {
  text-align: left;
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 0.7rem 1rem;
  vertical-align: top;
}
.nt-th-status { width: 130px; }
.nt-tabell td {
  padding: 0.85rem 1rem;
  vertical-align: top;
  border-bottom: 1px solid #F0EBDD;
  color: var(--navy);
}
.nt-tabell tr:last-child td { border-bottom: none; }
.nt-rad:hover td { background: #FAF7EE; }
.nt-rad.is-tangerande td { background: rgba(156, 163, 175, 0.05); font-style: italic; }
.nt-rad.is-tangerande:hover td { background: rgba(156, 163, 175, 0.1); }

.nt-td-etikett {
  max-width: 320px;
  min-width: 220px;
}
.nt-etikett {
  display: block;
  font-weight: 500;
  color: var(--navy);
  font-style: normal;
}
.nt-tag-tangerande {
  display: inline-block;
  margin-top: 0.2rem;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(156, 163, 175, 0.18);
  color: #6B7280;
  padding: 0.1rem 0.45rem;
  border-radius: 3px;
  font-style: normal;
  font-weight: 600;
}
.nt-not {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.78rem;
  color: var(--muted);
  font-style: italic;
  line-height: 1.45;
  max-width: 55ch;
}

.nt-td-varde {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--navy);
  white-space: nowrap;
}
.nt-td-varde strong { font-weight: 600; }

.nt-td-datum {
  font-size: 0.82rem;
  color: var(--muted);
  white-space: nowrap;
}

.nt-td-kalla {
  font-size: 0.82rem;
}
.nt-kallor {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.nt-kallor a {
  color: var(--gold);
  text-decoration: none;
  border-bottom: 1px dotted rgba(181, 130, 42, 0.4);
}
.nt-kallor a:hover {
  border-bottom-style: solid;
  color: var(--navy);
}
.nt-saknas { color: var(--muted); }

.nt-td-status {
  white-space: nowrap;
  font-size: 0.78rem;
}
.nt-status-dot {
  display: inline-block;
  width: 9px; height: 9px;
  border-radius: 50%;
  margin-right: 0.4rem;
  vertical-align: middle;
}
.nt-status-text {
  color: var(--navy-mid);
  vertical-align: middle;
}

.nt-tom {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--muted);
}

@media (max-width: 820px) {
  .nt-controls { top: 44px; padding: 1rem 1rem 0.85rem; }
  .nt-lista { padding: 2rem 1rem 3rem; }
  .nt-sektion-head { padding: 1rem 1.2rem; gap: 0.7rem; }
  .nt-sektion-head h2 { font-size: 1.3rem; }
  .nt-td-etikett { max-width: 220px; }
}
@media (max-width: 600px) {
  .nt-hero { padding: 3.5rem 1rem 3rem; }
  .nt-tabell { font-size: 0.86rem; }
  .nt-tabell th, .nt-tabell td { padding: 0.65rem 0.7rem; }
  .nt-td-varde { font-size: 1rem; }
}
`;
