import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { normalize, parse, serialize } from '../lib/section-selection.js';
import MinimalNav from '../components/MinimalNav.jsx';

// Plockar ut <section id="X">...</section> ur lokalforsorjning.html för
// varje sektion-id i `?ids=...` och serverar dem som en egen sida.
// Layout/CSS återanvänds från originalet så typografin blir identisk.

function extractStyle(raw) {
  const m = raw.match(/<style>([\s\S]*?)<\/style>/);
  return m ? m[1] : '';
}

function extractSection(raw, id) {
  // Hittar <section id="X" ...>...</section>. Antar att sektioner inte
  // är nästlade i originalet (vilket de inte är, se lokalforsorjning.html).
  const re = new RegExp(
    `<section[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)</section>`,
    'i'
  );
  const m = raw.match(re);
  if (!m) return null;
  // Returnera HELA sektionen inkl. <section>-tagg så stylingen behålls.
  return m[0];
}

function listSectionIds(raw) {
  const ids = [];
  const re = /<section[^>]*\bid=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

function sectionTitle(html) {
  const m = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, '').trim();
}

export async function getServerSideProps({ query }) {
  const root = process.cwd();
  const raw = fs.readFileSync(path.join(root, 'lokalforsorjning.html'), 'utf-8');
  const css = extractStyle(raw);

  const allIds = listSectionIds(raw);
  const requested = parse('?ids=' + (typeof query.ids === 'string' ? query.ids : ''));
  // Filtrera så att vi bara renderar kända sektion-id:n — annars är det
  // en XSS-risk via godtycklig HTML från frågan.
  const ids = normalize(requested, allIds);

  const sektioner = ids
    .map(id => ({ id, html: extractSection(raw, id) }))
    .filter(s => s.html);

  const okand = requested.filter(id => !ids.includes(id));
  const titlar = sektioner.map(s => ({ id: s.id, titel: sectionTitle(s.html) }));

  return {
    props: {
      css,
      sektionerHtml: sektioner.map(s => s.html).join('\n'),
      antal: sektioner.length,
      okand,
      titlar,
      query: serialize(ids).slice(1),
    },
  };
}

export default function Skraddarsydd({ css, sektionerHtml, antal, okand, titlar, query }) {
  const titel = antal === 0
    ? 'Skräddarsydd sammanställning — inga sektioner valda'
    : `Skräddarsydd sammanställning (${antal} sektion${antal === 1 ? '' : 'er'})`;

  return (
    <>
      <Head>
        <title>{titel} — Lejonfastigheter Lokalförsörjning</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <style dangerouslySetInnerHTML={{ __html: TILLAGGS_CSS }} />
      </Head>

      <MinimalNav title="Skräddarsydd sammanställning" />

      <header className="skr-header">
        <div className="skr-header-inner">
          <h1>Skräddarsydd sammanställning</h1>
          {antal > 0 && (
            <p className="skr-summary">
              {antal} {antal === 1 ? 'sektion' : 'sektioner'} valda:{' '}
              {titlar.map((t, i) => (
                <span key={t.id}>
                  {i > 0 && ' · '}
                  <a href={`#${t.id}`}>{t.titel || t.id}</a>
                </span>
              ))}
            </p>
          )}
          <p className="skr-bak">
            <a href={'/api/pptx' + (query ? '?' + query : '')}>Exportera PPT</a>
          </p>
          {okand.length > 0 && (
            <p className="skr-varning">
              Okända sektion-id ignorerades: {okand.join(', ')}
            </p>
          )}
        </div>
      </header>

      {antal === 0 ? (
        <main className="skr-tom">
          <p>
            Den här sidan visar de sektioner du har valt med Sammanställ-knappen i fullversionen.
            Just nu är inga sektioner valda — eller länken är ofullständig.
          </p>
          <p>
            <Link href="/">Gå till fullversionen</Link> och tryck på <em>Sammanställ</em> uppe till höger.
          </p>
        </main>
      ) : (
        <div
          className="skr-innehall"
          dangerouslySetInnerHTML={{ __html: sektionerHtml }}
        />
      )}

      <footer className="skr-footer">
        <p>
          Denna sammanställning är ett urval ur Lejonfastigheters lokalförsörjningsguide.
          Hela materialet med navigation finns på{' '}
          <Link href="/">lejonfastigheter.se/lokalforsorjning</Link>.
        </p>
      </footer>
    </>
  );
}

const TILLAGGS_CSS = `
/* Skräddarsydd-sidan ärver originalets CSS men ersätter navigationen. */
body { background: var(--parchment, #F4F1EB); }

.skr-header {
  background: var(--navy, #1A2744);
  color: #fff;
  padding: 2.2rem 1rem 1.6rem;
  border-bottom: 4px solid var(--gold, #B5822A);
}
.skr-header-inner {
  max-width: 1100px; margin: 0 auto;
}
.skr-eyebrow {
  margin: 0 0 0.35rem; font-size: 0.72rem; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--gold-light, #E8C97A); font-weight: 600;
}
.skr-header h1 {
  margin: 0 0 0.6rem; font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(1.6rem, 3.4vw, 2.4rem); font-weight: 600; color: #fff;
}
.skr-summary {
  margin: 0 0 0.6rem; font-size: 0.92rem; color: rgba(255,255,255,0.85);
}
.skr-summary a {
  color: var(--gold-light, #E8C97A); text-decoration: none;
  border-bottom: 1px dotted rgba(232, 201, 122, 0.5);
}
.skr-summary a:hover { border-bottom-style: solid; }
.skr-bak {
  margin: 0; font-size: 0.85rem; color: rgba(255,255,255,0.7);
}
.skr-bak a {
  color: var(--gold-light, #E8C97A); text-decoration: none; font-weight: 500;
}
.skr-bak a:hover { text-decoration: underline; }
.skr-varning {
  margin: 0.6rem 0 0; padding: 0.5rem 0.75rem;
  background: rgba(255,180,120,0.12); border-left: 3px solid #E8A765;
  font-size: 0.82rem; color: rgba(255,255,255,0.85);
}

.skr-innehall section {
  max-width: 1100px; margin: 0 auto;
}
/* Säkerställ visning även för sektioner som annars styrs av JS-navigation */
.skr-innehall section { display: block !important; }

.skr-tom {
  max-width: 700px; margin: 4rem auto; padding: 0 1.5rem;
  text-align: center; font-family: 'Jost', system-ui, sans-serif;
  color: var(--navy, #1A2744);
}
.skr-tom a { color: var(--gold, #B5822A); font-weight: 500; }

.skr-footer {
  background: var(--navy, #1A2744); color: rgba(255,255,255,0.7);
  padding: 1.4rem 1rem; margin-top: 3rem; text-align: center;
  font-size: 0.85rem;
}
.skr-footer a { color: var(--gold-light, #E8C97A); }
`;
