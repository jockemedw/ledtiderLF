import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import { useState } from 'react';
import MinimalNav from '../components/MinimalNav.jsx';
import { formatSv, avvikelseStil } from '../lib/kolada.js';

export async function getStaticProps() {
  const root = process.cwd();
  const sharedRaw = fs.readFileSync(path.join(root, 'lokalforsorjning.html'), 'utf-8');
  const styleMatch = sharedRaw.match(/<style>([\s\S]*?)<\/style>/);
  const sharedCss = styleMatch ? styleMatch[1] : '';

  const kolada = JSON.parse(fs.readFileSync(path.join(root, 'data/kolada.json'), 'utf-8'));

  return { props: { sharedCss, ...kolada } };
}

const KLASS_ETIKETT = {
  styrmatt: 'Styrmått',
  kostnadsmatt: 'Kostnadsmått',
  kontextmatt: 'Kontextmått',
};

const KLASS_FARG = {
  styrmatt: '#1A2744',
  kostnadsmatt: '#B5822A',
  kontextmatt: '#6B7280',
};

const RIKTNING_TEXT = {
  lagre_battre: 'lägre är bättre',
  hogre_battre: 'högre är bättre',
  ingen: '',
};

// De tre referenserna visas likvärdigt. Ordningen här är den enda ordning som
// finns — ingen av dem är primär, ingen framhävs typografiskt.
const REFERENSORDNING = ['liknande', 'storre-stad', 'riket'];

export default function Linkoping({
  sharedCss,
  meta,
  entiteter,
  referensgrupper,
  grupper,
  katalog,
  varden,
  bearbetat,
  enhetsdata,
}) {
  const [visaOvriga, setVisaOvriga] = useState(false);
  const referensNamn = Object.fromEntries(referensgrupper.map(r => [r.id, r.namn]));

  return (
    <>
      <Head>
        <title>Kolada — Linköping mot jämförbara kommuner</title>
        <meta
          name="description"
          content="Linköpings ledtider, investeringar, lokalkostnader, bestånd och demografi jämförda med liknande kommuner, Större stad och riket. Kommunstatistik ur Kolada."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: sharedCss }} />
        <style dangerouslySetInnerHTML={{ __html: linkopingCss }} />
      </Head>

      <MinimalNav title="Kolada-statistik" />

      <section className="lk-hero">
        <div className="lk-hero-inner">
          <span className="section-label">Kommunstatistik</span>
          <h1>Linköping mot jämförbara kommuner</h1>
          <p className="lk-hero-ingress">
            Ren kommunstatistik ur Kolada, ordnad efter guidens ämnen: ledtider, investeringar,
            lokalkostnader, bestånd, energi, demografi och volym. Varje mått visar Linköping mot tre
            likvärdiga referenser, medianen över landets kommuner och Linköpings percentil. Samma
            mått som alla andra kommuner rapporterar. Ursprungskällan skiljer sig åt mellan måtten —
            SCB, Räkenskapssammandraget, Skolverket, SKR och kommunernas egen rapportering — och
            anges därför på varje rad, hämtad ur Koladas egen beskrivning.
          </p>
          <span className="lk-meta">
            Referensår {meta.senaste_ar} · Hämtat {meta.hamtat}
          </span>
        </div>
      </section>

      <section className="lk-lasanvisning">
        <div className="container">
          <h2>Hur siffrorna ska läsas</h2>
          <p className="lk-brodtext">
            Kolada mäter <strong>kommunen</strong>, inte Lejonfastigheter. Lokalkostnaden per elev är
            kommunens bokförda kostnad — i praktiken hyresnotan sedd från verksamhetens sida.
            Planledtiden är plan- och byggförvaltningens, inte fastighetsbolagets. Måtten säger något
            om lokalförsörjningen i Linköping som helhet, inte om ett enskilt bolags prestation.
          </p>

          <div className="lk-klasser">
            <div className="lk-klass">
              <span className="lk-klass-badge" style={{ background: KLASS_FARG.styrmatt }}>
                Styrmått
              </span>
              <p>
                Riktningen är entydig — kortare handläggning är bättre än längre. Här kan avvikelsen
                läsas som ett utfall, och avvikelser mot referenserna färgas.
              </p>
            </div>
            <div className="lk-klass">
              <span className="lk-klass-badge" style={{ background: KLASS_FARG.kostnadsmatt }}>
                Kostnadsmått
              </span>
              <p>
                Riktningen är tvetydig. En hög lokalkostnad per elev kan spegla hög nyproduktionsandel,
                högre standard eller en internhyresmodell som bär mer än lokalkostnad — lika gärna som
                ineffektivt lokalutnyttjande. Avvikelsen redovisas men färgas aldrig.
              </p>
            </div>
            <div className="lk-klass">
              <span className="lk-klass-badge" style={{ background: KLASS_FARG.kontextmatt }}>
                Kontextmått
              </span>
              <p>
                Beskriver förutsättningar — befolkning, volymer, framskrivningar. Ingen riktning, ingen
                värdering, bara jämförelsetal.
              </p>
            </div>
          </div>

          <p className="lk-brodtext">
            Två av avsnitten kräver särskild läsning. I <strong>Investeringar och bestånd</strong>
            redovisas kommunen och kommunkoncernen intill varandra: koncernen omfattar de kommunala
            bolagen, alltså även Lejonfastigheter. Att kommunen investerar lite i skollokaler betyder
            därför inte att lite investeras — det betyder att investeringen ligger i bolaget. I
            <strong> Energi och media</strong> avser samtliga tal en standardiserad typfastighet,
            ett flerbostadshus, eftersom Kolada inte har kr per kvadratmeter för verksamhetslokaler.
          </p>

          <div className="lk-referenser">
            <h3>De tre referenserna</h3>
            <p className="lk-brodtext">
              Ingen av dem är huvudreferens. De mäter olika saker och ska läsas tillsammans.
            </p>
            <dl>
              {referensgrupper.map(r => (
                <div key={r.id}>
                  <dt>{r.namn}</dt>
                  <dd>{r.not}</dd>
                </div>
              ))}
            </dl>
            <p className="lk-brodtext lk-fin">
              Grupperna är ovägda medelvärden medan Koladas riksvärde oftast är vägt. Att ställa dem
              sida vid sida är vägledande, inte exakt. Där Kolada saknar riksvärde — vilket gäller
              flera av planmåtten — står ett tankstreck, och medianen över samtliga kommuner redovisas
              i stället som en egen kolumn. Den är vår egen beräkning, inte Koladas.
            </p>
          </div>

          <button
            type="button"
            className={`lk-toggle${visaOvriga ? ' is-active' : ''}`}
            onClick={() => setVisaOvriga(v => !v)}
            aria-pressed={visaOvriga}
          >
            {visaOvriga ? 'Dölj' : 'Visa'} fler referenser (kommuner 100–200 tusen invånare, Östergötlands län)
          </button>
        </div>
      </section>

      <section className="lk-lista">
        <div className="container">
          {grupper.map(g => {
            const matt = katalog.filter(m => m.grupp === g.id && varden[m.id]);
            if (!matt.length) return null;
            return (
              <GruppSektion
                key={g.id}
                grupp={g}
                matt={matt}
                varden={varden}
                bearbetat={bearbetat}
                entiteter={entiteter}
                referensNamn={referensNamn}
                visaOvriga={visaOvriga}
                hamtat={meta.hamtat}
              />
            );
          })}

          <Anlaggningar enhetsdata={enhetsdata} katalog={katalog} hamtat={meta.hamtat} />
        </div>
      </section>

      <footer>
        <strong>Lejonfastigheter AB</strong> · Lokalförsörjningsguide · Kolada-statistik ·
        Internt arbetsmaterial
      </footer>
    </>
  );
}

function GruppSektion({
  grupp,
  matt,
  varden,
  bearbetat,
  entiteter,
  referensNamn,
  visaOvriga,
  hamtat,
}) {
  const ovrigaIdn = visaOvriga ? Object.keys(varden[matt[0].id].ovriga) : [];
  const harBearbetning = matt.some(m => bearbetat[m.id] && bearbetat[m.id].percentil !== null);

  return (
    <section className="lk-sektion" id={grupp.id}>
      <header className="lk-sektion-head">
        <h2>{grupp.namn}</h2>
        <p className="lk-sektion-ingress">{grupp.ingress}</p>
      </header>

      <div className="lk-tabell-wrap">
        <table className="lk-tabell">
          <thead>
            <tr>
              <th scope="col" className="lk-th-matt">
                Nyckeltal
              </th>
              <th scope="col" className="lk-th-subjekt">
                {entiteter[varden[matt[0].id].subjekt].namn}
              </th>
              {REFERENSORDNING.map(r => (
                <th scope="col" key={r} className="lk-th-ref">
                  {referensNamn[r]}
                </th>
              ))}
              {ovrigaIdn.map(id => (
                <th scope="col" key={id} className="lk-th-ref lk-th-ovrig">
                  {entiteter[id].namn}
                </th>
              ))}
              <th scope="col" className="lk-th-median">
                Kommunmedian
              </th>
              <th scope="col" className="lk-th-percentil">
                Percentil
              </th>
            </tr>
          </thead>
          <tbody>
            {matt.map(m => (
              <MattRad
                key={m.id}
                matt={m}
                varden={varden[m.id]}
                bearbetat={bearbetat[m.id]}
                ovrigaIdn={ovrigaIdn}
              />
            ))}
          </tbody>
        </table>
      </div>

      <KallaFot matt={matt} hamtat={hamtat} harBearbetning={harBearbetning} />

      {grupp.id === 'planprocess' ? (
        <TrendTabell
          matt={matt.filter(m => m.id === 'N07926' || m.id === 'N07927')}
          varden={varden}
          entiteter={entiteter}
          referensNamn={referensNamn}
        />
      ) : null}
    </section>
  );
}

/**
 * Planledtiderna är det enda område där Kolada mäter samma sak som guidens
 * ledtidsargument. Utvecklingen över tid säger mer än ett enskilt år.
 */
function TrendTabell({ matt, varden, entiteter, referensNamn }) {
  if (!matt.length) return null;
  const ar = [
    ...new Set(
      matt.flatMap(m => [
        ...Object.keys(varden[m.id].serie),
        ...Object.values(varden[m.id].referensserier || {}).flatMap(s => Object.keys(s)),
      ]),
    ),
  ]
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="lk-trend">
      <h3>Utveckling över tid</h3>
      <p className="lk-brodtext lk-fin">
        Mediantid i månader. Skillnaden mellan de två raderna är den tid som ligger före samråd —
        alltså i utrednings- och programskedet, innan planen blir synlig utåt.
      </p>
      <div className="lk-tabell-wrap">
        <table className="lk-tabell lk-tabell-trend">
          <thead>
            <tr>
              <th scope="col">Mått och entitet</th>
              {ar.map(a => (
                <th scope="col" key={a} className="lk-th-ar">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matt.map(m => {
              const v = varden[m.id];
              const serier = v.referensserier || {};
              const rader = [
                { serie: v.serie, namn: entiteter[v.subjekt].namn, egen: true },
                { serie: serier[m.liknande], namn: referensNamn.liknande, egen: false },
                { serie: serier['G92790'], namn: referensNamn['storre-stad'], egen: false },
              ].filter(r => r.serie);
              return rader.map(rad => (
                <tr key={`${m.id}-${rad.namn}`} className="lk-rad">
                  <th scope="row" className="lk-td-matt">
                    <span className="lk-matt-namn">{rad.namn}</span>
                    <span className="lk-matt-enhet">{m.kort}</span>
                  </th>
                  {ar.map(a => {
                    const x = rad.serie[a];
                    return (
                      <td key={a} className={rad.egen ? 'lk-td-subjekt' : 'lk-td-ref'}>
                        <span className="lk-varde-ref">
                          {x === undefined || x === null ? '–' : formatSv(x, 1)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MattRad({ matt, varden, bearbetat, ovrigaIdn }) {
  const d = matt.decimaler;
  const fd = bearbetat && bearbetat.fordelning;
  const percentil = bearbetat ? bearbetat.percentil : null;
  const riktning = RIKTNING_TEXT[matt.riktning];

  return (
    <tr className={matt.tangerande ? 'lk-rad is-tangerande' : 'lk-rad'}>
      <th scope="row" className="lk-td-matt">
        <span className="lk-matt-namn">{matt.kort}</span>
        <span className="lk-matt-enhet">
          {matt.enhet}
          {riktning ? ` · ${riktning}` : ''}
        </span>
        <span className="lk-matt-taggar">
          <span className="lk-klass-tagg" style={{ background: KLASS_FARG[matt.klass] }}>
            {KLASS_ETIKETT[matt.klass]}
          </span>
          {matt.tangerande ? (
            <span
              className="lk-tangerande-tagg"
              title="Koladas egen beskrivning av måttet räknar bostäder — bostadsvolymer, bygglov för en- och tvåbostadshus eller en typfastighet i form av flerbostadshus — inte samhällsfastigheter"
            >
              Bostäder
            </span>
          ) : null}
          <span className="lk-kpi-id" title={matt.kolada_beskrivning || matt.kolada_titel || ''}>
            {matt.id}
          </span>
          {matt.kolada_kalla ? (
            <span className="lk-kpi-kalla" title="Koladas egen källangivelse för det här nyckeltalet">
              {matt.kolada_kalla}
            </span>
          ) : null}
        </span>
        {matt.not ? <span className="lk-matt-not">{matt.not}</span> : null}
      </th>

      <td className="lk-td-subjekt">
        <span className="lk-varde">{formatSv(varden.varde, d)}</span>
        <span className="lk-ar">{varden.ar}</span>
      </td>

      {REFERENSORDNING.map(r => (
        <ReferensCell
          key={r}
          matt={matt}
          referens={varden.referenser[r]}
          avvikelse={bearbetat ? bearbetat.avvikelse[r] : null}
          decimaler={d}
        />
      ))}

      {ovrigaIdn.map(id => (
        <td key={id} className="lk-td-ref lk-td-ovrig">
          <span className="lk-varde-ref">{formatSv(varden.ovriga[id], d)}</span>
        </td>
      ))}

      <td className="lk-td-median">
        {fd ? (
          <>
            <span className="lk-varde-ref">{formatSv(fd.median, d)}</span>
            <span className="lk-spann">
              p10 {formatSv(fd.p10, d)} · p90 {formatSv(fd.p90, d)}
            </span>
          </>
        ) : (
          <span className="lk-saknas">–</span>
        )}
      </td>

      <td className="lk-td-percentil">
        {percentil === null ? (
          <span className="lk-saknas" title="Percentil redovisas inte för absoluta tal, där den bara skulle mäta kommunstorlek">
            –
          </span>
        ) : (
          <>
            <span className="lk-percentil-tal">
              p{percentil} <span className="lk-percentil-n">av {fd.n} kn</span>
            </span>
            <span className="lk-percentil-spar" aria-hidden="true">
              <span className="lk-percentil-fyll" style={{ width: `${percentil}%` }} />
            </span>
          </>
        )}
      </td>
    </tr>
  );
}

function ReferensCell({ matt, referens, avvikelse, decimaler }) {
  if (referens.varde === null) {
    return (
      <td className="lk-td-ref">
        <span className="lk-saknas" title={referens.saknas || ''}>
          –
        </span>
      </td>
    );
  }
  const stil = avvikelseStil(matt, avvikelse);
  return (
    <td className="lk-td-ref">
      <span className="lk-varde-ref">{formatSv(referens.varde, decimaler)}</span>
      <span className={`lk-avvikelse is-${stil.ton}`}>{stil.text}</span>
    </td>
  );
}

/**
 * Koladas villkor: råa värden får anges med "Källa: Kolada", egna bearbetningar
 * får det inte. Därför två separata meningar, aldrig en gemensam.
 */
function KallaFot({ matt, hamtat, harBearbetning }) {
  // Ursprungskällan varierar per mått — planprocessavsnittet har fyra olika —
  // så den anges på varje rad, aldrig som ett gemensamt påstående här.
  const ursprung = [...new Set(matt.map(m => m.kolada_kalla).filter(Boolean))];
  return (
    <p className="lk-kalla">
      Källa: Kolada — nyckeltal {matt.map(m => m.id).join(', ')}. Hämtat {hamtat}.{' '}
      <a href="/kallregister#kolada-planledtider">Källkort</a>
      {ursprung.length ? (
        <>
          <br />
          Uppgifterna kommer ursprungligen från {ursprung.join('; ')} — se respektive rad.
        </>
      ) : null}
      {harBearbetning ? (
        <>
          <br />
          Percentil, kommunmedian, spann och avvikelse är egen bearbetning av data från Kolada och får
          inte tillskrivas Kolada.
        </>
      ) : null}
    </p>
  );
}

function Anlaggningar({ enhetsdata, katalog, hamtat }) {
  const enheter = Object.entries(enhetsdata);
  if (!enheter.length) return null;
  const kpiIdn = ['U60800', 'U60045', 'U60009', 'U60495'];
  const matt = kpiIdn.map(id => katalog.find(m => m.id === id)).filter(Boolean);

  return (
    <section className="lk-sektion" id="anlaggningar">
      <header className="lk-sektion-head">
        <h2>Regionens anläggningar</h2>
        <p className="lk-sektion-ingress">
          Enhetsdata per anläggning, det enda offentliga svenska underlaget med den här strukturen.
          Universitetssjukhuset och Lasarettet i Motala ligger i Linköping respektive Östergötland —
          men vårdfastigheter är inte skolor, och en region är inte en kommun. Läs som storleksordning,
          inte som jämförelsetal.
        </p>
      </header>

      <div className="lk-tabell-wrap">
        <table className="lk-tabell">
          <thead>
            <tr>
              <th scope="col" className="lk-th-matt">
                Anläggning
              </th>
              {matt.map(m => (
                <th scope="col" key={m.id} className="lk-th-ref">
                  {m.kort}
                  <span className="lk-th-enhet">{m.enhet}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enheter.map(([id, e]) => {
              const senaste = serie => {
                const ar = Object.keys(serie || {}).map(Number);
                return ar.length ? serie[Math.max(...ar)] : null;
              };
              return (
                <tr key={id} className="lk-rad">
                  <th scope="row" className="lk-td-matt">
                    <span className="lk-matt-namn">{e.namn}</span>
                    <span className="lk-kpi-id">{id}</span>
                  </th>
                  {matt.map(m => (
                    <td key={m.id} className="lk-td-ref">
                      <span className="lk-varde-ref">
                        {formatSv(senaste(e.serier[m.id]), m.decimaler)}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="lk-kalla">
        Källa: Kolada — enhetsdata för nyckeltal {matt.map(m => m.id).join(', ')}. Hämtat {hamtat}.
      </p>
    </section>
  );
}

const linkopingCss = `
.lk-hero {
  background: linear-gradient(135deg, #1A2744 0%, #2C3E62 60%, #1A2744 100%);
  color: #fff;
  padding: 5rem 2rem 4rem;
  text-align: center;
}
.lk-hero-inner { max-width: 780px; margin: 0 auto; }
.lk-hero .section-label { color: var(--gold-light); }
.lk-hero h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.2rem, 4.5vw, 3.4rem);
  font-weight: 600; line-height: 1.12;
  color: #fff; margin: 0.5rem 0 1.2rem;
}
.lk-hero-ingress {
  max-width: 62ch; margin: 0 auto;
  color: rgba(255,255,255,0.82);
  font-size: 1.05rem; line-height: 1.65;
}
.lk-meta {
  display: inline-block; margin-top: 1.4rem;
  color: var(--gold-light);
  font-size: 0.78rem; letter-spacing: 0.16em;
  text-transform: uppercase; font-weight: 500;
}

.lk-lasanvisning {
  background: var(--white);
  border-bottom: 1px solid var(--border);
  padding: 3rem 2rem 2.6rem;
}
.lk-lasanvisning h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.7rem; margin-bottom: 0.9rem;
}
.lk-lasanvisning h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.3rem; margin-bottom: 0.5rem;
}
.lk-brodtext {
  max-width: 74ch; color: var(--navy);
  font-size: 0.95rem; line-height: 1.65;
  margin-bottom: 1.4rem;
}
.lk-fin { font-size: 0.86rem; color: var(--muted); }

.lk-klasser {
  display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin-bottom: 2rem;
}
.lk-klass {
  background: var(--parchment);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 1.1rem 1.2rem;
}
.lk-klass p {
  font-size: 0.87rem; line-height: 1.55;
  color: var(--navy); margin-top: 0.6rem;
}
.lk-klass-badge, .lk-klass-tagg {
  display: inline-block; color: #fff;
  font-size: 0.68rem; letter-spacing: 0.1em;
  text-transform: uppercase; font-weight: 600;
  padding: 0.24rem 0.6rem; border-radius: 3px;
}

.lk-referenser { margin-bottom: 1.6rem; }
.lk-referenser dl { max-width: 74ch; margin-bottom: 1rem; }
.lk-referenser dt {
  font-weight: 600; color: var(--navy);
  font-size: 0.92rem; margin-top: 0.7rem;
}
.lk-referenser dd {
  margin: 0.15rem 0 0; color: var(--muted);
  font-size: 0.87rem; line-height: 1.55;
}

.lk-toggle {
  font-family: 'Jost', sans-serif; font-size: 0.85rem;
  padding: 0.5rem 0.9rem; cursor: pointer;
  background: var(--white); color: var(--navy);
  border: 1px solid var(--border); border-radius: 999px;
}
.lk-toggle.is-active { background: var(--navy); color: #fff; border-color: var(--navy); }

.lk-lista { padding: 3rem 2rem 4rem; }
.lk-sektion { margin-bottom: 3.4rem; }
.lk-sektion-head { margin-bottom: 1.1rem; }
.lk-sektion-head h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.75rem; color: var(--navy);
}
.lk-sektion-ingress {
  max-width: 78ch; margin-top: 0.4rem;
  color: var(--muted); font-size: 0.9rem; line-height: 1.6;
}

.lk-tabell-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--r);
  background: var(--white);
}
.lk-tabell {
  width: 100%; border-collapse: collapse;
  font-size: 0.9rem; min-width: 900px;
}
.lk-tabell th, .lk-tabell td {
  padding: 0.8rem 0.9rem;
  border-bottom: 1px solid var(--border);
  text-align: left; vertical-align: top;
}
.lk-tabell thead th {
  background: var(--parchment);
  font-size: 0.74rem; letter-spacing: 0.08em;
  text-transform: uppercase; font-weight: 600;
  color: var(--navy); white-space: nowrap;
}
/* De tre referenskolumnerna är avsiktligt identiska — ingen är primär. */
.lk-th-ref, .lk-td-ref { width: 12%; text-align: right; }
.lk-th-subjekt, .lk-td-subjekt { width: 11%; text-align: right; background: rgba(181,130,42,0.06); }
.lk-th-median, .lk-td-median { width: 12%; text-align: right; }
.lk-th-percentil, .lk-td-percentil { width: 11%; }
.lk-th-matt { width: 30%; }
.lk-trend { margin-top: 1.8rem; }
.lk-trend h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.3rem; color: var(--navy);
  margin-bottom: 0.35rem;
}
.lk-tabell-trend { min-width: 700px; }
.lk-tabell-trend .lk-th-matt { width: 34%; }
.lk-th-ar { text-align: right; }
.lk-th-enhet {
  display: block; font-size: 0.66rem;
  text-transform: none; letter-spacing: 0;
  font-weight: 400; color: var(--muted);
}

.lk-rad:last-child th, .lk-rad:last-child td { border-bottom: none; }
.lk-rad.is-tangerande { background: rgba(156,163,175,0.06); }

.lk-td-matt { font-weight: 400; }
.lk-matt-namn {
  display: block; font-weight: 500;
  color: var(--navy); line-height: 1.35;
}
.lk-matt-enhet {
  display: block; font-size: 0.76rem;
  color: var(--muted); margin-top: 0.15rem;
}
.lk-matt-taggar {
  display: flex; flex-wrap: wrap; gap: 0.35rem;
  align-items: center; margin-top: 0.4rem;
}
.lk-tangerande-tagg {
  display: inline-block; background: #9CA3AF; color: #fff;
  font-size: 0.68rem; letter-spacing: 0.1em;
  text-transform: uppercase; font-weight: 600;
  padding: 0.24rem 0.6rem; border-radius: 3px;
}
.lk-kpi-id {
  font-size: 0.7rem; color: var(--muted);
  letter-spacing: 0.06em; font-variant-numeric: tabular-nums;
}
.lk-kpi-kalla {
  font-size: 0.7rem; color: var(--muted);
  font-style: italic;
}
.lk-kpi-kalla::before { content: '· '; font-style: normal; }
.lk-matt-not {
  display: block; margin-top: 0.45rem;
  font-size: 0.78rem; line-height: 1.5;
  color: var(--muted); max-width: 52ch;
}

.lk-varde {
  display: block;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.35rem; font-weight: 600;
  color: var(--navy); font-variant-numeric: tabular-nums;
}
.lk-ar { display: block; font-size: 0.7rem; color: var(--muted); }
.lk-varde-ref {
  display: block; font-size: 0.98rem;
  color: var(--navy); font-variant-numeric: tabular-nums;
}
.lk-avvikelse {
  display: block; font-size: 0.76rem;
  margin-top: 0.12rem; font-variant-numeric: tabular-nums;
}
/* Färg endast på styrmått — se avvikelseStil() i lib/kolada.js. */
.lk-avvikelse.is-neutral { color: var(--muted); }
.lk-avvikelse.is-bra { color: #059669; font-weight: 500; }
.lk-avvikelse.is-daligt { color: #C0392B; font-weight: 500; }

.lk-spann {
  display: block; font-size: 0.72rem;
  color: var(--muted); margin-top: 0.12rem;
  font-variant-numeric: tabular-nums;
}
.lk-saknas { color: var(--muted); }

.lk-percentil-tal {
  display: block; font-size: 0.9rem;
  color: var(--navy); font-variant-numeric: tabular-nums;
}
.lk-percentil-n { font-size: 0.72rem; color: var(--muted); }
.lk-percentil-spar {
  display: block; margin-top: 0.3rem;
  height: 4px; border-radius: 2px;
  background: var(--border);
}
.lk-percentil-fyll {
  display: block; height: 100%;
  border-radius: 2px; background: var(--navy-mid);
}

.lk-kalla {
  margin-top: 0.8rem;
  font-size: 0.78rem; line-height: 1.55;
  color: var(--muted); max-width: 90ch;
}
.lk-kalla a { color: var(--navy); }

@media (max-width: 820px) {
  .lk-lista { padding: 2rem 1rem 3rem; }
  .lk-lasanvisning { padding: 2.2rem 1rem 2rem; }
}
@media (max-width: 600px) {
  .lk-hero { padding: 3.5rem 1rem 3rem; }
  .lk-tabell { font-size: 0.84rem; }
  .lk-tabell th, .lk-tabell td { padding: 0.6rem 0.65rem; }
}
`;
