import crypto from 'node:crypto';

function hmac(message) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('ADMIN_SECRET saknas eller för kort');
  }
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
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
