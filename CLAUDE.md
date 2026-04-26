# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` / `npm start` — production build / serve
- `npm test` — run Vitest once (Node env, only `lib/__tests__/**/*.test.js`)
- `npm run test:watch` — Vitest in watch mode
- Run a single test: `npx vitest run lib/__tests__/anchor.test.js` (add `-t "<name>"` to filter by test name)

Local setup: copy `.env.local.example` → `.env.local` and set `ADMIN_PASSWORD`, `ADMIN_SECRET` (≥32 random chars), `BLOB_READ_WRITE_TOKEN` (from a Vercel Blob store linked to the project, or `npx vercel env pull .env.local`).

## Architecture

This is a **Next.js 14 Pages Router** app whose primary content is a single hand-written HTML file (`lokalforsorjning.html`) with a React-based comment overlay layered on top. There is no CMS or routing-driven content — the HTML file *is* the page.

### Content pipeline (`pages/index.js`)

`getStaticProps` reads `lokalforsorjning.html` from disk at build time and splits it into three pieces:

1. CSS from `<style>` → injected via `dangerouslySetInnerHTML` in `<Head>`.
2. Body markup with the inline `<script>` stripped → rendered via `dangerouslySetInnerHTML`.
3. The inline script → re-emitted via `next/script` with `strategy="afterInteractive"`. Because Next hydrates after `DOMContentLoaded` has already fired, the original `document.addEventListener('DOMContentLoaded', () => { … })` is rewritten into an IIFE that runs immediately if the doc is already loaded. **Preserve this regex transformation** in `pages/index.js` if editing — it's the only thing that keeps the page's interactive logic working under Next.

`CommentLayer` is dynamically imported with `ssr: false` because it manipulates the DOM and reads from Vercel Blob via `/api/comments`.

### Anchoring (`lib/anchor.js`)

Comments attach to elements via a deterministic id: `${tag}-${slug(first 30 chars of textContent)}-${nthOccurrence}`. `assignAnchorsInDocument` stamps `data-comment-anchor` on every element matching `COMMENTABLE_SELECTOR` (`h1-h6, p, li, figure, img, svg, table, blockquote, .card, .section`). When the user clicks an arbitrary element via "selection mode," `ensureAnchor` / `computeAnchorId` computes an id for elements outside the default selector.

**Consequence:** rewriting the first 30 chars of an element's text breaks the anchor and the comment becomes an "orphan" surfaced in `OrphansPanel`. Adding/removing siblings of the same tag+slug shifts the index and orphans those too. `CommentLayer` re-runs `assignAnchorsInDocument` via a `MutationObserver` plus debounced timers to handle dynamic DOM changes from the inline script.

### Storage (`lib/comments.js`)

One Vercel Blob per comment at `comments/c_<8hex>.json`, public-access. `listComments` enumerates the prefix and `fetch`es each blob's `url` directly (cache: 'no-store'). Updates use `put` with `addRandomSuffix: false, allowOverwrite: true` so the URL is stable. There's no index file — list = list-and-fetch-all.

### Admin auth (`lib/auth.js`, `pages/api/admin/*`)

HMAC-signed cookie `ledtider_admin = "<expiryMs>.<sha256(expiryMs, ADMIN_SECRET)>"`, 7 days. Verified with `crypto.timingSafeEqual`. `POST /api/admin/login` issues the cookie; `/api/comments/[id]` requires it for PATCH/DELETE. Only POST `/api/comments` (create) is open to anonymous users — comment creation is intentionally unauthenticated. The client probes admin status by PATCHing a synthetic id `c_00000000` and treating non-401 as "is admin" (see `CommentLayer.checkAdmin`).

### Tests

Vitest covers only the pure libs (`lib/anchor.js`, `lib/auth.js`). UI and API are verified manually against the test plan in `docs/superpowers/specs/2026-04-21-kommentarer-design.md`.

## Editing notes

- The HTML file is the authoritative content source — the README explicitly expects edits via GitHub web UI (the file is ~100KB); data lives in a `DATA` object inside its inline `<script>`.
- The project is Swedish-language: UI strings, error messages, and source comments are in Swedish. Match that style in any user-facing text or new comments rather than introducing English.
- No linter or formatter is configured (no ESLint/Prettier in `package.json`). Don't invent a lint step — match existing style by reading nearby code.
- Never strip `data-comment-ui="true"` from interactive overlay elements — it's how `CommentLayer` (selection mode, hover detection) tells its own UI apart from page content.
- `id` regex in `pages/api/comments/[id].js` is `^c_[a-f0-9]{8}$` — must match `newId()` in `lib/comments.js` if either changes.
- Design spec and current plan live at `docs/superpowers/specs/` and `docs/superpowers/plans/`.
