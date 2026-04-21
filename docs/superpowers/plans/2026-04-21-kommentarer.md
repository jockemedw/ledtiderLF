# Kommentarsfunktion — Implementationsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lägg till en klient-side kommentarslager ovanpå `lokalforsorjning.html` där flera användare kan kommentera i marginalen, och där en admin (lösenordsskyddad) kan redigera/ta bort kommentarer.

**Architecture:** Next.js API-routes + Vercel Blob som lagring (en fil per kommentar, prefix `comments/`). Klient läser via `GET /api/comments` och renderar pillare i höger marginal som kopplas till ankarelement via stabila `data-comment-anchor`-ID:n. Admin-auth via HMAC-signerad cookie.

**Tech Stack:** Next.js 14 (Pages Router), React 18, `@vercel/blob` för lagring, Node `crypto` för HMAC, Vitest för enhetstestning av pure-function-moduler (auth, anchor).

**Spec:** `docs/superpowers/specs/2026-04-21-kommentarer-design.md`

---

## Filstruktur (total översikt)

**Nya filer:**
```
lib/auth.js                     # HMAC sign/verify (testad)
lib/anchor.js                   # Genererar data-comment-anchor (testad)
lib/comments.js                 # Vercel Blob helpers
lib/__tests__/auth.test.js
lib/__tests__/anchor.test.js
vitest.config.js
pages/api/comments/index.js     # GET, POST
pages/api/comments/[id].js      # PATCH, DELETE
pages/api/admin/login.js
pages/api/admin/logout.js
components/CommentLayer.jsx     # Huvudklient — fetchar, distribuerar, skapar overlay
components/CommentPillar.jsx    # En pillare i marginalen
components/CommentForm.jsx      # Formulär för ny/redigerad kommentar
components/AdminLock.jsx        # Låsikon + login-modal
components/OrphansPanel.jsx     # Föräldralösa kommentarer
components/CommentLayer.module.css
.env.local.example
```

**Ändrade filer:**
```
pages/index.js                  # Lägger <CommentLayer /> efter body-div
package.json                    # +@vercel/blob, +vitest, +test-script
README.md                       # Uppdaterade setup-instruktioner
```

**Testkonvention:** Rena funktioner (auth, anchor) har Vitest-tester. API-routes och UI-komponenter verifieras manuellt enligt testplanen i specen.

---

## Task 1: Projektsetup — dependencies och testramverk

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `.env.local.example`

- [ ] **Step 1: Lägg till dependencies**

Modifiera `package.json` till:

```json
{
  "name": "lokalforsorjning",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vercel/blob": "^0.27.0",
    "next": "^14.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Installera**

Run: `npm install`
Expected: inga fel; `node_modules/` uppdaterat.

- [ ] **Step 3: Skapa Vitest-konfig**

Skapa `vitest.config.js`:

```js
export default {
  test: {
    environment: 'node',
    include: ['lib/__tests__/**/*.test.js'],
  },
};
```

- [ ] **Step 4: Skapa env-exempel**

Skapa `.env.local.example`:

```
# Admin-lösenord (du väljer). Används av /api/admin/login.
ADMIN_PASSWORD=byt-mig

# HMAC-hemlighet för signering av admin-cookie. Minst 32 tecken slumpmässigt.
# Generera: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_SECRET=byt-mig-till-lang-slumpmassig-strang

# Vercel Blob read/write-token. Hämtas i Vercel-dashboard:
# Storage → Create Blob Store → Connect to project → kopiera BLOB_READ_WRITE_TOKEN.
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.js .env.local.example
git commit -m "Add @vercel/blob + vitest, env.example for comments feature"
```

---

## Task 2: HMAC auth-helpers (TDD)

**Files:**
- Create: `lib/auth.js`
- Create: `lib/__tests__/auth.test.js`

- [ ] **Step 1: Skriv failande tester**

Skapa `lib/__tests__/auth.test.js`:

```js
import { describe, it, expect, beforeAll } from 'vitest';
import { signAdminToken, verifyAdminToken } from '../auth.js';

beforeAll(() => {
  process.env.ADMIN_SECRET = 'test-secret-minst-32-tecken-lang-nu-da';
});

describe('signAdminToken', () => {
  it('returnerar sträng på formen <expiryMs>.<hexHmac>', () => {
    const token = signAdminToken(Date.now() + 1000);
    expect(token).toMatch(/^\d+\.[0-9a-f]{64}$/);
  });
});

describe('verifyAdminToken', () => {
  it('accepterar token som inte gått ut', () => {
    const token = signAdminToken(Date.now() + 60_000);
    expect(verifyAdminToken(token)).toBe(true);
  });

  it('avvisar token som gått ut', () => {
    const token = signAdminToken(Date.now() - 1);
    expect(verifyAdminToken(token)).toBe(false);
  });

  it('avvisar manipulerad signatur', () => {
    const token = signAdminToken(Date.now() + 60_000);
    const [exp, sig] = token.split('.');
    const flipped = sig.slice(0, -1) + (sig.at(-1) === '0' ? '1' : '0');
    expect(verifyAdminToken(`${exp}.${flipped}`)).toBe(false);
  });

  it('avvisar felaktigt format', () => {
    expect(verifyAdminToken('')).toBe(false);
    expect(verifyAdminToken('ingen-punkt')).toBe(false);
    expect(verifyAdminToken('abc.def')).toBe(false);
  });

  it('avvisar med fel secret', () => {
    const token = signAdminToken(Date.now() + 60_000);
    process.env.ADMIN_SECRET = 'ett-helt-annat-secret-som-ar-tillrackligt-langt';
    expect(verifyAdminToken(token)).toBe(false);
    process.env.ADMIN_SECRET = 'test-secret-minst-32-tecken-lang-nu-da';
  });
});
```

- [ ] **Step 2: Kör testerna — ska fallera**

Run: `npm test`
Expected: FAIL — `Cannot find module '../auth.js'` eller liknande.

- [ ] **Step 3: Implementera `lib/auth.js`**

```js
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
```

- [ ] **Step 4: Kör testerna — ska passera**

Run: `npm test`
Expected: PASS — alla 6 tester gröna.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.js lib/__tests__/auth.test.js
git commit -m "Add HMAC-based admin token signing and verification"
```

---

## Task 3: Ankar-ID-generering (TDD)

**Files:**
- Create: `lib/anchor.js`
- Create: `lib/__tests__/anchor.test.js`

- [ ] **Step 1: Skriv failande tester**

Skapa `lib/__tests__/anchor.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { slugify, anchorIdForElement, COMMENTABLE_SELECTOR } from '../anchor.js';

describe('slugify', () => {
  it('lowercases och ersätter icke-alfanumeriskt med bindestreck', () => {
    expect(slugify('Hej Världen!')).toBe('hej-världen');
  });
  it('behåller å/ä/ö', () => {
    expect(slugify('Åtgärder för östra')).toBe('åtgärder-för-östra');
  });
  it('trimmar inledande/avslutande bindestreck', () => {
    expect(slugify('  ...hej...  ')).toBe('hej');
  });
  it('tomt blir tomt', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });
  it('begränsar inte själv (anchorIdForElement gör det)', () => {
    expect(slugify('a'.repeat(100)).length).toBe(100);
  });
});

describe('anchorIdForElement', () => {
  function fakeEl(tag, text, siblings = []) {
    return {
      tagName: tag.toUpperCase(),
      textContent: text,
      __siblings: siblings, // mock; inuti tester används indexOf
    };
  }

  it('producerar <tag>-<slug>-<index>', () => {
    const el = fakeEl('h2', 'Processen från behov');
    expect(anchorIdForElement(el, 0)).toBe('h2-processen-från-behov-0');
  });

  it('trimmar till första 30 tecken av textContent före slug', () => {
    const el = fakeEl('p', 'Detta är en mycket lång text som fortsätter och fortsätter');
    // första 30: "Detta är en mycket lång text s" → slug
    expect(anchorIdForElement(el, 0)).toBe('p-detta-är-en-mycket-lång-text-s-0');
  });

  it('inkluderar index för att särskilja dubbletter', () => {
    const el = fakeEl('li', 'Initial kontakt');
    expect(anchorIdForElement(el, 3)).toBe('li-initial-kontakt-3');
  });

  it('ger deterministiska ID:n vid samma input', () => {
    const el = fakeEl('h3', 'Samma rubrik');
    expect(anchorIdForElement(el, 2)).toBe(anchorIdForElement(el, 2));
  });

  it('hanterar tom textContent med tom slug', () => {
    const el = fakeEl('p', '');
    expect(anchorIdForElement(el, 0)).toBe('p--0');
  });
});

describe('COMMENTABLE_SELECTOR', () => {
  it('är en sträng med förväntade element', () => {
    expect(COMMENTABLE_SELECTOR).toContain('h2');
    expect(COMMENTABLE_SELECTOR).toContain('p');
    expect(COMMENTABLE_SELECTOR).toContain('li');
  });
});
```

- [ ] **Step 2: Kör testerna — ska fallera**

Run: `npm test`
Expected: FAIL — modul saknas.

- [ ] **Step 3: Implementera `lib/anchor.js`**

```js
export const COMMENTABLE_SELECTOR = 'h1, h2, h3, h4, p, li, .card, .section';

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9åäö]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function anchorIdForElement(element, index) {
  const tag = element.tagName.toLowerCase();
  const trimmed = (element.textContent || '').trim().slice(0, 30);
  const slug = slugify(trimmed);
  return `${tag}-${slug}-${index}`;
}

/**
 * Går igenom dokumentet och sätter data-comment-anchor på alla element
 * som matchar COMMENTABLE_SELECTOR. Idempotent: kan köras flera gånger.
 * Kräver att document finns (klient-side).
 */
export function assignAnchorsInDocument(root = document) {
  const elements = Array.from(root.querySelectorAll(COMMENTABLE_SELECTOR));
  const counts = new Map();
  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    const trimmed = (el.textContent || '').trim().slice(0, 30);
    const slug = slugify(trimmed);
    const key = `${tag}-${slug}`;
    const n = counts.get(key) ?? 0;
    counts.set(key, n + 1);
    el.setAttribute('data-comment-anchor', `${key}-${n}`);
  }
  return elements;
}
```

- [ ] **Step 4: Kör testerna — ska passera**

Run: `npm test`
Expected: PASS — alla tester gröna. `assignAnchorsInDocument` testas ej här (kräver DOM, testas manuellt i browser).

- [ ] **Step 5: Commit**

```bash
git add lib/anchor.js lib/__tests__/anchor.test.js
git commit -m "Add anchor ID generation for comment targets"
```

---

## Task 4: Vercel Blob-helpers

**Files:**
- Create: `lib/comments.js`

- [ ] **Step 1: Implementera `lib/comments.js`**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/comments.js
git commit -m "Add Vercel Blob helpers for comment CRUD"
```

Obs: dessa helpers testas integrationsmässigt via API-routes i senare tasks. Att mocka `@vercel/blob` för unit-tester skulle bara testa mocken.

---

## Task 5: API-route `GET` + `POST /api/comments`

**Files:**
- Create: `pages/api/comments/index.js`

- [ ] **Step 1: Implementera routen**

```js
import { listComments, createComment } from '../../../lib/comments.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      const comments = await listComments();
      return res.status(200).json({ comments });
    } catch (err) {
      console.error('list error', err);
      return res.status(500).json({ error: 'Kunde inte läsa kommentarer' });
    }
  }

  if (req.method === 'POST') {
    const { anchor, initials, text } = req.body ?? {};
    if (typeof anchor !== 'string' || !anchor) {
      return res.status(400).json({ error: 'anchor krävs' });
    }
    if (typeof initials !== 'string' || initials.length < 1 || initials.length > 5) {
      return res.status(400).json({ error: 'initials måste vara 1–5 tecken' });
    }
    if (typeof text !== 'string' || text.length < 1 || text.length > 2000) {
      return res.status(400).json({ error: 'text måste vara 1–2000 tecken' });
    }
    try {
      const comment = await createComment({
        anchor: anchor.slice(0, 200),
        initials: initials.trim().toUpperCase(),
        text: text.trim(),
      });
      return res.status(201).json({ comment });
    } catch (err) {
      console.error('create error', err);
      return res.status(500).json({ error: 'Kunde inte spara kommentar' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
}
```

- [ ] **Step 2: Commit**

```bash
git add pages/api/comments/index.js
git commit -m "Add GET/POST /api/comments"
```

---

## Task 6: API-route `PATCH` + `DELETE /api/comments/[id]`

**Files:**
- Create: `pages/api/comments/[id].js`

- [ ] **Step 1: Implementera routen**

```js
import { updateComment, deleteComment } from '../../../lib/comments.js';
import { verifyAdminToken } from '../../../lib/auth.js';

function isAdmin(req) {
  const cookie = req.cookies?.ledtider_admin;
  return verifyAdminToken(cookie);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const { id } = req.query;
  if (typeof id !== 'string' || !/^c_[a-f0-9]{8}$/.test(id)) {
    return res.status(400).json({ error: 'Ogiltigt id' });
  }

  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Admin krävs' });
  }

  if (req.method === 'PATCH') {
    const { text } = req.body ?? {};
    if (typeof text !== 'string' || text.length < 1 || text.length > 2000) {
      return res.status(400).json({ error: 'text måste vara 1–2000 tecken' });
    }
    const updated = await updateComment(id, { text: text.trim() });
    if (!updated) return res.status(404).json({ error: 'Hittas ej' });
    return res.status(200).json({ comment: updated });
  }

  if (req.method === 'DELETE') {
    const ok = await deleteComment(id);
    if (!ok) return res.status(404).json({ error: 'Hittas ej' });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).end();
}
```

- [ ] **Step 2: Commit**

```bash
git add pages/api/comments/[id].js
git commit -m "Add PATCH/DELETE /api/comments/[id] with admin gate"
```

---

## Task 7: Admin login/logout

**Files:**
- Create: `pages/api/admin/login.js`
- Create: `pages/api/admin/logout.js`

- [ ] **Step 1: Implementera login**

Skapa `pages/api/admin/login.js`:

```js
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
```

- [ ] **Step 2: Implementera logout**

Skapa `pages/api/admin/logout.js`:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add pages/api/admin/login.js pages/api/admin/logout.js
git commit -m "Add admin login/logout endpoints"
```

---

## Task 8: Basstilar och CSS-modul

**Files:**
- Create: `components/CommentLayer.module.css`

- [ ] **Step 1: Skapa CSS-modul**

```css
/* Wrapper — placerar allt kommentars-relaterat */
.root {
  position: relative;
}

/* Marginal — syns bara på desktop */
.margin {
  position: absolute;
  top: 0;
  right: 0;
  width: 240px;
  padding: 1rem 0.75rem;
  pointer-events: none;
}

.margin > * { pointer-events: auto; }

@media (max-width: 899px) {
  .margin { display: none; }
}

/* Ge plats åt marginalen på desktop */
@media (min-width: 900px) {
  :global(main), :global(.main-content), :global(body) {
    /* marginalen absolut-placerad; vi lägger padding på body via JS i CommentLayer */
  }
}

/* Pillar */
.pillar {
  background: #fff;
  border: 1px solid var(--border, #DDD8CC);
  border-left: 3px solid var(--gold, #B5822A);
  border-radius: 6px;
  padding: 0.5rem 0.6rem;
  margin-bottom: 0.5rem;
  font-size: 0.82rem;
  line-height: 1.35;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: box-shadow 120ms, transform 120ms;
  position: relative;
}

.pillar:hover,
.pillarHighlighted {
  box-shadow: 0 3px 10px rgba(0,0,0,0.12);
  transform: translateY(-1px);
}

.pillar .head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
}

.initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px; height: 22px;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 600;
  color: #fff;
}

.time {
  color: var(--muted, #6B7280);
  font-size: 0.7rem;
}

.body {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.bodyCollapsed {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.4rem;
}

.actions button {
  font-size: 0.72rem;
  padding: 2px 6px;
  border: 1px solid var(--border, #DDD8CC);
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

/* "+" knapp när man hovrar kommenterbart element */
.addButton {
  position: absolute;
  right: 8px;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--gold, #B5822A);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  pointer-events: auto;
  opacity: 0;
  transition: opacity 120ms;
}

.addButton.visible { opacity: 1; }

/* SVG overlay för kopplingslinjer */
.overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
}

.overlay path {
  fill: none;
  stroke: var(--gold, #B5822A);
  stroke-width: 1.5;
  opacity: 0;
  transition: opacity 120ms;
}

.overlay path.active { opacity: 0.8; }

/* Highlight på ankarelement */
:global([data-comment-anchor].comment-highlighted) {
  outline: 2px solid var(--gold, #B5822A);
  outline-offset: 3px;
  border-radius: 4px;
}

/* Formulär */
.form {
  background: #fff;
  border: 1px solid var(--border, #DDD8CC);
  border-radius: 6px;
  padding: 0.6rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.form input,
.form textarea {
  width: 100%;
  border: 1px solid var(--border, #DDD8CC);
  border-radius: 4px;
  padding: 4px 6px;
  font-family: inherit;
  font-size: 0.85rem;
  margin-bottom: 0.4rem;
}

.form textarea { min-height: 70px; resize: vertical; }

.form .row { display: flex; gap: 0.4rem; justify-content: flex-end; }

.form button {
  padding: 4px 10px;
  border: 1px solid var(--border, #DDD8CC);
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.form button.primary {
  background: var(--navy, #1A2744);
  color: #fff;
  border-color: var(--navy, #1A2744);
}

/* Låsikon */
.lock {
  position: fixed;
  top: 70px;
  right: 12px;
  z-index: 200;
  background: #fff;
  border: 1px solid var(--border, #DDD8CC);
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  font-size: 16px;
}

.lock.unlocked { background: var(--gold, #B5822A); color: #fff; border-color: var(--gold, #B5822A); }

/* Login-modal */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 300;
}

.modalCard {
  background: #fff;
  padding: 1.25rem;
  border-radius: 8px;
  width: min(320px, 90vw);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.modalCard h3 { margin-bottom: 0.6rem; }

/* Orphans-panel */
.orphans {
  background: #fff9e6;
  border: 1px solid #e8c97a;
  border-radius: 6px;
  padding: 0.6rem;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
}

.orphans h4 { font-size: 0.85rem; margin-bottom: 0.4rem; }

/* Mobil: bubbla i elementet */
.mobileBubble {
  display: none;
}

@media (max-width: 899px) {
  .mobileBubble {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 6px;
    padding: 2px 6px;
    background: var(--gold-light, #E8C97A);
    color: var(--navy, #1A2744);
    font-size: 0.75rem;
    border-radius: 10px;
    cursor: pointer;
  }

  .drawer {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    background: #fff;
    border-top: 1px solid var(--border, #DDD8CC);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
    max-height: 70vh;
    overflow-y: auto;
    padding: 1rem;
    z-index: 250;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }

  .drawerClose {
    float: right;
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
  }
}

/* Felbanner */
.errorBanner {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: #dc2626;
  color: #fff;
  padding: 8px 14px;
  border-radius: 6px;
  z-index: 400;
  font-size: 0.85rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CommentLayer.module.css
git commit -m "Add CSS module for comment layer"
```

---

## Task 9: `CommentPillar`-komponent

**Files:**
- Create: `components/CommentPillar.jsx`

- [ ] **Step 1: Implementera komponenten**

```jsx
import { useState } from 'react';
import styles from './CommentLayer.module.css';

function colorFromInitials(initials) {
  let h = 0;
  for (const ch of initials) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 45%)`;
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'nyss';
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d sedan`;
  return new Date(iso).toLocaleDateString('sv-SE');
}

export default function CommentPillar({
  comment,
  isAdmin,
  isHighlighted,
  onHover,
  onLeave,
  onClick,
  onEdit,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`${styles.pillar} ${isHighlighted ? styles.pillarHighlighted : ''}`}
      data-comment-id={comment.id}
      onMouseEnter={() => onHover?.(comment)}
      onMouseLeave={() => onLeave?.(comment)}
      onClick={() => {
        setExpanded((v) => !v);
        onClick?.(comment);
      }}
    >
      <div className={styles.head}>
        <span
          className={styles.initials}
          style={{ background: colorFromInitials(comment.initials) }}
        >
          {comment.initials}
        </span>
        <span className={styles.time}>
          {relativeTime(comment.createdAt)}
          {comment.updatedAt ? ' (redigerad)' : ''}
        </span>
      </div>
      <div className={expanded ? styles.body : `${styles.body} ${styles.bodyCollapsed}`}>
        {comment.text}
      </div>
      {isAdmin && (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit?.(comment)}>Redigera</button>
          <button
            onClick={() => {
              if (confirm('Ta bort kommentaren?')) onDelete?.(comment);
            }}
          >
            Ta bort
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CommentPillar.jsx
git commit -m "Add CommentPillar component"
```

---

## Task 10: `CommentForm`-komponent

**Files:**
- Create: `components/CommentForm.jsx`

- [ ] **Step 1: Implementera komponenten**

```jsx
import { useEffect, useState } from 'react';
import styles from './CommentLayer.module.css';

const INITIALS_KEY = 'ledtider:initials';

export default function CommentForm({ initialText = '', mode = 'create', onSubmit, onCancel }) {
  const [initials, setInitials] = useState('');
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode === 'create') {
      try {
        const saved = localStorage.getItem(INITIALS_KEY);
        if (saved) setInitials(saved);
      } catch {}
    }
  }, [mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const trimmedText = text.trim();
    if (!trimmedText) return setError('Skriv något');
    if (trimmedText.length > 2000) return setError('Max 2000 tecken');

    if (mode === 'create') {
      const trimmedInit = initials.trim().toUpperCase();
      if (trimmedInit.length < 1 || trimmedInit.length > 5) {
        return setError('Initialer: 1–5 tecken');
      }
      try { localStorage.setItem(INITIALS_KEY, trimmedInit); } catch {}
      setBusy(true);
      try {
        await onSubmit({ initials: trimmedInit, text: trimmedText });
      } finally {
        setBusy(false);
      }
    } else {
      setBusy(true);
      try {
        await onSubmit({ text: trimmedText });
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {mode === 'create' && (
        <input
          type="text"
          placeholder="Initialer (1–5 tecken)"
          value={initials}
          onChange={(e) => setInitials(e.target.value.slice(0, 5))}
          maxLength={5}
          autoFocus
        />
      )}
      <textarea
        placeholder="Din kommentar..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        autoFocus={mode !== 'create'}
      />
      {error && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginBottom: '0.3rem' }}>{error}</div>}
      <div className={styles.row}>
        <button type="button" onClick={onCancel}>Avbryt</button>
        <button type="submit" className={styles.primary} disabled={busy}>
          {busy ? '...' : (mode === 'create' ? 'Skicka' : 'Spara')}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CommentForm.jsx
git commit -m "Add CommentForm component"
```

---

## Task 11: `AdminLock`-komponent

**Files:**
- Create: `components/AdminLock.jsx`

- [ ] **Step 1: Implementera komponenten**

```jsx
import { useState } from 'react';
import styles from './CommentLayer.module.css';

export default function AdminLock({ isAdmin, onLogin, onLogout }) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const ok = await onLogin(password);
      if (ok) {
        setShowModal(false);
        setPassword('');
      } else {
        setError('Fel lösenord');
      }
    } finally {
      setBusy(false);
    }
  }

  function handleClick() {
    if (isAdmin) onLogout();
    else setShowModal(true);
  }

  return (
    <>
      <button
        className={`${styles.lock} ${isAdmin ? styles.unlocked : ''}`}
        onClick={handleClick}
        title={isAdmin ? 'Logga ut admin' : 'Logga in som admin'}
      >
        {isAdmin ? '🔓' : '🔒'}
      </button>
      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>Admin-inloggning</h3>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="Lösenord"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={{ width: '100%', padding: '6px 8px', marginBottom: '0.6rem' }}
              />
              {error && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.4rem' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)}>Avbryt</button>
                <button type="submit" disabled={busy}>{busy ? '...' : 'Logga in'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/AdminLock.jsx
git commit -m "Add AdminLock component"
```

---

## Task 12: `OrphansPanel`-komponent

**Files:**
- Create: `components/OrphansPanel.jsx`

- [ ] **Step 1: Implementera komponenten**

```jsx
import styles from './CommentLayer.module.css';
import CommentPillar from './CommentPillar.jsx';

export default function OrphansPanel({ comments, isAdmin, onEdit, onDelete }) {
  if (!comments.length) return null;
  return (
    <div className={styles.orphans}>
      <h4>Föräldralösa kommentarer ({comments.length})</h4>
      <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
        Ankarelement saknas — innehållet kan ha ändrats.
      </p>
      {comments.map((c) => (
        <CommentPillar
          key={c.id}
          comment={c}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/OrphansPanel.jsx
git commit -m "Add OrphansPanel component"
```

---

## Task 13: `CommentLayer`-huvudkomponent

**Files:**
- Create: `components/CommentLayer.jsx`

- [ ] **Step 1: Implementera huvudkomponenten**

```jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './CommentLayer.module.css';
import { assignAnchorsInDocument, COMMENTABLE_SELECTOR } from '../lib/anchor.js';
import CommentPillar from './CommentPillar.jsx';
import CommentForm from './CommentForm.jsx';
import AdminLock from './AdminLock.jsx';
import OrphansPanel from './OrphansPanel.jsx';

const MARGIN_WIDTH = 260;

export default function CommentLayer() {
  const [comments, setComments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hovered, setHovered] = useState(null); // comment eller anchor-id
  const [composing, setComposing] = useState(null); // { anchor } när ny skrivs
  const [editing, setEditing] = useState(null); // comment
  const [error, setError] = useState(null);
  const [mobileDrawerAnchor, setMobileDrawerAnchor] = useState(null);
  const [anchorsReady, setAnchorsReady] = useState(false);
  const addButtonRef = useRef(null);
  const hoveredAnchorRef = useRef(null);

  // Initial load
  useEffect(() => {
    assignAnchorsInDocument(document);
    setAnchorsReady(true);
    fetchComments();
    checkAdmin();
    document.body.style.paddingRight =
      window.matchMedia('(min-width: 900px)').matches ? `${MARGIN_WIDTH}px` : '';
    const onResize = () => {
      document.body.style.paddingRight =
        window.matchMedia('(min-width: 900px)').matches ? `${MARGIN_WIDTH}px` : '';
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      document.body.style.paddingRight = '';
    };
  }, []);

  // "+"-knapp på hovrade kommenterbara element
  useEffect(() => {
    if (!anchorsReady) return;
    const elements = document.querySelectorAll('[data-comment-anchor]');
    const handlers = [];
    elements.forEach((el) => {
      const enter = () => { hoveredAnchorRef.current = el; positionAddButton(el); };
      const leave = () => {
        setTimeout(() => {
          if (hoveredAnchorRef.current === el) {
            hoveredAnchorRef.current = null;
            if (addButtonRef.current) addButtonRef.current.classList.remove(styles.visible);
          }
        }, 100);
      };
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
      handlers.push([el, enter, leave]);
    });
    return () => {
      handlers.forEach(([el, enter, leave]) => {
        el.removeEventListener('mouseenter', enter);
        el.removeEventListener('mouseleave', leave);
      });
    };
  }, [anchorsReady]);

  function positionAddButton(el) {
    if (!addButtonRef.current) return;
    if (!window.matchMedia('(min-width: 900px)').matches) return;
    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    addButtonRef.current.style.top = `${rect.top + scrollY + 4}px`;
    addButtonRef.current.style.right = '8px';
    addButtonRef.current.classList.add(styles.visible);
  }

  async function fetchComments() {
    try {
      const r = await fetch('/api/comments');
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setComments(j.comments);
    } catch (e) {
      setError('Kunde inte läsa kommentarer');
    }
  }

  async function checkAdmin() {
    // Prova PATCH på en icke-existerande kommentar: om vi får 400/404 är vi admin, 401 = ej admin.
    const r = await fetch('/api/comments/c_00000000', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'probe' }),
    });
    setIsAdmin(r.status !== 401);
  }

  async function handleCreate({ initials, text }) {
    if (!composing) return;
    try {
      const r = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anchor: composing.anchor, initials, text }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setComments((cs) => [...cs, j.comment]);
      setComposing(null);
    } catch (e) {
      setError(`Kunde inte spara: ${e.message}`);
    }
  }

  async function handleEdit(comment) {
    setEditing(comment);
  }

  async function handleEditSubmit({ text }) {
    if (!editing) return;
    try {
      const r = await fetch(`/api/comments/${editing.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setComments((cs) => cs.map((c) => (c.id === j.comment.id ? j.comment : c)));
      setEditing(null);
    } catch (e) {
      setError(`Kunde inte spara: ${e.message}`);
    }
  }

  async function handleDelete(comment) {
    try {
      const r = await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json()).error);
      setComments((cs) => cs.filter((c) => c.id !== comment.id));
    } catch (e) {
      setError(`Kunde inte ta bort: ${e.message}`);
    }
  }

  async function handleLogin(password) {
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (r.ok) { setIsAdmin(true); return true; }
    return false;
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAdmin(false);
  }

  // Gruppera kommentarer per ankare
  const grouped = new Map();
  const orphans = [];
  for (const c of comments) {
    const el = document.querySelector(`[data-comment-anchor="${CSS.escape(c.anchor)}"]`);
    if (!el) { orphans.push(c); continue; }
    if (!grouped.has(c.anchor)) grouped.set(c.anchor, { el, items: [] });
    grouped.get(c.anchor).items.push(c);
  }

  // För varje grupp: beräkna pillar-position (top = elements top i sidan)
  const pillarGroups = anchorsReady ? Array.from(grouped.entries()).map(([anchor, { el, items }]) => {
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    return { anchor, el, items, top };
  }) : [];

  // Hover-highlight: synka pillar <-> ankare
  useEffect(() => {
    document.querySelectorAll('.comment-highlighted').forEach((el) => el.classList.remove('comment-highlighted'));
    if (hovered?.anchor) {
      const el = document.querySelector(`[data-comment-anchor="${CSS.escape(hovered.anchor)}"]`);
      el?.classList.add('comment-highlighted');
    }
  }, [hovered]);

  return (
    <>
      <AdminLock isAdmin={isAdmin} onLogin={handleLogin} onLogout={handleLogout} />

      {/* "+"-knapp som följer hovrade element */}
      <button
        ref={addButtonRef}
        className={styles.addButton}
        style={{ position: 'absolute' }}
        onClick={() => {
          const el = hoveredAnchorRef.current;
          if (el) setComposing({ anchor: el.getAttribute('data-comment-anchor') });
        }}
      >+</button>

      <div className={styles.margin}>
        <OrphansPanel
          comments={orphans}
          isAdmin={isAdmin}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {pillarGroups.map(({ anchor, items, top }) => (
          <div key={anchor} style={{ position: 'absolute', top: `${top}px`, right: '12px', width: '220px' }}>
            {composing?.anchor === anchor && (
              <CommentForm
                mode="create"
                onSubmit={handleCreate}
                onCancel={() => setComposing(null)}
              />
            )}
            {items.map((c) => (
              editing?.id === c.id ? (
                <CommentForm
                  key={c.id}
                  mode="edit"
                  initialText={c.text}
                  onSubmit={handleEditSubmit}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <CommentPillar
                  key={c.id}
                  comment={c}
                  isAdmin={isAdmin}
                  isHighlighted={hovered?.id === c.id}
                  onHover={(cm) => setHovered(cm)}
                  onLeave={() => setHovered(null)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )
            ))}
          </div>
        ))}

        {/* Formulär utan befintliga kommentarer på ankaret */}
        {composing && !grouped.has(composing.anchor) && (() => {
          const el = document.querySelector(`[data-comment-anchor="${CSS.escape(composing.anchor)}"]`);
          if (!el) return null;
          const top = el.getBoundingClientRect().top + window.scrollY;
          return (
            <div style={{ position: 'absolute', top: `${top}px`, right: '12px', width: '220px' }}>
              <CommentForm
                mode="create"
                onSubmit={handleCreate}
                onCancel={() => setComposing(null)}
              />
            </div>
          );
        })()}
      </div>

      {/* SVG-overlay för kopplingslinje */}
      <ConnectorOverlay hovered={hovered} pillarGroups={pillarGroups} />

      {error && (
        <div className={styles.errorBanner} onClick={() => setError(null)}>
          {error} (klicka för att stänga)
        </div>
      )}
    </>
  );
}

function ConnectorOverlay({ hovered, pillarGroups }) {
  const [path, setPath] = useState(null);
  useEffect(() => {
    if (!hovered?.anchor) { setPath(null); return; }
    const el = document.querySelector(`[data-comment-anchor="${CSS.escape(hovered.anchor)}"]`);
    if (!el) { setPath(null); return; }
    const group = pillarGroups.find((g) => g.anchor === hovered.anchor);
    if (!group) { setPath(null); return; }

    const elRect = el.getBoundingClientRect();
    const x1 = elRect.right + window.scrollX;
    const y1 = elRect.top + elRect.height / 2 + window.scrollY;
    const x2 = window.innerWidth - 260 + window.scrollX;
    const y2 = group.top + 12;
    const midX = (x1 + x2) / 2;
    setPath(`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
  }, [hovered, pillarGroups]);

  if (!path) return null;
  return (
    <svg className={styles.overlay} style={{ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }}>
      <path d={path} className="active" style={{ opacity: 0.8 }} />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CommentLayer.jsx
git commit -m "Add CommentLayer main component"
```

---

## Task 14: Mobilläge — bubblor och drawer

**Files:**
- Modify: `components/CommentLayer.jsx`

- [ ] **Step 1: Lägg till mobile bubbles och drawer**

Lägg till följande i `CommentLayer.jsx`. Efter den befintliga `useEffect`en som sätter upp hover-handlers, lägg till:

```jsx
// Mobile bubbles
useEffect(() => {
  if (!anchorsReady) return;
  if (window.matchMedia('(min-width: 900px)').matches) return;

  // Rensa befintliga
  document.querySelectorAll('.comment-mobile-bubble').forEach((b) => b.remove());

  const counts = new Map();
  for (const c of comments) {
    counts.set(c.anchor, (counts.get(c.anchor) ?? 0) + 1);
  }
  for (const [anchor, n] of counts) {
    const el = document.querySelector(`[data-comment-anchor="${CSS.escape(anchor)}"]`);
    if (!el) continue;
    const btn = document.createElement('button');
    btn.className = `comment-mobile-bubble ${styles.mobileBubble}`;
    btn.textContent = `💬 ${n}`;
    btn.onclick = (e) => { e.preventDefault(); setMobileDrawerAnchor(anchor); };
    el.appendChild(btn);
  }
}, [comments, anchorsReady]);
```

Sedan, precis innan den stängande `</>`-taggen i `return`, lägg till drawer:

```jsx
{mobileDrawerAnchor && (() => {
  const items = comments.filter((c) => c.anchor === mobileDrawerAnchor);
  return (
    <div className={styles.drawer}>
      <button className={styles.drawerClose} onClick={() => setMobileDrawerAnchor(null)}>×</button>
      <h4 style={{ marginBottom: '0.6rem' }}>Kommentarer</h4>
      {items.map((c) => (
        <CommentPillar
          key={c.id}
          comment={c}
          isAdmin={isAdmin}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
      <button
        style={{ marginTop: '0.6rem' }}
        onClick={() => { setComposing({ anchor: mobileDrawerAnchor }); setMobileDrawerAnchor(null); }}
      >+ Ny kommentar</button>
    </div>
  );
})()}
```

- [ ] **Step 2: Commit**

```bash
git add components/CommentLayer.jsx
git commit -m "Add mobile bubbles and drawer"
```

---

## Task 15: Integration i `pages/index.js`

**Files:**
- Modify: `pages/index.js`

- [ ] **Step 1: Lägg till CommentLayer**

Ändra `pages/index.js` — lägg till import högst upp och rendera komponenten efter body-diven:

```jsx
import Head from 'next/head';
import Script from 'next/script';
import fs from 'fs';
import path from 'path';
import dynamic from 'next/dynamic';

const CommentLayer = dynamic(() => import('../components/CommentLayer.jsx'), { ssr: false });

export async function getStaticProps() {
  const htmlPath = path.join(process.cwd(), 'lokalforsorjning.html');
  const raw = fs.readFileSync(htmlPath, 'utf-8');

  const styleMatch = raw.match(/<style>([\s\S]*?)<\/style>/);
  const css = styleMatch ? styleMatch[1] : '';

  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let bodyInnehall = bodyMatch ? bodyMatch[1] : '';

  const scriptMatch = bodyInnehall.match(/<script>([\s\S]*?)<\/script>/);
  let scriptInnehall = scriptMatch ? scriptMatch[1] : '';

  bodyInnehall = bodyInnehall.replace(/<script>[\s\S]*?<\/script>/, '');

  scriptInnehall = scriptInnehall.replace(
    /document\.addEventListener\(\s*["']DOMContentLoaded["']\s*,\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;?/,
    '(function initDirect() {\n  if (document.readyState === "loading") {\n    document.addEventListener("DOMContentLoaded", initDirect);\n    return;\n  }\n$1\n})();'
  );

  return { props: { css, bodyInnehall, scriptInnehall } };
}

export default function Home({ css, bodyInnehall, scriptInnehall }) {
  return (
    <>
      <Head>
        <title>Lokalförsörjning — Från behov till inflyttning</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </Head>

      <div dangerouslySetInnerHTML={{ __html: bodyInnehall }} />

      <Script
        id="lokal-data-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: scriptInnehall }}
      />

      <CommentLayer />
    </>
  );
}
```

Obs: `CommentLayer` laddas med `dynamic({ ssr: false })` så att den bara körs klient-side (den använder `document`).

- [ ] **Step 2: Kör dev-servern och verifiera att sidan laddas**

Run: `npm run dev`
Expected: `http://localhost:3000` visar sidan utan JS-fel i konsolen. Låsikonen syns i övre högra hörnet.

- [ ] **Step 3: Commit**

```bash
git add pages/index.js
git commit -m "Integrate CommentLayer into index page"
```

---

## Task 16: Uppdatera README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Skriv om README**

```markdown
# Lokalförsörjningsguide — statisk Next.js-app

Next.js-app som serverar `lokalforsorjning.html` som en webbsida med ett lager av kommentarer ovanpå.

## Struktur

```
ledtiderLF/
├── pages/
│   ├── index.js            ← Serverar HTML-innehållet
│   └── api/                ← API-routes för kommentarer + admin
├── components/             ← React-komponenter för kommentarslagret
├── lib/                    ← auth, anchor, comments helpers
├── lokalforsorjning.html   ← Själva innehållet, läses vid build
├── package.json
└── next.config.js
```

## Uppdatera innehållet

Redigera `lokalforsorjning.html` direkt i GitHub via webben (klicka filen → pennan). Alla data ligger i `DATA`-objektet längst ner i `<script>`-blocket. Commit → Vercel deployar automatiskt inom ~1 minut.

Befintliga kommentarers ankare består så länge elementets första 30 tecken av text är intakta. Kraftiga omskrivningar gör att kommentaren hamnar i panelen "Föräldralösa kommentarer".

## Kommentarer

Alla kan lägga kommentarer genom att hovra på ett element (rubrik, stycke, listrad, kort) och klicka `+` i marginalen. Ange dina initialer och skriv texten.

Som admin (enda inloggningen) kan du redigera eller ta bort vilken kommentar som helst:
1. Klicka på låsikonen uppe till höger
2. Ange admin-lösenordet
3. "Redigera" / "Ta bort" dyker upp på varje pillar

Admin-sessionen håller i 7 dagar via en signerad cookie.

## Setup för lokal utveckling

1. Kopiera `.env.local.example` till `.env.local` och fyll i värden
2. `npm install`
3. `npm run dev`

## Miljövariabler

| Variabel | Vad |
|---|---|
| `ADMIN_PASSWORD` | Admin-lösenord |
| `ADMIN_SECRET` | HMAC-secret (≥32 tecken slumpmässiga) |
| `BLOB_READ_WRITE_TOKEN` | Token från Vercel Blob (genereras när du skapar en blob-store i Vercel-projektet) |

## Deploy till Vercel

1. Importera repot i Vercel
2. Gå till Storage → Create → Blob → Connect → `BLOB_READ_WRITE_TOKEN` sätts automatiskt
3. Lägg till `ADMIN_PASSWORD` och `ADMIN_SECRET` under Settings → Environment Variables
4. Deploya

## Tester

`npm test` — kör Vitest-svit för `lib/auth.js` och `lib/anchor.js`. UI och API verifieras manuellt enligt testplanen i `docs/superpowers/specs/2026-04-21-kommentarer-design.md`.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Update README with comment feature setup instructions"
```

---

## Task 17: Manuell verifiering enligt testplan

**Files:** ingen ändring — verifiering

Förutsättningar: `.env.local` ifyllt, `BLOB_READ_WRITE_TOKEN` giltig, `npm run dev` igång.

- [ ] **Step 1: Skapa kommentar som användare**

Öppna `http://localhost:3000`, hovra en rubrik, klicka `+` i marginalen, skriv initialer "AB" och text "Test 1", skicka.
Expected: pillar syns i marginalen nästan direkt. Reload → pillaren finns kvar.

- [ ] **Step 2: Kommentar från två fönster**

Öppna sidan i både normalt fönster och inkognito. Skapa kommentar i vardera på samma element.
Expected: efter reload visas båda.

- [ ] **Step 3: Hover-koppling**

Hovra en pillar.
Expected: SVG-linje syns mellan pillar och element; elementet får gul ram.

Hovra ett element.
Expected: motsvarande pillare får lätt förhöjning (highlight).

- [ ] **Step 4: Admin-skydd**

Utan att vara inloggad, öppna devtools → Network. Skicka PATCH:
```js
fetch('/api/comments/c_00000000', { method: 'PATCH', headers: {'content-type':'application/json'}, body: JSON.stringify({text:'x'})})
```
Expected: 401.

- [ ] **Step 5: Admin-login, redigera och radera**

Klicka låsikonen → ange `ADMIN_PASSWORD`.
Expected: låsikon blir öppen/gyllene. Varje pillar får "Redigera" och "Ta bort" vid expand.
Redigera en kommentar → texten uppdateras, "(redigerad)" visas.
Ta bort en kommentar → pillaren försvinner efter bekräftelse.

- [ ] **Step 6: Ankarestabilitet vid textjustering**

I `lokalforsorjning.html`, ändra en rubrik du har kommenterat — håll första 30 tecknen oförändrade (lägg till text i slutet). Spara, ladda om.
Expected: kommentaren sitter kvar.

Ändra sedan rubriken kraftigt i början. Ladda om.
Expected: kommentaren syns i "Föräldralösa kommentarer" högst upp i marginalen.

- [ ] **Step 7: Cookie-utgång**

Redigera tillfälligt `pages/api/admin/login.js` och ändra `SEVEN_DAYS_MS` till `5000` (5 sekunder). Logga in, vänta 6 sekunder, försök radera en kommentar.
Expected: 401. UI visar felbanner "Admin krävs".
Återställ värdet och commita inte ändringen.

- [ ] **Step 8: Mobilläge**

I devtools, aktivera device toolbar, välj iPhone-storlek. Ladda om.
Expected: ingen marginal; bubblor `💬 N` syns inne i kommenterade element. Klick öppnar drawer underifrån.

- [ ] **Step 9: Initialer förfylls**

Ny inkognitosession. Lägg en kommentar med initialer "XY". Stäng fönstret. Öppna nytt inkognitofönster på samma profil.
Expected: formuläret har fortfarande "XY" förfyllt nästa gång (samma profil, samma localStorage).

- [ ] **Step 10: Final commit av ev. små fixar**

Om du hittat och fixat buggar under testningen, commit med beskrivande meddelande.
Om inga fix behövs, hoppa över.

---

## Deploy-checklista

Ej del av plan-tasks; gör efter att tasksen är gröna.

1. I Vercel: Storage → Blob → Create Store → connect. Detta sätter `BLOB_READ_WRITE_TOKEN` automatiskt.
2. Settings → Environment Variables → lägg till `ADMIN_PASSWORD` och `ADMIN_SECRET` (Production + Preview).
3. Pusha grenen → Vercel deployar → testa på preview-URL.
4. Merga till `main` → Production.
