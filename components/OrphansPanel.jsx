import styles from './CommentLayer.module.css';
import CommentPillar from './CommentPillar.jsx';

export default function OrphansPanel({ comments, isAdmin, onEdit, onDelete }) {
  if (!comments.length) return null;
  return (
    <div className={styles.orphans}>
      <h4>Föräldralösa kommentarer ({comments.length})</h4>
      <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
        Ankarelement saknas — innehållet kan ha ändrats.
      </p>
      {comments.map((c) => (
        <CommentPillar
          key={c.id}
          comment={c}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
