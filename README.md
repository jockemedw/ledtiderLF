# Lokalförsörjningsguide — statisk Next.js-app

Next.js-app som serverar `lokalforsorjning.html` som en webbsida, med ett lager av kommentarer och plock-läge (Sammanställ) ovanpå, samt undersidorna `/detaljplan`, `/kallregister`, `/nyckeltal` och `/skraddarsydd`.

## Struktur

```
ledtiderLF/
├── pages/
│   ├── index.js            ← Serverar lokalforsorjning.html
│   ├── detaljplan.js       ← Serverar detaljplan.html (fördjupning)
│   ├── kallregister.js     ← Bläddrbart källregister (data/kallregister.json)
│   ├── nyckeltal.js        ← Citerbara nyckeltal (data/siffror.json)
│   ├── skraddarsydd.js     ← Skräddarsydd sammanställning av valda sektioner
│   └── api/                ← API-routes för kommentarer, admin + pptx
├── components/             ← React-komponenter: kommentarslager + plock-läge
├── lib/                    ← auth, anchor, comments, pptx-builder
├── data/                   ← siffror.json (nyckeltal) + kallregister.json (källor)
├── scripts/                ← popular-slides.json + pptx-CLI
├── lokalforsorjning.html   ← Huvudinnehållet, läses vid build
├── detaljplan.html         ← Fördjupningssidans innehåll
├── package.json
└── next.config.js
```

## Uppdatera innehållet

Redigera `lokalforsorjning.html` / `detaljplan.html` direkt i GitHub via webben (klicka filen → pennan). Sidspecifika data ligger i `DATA`-objektet längst ner i `<script>`-blocket; nyckeltal och källor ligger i `data/siffror.json` respektive `data/kallregister.json`. Commit → Vercel deployar automatiskt inom ~1 minut.

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

`npm test` — kör Vitest-sviterna för `lib/auth.js`, `lib/anchor.js`, `lib/pptx-builder.js`, sektionsurvalet och dataintegriteten i `data/*.json` (unika id:n, giltiga korsreferenser). UI och API verifieras manuellt enligt testplanen i `docs/superpowers/specs/2026-04-21-kommentarer-design.md`.

Notera: kommentarer lagras i Vercel Blob med `access: 'public'` — skrivning och radering går genom admin-skyddat API, men själva blobbarna är läsbara för den som känner store-URL:en. Medveten avvägning för internt arbetsmaterial; lägg inte känsligt innehåll i kommentarer.

## PowerPoint-export (.pptx)

Två lägen, båda genererade från `scripts/popular-slides.json` via `pptxgenjs`. Layouterna är fasta (`titel`, `siffra-stor`, `trappa`, `tabell`, `tva-spalter`, `kort-grid`, `innehall`, `intervall`, `kurva`) så att resultatet alltid följer Lejonfastigheters varumärkespalett.

1. **Populärversionen** — den kurerade korta versionen (5 bilder, slides med `popular: true`). Byggs av `npm run pptx` utan argument eller `GET /api/pptx` utan `ids`.
2. **Skräddarsydd export** — valfri blandning av sidans sektioner, en slide per sektion plus omslag. Varje valbar sektion i navigationen har en kurerad slide (testas i `lib/__tests__/pptx-builder.test.js`). Nås via Sammanställ-knappen på sidan ("Exportera PowerPoint"), `/skraddarsydd`-sidan eller `GET /api/pptx?ids=...`.

```bash
npm run pptx                                # populärversionen → dist/lokalforsorjning-popular.pptx
npm run pptx -- titel,kostnad-80            # bara valda slide-id:n
npm run pptx -- --sections=moduler,beslut   # via sektion-id:n (omslag läggs till)
npm run pptx -- --out=foo.pptx              # eget filnamn (under dist/)
```

Slides definieras i `scripts/popular-slides.json`. Varje slide refererar till ett HTML-ankare i fullversionen (fältet `ankare`) så att det är spårbart varifrån innehållet kommer — men själva innehållet ligger i JSON, inte i HTML, för att exporten ska vara stabil och redigerbar oberoende av webbsidans layout.

`dist/` är gitignored — varje användare regenererar .pptx själv.
