# Hårdkontroll 2026-08-26 — faktagranskning av källregister, nyckeltal och HTML-påståenden

**Genomförd:** 2026-08-26 (13 granskningsagenter i tre faser + huvudsession)
**Branch:** `claude/fact-check-source-registry-jd15xd` (PR #23)
**Omfattning:** samtliga källor i `data/kallregister.json`, samtliga nyckeltal i `data/siffror.json`, samtliga faktapåståenden i `lokalforsorjning.html`, `detaljplan.html` och `scripts/popular-slides.json`.

## Sammanfattning

| Fas | Objekt | Kontrollerade | Godkända/korrekta | Anmärkning | Underkända/avvikelse | Ej kontrollerbara |
|---|---|---:|---:|---:|---:|---:|
| A (URL + metadata) | Källor | 111 | 42* | 78* | 2 | 2 |
| B (värde mot källa) | Nyckeltal | 97 | 63 verifierade | 17 preliminära | — | 17 ej verifierbara |
| C (HTML-påståenden) | Påståenden | 132 | 83 korrekta | — | 25 avvikelser (alla rättade) | 24 ej verifierbara |

\* Efter rättelse: källor vars döda URL ersatts med ett verifierat ersättningsdokument räknas som *anmärkning* (historiken står i `hardkontroll.not`). Endast poster som fortfarande saknar fungerande källa är *underkända*: `skr-overklaganden-portal` och `jonkoping-dunkehalla-lss-2024`. Ej kontrollerbara (teknisk blockering): `lund-strategisk-lfp-2024-2033` (TCP-reset mot moten.lund.se), `motala-vatternskolan-2025` (bot-blockering).

Registret växte under granskningen från 111 till **124 källor** — 13 nya poster lades till för uppgifter som saknade nåbar primärkälla.

## Nytt schema

- Varje källa har `hardkontroll: {status, datum, metod, not}` med status `godkand | anmarkning | underkand | ej-kontrollerbar`. Visas som badge på `/kallregister` med filter "Endast hårdkontrollerade".
- Varje nyckeltal har `hardkontroll: {datum, not}`; `verifiering`-enum utökad med `ej-verifierbar` (källan säger inte detta / går inte att kontrollera). Hårdkontrollens datum och not visas som tooltip på statuskolumnen på `/nyckeltal`.
- `lib/__tests__/data-integrity.test.js` låser schemat: obligatoriska fält, https-URL, känd typ, giltig hardkontroll-status/metod/datum, not-krav vid icke-godkänd, källkrav för nyckeltal.

## Centrala fynd

1. **Kapad domän:** `norrevo.se` serverar numera en casinoaffiliatesajt — URL utbytt mot Norrköpings kommuns sida. Värsta enskilda fyndet; visar varför URL-hälsokontroll behövs.
2. **SKR:s webbomläggning har dödat minst sex länkar** (strategisk lokalresursplanering, produktionskostnad skolor, flexibla grundskolor, FoU-fonden, beställarvänlig samverkan, överklagandeportalen). Fem har verifierade ersättningar på extra.skr.se/skr.se; portalen saknar ersättning. Flera "SKR"-publikationer visade sig dessutom vara utgivna av SKL åratal tidigare än angivet (produktionskostnad skolor: 2016, inte 2017; LOU-vägledningen: 2019, inte 2021).
3. **Två årsredovisnings-URL:er levererade fel bolags dokument:** Vacses pekade på NP3 Fastigheters ÅR, Stenvalvets på en banks. Båda utbytta mot verifierade original.
4. **Sakfel rättade i innehållet:** vård- och omsorgsboenden är verksamhetsklass **5B** (inte 5A); Akademiska Hus klimatminskning är **−64 %** mot 2019 (inte ca −50 %); Boverkets PBL-uppföljning bygger på **286** kommuner (inte 285); Kista Äng-skolan är **9 073 m²** enligt pressmeddelandet (inte antaget 12 000–14 000, vilket ger ~42 000 kr/m², inte 27 000–32 000).
5. **PBL omnumrerad dec 2025:** tidsbegränsat bygglov ligger nu i **9 kap. 71–72 §§** (tidigare 33/33 a §§, Lag 2026:504). Sakinnehållet (10 + 5 år, max 15) är oförändrat. Alla lagrumshänvisningar i materialet uppdaterade; 5 kap. och 13 kap. berördes inte av omnumreringen.
6. **+14 månader vid överklagad detaljplan är nu verifierad** — återfinns ordagrant på s. 18 i både Evidens 2022 och Evidens 2023 (rapporten återfunnen hos Evidens efter att SKR:s länk dött). Caveat "avser bostadsplaner" står kvar. Däremot är **MMD-mediantiden ~6 månader obelagd** — Domstolsstatistik särredovisar inte PBL-målens omloppstider; belagd siffra är Evidens snitt 5,5 mån (2021), och materialet är omskrivet därefter.
7. **Klimatdeklarationens tidplan är nu formellt slutredovisad:** Boverket lämnade förslaget 20 maj 2026 (rapport 2026:16) — livscykel-GWP från 2028 (>1 000 m²), gränsvärden 2030, kraven flyttas till PBL. Den tidigare falsk-markerade meta-raden är rättad; påhittade "−25 % från 2025-nivån" struken ur HTML.
8. **Linköpings hyresnota 1 392 → 1 666 mnkr (+21 %) är belagd** — men i Kommungemensam LFP 2024–2033 (s. 24, KS dec 2023), inte i dec 2024-revisionen (som anger 1 353/1 453 mkr). Nyckeltal och cite ompekade. Budget-sammandragets "50 % egenfinansiering", "39 mnkr BoU" och "25 mnkr LSS" kunde inte återfinnas i budgetdokumentet utan är belagda via kommunens budgetpressmeddelande (ny källpost).
9. **BKI har vänt:** −0,2 % (feb 2025) är historik; juli 2026 visar **+3,2 %** i årstakt. Statistiknyheten för feb 2025 tillagd som permanent källa eftersom SCB:s landningssida bara visar senaste utfallet.
10. **LSS-underlaget är svagt:** enda källan (ByggfaktaDOCU Dunkehalla) är borttagen, och indirekta uppgifter anger **5 lägenheter, inte 6** — vilket rubbar kr/lägenhet-beräkningen. Alla tre LSS-nyckeltal är nedgraderade till ej-verifierbar i väntan på nåbar källa (t.ex. Jönköpings kommuns upphandlingsdokument).
11. **Nyare utgåvor finns för ett trettiotal periodiska källor** (ÅR 2025 för samtliga bolag, Ledtidsindex 2025 är fortsatt senaste, Boverkets PBL-uppföljning 2026:15, Skolverket 2025/26 med nytt minskningsrekord −9 900 elever, Kommuninvest 2025 med skuld 959 mdkr). Noterade i `hardkontroll.not` per källa; värden uppdaterade där de påverkar nyckeltal.
12. **Spår A–D-ledtiderna vilar på en borttagen SKR-sida** vars ersättningssida saknar ledtidsangivelser — nedgraderade till ej-verifierbar (utom spår D med ny DP som stöds av Ledtidsindex). Detta är materialets viktigaste kvarstående källucka.

## Verifieringsstatus efter hårdkontrollen

`/nyckeltal`: 63 verifierade · 17 preliminära · 17 ej verifierbara · 0 falska.
`/kallregister`: 42 godkända · 78 anmärkningar · 2 underkända · 2 ej kontrollerbara (124 källor).

Semantiken efter körningen: **verifierad** = värdet återfunnet i angiven källa vid hårdkontrollen; **preliminär** = ej direkt återfunnet men rimligt stött; **ej verifierbar** = källan säger inte detta eller går inte att nå; **falsk** = motsagd av källan (alla tidigare falska är rättade).

## Värdesrättelser i nyckeltalen (före → efter)

| Nyckeltal | Före | Efter |
|---|---|---|
| `kli-akademiska-hus-utslapp` | ca −50 % | **−64 %** (AR 2024 s. 7–8: 82 827 → 29 653 ton CO2e mot 2019) |
| `kr-grundskola-stor` | 27 000–32 000 kr/m² BTA | **25 000–36 000 kr/m² BTA** (Vallås 470 mkr/18 600 m²; Kvarngärdesskolan slutbudget 575 mkr/15 898 m²) |
| `kr-plats-f9-stor` | ~450 000–550 000 kr/elev | **450 000–580 000 kr/elev** (Kvarngärdesskolans slutbudget) |
| `akt-specialfastigheter-bestand` | 1,1 mn m² (174 fast.) | **≈1,2 mn m² (176 fast.)** (AR 2024) |
| `ver-klimat-tidplan` | Falsk — tidplanen ändrad | **Rättad — utökad deklaration 2028, gränsvärden 2030 (slutredovisat maj 2026)** |
| `ver-linkoping-hyresnota` | Verifierad (mot fel dokument) | **Verifierad — LFP 2024–2033 s. 24** |
| `ver-linkoping-9000` | Preliminär (primärkälla blockerad) | **Ej verifierbar — siffran finns inte i åtkomlig LFP-PDF** |

Datumrättelser: Grillby förskola 2024 → 2021-10; Sala modulskola 2017 → 2018-07 (två nyckeltal); Linköpings hyresnota → 2023-12.

## Olösta punkter

- **Spår A–D-ledtiderna** (3–12 mån / 2–5 år / 2–3,5 år / 2,5–4 år) saknar nåbar källa sedan SKR:s omläggning. Intervallens rimlighet är obestridd men bör beläggas — t.ex. via SKR:s nya "Verksamhetslokaler, planering"-material eller egna projektdata från Lejonfastigheter.
- **LSS-nyckeltalen**: skaffa nåbar primärkälla (Jönköpings kommun) och ta ställning till 5 vs 6 lägenheter.
- **`ver-linkoping-9000`** ("9 000+ elevplatser"): identifiera vilket dokument siffran kommer från.
- **Smedbyskolans BTA 7 850 m²** och **idrottshallsintervallet 18 000–25 000 kr/m²** saknar nåbar primärkälla.
- **kr-plats-forskola 650 000–900 000 kr/plats**: motsägs av Grillby (160 platser → ~420 000 kr/plats); bör räknas om med belagda projekt.
- **"44 mån mediantid"** i lokalforsorjning.html och popular-slides är markerad verifierad men kunde inte beläggas i underlaget.
- SKR:s nya insamling 2024–2025 (40 % ≤2 år, 25 % överklagas; uppdaterad 2026-06-08) kan arbetas in i #dp-skr-sektionen.
- Nyare utgåvor (ÅR 2025 m.fl.) är noterade per källa men inte inarbetade som nya källposter annat än där de ändrar nyckeltal — årlig uppdateringsrunda rekommenderas.
- Wayback-URL:er (Smedbyskolan, Adda 2018) kunde inte verifieras från byggmiljön (web.archive.org blockerat) men fungerar i webbläsare.

## Metod

- **Fas A (7 agenter):** varje käll-URL hämtad (WebFetch/curl; PDF:er nedladdade och lästa), klassad (200/redirect/soft-404/404/paywall), metadata verifierad mot dokumentet, en webbsökning efter nyare utgåva för periodiska källor. Aldrig gissad status — teknisk blockering ger `ej-kontrollerbar`.
- **Fas B (4 agenter):** varje nyckeltals värde uppsökt i den citerade källan (ofta i fas A:s nedladdade PDF:er med sidhänvisning), caveats kontrollerade, nyare utgåvor vägda in. Tomma källistor kompletterade eller nedgraderade.
- **Fas C (2 agenter):** alla siffror, citat, lagrum och data-verifiering-attribut i HTML granskade mot de färdigkontrollerade registren, Evidens-rapporterna och riksdagens konsoliderade PBL. Endast faktarättelser — varje ändring som exakt strängbyte, maskinverifierat mot en (1) träff före applicering. `data-verifiering`-attributen bevarade; endast status/noter uppdaterade.

De fullständiga fyndtabellerna följer nedan; agenternas råa JSON-resultat finns i sessionens arbetskataloger och sammanfattas här i sin helhet.

## Ändringslogg fas C (HTML): före → efter

### lokalforsorjning.html

- **#jamforelse (gantt-bench-rad '+14 månader')**
  - Före: `data-verifiering="preliminar" data-verifiering-not="Snittsiffran +14 mån avser bostadsplaner (Evidens/Arkwright 2022). Motsvarande siffra specifikt för samhällsfastigheter saknas i öppen statistik."`
  - Efter: `data-verifiering="verifierad" data-verifiering-not="Siffran återfinns ordagrant i Evidens 2022 (s. 18) och Evidens 2023 (s. 18). Avser bostadsplaner — motsvarande siffra specifikt för samhällsfastigheter saknas i öppe…`
- **#jamforelse (gantt-note)**
  - Före: `4,8 år för enbart detaljplanen`
  - Efter: `4,8 år från planuppdrag till startbesked`
- **#hierarki (nivå 4 Nybyggnation)**
  - Före: `vilket ensamt kan ta 2–5 år enligt SKR`
  - Efter: `vilket ensamt kan ta 2–5 år`
- **DATA.spar (A, begränsningar)**
  - Före: `"Vård och omsorg: verksamhetsklass 5A (begränsad utrymningsförmåga) — höga brandskyddskrav",`
  - Efter: `"Vård och omsorg: verksamhetsklass 5B (begränsad förmåga att sätta sig i säkerhet) — höga brandskyddskrav",`
- **#provning (prov-stats '+14 mån')**
  - Före: `data-verifiering="preliminar" data-verifiering-not="Snittsiffran avser bostadsplaner (Evidens/Arkwright 2022) — siffra för samhällsfastigheter saknas i öppen statistik."`
  - Efter: `data-verifiering="verifierad" data-verifiering-not="Ordagrant belagd i Evidens 2022 (s. 18) och Evidens 2023 (s. 18). Avser bostadsplaner — siffra för samhällsfastigheter saknas i öppen statistik."`
- **#provning (prov-steg 6, laga kraft/överklagande)**
  - Före: `(median ~6 månader 2024)`
  - Efter: `(i genomsnitt ~5,5 månader enligt Evidens 2023)`
- **DATA.kontext (kort 'var fjärde detaljplan överklagas')**
  - Före: `Median handläggningstid i mark- och miljödomstol: cirka 6 månader (2024).`
  - Efter: `Handläggningstid i mark- och miljödomstolen: i genomsnitt cirka 5,5 månader (2021, enligt Evidens).`
- **DATA.kontext (kort 'var fjärde', kalla-fält)**
  - Före: `Evidens 2023 (uppdrag SKR/Byggföretagen/Fastighetsägarna) + Sveriges Domstolar 2024`
  - Efter: `Evidens 2023 (uppdrag SKR/Byggföretagen/Fastighetsägarna)`
- **DATA.kontext (kort '3 år bygge — 10 år process')**
  - Före: `      kalla: "Uppsala Skolfastigheter, Uppsala kommun", ⏎       verifiering: "verifierad"`
  - Efter: `      kalla: "Uppsala Skolfastigheter, Uppsala kommun", ⏎       verifiering: "preliminar", ⏎       verifieringNot: "Byggfasen 3 år (2022–2025) är källbelagd. 10-årstotalen (detaljplan 2015, laga kraft 2020) och PQi-ut…`
- **#kostnad (kostnad-key 'Linköpings kontext', cite)**
  - Före: `Kommungemensam lokalförsörjningsplan dec 2024 + Linköpings budget 2025–2030`
  - Efter: `Kommungemensam lokalförsörjningsplan 2024–2033 (KS dec 2023) + Linköpings budget 2025–2030`
- **#kostnad (kostnad-key 'EPBD-recast', klimatdeklarationstidplan)**
  - Före: `(-25 % från 2025-nivån)`
  - Efter: `(slutredovisat av Boverket 20 maj 2026, rapport 2026:16)`
- **#kostnad (kostnad-key 'EPBD-recast', cite)**
  - Före: `+ SKR-PM EED/EPBD okt 2025 + Boverket aug 2025`
  - Efter: `+ SKR-PM EED/EPBD okt 2025 + Boverket maj 2026 (rapport 2026:16)`

### detaljplan.html

- **dp-tldr, kort 1 (attribut)**
  - Före: `<div class="dp-num-kort" data-verifiering="preliminar" data-verifiering-not="Ledtidsindex avser flerbostadshus, inte lokalförsörjning. Vägledande siffra — direkt jämförelse med skol-/förskoleplaner kräver kompletteran…`
  - Efter: `<div class="dp-num-kort" data-verifiering="verifierad" data-verifiering-not="Ledtidsindex avser flerbostadshus, inte lokalförsörjning. Siffran är verifierad mot källan (Ledtidsindex 2025), men direkt jämförelse med sk…`
- **dp-tldr, kort 3 (attribut)**
  - Före: `<div class="dp-num-kort" data-verifiering="preliminar" data-verifiering-not="Snittsiffran avser bostadsplaner — motsvarande siffra specifikt för samhällsfastigheter saknas i öppen statistik.">`
  - Efter: `<div class="dp-num-kort" data-verifiering="verifierad" data-verifiering-not="Verifierad i Evidens 2022 (s. 18) och Evidens 2023 (s. 18). Snittsiffran avser bostadsplaner — motsvarande siffra specifikt för samhällsfast…`
- **dp-process, skede 7 (Eventuellt överklagande)**
  - Före: `MMD i första instans (median <strong>ca 6 mån</strong> 2024), MÖD i andra.`
  - Efter: `MMD i första instans (snitt <strong>ca 5,5 mån</strong>, Evidens 2023), MÖD i andra.`
- **dp-lagval, lagkort (domstolens prövning)**
  - Före: `<strong>Domstolens prövning</strong> ~8 månader i MMD i snitt — ligger helt utanför kommunens kontroll.`
  - Efter: `<strong>Domstolens prövning</strong> ~8 månader total domstolstid i snitt för en överklagad plan (MMD ca 5,5 mån + del av MÖD, Evidens 2023) — ligger helt utanför kommunens kontroll.`
- **dp-lagval, valkort (bemanning)**
  - Före: `<strong>Bemanning på planenheten.</strong> 7 av 10 kommuner anger att resursbrist är den enskilt största flaskhalsen.`
  - Efter: `<strong>Bemanning på planenheten.</strong> 7 av 10 kommuner har detaljplaner som står i kö innan handläggning kan påbörjas — ofta till följd av resursbrist.`
- **dp-overklagande, kort '+14 mån' (attribut)**
  - Före: `<div class="dp-effekt" data-verifiering="preliminar" data-verifiering-not="Snittsiffran avser bostadsplaner — motsvarande siffra specifikt för samhällsfastigheter saknas i öppen statistik.">`
  - Efter: `<div class="dp-effekt" data-verifiering="verifierad" data-verifiering-not="Verifierad i Evidens 2022 (s. 18) och Evidens 2023 (s. 18). Snittsiffran avser bostadsplaner — motsvarande siffra specifikt för samhällsfastig…`
- **dp-overklagande, kort '~6 mån' (attribut + text)**
  - Före: `<div class="dp-effekt" data-verifiering="verifierad"> ⏎         <div class="siffra">~6 mån</div> ⏎         <span class="label">Mark- och miljödomstolen</span> ⏎         <p>Median omloppstid för mål i mark- och miljödo…`
  - Efter: `<div class="dp-effekt" data-verifiering="preliminar" data-verifiering-not="Domstolsstatistik 2024/2025 särredovisar inte omloppstider för MMD:s PBL-mål. Närmaste belagda siffra: Evidens 2023 — i genomsnitt 5,5 mån i M…`
- **dp-overklagande, kort '3–3,5 mån' (attribut)**
  - Före: `<div class="dp-effekt" data-verifiering="preliminar" data-verifiering-not="Spannet 3–3,5 mån för avvisade ärenden behöver verifieras mot Sveriges Domstolars senaste statistik.">`
  - Efter: `<div class="dp-effekt" data-verifiering="verifierad" data-verifiering-not="Belagd i Evidens 2023 (s. 7): avvisade överklaganden i MMD och nekade prövningstillstånd i MÖD ligger på 3–3,5 månaders ledtid. Avser detaljpl…`
- **dp-overklagande (dp-citat)**
  - Före: `<cite>— Sammanfattning av analysen i SKR/Domstolarnas underlag om handläggningstider</cite>`
  - Efter: `<cite>— Sammanfattning av analysen i Evidens rapport Överklagande av detaljplaner (2023)</cite>`
- **dp-konsekvenser, kort 3 (moduler, lagrum)**
  - Före: `Tidsbegränsade bygglov enligt <strong>9 kap. 33 § PBL</strong> kan ge moduler i upp till 10 år, förlängningsbart till 15 år.`
  - Efter: `Tidsbegränsade bygglov enligt <strong>9 kap. 71–72 §§ PBL</strong> (före december 2025: 9 kap. 33 §) kan ge moduler i upp till 10 år, förlängningsbart till 15 år.`
- **dp-kallor, kort SKR (länk)**
  - Före: `<a href="https://skr.se/skr/samhallsplaneringinfrastruktur/planeringbyggandebostad/fysiskplanering/jamforelserinomdetaljplaneomradet2024.82109.html" target="_blank" rel="noopener">SKR.se →</a>`
  - Efter: `<a href="https://skr.se/byggandeochbostaderplanering/jamforelserinomdetaljplaneomradet.9842.html" target="_blank" rel="noopener">SKR.se →</a>`
- **dp-kallor, kort Boverket 2025:11**
  - Före: `<p>Boverkets årliga uppföljning av plan- och bygglagstiftningens tillämpning. Underlag från 285 av Sveriges 290 kommuner.</p>`
  - Efter: `<p>Boverkets årliga uppföljning av plan- och bygglagstiftningens tillämpning. Underlag från 286 av Sveriges 290 kommuner.</p>`
- **dp-kallor, kort PBL (lagrum)**
  - Före: `<p>Bl.a. 5 kap. (detaljplaner), 9 kap. 33 § (tidsbegränsat bygglov), 13 kap. (överklagande). Den juridiska ramen för hela processen.</p>`
  - Efter: `<p>Bl.a. 5 kap. (detaljplaner), 9 kap. 71–72 §§ (tidsbegränsat bygglov, före december 2025: 9 kap. 33 §), 13 kap. (överklagande). Den juridiska ramen för hela processen.</p>`

## Påståendeinventering fas C

### lokalforsorjning.html

| Plats | Påstående | Typ | Status | Källa |
|---|---|---|---|---|
| #intro (hero-ingress) | Att tillgodose ett lokalbehov tar allt från tre månader till åtta år | siffra | korrekt | siffror.json: ledtid-spar-a (3–12 mån) och ledtid-spar-d-… |
| #sammanfattning (tldr-kort '~7 år') | ~7 år för en ny skola — Lunds kommun anger detta som genomsnitt; byggfasen 2–3 år | citat | korrekt | lund.se 'Bygget av en ny förskola eller skola' (verifiera… |
| #sammanfattning (tldr-kort '70–80 %') | 70–80 % av kostnaden låses tidigt — markerad preliminar med not om MacLeamy/CURT/Paulson | attribut | korrekt | siffror.json: ver-80-procent, kr-kostnadssankning-tidplan |
| #jamforelse (gantt-bench-rad '4,8 år') | 4,8 år riksgenomsnitt planuppdrag → startbesked, 52 kommuner — med preliminar-not om flerbostadshus ≥ 5 lgh | siffra | korrekt | siffror.json: ledtid-detaljplan-snitt-2025 (verifierad) |
| #jamforelse (gantt-bench-rad '+14 månader') | data-verifiering='preliminar' på +14 mån vid överklagad detaljplan | attribut | avvikelse | siffror.json: ledtid-overklagande, ver-14-man (uppgradera… |
| #jamforelse (gantt-bench-rad '+14 månader', brödtext) | ~25 % av antagna detaljplaner överklagas i Sverige | siffra | korrekt | kallregister: skr-jamforelser-detaljplan (6:e undersöknin… |
| #jamforelse (gantt-note) | Bygg i Tids riksgenomsnitt på 4,8 år för enbart detaljplanen | siffra | avvikelse | fasB resultat-1 (ledtid-spar-d-nydp): Ledtidsindex 2025 —… |
| #jamforelse (gantt-note) | Långdragna LOU-upphandlingar +2–12 mån tillkommer | siffra | ej-verifierbar | saknar källpost i registret |
| DATA.gantt (staplar) | Normalfall: A1 6 mån, A2 30 mån, B 36 mån, C 30 mån, D 40 mån, D med ny DP 72 mån; förskede 6–24 mån | siffra | korrekt | siffror.json: ledtid-spar-a…ledtid-spar-d-nydp |
| #hierarki (trappan) | Nivåledtider: 3–12 mån / 2–5 år / 2–3,5 år (4–7 år med planändring) / 5–8 år | siffra | korrekt | siffror.json: ledtid-spar-a, ledtid-spar-b, ledtid-spar-c… |
| #hierarki (nivå 4 Nybyggnation) | ny detaljplan … kan ensamt ta 2–5 år enligt SKR | citat | avvikelse | fasB resultat-1: SKR-källan underkänd (404), ersättningss… |
| #per-typ / DATA.lokaltyper (Förskolor) | Total ledtid ≈4–7 år* (härledd: byggfas 21–37 mån + 2–4 år förskede; jfr Krokom 5 år varav 12 mån produktion) | siffra | korrekt | siffror.json: ledtid-total-forskola (preliminär, samma hä… |
| #per-typ / DATA.lokaltyper (Grundskolor F–9) | Total ledtid 7–10 år; Lund ~7 år; Kvarngärdesskolan 10 år varav 3 års byggfas | siffra | korrekt | siffror.json: ledtid-total-grundskola (7–10 år, preliminä… |
| #per-typ / DATA.lokaltyper (Vård- och omsorgsboenden) | Total ledtid 5–9 år från inriktningsbeslut; byggfas 2–3 år; markanvisning→inflytt 11–13 år (Micasas fem senaste projekt) | siffra | korrekt | siffror.json: ledtid-total-vob (5–9 år, preliminär; not: … |
| #per-typ / DATA.lokaltyper (LSS-gruppbostäder) | Total ledtid ≈2–3,5 år*; byggfas 10–15 mån; 6 lgh, 600–850 m²; Socialstyrelsen rek. 3–5 boende; brist i >50 % av kommunerna | siffra | korrekt | siffror.json: ledtid-total-lss (≈2–3,5 år), kr-lss (6 lgh… |
| #per-typ / DATA.lokaltyper (Idrottshallar) | Total ledtid ≈2,5–4 år*; byggfas 12–18 mån; med ny detaljplan gäller spår D (5–8 år) | siffra | korrekt | siffror.json: ledtid-total-idrottshall (≈2,5–4 år, prelim… |
| #per-typ (metodnot) | Urval: 15 SISAB-projekt 2019–2023, Micasa lägesrapport 2025, 8 LSS-/idrottshallsprojekt 2019–2025 | process | ej-verifierbar | SISAB-slutrapporter/meetingspublic (ej i facit-registret) |
| #exempel (aside Framtidens US) | 80 000 m² nybyggnation + 55 000 m² ombyggnation, ca 3,8 mdkr, 2011–2025 (14 år) | siffra | korrekt | siffror.json: ledtid-framtidens-us, akt-region-ostergotla… |
| DATA.exempel (Lägerbålet 1 / Hemlingborg) | Lägerbålet: 90 vårdplatser + 100 förskolebarn, 10 800 m² BTA, 225 mkr, ≈24 mån (klar dec 2026); Hemlingborg: ≈36 mån + ~1 år projektering | siffra | ej-verifierbar | Lejonfastigheters projektkommunikation, RO-Gruppen, ByggP… |
| DATA.exempel (LSS-gruppbostad, spegling + poäng) | Skogsbo/Ludvika/Gimåt-Högland: 6 lgh vardera, 600–850 m², 20–30 mkr, 10–15 mån; 'Dunkehalla/Jönköping (823 m², 2024) … bekräftar interval… | siffra | ej-verifierbar | ByggfaktaDOCU (underkänd i fas A, 404); Dunkehalla 823 m²… |
| DATA.exempel (Förskola: Vallastaden / Krokom) | Vallastaden 72 barn, ≈10 mån bygg (2015–jan 2016); Krokom 5 år från behovsbeslut varav 12 mån produktion | siffra | korrekt | Krokom: siffror.json ledtid-total-forskola-noten; Vallast… |
| DATA.spar (A, scenarier) | A1 hyra in befintlig lokal 3–12 mån; A2 hyresvärdsupphandling 2–4 år | siffra | korrekt | siffror.json: ledtid-spar-a (3–12 mån), ledtid-spar-a2 (2… |
| DATA.spar (A, begränsningar + matris-fotnot) | Hyresundantaget 3 kap. 19 § LOU gäller vanliga hyresavtal men inte när fastighetsägaren bygger för kommunens räkning (byggentreprenad) | juridik | korrekt | siffror.json: ver-lou-hyresundantag (verifierad); SKL-väg… |
| DATA.spar (A, begränsningar) | Strukturellt dyrare: 135–500 MSEK mer än ägande över 33 år (Kommuninvest 2021) | siffra | ej-verifierbar | Kommuninvest 'Samhällsfastigheter — vem hyr vad ifrån vem… |
| DATA.spar (A, begränsningar) | Skola/förskola: pedagogisk yta, utomhusyta, ventilation ≥ 7 l/s/person | siffra | korrekt | Folkhälsomyndighetens allmänna råd om ventilation (FoHMFS… |
| DATA.spar (A, begränsningar) | Vård och omsorg: verksamhetsklass 5A (begränsad utrymningsförmåga) — höga brandskyddskrav | siffra | avvikelse | BBR avsnitt 5:2 / BFS 2024:7: Vk5A = förskola/dagverksamh… |
| DATA.spar (B) | Bygga om 2–5 år utan ny DP; 4–8 år med ny DP; dolda skador kan fördubbla tid och kostnad | siffra | korrekt | siffror.json: ledtid-spar-b (2–5 år; not om dolda skador) |
| DATA.spar (B, begränsningar) | S:t Jörgens skola Helsingborg 17 → 60 MSEK; Futurum-skolan Håbo ~12 år; Järfälla-evakuering underkänd i förvaltningsrätten | siffra | ej-verifierbar | saknar källposter i registret |
| DATA.spar (B, begränsningar) | Byggnader 1940–1982: trolig asbest; 1956–1973: trolig PCB i fogar | siffra | korrekt | Etablerade materialhistoriska intervall (asbestförbud 198… |
| DATA.spar (C) | Tillbyggnad 2–3,5 år inom befintlig DP; 4–7 år med planändring | siffra | korrekt | siffror.json: ledtid-spar-c (2–3,5 år; not: med planändri… |
| DATA.spar (D) | Nybyggnad 2,5–4 år med befintlig DP; 5–8 år med ny DP (normalfall) | siffra | korrekt | siffror.json: ledtid-spar-d-bdp (2,5–4 år), ledtid-spar-d… |
| DATA.spar (D, fas 'Planbesked') | Planbesked: 4 mån lagstadgat | juridik | korrekt | PBL 5 kap. 4 § (riksdagen.se, konsoliderad lagtext kontro… |
| DATA.spar (D) + #provning (prov-stats) | Mediantid detaljplan → laga kraft: 44 månader (2022–2023); andel kommuner under 1 år: 13 % | siffra | ej-verifierbar | sannolikt SKR:s Öppna jämförelser detaljplan (5:e omgånge… |
| DATA.spar (D, fas 'Laga kraft') | Laga kraft 3 veckor efter antagande om ingen överklagar | juridik | korrekt | PBL 13 kap. (överklagandetid tre veckor från tillkännagiv… |
| DATA.spar (D, fas 'Bygglov + startbesked') | Bygglov: max 20 v lagstadgat + tekniskt samråd | juridik | korrekt | PBL: 10 veckors handläggningsfrist + förlängning högst 10… |
| DATA.spar (D, fas 'Byggnation' kommentar) | Förskola 12–24 mån · Skola 18–36 mån · Äldreboende 12–24 mån | siffra | ej-verifierbar | ingen facit-post för byggtidsintervallen |
| DATA.spar (D, begränsningar) | 25 % av alla detaljplaner överklagas; 12 % av överklagandena ändrar planen | siffra | korrekt | kallregister: evidens-overklagande-2023 (24 % 2016–2021, … |
| #moduler (brödtext + modul-kort) | Tidsbegränsat bygglov max 10 år, förlängningsbart till 15; 'veckor' endast vid akuta händelser | juridik | korrekt | siffror.json: ledtid-tidsbegransat-bygglov (10+5=15 år, v… |
| #moduler (modul-kort + varning) | ≈1 700 kr/m²/år (Sala-exemplet) | siffra | korrekt | siffror.json: kr-modulskola-hyra (verifierad; 37 mkr/4 år… |
| #moduler (modul-varning) | ~20 % av Uppsalas förskolor drivs i modulbyggnader; SVT (2021): 'Förskolemodulerna är här för att stanna' | siffra | ej-verifierbar | saknar källpost i registret |
| #provning (prov-stats '4,8 år') | 4,8 år riksgenomsnitt med preliminar-not om flerbostadshus ≥ 5 lgh | attribut | korrekt | siffror.json: ledtid-detaljplan-snitt-2025 + ver-dp-snitt… |
| #provning (prov-stats '+14 mån') | data-verifiering='preliminar' på +14 mån extra ledtid | attribut | avvikelse | siffror.json: ver-14-man (uppgraderad till verifierad) |
| #provning (prov-steg 3, samråd) | Samråd med länsstyrelsen, lantmäterimyndigheten, kända sakägare, boende som berörs samt myndigheter/sammanslutningar med väsentligt intre… | juridik | korrekt | PBL 5 kap. 11 § (riksdagen.se, kontrollerad 2026-08-26) |
| #provning (prov-steg 4, granskning) | Granskningstid minst två veckor vid standardförfarande, minst tre vid utökat; den som inte yttrat sig förlorar i regel rätten att överklaga | juridik | korrekt | PBL 5 kap. 18 § (granskningstid; kontrollerad mot riksdag… |
| #provning (prov-steg 5, antagande) | Planen antas av kommunfullmäktige — vid standardförfarande kan beslutet delegeras till nämnd | juridik | korrekt | PBL 5 kap. 27 § (riksdagen.se, kontrollerad 2026-08-26) |
| #provning (prov-steg 6, laga kraft/överklagande) | Mark- och miljödomstolen: median ~6 månader 2024; vidare till MÖD; +14 mån i snitt | siffra | avvikelse | fasB resultat-1 (ledtid-mmd-omloppstid): Domstolsstatisti… |
| #provning (prov-varfor, 'Styrs av lag') | Länsstyrelsens ingripandegrunder: hälsa och säkerhet, riksintressen, strandskydd, miljökvalitetsnormer | juridik | korrekt | PBL 11 kap. 10 §; fas A (boverket-lansstyrelsen): riksint… |
| #provning (prov-varfor, 'Kommunen kan påverka') | Val av förfarande: standard typiskt 9–18 månader, utökat 18–48 | siffra | ej-verifierbar | ingen facit-post; branschuppskattning |
| DATA.kontext (kort '4,8 år i snitt') | 4,8 år planuppdrag→startbesked; ökning från 4,5 (2023) och 4,7 (2024); 52 kommuner som representerar ~80 % av Sveriges lägenhetsproduktion | siffra | korrekt | siffror.json: ledtid-detaljplan-snitt-2024 (4,7), ledtid-… |
| DATA.kontext (kort 'var fjärde detaljplan överklagas') | Median handläggningstid i mark- och miljödomstol: cirka 6 månader (2024) | siffra | avvikelse | fasB resultat-1 (ledtid-mmd-omloppstid): median för MMD:s… |
| DATA.kontext (kort 'var fjärde', kalla-fält) | Källangivelse '… + Sveriges Domstolar 2024' | citat | avvikelse | fasA resultat-1 (domstolsstatistik-2024): publikationen i… |
| DATA.kontext (kort '~7 år i Lund') + #kontext (blockcitat) | Lund-citatet: 'Den genomsnittliga tiden från tanke till färdig förskola eller skola är ungefär sju år…' | citat | korrekt | lund.se (verifierad ordagrant med WebFetch 2026-08-26) |
| DATA.kontext (kort '3 år bygge — 10 år process') | Kvarngärdesskolan: byggfas 3 år (aug 2022–sep 2025); PQi-utmärkelse 2024 (7 av 150); detaljplan 2015→laga kraft 2020; hela processen ~10 … | attribut | avvikelse | siffror.json: ledtid-byggtid-f9-stor (3 år verifierad), l… |
| DATA.kontext (kort '18–24 mån målbild') | Många kommuner anger 18–24 månader planuppdrag→antagande som riktvärde men når inte målet | siffra | ej-verifierbar | Ledtidsindex (fas A-underlaget nämner i stället målbilden… |
| #kontext (gantt-note 'Primärkällor') | SKR Jämförelser 2024, Boverket rapport 2025:11, Ledtidsindex 2025, Evidens 2023, Lund, Uppsala, Linköping | citat | korrekt | kallregister (samtliga poster finns; Boverket 2025:11 god… |
| #kostnad (kurva + kort '70–80 %') | 70–80 % av kostnaden bunden vid program — markerad preliminar; cite anger branschtolkning av MacLeamy/CURT 2004 och Paulson 1976 | attribut | korrekt | siffror.json: ver-80-procent, kr-kostnadssankning-tidplan… |
| #kostnad (kort 'Planberedskap') | Cite: 'Boverket — strategisk planering för långsiktigt hållbara skolor' (verifierad) | citat | korrekt | fasA resultat-2 (boverket-strategisk-planering): sidan er… |
| #kostnad (kostnad-key 'Linköpings kontext') | Hyresnota ~1 392 mnkr/år → ~1 666 mnkr/år (+21 %) efter LFP-åtgärdspaket; investeringsram 2025: 803 mnkr | siffra | korrekt | siffror.json: dem-linkoping-hyresnota (1 392→1 666, +21 %… |
| #kostnad (kostnad-key 'Linköpings kontext', cite) | Cite: 'Kommungemensam lokalförsörjningsplan dec 2024 + Linköpings budget 2025–2030' | citat | avvikelse | siffror.json: dem-linkoping-hyresnota/ver-linkoping-hyres… |
| #kostnad (kostnad-key 'EPBD-recast') | Nya offentliga byggnader nollutsläpp 2028 (alla nya 2030); solcellsplikt >2 000 m² senast 2027, >750 m² senast 2028; MEPS 16 % 2030 / 26 … | siffra | korrekt | siffror.json: kli-nzeb-offentligt, kli-solceller-2027/202… |
| #kostnad (kostnad-key 'EPBD-recast', klimatdeklarationstidplan) | Gränsvärden senast jan 2030 '(-25 % från 2025-nivån)' | siffra | avvikelse | siffror.json: kli-gransvarde-klimat (hårdkontroll: -25 %-… |
| #kostnad (kostnad-key 'EPBD-recast', cite) | Cite: 'EU 2024/1275 + SKR-PM EED/EPBD okt 2025 + Boverket aug 2025' | citat | avvikelse | fasA/fasB: Boverkets aug 2025-nyhetssida är borttagen; up… |
| #beslut (matris + tid-guide) | Matrisvärden (kräver DP/LOU, rådighet, ekonomi) samt tidsguiden '<6 mån → A; 1–3 år → B; 3–5 år → C/D; ≥5 år → D. Ett behov 2031 kräver b… | process | korrekt | konsistent med facit-ledtiderna (spår A–D) |
| DATA.kallor (Statistik och jämförelser) | Meta-texter: Evidens '24 % överklagas, 12 % ändras'; Ledtidsindex 'viktat snitt 4,8 år, 52 kommuner'; Boverket 2025:11 '286 kommuner' | citat | korrekt | fasA resultat-1: Evidens (24 %/12 %/8,4 mån) och Ledtidsi… |
| DATA.kallor (Kommunala referensexempel) | Kvarngärdesskolan-meta: 'byggtid 3 år (2022–2025), PQi-utmärkelse 2024. Detaljplanen startade 2015.' | citat | ej-verifierbar | fasA: projektsidan bekräftar byggtiden men varken PQi-utm… |
| DATA.kallor (Reformagenda) | SFS 2025:974 — nytt regelverk för bygglov, trädde i kraft 1 dec 2025; ny PBL 9 kap. | juridik | korrekt | fasA resultat-1 (prop-2024-25-169-bygglov, boverket-pbl-n… |
| DATA.kallor (Reformagenda) | Riksrevisionen RiR 2023:25: 'kostnadsökningarna inträffar främst under planeringsfasen' | citat | ej-verifierbar | ingen facit-post (RiR 2023:25 gäller transportinfrastrukt… |
| DATA.kallor (Ekonomi och strategi) | Kommuninvest 2021 'äga vs. hyra: 135–500 MSEK skillnad över 33 år'; SKR/Adda 'Ramavtal för förskolebyggnader' | citat | ej-verifierbar | Kommuninvest-rapporten ej hårdkontrollerad; SKR-URL:en fö… |
| DATA.kallor (Data per lokaltyp) | SISAB slutrapporter (15 projekt), Personnevägen 97 mkr (-15 %), Micasa '11–13 år', Boverket äldre-stöd '492 mkr 2025, max 2 års byggtid',… | citat | korrekt | Micasa 11–13 år konsistent med siffror.json (ledtid-total… |
| footer | Arbetsmaterial augusti 2026 | process | korrekt | — |
| popular-slides.json (kostnad-80, kalla) | 'Branschtolkning av MacLeamy/CURT 2004 och Paulson 1976 (ASCE) — primärkällorna visar kvalitativa kurvor utan exakt procenttal' | citat | korrekt | siffror.json: ver-80-procent (preliminär, branschtolkning) |
| popular-slides.json (spar-a, kalla + punkter) | kalla 'SKR, Kommuninvest 2021, LOU 3 kap. 19 §'; punkt '135–500 mnkr mer än ägande över 33 år' | citat | korrekt | LOU-lagrummet korrekt (ver-lou-hyresundantag); Kommuninve… |
| popular-slides.json (spar-b/spar-c, kalla) | kalla 'SISAB slutrapporter 2019–2023, Helsingborgs stad' resp. 'SKR, Boverket' | citat | ej-verifierbar | SISAB/Helsingborg saknar facit-poster; SKR-ledtidssidan u… |
| popular-slides.json (spar-d, punkter + kalla) | 'Detaljplan ensam: mediantid 44 månader till laga kraft. Var fjärde plan överklagas (+14 mån i snitt).' kalla 'SKR 2024, Evidens 2023, Na… | siffra | ej-verifierbar | 44 mån saknar belägg i fas A/B-underlaget (se motsvarande… |
| popular-slides.json (kontext, kort) | 'Genomsnittlig domstolstid: 8,4 månader' (vid överklagad detaljplan) | siffra | korrekt | fasA resultat-1 (evidens-overklagande-2023): total genoms… |
| popular-slides.json (moduler + kallor-slide) | '~20 % av Uppsalas förskolor drivs i moduler' samt käll-listan på slutslide | siffra | ej-verifierbar | Uppsala-siffran saknar källpost; käll-listan matchar regi… |

### detaljplan.html

| Plats | Påstående | Typ | Status | Källa |
|---|---|---|---|---|
| dp-hero / dp-provning | Plan- och bygglagen (5 kap.) föreskriver utredningar, samråd med länsstyrelse, sakägare och allmänhet, granskning, antagande i fullmäktig… | juridik | korrekt | pbl-2010-900 (5 kap. 7, 11, 11 c, 18, 27 §§; 13 kap.) |
| dp-provning (quote-strip) | Citat: 'Att korta planprocessen handlar i grunden om att korta tiden för demokratiska processer...' — cite: SKR Jämförelser inom detaljpl… | citat | ej-verifierbar | skr-jamforelser-detaljplan |
| dp-tldr, kort 1 (4,8 år) | 4,8 år detaljplanstart → byggstart; nationellt genomsnitt 2017–2024, 52 kommuner, drygt 1 450 detaljplaner; riktmärke max 2,5 år; cite Na… | siffra | korrekt | ledtidsindex-2025 / siffror.json ledtid-detaljplan-snitt-… |
| dp-tldr, kort 1 (attribut) | data-verifiering="preliminar" på 4,8-årskortet | attribut | avvikelse | siffror.json ledtid-detaljplan-snitt-2025 (verifierad) / … |
| dp-tldr, kort 2 (13 %) | Andel kommuner med medianledtid under ett år (planuppdrag→antagande) har sjunkit från 48 % (2014–2015) till 13 % (2022–2023); cite SKR Jä… | siffra | korrekt | skr-jamforelser-detaljplan |
| dp-tldr, kort 3 (+14 mån) | +14 mån längre total ledtid för överklagade planer som vinner laga kraft; cite Evidens/Arkwright 2022 | siffra | korrekt | evidens-samhallseffekter-2022 s. 18 / evidens-overklagand… |
| dp-tldr, kort 3 (attribut) | data-verifiering="preliminar" på +14 mån-kortet (dp-num-kort) | attribut | avvikelse | siffror.json ledtid-overklagande / ver-14-man (uppgradera… |
| dp-tldr, kort 4 (~25 %) | Cirka var fjärde antagen detaljplan överklagas; högre i storstadsregionerna; cite SKR 2024 | siffra | korrekt | skr-jamforelser-detaljplan (live: 'omkring var fjärde') /… |
| dp-definitioner | Fyra mätpunkter: planuppdrag→antagande (SKR:s huvudmått), samrådsstart→antagande, detaljplanstart→byggstart (Bygg i Tid), antagande→laga … | process | korrekt | skr-jamforelser-detaljplan / ledtidsindex-2025 / pbl-2010… |
| dp-skr (ingress) | SKR:s jämförelse framtagen i samverkan med 200+ kommuner; handläggningstiderna har förlängts trots regelförändringar | siffra | korrekt | skr-jamforelser-detaljplan |
| dp-skr (trendtabell) | 48 % (2014–2015), ~38 % (2016–2017), ~28 % (2018–2019), ~20 % (2020–2021), 13 % (2022–2023) — andel kommuner med median under ett år | siffra | korrekt | skr-jamforelser-detaljplan (Tidsåtgång-undersidan, via sö… |
| dp-skr (gantt-note under tabell) | Spannet 1–2 år nu vanligast; andelen kommuner med median över 37 månader har vuxit påtagligt | siffra | ej-verifierbar | skr-jamforelser-detaljplan |
| dp-skr, kort '≤ 2 år' | Knappt hälften av kommunerna håller mediantid ≤ 2 år planuppdrag→antagande (2022–2023); cite SKR 2024 | siffra | korrekt | skr-jamforelser-detaljplan (live: 'Strax under hälften av… |
| dp-skr, kort '< 1 år samråd→antagande' | Drygt hälften av kommunerna håller samrådsstart→antagande under ett år; cite SKR 2024 | siffra | korrekt | skr-jamforelser-detaljplan |
| dp-skr, kort 'Storstad' | Storstadskommuner rapporterar oftare tider över 2 år och växande andel över 3 år; mindre kommuner snabbare; cite SKR 2024 | siffra | ej-verifierbar | skr-jamforelser-detaljplan |
| dp-index (ingress) | Bygg i Tid (Byggföretagen och Fastighetsägarna) sammanställer årligen index för 52 kommuner; enbart detaljplaner för flerbostadshus ≥ 5 l… | siffra | korrekt | ledtidsindex-2025 (s. 6, 8) |
| dp-index, kort '60 / 100' | Genomsnittligt nationellt ledtidsindex 60 av 100; betydande spridning; cite Bygg i Tid 2025 | siffra | korrekt | ledtidsindex-2025 (s. 4: '60 av 100 möjliga, med stor spr… |
| dp-index, kort '2,5 år' | 2,5 år branschens riktmärke som övre gräns; 2,3 år lägre än faktiska genomsnittet | siffra | korrekt | ledtidsindex-2025 (s. 2, 5: 'ledtider sällan behöver över… |
| dp-index, kort '7 / 10' | Sju av tio kommuner uppger att de har detaljplaner som inte kan starta på grund av resursbrist på planenheten | siffra | korrekt | ledtidsindex-2025 (s. 25: '70 procent av de tillfrågade k… |
| dp-index, pallkort Trollhättan | Trollhättan total indexvinnare, 80/100, kortast medianledtid 2,1 år, vinnare medelstora kommuner | siffra | korrekt | ledtidsindex-2025 (s. 4, 11, 36) |
| dp-index, pallkort Västerås | Västerås vinnare stora kommuner, median 2,6 år, indexpoäng 75/100, snabbaste medianledtider i sin storleksklass | siffra | korrekt | ledtidsindex-2025 (s. 4, 11, 36) |
| dp-index, pallkort Trosa | Trosa vinnare små kommuner, 71 indexpoäng, högsta NKI i hela mätningen | siffra | korrekt | ledtidsindex-2025 (s. 4, 11, 21) |
| dp-index (gantt-note) | Metod & begränsning: indexet mäter flerbostadshus ≥ 5 lgh, inte skola/förskola/LSS/idrott — vägledande riktmärke | process | korrekt | ledtidsindex-2025 / kallregister sammandrag |
| dp-process, skede 1 (Planbesked) | Planbesked: PBL 5 kap. 2–5 §§; bortre gräns 4 månader från komplett ansökan; beslutet inte överklagbart | juridik | korrekt | pbl-2010-900 (5 kap. 2–5 §§; 4 § 'inom fyra månader'; 13 … |
| dp-process, skede 2 (Utredningsskede) | Utredningsskede 6–18 mån; planuppdrag är SKR:s nollpunkt; utredningslista (geoteknik, dagvatten, MKB m.m.) | process | ej-verifierbar | fritext (typfall) |
| dp-process, skede 3 (Plansamråd) | Samråd: lagrum PBL 5 kap. 11–17 §§; standard oftast 3–4 veckor, utökat minst 3 veckor; samrådskrets (länsstyrelse, sakägare, lantmäteri, … | juridik | korrekt | pbl-2010-900 (5 kap. 11–17 §§, 11 c §) |
| dp-process, skede 4 (Granskning) | Granskning: standard 2 veckor, utökat minst 3 veckor; lagrum PBL 5 kap. 18–24 §§; det som inte lyfts senast under granskning kan i normal… | juridik | korrekt | pbl-2010-900 (5 kap. 18 §, 13 kap. 11 §) |
| dp-process, skede 5 (Antagande) | Antagande: KF vid utökat, delegerat till byggnadsnämnd vid standard; PBL 5 kap. 27 §; beredningstid 1–3 mån; SKR:s slutpunkt | juridik | korrekt | pbl-2010-900 (5 kap. 27 §) |
| dp-process, skede 6 (Laga kraft) | 3 veckors överklagandetid; klagorätt för den som lämnat synpunkter senast under granskningen samt vissa intresseorganisationer; PBL 13 kap. | juridik | korrekt | pbl-2010-900 (13 kap. 11–13, 16 §§) |
| dp-process, skede 7 (Eventuellt överklagande) | MMD i första instans (median ca 6 mån 2024), MÖD i andra, HD i undantagsfall; +14 mån snitt; ~25 % överklagas; lagrum PBL 13 kap. + lag (… | siffra | avvikelse | siffror.json ledtid-mmd-omloppstid (preliminar) / evidens… |
| dp-process (jämförbarhetskort) | Västerås räknar planprocessen från färdigt samrådsförslag; Linköping från planuppdrag; Linköping är inte påvisat långsamt jämfört med jäm… | process | ej-verifierbar | fritext (internt underlag) |
| dp-lagval, lagkort (samråd/granskning/överklagandetid) | Samråd minst 3 veckor (utökat) / normalt 3–4 veckor (standard); granskning minst 2 veckor (standard) / 3 veckor (utökat); överklagandetid… | juridik | korrekt | pbl-2010-900 (5 kap. 11 c, 18 §§; 13 kap. 16 §) |
| dp-lagval, lagkort (domstolens prövning) | Domstolens prövning ~8 månader i MMD i snitt | siffra | avvikelse | evidens-overklagande-2023 (s. 7, 19) |
| dp-lagval, valkort (bemanning) | 7 av 10 kommuner anger att resursbrist är den enskilt största flaskhalsen | siffra | avvikelse | ledtidsindex-2025 (s. 25) |
| dp-lagval, valkort (förfarandeval) | Standard tar typiskt 9–18 mån, utökat 18–48 mån | process | ej-verifierbar | fritext (typfall) |
| dp-lagval, valkort (planberedskap m.fl.) | Planberedskap gör att skede 1–6 kan hoppas över; utredningsambition, tidig politisk dialog, samordning | process | korrekt | boverket-strategisk-planering-skolor / ledtidsindex-2025 |
| dp-forfarande (ingress + kort) | PBL föreskriver utökat förfarande vid betydande allmänt intresse, avvikelse från ÖP eller betydande miljöpåverkan; standard: samråd 3–4 v… | juridik | korrekt | pbl-2010-900 (5 kap. 7 §, 11 c §, 18 §, 27 §) |
| dp-forfarande (gantt-note) | Begränsat förfarande kräver att alla berörda samtycker; Boverket: när kriterier för utökat är uppfyllda SKA det tillämpas | juridik | korrekt | pbl-2010-900 (5 kap. 7, 18 §§) / boverket-pbl-detaljplan |
| dp-overklagande, kort '+14 mån' (attribut) | data-verifiering="preliminar" på +14 mån-kortet (dp-effekt) | attribut | avvikelse | siffror.json ledtid-overklagande / ver-14-man |
| dp-overklagande, kort '~6 mån' (attribut + text) | ~6 mån 'Median omloppstid för mål i mark- och miljödomstol i första instans (Domstolsstatistik 2024)'; data-verifiering="verifierad" | siffra | avvikelse | siffror.json ledtid-mmd-omloppstid (preliminar) / domstol… |
| dp-overklagande, kort '3–3,5 mån' (attribut) | 3–3,5 mån handläggningstid för avvisade ärenden; data-verifiering="preliminar" med not om att spannet behöver verifieras | attribut | avvikelse | evidens-overklagande-2023 (s. 7) |
| dp-overklagande, kort '~25 %' | Ungefär var fjärde antagen detaljplan överklagas; stabil andel; högre i storstadsregioner; data-verifiering="verifierad" | siffra | korrekt | evidens-overklagande-2023 (s. 11: 'drygt 24 procent ... r… |
| dp-overklagande (dp-citat) | Citat om detaljplanens komplexitet som viktigaste drivare bakom långa handläggningstider — cite 'SKR/Domstolarnas underlag om handläggnin… | citat | avvikelse | evidens-overklagande-2023 (s. 7) |
| dp-overklagande (gantt-note) | Typiska överklagandegrunder; en stor majoritet av överklagade planer står sig i högre instans | process | korrekt | evidens-overklagande-2023 (s. 7, 20, 31: endast 12 % ändr… |
| dp-konsekvenser, kort 1 (sjuårsperspektivet) | Lund, Uppsala Skolfastigheter m.fl. anger ~7 år för ny skola; bygget tar 2–3 år; 3 år DP + 1 år program + 1 år projektering + 2 år bygg ≈… | siffra | korrekt | siffror.json ledtid-total-grundskola (7–10 år, preliminar… |
| dp-konsekvenser, kort 2 (planberedskap) | Boverket: kommuner behöver kontinuerligt tillräckligt med planlagd mark för skola/förskola; planberedskap mäts inte i SKR:s ledtidsstatistik | process | korrekt | boverket-strategisk-planering-skolor (URL verifierad 200) |
| dp-konsekvenser, kort 3 (moduler, lagrum) | Tidsbegränsade bygglov enligt 9 kap. 33 § PBL: upp till 10 år, förlängningsbart till 15 år | juridik | avvikelse | pbl-2010-900 (9 kap. 71–72 §§ efter omnumreringen dec 202… |
| dp-konsekvenser, kort 3 (Uppsala-moduler) | Uppsala rapporterar att ungefär en femtedel av kommunens förskolor drivs i modulbyggnader | siffra | ej-verifierbar | fritext |
| dp-konsekvenser, kort 4 (70–80 %) | Branschdata visar att 70–80 % av total investeringskostnad låses i programskede och tidig projektering | siffra | korrekt | siffror.json kr-kostnadssankning-tidplan / ver-80-procent… |
| dp-kallor, kort Ledtidsindex | Bygg i Tid (Byggföretagen och Fastighetsägarna); 52 kommuner, ~1 450 detaljplaner och 3 270 bygglov 2017–2024; länk byggforetagen.se | citat | korrekt | ledtidsindex-2025 (s. 8) — URL verifierad 200 |
| dp-kallor, kort SKR (länk) | Länk till SKR:s Jämförelser inom detaljplaneområdet 2024 (…82109.html) | citat | avvikelse | skr-jamforelser-detaljplan (verifierad URL i kallregistret) |
| dp-kallor, kort Evidens | Evidens 2023, på uppdrag av SKR, Byggföretagen och Fastighetsägarna; länk evidensgruppen.se/publikationer | citat | korrekt | evidens-overklagande-2023 — URL verifierad 200 |
| dp-kallor, kort Boverket 2025:11 | Boverket rapport 2025:11; underlag från 285 av Sveriges 290 kommuner | siffra | avvikelse | boverket-pbl-tillampning-2024 (hårdkontroll: 'alla 21 län… |
| dp-kallor, kort PBL (lagrum) | Bl.a. 5 kap. (detaljplaner), 9 kap. 33 § (tidsbegränsat bygglov), 13 kap. (överklagande) | juridik | avvikelse | pbl-2010-900 |
| dp-kallor, övriga kort (Boverket kunskapsbanken, domstol.se, Boverket strategisk planering) | Käll- och länkuppgifter för PBL kunskapsbanken, MMD-handläggningstider och Boverkets skolvägledning | citat | korrekt | boverket-pbl-detaljplan (godkänd) / domstol.se (URL verif… |
| dp-kallor (gantt-note, mätbegränsningar) | Ledtidsindex omfattar bara flerbostadshus ≥ 5 lgh; SKR bygger på enkätsvar; Evidens retrospektiv | process | korrekt | ledtidsindex-2025 / skr-jamforelser-detaljplan / evidens-… |

## Bilaga C: föräldralösa källor (refereras ej av något nyckeltal)

Behålls som referensbibliotek för HTML-prosan och framtida material. Samtliga är hårdkontrollerade som övriga poster.

- `adda-forskola-skola-2025-2`
- `akademiska-hus-campusplan-valla-2030`
- `akademiska-hus-studentbarometern-2024`
- `boverket-bbr-energi`
- `boverket-gor-plats`
- `boverket-lansstyrelsen`
- `boverket-lca`
- `boverket-pbl-detaljplan`
- `boverket-pbl-nyheter-dec-2025`
- `boverket-pbl-tillampning-2024`
- `boverket-strategisk-planering`
- `by-og-havn-arsrapport-2024`
- `byggherrarna-strategisk-partnering`
- `bygherreforeningen-dk`
- `ccbuild-cirkulart-byggande`
- `cmb-kommunal-strategisk-fastighetsforvaltning`
- `cva-chalmers-vardens-arkitektur`
- `goteborg-lfp-2025`
- `iva-resurseffektiva-lokaler`
- `ivl-kunskapsbank-klimat-bebyggelse`
- `kommuninvest-finanspolicy`
- `kommuninvest-laneskuld-2024`
- `konkurrensverket-entreprenad-2014`
- `lantmateriet-planeringsprocessen`
- `lindahl-chalmers`
- `linkoping-bildningsnamnden-lfp-2019`
- `malmo-lfp-2026-2035`
- `miljotillstand-utredning-dir-2025-2`
- `motala-vatternskolan-2025`
- `norrkoping-principer-lokalforsorjning`
- `oslobygg-kostnadsanalys-skoler`
- `prop-2024-25-169-bygglov`
- `remiss-andring-detaljplan-2024`
- `repab-fakta`
- `rir-kostsam-kvadratjakt-2025`
- `scb-befolkningsframskrivning`
- `sgbc-miljobyggnad`
- `sisab-bifrostvagen`
- `skolhusgruppen-publikationer`
- `skolverket-statistik`
- `skr-bestallarvanlig-samverkan-2021`
- `skr-flexibla-grundskolor`
- `skr-fou-fastigheter`
- `skr-inredningsplanering`
- `skr-jamforelser-detaljplan`
- `skr-overklaganden-portal`
- `skr-produktionskostnad-skolor`
- `smart-built-environment`
- `stockholm-kista-ang-skola-2024`
- `uppsala-kvarngardesskolan`
- `uppsala-pedagogiska-lfp-2023`## Bilaga A: fas A-fynd per källa (anmärkning/underkänd/ej kontrollerbar)

| Källa | Status | Fynd |
|---|---|---|
| `adda-forskolebyggnader-2018` | underkand | Äkta 404 (verifierat med WebFetch och curl) — sidan är borttagen från adda.se sedan ramavtalet löpte ut 2026-03-15. Wayback-kopia från 2026-02-07 finns (web.archive.org är egress-blockerat härifrån men fungerar i webbläsare). Efterföljaren Förskole- och skolbyggnader 2025-2 är verifierad live på … |
| `akademiska-hus` | anmarkning | Startsidan svarar 200 och är Akademiska Hus officiella webbplats. Sammandragets nyckeltal bekräftade på sidan: 3,4 miljoner m2, hyresintäkter 7 860 mnkr 2024, förvaltningsresultat 4 617 mnkr, investeringsnivå 2,5 mdkr, SBTi-verifierat nettonollmål 2040. Anmärkning: års- och hållbarhetsredovisning… |
| `akademiska-hus-arsredovisning-2024` | anmarkning | PDF hämtad OK (116 sidor, skapad 2025-03-11). Titel 'Hållbara kunskapsmiljöer års- och hållbarhetsredovisning 2024' och utgivare stämmer. Hyresintäkter 7 860 Mkr (+349 från 7 511, ca +5 %) s. 12/36, förvaltningsresultat 4 617 Mkr (+353, +8 %) s. 12, investeringar i egen projektportfölj 2 550 Mkr … |
| `akademiska-hus-studentbarometern-2024` | anmarkning | PDF hämtad OK (20 sidor, skapad 2024-11-28). Titel 'Studentbarometern 2024', genomförd av Norstat på uppdrag av Akademiska Hus: webbenkät med 1 053 svarande universitets- och högskolestudenter, insamling 22 maj–6 juni 2024. Innehållet motsvarar sammandraget (studenters upplevelse av campusmiljöer… |
| `boverket-bbr-energi` | anmarkning | HTTP 200, sidtitel 'Energihushållningskrav - Boverket'. Innehållet matchar sammandraget (primärenergital, värmegenomgångskoefficient, eleffekt, BBR avsnitt 9). MEN sidan beskriver fortfarande BBR (2011:6) — BBR har ersatts av nya byggregler i BFS 2024-serien och övergångsperioden gick ut 30 juni … |
| `boverket-gransvarde-uppdrag-2025` | underkand | URL:en ger äkta 404 (två försök, WebFetch + curl med browser-UA) — nyhetssidan är borttagen. Uppdraget är dessutom redan slutredovisat: Boverket lämnade lag- och förordningsförslag till regeringen 20 maj 2026. Ersättnings-URL (verifierad, 200): Boverkets nyhet om slutredovisningen. Sammandragets … |
| `boverket-lansstyrelsen` | anmarkning | HTTP 200. Sidans faktiska rubrik ar 'Lansstyrelsens roll i mellankommunal samordning' — en undersida under lansstyrelsens tillsyn, inte en generell sida med kallpostens titel 'Lansstyrelsens roll i detaljplaneprocessen'. Innehallet tacker dock det kallposten beskriver: radgivande roll och tillsyn… |
| `boverket-pbl-nyheter-dec-2025` | anmarkning | HTTP 200. Sidan 'Lista med PBL-andringar som tradde i kraft den 1 december 2025' finns och matchar titel/organisation (verifierad via curl; WebFetch fangade bara megamenyn). Innehallet bekraftar nytt 9 kap. PBL enligt prop. 2024/25:169. Avvikelse: kallpostens pastaende om overgangsregler ('aldre … |
| `boverket-pbl-tillampning-2024` | anmarkning | PDF hamtad (67 s.). Titelblad bekraftar 'Redovisning av tillampningen av plan- och bygglagstiftningen ar 2024', Rapport 2025:11, utgivare Boverket april 2025. Avvikelse: rapporten anger att 'alla 21 lansstyrelser samt 286 av landets 290 kommuner' lamnat underlag — kallpostens '285 av 290' ar stri… |
| `boverket-strategisk-planering` | anmarkning | URL:en svarar 301 och pekar om till Boverkets publikationssida för 'Förskolors och skolors fysiska miljö' — webbvägledningen om skolors miljö/strategisk planering har ersatts av en samlad vägledningspublikation (2026, 640 sidor). Gamla adressen bör bytas ut. |
| `boverket-tidsbegransat-bygglov` | anmarkning | Sidan i PBL kunskapsbanken fungerar och bekräftar sakinnehållet: tidsbegränsat bygglov högst 10 år, förlängning med högst 5 år i taget, sammanlagt högst 15 år (20 år för häkten/anstalter), samt avsnitt om återställande. Avvikelse: källpostens lagrumshänvisning '9 kap. 33 § PBL' är föråldrad — sid… |
| `by-og-havn-arsrapport-2024` | anmarkning | PDF hämtad OK (130 sidor, skapad 2025-03-31). Rätt dokument: Udviklingsselskabet By & Havn I/S årsrapport 2024. Bekräftat: ägs av Københavns Kommune 95 % och staten 5 % (s. 7); säljer byggeretter som kärnaffär, bl.a. Enghave Brygge 100 000 etagemeter — största enskilda försäljningen i bolagets hi… |
| `byggherrarna-strategisk-partnering` | anmarkning | PDF hämtad OK (19 sidor). Rätt dokument: 'Rapport - Strategisk Partnering — en sammanfattning av arbetssätt och status', Byggherrarna Sverige AB, författare Anna Rhodin. Avvikelse: rapporten är daterad 2012-06-01, inte 2018 som källposten anger. Innehållet motsvarar sammandraget: vad strategisk (… |
| `bygherreforeningen-dk` | anmarkning | Sidan fungerar: 'Sådan er bygherrerne i Danmark' hos Bygherreforeningen, med statistik från medlemsundersökning 2024 (könsfördelning, ålder, utbildning, roller). Avvikelse: sammandragets centrala uppgifter — 270 medlemmar, byggvolym >100 mdr DKK/år och samarbetet med Byggeriets Evalueringscenter … |
| `cmb-kommunal-strategisk-fastighetsforvaltning` | anmarkning | Sidan fungerar och innehållet matchar ämnet: CMB-frukostseminarium 'Kommunal strategisk fastighetsförvaltning – hinder och möjligheter' med forskarna Ingrid Svensson och Pernilla Gluch (Chalmers), om strategiska utmaningar när kommunala fastighetsförvaltare ska genomföra nödvändiga omfattande ren… |
| `cva-chalmers-vardens-arkitektur` | underkand | Soft-404: URL:en med /sv/-prefix svarar 200 men redirectar till Chalmers generella centrumöversikt (chalmers.se/centrum/), inte CVA-sidan. Rätt sida finns på ny adress utan /sv/: chalmers.se/centrum/cva/ (verifierad, 200, titel 'Centrum för vårdens arkitektur'). Sammandragets beskrivning 'Sverige… |
| `domstolsstatistik-2024` | anmarkning | PDF hamtad (59 s.). Titel 'Domstolsstatistik 2024', utgivare Domstolsverket/Sveriges Domstolar — metadata stammer. Tabell 1.2c (tryckt s. 22-23) ger malfloden for mark- och miljodomstolarna inkl. PBL-mal och miljomal 2020-2024. Avvikelse: kallpostens pastaende om 'mediantider, kvartiler ... for P… |
| `enkoping-grillby-forskola-2024` | anmarkning | URL fungerar, rätt referenssida hos Arcona. Bekräftar ca 2 100 m2 BTA och kontraktssumma ca 67 mkr. Men projektet pågick okt 2019-okt 2021 och stod klart oktober 2021 — inte 2024 som källposten anger. 6 avdelningar och 100-120 barn nämns inte på sidan. |
| `epbd-recast-2024-1275` | anmarkning | Sidan svarar 200 (verifierad via curl då WebFetch bara fick menyn). Rätt ämne: Boverkets samlingssida om EPBD/direktiv 2024/1275. Bekräftat: ikraftträdande 28 maj 2024, EU-frist 29 maj 2026, svenska lagändringar i PBL och energideklarationslagen träder i kraft 1 juli 2026 (SFS 2026:744/745), nya … |
| `eu-taxonomi-2021-2139` | underkand | URL:en svarar 200 men är fel dokument relativt källposten: Boverkets sida 'Taxonomin' (publicerad 20 maj 2024) handlar om taxonomiförordningen 2020/852 och cirkulär ekonomi-akten (EU) 2023/2486. Klimat-DA 2021/2139 nämns inte alls, och sammandragets centrala krav (primärenergi >=10 % under NZEB, … |
| `evidens-overklagande-2023` | underkand | Kallpostens URL (skr.se/download/...) ger HTTP 404 — SKR:s omlagda webbplats har dodat download-lankarna. Rapporten finns dock i identiskt skick hos Evidens: verifierad via nedladdning fran evidensgruppen.se (41 s., 'Overklagande av detaljplaner - omfattning, effekter och orsaker', Mars 2023, pa … |
| `evidens-samhallseffekter-2022` | anmarkning | PDF hamtad (38 s.). Titelblad 'Samhallseffekter av langa ledtider i plan- och bygglovsprocessen', Evidens pa uppdrag av Initiativet Bygg i Tid. Centrala siffror bekraftade: +4 procents kostnadsokning och ca 2 000 farre nya bostader per ar. Avvikelse: rapporten ar daterad 'Juni 2022', inte 2022-05… |
| `futurum-fastigheter-orebro` | anmarkning | PDF:en (30 sidor, e-signerad) laddades ner och är korrekt dokument: 'Årsredovisning för räkenskapsåret 2024, Futurum Fastigheter i Örebro AB', org.nr 556736-6215, ägt via Örebro Rådhus AB av Örebro kommun. Uthyrningsbar yta 400 268 m2 bekräftad. Anmärkning: sammandragets 'ca 30 000 barns vardag' … |
| `goteborg-lfp-2025` | anmarkning | URL fungerar, PDF hämtad: tjänsteutlåtande 'Göteborgs Stads lokalförsörjningsplan 2025' (SLK-2024-00504, utfärdat 2024-11-13, KS 2024-12-11) med planen som bilaga. Avvikelse: avsändare är stadsledningskontoret, inte stadsfastighetsförvaltningen som källposten anger. Nyare utgåva finns: Göteborgs … |
| `halmstad-vallasskolan-2025` | anmarkning | URL fungerar (200, rätt pressmeddelande). Men pressmeddelandet är publicerat 2020-08-18, inte 2025-04. Dokumentet anger 1 000 elever (400 F-3 + 600 4-9) och 45 platser i grundsärskolan — inte 60. Kostnad ca 475 mkr, byggstart 2025, klar 2028 bekräftas. Sammandragets 18 600 m2 BTA, två idrottshall… |
| `hemso` | anmarkning | Startsidan svarar 200 och är Hemsö Fastighets AB:s officiella webbplats. Sammandragets nyckeltal bekräftade: fastighetsvärde ca 86 mdkr 2024, driftnetto 3 833 mnkr, förvaltningsresultat 2 498 mnkr, 12 färdigställda projekt, uthyrningsgrad 97-99 %. Anmärkning: årsredovisning 2025 finns med nya vär… |
| `hemso-arsredovisning-2024` | anmarkning | PDF hämtad OK (118 sidor, skapad 2025-03-25). Titel 'Vi stärker ryggraden i samhället' och utgivare stämmer. Fastighetsvärde 86,0 mdkr (s. 15), driftnetto 3 833 mkr (+5,6 %) s. 60, förvaltningsresultat 2 498 mkr (+6,5 %, sammandragets 'ca +7 %' OK) s. 60, 82 nya äldreboendeplatser och 4 700 nya s… |
| `iva-resurseffektiva-lokaler` | underkand | Original-URL:en (globalassets-sökvägen) ger HTTP 500 'Något gick fel' vid upprepade försök (curl x2 med olika UA samt WebFetch) — trasig resurs hos IVA. Rapporten återfanns via webbsökning på ny IVA-adress (contentassets) och verifierades i sin helhet (60 sidor). Obs: rapporten är daterad januari… |
| `iva-vagval-klimatet` | anmarkning | Projektsidan fungerar och handlar om IVA:s 'Vägval för klimatet'. Men delprojekten listas som Industrisystem, Transportsystem, Samhällssystem, Livsmedelssystem och Energisystem — inte 'Samhällsbyggnad' som posten anger — och sammandragets centrala uppgift att ~50 % av en byggnads klimatpåverkan ö… |
| `jonkoping-dunkehalla-lss-2024` | underkand | Projektsidan hos ByggfaktaDOCU ger 404 ('Page could not be found') via både WebFetch och curl med webbläsar-user-agent — sidan är borttagen eller ligger bakom inloggning. Sökmotorindexering av samma sida bekräftar dock sammandragets uppgifter indirekt: byggstart september 2024, byggtid ca 11 måna… |
| `kommuninvest-laneskuld-2024` | anmarkning | URL:en (kommuninvest.se/forskning/) fungerar (HTTP 200) och listar rapportserien 'Den kommunala låneskulden', men är en generisk samlingssida — 2024 års rapport och sammandragets 81-procentssiffra syns inte där. Nyare utgåva finns: 'Den kommunala låneskulden 2025' (publicerad okt 2025). |
| `ledtidsindex-2024` | anmarkning | PDF hamtad. Titelblad 'Nationellt Ledtidsindex — Kommuner med effektiva plan- och bygglovsprocesser 2024', framtagen av Initiativet Bygg i Tid, Byggforetagen och Fastighetsagarna. Central siffra bekraftad: genomsnittlig ledtid okade fran 4,5 till 4,7 ar. Anmarkning enbart for att nyare utgava fin… |
| `lindahl-chalmers` | anmarkning | Sidan fungerar och bekräftar forskningsprofilen: Göran Lindahl vid Chalmers (Construction Management, inom institutionen för arkitektur och samhällsbyggnadsteknik), 99 publikationer 1994–2026 om byggherrens/beställarens krav, 'dynamic capabilities of public construction clients', usability/FM, vå… |
| `linkoping-befolkningsprognos-2024-2034` | underkand | URL:en ger äkta 404 (WebFetch och curl med browser-UA) — linkoping.se har strukturerats om och hela den gamla statistikgrenen '/statistik/linkoping-i-siffror/...' är borttagen; ny ingång är 'Linköping i siffror' (JS-driven sida utan direkta undersidor). Sammandragets samtliga siffror kunde dock b… |
| `linkoping-bildningsnamnden-lfp-2019` | anmarkning | URL fungerar, PDF 17 sidor hämtad: 'Bildningsnämndens lokalförsörjningsplan 2019-2028', antagen av bildningsnämnden 2018-04, diarienummer BIN 2018-138 — titel/organisation/datum stämmer. Planen avser gymnasieskola, gymnasiesärskola och vuxenutbildning (inte alla skolformer). Nyare planering finns… |
| `linkoping-budget-2025-2030` | underkand | URL:en ger äkta 404 (två försök inkl. browser-UA) — linkoping.se:s gamla contentassets-sökväg är borttagen efter webbplatsomläggning. Dokumentet återfanns i identisk kopia via kommunens pressmeddelande (via.tt.se) och verifierades (61 sidor, 'Budget för 2025 med plan för 2026–2030'). Investerings… |
| `linkoping-lfp-2024-revision` | anmarkning | URL fungerar, PDF (13 sidor) nedladdad: 'Kommungemensam Lokalförsörjningsplan, Linköpings kommun'. Men dokumentet är daterat 2024-04-15 — inte december 2024 — även om URL:en pekar på bilaga 2 till KS-sammanträdet 2024-12-03. Sammandragets hyresnotor 1 392 -> 1 666 mnkr/år (+21 %) återfinns INTE i… |
| `lund-strategisk-lfp-2024-2033` | ej-kontrollerbar | Servern moten.lund.se vägrar anslutning: curl ger 'Recv failure: Connection reset by peer' vid tre försök (även med webbläsar-user-agent) och WebFetch ger HTTP 503. Sannolikt blockering av datacenter-trafik. Dokumentets existens och innehåll kunde inte verifieras. WebSearch bekräftar dock att Lun… |
| `malmo-lfp-2026-2035` | anmarkning | URL fungerar, PDF 32 sidor hämtad: 'Lokalförsörjningsplan Malmö stad 2026–2035', upprättad 2025-03-10, ärende STK-2024-1746, behandlad i tekniska nämnden 2025-06-16 — stämmer med källposten. Avvikelse: rapporten är upprättad av stadskontoret (ekonomiavdelningen), inte stadsfastigheter/serviceförv… |
| `micasa-fastigheter` | anmarkning | Sidan svarar 200 och är Micasa Fastigheters (org.nr 556581-7870) sida för års- och hållbarhetsredovisning, senast uppdaterad 2026-05-25. Endast den senaste redovisningen (2025) finns för nedladdning; äldre år kräver kontakt med bolaget. Sammandragets nyckeltal (102 fastigheter, ca 1 miljon kvm, o… |
| `motala-vatternskolan-2025` | ej-kontrollerbar | Sidan ligger bakom bot-verifiering: WebFetch får 404, curl får 200 men bara en 'please wait while your request is being verified'-sida; Wayback-kopia (2026-03-13) finns men web.archive.org är egress-blockerat härifrån. Sidan är indexerad och live enligt sökmotor. WebSearch bekräftar: upphandlinge… |
| `norrevo-fastigheter` | underkand | URL:en levererar helt fel innehåll: WebFetch fick en svenskspråkig affiliatesajt om utländska casinon utan svensk licens (domänen förefaller kapad/övertagen), och direkt curl mot samma URL ger HTTP 403. Inget av Norrevos fastighetsinnehåll finns kvar. Norrköpings kommun övertog fastighetsägandet … |
| `norrkoping-befolkningsprognos-2025-2034` | anmarkning | PDF:en laddades ner utan problem (31 sidor, 'Befolkningsprognos för Norrköpings kommun 2025–2034', Kommundirektörens kontor/Statistikfunktionen, daterad 22 augusti 2025 — augustirevideringen, så 'Reviderad' i posttiteln stämmer i sak). Minskningen av barn/unga och gymnasieökningen bekräftade. Sam… |
| `norrkoping-principer-lokalforsorjning` | anmarkning | URL fungerar, PDF (3 sidor) nedladdad. Rätt dokument: 'Principer för Lokalförsörjning', riktlinje, Strategisk planering/Samhällsbyggnadskontoret, Norrköpings kommun. Men dokumentet är daterat 2023-08-11 och antaget av kommunstyrelsen 2023-09-25 § 143 — källpostens datum 2024-01 är bara filens upp… |
| `norrkoping-smedbyskolan-2024` | underkand | Äkta 404 — verifierat med både WebFetch och curl. Nyhetssidan är borttagen från norrkoping.se. Wayback-kopia från 2025-10-15 finns (kunde inte läsas härifrån p.g.a. egress-blockering av web.archive.org, men fungerar i webbläsare). Ersättningskandidaten via.tt.se (pressinbjudan 2024-08-26) saknar … |
| `orebro-brickebacken-vob-2024` | anmarkning | HTTP 200, artikeln finns: 'Byggstart: Vård- och omsorgsboende i Södra Brickebacken i Örebro', Nya Projekt (Stordåhd Kommunikation), 22 mars 2024. Men två avvikelser: (1) byggherre är Örebrobostäder — inte Futurum som källpostens organisationsfält anger; (2) sammandragets centrala siffror 230 mkr … |
| `oslobygg-arsberetning-2024` | anmarkning | URL:en svarar 200 och sidans metadata (og:title) bekräftar 'Årsberetning 2024 for Oslobygg KF' på Oslo kommunes Framsikt-plattform. Innehållet är dock helt JS-renderat, så sammandragets siffror (2,7 miljoner m2, 1 800 byggnader, 5-6 mdr NOK/år) kunde inte verifieras i dokumenttexten. WebSearch be… |
| `oslobygg-kostnadsanalys-skoler` | anmarkning | PDF:en laddades ner (35 sidor) och är korrekt dokument: 'Kostnadsanalyse — Sammenstilling av kostnadsnivåer for Bentsebrua skole og Torvbråten skole', beställare Oslobygg KF, utförd av Holte Consulting och Menon Economics, daterad 30 november 2023, ver 1.0. Anmärkning: sammandragets uppgift om Bj… |
| `region-ostergotland-fastigheter` | anmarkning | Sidan svarar 200 och är Region Östergötlands officiella sida 'Fastigheter och lokaler' som beskriver Regionfastigheters uppdrag (rådgivning i lokalfrågor, projektplanering, om- och nybyggnad, felanmälan). Sammandragets specifika uppgifter — Universitetssjukhuset, Vrinnevisjukhuset och Framtidens … |
| `region-skane-regionfastigheter` | anmarkning | Sidan svarar 200 och är Region Skånes officiella sida 'Region Skåne som fastighetsägare'; förvaltningen Regionfastigheter bekräftas som ansvarig. Avvikelse: sidan anger 'över en miljon kvadratmeter', inte 'över 1,6 miljoner m2' som i sammandraget. Sjukhusbyggnader samt tåg- och bussdepåer bekräft… |
| `repab-fakta` | anmarkning | HTTP 200, fungerande kategorisida 'Fastighetsekonomi' hos Svensk Byggtjänst med 17 böcker, inkl. Repab Fakta 2026-utgåvor (Bostäder, Underhållskostnader m.fl.). Men de för källposten centrala spårböckerna (Skolor, Vårdfastigheter, Kommunhus/lokaler) syns inte på kategorisidan — sammandragets uppg… |
| `sala-modulskola-adapteo` | underkand | 404: adapteo.se/insights/gardesta-skola redirectar till /kundreferenser/gardesta-skola som också ger 404 — sidan borttagen. Ersättning verifierad: Sala kommuns pressmeddelande 'Skandinaviens största modulskola färdig i Sala' (2018-07-30) bekräftar alla centrala siffror. OBS: skolan stod klar somm… |
| `scb-befolkningsframskrivning` | anmarkning | HTTP 200, fungerande statistiksida från SCB. Senaste utgåva 'Sveriges framtida befolkning 2026–2070' publicerad 16 april 2026 — matchar källpostens datum 2026-04. Avvikelse i källpostens titel: 'regionala prognoser till 2070' stämmer inte — den nationella framskrivningen går till 2070 men den reg… |
| `scb-bki-2025` | anmarkning | HTTP 200, korrekt SCB-statistiksida för Byggkostnadsindex (BKI). Sidan visar nu data t.o.m. juli 2026: BKI för flerbostadshus +3,2 % på årsbasis (juli 2026 vs juli 2025) och +0,1 % juni–juli 2026. Sammandragets siffra '-0,2 % feb 2025' visas inte längre på sidan, och beskrivningen av 2024–2025 so… |
| `scb-framtida-befolkning-2026-2070` | anmarkning | Sidan svarar 200 (hämtad via curl, WebFetch fick 503). Statistiknyhet 'Antalet födda fortsätter att minska', SCB, publicerad 2026-04-16, avser framskrivningen 2026–2070 — titel/organisation/datum stämmer. Flera av sammandragets centrala värden bekräftade, men tre uppgifter återfinns inte i statis… |
| `senaatti-arsrapport-2024` | anmarkning | PDF hämtad OK (63 sidor, 'Senaatti-kiinteistöt Toimintakertomus ja tilinpäätös 1.1.–31.12.2024', daterad 25.2.2025). Bekräftat: koncernens omsättning 997,4 milj. euro ≈ ca 1 mdr EUR (s. 7); hyressänkning från 1.1.2025 om ca 13 milj. euro (Senaatti) + 7 milj. euro (Puolustuskiinteistöt) ≈ 20 milj.… |
| `skolverket-grundskola-2024-25` | anmarkning | Publikationssidan fungerar och alla sammandragets siffror bekräftade: drygt 1 100 000 elever, minskning 5 440 elever mot föregående läsår, beskriven som största minskningen hittills. Men en nyare utgåva finns (läsåret 2025/26, mars 2026) som ändrar den centrala uppgiften: minskningen 2025/26 är n… |
| `skr-bestallarvanlig-samverkan-2021` | underkand | Ursprungs-URL:en ger SKR:s 404-sida ('Felsida 404 - SKR') — död länk. Fungerande spegel hittad på extra.skr.se med identiskt filnamn (7585-726-8.pdf) och verifierad: 'Beställarvänlig samverkan i byggentreprenader — en introduktion: nyckelkomponenter för en lyckad samverkan samt referat från works… |
| `skr-flexibla-grundskolor` | underkand | Angiven URL på skr.se svarar HTTP 404 (SKR har strukturerat om sin webbplats). Publikationen finns kvar på Offentliga fastigheters webbplats (extra.skr.se), verifierad: titel, FoU-fonden som finansiär och publiceringsdatum 2024-01-30 stämmer med källposten. |
| `skr-fou-fastigheter` | underkand | Angiven URL svarar HTTP 404 och även den omdirigerade varianten med 'fastighetlokalforsorjning' i sökvägen är borttagen — SKR har lagt om hela webbstrukturen. FoU-fondens innehåll finns nu på SKR:s sida 'Fastighetsförvaltning', verifierad: beskriver FoU-fonden för kommunernas fastighetsfrågor (Ko… |
| `skr-hyra-lokal-lou` | anmarkning | URL fungerar, PDF (74 sidor) nedladdad: 'Gäller LOU vid hyra av lokal? Tips och råd'. Men utgivare är SKL (Sveriges Kommuner och Landsting), publicerad juni 2019 (© SKL 2019, ISBN 978-91-7585-737-4) — inte SKR 2021-12 som källposten anger (2021-12 är filens uppladdningstid på extra.skr.se). Hyres… |
| `skr-inredningsplanering` | anmarkning | URL fungerar, PDF 96 sidor hämtad och verifierad: titel 'Inredningsplanering — En planeringsmodell för inredning i skolor och förskolor' stämmer. Avvikelse i metadata: utgivare är Sveriges Kommuner och Landsting (SKL) 2010, ISBN 978-91-7164-501-2 — källpostens datum 'okänt' kan fyllas i med 2010 … |
| `skr-lcc-tidiga-skeden` | anmarkning | 301-redirect från skr.se till extra.skr.se — nya URL:en fungerar och visar rätt publikation med PDF-nedladdning. Dessutom datumavvikelse: sidan anger publicering 28 mars 2022 (aktualitetsgranskad våren 2023), källposten anger 2021-11. |
| `skr-overklaganden-portal` | underkand | URL:en ger HTTP 404 (SKR:s felsida) bade via WebFetch och curl. SKR har gjort om sin URL-struktur; aven den nyare sokvagen .../planeringbyggandebostad/fysiskplanering/overklagandenavdetaljplanerochbygglov.28410.html samt varianten under /byggandeochbostaderplanering/ ger 404. Ingen fungerande ers… |
| `skr-pm-eed-epbd-2025` | anmarkning | PDF laddades ner utan problem (5 sidor, SKR/Andreas Hagnell, daterad 2025-10-27/28) — titel, organisation och datum stämmer. Nollutsläppskrav 2028/2030 och MEPS bekräftade. Sammandragets uppgift 'solcellsplikt 2027–2028' återfinns dock inte med de årtalen i PM:et — där sägs endast att solenergiin… |
| `skr-produktionskostnad-skolor` | underkand | Angiven nedladdnings-URL på skr.se returnerar SKR:s 404-sida (HTML, 'Felsida 404 - SKR'). Samma PDF finns på extra.skr.se (22 sidor, verifierad). Obs: dokumentet är utgivet av Sveriges Kommuner och Landsting 2016 (Stockholm i april 2016, ISBN 978-91-7585-394-9), inte 2017 som källposten anger. |
| `skr-strategisk-lokalresursplanering` | underkand | HTTP 404 ('Felsida 404 - SKR') via både WebFetch och curl; även varianter av sökvägen ger 404. SKR har strukturerat om webbplatsen. Motsvarande innehåll finns nu på sidan 'Verksamhetslokaler, planering' som innehåller avsnittet Strategisk lokalresursplanering (verifierad 200 med rätt innehåll). |
| `specialfastigheter` | anmarkning | Startsidan svarar 200, bekräftad som Specialfastigheter Sverige AB (org.nr 556537-5945). Sammandragets nyckeltal bekräftade: 174 fastigheter, ca 1,1 miljoner m2, intäkter 3 502 mnkr 2024, förvaltningsresultat 1 713 mnkr, fastighetsvärde ca 52 mdkr. Anmärkning: bokslut 2025 finns med väsentligt än… |
| `specialfastigheter-arsredovisning-2024` | anmarkning | PDF hämtad OK (122 sidor, skapad 2025-03-11). Titel 'En säker värd — Års- och hållbarhetsredovisning 2024' och utgivare stämmer. Totala intäkter 3 502 Mkr (+14 % från 3 063) s. 6, förvaltningsresultat 1 713 Mkr (+5 % från 1 624) s. 9, fastighetsvärde 51 915 Mkr ≈ 52 mdkr s. 24 — bekräftat. Avvike… |
| `ssb-kostra-byggesak` | anmarkning | Sidan fungerar: SSB:s statistiksida 'Plan- og byggesaksbehandling' (fysplan) inom KOSTRA. Avvikelser: statistiksidan uppdaterades senast 2021-07-01 och 'neste oppdatering' är 'foreløpig ikke fastsatt' — som primärkälla för aktuella handläggningstider bör i stället Statistikkbanken användas, där K… |
| `stadsfastigheter-goteborg` | anmarkning | Sidan svarar 200 och är Göteborgs Stads officiella sida för stadsfastighetsförvaltningen (organisation och verksamhet beskrivs, ca 700 anställda i sex avdelningar). Sammandragets nyckeltal — ca 1 500 adresser och ca 2,2 miljoner m2 lokalyta — återfinns dock inte på sidan. |
| `statsbygg-arsrapport-2024` | anmarkning | PDF:en laddades ner (95 sidor) och är korrekt dokument: Statsbyggs Årsrapport 2024. Central uppgift bekräftad: 'Ved utgangen av 2024 forvaltet Statsbygg et samlet areal på 2,9 mill. kvadratmeter' (s. 19). Regjeringskvartalet, Livsvitenskapsbygget och NTNU Campussamling omnämns flerfaldigt. Anmärk… |
| `stenvalvet` | anmarkning | www.stenvalvet.se ger 301-redirect via hostingdomänen stenvalvetse.c5742.cloudnet.cloud som i sin tur redirectar till https://stenvalvet.se/ (utan www) — kedjan fungerar men URL:en bör bytas till slutdestinationen. Sidan bekräftar driftnetto 597 mnkr 2024 men visar nu uppdaterade beståndssiffror:… |
| `stenvalvet-arsredovisning-2024` | underkand | URL:en levererar fel dokument: mb.cision.com/Main/3555/4111812/3288266.pdf är en banks årsredovisning (388 sidor med utlåning, kärnprimärkapital m.m.), inte Stenvalvets. Korrekt PDF hittad via Stenvalvets pressida och verifierad: 'Års- och hållbarhetsredovisning 2024' (120 sidor, skapad 2025-03-2… |
| `stockholm-kista-ang-skola-2024` | anmarkning | URL fungerar, rätt pressmeddelande (Moderaterna Stockholms stad). Men publicerat 2020-09-01, inte 2024-06. Bekräftar F-9 för 900 elever, ca 385 mkr, SISAB. Viktigt: dokumentet anger skolbyggnad om 9 073 m2 — sammandragets antagande 12 000-14 000 m2 BTA (27 000-32 000 kr/m2) motsägs; 385 mkr / 9 0… |
| `stockholm-lfp-2025-2045` | anmarkning | URL fungerar, PDF 46 sidor hämtad: 'Bilaga 4 Lokalförsörjningsplan 2025–2027 Med framåtblick till 2045', utbildningsnämnden 2024-04-25 — titel/organisation/datum stämmer. Sammandragets huvuduppgifter bekräftade, men siffran '~1,8 miljoner kvm' för SISAB:s bestånd återfinns inte i dokumentet. Årli… |
| `uppsala-kvarngardesskolan` | anmarkning | Projektsidan fungerar och bekräftar nästan alla uppgifter: F–9-skola med 15 898 kvm BTA, kapacitet 990 elever (630 i F–6, 360 i 7–9), stor idrottshall med mindre sporthall, samverkansentreprenad med ByggDialog, Miljöbyggnad Silver. Sammandragets uppgift om att projektet 'belönats för projektkvali… |
| `uppsala-kvarngardesskolan-2025-slutrapport` | anmarkning | URL fungerar, rätt artikel (Uppsala kommun, publicerad 2025-09-05, källpost anger 2025-08). Bekräftar F-9, upp till 990 elever, idrottshall, matsal med kök, samverkan Skolfastigheter-ByggDialog, arkitekt Archus, Miljöbyggnad Silver 4.0, trästomme, solceller. Sammandragets budget 510 mkr, byggtid … |
| `uppsala-pedagogiska-lfp-2023` | underkand | Publikationssidan ger HTTP 404 ('Sidan du vill nå kan inte hittas - Uppsala kommun') via både WebFetch och curl. Själva planen finns dock kvar som PDF på uppsala.se (contentassets, 7 MB, verifierad genom läsning av s. 1–4): tjänsteskrivelse 2022-11-02 (UBN-2022-06387) + 'LFP UBN 2023 Lokalförsörj… |
| `vacse` | anmarkning | Startsidan svarar 200 och är Vacse AB:s (publ) officiella webbplats. Bekräftat på sidan: fastighetsvärde 10+ mdkr, uthyrningsgrad 100 %, viktad återstående hyrestid ca 9,6 år. Resultatsiffrorna för 2024 (615,5/470,8/336,0 mnkr) visas inte på startsidan utan kommer från bokslutet. Anmärkning: delå… |
| `vacse-arsredovisning-2024` | underkand | URL:en levererar fel dokument: PDF:en på storage.mfn.se/9565f85d-... är NP3 Fastigheters årsredovisning 2024 (142 sidor, NP3-innehåll rakt igenom), inte Vacses. Korrekt Vacse-PDF hittad via sökning och verifierad: 'Vacse Års- och hållbarhetsredovisning 2024' (98 sidor, skapad 2025-03-24). Där bek… |
| `vastfastigheter-vgr` | anmarkning | www.vastfastigheter.se ger 301-redirect till https://fastighet.vgregion.se/ som nu är varumärkt 'VGR fastigheter' (Västra Götalandsregionen, org.nr 232100-0131). Namnet Västfastigheter används i praktiken inte längre på sidan. Sammandragets 'över 1,5 miljoner m2' återfinns inte på sidan; den besk… |

## Bilaga B: fas B-fynd per nyckeltal (ej verifierad/preliminär/ändrad)

| Nyckeltal | Ny status | Nytt värde | Fynd |
|---|---|---|---|
| `akt-akademiska-hus-bestand` | verifierad | — | AR 2025 (mars 2026) publicerad — kontrollera beståndssiffran vid uppdatering till 2025. |
| `akt-akademiska-hus-ekonomi` | verifierad | — | AR 2025: hyresintäkter 7 947 mnkr, förvaltningsresultat 4 846 mnkr — föreslå uppdatering till 2025 års utfall (kräver även nytt datum). |
| `akt-hemso-leverans` | verifierad | — | Notens '12 projekt' stämmer inte — AR 2024 s. 24 anger 8 större färdigställda projekt. Rätta noten. |
| `akt-hemso-vardering` | verifierad | — | AR 2025: fastighetsvärde 87 231 mnkr, förvaltningsresultat 2 541 mnkr — överväg uppdatering. Notens '+7 %' är exakt +6,5 %. |
| `akt-micasa` | verifierad | — | Sidan Företagsfakta anger 944 000 kvm bruttoarea — '~1 mn m²' OK. Notens omsättning 1 181,7 mnkr (2024) mot sidans nuvarande 1,20 mdkr; AR 2025 publicerad och 2024 års rapport är inte längre nedladdningsbar. |
| `akt-norrevo` | preliminar | — | Byt källa: Norrevos årsredovisning 2023 eller Norrköpings kommuns fastighetssida (fas A:s ersättnings-URL saknar dock ytsiffran). Domänen norrevo.se levererade främmande innehåll (kasinosajt) vid direktkontroll. |
| `akt-oslobygg` | preliminar | — | Angiven källa (Framsikt-årsberetningen) är JS-renderad och innehållet kan inte maskinläsas — överväg att komplettera med Oslobyggs pressmeddelande/om-oss-sida som källa. Årsberetning 2025 finns. |
| `akt-region-skane` | preliminar | — | Överväg att ändra värdet till '>1 mn m²' (källans egen formulering) eller komplettera källregistret med ett belägg för 1,6 mn m² (t.ex. Esri Sveriges kundcase med Regionfastigheter). |
| `akt-senaatti` | verifierad | — | Notens 'byggnadsinvesteringar 407 milj EUR 2024' saknar stöd — 2024 var totala investeringar 759 M€ (s. 15). Rätta noten. Vuosikertomus 2025: omsättning 1 021,5 M€, byggnadsinvesteringar 763 M€. |
| `akt-sisab` | verifierad | — | Siffrorna återfinns inte i de angivna källorna (sisab.se startsida saknar dem; Stockholms LFP-PDF saknar kvm-uppgift) — ny källa föreslagen: Stockholms stads bolagssida för SISAB. |
| `akt-specialfastigheter-bestand` | verifierad | ≈1,2 mn m² (176 fast.) | Värdet rättat mot AR 2024 (176 fastigheter, 1 184 tkvm). Startsidans 174 fast./1,1 mn m² speglar sannolikt läget efter 2025 års avyttringar (AR 2025: fastighetsvärde 47,4 mdkr efter försäljningar om 9,6 mdkr). |
| `akt-specialfastigheter-ekonomi` | verifierad | — | Notens 'projektutvecklingsinvesteringar 5,1 mdkr' avser 2025, inte 2024 — 2024 var investeringarna 5 818 mnkr (s. 59). Rätta noten. Fastighetsvärde ca 52 mdkr (51 915 mnkr) bekräftat. |
| `akt-stadsfast-goteborg` | verifierad | — | Siffrorna ligger på undersidan 'Stadsfastighetsförvaltningens fastigheter', inte på källpostens ingångssida — precisera gärna käll-URL:en. |
| `akt-stadsfast-malmo` | verifierad | — | '~600 obj.' återfinns inte uttryckligen på sidan (motsägs ej). |
| `akt-statsbygg` | verifierad | — | Årsrapport 2025 publicerad: ca 3,0 mn m² fördelat på 2 156 byggnader — överväg uppdatering. |
| `akt-stenvalvet-bestand` | verifierad | — | Källpostens URL pekar på fel dokument (en banks årsredovisning) — byt till fas A:s korrigerade URL. Webbplatsen visar nu ca 110 fastigheter/603 000 m²/16,8 mdkr; AHR 2025: 598 tkvm, 16,5 mdkr. Notens 'ca 100 fastigheter' är exakt 108. |
| `akt-vacse-avtalslangd` | verifierad | — | Samma URL-fel i källposten som för akt-vacse-ekonomi (PDF:n är NP3:s). |
| `akt-vacse-ekonomi` | verifierad | — | Källpostens URL levererar fel dokument (NP3:s årsredovisning) — byt till fas A:s korrigerade URL. AR 2025 publicerad. |
| `akt-vastfastigheter` | ej-verifierbar | — | Källposten bör uppdateras: Västfastigheter heter nu VGR fastigheter (fastighet.vgregion.se). Ytsiffran >1,5 mn m² kan möjligen beläggas i VGR:s årsredovisning — annars omformulera till källans 'en av Västsveriges största fastighetsförvaltare'. |
| `dem-grundskola-2024` | verifierad | — | Notens 'största i absoluta tal hittills' är inaktuell: läsåret 2025/26 minskade elevantalet med ca 9 900 (Skolverket, mars 2026) och är nu rekordet. Uppdatera noten eller hela nyckeltalet till 2025/26-utgåvan. |
| `dem-linkoping-budget-bun` | verifierad | — | Beloppet 39 mnkr står inte i själva budgetdokumentet (fas A) utan i kommunens pressmeddelande om budget 2025 — ny källa föreslagen. Budgetkällans URL är dessutom 404. |
| `dem-linkoping-fsk` | preliminar | — | Uppdatera käll-URL:en (404). Uppgiften i sak bekräftad från kommunens eget prognosmaterial. |
| `dem-linkoping-grundskola` | preliminar | — | Uppdatera käll-URL:en (404). Uppgiften i sak bekräftad från kommunens eget prognosmaterial. |
| `dem-linkoping-hyresnota` | verifierad | — | Byt källa till linkoping-kommungemensam-lfp-2024 och ändra nyckeltalets datum till 2023-12 (dokumentet daterat 2023-10-26, KS 2023-12-12). Obs: dokumentet skriver 'kostnad 2023' — sannolikt tryckfel för 2033 (prognostabellen löper 2024–2033). Den angivna källan (LFP-revisionen 2024) anger i ställ… |
| `dem-linkoping-investering` | verifierad | — | Käll-URL:en är 404 — använd fas A:s ersättning (kommunens TT-speglade dokument) eller leta stabil URL på linkoping.se. Notens '50 % egenfinansiering av investeringar' återfinns inte som explicit krav i dokumentet (formuleras som att budgeterade resultat ska täcka investeringar utöver avskrivninga… |
| `dem-linkoping-lss` | verifierad | — | Noten bör kompletteras: beloppet omfattar även förbättrat stöd i skyddat boende, inte bara LSS-utbyggnad och daglig verksamhet. Belägget ligger i pressmeddelandet (ny källa, samma som för dem-linkoping-budget-bun), inte i budget-PDF:n vars URL dessutom är 404. |
| `dem-linkoping-tillvaxt` | preliminar | — | Käll-URL:en ger 404 (kontrollerad igen i fas B) — uppdatera källposten till nya statistikingången. Notens Q3 2025-uppgift (168 714 inv) ej kontrollerad. En nyare prognosomgång kan finnas: kommunens pressmeddelande 'Linköping fortsätter växa i ett osäkert omvärldsläge' (via.tt.se, 2026) bör kontro… |
| `dem-norrkoping` | verifierad | — | Notens 'utbildningsnämnden har fattat beslut om anpassningar' står inte i prognosdokumentet — belägg saknas i angiven källa. Nyare prognosomgång 2026–2035 (mars 2026) finns; riktningen (minskande barn/unga, ökande gymnasieåldrar) består. |
| `dem-sverige-tillvaxt` | verifierad | — | Siffran står i rapporten Sveriges framtida befolkning 2026–2070, inte i själva statistiknyheten — komplettera gärna källposten med rapportsidans URL (scb.se .../produktrelaterat/rapporter/sveriges-framtida-befolkning-2026-2070/). |
| `dem-tfr-2025` | verifierad | — | I den angivna statistiknyheten beskrivs fruktsamheten endast kvalitativt — ny SCB-källa föreslagen som direkt belägg för 1,42. |
| `kli-akademiska-hus-utslapp` | verifierad | −64 % | Källan motsäger −50 %: utfallet vid utgången av 2024 är −64 % mot basår 2019 (s. 7 måltabell 'Klimatavtryck −64 %', s. 8 'reducerat våra klimatutsläpp med 64 procent jämfört med 2019'). Not:ens 'första svenska fastighetsbolag med godkänt SBTi Net-Zero-mål' återfinns inte i årsredovisningen (rappo… |
| `kli-epbd-ikrafttrad-se` | verifierad | — | Genomförandet är stegvis: lagändringar (PBL, energideklarationslagen; SFS 2026:745/744) 1 juli 2026, förordningsändringar 1 juli resp. 1 okt 2026, Boverkets föreskrifter planeras 1 okt 2026. Sverige 'något försenat' mot EU-fristen 29 maj 2026 — not:en stämmer. |
| `kli-gransvarde-klimat` | verifierad | — | Not:ens uppgift 'Boverket föreslår sänkning −25 % från 2025-nivån' stöds INTE av slutredovisningen — ingen sådan procentsats på nyhetssidan; där anges i stället skärpningsriktning till 2050 med målbild −90 % till 2040 jämfört med 1990. Ta bort/ersätt −25 %-uppgiften. Källpostens URL död — ersätt … |
| `kli-klimatdeklaration-obligatorisk` | verifierad | — | Obs: Boverket föreslog 20 maj 2026 att klimatdeklarationsreglerna upphävs och ersätts av livscykel-GWP-krav i PBL 2028/2030 — kan nämnas i not. |
| `kli-livscykel-byggprocess` | preliminar | — | Angiven källa (IVA Vägval för klimatet, projektsidan) innehåller inte 50 %-uppgiften (fas A). Uppgiften härrör från IVA & Sveriges Byggindustriers rapport 'Klimatpåverkan från byggprocessen' (2014) — sekundärt bekräftad hos Sustainable Innovation: 'klimatpåverkan från byggfasen motsvarar 50 % av … |
| `kli-meps-2030` | verifierad | — | Tröskeln avser de 16 % med sämst energiprestanda år 2020. Angiven källas URL (Boverkets EPBD-sida) innehåller inte MEPS-uppgifterna — komplettera med redan registrerad källa skr-pm-eed-epbd-2025. |
| `kli-meps-2033` | verifierad | — | Årtalet och 26 %-tröskeln bekräftade. Not:ens '~31 000 lokalbyggnader' ej återfunnen i källorna: SKR:s PM anger totalt 124 130 lokalbyggnader (s. 5); 26 % av dessa är ca 32 000 — siffran är rimlig men bör källbeläggas mot Boverkets delrapport (prel. minimikrav, okt 2024/okt 2025) eller justeras t… |
| `kli-solceller-2027` | verifierad | — | Avser befintliga offentliga byggnader >2 000 m2 (senast 31 dec 2027). Nya kommersiella/offentliga byggnader >250 m2 träffas redan senast 31 dec 2026. Angiven källas URL (Boverkets EPBD-sida) innehåller inte solcellstrappan — komplettera med ny källa. |
| `kli-solceller-2028` | verifierad | — | Avser befintliga offentliga byggnader >750 m2 (senast 31 dec 2028); steg 3 är >250 m2 senast 31 dec 2030. Samma källkomplettering som kli-solceller-2027 (svensk-solenergi-epbd). |
| `kli-taxonomi-nzeb` | verifierad | — | Källpostens URL (Boverkets taxonomisida) innehåller inte kriterierna (fas A: underkand) — byt till EUR-Lex 2021/2139 enligt fas A:s förslag. Not:ens 'klimatdeklaration livscykel krävs för >5 000 m2' bör nyanseras: kriteriet är att livscykel-GWP beräknas för varje stadium och lämnas ut till invest… |
| `kli-utokad-deklaration` | verifierad | — | Not föråldrad: uppdraget är redovisat 20 maj 2026 (rapport 2026:16), inte 'redovisas senast 1 juni 2026'. 2028-kravet gäller byggnader >1 000 m2; övriga nya byggnader från 1 jan 2030. Begreppet 'utökad klimatdeklaration' ersätts i förslaget av livscykel-GWP-krav i PBL (klimatdeklarationsreglerna … |
| `kr-bki-arstakt` | verifierad | — | Notens 'första negativa årstakten sedan 1950-talet' stämmer inte för feb 2025 — det var femte månaden i rad med negativ årstakt (den första kom hösten 2024). Nyare data (fas A): +3,2 % juli 2026 — platå-formuleringen för 2024–2025 bör uppdateras till förnyad kostnadsökning. |
| `kr-forskola` | verifierad | — | Nyckeltalets datum 2024 är fel — Grillby stod klar okt 2021. Intervallets ytterkanter (30/38) vilar på ociterade projekt (Källdal Uddevalla, Kumla IP). |
| `kr-grundskola-medel` | ej-verifierbar | — | 252 mkr och fullstor idrottshall är belagda, men BTA 7 850 m2 finns inte i någon nåbar källa — kr/m2-talet (252/7 850 ≈ 32 100) hänger i luften. Wayback-kopia av originalnyheten finns (fas A ny_url) men web.archive.org är blockerat härifrån. |
| `kr-grundskola-stor` | verifierad | 25 000–36 000 kr/m² BTA | Kista Äng motsäger nuvarande intervall (385 mkr/9 073 m2 ≈ 42 400 kr/m2 enligt dokumentets egna siffror, prel. 2020) och föreslås utgå ur kalla_ids. Kvarngärdesskolans slutbudget 575 mkr (upp från 510) lyfter övre gränsen från 32 000 till ca 36 000. |
| `kr-idrottshall` | ej-verifierbar | — | Intervallet 18 000–25 000 är rimligt mittfält men saknar primärkälla; funna exempel ligger både under (14 000, äldre enkel hall Stockholm) och klart över (Hallsberg 2024: ca 60 mkr/1 600 m2 ≈ 37 500 kr/m2). |
| `kr-kostnadssankning-tidplan` | ej-verifierbar | — | Behåll gärna som uttalad tumregel, men märk den som branschtolkning snarare än källbelagd siffra — notens formulering är redan ärlig. Käll-URL bör bytas till extra.skr.se-adressen (fas A ny_url). |
| `kr-lss` | ej-verifierbar | — | Värdet matchar de indirekt bekräftade siffrorna (20–30 mkr/823 m2 = 24 300–36 500 kr/m2) — behåll gärna, men skaffa en nåbar källa, t.ex. Jönköpings kommuns upphandlings-/projektdokument. |
| `kr-modulskola-hyra` | verifierad | — | Datum bör vara 2018 (skolan klar sommaren 2018), inte 2017; käll-URL bör bytas till Sala kommuns pressmeddelande (fas A ny_url). |
| `kr-modulskola-per-elev-ar` | verifierad | — | Datum bör vara 2018, inte 2017 (samma som kr-modulskola-hyra); käll-URL bör bytas till Sala kommuns pressmeddelande. |
| `kr-plats-f9-stor` | preliminar | 450 000–580 000 kr/elev | Nuvarande intervall bygger på kontraktssummor (475/510 mkr); Kvarngärdesskolans slutbudget 575 mkr spränger taket 550 000. Vallås elevantal varierar mellan källor (900–1 045), därav preliminär på det nya intervallet. |
| `kr-plats-fmedel` | preliminar | — | Elevantalet (420 enligt Byggnyheter; pressmeddelandet anger endast 'två klasser i varje årskurs') står inte i någon verifierad primärkälla — därav preliminär, inte verifierad. |
| `kr-plats-forskola` | ej-verifierbar | — | Intervallet 650 000–900 000 stöds inte av det enda citerade projektet: med uppgiven kapacitet 160 barn (E-posten/Skolkoll) ger Grillby ca 420 000 kr/plats, och även med notens antagande 100–120 barn blir det 560 000–670 000. Värdet bör ses över och beläggas med de två ociterade projekten (Källdal… |
| `kr-plats-lss` | ej-verifierbar | — | Enligt sökindex och fas A har Dunkehalla 5 lägenheter, inte 6: 20–30 mkr/5 lgh = 4,0–6,0 mkr/lgh, över angivet 3,3–5,0 (som bygger på 6 lgh). Värde eller not bör ses över när nåbar källa finns. |
| `kr-plats-vob` | verifierad | — | Byggherre är Örebrobostäder/ÖBO Omsorgsfastigheter, inte Futurum som källposten anger. Boendet överlämnades till kommunen april 2026. |
| `kr-vob-kommunalt` | preliminar | — | BTA-antagandet 7 000–8 000 m2 saknar källa — endast kr/plats går att belägga. Byggherre är Örebrobostäder, inte Futurum som källpostens organisationsfält anger. |
| `kr-vob-privat` | verifierad | — | Notens Bredäng-siffror finns INTE i AR 2024 (endast NollCO2-omnämnande s. 35) — de kommer från Hemsös pressmeddelande 2022 (föreslagen ny källa). AR-tabellen har även svenska äldreboenden på 33 000–35 000 kr/m2 (Sarvträsk, Ängegärde) — överväg att vidga intervallet nedåt till ca 33 000–57 000. |
| `ledtid-byggtid-f9-stor` | verifierad | — | Angiven källa (uppsala.se-artikeln) bekräftar invigning sep 2025 men inte byggstarten — byggtiden framgår av Skolfastigheters projektsida, som föreslås läggas till som källa. |
| `ledtid-byggtid-lss` | ej-verifierbar | — | Enda källan underkänd i fas A (ByggfaktaDOCU-sidan 404). Indirekta uppgifter via sökindex stöder ~11 mån byggtid, men fritt åtkomlig ersättningskälla saknas. |
| `ledtid-framtidens-us` | verifierad | — | 14 år är härlett ur 'Byggtid: 2011–2025' — står inte som talet 14 på sidan, vilket är acceptabelt. |
| `ledtid-mmd-omloppstid` | preliminar | — | Domstolsstatistik 2024 särredovisar INTE omloppstider/median för MMD:s PBL-mål (gäller även 2025-utgåvan). Närmaste belagda siffra: Evidens 2023 — MMD i genomsnitt 5,5 mån (2021). Överväg omformulering till 'snitt ~5,5 mån (Evidens)' eller källa Sveriges Domstolars årsredovisning. |
| `ledtid-modulskola-montage` | verifierad | — | Datum-fältet bör ändras från 2017 till 2018 — skolan stod klar sommaren 2018 (montage maj–juli 2018) enligt Sala kommuns pressmeddelande 2018-07-30. |
| `ledtid-norge-byggesak` | verifierad | — | Angiven källa (SSB-statistiksidan) innehåller inte fristuppgiften — 12-veckorsfristen står i plan- og bygningsloven § 21-7 (verifierad hos Lovdata). Gebyrreduktionen 25 %/vecka följer av byggesaksforskriften (SAK10) § 7-4, inte av lagen — bör förtydligas i not. Föreslår Lovdata som källa. |
| `ledtid-overklagande` | verifierad | — | Uppgradering från preliminär: siffran återfinns ordagrant i båda källorna. Caveaten (avser bostadsplaner) stämmer och bör stå kvar. |
| `ledtid-spar-a` | ej-verifierbar | — | Källan underkänd i fas A (404). SKR:s ersättningssida 'Verksamhetslokaler, planering' kontrollerad — den innehåller inga ledtidsangivelser för lokalanskaffningsspår. |
| `ledtid-spar-a2` | ej-verifierbar | — | Källan (SKL:s LOU-vägledning, 74 s.) innehåller ingen tidsangivelse '2–4 år' — den beskriver LOU som 'tidskrävande' (s. 11) men kvantifierar inte. |
| `ledtid-spar-b` | ej-verifierbar | — | Källan underkänd i fas A (404); ersättningssidan hos SKR saknar ledtidsangivelser. |
| `ledtid-spar-c` | ej-verifierbar | — | Källan underkänd i fas A (404); ersättningssidan hos SKR saknar ledtidsangivelser. |
| `ledtid-spar-d-bdp` | ej-verifierbar | — | Källan underkänd i fas A (404); ersättningssidan hos SKR saknar ledtidsangivelser. |
| `ledtid-spar-d-nydp` | preliminar | — | Notens 'Detaljplan ensam: 2–5 år' bör justeras: Ledtidsindex 2025 anger 2,5–5,9 år (viktat snitt 3,9 år) för enbart detaljplan. |
| `ledtid-tidsbegransat-bygglov` | verifierad | — | Lagrumshänvisningen '9 kap. 33 § PBL' i not är föråldrad — efter omnumreringen (Lag 2026:504, nya 9 kap. sedan dec 2025) är det 9 kap. 71–72 a §§. Sak samma: max 10 år + 5 år i taget, sammanlagt 15 år (20 år för häkten/anstalter). |
| `ledtid-total-forskola` | preliminar | — | Härlett värde (byggfas 21–37 mån ur SISAB-projektdata + 2–4 år förskede). sisab.se (godkänd i fas A) styrker inte intervallet direkt på portalen, men ingen motsägelse funnen; härledningen redovisas öppet i not inkl. Krokom-jämförelsen. Kvarstår som preliminär. |
| `ledtid-total-grundskola` | preliminar | — | Nedgradering från verifierad: Lund-källan är onåbar (moten.lund.se blockerar anslutningar, fas A) och Kvarngärdesskolans 10-årstotal står inte i den angivna Uppsala-artikeln. Byggfasen 3 år är däremot belagd. |
| `ledtid-total-idrottshall` | preliminar | — | Tomma kalla_ids. WebSearch gav käll-kandidat: Lunds kommun (2025-09-19) anger projekttid ca två år från KF-beslut för fullstor hall; ByggfaktaDOCU-projekt visar byggtider 13–18 mån. Föreslår Lund-nyheten som källa. |
| `ledtid-total-lss` | ej-verifierbar | — | Enda källan underkänd i fas A (404) och värdet är dessutom härlett (byggfas + typiskt förskede). |
| `ledtid-total-vob` | preliminar | — | Angiven källa (Micasas årsredovisningssida) innehåller inte ledtidsuppgifterna. Micasas artikel 'Från behov till färdigt boende' (2026-06-30) föreslås som kompletterande källa. |
| `ver-14-man` | verifierad | — | Uppgradering från preliminär: +14 mån återfinns ordagrant i källan (Evidens 2022, s. 18, Arkwright-analysen) och även i Evidens överklaganderapport 2023 (s. 18). Slutsatsen 'Verifierad för bostäder' håller. |
| `ver-80-procent` | preliminar | — | Slutsatsen från maj 2026-rundan håller fortfarande: SKR-skriften LCA/LCC i tidiga skeden är kvalitativ och stödjer principen att kostnaden låses tidigt (MacLeamy/CURT) men anger inget exakt procenttal. 80 % förblir branschtolkning; radens formulering 'Preliminär — primärkälla saknas' är fortsatt … |
| `ver-adda-ramavtal` | ej-verifierbar | — | Källsidan är borttagen (äkta 404 sedan avtalet löpte ut 2026-03-15; Wayback-kopia finns men är egress-blockerad härifrån). Utgången 2026-03-15 och efterföljaren Förskole- och skolbyggnader 2025-2 (avtalsstart 2026-08-15) är bekräftade, men '11 leverantörer' kan inte längre kontrolleras mot öppen … |
| `ver-klimat-tidplan` | verifierad | Rättad — utökad deklaration 2028, gränsvärden 2030 (slutredovisat maj 2026) | Sedan maj-rundan har Boverket slutredovisat uppdraget (2026-05-20, rapport 2026:16): livscykel-GWP redovisas från 1 jan 2028 för byggnader >1000 m², alla nya byggnader plus gränsvärden från 1 jan 2030, kraven flyttas till PBL. Källposten bör peka på slutredovisningen (fas A:s ny_url). Sammandrage… |
| `ver-linkoping-9000` | ej-verifierbar | Ej verifierbar — siffran finns inte i åtkomlig LFP-PDF (daterad 2024-04-15) | Radens motivering 'primärkälla blockerad' är inaktuell: PDF:en på angiven URL går nu att hämta (13 s.), men den är daterad 2024-04-15 och innehåller varken '9 000' elevplatser eller något åtgärdspaket. Siffran kommer sannolikt från ett annat/senare dokument som behöver identifieras. |
| `ver-linkoping-hyresnota` | verifierad | Falsk mot angiven källa — dokumentet anger ca 1 353 mkr/år (totalt) resp. ca 1 453 mkr/år (hyrt av Lejonfastigheter) | Slutsatsen 'Verifierad' håller INTE: siffran 1 392 mnkr/år återfinns inte i dokumentet på angiven URL (daterat 2024-04-15), som i stället anger 1 353 mkr/år totalt (858 585 m² BRA, 1 617 kr/m²) och 1 453 mkr/år för Lejonfastigheter-hyror. 1 666 mnkr och '+21 %' förekommer inte heller. Siffrorna 1… |
| `ver-lou-hyresundantag` | verifierad | — | Två sakfel i not/källsammandrag: (1) Hertsöskolan i Luleå (Expandia) förekommer INTE i källan — närmaste case är rättsfallet 'Bostadsmodulerna' (Kammarrätten i Sundsvall, mål 395-10, skolmoduler = byggentreprenadkontrakt, s. 60); stryk eller källbelägg Hertsöskolan separat. (2) Utgivare är SKL, j… |
| `ver-lss-matt` | ej-verifierbar | — | Källan underkänd i fas A (404). Indexerade uppgifter anger 5 lägenheter — inte ca 6 som i källsammandraget. Socialstyrelsen-uppgiften (rekommendation 3–5, max 6) behöver egen källpost för att kunna verifieras. |
| `ver-tidsbegransat-bygglov` | verifierad | — | Slutsatsen håller i sak, men lagrumshänvisningarna är föråldrade efter PBL-omnumreringen dec 2025 (Lag 2026:504): 9 kap. 33 § → 9 kap. 71–72 §§, bostadsregeln 33 a § → 72 a §. Uppdatera not. |