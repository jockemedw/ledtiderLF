import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { KOLLADE_SEKTIONER, byggPanel, tackning } from '../lib/kolada.js';

/**
 * Parallell version av lokalförsörjningsguiden där varje avsnitt är märkt med
 * vad Kolada kan säga om det. Samma text som huvudsidan — inget innehåll är
 * duplicerat, båda sidorna läser lokalforsorjning.html.
 *
 * HTML-hanteringen följer pages/index.js. Panelerna skjuts in som HTML-strängar
 * INUTI varje sektion, direkt efter dess container-div, och hela body renderas
 * i EN div. Det är inte godtyckligt: sidans egen CSS har
 * `.spar-section:nth-of-type(even)` och `.spar-section + .spar-section`, som
 * bryts både av att sektioner packas in i egna wrappers och av att element
 * skjuts in mellan två sektioner.
 */

export async function getStaticProps() {
  const root = process.cwd();
  const raw = fs.readFileSync(path.join(root, 'lokalforsorjning.html'), 'utf-8');
  const kolada = JSON.parse(fs.readFileSync(path.join(root, 'data/kolada.json'), 'utf-8'));

  const styleMatch = raw.match(/<style>([\s\S]*?)<\/style>/);
  const css = styleMatch ? styleMatch[1] : '';

  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let bodyInnehall = bodyMatch ? bodyMatch[1] : '';

  const scriptMatch = bodyInnehall.match(/<script>([\s\S]*?)<\/script>/);
  let scriptInnehall = scriptMatch ? scriptMatch[1] : '';
  bodyInnehall = bodyInnehall.replace(/<script>[\s\S]*?<\/script>/, '');

  scriptInnehall = scriptInnehall.replace(
    /document\.addEventListener\(\s*["']DOMContentLoaded["']\s*,\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;?/,
    '(function initDirect() {\n  if (document.readyState === "loading") {\n    document.addEventListener("DOMContentLoaded", initDirect);\n    return;\n  }\n$1\n})();',
  );

  // Sammanställ-knappen binds av PickMode, som inte monteras här. Utan den
  // vore knappen död, så den tas bort och bannern hänvisar till huvudsidan.
  bodyInnehall = bodyInnehall.replace(/<button[^>]*class="[^"]*sammanstall-toggle[^"]*"[\s\S]*?<\/button>/g, '');

  const saknade = [];
  for (const sektion of KOLLADE_SEKTIONER) {
    // Ankaret är sektionens container-div. Att injicera inuti sektionen i
    // stället för före eller efter den håller alla syskonselektorer intakta.
    const ankare = new RegExp(`(<section id="${sektion.id}"[^>]*>\\s*<div class="(?:container|hero-inner)">)`);
    if (!ankare.test(bodyInnehall)) {
      saknade.push(sektion.id);
      continue;
    }
    bodyInnehall = bodyInnehall.replace(ankare, `$1${byggPanel(sektion, kolada)}`);
  }
  if (saknade.length) {
    throw new Error(`Sektionerna ${saknade.join(', ')} hittades inte i lokalforsorjning.html`);
  }

  return {
    props: {
      css,
      bodyInnehall,
      scriptInnehall,
      meta: kolada.meta,
      tackning: tackning(),
      sektioner: KOLLADE_SEKTIONER.map(s => ({ id: s.id, status: s.status, rubrik: s.rubrik || null })),
    },
  };
}

const SEKTIONSNAMN = {
  intro: 'Ingång',
  sammanfattning: 'På 30 sekunder',
  oversikt: 'De fyra spåren',
  jamforelse: 'Tidsjämförelse',
  'per-typ': 'Per lokaltyp',
  'spar-a': 'Spår A — hyra in',
  'spar-b': 'Spår B — bygga om',
  'spar-c': 'Spår C — tillbyggnad',
  'spar-d': 'Spår D — nybyggnad',
  moduler: 'Modulbyggnader',
  provning: 'Planprocessen',
  kontext: 'Nationell kontext',
  kostnad: 'Tid och pengar',
  beslut: 'Beslutsstöd',
  kallor: 'Källor',
};

export default function KoladaKollad({ css, bodyInnehall, scriptInnehall, meta, tackning: t, sektioner }) {
  const medUnderlag = sektioner.filter(s => s.status !== 'ingen');

  return (
    <>
      <Head>
        <title>Kolada-kollad — Lokalförsörjning</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Nästan identiskt innehåll med huvudsidan — ska inte konkurrera i sök. */}
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="/" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <style dangerouslySetInnerHTML={{ __html: koladaKolladCss }} />
      </Head>

      <div className="kk-banner">
        <div className="kk-banner-inner">
          <div className="kk-banner-topp">
            <span className="kk-banner-flagga">Kolada-kollad</span>
            <p className="kk-banner-ingress">
              Samma guide som huvudsidan, men varje avsnitt är märkt med vad kommunstatistiken i
              Kolada faktiskt kan säga om det — bekräfta, komplettera eller ingenting alls.
              Referensår {meta.senaste_ar}, hämtat {meta.hamtat}.
            </p>
          </div>

          <p className="kk-banner-tackning">
            Av guidens {sektioner.length} avsnitt har <strong>{t.kompletterad}</strong> underlag i
            Kolada, <strong>{t.delvis}</strong> delvis, och <strong>{t.ingen}</strong> saknar
            motsvarighet. Det sista är inte en lucka i kontrollen utan i statistiken: Kolada har inga
            kostnader per kvadratmeter för kommuner, inga investeringskostnader, inga byggtider och
            inga kommunala bolag.
          </p>

          <ul className="kk-banner-lista">
            {medUnderlag.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={`kk-lank kk-lank-${s.status}`}>
                  {SEKTIONSNAMN[s.id] || s.id}
                </a>
              </li>
            ))}
          </ul>

          <p className="kk-banner-not">
            Kolada mäter kommunen, inte Lejonfastigheter: lokalkostnaden är kommunens bokförda
            kostnad och planledtiden är plan- och byggförvaltningens. Talet 44,0 månader ska inte
            förväxlas med Ledtidsindex 46 månader — det senare är ett riksgenomsnitt till laga kraft
            för flerbostadshusplaner, det förra Linköpings mediantid till antagande.
          </p>

          <p className="kk-banner-lankar">
            <Link href="/">← Guiden utan markeringar</Link>
            <Link href="/linkoping">Alla 57 nyckeltal i sin helhet →</Link>
            <span className="kk-banner-avstangt">
              Kommentarer och Sammanställ finns på huvudsidan
            </span>
          </p>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: bodyInnehall }} />

      <Script
        id="lokal-data-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: scriptInnehall }}
      />
    </>
  );
}

const koladaKolladCss = `
.kk-banner {
  background: linear-gradient(135deg, #1A2744 0%, #2C3E62 60%, #1A2744 100%);
  color: #fff;
  padding: 2.4rem 2rem 2rem;
  border-bottom: 3px solid var(--gold);
}
.kk-banner-inner { max-width: 1100px; margin: 0 auto; }
.kk-banner-topp { display: flex; gap: 1.1rem; align-items: flex-start; flex-wrap: wrap; }
.kk-banner-flagga {
  flex: 0 0 auto;
  background: var(--gold);
  color: #1A2744;
  font-size: 0.82rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 0.45rem 1rem;
  border-radius: 3px;
}
.kk-banner-ingress {
  flex: 1 1 420px;
  color: rgba(255,255,255,0.9);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 72ch;
}
.kk-banner-tackning,
.kk-banner-not {
  margin-top: 1rem;
  color: rgba(255,255,255,0.78);
  font-size: 0.9rem;
  line-height: 1.6;
  max-width: 90ch;
}
.kk-banner-not { font-size: 0.84rem; color: rgba(255,255,255,0.66); }
.kk-banner-tackning strong { color: var(--gold-light); }

.kk-banner-lista {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0 0;
  padding: 0;
}
.kk-lank {
  display: inline-block;
  font-size: 0.82rem;
  padding: 0.32rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.28);
  color: #fff;
  text-decoration: none;
}
.kk-lank:hover { background: rgba(255,255,255,0.12); }
.kk-lank-kompletterad { border-color: var(--gold); }

.kk-banner-lankar {
  margin-top: 1.2rem;
  display: flex;
  gap: 1.4rem;
  flex-wrap: wrap;
  align-items: center;
  font-size: 0.88rem;
}
.kk-banner-lankar a { color: var(--gold-light); }
.kk-banner-avstangt { color: rgba(255,255,255,0.5); font-size: 0.8rem; }

/* ── Panelerna som injiceras inuti varje sektion ── */
.kk-panel {
  margin: 1.6rem 0 2rem;
  background: var(--white);
  border: 1px solid var(--border);
  border-left: 3px solid var(--gold);
  border-radius: var(--r);
  padding: 1.4rem 1.6rem;
}
.kk-panel.kk-status-delvis { border-left-color: #9CA3AF; }
.kk-panel-head { display: flex; gap: 0.8rem; align-items: center; flex-wrap: wrap; }
.kk-panel-head h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.3rem;
  color: var(--navy);
  margin: 0;
}
.kk-flagga {
  display: inline-block;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 0.26rem 0.7rem;
  border-radius: 3px;
  background: var(--gold);
  color: #1A2744;
  white-space: nowrap;
}
.kk-flagga-delvis { background: #9CA3AF; color: #fff; }
.kk-flagga-ingen { background: transparent; color: var(--muted); border: 1px dashed var(--border); }

.kk-notis {
  margin: 1.4rem 0 1.8rem;
  padding: 0.9rem 1.1rem;
  border: 1px dashed var(--border);
  border-radius: var(--r);
  background: rgba(0,0,0,0.015);
  display: flex;
  gap: 0.9rem;
  align-items: baseline;
  flex-wrap: wrap;
}
.kk-notis p {
  flex: 1 1 320px;
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--muted);
}

.kk-kommentar {
  margin-top: 0.7rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--navy);
  max-width: 88ch;
}

.kk-tabell-wrap { overflow-x: auto; margin-top: 1rem; }
.kk-tabell { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 780px; }
.kk-tabell th, .kk-tabell td {
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}
.kk-tabell thead th {
  font-size: 0.7rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
}
.kk-tabell tbody tr:last-child th,
.kk-tabell tbody tr:last-child td { border-bottom: none; }
.kk-tabell .num { text-align: right; font-variant-numeric: tabular-nums; }
/* Referenskolumnerna är avsiktligt identiska — ingen av dem är primär. */
.kk-tabell tbody th { font-weight: 500; color: var(--navy); max-width: 24rem; }
.kk-td-lkpg { background: rgba(181,130,42,0.07); font-weight: 600; }

.kk-enhet, .kk-ar, .kk-kpi, .kk-n {
  display: block;
  font-size: 0.72rem;
  color: var(--muted);
  font-weight: 400;
}
.kk-kpi { letter-spacing: 0.05em; }
.kk-klass {
  display: inline-block;
  margin-top: 0.3rem;
  font-size: 0.63rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 0.18rem 0.5rem;
  border-radius: 3px;
  color: #fff;
  background: #6B7280;
}
.kk-klass-styrmatt { background: #1A2744; }
.kk-klass-kostnadsmatt { background: #B5822A; }

.kk-avvikelse { display: block; font-size: 0.74rem; margin-top: 0.1rem; }
/* Färg endast på styrmått — se avvikelseStil() i lib/kolada.js. */
.kk-avvikelse.is-neutral { color: var(--muted); }
.kk-avvikelse.is-bra { color: #059669; font-weight: 500; }
.kk-avvikelse.is-daligt { color: #C0392B; font-weight: 500; }
.kk-saknas { color: var(--muted); }

.kk-kalla {
  margin-top: 0.8rem;
  font-size: 0.76rem;
  line-height: 1.55;
  color: var(--muted);
  max-width: 92ch;
}
.kk-kalla a { color: var(--navy); }

@media (max-width: 700px) {
  .kk-banner { padding: 1.6rem 1rem 1.4rem; }
  .kk-panel { padding: 1.1rem 1rem; }
  .kk-tabell { font-size: 0.82rem; }
  .kk-tabell th, .kk-tabell td { padding: 0.5rem 0.45rem; }
}
`;
