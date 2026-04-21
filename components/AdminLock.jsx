import { useState } from 'react';
import styles from './CommentLayer.module.css';

function LockClosedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}

function LockOpenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
    </svg>
  );
}

export default function AdminLock({ isAdmin, onLogin, onLogout }) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const ok = await onLogin(password);
      if (ok) {
        setShowModal(false);
        setPassword('');
      } else {
        setError('Fel lösenord');
      }
    } finally {
      setBusy(false);
    }
  }

  function handleClick() {
    if (isAdmin) onLogout();
    else setShowModal(true);
  }

  return (
    <>
      <button
        data-comment-ui="true"
        className={`${styles.iconBtn} ${isAdmin ? styles.iconBtnGold : ''}`}
        onClick={handleClick}
        title={isAdmin ? 'Logga ut admin' : 'Logga in som admin'}
      >
        {isAdmin ? <LockOpenIcon /> : <LockClosedIcon />}
      </button>
      {showModal && (
        <div className={styles.modal} data-comment-ui="true" onClick={() => setShowModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>Admin-inloggning</h3>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="Lösenord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '6px 8px', marginBottom: '0.6rem' }}
              />
              {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)}>Avbryt</button>
                <button type="submit" disabled={busy}>{busy ? '...' : 'Logga in'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
