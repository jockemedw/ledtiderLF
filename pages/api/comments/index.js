import { listComments, createComment } from '../../../lib/comments.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      const comments = await listComments();
      return res.status(200).json({ comments });
    } catch (err) {
      console.error('list error', err);
      return res.status(500).json({ error: 'Kunde inte läsa kommentarer' });
    }
  }

  if (req.method === 'POST') {
    const { anchor, initials, text } = req.body ?? {};
    if (typeof anchor !== 'string' || !anchor) {
      return res.status(400).json({ error: 'anchor krävs' });
    }
    const init = typeof initials === 'string' ? initials.trim() : '';
    if (init.length < 1 || init.length > 5) {
      return res.status(400).json({ error: 'initials måste vara 1–5 tecken' });
    }
    const txt = typeof text === 'string' ? text.trim() : '';
    if (txt.length < 1 || txt.length > 2000) {
      return res.status(400).json({ error: 'text måste vara 1–2000 tecken' });
    }
    try {
      const comment = await createComment({
        anchor: anchor.slice(0, 200),
        initials: init.toUpperCase(),
        text: txt,
      });
      return res.status(201).json({ comment });
    } catch (err) {
      console.error('create error', err);
      return res.status(500).json({ error: 'Kunde inte spara kommentar' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
