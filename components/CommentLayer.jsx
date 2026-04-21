import { useEffect, useRef, useState } from 'react';
import styles from './CommentLayer.module.css';
import { assignAnchorsInDocument } from '../lib/anchor.js';
import CommentPillar from './CommentPillar.jsx';
import CommentForm from './CommentForm.jsx';
import AdminLock from './AdminLock.jsx';
import OrphansPanel from './OrphansPanel.jsx';

const MARGIN_WIDTH = 260;

export default function CommentLayer() {
  const [comments, setComments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [composing, setComposing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [mobileDrawerAnchor, setMobileDrawerAnchor] = useState(null);
  const [anchorsReady, setAnchorsReady] = useState(false);
  const [tick, setTick] = useState(0);
  const addButtonRef = useRef(null);
  const hoveredAnchorRef = useRef(null);

  useEffect(() => {
    assignAnchorsInDocument(document);
    setAnchorsReady(true);
    fetchComments();
    checkAdmin();

    const applyPadding = () => {
      document.body.style.paddingRight =
        window.matchMedia('(min-width: 900px)').matches ? `${MARGIN_WIDTH}px` : '';
    };
    applyPadding();

    const onResize = () => { applyPadding(); setTick((t) => t + 1); };
    const onScroll = () => setTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      document.body.style.paddingRight = '';
    };
  }, []);

  useEffect(() => {
    if (!anchorsReady) return;
    const elements = document.querySelectorAll('[data-comment-anchor]');
    const handlers = [];
    elements.forEach((el) => {
      const enter = () => { hoveredAnchorRef.current = el; positionAddButton(el); };
      const leave = () => {
        setTimeout(() => {
          if (hoveredAnchorRef.current === el) {
            hoveredAnchorRef.current = null;
            if (addButtonRef.current) addButtonRef.current.classList.remove(styles.visible);
          }
        }, 120);
      };
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
      handlers.push([el, enter, leave]);
    });
    return () => {
      handlers.forEach(([el, enter, leave]) => {
        el.removeEventListener('mouseenter', enter);
        el.removeEventListener('mouseleave', leave);
      });
    };
  }, [anchorsReady]);

  function positionAddButton(el) {
    if (!addButtonRef.current) return;
    if (!window.matchMedia('(min-width: 900px)').matches) return;
    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    addButtonRef.current.style.top = `${rect.top + scrollY + 4}px`;
    addButtonRef.current.style.right = '8px';
    addButtonRef.current.classList.add(styles.visible);
  }

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

  // Mobile bubbles
  useEffect(() => {
    if (!anchorsReady) return;
    document.querySelectorAll('.comment-mobile-bubble').forEach((b) => b.remove());
    if (window.matchMedia('(min-width: 900px)').matches) return;

    const counts = new Map();
    for (const c of comments) {
      counts.set(c.anchor, (counts.get(c.anchor) ?? 0) + 1);
    }
    for (const [anchor, n] of counts) {
      const el = document.querySelector(`[data-comment-anchor="${CSS.escape(anchor)}"]`);
      if (!el) continue;
      const btn = document.createElement('button');
      btn.className = `comment-mobile-bubble ${styles.mobileBubble}`;
      btn.textContent = `💬 ${n}`;
      btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); setMobileDrawerAnchor(anchor); };
      el.appendChild(btn);
    }
  }, [comments, anchorsReady]);

  // Gruppera per ankare
  const grouped = new Map();
  const orphans = [];
  if (anchorsReady) {
    for (const c of comments) {
      const el = document.querySelector(`[data-comment-anchor="${CSS.escape(c.anchor)}"]`);
      if (!el) { orphans.push(c); continue; }
      if (!grouped.has(c.anchor)) grouped.set(c.anchor, { el, items: [] });
      grouped.get(c.anchor).items.push(c);
    }
  }

  const pillarGroups = anchorsReady ? Array.from(grouped.entries()).map(([anchor, { el, items }]) => {
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    return { anchor, el, items, top };
  }) : [];

  // Hover-highlight på ankare
  useEffect(() => {
    document.querySelectorAll('.comment-highlighted').forEach((el) => el.classList.remove('comment-highlighted'));
    if (hovered?.anchor) {
      const el = document.querySelector(`[data-comment-anchor="${CSS.escape(hovered.anchor)}"]`);
      el?.classList.add('comment-highlighted');
    }
  }, [hovered]);

  // Composing: hitta ankaret om ingen befintlig grupp finns
  let composingStandalone = null;
  if (composing && anchorsReady && !grouped.has(composing.anchor)) {
    const el = document.querySelector(`[data-comment-anchor="${CSS.escape(composing.anchor)}"]`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      composingStandalone = { anchor: composing.anchor, top };
    }
  }

  return (
    <>
      <AdminLock isAdmin={isAdmin} onLogin={handleLogin} onLogout={handleLogout} />

      <button
        ref={addButtonRef}
        className={styles.addButton}
        onClick={() => {
          const el = hoveredAnchorRef.current;
          if (el) setComposing({ anchor: el.getAttribute('data-comment-anchor') });
        }}
      >+</button>

      <div className={styles.margin}>
        <OrphansPanel
          comments={orphans}
          isAdmin={isAdmin}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {pillarGroups.map(({ anchor, items, top }) => (
          <div key={anchor} style={{ position: 'absolute', top: `${top}px`, right: '12px', width: '220px' }}>
            {composing?.anchor === anchor && (
              <CommentForm
                mode="create"
                onSubmit={handleCreate}
                onCancel={() => setComposing(null)}
              />
            )}
            {items.map((c) => (
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
                  isHighlighted={hovered?.id === c.id}
                  onHover={(cm) => setHovered(cm)}
                  onLeave={() => setHovered(null)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )
            ))}
          </div>
        ))}

        {composingStandalone && (
          <div style={{ position: 'absolute', top: `${composingStandalone.top}px`, right: '12px', width: '220px' }}>
            <CommentForm
              mode="create"
              onSubmit={handleCreate}
              onCancel={() => setComposing(null)}
            />
          </div>
        )}
      </div>

      <ConnectorOverlay hovered={hovered} pillarGroups={pillarGroups} tick={tick} />

      {mobileDrawerAnchor && (() => {
        const items = comments.filter((c) => c.anchor === mobileDrawerAnchor);
        return (
          <div className={styles.drawer}>
            <button className={styles.drawerClose} onClick={() => setMobileDrawerAnchor(null)}>×</button>
            <h4 style={{ marginBottom: '0.6rem' }}>Kommentarer</h4>
            {items.map((c) => (
              <CommentPillar
                key={c.id}
                comment={c}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            <button
              style={{ marginTop: '0.6rem', padding: '6px 12px' }}
              onClick={() => { setComposing({ anchor: mobileDrawerAnchor }); setMobileDrawerAnchor(null); }}
            >+ Ny kommentar</button>
          </div>
        );
      })()}

      {error && (
        <div className={styles.errorBanner} onClick={() => setError(null)}>
          {error} (klicka för att stänga)
        </div>
      )}
    </>
  );
}

function ConnectorOverlay({ hovered, pillarGroups }) {
  const [path, setPath] = useState(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!hovered?.anchor) { setPath(null); return; }
    const el = document.querySelector(`[data-comment-anchor="${CSS.escape(hovered.anchor)}"]`);
    if (!el) { setPath(null); return; }
    const group = pillarGroups.find((g) => g.anchor === hovered.anchor);
    if (!group) { setPath(null); return; }

    const elRect = el.getBoundingClientRect();
    const x1 = elRect.right + window.scrollX;
    const y1 = elRect.top + elRect.height / 2 + window.scrollY;
    const x2 = window.innerWidth - 260 + window.scrollX;
    const y2 = group.top + 18;
    const midX = (x1 + x2) / 2;
    setPath(`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
    setSize({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight });
  }, [hovered, pillarGroups]);

  if (!path) return null;
  return (
    <svg className={styles.overlay} width={size.w} height={size.h}>
      <path d={path} />
    </svg>
  );
}
