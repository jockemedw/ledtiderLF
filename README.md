# Lokalförsörjningsguide — statisk Next.js-app

Next.js-app som serverar `lokalforsorjning.html` som en webbsida. Ingen databas, ingen backend-lagring.

## Struktur

```
lokal-app/
├── pages/
│   └── index.js            ← Serverar HTML-innehållet
├── lokalforsorjning.html   ← Själva innehållet, läses vid build
├── package.json
└── next.config.js
```

## Uppdatera innehållet

Redigera `lokalforsorjning.html` direkt i GitHub via webben (klicka filen → pennan). Alla data ligger i `DATA`-objektet längst ner i `<script>`-blocket. Commit → Vercel deployar automatiskt inom ~1 minut.

## Deploy till Vercel

1. Ladda upp filerna till ett GitHub-repo
2. Importera repot i Vercel (Add New → Project)
3. Vercel upptäcker Next.js automatiskt → Deploy
4. Klart — Vercel ger dig en URL
