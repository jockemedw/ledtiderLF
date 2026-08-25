import { verifyAdminToken } from '../../../lib/auth.js';

// Läsande admin-koll för UI:t — ersätter tidigare PATCH-probe mot ett fejk-id.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  return res.status(200).json({ admin: verifyAdminToken(req.cookies?.ledtider_admin) });
}
