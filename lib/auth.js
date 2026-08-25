import crypto from 'node:crypto';

// Fast lösenord och inbyggd cookie-hemlighet — inga miljövariabler krävs.
// Repot är åtkomligt för alla som ska använda materialet, så adminläget är
// en bekvämlighetsspärr (skydd mot misstag), inte ett säkerhetsskydd.
export const ADMIN_PASSWORD = 'ledtider';
const COOKIE_SECRET = 'ledtider-cookie-signering-2026';

function hmac(message) {
  return crypto.createHmac('sha256', COOKIE_SECRET).update(message).digest('hex');
}

export function signAdminToken(expiryMs) {
  const exp = String(expiryMs);
  return `${exp}.${hmac(exp)}`;
}

export function verifyAdminToken(token) {
  if (typeof token !== 'string' || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [expStr, sig] = parts;
  if (!/^\d+$/.test(expStr) || !/^[0-9a-f]{64}$/.test(sig)) return false;

  const expected = hmac(expStr);
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  return Number(expStr) > Date.now();
}
