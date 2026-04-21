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
  const { blobs } = await list({ prefix: PREFIX });
  const results = await Promise.all(
    blobs.map(async (b) => {
      const res = await fetch(b.url, { cache: 'no-store' });
      if (!res.ok) return null;
      return res.json();
    })
  );
  return results
    .filter(Boolean)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createComment({ anchor, initials, text }) {
  const id = newId();
  const comment = {
    id,
    anchor,
    initials,
    text,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
  await put(pathFor(id), JSON.stringify(comment), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return comment;
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
