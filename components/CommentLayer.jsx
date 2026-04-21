import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './CommentLayer.module.css';
import { assignAnchorsInDocument, ensureAnchor } from '../lib/anchor.js';
import CommentPillar from './CommentPillar.jsx';
import CommentForm from './CommentForm.jsx';
import AdminLock from './AdminLock.jsx';
import OrphansPanel from './OrphansPanel.jsx';

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

export default function CommentLayer() {
  const [comments, setComments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [composing, setComposing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [anchorsReady, setAnchorsReady] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [focusedAnchor, setFocusedAnchor] = useState(null);
  const [tick, setTick] = useState(0);
  const groupRefs = useRef(new Map());

  useEffect(() => {
    assignAnchorsInDocument(document);
    setAnchorsReady(true);
    fetchComments();
    checkAdmin();

    let rescanTimer = null;
    const rescan = () => {
      clearTimeout(rescanTimer);
      rescanTimer = setTimeout(() => {
        assignAnchorsInDocument(document);
        setTick((t) => t + 1);
      }, 100);
    };

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
          rescan();
          return;
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const t1 = setTimeout(rescan, 500);
    const t2 = setTimeout(rescan, 1500);

    return () => {
      mo.disconnect();
      clearTimeout(rescanTimer);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Panel öppnas automatiskt när man skapar/redigerar eller fokuserar ett ankare
  useEffect(() => {
    if (composing || editing || focusedAnchor) setPanelOpen(true);
  }, [composing, editing, focusedAnchor]);

  // Selection mode: highlight vad som helst under musen + klick för att markera
  useEffect(() => {
    if (!selectionMode) return;

    function isSkippable(el) {
      if (!el || el === document.body || el === document.documentElement) return true;
      if (el.closest?.('[data-comment-ui]')) return true;
      return false;
    }

    function applyHighlight(el) {
      if (!el || el.__selHi) return;
      el.__selHi = true;
      el.__prevOutline = el.style.outline;
      el.__prevOutlineOffset = el.style.outlineOffset;
      el.__prevCursor = el.style.cursor;
      el.__prevBorderRadius = el.style.borderRadius;
      el.style.outline = '2px dashed #B5822A';
      el.style.outlineOffset = '3px';
      el.style.cursor = 'crosshair';
      el.style.borderRadius = el.__prevBorderRadius || '3px';
    }
    function removeHighlight(el) {
      if (!el || !el.__selHi) return;
      el.style.outline = el.__prevOutline || '';
      el.style.outlineOffset = el.__prevOutlineOffset || '';
      el.style.cursor = el.__prevCursor || '';
      el.style.borderRadius = el.__prevBorderRadius || '';
      el.__selHi = false;
    }
    function clearAll() {
      document.querySelectorAll('*').forEach((el) => { if (el.__selHi) removeHighlight(el); });
    }

    let lastHi = null;

    const onMove = (e) => {
      const el = e.target;
      if (isSkippable(el)) {
        if (lastHi) { removeHighlight(lastHi); lastHi = null; }
        return;
      }
      if (el === lastHi) return;
      if (lastHi) removeHighlight(lastHi);
      applyHighlight(el);
      lastHi = el;
    };

    const onClick = (e) => {
      const el = e.target;
      if (isSkippable(el)) {
        setSelectionMode(false);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const anchor = ensureAnchor(el);
      setComposing({ anchor });
      setFocusedAnchor(anchor);
      setSelectionMode(false);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') setSelectionMode(false);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey);
    document.body.style.cursor = 'crosshair';

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey);
      document.body.style.cursor = '';
      clearAll();
    };
  }, [selectionMode]);

  // Global hover: sätt focusedAnchor när man pekar på ett kommenterat element eller panel-grupp
  useEffect(() => {
    if (selectionMode) return;
    let clearTimer = null;
    const onOver = (e) => {
      const t = e.target;
      const groupEl = t?.closest?.('[data-panel-group]');
      let id = null;
      if (groupEl) {
        id = groupEl.getAttribute('data-panel-group');
      } else {
        const anchorEl = t?.closest?.('[data-comment-anchor]');
        if (anchorEl) {
          const a = anchorEl.getAttribute('data-comment-anchor');
          if (comments.some((c) => c.anchor === a)) id = a;
        }
      }
      if (id) {
        clearTimeout(clearTimer);
        setFocusedAnchor((prev) => (prev === id ? prev : id));
      } else {
        clearTimeout(clearTimer);
        clearTimer = setTimeout(() => setFocusedAnchor(null), 400);
      }
    };
    document.addEventListener('mouseover', onOver);
    return () => {
      document.removeEventListener('mouseover', onOver);
      clearTimeout(clearTimer);
    };
  }, [selectionMode, comments]);

  // Highlight ankaret när en pillar-grupp är fokuserad
  useEffect(() => {
    document.querySelectorAll('[data-comment-highlighted]').forEach((el) => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.borderRadius = '';
      el.removeAttribute('data-comment-highlighted');
    });
    if (focusedAnchor) {
      const el = document.querySelector(`[data-comment-anchor="${CSS.escape(focusedAnchor)}"]`);
      if (el) {
        el.style.outline = '2px solid #B5822A';
        el.style.outlineOffset = '3px';
        el.style.borderRadius = '4px';
        el.setAttribute('data-comment-highlighted', 'true');
      }
    }
  }, [focusedAnchor]);

  async function fetchComments() {
    try {
      const r = await fetch('/api/comments');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setComments(j.comments);
    } catch (e) {
      setError('Kunde inte läsa kommentarer');
    }
  }

  async function checkAdmin() {
    const r = await fetch('/api/comments/c_00000000', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'probe' }),
    });
    setIsAdmin(r.status !== 401);
  }

  async function handleCreate({ initials, text }) {
    if (!composing) return;
    try {
      const r = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anchor: composing.anchor, initials, text }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setComments((cs) => [...cs, j.comment]);
      setComposing(null);
    } catch (e) {
      setError(`Kunde inte spara: ${e.message}`);
    }
  }

  function handleEdit(comment) {
    setEditing(comment);
  }

  async function handleEditSubmit({ text }) {
    if (!editing) return;
    try {
      const r = await fetch(`/api/comments/${editing.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setComments((cs) => cs.map((c) => (c.id === j.comment.id ? j.comment : c)));
      setEditing(null);
    } catch (e) {
      setError(`Kunde inte spara: ${e.message}`);
    }
  }

  async function handleDelete(comment) {
    try {
      const r = await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json()).error);
      setComments((cs) => cs.filter((c) => c.id !== comment.id));
    } catch (e) {
      setError(`Kunde inte ta bort: ${e.message}`);
    }
  }

  async function handleLogin(password) {
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (r.ok) { setIsAdmin(true); return true; }
    return false;
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAdmin(false);
  }

  function jumpToAnchor(anchor) {
    const el = document.querySelector(`[data-comment-anchor="${CSS.escape(anchor)}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = rect.top + window.scrollY - 100;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    setFocusedAnchor(anchor);
  }

  // Inline count-bubblor intill varje kommenterat element
  useEffect(() => {
    if (!anchorsReady) return;
    document.querySelectorAll('.comment-inline-bubble').forEach((b) => b.remove());

    const counts = new Map();
    for (const c of comments) counts.set(c.anchor, (counts.get(c.anchor) ?? 0) + 1);

    for (const [anchor, n] of counts) {
      const el = document.querySelector(`[data-comment-anchor="${CSS.escape(anchor)}"]`);
      if (!el) continue;
      const btn = document.createElement('button');
      btn.className = `comment-inline-bubble ${styles.inlineBubble}`;
      btn.setAttribute('data-comment-ui', 'true');
      btn.textContent = `💬 ${n}`;
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setFocusedAnchor(anchor);
      };
      el.appendChild(btn);
    }
  }, [comments, anchorsReady, tick]);

  // Gruppera per ankare och sortera efter position i dokumentet
  const groups = useMemo(() => {
    if (!anchorsReady) return { items: [], orphans: [] };
    const map = new Map();
    const orphans = [];
    for (const c of comments) {
      const el = document.querySelector(`[data-comment-anchor="${CSS.escape(c.anchor)}"]`);
      if (!el) { orphans.push(c); continue; }
      if (!map.has(c.anchor)) map.set(c.anchor, { anchor: c.anchor, el, items: [], top: 0, label: '' });
      map.get(c.anchor).items.push(c);
    }
    const items = Array.from(map.values()).map((g) => {
      const rect = g.el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const label = (g.el.textContent || '').trim().slice(0, 60) || g.el.tagName.toLowerCase();
      return { ...g, top, label };
    });
    items.sort((a, b) => a.top - b.top);
    return { items, orphans };
  }, [comments, anchorsReady, tick]);

  const totalCount = comments.length;
  const showPanel = panelOpen || !!composing || !!editing;

  return (
    <>
      <div className={styles.controls} data-comment-ui="true">
        <AdminLock isAdmin={isAdmin} onLogin={handleLogin} onLogout={handleLogout} />

        <button
          data-comment-ui="true"
          className={`${styles.iconBtn} ${selectionMode ? styles.iconBtnActive : styles.iconBtnGold}`}
          onClick={() => {
            if (selectionMode) {
              setSelectionMode(false);
            } else {
              setComposing(null);
              setEditing(null);
              setSelectionMode(true);
            }
          }}
          title={selectionMode ? 'Avbryt (Esc)' : 'Ny kommentar — klicka sedan det du vill kommentera'}
        >
          {selectionMode ? <CloseIcon /> : <PlusIcon />}
        </button>

        <button
          data-comment-ui="true"
          className={`${styles.iconBtn} ${showPanel ? styles.iconBtnActive : ''}`}
          onClick={() => {
            if (showPanel) {
              setPanelOpen(false);
              setComposing(null);
              setEditing(null);
              setFocusedAnchor(null);
            } else {
              setPanelOpen(true);
            }
          }}
          title={showPanel ? 'Stäng kommentarer' : 'Visa kommentarer'}
        >
          <MessageIcon />
          {totalCount > 0 && !showPanel && (
            <span className={styles.iconBtnBadge}>{totalCount}</span>
          )}
        </button>
      </div>

      {selectionMode && (
        <div data-comment-ui="true" className={styles.selectionHint}>
          Klicka på det du vill kommentera (Esc för att avbryta)
        </div>
      )}

      <aside
        className={`${styles.panel} ${showPanel ? styles.panelOpen : ''}`}
        data-comment-ui="true"
        aria-hidden={!showPanel}
      >
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>
            Kommentarer {totalCount > 0 && <span style={{ color: '#6B7280', fontWeight: 400 }}>({totalCount})</span>}
          </h3>
          <button
            className={styles.panelClose}
            onClick={() => { setPanelOpen(false); setComposing(null); setEditing(null); setFocusedAnchor(null); }}
            title="Stäng"
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.panelBody}>
          <OrphansPanel
            comments={groups.orphans}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {composing && !groups.items.find((g) => g.anchor === composing.anchor) && (
            <div className={styles.panelGroup}>
              <div className={styles.panelGroupLabel}>Nytt ankare</div>
              <CommentForm
                mode="create"
                onSubmit={handleCreate}
                onCancel={() => setComposing(null)}
              />
            </div>
          )}

          {groups.items.length === 0 && !composing && groups.orphans.length === 0 && (
            <div className={styles.panelEmpty}>
              Inga kommentarer än. Klicka <strong>+</strong> och välj det du vill kommentera.
            </div>
          )}

          {groups.items.map(({ anchor, items, label }) => (
            <div
              key={anchor}
              className={styles.panelGroup}
              data-panel-group={anchor}
              ref={(el) => {
                if (el) groupRefs.current.set(anchor, el);
                else groupRefs.current.delete(anchor);
              }}
            >
              <div
                className={styles.panelGroupLabel}
                onClick={() => jumpToAnchor(anchor)}
                title="Hoppa till platsen på sidan"
              >
                ↗ {label}
              </div>
              {composing?.anchor === anchor && (
                <CommentForm
                  mode="create"
                  onSubmit={handleCreate}
                  onCancel={() => setComposing(null)}
                />
              )}
              {items.map((c) =>
                editing?.id === c.id ? (
                  <CommentForm
                    key={c.id}
                    mode="edit"
                    initialText={c.text}
                    onSubmit={handleEditSubmit}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <CommentPillar
                    key={c.id}
                    comment={c}
                    isAdmin={isAdmin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </aside>

      <ConnectorOverlay focusedAnchor={focusedAnchor} groupRefs={groupRefs} panelOpen={showPanel} />

      {error && (
        <div className={styles.errorBanner} data-comment-ui="true" onClick={() => setError(null)}>
          {error} (klicka för att stänga)
        </div>
      )}
    </>
  );
}

function ConnectorOverlay({ focusedAnchor, groupRefs, panelOpen }) {
  const glowRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    const setD = (d) => {
      if (glowRef.current) glowRef.current.setAttribute('d', d);
      if (lineRef.current) lineRef.current.setAttribute('d', d);
    };
    if (!focusedAnchor || !panelOpen) { setD(''); return; }

    let raf;
    const update = () => {
      const el = document.querySelector(`[data-comment-anchor="${CSS.escape(focusedAnchor)}"]`);
      const groupEl = groupRefs.current.get(focusedAnchor);
      if (el && groupEl) {
        const a = el.getBoundingClientRect();
        const b = groupEl.getBoundingClientRect();
        const x1 = a.right + 2;
        const y1 = a.top + a.height / 2;
        const x2 = b.left + 6;
        const y2 = b.top + 16;
        const mid = (x1 + x2) / 2;
        setD(`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
      } else {
        setD('');
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => { cancelAnimationFrame(raf); setD(''); };
  }, [focusedAnchor, groupRefs, panelOpen]);

  return (
    <svg className={styles.connector} aria-hidden="true">
      <path ref={glowRef} className={styles.connectorGlow} />
      <path ref={lineRef} className={styles.connectorLine} />
    </svg>
  );
}
