# CLAUDE.md

Projektregler för Claude Code som arbetar med det här repot.

## Branch-policy

- **Pusha direkt till `main`** för det här repot — ingen feature-branch krävs.
- Om direktpush blockeras (HTTP 403 från branch protection), använd en kort-livad branch och merga PR:n omedelbart efter att CI är grön. Inga långlevande branches.
- Vercel auto-deployar `main` → produktion. Inget extra deploy-steg behövs.

## Vad är detta

Lokalförsörjningsguide för Lejonfastigheter AB — Next.js-app som serverar `lokalforsorjning.html` och undersidor (`/detaljplan`, `/kallregister`, `/nyckeltal`, `/skraddarsydd`) med ett React-lager för kommentarer och plock-läget (Sammanställ). Innehåll i HTML-filerna; data i `data/*.json`.

## Kommandon

- `npm test` — vitest, alla `lib/__tests__/**/*.test.js`. Ska alltid vara grön innan commit.
- `npx next build` — Next.js produktionsbygge. Verifiera utan fel innan push.
- `npm run pptx` — bygg populärversion .pptx från `scripts/popular-slides.json`.

## Konventioner

- Användarvänd text på **svenska**.
- Skriv så lite kod som möjligt; inga onödiga abstraktioner.
- Inga emojier i kod eller dokument om inte explicit ombedd.
- HTML-innehåll redigeras direkt i `lokalforsorjning.html` / `detaljplan.html`.
- Källor i `data/kallregister.json`, nyckeltal i `data/siffror.json` — följ befintligt schema.
- Källhänvisning per påstående: sätt `data-kalla="<id> <id>"` på elementet (eller på dess `<cite>`). Id:t är antingen ett käll-id ur `kallregister.json` eller ett nyckeltal-id ur `siffror.json` — nyckeltalet expanderas till sina `kalla_ids`. För JS-renderade kort läggs `kalla_ids: [...]` i `DATA` och skrivs ut med `kallAttr()`.

## Risker att undvika

- Inte ta bort `data-verifiering`-attribut även om Källstatus-toggle är borttagen — inerta nu men sparar bråk vid eventuell återinföring.
- Inte introducera diagram-bibliotek utan att fråga — `/nyckeltal` är medvetet tabell-baserad.
- Inte committa `dist/` (gitignored).
- Inte skriva `data-kalla` med id som saknas i registret — `lib/__tests__/kallhanvisning.test.js` fäller bygget, och länken skulle peka på ett tomt ankare.
