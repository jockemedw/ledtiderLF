import { verifyAdminToken } from '../../../lib/auth.js';
import {
  getOverrides,
  saveOverrides,
  sanitizeOverrides,
  withinSizeLimit,
  isValidPage,
} from '../../../lib/overrides.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const page = typeof req.query.page === 'string' ? req.query.page : '';
    if (!isValidPage(page)) {
      return res.status(400).json({ error: 'Ogiltig sida' });
    }
    try {
      const { text, data } = await getOverrides(page);
      return res.status(200).json({ text, data });
    } catch (err) {
      console.error('overrides get error', err);
      // Overlay ska aldrig fälla sidan — svara tomt hellre än fel.
      return res.status(200).json({ text: {}, data: { gantt: {}, spar: {} } });
    }
  }

  if (req.method === 'PUT') {
    if (!verifyAdminToken(req.cookies?.ledtider_admin)) {
      return res.status(401).json({ error: 'Endast admin' });
    }
    const { page, text, data } = req.body ?? {};
    if (!isValidPage(page)) {
      return res.status(400).json({ error: 'Ogiltig sida' });
    }
    const clean = sanitizeOverrides({ text, data });
    if (!withinSizeLimit(clean)) {
      return res.status(413).json({ error: 'Overlay-dokumentet är för stort' });
    }
    try {
      const doc = await saveOverrides(page, clean);
      return res.status(200).json({ ok: true, updatedAt: doc.updatedAt });
    } catch (err) {
      console.error('overrides save error', err);
      return res.status(500).json({ error: 'Kunde inte spara ändringar' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).end();
}
