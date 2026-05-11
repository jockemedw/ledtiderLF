import { buildPptx } from '../../lib/pptx-builder.js';

// GET /api/pptx?ids=hierarki,kostnad,spar-b
//   → returnerar .pptx-buffer med slides för de valda sektionerna.
// GET /api/pptx (utan ids) → hela populärversionen.
//
// Sektioner som saknar kurerad slide hoppas över tyst (men returneras i
// X-Pptx-Missing-Sections så UI:t kan visa varning).

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Använd GET' });
  }

  const idsParam = typeof req.query.ids === 'string' ? req.query.ids : '';
  const sectionIds = idsParam
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  try {
    const result = sectionIds.length
      ? await buildPptx({ sectionIds })
      : await buildPptx({});

    if (!result.buffer || !result.slideIds.length) {
      return res.status(400).json({
        error: 'Inga slides att exportera',
        missingSections: result.missingSections,
      });
    }

    const filnamn = sectionIds.length
      ? 'lokalforsorjning-skraddarsydd.pptx'
      : 'lokalforsorjning-popular.pptx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filnamn}"`);
    res.setHeader('Cache-Control', 'no-store');
    if (result.missingSections.length) {
      res.setHeader('X-Pptx-Missing-Sections', result.missingSections.join(','));
    }
    return res.status(200).send(result.buffer);
  } catch (err) {
    console.error('pptx build error', err);
    return res.status(500).json({ error: 'Kunde inte generera pptx' });
  }
}

export const config = {
  api: {
    responseLimit: '8mb',
  },
};
