export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `ledtider_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`
  );
  return res.status(200).json({ ok: true });
}
