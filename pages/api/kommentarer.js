import { kv } from '@vercel/kv';

// Nyckel i KV: "kommentarer:{sektionsId}" → array av {id, namn, text, datum}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Hämta alla kommentars-nycklar
      const keys = await kv.keys('kommentarer:*');
      const alla = {};
      for (const key of keys) {
        const sektionsId = key.replace('kommentarer:', '');
        const kommentarer = await kv.get(key) || [];
        alla[sektionsId] = kommentarer;
      }
      return res.status(200).json(alla);
    } catch (err) {
      console.error('GET /api/kommentarer error:', err);
      return res.status(500).json({ fel: 'Kunde inte hämta kommentarer', detaljer: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { sektionsId, namn, text } = req.body || {};
      if (!sektionsId || !namn || !text) {
        return res.status(400).json({ fel: 'sektionsId, namn och text krävs' });
      }

      const key = `kommentarer:${sektionsId}`;
      const befintliga = (await kv.get(key)) || [];
      const nyKommentar = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        namn: String(namn).slice(0, 60),
        text: String(text).slice(0, 2000),
        datum: new Date().toISOString(),
      };
      befintliga.push(nyKommentar);
      await kv.set(key, befintliga);
      return res.status(201).json(nyKommentar);
    } catch (err) {
      console.error('POST /api/kommentarer error:', err);
      return res.status(500).json({ fel: 'Kunde inte spara kommentar', detaljer: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { sektionsId, id } = req.body || {};
      if (!sektionsId || !id) {
        return res.status(400).json({ fel: 'sektionsId och id krävs' });
      }
      const key = `kommentarer:${sektionsId}`;
      const befintliga = (await kv.get(key)) || [];
      const kvar = befintliga.filter(k => k.id !== id);
      await kv.set(key, kvar);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('DELETE /api/kommentarer error:', err);
      return res.status(500).json({ fel: 'Kunde inte ta bort kommentar' });
    }
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).end('Method Not Allowed');
}
