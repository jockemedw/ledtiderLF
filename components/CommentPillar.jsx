import { useState } from 'react';
import styles from './CommentLayer.module.css';

function colorFromInitials(initials) {
  let h = 0;
  for (const ch of initials) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 45%)`;
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'nyss';
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d sedan`;
  return new Date(iso).toLocaleDateString('sv-SE');
}

export default function CommentPillar({
  comment,
  isAdmin,
  isHighlighted,
  onHover,
  onLeave,
  onClick,
  onEdit,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`${styles.pillar} ${isHighlighted ? styles.pillarHighlighted : ''}`}
      data-comment-id={comment.id}
      onMouseEnter={() => onHover?.(comment)}
      onMouseLeave={() => onLeave?.(comment)}
      onClick={() => {
        setExpanded((v) => !v);
        onClick?.(comment);
      }}
    >
      <div className={styles.head}>
        <span
          className={styles.initials}
          style={{ background: colorFromInitials(comment.initials) }}
        >
          {comment.initials}
        </span>
        <span className={styles.time}>
          {relativeTime(comment.createdAt)}
          {comment.updatedAt ? ' (redigerad)' : ''}
        </span>
      </div>
      <div className={expanded ? styles.body : `${styles.body} ${styles.bodyCollapsed}`}>
        {comment.text}
      </div>
      {isAdmin && (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit?.(comment)}>Redigera</button>
          <button
            onClick={() => {
              if (confirm('Ta bort kommentaren?')) onDelete?.(comment);
            }}
          >
            Ta bort
          </button>
        </div>
      )}
    </div>
  );
}
