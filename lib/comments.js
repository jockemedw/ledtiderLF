import { list, put, del, head } from '@vercel/blob';
import crypto from 'node:crypto';

const PREFIX = 'comments/';

function pathFor(id) {
  return `${PREFIX}${id}.json`;
}

function newId() {
  return 'c_' + crypto.randomBytes(4).toString('hex');
}

export async function listComments() {
  // list() returnerar max 1000 blobbar per anrop — följ cursorn så att
  // kommentarer bortom första sidan inte tyst försvinner ur svaret.
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const results = await Promise.all(
    blobs.map(async (b) => {
      const res = await fetch(b.url, { cache: 'no-store' });
      if (!res.ok) return null;
      try { return await res.json(); } catch { return null; }
    })
  );
  return results
    .filter(Boolean)
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

export async function createComment({ anchor, initials, text, page }) {
  // En id-kollision får inte tyst skriva över en befintlig kommentar —
  // slumpa då om id:t. Kollen görs med head() eftersom put() i
  // @vercel/blob 0.x alltid skriver över (allowOverwrite finns först i
  // 1.x; optionen skickas ändå så skyddet verkställs efter en uppgradering).
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = newId();
    let taken = true;
    try { await head(pathFor(id)); } catch { taken = false; }
    if (taken) continue;
    const comment = {
      id,
      anchor,
      initials,
      text,
      // Vilken sida kommentaren hör till ('lokal' = översikten). Äldre
      // kommentarer saknar fältet och tolkas som 'lokal' vid läsning.
      page: page || 'lokal',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    try {
      await put(pathFor(id), JSON.stringify(comment), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: false,
      });
      return comment;
    } catch (err) {
      if (!/exist/i.test(err?.message || '')) throw err;
    }
  }
  throw new Error('Kunde inte generera unikt kommentars-id');
}

export async function getComment(id) {
  try {
    const info = await head(pathFor(id));
    const res = await fetch(info.url, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateComment(id, { text }) {
  const existing = await getComment(id);
  if (!existing) return null;
  const updated = {
    ...existing,
    text,
    updatedAt: new Date().toISOString(),
  };
  await put(pathFor(id), JSON.stringify(updated), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return updated;
}

export async function deleteComment(id) {
  try {
    const info = await head(pathFor(id));
    await del(info.url);
    return true;
  } catch {
    return false;
  }
}
