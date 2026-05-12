import Link from 'next/link';

// Minimal nav för undersidor (kallregister, nyckeltal, detaljplan, skraddarsydd).
// Ersätter den fulla top-nav:en med brand + "← Översikt" + sidnamn.
// Toptabs och subtabs visas endast på huvudsidan — där alla toptabs är
// ankarlänkar inom samma sida. Det gör navigationen konsekvent: huvudsidan
// är navet, undersidor är djupdyk.
export default function MinimalNav({ title }) {
  return (
    <nav className="minimal-nav">
      <Link href="/" className="minimal-nav-brand">
        Lejonfastigheter <span>Lokalförsörjning</span>
      </Link>
      <Link href="/" className="minimal-nav-back">← Översikt</Link>
      {title ? <span className="minimal-nav-title">{title}</span> : null}
    </nav>
  );
}
