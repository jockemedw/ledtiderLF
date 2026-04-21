# Lokalförsörjningsguide — statisk Next.js-app

Next.js-app som serverar `lokalforsorjning.html` som en webbsida, med ett lager av kommentarer ovanpå.

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

Alla kan lägga kommentarer genom att hovra på ett element (rubrik, stycke, listrad, kort) och klicka `+` i marginalen. Ange dina initialer och skriv texten. Initialerna sparas i webbläsarens localStorage och förfylls nästa gång.

Som admin (enda inloggningen) kan du redigera eller ta bort vilken kommentar som helst:
1. Klicka på låsikonen uppe till höger
2. Ange admin-lösenordet
3. "Redigera" / "Ta bort" dyker upp på varje pillar

Admin-sessionen håller i 7 dagar via en signerad cookie.

## Setup för lokal utveckling

1. Kopiera `.env.local.example` till `.env.local` och fyll i värden (eller kör `npx vercel env pull .env.local` efter att du linkat projektet)
2. `npm install`
3. `npm run dev`

## Miljövariabler

| Variabel | Vad |
|---|---|
| `ADMIN_PASSWORD` | Admin-lösenord (du väljer) |
| `ADMIN_SECRET` | HMAC-secret (≥32 tecken slumpmässiga) |
| `BLOB_READ_WRITE_TOKEN` | Token från Vercel Blob (skapas automatiskt när du ansluter en blob-store till projektet) |

Generera en `ADMIN_SECRET`:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploy till Vercel

1. Importera repot i Vercel
2. Gå till Storage → Create → Blob → Connect till projektet (ger automatiskt `BLOB_READ_WRITE_TOKEN`)
3. Lägg till `ADMIN_PASSWORD` och `ADMIN_SECRET` under Settings → Environment Variables
4. Deploya

## Tester

`npm test` — kör Vitest-svit för `lib/auth.js` och `lib/anchor.js`. UI och API verifieras manuellt enligt testplanen i `docs/superpowers/specs/2026-04-21-kommentarer-design.md`.
