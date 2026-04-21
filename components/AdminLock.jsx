import { useState } from 'react';
import styles from './CommentLayer.module.css';

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
        className={`${styles.lock} ${isAdmin ? styles.unlocked : ''}`}
        onClick={handleClick}
        title={isAdmin ? 'Logga ut admin' : 'Logga in som admin'}
      >
        {isAdmin ? '🔓' : '🔒'}
      </button>
      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
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
