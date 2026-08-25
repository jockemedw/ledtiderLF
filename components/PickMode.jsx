import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  parse,
  serialize,
  toggle as toggleId,
  move as moveId,
  normalize,
} from '../lib/section-selection.js';

const TOGGLE_BUTTON_SELECTOR = '.sammanstall-toggle';

export default function PickMode() {
  const [active, setActive] = useState(false);
  const [ids, setIds] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [kopierat, setKopierat] = useState(false);
  const initieratRef = useRef(false);

  // Hämta sektion-katalog från sidans nav-subtabs (en gång)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const groupNames = {
      oversikt: 'Översikt',
      behov: 'Behov & kund',
      process: 'Process',
      tid: 'Tid & pengar',
      kallor: 'Källor',
    };

    const items = [];
    document.querySelectorAll('.nav-subtab[data-section]').forEach(el => {
      const id = el.dataset.section;
      const titel = (el.textContent || '').trim();
      const parent = el.closest('.nav-subtabs');
      const grupp = parent?.dataset?.group || 'ovrig';
      if (!id || !titel) return;
      items.push({ id, titel, grupp, gruppTitel: groupNames[grupp] || grupp });
    });
    setCatalog(items);

    const tillatna = items.map(x => x.id);
    setIds(normalize(parse(window.location.search), tillatna));
    initieratRef.current = true;
  }, []);

  // Knyt headerknappen
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const btn = document.querySelector(TOGGLE_BUTTON_SELECTOR);
    if (!btn) return;
    const handler = () => setActive(a => !a);
    btn.addEventListener('click', handler);
    return () => btn.removeEventListener('click', handler);
  }, []);

  // Synka body-klass + headerknappens aria-pressed
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('pick-mode', active);
    const btn = document.querySelector(TOGGLE_BUTTON_SELECTOR);
    if (btn) btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }, [active]);

  // Skriv tillbaka val till URL (efter initialisering, för att inte
  // skriva över en delad länk innan vi hunnit läsa den).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!initieratRef.current) return;
    const qs = serialize(ids);
    const url = window.location.pathname + qs + window.location.hash;
    window.history.replaceState({}, '', url);
  }, [ids]);

  const tillatna = useMemo(() => catalog.map(x => x.id), [catalog]);
  const titelById = useMemo(() => {
    const m = {};
    for (const item of catalog) m[item.id] = item.titel;
    return m;
  }, [catalog]);

  const valda = useMemo(() => {
    return ids
      .filter(id => tillatna.includes(id))
      .map(id => ({ id, titel: titelById[id] }));
  }, [ids, titelById, tillatna]);

  const grupper = useMemo(() => {
    const out = new Map();
    for (const item of catalog) {
      if (!out.has(item.grupp)) {
        out.set(item.grupp, { id: item.grupp, titel: item.gruppTitel, items: [] });
      }
      out.get(item.grupp).items.push(item);
    }
    return Array.from(out.values());
  }, [catalog]);

  const onToggle = useCallback((id) => {
    setIds(prev => toggleId(prev, id));
  }, []);

  const onMove = useCallback((id, delta) => {
    setIds(prev => moveId(prev, id, delta));
  }, []);

  const onClear = useCallback(() => setIds([]), []);

  const linkUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin + '/skraddarsydd' + serialize(ids);
  }, [ids]);

  const onCopy = useCallback(async () => {
    if (typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setKopierat(true);
      setTimeout(() => setKopierat(false), 1800);
    } catch {
      window.prompt('Kopiera länken:', linkUrl);
    }
  }, [linkUrl]);

  if (!active) return null;

  return (
    <>
      <style>{CSS}</style>
      <aside className="pick-panel" role="dialog" aria-label="Skräddarsydd sammanställning">
        <header className="pick-panel-head">
          <div>
            <p className="pick-eyebrow">Skräddarsydd sammanställning</p>
            <h2>Plocka sektioner</h2>
          </div>
          <button
            type="button"
            className="pick-close"
            aria-label="Stäng"
            onClick={() => setActive(false)}
          >×</button>
        </header>

        <section className="pick-section">
          <h3>I sammanställningen ({valda.length})</h3>
          {valda.length === 0 ? (
            <p className="pick-tom">Ingen sektion vald än. Bocka för nedan.</p>
          ) : (
            <ol className="pick-vald-lista">
              {valda.map((v, i) => (
                <li key={v.id}>
                  <span className="pick-vald-titel">{v.titel}</span>
                  <span className="pick-vald-knappar">
                    <button
                      type="button"
                      aria-label={`Flytta ${v.titel} uppåt`}
                      disabled={i === 0}
                      onClick={() => onMove(v.id, -1)}
                    >↑</button>
                    <button
                      type="button"
                      aria-label={`Flytta ${v.titel} nedåt`}
                      disabled={i === valda.length - 1}
                      onClick={() => onMove(v.id, +1)}
                    >↓</button>
                    <button
                      type="button"
                      aria-label={`Ta bort ${v.titel}`}
                      onClick={() => onToggle(v.id)}
                    >✕</button>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="pick-section pick-katalog">
          <h3>Alla sektioner</h3>
          {grupper.map(g => (
            <div key={g.id} className="pick-grupp">
              <p className="pick-grupp-titel">{g.titel}</p>
              <ul>
                {g.items.map(item => {
                  const isVald = ids.includes(item.id);
                  return (
                    <li key={item.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={isVald}
                          onChange={() => onToggle(item.id)}
                        />
                        <span>{item.titel}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        <footer className="pick-panel-foot">
          <a
            className="pick-cta pick-cta-primar"
            href={'/skraddarsydd' + serialize(ids)}
            aria-disabled={valda.length === 0}
            onClick={e => { if (valda.length === 0) e.preventDefault(); }}
          >Visa skräddarsydd sida →</a>
          <a
            className="pick-cta"
            href={'/api/pptx' + serialize(ids)}
            aria-disabled={valda.length === 0}
            onClick={e => { if (valda.length === 0) e.preventDefault(); }}
          >Exportera PowerPoint</a>
          <div className="pick-cta-row">
            <button
              type="button"
              className="pick-cta pick-cta-sekundar"
              onClick={onCopy}
              disabled={valda.length === 0}
            >{kopierat ? 'Kopierat ✓' : 'Kopiera länk'}</button>
            <button
              type="button"
              className="pick-cta pick-cta-sekundar"
              onClick={onClear}
              disabled={valda.length === 0}
            >Töm</button>
          </div>
          <p className="pick-foot-not">
            Länken du delar bär hela urvalet — ingen inloggning krävs.
            PowerPoint-exporten ger en slide per vald sektion, plus omslag.
          </p>
        </footer>
      </aside>
    </>
  );
}

const CSS = `
.sammanstall-toggle[aria-pressed="true"] {
  background: var(--gold, #B5822A);
  color: var(--white, #fff);
  border-color: var(--gold, #B5822A);
}
body.pick-mode { padding-right: 380px; }
@media (max-width: 900px) {
  body.pick-mode { padding-right: 0; padding-bottom: 60vh; }
}

.pick-panel {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 380px; max-width: 92vw;
  background: #F4F1EB;
  border-left: 1px solid #DDD8CC;
  box-shadow: -8px 0 32px rgba(26, 39, 68, 0.15);
  display: flex; flex-direction: column;
  z-index: 9000;
  font-family: 'Jost', system-ui, sans-serif;
  color: #1A2744;
}
@media (max-width: 900px) {
  .pick-panel { top: auto; height: 60vh; width: 100%; max-width: none; border-left: none; border-top: 1px solid #DDD8CC; }
}

.pick-panel-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; padding: 1.1rem 1.25rem 0.75rem;
  border-bottom: 1px solid #DDD8CC; background: #fff;
}
.pick-panel-head h2 {
  margin: 0.1rem 0 0; font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.45rem; color: #1A2744; font-weight: 600;
}
.pick-eyebrow {
  margin: 0; font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase;
  color: #B5822A; font-weight: 600;
}
.pick-close {
  background: none; border: none; font-size: 1.4rem; cursor: pointer;
  color: #6B7280; line-height: 1; padding: 0.2rem 0.5rem;
}
.pick-close:hover { color: #1A2744; }

.pick-section { padding: 1rem 1.25rem; border-bottom: 1px solid #E7E2D5; }
.pick-section h3 {
  margin: 0 0 0.65rem; font-size: 0.78rem; letter-spacing: 0.14em;
  text-transform: uppercase; color: #1A2744; font-weight: 600;
}
.pick-tom { margin: 0; color: #6B7280; font-style: italic; font-size: 0.9rem; }

.pick-vald-lista { list-style: none; margin: 0; padding: 0; }
.pick-vald-lista li {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.6rem; padding: 0.4rem 0.5rem;
  background: #fff; border: 1px solid #DDD8CC; border-radius: 4px;
  margin-bottom: 0.35rem;
}
.pick-vald-titel { font-size: 0.92rem; flex: 1; min-width: 0; }
.pick-vald-knappar { display: flex; gap: 0.15rem; flex: 0 0 auto; }
.pick-vald-knappar button {
  width: 1.7rem; height: 1.7rem; padding: 0;
  background: transparent; border: 1px solid #DDD8CC; border-radius: 3px;
  color: #1A2744; cursor: pointer; font-size: 0.85rem; line-height: 1;
}
.pick-vald-knappar button:hover:not([disabled]) {
  background: #B5822A; color: #fff; border-color: #B5822A;
}
.pick-vald-knappar button[disabled] { opacity: 0.3; cursor: default; }

.pick-katalog { flex: 1 1 auto; overflow-y: auto; }
.pick-grupp { margin-bottom: 0.9rem; }
.pick-grupp-titel {
  margin: 0 0 0.3rem; font-size: 0.72rem; letter-spacing: 0.12em;
  text-transform: uppercase; color: #B5822A; font-weight: 600;
}
.pick-grupp ul { list-style: none; margin: 0; padding: 0; }
.pick-grupp li label {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.3rem 0.25rem; cursor: pointer; font-size: 0.92rem;
  border-radius: 3px;
}
.pick-grupp li label:hover { background: rgba(181, 130, 42, 0.08); }
.pick-grupp li input { margin: 0; accent-color: #B5822A; cursor: pointer; }

.pick-panel-foot {
  padding: 0.85rem 1.25rem 1.1rem; background: #fff;
  border-top: 1px solid #DDD8CC;
  display: flex; flex-direction: column; gap: 0.45rem;
}
.pick-cta {
  display: block; text-align: center; padding: 0.6rem 0.8rem;
  background: #fff; color: #1A2744; border: 1px solid #1A2744;
  border-radius: 3px; cursor: pointer; font-family: inherit; font-size: 0.9rem;
  text-decoration: none; font-weight: 500;
}
.pick-cta:hover:not([disabled]):not([aria-disabled="true"]) { background: #1A2744; color: #fff; }
.pick-cta-primar { background: #1A2744; color: #fff; }
.pick-cta-primar:hover:not([aria-disabled="true"]) { background: #2C3E62; }
.pick-cta-sekundar { font-size: 0.85rem; padding: 0.45rem 0.7rem; }
.pick-cta[aria-disabled="true"], .pick-cta[disabled] {
  opacity: 0.4; cursor: not-allowed; pointer-events: none;
}
.pick-cta-row { display: flex; gap: 0.45rem; }
.pick-cta-row .pick-cta { flex: 1; }
.pick-foot-not {
  margin: 0.2rem 0 0; font-size: 0.75rem; color: #6B7280;
  font-style: italic; text-align: center;
}
`;
