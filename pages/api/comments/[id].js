import { updateComment, deleteComment } from '../../../lib/comments.js';
import { verifyAdminToken } from '../../../lib/auth.js';

function isAdmin(req) {
  const cookie = req.cookies?.ledtider_admin;
  return verifyAdminToken(cookie);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const { id } = req.query;
  if (typeof id !== 'string' || !/^c_[a-f0-9]{8}$/.test(id)) {
    return res.status(400).json({ error: 'Ogiltigt id' });
  }

  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Admin krävs' });
  }

  if (req.method === 'PATCH') {
    const { text } = req.body ?? {};
    if (typeof text !== 'string' || text.length < 1 || text.length > 2000) {
      return res.status(400).json({ error: 'text måste vara 1–2000 tecken' });
    }
    const updated = await updateComment(id, { text: text.trim() });
    if (!updated) return res.status(404).json({ error: 'Hittas ej' });
    return res.status(200).json({ comment: updated });
  }

  if (req.method === 'DELETE') {
    const ok = await deleteComment(id);
    if (!ok) return res.status(404).json({ error: 'Hittas ej' });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).end();
}
