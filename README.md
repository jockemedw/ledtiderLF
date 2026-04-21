# Lokalförsörjningsguide — med kommentarsfunktion

Next.js-app som serverar `lokalforsorjning.html` plus en kommentarswidget som sparar via Vercel KV.

## Hur kommentarsfunktionen fungerar

- **Högerklicka** på valfri sektion, kort eller element → kommentarsruta öppnas
- **På mobil:** tryck och håll i ~0,6 sekunder
- **Gul siffra** i hörnet av ett element visar antal kommentarer
- **Namn** sparas lokalt i webbläsaren första gången
- **Alla ser samma kommentarer** (sparade i Vercel KV)
- Kommentarer uppdateras var 30:e sekund

## Deploy till Vercel

### 1. Skapa Vercel-konto
Gå till [vercel.com](https://vercel.com) och skapa gratiskonto med GitHub/GitLab/e-post.

### 2. Installera Vercel CLI
```bash
npm install -g vercel
```

### 3. Logga in och deploya
Från den här mappen (`lokal-app/`):
```bash
vercel login
vercel
```
Följ frågorna. Vercel ger dig en URL (t.ex. `lokalforsorjning-abc123.vercel.app`).

### 4. Aktivera Vercel KV (Redis)
1. Gå till ditt projekt på vercel.com → fliken **Storage**
2. Klicka **Create Database** → välj **KV**
3. Ge databasen ett namn (t.ex. `lokal-komm`)
4. Välj region (helst `fra1` — Frankfurt, närmast Sverige)
5. Vercel frågar vilket projekt databasen ska kopplas till → välj ditt projekt
6. Environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN` m.fl.) fylls i automatiskt

### 5. Redeploy
```bash
vercel --prod
```

Nu är sidan live. Skicka URL:en till dina kollegor och börja kommentera.

## Uppdatera innehållet

Redigera `lokalforsorjning.html` (samma som tidigare, alla data ligger i `DATA`-objektet längst ner).
Kör sedan:
```bash
vercel --prod
```
Ny version är live inom ~1 minut.

## Struktur

```
lokal-app/
├── pages/
│   ├── index.js            ← Serverar HTML + widget
│   └── api/kommentarer.js  ← API för att spara/hämta kommentarer
├── public/
│   └── kommentarer.js      ← Klient-widget (körs i browsern)
├── lokalforsorjning.html   ← Originalfilen, läses vid build
├── package.json
└── next.config.js
```

## Hantera kommentarer

Finns ingen admin-panel — varje användare kan ta bort kommentarer via ✕-knappen i kommentarsrutan.
För att radera ALLA kommentarer: logga in på Vercel dashboard → Storage → din KV-databas → Data Browser → rensa nycklar som börjar med `kommentarer:`.
