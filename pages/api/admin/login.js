import crypto from 'node:crypto';
import { signAdminToken } from '../../../lib/auth.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_S = 7 * 24 * 60 * 60;

function equalStrings(a, b) {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const { password } = req.body ?? {};
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD ej konfigurerat' });
  }
  if (typeof password !== 'string' || !equalStrings(password, expected)) {
    return res.status(401).json({ error: 'Fel lösenord' });
  }
  const expiry = Date.now() + SEVEN_DAYS_MS;
  const token = signAdminToken(expiry);
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `ledtider_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SEVEN_DAYS_S}${secureFlag}`
  );
  return res.status(200).json({ ok: true });
}
