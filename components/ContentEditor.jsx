import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ContentEditor.module.css';
import { assignAnchorsInDocument, ensureAnchor, readAnchorText } from '../lib/anchor.js';
import { applyDataOverrides, applyTextOverrides, setLeafText } from '../lib/apply-overrides.js';

// Overlay-redigering ovanpå sidan: (a) textinnehåll i befintliga leaf-element
// och (b) tider i tidsjämförelsen (DATA.gantt) och spåren (DATA.spar). Ändringar
// sparas i Vercel Blob via /api/overrides och läggs på för alla besökare i
// runtime — ingen ombyggnad, ingen repo-skrivning. Struktur ändras aldrig.

const EDITABLE_TEXT_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,blockquote';
// Element som renderas ur DATA redigeras via tidspanelen, inte som text —
// annars skrivs de över vid nästa omritning.
const DATA_CONTAINER_SELECTOR =
  '#gantt-rows, #gantt-legend, #gantt-axis, #spar-grid-container, #modul-grid, #tid-guide, #matris-rows, #kallor-grid, #kontext-grid, #typ-grid, [id^="detalj-"], [id^="header-"]';

function cssEsc(s) {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
  return String(s).replace(/["\\]/g, '\\$&');
}

function clone(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

function anchorSelector(a) {
  return document.querySelector(`[data-comment-anchor="${cssEsc(a)}"]`);
}

function isEditableEl(el) {
  if (!el || el.nodeType !== 1) return false;
  if (!el.matches(EDITABLE_TEXT_SELECTOR)) return false;
  if (el.closest('[data-comment-ui]')) return false;
  if (el.closest(DATA_CONTAINER_SELECTOR)) return false;
  if (el.querySelector(EDITABLE_TEXT_SELECTOR)) return false; // bara leaf-element
  if (!readAnchorText(el).trim()) return false;
  return true;
}

// Månader per segment ur en gantt-rad (andel × total, avrundat).
function ganttMonths(rad) {
  return (rad.segment || []).map((s) => ({ fas: s.fas, man: Math.round(s.andel * rad.totalManader) }));
}

function buildForm(D) {
  return {
    gantt: (D.gantt || []).map((rad) => ({
      key: `${rad.label}|${rad.sublabel}`,
      label: rad.label,
      sublabel: rad.sublabel,
      forskede: rad.forskedeMan || 0,
      seg: ganttMonths(rad),
    })),
    spar: (D.spar || []).map((s) => ({
      id: s.id,
      bokstav: s.bokstav,
      namn: s.namn,
      scenarios: (s.scenarios || []).map((sc) => ({
        namn: sc.namn,
        totalText: sc.totalText,
        faser: (sc.faser || []).map((f) => ({ namn: f.namn, tid: f.tid })),
      })),
    })),
  };
}

export default function ContentEditor({ page = 'lokal', dataEditable = false }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pencil, setPencil] = useState(null); // { anchor, top, left, hasOverride }
  const [timeOpen, setTimeOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  const overridesRef = useRef({ text: {}, data: { gantt: {}, spar: {} } });
  const baseRef = useRef(null); // ourörd DATA-snapshot
  const baseFormRef = useRef(null); // grundvärden för avvikelsemarkering
  const baseTextRef = useRef(new Map()); // ankar-id → grundtext
  const isAdminRef = useRef(false);
  const editingRef = useRef(null);
  const editAnchorRef = useRef(null);
  const editOrigRef = useRef('');
  const editCleanupRef = useRef(null);
  const pencilElRef = useRef(null);

  useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);

  // Markera element som har ett text-override (admin) med tunn guldkant.
  const markOverridden = useCallback(() => {
    if (!isAdminRef.current) return;
    const wanted = new Set(Object.keys(overridesRef.current.text || {}));
    document.querySelectorAll('.ledtider-overridden').forEach((el) => {
      const a = el.getAttribute('data-comment-anchor');
      if (!a || !wanted.has(a)) el.classList.remove('ledtider-overridden');
    });
    for (const a of wanted) {
      const el = anchorSelector(a);
      if (el) el.classList.add('ledtider-overridden');
    }
  }, []);

  // Applicera text-overrides (idempotent). Fångar grundtexten innan den skrivs
  // över, för "Återställ".
  const applyTextNow = useCallback(() => {
    const text = overridesRef.current.text || {};
    for (const a of Object.keys(text)) {
      if (baseTextRef.current.has(a)) continue;
      const el = anchorSelector(a);
      if (el) baseTextRef.current.set(a, readAnchorText(el));
    }
    applyTextOverrides(document, text);
    markOverridden();
  }, [markOverridden]);

  // Applicera data-overrides på window.__ledtiderDATA och rita om. Tar en
  // grundsnapshot första gången. Returnerar false tills renderkroken finns.
  const applyLoadedData = useCallback(() => {
    if (!dataEditable) return true;
    const D = typeof window !== 'undefined' ? window.__ledtiderDATA : null;
    if (!D || typeof window.__ledtiderRenderData !== 'function') return false;
    if (!baseRef.current) baseRef.current = clone(D);
    applyDataOverrides(D, overridesRef.current.data || {});
    window.__ledtiderRenderData();
    applyTextNow();
    return true;
  }, [dataEditable, applyTextNow]);

  async function persist() {
    const ov = overridesRef.current;
    try {
      const r = await fetch('/api/overrides', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ page, text: ov.text || {}, data: ov.data || { gantt: {}, spar: {} } }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
    } catch (e) {
      setError(`Kunde inte spara: ${e.message}`);
    }
  }

  // ── Mount: ankare, admin-status, overrides, applicering
  useEffect(() => {
    let cancelled = false;
    assignAnchorsInDocument(document);

    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setIsAdmin(!!(j && j.admin)); })
      .catch(() => {});

    fetch(`/api/overrides?page=${encodeURIComponent(page)}`)
      .then((r) => (r.ok ? r.json() : { text: {}, data: {} }))
      .then((j) => {
        if (cancelled) return;
        overridesRef.current = {
          text: (j && j.text) || {},
          data: (j && j.data) || { gantt: {}, spar: {} },
        };
        applyTextNow();
        if (dataEditable) {
          let tries = 0;
          const iv = setInterval(() => {
            tries += 1;
            if (applyLoadedData() || tries > 50) clearInterval(iv);
          }, 100);
        }
      })
      .catch(() => {});

    // Fördröjda re-appliceringar så att overrides överlever sidans sena
    // rendering (samma idé som kommentarslagret). Idempotent tack vare
    // skillnadskollen i applyTextOverrides.
    const t1 = setTimeout(applyTextNow, 700);
    const t2 = setTimeout(applyTextNow, 1800);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [page, dataEditable, applyTextNow, applyLoadedData]);

  // Re-markera överridda element när admin-status blir känd.
  useEffect(() => {
    if (isAdmin) markOverridden();
  }, [isAdmin, markOverridden]);

  // ── Pennikon vid hover (admin, text)
  useEffect(() => {
    if (!isAdmin) return;
    let hideTimer = null;
    const show = (el) => {
      pencilElRef.current = el;
      const rect = el.getBoundingClientRect();
      const anchor = el.getAttribute('data-comment-anchor');
      setPencil({
        anchor,
        top: rect.top + window.scrollY,
        left: rect.right + window.scrollX + 6,
        hasOverride: anchor ? anchor in (overridesRef.current.text || {}) : false,
      });
    };
    const onMove = (e) => {
      if (editingRef.current) return;
      const t = e.target;
      if (t?.closest?.('[data-comment-ui]')) { clearTimeout(hideTimer); return; }
      const el = t?.closest?.(EDITABLE_TEXT_SELECTOR);
      if (el && isEditableEl(el)) {
        clearTimeout(hideTimer);
        if (el !== pencilElRef.current) show(el);
      } else {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { pencilElRef.current = null; setPencil(null); }, 500);
      }
    };
    document.addEventListener('mousemove', onMove);
    return () => { document.removeEventListener('mousemove', onMove); clearTimeout(hideTimer); };
  }, [isAdmin]);

  function startEdit(anchor) {
    const el = anchorSelector(anchor);
    if (!el) return;
    editingRef.current = el;
    editAnchorRef.current = ensureAnchor(el);
    editOrigRef.current = readAnchorText(el);
    el.classList.add('ledtider-editing');
    el.setAttribute('contenteditable', 'true');
    el.focus();
    try {
      const sel = window.getSelection();
      sel.selectAllChildren(el);
      sel.collapseToEnd();
    } catch { /* strunt */ }
    setPencil(null);
    pencilElRef.current = null;

    const onKey = (ev) => {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); commitEdit(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); cancelEdit(); }
    };
    const onBlur = () => commitEdit();
    el.addEventListener('keydown', onKey);
    el.addEventListener('blur', onBlur);
    editCleanupRef.current = () => {
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('blur', onBlur);
    };
  }

  function finishEditDom() {
    const el = editingRef.current;
    editCleanupRef.current?.();
    editCleanupRef.current = null;
    if (el) {
      el.removeAttribute('contenteditable');
      el.classList.remove('ledtider-editing');
    }
    return el;
  }

  function commitEdit() {
    const el = editingRef.current;
    if (!el) return;
    const anchor = editAnchorRef.current;
    const orig = editOrigRef.current;
    finishEditDom();
    editingRef.current = null;
    const newText = readAnchorText(el).replace(/\s+/g, ' ').trim();
    if (!newText || newText === orig) {
      setLeafText(el, orig); // återställ/normalisera
      return;
    }
    if (!baseTextRef.current.has(anchor)) baseTextRef.current.set(anchor, orig);
    setLeafText(el, newText);
    overridesRef.current.text = { ...(overridesRef.current.text || {}), [anchor]: newText };
    markOverridden();
    persist();
  }

  function cancelEdit() {
    const el = editingRef.current;
    if (!el) return;
    const orig = editOrigRef.current;
    finishEditDom();
    editingRef.current = null;
    setLeafText(el, orig);
  }

  function resetText(anchor) {
    const text = overridesRef.current.text || {};
    if (!(anchor in text)) return;
    const rest = { ...text };
    delete rest[anchor];
    overridesRef.current.text = rest;
    const el = anchorSelector(anchor);
    if (el) {
      const base = baseTextRef.current.get(anchor);
      if (base != null) setLeafText(el, base);
      el.classList.remove('ledtider-overridden');
    }
    setPencil(null);
    pencilElRef.current = null;
    persist();
  }

  // ── Tidspanel
  function openTime() {
    const D = typeof window !== 'undefined' ? window.__ledtiderDATA : null;
    if (!D || !baseRef.current) { setError('Tidsdatan är inte laddad ännu — försök igen om en stund.'); return; }
    baseFormRef.current = buildForm(baseRef.current);
    setForm(buildForm(D));
    setTimeOpen(true);
  }

  function renderFromForm(f) {
    const D = window.__ledtiderDATA;
    if (!D) return;
    const full = { gantt: {}, spar: {} };
    for (const r of f.gantt) full.gantt[r.key] = { forskedeMan: r.forskede, segment: r.seg.map((s) => ({ fas: s.fas, man: s.man })) };
    for (const s of f.spar) full.spar[s.id] = { scenarios: s.scenarios.map((sc) => ({ totalText: sc.totalText, faser: sc.faser.map((fa) => ({ namn: fa.namn, tid: fa.tid })) })) };
    applyDataOverrides(D, full);
    window.__ledtiderRenderData?.();
    applyTextNow();
  }

  function saveTime() {
    const f = form;
    const base = baseFormRef.current;
    const baseGantt = {};
    for (const r of base.gantt) baseGantt[r.key] = r;
    const baseSpar = {};
    for (const s of base.spar) baseSpar[s.id] = s;

    const data = { gantt: {}, spar: {} };
    for (const r of f.gantt) {
      const b = baseGantt[r.key];
      const forskChanged = !b || r.forskede !== b.forskede;
      const segChanged = !b || r.seg.some((s, i) => s.man !== b.seg[i]?.man);
      if (forskChanged || segChanged) {
        data.gantt[r.key] = { forskedeMan: r.forskede, segment: r.seg.map((s) => ({ fas: s.fas, man: s.man })) };
      }
    }
    for (const s of f.spar) {
      const bs = baseSpar[s.id];
      const scenarios = s.scenarios.map((sc, i) => {
        const bsc = bs?.scenarios[i];
        const o = {};
        if (!bsc || sc.totalText !== bsc.totalText) o.totalText = sc.totalText;
        const changed = sc.faser
          .filter((fa, fi) => !bsc || fa.tid !== bsc.faser[fi]?.tid)
          .map((fa) => ({ namn: fa.namn, tid: fa.tid }));
        if (changed.length) o.faser = changed;
        return 'totalText' in o || 'faser' in o ? o : null;
      });
      if (scenarios.some(Boolean)) data.spar[s.id] = { scenarios };
    }

    overridesRef.current.data = data;
    renderFromForm(f);
    persist();
    setTimeOpen(false);
  }

  // ── Formulär-uppdatering (immutabelt)
  function setGanttSeg(ri, si, val) {
    const man = Math.max(0, Math.round(Number(val) || 0));
    setForm((prev) => {
      const gantt = prev.gantt.map((r, i) =>
        i !== ri ? r : { ...r, seg: r.seg.map((s, j) => (j === si ? { ...s, man } : s)) }
      );
      return { ...prev, gantt };
    });
  }
  function setGanttForskede(ri, val) {
    const man = Math.max(0, Math.round(Number(val) || 0));
    setForm((prev) => ({ ...prev, gantt: prev.gantt.map((r, i) => (i === ri ? { ...r, forskede: man } : r)) }));
  }
  function setSparTotal(si, ci, val) {
    setForm((prev) => ({
      ...prev,
      spar: prev.spar.map((s, i) =>
        i !== si ? s : { ...s, scenarios: s.scenarios.map((sc, j) => (j === ci ? { ...sc, totalText: val } : sc)) }
      ),
    }));
  }
  function setSparFas(si, ci, fi, val) {
    setForm((prev) => ({
      ...prev,
      spar: prev.spar.map((s, i) =>
        i !== si ? s : {
          ...s,
          scenarios: s.scenarios.map((sc, j) =>
            j !== ci ? sc : { ...sc, faser: sc.faser.map((fa, k) => (k === fi ? { ...fa, tid: val } : fa)) }
          ),
        }
      ),
    }));
  }

  const fasFarger = (typeof window !== 'undefined' && window.__ledtiderDATA?.fasFarger) || {};
  const baseForm = baseFormRef.current;

  return (
    <>
      {isAdmin && (
        <style
          data-comment-ui="true"
          dangerouslySetInnerHTML={{
            __html:
              '.ledtider-overridden{outline:1px solid rgba(181,130,42,0.7);outline-offset:2px;border-radius:3px}' +
              '.ledtider-editing{outline:2px solid #b5822a !important;outline-offset:2px;border-radius:3px;background:rgba(181,130,42,0.06)}',
          }}
        />
      )}

      {isAdmin && dataEditable && (
        <div className={styles.toolbar} data-comment-ui="true">
          <button
            type="button"
            data-comment-ui="true"
            className={`${styles.toolBtn} ${timeOpen ? styles.toolBtnActive : ''}`}
            onClick={() => (timeOpen ? setTimeOpen(false) : openTime())}
            title="Redigera tiderna i tidsjämförelsen och spåren"
          >
            Redigera tider
          </button>
        </div>
      )}

      {isAdmin && pencil && (
        <>
          <button
            type="button"
            data-comment-ui="true"
            className={styles.pencil}
            style={{ top: pencil.top, left: pencil.left }}
            onClick={() => startEdit(pencil.anchor)}
            title="Redigera texten"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
          {pencil.hasOverride && (
            <button
              type="button"
              data-comment-ui="true"
              className={styles.reset}
              style={{ top: pencil.top + 34, left: pencil.left }}
              onClick={() => resetText(pencil.anchor)}
              title="Återställ till grundtexten"
            >
              Återställ
            </button>
          )}
        </>
      )}

      {isAdmin && dataEditable && form && (
        <aside className={`${styles.panel} ${timeOpen ? styles.panelOpen : ''}`} data-comment-ui="true" aria-hidden={!timeOpen}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Redigera tider</h3>
            <button className={styles.panelClose} onClick={() => setTimeOpen(false)} title="Stäng" aria-label="Stäng">×</button>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.note}>
              Ändringar här syns på webben direkt men följer inte med till PowerPoint-exporten,
              som läser materialets källdata. För att uppdatera presentationen måste tiderna
              föras in i repot. Guldmarkerade fält avviker från grunddatan.
            </div>

            <div className={styles.sectionTitle}>Tidsjämförelsen (gantt)</div>
            {form.gantt.map((r, ri) => {
              const b = baseForm?.gantt[ri];
              const total = r.seg.reduce((sum, s) => sum + s.man, 0);
              return (
                <div key={r.key} className={styles.card}>
                  <div className={styles.cardLabel}>{r.label}</div>
                  <div className={styles.cardSub}>{r.sublabel}</div>
                  <div className={styles.field}>
                    <label>Verksamhetens förskede</label>
                    <input
                      type="number" min="0"
                      className={`${styles.numInput} ${b && r.forskede !== b.forskede ? styles.changed : ''}`}
                      value={r.forskede}
                      onChange={(e) => setGanttForskede(ri, e.target.value)}
                    /> <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>mån</span>
                  </div>
                  {r.seg.map((s, si) => (
                    <div key={si} className={styles.field}>
                      <label>
                        <span className={styles.dot} style={{ background: fasFarger[s.fas]?.farg || '#999' }} />
                        {fasFarger[s.fas]?.label || s.fas}
                      </label>
                      <input
                        type="number" min="0"
                        className={`${styles.numInput} ${b && s.man !== b.seg[si]?.man ? styles.changed : ''}`}
                        value={s.man}
                        onChange={(e) => setGanttSeg(ri, si, e.target.value)}
                      /> <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>mån</span>
                    </div>
                  ))}
                  <div className={styles.total}>Total (Σ): {total} mån{total >= 12 ? ` ≈ ${Math.round((total / 12) * 10) / 10} år` : ''}</div>
                </div>
              );
            })}

            <div className={styles.sectionTitle}>Spårens scenarier</div>
            {form.spar.map((s, si) => (
              <div key={s.id} className={styles.card}>
                <div className={styles.cardLabel}>Spår {s.bokstav}: {s.namn}</div>
                {s.scenarios.map((sc, ci) => {
                  const bsc = baseForm?.spar[si]?.scenarios[ci];
                  return (
                    <div key={ci} className={styles.scenarioBlock}>
                      <div className={styles.scenarioName}>{sc.namn}</div>
                      <div className={styles.field}>
                        <label>Total</label>
                        <input
                          type="text"
                          className={`${styles.textInput} ${bsc && sc.totalText !== bsc.totalText ? styles.changed : ''}`}
                          value={sc.totalText}
                          onChange={(e) => setSparTotal(si, ci, e.target.value)}
                        />
                      </div>
                      {sc.faser.map((fa, fi) => (
                        <div key={fi} className={styles.field}>
                          <label>{fa.namn}</label>
                          <input
                            type="text"
                            className={`${styles.textInput} ${bsc && fa.tid !== bsc.faser[fi]?.tid ? styles.changed : ''}`}
                            value={fa.tid}
                            onChange={(e) => setSparFas(si, ci, fi, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className={styles.panelFooter}>
            <button className={styles.btn} onClick={() => setTimeOpen(false)}>Avbryt</button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveTime}>Spara</button>
          </div>
        </aside>
      )}

      {error && (
        <div className={styles.errorBanner} data-comment-ui="true" onClick={() => setError(null)}>
          {error} (klicka för att stänga)
        </div>
      )}
    </>
  );
}
