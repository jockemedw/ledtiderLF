# Brief: årlig mjukkontroll av källregistret

Återkommande lättviktskontroll av `data/kallregister.json` och `data/siffror.json` — URL-hälsa och nyare utgåvor, inte full innehållsverifiering. Full metod ("hårdkontroll", nivå 1–4) beskrivs i `docs/hardkontroll-2026-08-26.md` och körs bara vid behov.

## När

Varje höst, efter att Nationellt Ledtidsindex (september) och bolagens årsredovisningar (mars–april) publicerats. Schemalagd rutin finns; kan även köras manuellt genom att ge Claude Code denna fil.

## Vad som kontrolleras

1. **URL-hälsa (alla källor):** hämta varje `url`; klassa 200 / redirect / soft-404 / 404 / paywall. Trasiga URL:er: sök verifierad ersättning, byt `url`, notera gammal URL i `hardkontroll.not`.
2. **Nyare utgåvor (periodiska källor):** typ `branschindex`, `statistik`, `kommunal-plan` med årtal, samt bolagens årsredovisningar. En webbsökning per källa. Ny utgåva som ändrar nyckeltalsvärden → uppdatera nyckeltalet + lägg ny källpost; annars → notera i `hardkontroll.not`.
3. **Uppdatera hardkontroll-fälten:** nytt `datum` på kontrollerade poster; status enligt samma semantik som hårdkontrollen (godkand/anmarkning/underkand/ej-kontrollerbar; underkand endast när fungerande källa saknas).
4. **Olösta punkter:** gå igenom listan i senaste hårdkontroll-/mjukkontrollrapporten — har nytt underlag dykt upp?

## Arbetssätt

- Batcha källorna per område på parallella agenter (~15–20 källor per agent), samma outputschema som hårdkontrollens fas A.
- PDF:er: ladda ner och läs selektivt. Teknisk blockering → `ej-kontrollerbar`, aldrig gissad status.
- `npm test` ska vara grön (schematesterna i `lib/__tests__/data-integrity.test.js` låser formatet) och `npx next build` felfri före push.
- Leverans: uppdaterade JSON-filer + rapport `docs/mjukkontroll-YYYY-MM-DD.md` (sammanfattningstabell, ändringslogg, olösta punkter) + PR mot `main`.

## Avgränsning

Ingen omskrivning av HTML-innehåll utöver rena sifferrättelser när ett nyckeltalsvärde ändras (dubbletterna i `lokalforsorjning.html`/`detaljplan.html`/`scripts/popular-slides.json` ska hållas i synk). Större innehållsändringar föreslås i rapporten i stället.
