# Kommentarsfunktion för Lokalförsörjningsguiden

**Datum:** 2026-04-21
**Status:** Design godkänd, redo för implementationsplan

## Syfte

`ledtiderLF` är ett arbetsdokument som flera personer redigerar via GitHub. Vi vill kunna lägga kommentarer direkt i sidan så diskussion och synpunkter hamnar i kontext, inte i parallella kanaler. En enda admin (repo-ägaren) ska kunna redigera och ta bort kommentarer.

## Översikt

Klient-side kommentarslager ovanpå befintlig HTML. Marginalpillare till höger visar kommentarerna; hovring kopplar pillare till det element kommentaren hör hemma vid. Kommentarer lagras i Vercel Blob (en fil per kommentar). Läs- och skrivoperationer går via Next.js API-routes. Admin autentiseras med lösenord + signerad cookie.

## Arkitektur

```
Browser                     Vercel (Functions)          Vercel Blob
───────                     ──────────────────          ───────────
pages/index.js  ──fetch──►  /api/comments (GET)    ──►  list + read comments/*.json
CommentLayer    ──POST───►  /api/comments (POST)   ──►  write comments/c_<id>.json
admin-only      ──PATCH──►  /api/comments/[id]     ──►  overwrite blob (cookie krävs)
admin-only      ──DELETE─►  /api/comments/[id]     ──►  delete blob (cookie krävs)
admin login     ──POST───►  /api/admin/login       ──►  sätter signerad cookie
```

## Ankring

Varje kommenterbart element får ett stabilt `data-comment-anchor`-attribut genererat runtime i klienten efter att `lokalforsorjning.html` renderats.

**Algoritm:**
- `text = element.textContent.trim().slice(0, 30)`
- `slug = text.toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '')` (behåll å/ä/ö)
- `id = <tag>-<slug>-<n>` där `n` är nollbaserat index bland syskon med samma `<tag>-<slug>`
- Exempel: `h2-processen-fran-behov-0`, `li-initial-kontakt-3`
- Ren funktion av DOM — samma DOM ger alltid samma ID:n
- Överlever textändringar så länge första 30 tecknen är intakta efter trim
- Om ett sparat ankare inte hittas vid load: kommentaren visas i panelen "Föräldralösa kommentarer" högst upp i marginalen — ingen data går förlorad

**Kommenterbara element** (CSS-selektor):
`h1, h2, h3, h4, p, li, .card, .section`

Span/inline-element är avsiktligt uteslutna för att undvika kommentarer på enskilda ord.

## Datamodell

En fil per kommentar i Vercel Blob, prefix `comments/`:

```json
{
  "id": "c_lj3k2h",
  "anchor": "h2-processen-fran-behov-0",
  "initials": "JW",
  "text": "Bör vi nämna hyreskontraktet här?",
  "createdAt": "2026-04-21T14:32:00Z",
  "updatedAt": null
}
```

**Fält:**
- `id`: genereras klient-side med `crypto.randomUUID().slice(0,8)` → prefixat med `c_`
- `anchor`: matchar `data-comment-anchor` på ankarelementet
- `initials`: 1–5 tecken, valideras både klient- och serverside
- `text`: max 2000 tecken
- `createdAt` / `updatedAt`: ISO-8601 i UTC

En fil per kommentar = inga race conditions vid samtidiga skrivningar.

## API-routes

### `GET /api/comments`
- Publik.
- Listar blobs med prefix `comments/`, läser alla, returnerar array sorterad på `createdAt`.
- Cache-Control: `no-store` (kommentarer ska alltid vara färska).

### `POST /api/comments`
- Publik. Body: `{ anchor, initials, text }`.
- Validerar: `initials.length` 1–5, `text.length` 1–2000, `anchor` ickefalsigt.
- Skapar ny blob `comments/c_<id>.json`. Returnerar hela kommentaren.

### `PATCH /api/comments/[id]`
- Kräver admin-cookie. Body: `{ text }`.
- Läser blob, uppdaterar `text` + `updatedAt`, skriver tillbaka. Returnerar uppdaterad kommentar.

### `DELETE /api/comments/[id]`
- Kräver admin-cookie.
- Tar bort blob. Returnerar `{ ok: true }`.

### `POST /api/admin/login`
- Body: `{ password }`.
- Jämför med `process.env.ADMIN_PASSWORD` via `timingSafeEqual`.
- Vid match: sätter cookie `ledtider_admin` på formen `<expiryMs>.<hmac>`. `HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=604800` (7 dagar).

### `POST /api/admin/logout`
- Rensar cookien.

## Auth

- Env-vars: `ADMIN_PASSWORD`, `ADMIN_SECRET` (minst 32 tecken), `BLOB_READ_WRITE_TOKEN` (från Vercel Blob).
- Cookie-format: `<expiryMs>.<hmac>` där `hmac = hmacSha256(String(expiryMs), ADMIN_SECRET)` (hex).
- Verifikation: parsa expiryMs, räkna om HMAC, jämför med `timingSafeEqual`, kontrollera `expiryMs > Date.now()`.
- HMAC med Node.js `crypto` — ingen extern dep.

## UI

### Layout

- **Desktop (≥900 px):** högermarginal 240 px bred, alltid synlig. Huvudinnehållet får `margin-right: 260px` eller motsvarande.
- **Mobil (<900 px):** marginalen döljs. Istället visas en liten bubbla inuti varje kommenterat element (`💬 3`). Klick öppnar en drawer underifrån som listar kommentarerna för det elementet.

### Pillare

Varje kommentar = en "pillar" i marginalen:
- Initialer i en färgad cirkel (färg härledd deterministiskt från initialerna via hash → HSL)
- Första 60 tecken av texten
- Tidsstämpel relativt ("2 min sedan")
- Klick expanderar till full text + ev. admin-knappar

Om flera kommentarer hör till samma ankare: de staplas vertikalt nära elementets topp.

### Hovring och koppling

- Hovra pillar → tunn SVG-kurva dras från pillarens vänsterkant till ankarelementets högerkant. Ankarelementet får en ljus ram.
- Hovra ankarelement → motsvarande pillare highlightas.
- SVG renderas i ett absolut-positionerat overlay som täcker hela sidan (`pointer-events: none`).

### Skapa kommentar

- Hovra kommenterbart element → `+`-knapp syns i marginalen vid elementets höjd.
- Klick → formulär poppar fram i marginalen: `initialer` (förfyllt från localStorage) + `text` + "Skicka".
- Submit → optimistisk rendering av pillaren → POST → vid fel: pillaren visas i rött med "Försök igen".

### Admin-läge

- Låsikon högst upp i marginalen. Ej inloggad: klick → lösenordsruta. Inloggad: klick → logout.
- När admin-cookie finns: varje pillar får "Redigera" (inline-textarea) och "Ta bort" (bekräftelse).

## localStorage

- `ledtider:initials` — senast använda initialer, förfylls i formuläret.
- Ingen annan data sparas klient-side (ingen cache av kommentarer — alltid färsk fetch).

## Filstruktur

### Nya filer
```
pages/api/comments/index.js        # GET, POST
pages/api/comments/[id].js         # PATCH, DELETE
pages/api/admin/login.js
pages/api/admin/logout.js
lib/auth.js                        # HMAC sign/verify
lib/comments.js                    # Vercel Blob helpers
components/CommentLayer.jsx        # Klient-huvudkomponent
components/CommentPillar.jsx       # En pillare
components/CommentForm.jsx         # Skapa/redigera-formulär
components/AdminLock.jsx           # Låsikon + login-modal
components/CommentLayer.module.css
lib/anchor.js                      # Genererar data-comment-anchor
.env.local.example
```

### Ändrade filer
```
pages/index.js                     # Lägger <CommentLayer /> efter body-div
package.json                       # + @vercel/blob
README.md                          # Uppdaterade setup-instruktioner
```

## Kantfall

| Fall | Beteende |
|------|----------|
| Två användare skriver samtidigt | Var sin fil skapas, ingen kollision |
| Admin redigerar medan annan skriver | Olika filer, ingen kollision |
| Innehåll ändras via GitHub | Ankare består om första 30 tecken intakt; annars "föräldralös" |
| Ankarelement raderas helt | Kommentar visas i "Föräldralösa"-panelen |
| Fel initialer (tomt/för långt) | Validering klient + server, felmeddelande |
| Admin-cookie går ut mitt i session | Nästa admin-åtgärd returnerar 401; UI visar "logga in igen" |
| Blob-token saknas | API-route returnerar 500 med tydligt felmeddelande; klienten visar felbanner |
| Skräp-kommentar | Admin raderar. Ingen rate limiting initialt. |
| Samma initialer från olika personer | Accepteras. Initialer är identifiering, inte autentisering. |

## Säkerhet

- `BLOB_READ_WRITE_TOKEN` används endast server-side i API-routes.
- Admin-lösenord jämförs med `crypto.timingSafeEqual`.
- HMAC förhindrar förfalskad admin-cookie.
- Ingen XSS-risk: kommentartext renderas som `textContent`, aldrig som HTML.
- CSRF: POST-endpoints är avsiktligt öppna för skapande; DELETE/PATCH kräver cookie — eftersom admin är enda privilegierade användaren och attacken skulle kräva att admin besöker en illvillig sida medan inloggad, bedöms risken låg för internt dokument. Om det blir en oro kan CSRF-token läggas till senare.

## Utanför scope (YAGNI)

- Trådar / svar på kommentarer
- @-mentions
- Notifikationer (email/push)
- Realtidsuppdatering (polling/WebSocket) — användaren får ladda om för att se andras nya kommentarer
- Textmarkering som ankare
- Redigering av egna kommentarer som icke-admin
- Export / backup (Vercel Blob ger detta direkt)
- Rate limiting
- i18n — allt på svenska

## Testplan (manuell)

1. Skapa kommentar som vanlig användare → syns direkt → består efter reload
2. Skapa från två webbläsare samtidigt → båda persisteras
3. Hovra pillar → linje + highlight. Hovra element → pillar highlightas.
4. Försök PATCH/DELETE utan admin-cookie → 401
5. Login som admin → redigera text → syns uppdaterat → radera → försvinner
6. Ändra text i `lokalforsorjning.html` minimalt via GitHub → deploya → kommentarens ankare består
7. Ändra text kraftigt → kommentar hamnar i "Föräldralösa"-panelen, ej förlorad
8. Logga in, vänta tills cookie går ut (testa med kort expiry), försök radera → 401 och UI ber om ny login
9. Mobilvy: ingen marginal, bubbla i elementet, drawer fungerar
10. Initialer förfylls från localStorage vid andra besöket

## Öppna beslut att bekräfta i implementationsplanen

- Exakt CSS-layout för marginalen (om 240 px är rätt, eller t.ex. 200/280)
- Färgval för pillare (hur HSL-hashen mappas)
- Hur "relativ tid" uppdateras (bara vid render, eller intervall)
