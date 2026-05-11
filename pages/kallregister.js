import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import { useMemo, useState } from 'react';

export async function getStaticProps() {
  const root = process.cwd();
  const sharedRaw = fs.readFileSync(path.join(root, 'lokalforsorjning.html'), 'utf-8');
  const styleMatch = sharedRaw.match(/<style>([\s\S]*?)<\/style>/);
  const sharedCss = styleMatch ? styleMatch[1] : '';

  const json = JSON.parse(
    fs.readFileSync(path.join(root, 'data/kallregister.json'), 'utf-8')
  );

  return { props: { sharedCss, ...json } };
}

const TYP_LABELS = {
  rapport: 'Rapport',
  slutrapport: 'Slutrapport',
  branschindex: 'Branschindex',
  vagledning: 'Vägledning',
  'kommunal-plan': 'Kommunal plan',
  lagstiftning: 'Lagstiftning',
  statistik: 'Statistik',
  forskning: 'Forskning',
  branschorganisation: 'Branschorgan',
  finansiering: 'Finansiering',
  samhallsfastighetsbolag: 'Samhällsfastighetsbolag',
};

export default function Kallregister({ sharedCss, uppdaterad, omraden, kallor }) {
  const [sok, setSok] = useState('');
  // Områden med dolt_default: true (t.ex. "tangerande-bostad") är avbockade
  // från start så att standardvyn visar enbart samhällsfastigheter.
  const [valdaOmraden, setValdaOmraden] = useState(
    () => new Set(omraden.filter(o => !o.dolt_default).map(o => o.id))
  );
  const [sortering, setSortering] = useState('datum-ny');

  const omradeMap = useMemo(() => Object.fromEntries(omraden.map(o => [o.id, o])), [omraden]);

  const filtrerade = useMemo(() => {
    const sokLower = sok.trim().toLowerCase();
    let lista = kallor.filter(k => valdaOmraden.has(k.omrade));
    if (sokLower) {
      lista = lista.filter(k =>
        (k.titel || '').toLowerCase().includes(sokLower) ||
        (k.organisation || '').toLowerCase().includes(sokLower) ||
        (k.sammandrag || '').toLowerCase().includes(sokLower)
      );
    }
    const cmp = {
      'datum-ny':  (a, b) => (b.datum || '').localeCompare(a.datum || ''),
      'titel-az':  (a, b) => (a.titel || '').localeCompare(b.titel || '', 'sv'),
      'organisation-az': (a, b) => (a.organisation || '').localeCompare(b.organisation || '', 'sv'),
    };
    return [...lista].sort(cmp[sortering] || cmp['datum-ny']);
  }, [kallor, sok, valdaOmraden, sortering]);

  const toggleOmrade = (id) => {
    setValdaOmraden(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Aldrig tom — fall tillbaka till standardurvalet (utan dolt_default-områden)
      if (next.size === 0) return new Set(omraden.filter(o => !o.dolt_default).map(o => o.id));
      return next;
    });
  };

  const totalt = kallor.length;
  const synliga = filtrerade.length;

  return (
    <>
      <Head>
        <title>Källregister — Lokalförsörjning</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Källregister över rapporter, branschindex och kommunala planer som ligger till grund för Lejonfastigheters lokalförsörjningsmaterial." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: sharedCss }} />
        <style dangerouslySetInnerHTML={{ __html: kallregisterCss }} />
      </Head>

      <Nav active="kallor" omraden={omraden} />

      <section className="kr-hero">
        <div className="kr-hero-inner">
          <p className="hero-eyebrow">Källregister</p>
          <h1>Vad vi vet — och varifrån vi vet det</h1>
          <p className="kr-hero-ingress">
            Sammanställning av rapporter, branschindex, kommunala planer och vägledningar som ligger till grund för
            Lejonfastigheters lokalförsörjningsmaterial. Alla källor är offentliga och länkbara.
          </p>
          <span className="kr-meta">
            {totalt} källor · {omraden.length} områden · uppdaterat {uppdaterad}
          </span>
        </div>
      </section>

      <section className="kr-controls" aria-label="Filtrera och sök">
        <div className="container">
          <div className="kr-control-rad">
            <input
              type="search"
              placeholder="Sök i titel, organisation eller sammanfattning…"
              className="kr-sok"
              value={sok}
              onChange={(e) => setSok(e.target.value)}
              aria-label="Sök bland källorna"
            />
            <div className="kr-sortering">
              <label>
                Sortera
                <select value={sortering} onChange={(e) => setSortering(e.target.value)}>
                  <option value="datum-ny">Senast först</option>
                  <option value="titel-az">Titel (A–Ö)</option>
                  <option value="organisation-az">Organisation (A–Ö)</option>
                </select>
              </label>
            </div>
          </div>

          <div className="kr-omrade-rad" role="group" aria-label="Filtrera områden">
            {omraden.map(o => {
              const aktiv = valdaOmraden.has(o.id);
              const antal = kallor.filter(k => k.omrade === o.id).length;
              return (
                <button
                  key={o.id}
                  type="button"
                  className={`kr-chip${aktiv ? ' is-active' : ''}`}
                  onClick={() => toggleOmrade(o.id)}
                  style={aktiv ? { '--chip-farg': o.farg } : undefined}
                  aria-pressed={aktiv}
                >
                  <span className="kr-chip-prick" aria-hidden="true" style={{ background: o.farg }} />
                  {o.namn}
                  <span className="kr-chip-antal">{antal}</span>
                </button>
              );
            })}
          </div>

          <p className="kr-status">
            Visar {synliga} av {totalt} källor
            {sok ? <> · sökord: <strong>{sok}</strong></> : null}
          </p>
        </div>
      </section>

      <section className="kr-lista">
        <div className="container">
          {synliga === 0 ? (
            <div className="kr-tom">
              <p>Inga källor matchar dina filter. Justera sökord eller välj fler områden.</p>
            </div>
          ) : (
            <ul className="kr-grid">
              {filtrerade.map(k => (
                <KallaKort key={k.id} k={k} omrade={omradeMap[k.omrade]} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <footer>
        <strong>Lejonfastigheter AB</strong> · Lokalförsörjningsguide · Källregister · Internt arbetsmaterial
      </footer>
    </>
  );
}

function KallaKort({ k, omrade }) {
  return (
    <li className="kr-kort">
      <div className="kr-kort-topp">
        <span className="kr-kort-omrade" style={{ background: omrade?.farg }}>
          {omrade?.namn || k.omrade}
        </span>
        {k.typ ? <span className="kr-kort-typ">{TYP_LABELS[k.typ] || k.typ}</span> : null}
        <span className="kr-kort-datum">{k.datum || 'okänt'}</span>
      </div>
      <h3 className="kr-kort-titel">{k.titel}</h3>
      <p className="kr-kort-org">{k.organisation}</p>
      <p className="kr-kort-sammandrag">{k.sammandrag}</p>
      {k.url ? (
        <a className="kr-kort-lank" href={k.url} target="_blank" rel="noopener noreferrer">
          Öppna källa <span aria-hidden="true">↗</span>
        </a>
      ) : null}
    </li>
  );
}

function Nav({ omraden }) {
  return (
    <nav className="site-nav" data-active-group="kallor" data-page="kallregister">
      <div className="nav-row nav-row-primary">
        <a href="/" className="nav-brand">Lejonfastigheter <span>Lokalförsörjning</span></a>
        <ul className="nav-toptabs">
          <li><a href="/#sammanfattning" className="nav-toptab is-external" data-group="oversikt">Översikt</a></li>
          <li><a href="/#hierarki" className="nav-toptab is-external" data-group="behov">Behov &amp; kund</a></li>
          <li><a href="/detaljplan" className="nav-toptab is-external" data-group="process">Process</a></li>
          <li><a href="/#kontext" className="nav-toptab is-external" data-group="tid">Tid &amp; pengar</a></li>
          <li><a href="/kallregister" className="nav-toptab" data-group="kallor">Källor</a></li>
        </ul>
      </div>
      <div className="nav-row nav-row-sub">
        <ul className="nav-subtabs" data-group="kallor">
          <li><a href="/#kallor" className="nav-subtab is-external">Källor — kortöversikt</a></li>
          <li><a href="/kallregister" className="nav-subtab is-active">Källregister</a></li>
          <li><a href="/#verifiering" className="nav-subtab is-external">Verifieringsstatus</a></li>
        </ul>
      </div>
    </nav>
  );
}

const kallregisterCss = `
.kr-hero {
  background: linear-gradient(135deg, #1A2744 0%, #2C3E62 60%, #1A2744 100%);
  color: #fff;
  padding: 5rem 2rem 4rem;
  text-align: center;
}
.kr-hero-inner { max-width: 760px; margin: 0 auto; }
.kr-hero h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.2rem, 4.5vw, 3.4rem);
  font-weight: 600; line-height: 1.12;
  color: #fff; margin: 0.5rem 0 1.2rem;
}
.kr-hero-ingress {
  max-width: 60ch; margin: 0 auto;
  color: rgba(255,255,255,0.82);
  font-size: 1.05rem; line-height: 1.65;
}
.kr-meta {
  display: inline-block; margin-top: 1.4rem;
  color: var(--gold-light);
  font-size: 0.78rem; letter-spacing: 0.16em;
  text-transform: uppercase; font-weight: 500;
}

.kr-controls {
  background: var(--white);
  border-bottom: 1px solid var(--border);
  padding: 1.6rem 2rem 1.4rem;
  position: sticky;
  top: 92px;
  z-index: 50;
}
.kr-control-rad {
  display: flex; gap: 0.8rem;
  align-items: center; flex-wrap: wrap;
  margin-bottom: 0.9rem;
}
.kr-sok {
  flex: 1 1 320px;
  font-family: 'Jost', sans-serif; font-size: 0.95rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--r);
  background: var(--parchment);
  color: var(--navy);
  min-width: 0;
}
.kr-sok:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(232,201,122,0.25);
  background: #fff;
}
.kr-sortering label {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-size: 0.78rem; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--gold);
  font-weight: 600;
}
.kr-sortering select {
  font-family: 'Jost', sans-serif; font-size: 0.88rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--border); border-radius: var(--r);
  background: var(--white);
  color: var(--navy); cursor: pointer;
}
.kr-omrade-rad {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
  margin-bottom: 0.7rem;
}
.kr-chip {
  --chip-farg: var(--border);
  display: inline-flex; align-items: center; gap: 0.5rem;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--muted);
  font-family: 'Jost', sans-serif; font-size: 0.82rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
}
.kr-chip:hover { color: var(--navy); border-color: var(--navy); }
.kr-chip.is-active {
  background: var(--parchment);
  border-color: var(--chip-farg);
  color: var(--navy);
  font-weight: 500;
}
.kr-chip-prick {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--muted);
  flex-shrink: 0;
}
.kr-chip-antal {
  background: rgba(0,0,0,0.06);
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  color: var(--muted);
  font-weight: 600;
}
.kr-chip.is-active .kr-chip-antal { background: rgba(0,0,0,0.08); color: var(--navy); }
.kr-status {
  font-size: 0.82rem;
  color: var(--muted);
  margin: 0;
}

.kr-lista {
  background: var(--parchment);
  padding: 2.5rem 2rem 4rem;
  min-height: 60vh;
}
.kr-grid {
  list-style: none; padding: 0; margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.2rem;
}
.kr-kort {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 1.3rem 1.4rem;
  display: flex; flex-direction: column; gap: 0.65rem;
  transition: border-color .15s, transform .15s, box-shadow .15s;
}
.kr-kort:hover {
  border-color: var(--gold);
  box-shadow: 0 6px 20px rgba(26,39,68,0.08);
  transform: translateY(-2px);
}
.kr-kort-topp {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.7rem; letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
}
.kr-kort-omrade {
  color: #fff;
  padding: 0.18rem 0.55rem;
  border-radius: 4px;
}
.kr-kort-typ {
  color: var(--gold);
  border: 1px solid rgba(181,130,42,0.35);
  padding: 0.18rem 0.55rem;
  border-radius: 4px;
}
.kr-kort-datum { color: var(--muted); margin-left: auto; }
.kr-kort-titel {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.18rem;
  font-weight: 600;
  color: var(--navy);
  line-height: 1.25;
  margin: 0;
}
.kr-kort-org {
  font-size: 0.84rem;
  color: var(--gold);
  font-weight: 500;
  letter-spacing: 0.02em;
  margin: 0;
  text-transform: none;
}
.kr-kort-sammandrag {
  font-size: 0.92rem;
  color: var(--navy-mid);
  line-height: 1.55;
  margin: 0;
  flex-grow: 1;
}
.kr-kort-lank {
  align-self: flex-start;
  font-family: 'Jost', sans-serif;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--gold);
  letter-spacing: 0.04em;
  border-bottom: 1px solid transparent;
  margin-top: 0.3rem;
}
.kr-kort-lank:hover {
  text-decoration: none;
  border-bottom-color: var(--gold);
}
.kr-tom {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--muted);
}

@media (max-width: 820px) {
  .kr-controls { top: 56px; padding: 1rem 1rem 0.9rem; }
  .kr-control-rad { gap: 0.6rem; }
  .kr-sortering label { font-size: 0.7rem; }
  .kr-lista { padding: 2rem 1rem 3rem; }
  .kr-grid { grid-template-columns: 1fr; gap: 0.9rem; }
}
@media (max-width: 480px) {
  .kr-hero { padding: 3.5rem 1rem 3rem; }
}
`;
