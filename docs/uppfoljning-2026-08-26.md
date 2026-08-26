# Uppföljning 2026-08-26 — beläggning av hårdkontrollens olösta punkter

**Genomförd:** 2026-08-26, samma dag som huvudrundan (`docs/hardkontroll-2026-08-26.md`), 2 research-agenter + huvudsession.
**Branch:** `claude/fact-check-source-registry-jd15xd` (omstartad från main efter PR #23).

## Utfall per olöst punkt

| Punkt | Utfall |
|---|---|
| Spår A–D-ledtiderna | **Delvis belagda.** Ny nyckelkälla: Lekebergs kommuns Strategiska LFP 2021–2031, Tabell 1 "tidsåtgång för olika moment i byggprocessen" (s. 10–11, remissversion) — momentsumma ca 2–4 år utan planändring, "upp till fem år" för nybyggnad utan DP. Spår B, C, D (bef. DP) och D (ny DP, med Malmös LFP "cirka 6–8 år") uppgraderade till preliminär med källor. Spår A och A2 förblir ärligt ej verifierbara — märkta som erfarenhetsvärden. |
| LSS Dunkehalla 5 vs 6 lgh | **Avgjort: 5 lägenheter** (ByggfaktaDOCU-projektdata, konsekvent i tre oberoende index; Jönköpings KBFP-uppföljning anger 5–6 lgh som norm). `kr-plats-lss` rättad 3,3–5,0 → **4,0–6,0 mkr/lgh**; etikett och mönsterpåståenden i HTML justerade till 5–6 lgh; Dunkehalla åberopas inte längre för sexlägenhetsmönstret. LSS byggtid stärkt med Örnsköldsvik Domsjö (2 gruppbostäder, 12 lgh, ca 16 mån). |
| "9 000 elevplatser" | Kvarstår olöst (ingick ej i denna runda — kräver identifiering av rätt LFP-version). |
| Smedbyskolans BTA | **Löst, med rättelse:** kommunens invigningsnyhet (Wayback-kopian nu läst i fulltext) anger **8 819 m²** — inte 7 850, som var en hopblandning med Kungsängsskolan (5 862 + 1 995 = 7 857). 252 mkr / 8 819 ≈ 28 600 kr/m². `kr-grundskola-medel` rättad till ca 28 500–35 000 kr/m² BTA; sammandrag och DATA-blockets insikt uppdaterade. |
| kr-plats-forskola | **Rättad:** de ociterade referensprojekten identifierade — Lingatan/Uddevalla (fd Källdal; 80 mkr / 180 barn ≈ 440 tkr) och Nyfiken/Kumla (ca 90 mkr / 148 platser ≈ 610 tkr). Med Grillby (≈ 420 tkr) blir belagt intervall **ca 400 000–650 000 kr/plats** — gamla 650 000–900 000 saknade stöd. |
| "44 mån mediantid" | **Obelagd — ersatt.** Ingen källa anger 44 mån median; närmast belagda är Ledtidsindex 2025 (s. 14): **46 mån i genomsnitt** planuppdrag → laga kraft (flerbostadshusplaner 2017–2024). Fyra förekomster rättade (prov-stat nedgraderad till preliminär, Gantt-kommentar, begränsningslista, popular-slides). Även obelagda "13 % under 1 år" ersatt med SKR:s belagda "ca 40 % klarar ≤2 år". |
| kr-idrottshall | **Belagd, intervallet höjt:** tre kommunala hallar 2023–2026 (Bergsjö/Nordanstig 43 mkr/1 850 m² ≈ 23 tkr, Listerby/Ronneby 60 mkr/1 600 m² ≈ 37,5 tkr, Hallsberg 45–60 mkr) ger **ca 23 000–38 000 kr/m² BTA** i stället för 18 000–25 000. |

## Registerändringar

- 13 nya källposter (Lekebergs LFP, Örnsköldsvik Domsjö, Sandvikens omsorgs-LFP, Uddevalla/Kumla/Hallsberg/Ronneby/Nordanstig-projekten, Jönköpings KBFP m.fl.).
- 13 nyckeltal uppdaterade (nya värden, källor, noter, verifieringsstatus); `ledtid-total-grundskola-ombyggnad` (tillkom i PR #22) kompletterad med hardkontroll-spår.
- Verifieringsläge efter uppföljningen: se `/nyckeltal` — flera ledtidsposter lyfta från ej verifierbar till preliminär; endast genuina erfarenhetsvärden kvarstår som ej verifierbara.

## Årlig mjukkontroll inrättad

Brief: `docs/mjukkontroll-brief.md`. Schemalagd rutin körs 1 oktober varje år (efter Ledtidsindex-släppet): URL-hälsa + nyare utgåvor + rapport + PR. Obs: den schemalagda sessionen pushar branchen men kan sakna GitHub-verktyg för att öppna PR — kontrollera efter körning.

## Kvarstående

- "9 000+ elevplatser" — identifiera källdokument.
- Spår A/A2 — belägg saknas i öppna källor; överväg Lejonfastigheters egna projektdata.
- Lekebergs LFP är remissversion i möteshandlingar — byt till antagen version om/när den publiceras.
- ByggfaktaDOCU-uppgifterna (Dunkehalla, Kumla) vilar på sökindex — därav preliminär, inte verifierad.
