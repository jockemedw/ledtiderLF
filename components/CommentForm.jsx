import { useEffect, useState } from 'react';
import styles from './CommentLayer.module.css';

const INITIALS_KEY = 'ledtider:initials';

export default function CommentForm({ initialText = '', mode = 'create', onSubmit, onCancel }) {
  const [initials, setInitials] = useState('');
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode === 'create') {
      try {
        const saved = localStorage.getItem(INITIALS_KEY);
        if (saved) setInitials(saved);
      } catch {}
    }
  }, [mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const trimmedText = text.trim();
    if (!trimmedText) return setError('Skriv något');
    if (trimmedText.length > 2000) return setError('Max 2000 tecken');

    if (mode === 'create') {
      const trimmedInit = initials.trim().toUpperCase();
      if (trimmedInit.length < 1 || trimmedInit.length > 5) {
        return setError('Initialer: 1–5 tecken');
      }
      try { localStorage.setItem(INITIALS_KEY, trimmedInit); } catch {}
      setBusy(true);
      try {
        await onSubmit({ initials: trimmedInit, text: trimmedText });
      } finally {
        setBusy(false);
      }
    } else {
      setBusy(true);
      try {
        await onSubmit({ text: trimmedText });
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {mode === 'create' && (
        <input
          type="text"
          placeholder="Initialer (1–5 tecken)"
          value={initials}
          onChange={(e) => setInitials(e.target.value.slice(0, 5))}
          maxLength={5}
          autoFocus
        />
      )}
      <textarea
        placeholder="Din kommentar..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        autoFocus={mode !== 'create'}
      />
      {error && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginBottom: '0.3rem' }}>{error}</div>}
      <div className={styles.row}>
        <button type="button" onClick={onCancel}>Avbryt</button>
        <button type="submit" className={styles.primary} disabled={busy}>
          {busy ? '...' : (mode === 'create' ? 'Skicka' : 'Spara')}
        </button>
      </div>
    </form>
  );
}
