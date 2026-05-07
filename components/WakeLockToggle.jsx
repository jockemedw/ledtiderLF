import { useEffect, useState, useCallback, useRef } from 'react';

const STORAGE_KEY = 'lokal-alltid-pa';

export default function WakeLockToggle() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef(null);

  useEffect(() => {
    const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    setSupported(isSupported);
    if (isSupported && localStorage.getItem(STORAGE_KEY) === '1') {
      setActive(true);
    }
  }, []);

  const release = useCallback(async () => {
    if (sentinelRef.current) {
      try { await sentinelRef.current.release(); } catch (_) {}
      sentinelRef.current = null;
    }
  }, []);

  const acquire = useCallback(async () => {
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      sentinel.addEventListener('release', () => {
        sentinelRef.current = null;
      });
      setError('');
    } catch (e) {
      setError(e?.message || 'Kunde inte aktivera');
      setActive(false);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!supported) return;
    if (active) {
      acquire();
    } else {
      release();
    }
    return () => { release(); };
  }, [active, supported, acquire, release]);

  useEffect(() => {
    if (!supported) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && active && !sentinelRef.current) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [active, supported, acquire]);

  const toggle = () => {
    const next = !active;
    setActive(next);
    if (next) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={active ? 'Skärmen hålls tänd. Klicka för att stänga av.' : 'Klicka för att hålla skärmen tänd.'}
      aria-pressed={active}
      style={{
        position: 'fixed',
        right: '12px',
        bottom: '12px',
        zIndex: 9999,
        padding: '8px 12px',
        borderRadius: '999px',
        border: '1px solid #DDD8CC',
        background: active ? '#1A2744' : '#FFFFFF',
        color: active ? '#E8C97A' : '#1A2744',
        fontFamily: 'Jost, sans-serif',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span
        aria-hidden
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: active ? '#E8C97A' : '#9CA3AF',
          boxShadow: active ? '0 0 6px #E8C97A' : 'none',
        }}
      />
      {active ? 'Alltid på: PÅ' : 'Alltid på: AV'}
      {error && <span style={{ marginLeft: 6, color: '#DC2626' }}>!</span>}
    </button>
  );
}
