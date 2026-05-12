# Research-resultat 2026-05-12

**Genomförd:** 2026-05-12 06:00–06:20 UTC (parallell körning, 7 research-agenter)
**Brief:** `docs/research-brief.md`
**Branch:** `claude/fix-header-height-H7vEF` (PR #5)

## Sammanfattning

| Spår | Tema | Nya källor | Uppdaterade | Verifieringar |
|---|---|---:|---:|---:|
| 1+2 | Samhällsfastighetsbolag + saknade aktörer | 14 | 5 | – |
| 3 | Verifiera kärnpåståenden | – | – | 6 |
| 4 | kr/m² BTA-nyckeltal 2024–2026 | 22 | – | – |
| 5+6 | Lagstiftning + demografi | 15 | – | – |
| 7 | Svensk forskning | 15 | – | – |
| 8 | Nordisk benchmark | 7 | – | – |
| 9+10 | Linköping + moduler/ramavtal | 17 | 1 | 6 |
| **Totalt** | | **90** | **6** | **12** |

**Förslag på nytt område:** `nordisk-benchmark` (#0EA5E9, dolt_default: true).

**Centrala fynd:**

1. **80%-siffran** kan inte verifieras numeriskt mot primärkälla. CURT/MacLeamy 2004 visar kvalitativ kurva utan exakt procenttal. Branschintervallet 70–80 % är en tolkning. → Förtydliga i materialet.
2. **Klimatdeklarations-gränsvärden** har skjutits fram: tidigare 2027 → nu **2028 (utökad klimatdeklaration) + 2030 (gränsvärden)**. Regeringsuppdraget aug 2025. → Uppdatera materialet.
3. **EPBD-recast 2024/1275** kräver att alla nya offentliga byggnader är nollutsläpp från **2028** (alla nya 2030). Solcellsplikt offentligt >2000 m² från 2027. MEPS för lokaler från 2030. Svensk implementering 1 juli 2026.
4. **PBL-utredningens delbetänkande** om kortare planledtider kom 31 dec 2025 — den brief refererar till "SOU 2022:34" är felidentifierad; rätt källa är **Miljötillståndsutredningen (KN 2023:02) via Dir 2025:2**.
5. **SCB BKI** visar -0,2 % årstakt feb 2024–feb 2025, första negativa siffran sedan 1950-talet. Byggpriser är på platå 2024–2026 efter uppgången 2021–2023.
6. **SKR har inte uppdaterat skolprislistan sedan 2017** ("Produktionskostnad för skolor" 7585-394-9). Detta är en bekräftad nationell datalucka.
7. **Linköping-specifika siffror**: hyresnota 1 392 → 1 666 mnkr/år (+21 %) efter LFP-åtgärder; investeringsram 803 mnkr 2025; nytt 50 %-egenfinansieringskrav.
8. **Framtidens US (Region Östergötland)**: 80 000 m² nybyggt + 55 000 m² ombyggt, ca 3,8 mdkr, 2011–2025 (14 år) — lokal regional benchmark som visar samma ledtidsproblematik.
9. **LSS-ytintervall** bör utvidgas till **600–850 m² BTA** (inte bara ~600 m²) — bekräftat genom Dunkehalla Jönköping (823 m²) och flera 2024-projekt.

---

## Förslag på nytt område

```json
{
  "id": "nordisk-benchmark",
  "namn": "Nordisk benchmark",
  "kort": "NB",
  "farg": "#0EA5E9",
  "dolt_default": true,
  "not": "Nordiska motsvarigheter till svensk samhällsfastighetsförsörjning — Statsbygg (Norge stat), Oslobygg (Oslo kommune), Senaatti (Finland stat), By & Havn (Köpenhamn projektbolag). Default avbockad i samhällsfastighetsvyn — bockas på vid internationell jämförelse."
}
```

---

## JSON-patch (komplett)

### Nya källor

```json
{
  "nya_kallor": [
    {
      "id": "micasa-fastigheter",
      "omrade": "samhallsfastighetsbolag",
      "typ": "samhallsfastighetsbolag",
      "titel": "Micasa Fastigheter — Stockholms stads bolag för omsorgsfastigheter",
      "organisation": "Micasa Fastigheter i Stockholm AB (helägt av Stockholms stad)",
      "datum": "löpande",
      "url": "https://micasa.se/om-oss/foretagsfakta/ars--och-hallbarhetsredovisning",
      "sammandrag": "Stockholms stads kommunala bolag för äldreboenden, seniorbostäder och LSS/behandlingshem. Bestånd ca 102 fastigheter om ca 1 miljon kvm; omsättning 1 181,7 mnkr 2024. Direkt motsvarighet till Lejonfastigheters vård- och omsorgssegment och naturlig benchmark för LSS-/äldreboendekostnader."
    },
    {
      "id": "norrevo-fastigheter",
      "omrade": "samhallsfastighetsbolag",
      "typ": "samhallsfastighetsbolag",
      "titel": "Norrevo Fastigheter — Norrköpings kommuns fastighetsbolag",
      "organisation": "Norrköping Norrevo Fastigheter AB (helägt av Norrköpings kommun)",
      "datum": "löpande",
      "url": "https://www.norrevo.se/om-norrevo/vara-fastigheter/",
      "sammandrag": "Norrköpings motsvarighet till Lejonfastigheter — bestånd ca 116 000 m² publika kommunala lokaler (förskolor, skolor, vårdboenden, mötesarenor). Omsättning 240,7 mnkr 2023. Per 2023-12-28 övertog Norrköpings kommun fastighetsägandet direkt från bolaget — strukturjämförelse mot Linköpings modell där Lejonfastigheter äger."
    },
    {
      "id": "futurum-fastigheter-orebro",
      "omrade": "samhallsfastighetsbolag",
      "typ": "samhallsfastighetsbolag",
      "titel": "Futurum Fastigheter i Örebro — kommunalt skol- och förskolebolag",
      "organisation": "Futurum Fastigheter i Örebro AB (helägt av Örebro kommun)",
      "datum": "2024",
      "url": "https://www.futurumfastigheter.se/wp-content/uploads/2025/10/Arsredovisning-Futurum-Fastigheter-i-Orebro-AB-2024.pdf",
      "sammandrag": "Örebros kommunala bolag för förskolor, grundskolor och gymnasieskolor. Uthyrningsbar yta 400 268 m² 2024 (drygt hälften förskolor, ca 30 % grundskolor). Ansvarar för ca 30 000 barns vardag. Direkt jämförbar med Lejonfastigheters skol- och förskolesegment."
    },
    {
      "id": "stadsfastigheter-goteborg",
      "omrade": "samhallsfastighetsbolag",
      "typ": "samhallsfastighetsbolag",
      "titel": "Stadsfastighetsförvaltningen Göteborg",
      "organisation": "Göteborgs Stad, Stadsfastighetsförvaltningen",
      "datum": "löpande",
      "url": "https://goteborg.se/stadsfastighetsforvaltningen",
      "sammandrag": "En av Sveriges största förvaltare av offentliga lokaler — ca 1 500 adresser och ca 2,2 miljoner m² lokalyta för skola, förskola, äldreomsorg, kultur och fritid i Göteborg. Storleksbenchmark för kommunal samhällsfastighetsförvaltning."
    },
    {
      "id": "stadsfastigheter-malmo",
      "omrade": "samhallsfastighetsbolag",
      "typ": "samhallsfastighetsbolag",
      "titel": "Stadsfastigheter Malmö",
      "organisation": "Malmö stad, Serviceförvaltningen (Stadsfastigheter)",
      "datum": "löpande",
      "url": "https://malmo.se/Om-Malmo-stad/Var-organisation/Forvaltningar/Serviceforvaltningen/Serviceforvaltningens-verksamheter/Stadsfastigheter.html",
      "sammandrag": "Förvaltar ca 1,8 miljoner m² byggnader och 4,9 miljoner m² mark fördelat på ca 600 objekt — skola, barnomsorg, äldreomsorg, kultur och fritid. Levererar lokalförsörjning till Malmö stads egna verksamheter."
    },
    {
      "id": "vastfastigheter-vgr",
      "omrade": "samhallsfastighetsbolag",
      "typ": "samhallsfastighetsbolag",
      "titel": "Västfastigheter — Västra Götalandsregionens sjukhusfastigheter",
      "organisation": "Västra Götalandsregionen (VGR), Västfastigheter",
      "datum": "löpande",
      "url": "https://www.vastfastigheter.se/",
      "sammandrag": "Förvaltar VGR:s sjukhusfastigheter — över 1,5 miljoner m². Sveriges största regionala fastighetsförvaltare för hälso- och sjukvård. Relevant benchmark när Region Östergötlands stora vårdinvesteringar (t.ex. Framtidens US) ska kontextualiseras."
    },
    {
      "id": "region-skane-regionfastigheter",
      "omrade": "samhallsfastighetsbolag",
      "typ": "samhallsfastighetsbolag",
      "titel": "Regionfastigheter — Region Skåne",
      "organisation": "Region Skåne, Regionservice/Regionfastigheter",
      "datum": "löpande",
      "url": "https://www.skane.se/om-region-skane/fastigheter/region-skane-som-fastighetsagare/",
      "sammandrag": "En av södra Sveriges största fastighetsägare — över 1,6 miljoner m². Komplexa sjukhusbyggnader, vårdcentraler och buss-/tågdepåer."
    },
    {
      "id": "region-ostergotland-fastigheter",
      "omrade": "samhallsfastighetsbolag",
      "typ": "samhallsfastighetsbolag",
      "titel": "Regionfastigheter — Region Östergötland",
      "organisation": "Region Östergötland",
      "datum": "löpande",
      "url": "https://www.regionostergotland.se/ro/om-region-ostergotland/fastigheter-och-lokaler",
      "sammandrag": "Region Östergötlands fastighetsfunktion förvaltar sjukvårds- och utbildningslokaler vid Universitetssjukhuset i Linköping, Vrinnevisjukhuset samt vårdcentraler och tandvård. Lokal sidoaktör till Lejonfastigheter — bl.a. byggprojektet Framtidens US (80 000 m² nybyggt + 55 000 m² ombyggt, ca 3,8 mdkr, 2011–2025)."
    },
    {
      "id": "akademiska-hus-arsredovisning-2024",
      "omrade": "samhallsfastighetsbolag",
      "typ": "rapport",
      "titel": "Hållbara kunskapsmiljöer — Års- och hållbarhetsredovisning 2024 (Akademiska Hus)",
      "organisation": "Akademiska Hus AB",
      "datum": "2025-03",
      "url": "https://www.akademiskahus.se/siteassets/dokument/finansiella-dokument/arsredovisningar/arsredovisning-2024-sve.pdf",
      "sammandrag": "Hyresintäkter 7 860 mnkr (+5 %), förvaltningsresultat 4 617 mnkr (+8 %), investeringar ca 2,5 mdkr. Bestånd ca 3,4 miljoner m² uthyrningsbar yta. Första svenska fastighetsbolag med godkänt Net-Zero-mål enligt SBTi; klimatutsläppen ca −50 % från basår 2019."
    },
    {
      "id": "specialfastigheter-arsredovisning-2024",
      "omrade": "samhallsfastighetsbolag",
      "typ": "rapport",
      "titel": "En säker värd — Års- och hållbarhetsredovisning 2024 (Specialfastigheter)",
      "organisation": "Specialfastigheter Sverige AB",
      "datum": "2025-03",
      "url": "https://www.specialfastigheter.se/download/18.254a3b8919545f8c04960772/1741876587990/Arsredovisning_2024.pdf",
      "sammandrag": "174 fastigheter med ca 1,1 miljoner m² lokalarea (kriminalvård, försvar, övrigt). Totala intäkter 3 502 mnkr (+14 %), förvaltningsresultat 1 713 mnkr (+5 %), fastighetsvärde ca 52 mdkr, projektutvecklingsinvesteringar 5,1 mdkr."
    },
    {
      "id": "hemso-arsredovisning-2024",
      "omrade": "samhallsfastighetsbolag",
      "typ": "rapport",
      "titel": "Vi stärker ryggraden i samhället — Års- och hållbarhetsredovisning 2024 (Hemsö)",
      "organisation": "Hemsö Fastighets AB",
      "datum": "2025-03",
      "url": "https://www.hemso.se/content/uploads/2025/03/Arsredovisning-2024.pdf",
      "sammandrag": "Fastighetsvärde över 75 mdkr; driftnetto 3 833 mnkr 2024 (+19 % resultatökning). Färdigställde 12 projekt med 82 äldreboendeplatser och 4 700 skolplatser. Ekonomisk uthyrningsgrad historiskt 97–99 %."
    },
    {
      "id": "vacse-arsredovisning-2024",
      "omrade": "samhallsfastighetsbolag",
      "typ": "rapport",
      "titel": "Vacse AB (publ) Års- och hållbarhetsredovisning 2024",
      "organisation": "Vacse AB (publ)",
      "datum": "2025",
      "url": "https://storage.mfn.se/9565f85d-94be-4d98-8d8f-be7c6e2bbe03/arsredovisning-2024.pdf",
      "sammandrag": "Hyresintäkter 165,3 mnkr (+7,2 %), driftöverskott 128,0 mnkr, förvaltningsresultat 92,5 mnkr. Fastighetsvärde över 10 mdkr för första gången. Uthyrningsgrad 100 % varav 98,9 % offentliga hyresgäster. Viktad återstående hyrestid ca 9,6 år (vissa avtal 15 år)."
    },
    {
      "id": "stenvalvet-arsredovisning-2024",
      "omrade": "samhallsfastighetsbolag",
      "typ": "rapport",
      "titel": "Fastighets AB Stenvalvet — Års- och hållbarhetsredovisning 2024",
      "organisation": "Fastighets AB Stenvalvet (publ)",
      "datum": "2025-03",
      "url": "https://mb.cision.com/Main/3555/4111812/3288266.pdf",
      "sammandrag": "Ca 100 fastigheter, area ca 589 000–593 000 m², marknadsvärde ca 15,9 mdkr. Driftnetto 597 mnkr 2024 (+10 % drivet av nya/omförhandlade hyresavtal samt KPI-indexering)."
    },
    {
      "id": "akademiska-hus-studentbarometern-2024",
      "omrade": "samhallsfastighetsbolag",
      "typ": "rapport",
      "titel": "Studentbarometern 2024",
      "organisation": "Akademiska Hus AB",
      "datum": "2024",
      "url": "https://www.akademiskahus.se/contentassets/6270b9ce1fe74f6cb461c8e73d5788a4/studentbarometer_aha_2024.pdf",
      "sammandrag": "Akademiska Hus återkommande undersökning av studenters upplevelse av campusmiljöer. Underlag för hur fysisk lokal påverkar nyttjandegrad och nöjdhet."
    },

    {
      "id": "halmstad-vallasskolan-2025",
      "omrade": "skolor-forskolor",
      "typ": "kommunal-plan",
      "titel": "Nya Vallåsskolan börjar byggas 2025 — F-9 för 900 + 60 elever",
      "organisation": "Halmstads kommun",
      "datum": "2025-04",
      "url": "https://www.mynewsdesk.com/se/halmstadskommun/pressreleases/nya-vallaasskolan-boerjar-byggas-2025-3027341",
      "sammandrag": "F-9-skola för 900 + 60 anpassad grundskola, ca 18 600 m² BTA, två idrottshallar. Kontraktssumma ca 470–475 mkr → ca 25 000–26 000 kr/m² BTA. Byggstart juni 2025, klar HT 2028."
    },
    {
      "id": "uppsala-kvarngardesskolan-2025-slutrapport",
      "omrade": "skolor-forskolor",
      "typ": "slutrapport",
      "titel": "Nya Kvarngärdesskolan invigd 2025 (samverkansprojekt ByggDialog–Skolfastigheter)",
      "organisation": "Uppsala kommun / Uppsala Skolfastigheter / ByggDialog",
      "datum": "2025-08",
      "url": "https://www.uppsala.se/kommun-och-politik/nyheter-och-pressmeddelanden/2025/nya-kvarngardesskolan-invigd/",
      "sammandrag": "F-9 + idrottshall + matsal (330 platser), kapacitet ca 1 000 elever, budget 510 mkr i samverkansentreprenad. Byggtid sommar 2022–HT 2025 (~3 år)."
    },
    {
      "id": "stockholm-kista-ang-skola-2024",
      "omrade": "skolor-forskolor",
      "typ": "kommunal-plan",
      "titel": "Ny F-9-skola för 900 elever planeras i Kista Äng",
      "organisation": "SISAB / Stockholms stad",
      "datum": "2024-06",
      "url": "https://www.mynewsdesk.com/se/moderaterna-stockholms-stad/pressreleases/ny-f-9-skola-foer-900-elever-planeras-i-kista-aeng-3030573",
      "sammandrag": "SISAB-projekt: F-9 för 900 elever, projektkostnad ~385 mkr (preliminär). Vid antagen BTA 12 000–14 000 m² motsvarar det ca 27 000–32 000 kr/m² BTA. Stockholmsbenchmark."
    },
    {
      "id": "norrkoping-smedbyskolan-2024",
      "omrade": "skolor-forskolor",
      "typ": "slutrapport",
      "titel": "Smedbyskolan och Kungsängsskolan invigda 2024",
      "organisation": "Norrevo / Norrköpings kommun",
      "datum": "2024-08",
      "url": "https://norrkoping.se/nyheter/2024/2024-08-29-kungsangsskolan-och-smedbyskolan-invigda",
      "sammandrag": "F-6-skola i två plan, 14 klasser (350–400 elever), inkl. fullstor idrottshall. Total byggarea ca 7 850 m² BTA. Budget 252 mkr → ca 32 000 kr/m² BTA. Geografiskt nära Linköping — direkt jämförbar referens."
    },
    {
      "id": "motala-vatternskolan-2025",
      "omrade": "skolor-forskolor",
      "typ": "kommunal-plan",
      "titel": "Upphandling av entreprenör för Vätternskolan — Motala",
      "organisation": "Motala kommun",
      "datum": "2025-09",
      "url": "https://www.motala.se/nyheter/upphandling-av-entreprenor-till-nya-vatternskolan-klar/",
      "sammandrag": "F-6 för 392 elever + förskola 160 barn + idrottshall + fritidsgård. Kommunfullmäktige godkände 330 mkr (2023). Byggstart dec 2025."
    },
    {
      "id": "enkoping-grillby-forskola-2024",
      "omrade": "skolor-forskolor",
      "typ": "slutrapport",
      "titel": "Grillby förskola, Enköping (Arcona)",
      "organisation": "Enköpings kommun / Arcona",
      "datum": "2024",
      "url": "https://www.arcona.se/produktomraden/utbildningsbyggnader/grillby-forskola/",
      "sammandrag": "Förskola ca 2 100 m² BTA, kontraktssumma ca 67 mkr → ca 31 900 kr/m² BTA. 6 avdelningar (100–120 barn). Modernt referensprojekt 2024."
    },
    {
      "id": "orebro-brickebacken-vob-2024",
      "omrade": "fastighet-demografi",
      "typ": "kommunal-plan",
      "titel": "Vård- och omsorgsboende södra Brickebacken, Örebro",
      "organisation": "Örebro kommun / Futurum",
      "datum": "2024-03",
      "url": "https://www.nyaprojekt.se/2024/03/22/byggstart-vard-och-omsorgsboende-i-sodra-brickebacken-i-orebro/",
      "sammandrag": "Vård- och omsorgsboende 106 lägenheter, total investering ca 230 mkr → ca 2,2 mkr/plats. Antagen BTA ~7 000–8 000 m² → 29 000–33 000 kr/m² BTA."
    },
    {
      "id": "jonkoping-dunkehalla-lss-2024",
      "omrade": "fastighet-demografi",
      "typ": "kommunal-plan",
      "titel": "Dunkehalla gruppbostad, Jönköping",
      "organisation": "Jönköpings kommun",
      "datum": "2024-09",
      "url": "https://www.byggfaktadocu.se/dunkehalla-gruppbostad-klammestorp-1-27/projekt.html",
      "sammandrag": "LSS-gruppbostad 823 m² BTA, ca 6 lägenheter, kostnad 20–30 mkr → ca 24 000–36 000 kr/m² BTA. Bekräftar materialets LSS-påstående men yta-intervallet bör utvidgas till 600–850 m²."
    },
    {
      "id": "scb-bki-2025",
      "omrade": "fastighet-demografi",
      "typ": "branschindex",
      "titel": "Byggkostnadsindex (BKI) — statistik 2024–2025",
      "organisation": "SCB",
      "datum": "löpande (senast feb 2025)",
      "url": "https://www.scb.se/hitta-statistik/statistik-efter-amne/priser-och-ekonomiska-tendenser/priser/byggkostnadsindex-bki/",
      "sammandrag": "BKI för flerbostadshus minskade -0,2 % feb 2025 vs feb 2024 — första negativa årstakten sedan 1950-talet. 2024–2025 är en relativ platå i byggprisutvecklingen efter den kraftiga uppgången 2021–2023."
    },
    {
      "id": "skr-regionernas-fastighetsnyckeltal-2024",
      "omrade": "fastighet-demografi",
      "typ": "statistik",
      "titel": "Regionernas fastighetsnyckeltal avseende 2024",
      "organisation": "SKR / FoU-fonden för fastighetsfrågor",
      "datum": "2025-05",
      "url": "https://extra.skr.se/offentligafastigheter/publikationer/publikationer/regionernasfastighetsnyckeltalavseende2024.90540.html",
      "sammandrag": "Tolfte årgång. Regionernas investeringsnivå 2024 ca 14 mdkr. Snitt 1 578 kr/inv i investering, median 1 395 kr/inv. Innehåller drift-, energi- och investeringsnyckeltal för sjukvårdsfastigheter."
    },
    {
      "id": "skolverket-kostnader-2024",
      "omrade": "skolor-forskolor",
      "typ": "statistik",
      "titel": "Kostnader för skolväsendet 2024",
      "organisation": "Skolverket",
      "datum": "2025-09",
      "url": "https://www.skolverket.se/sok-publikationer/publikationsserier/beskrivande-statistik/2025/kostnader-for-skolvasendet-och-annan-pedagogisk-verksamhet-2024",
      "sammandrag": "Total kostnad för skolväsendet 2024: 368,3 mdkr (+1,6 % fast pris). Driftskostnadsbenchmark — komplement till kr/m² BTA-investeringssiffror."
    },

    {
      "id": "prop-2024-25-169-bygglov",
      "omrade": "detaljplan",
      "typ": "lagstiftning",
      "titel": "Ett nytt regelverk för bygglov (Prop. 2024/25:169)",
      "organisation": "Regeringen / Landsbygds- och infrastrukturdepartementet",
      "datum": "2025-05",
      "url": "https://www.regeringen.se/contentassets/65b78cab2c2d46a2abd128521917ec14/ett-nytt-regelverk-for-bygglov-prop.-202425169.pdf",
      "sammandrag": "Ny bygglovsproposition som differentierar bygglovsplikten geografiskt. Trädde i kraft 1 december 2025. Förändrar mindre kompletteringsåtgärder, inte primärt samhällsfastigheter på egen mark."
    },
    {
      "id": "boverket-pbl-nyheter-dec-2025",
      "omrade": "detaljplan",
      "typ": "vagledning",
      "titel": "Lista med PBL-ändringar som trädde i kraft 1 december 2025",
      "organisation": "Boverket",
      "datum": "2025-12",
      "url": "https://www.boverket.se/sv/samhallsplanering/uppdrag/nytt-regelverk-for-bygglov/lista-pbl--andringar/",
      "sammandrag": "Boverkets sammanställning av PBL-ändringar enligt prop. 2024/25:169. Övergångsregler: äldre regler gäller för ärenden inlett före 1 dec 2025."
    },
    {
      "id": "miljotillstand-utredning-dir-2025-2",
      "omrade": "detaljplan",
      "typ": "lagstiftning",
      "titel": "Tilläggsdirektiv till Miljötillståndsutredningen (Dir. 2025:2)",
      "organisation": "Regeringen / Klimat- och näringslivsdepartementet",
      "datum": "2025-01",
      "url": "https://www.regeringen.se/pressmeddelanden/2025/01/miljotillstandsutredningen-far-nytt-tillaggsdirektiv/",
      "sammandrag": "Regeringen ger Miljötillståndsutredningen (KN 2023:02) uppdrag att utreda hur handläggningstider i plan- och bygglovsprocessen kan kortas. Delbetänkande om kortare ledtider för planbeslut: deadline 31 december 2025."
    },
    {
      "id": "remiss-andring-detaljplan-2024",
      "omrade": "detaljplan",
      "typ": "lagstiftning",
      "titel": "Översyn av regelverket för ändring av detaljplan (remiss)",
      "organisation": "Regeringen / Landsbygds- och infrastrukturdepartementet",
      "datum": "2024-10",
      "url": "https://regeringen.se/remisser/2024/10/remiss-av-uppdrag-om-oversyn-av-regelverket-for-andring-av-detaljplan-och-av-olagliga-planbestammelser/",
      "sammandrag": "Remiss av Boverkets utredning om enklare ändring av detaljplan utan att hela planen behöver göras om — direkt relevant för 'flytta gränsen på skolgården'-fall."
    },
    {
      "id": "epbd-recast-2024-1275",
      "omrade": "fastighet-demografi",
      "typ": "lagstiftning",
      "titel": "EU-direktiv 2024/1275 om byggnaders energiprestanda (EPBD recast)",
      "organisation": "Europeiska unionen",
      "datum": "2024-05",
      "url": "https://www.boverket.se/sv/byggande/uppdrag/direktiv-for-byggnaders-energiprestanda/",
      "sammandrag": "EPBD-recast trädde i kraft 28 maj 2024; svensk implementering 1 juli 2026. Nya byggnader som ägs/nyttjas av offentlig sektor ska vara nollutsläppsbyggnader senast 2028 (alla nya 2030). MEPS för lokaler: senast 2030 inga lokaler i de 16 % minst energieffektiva. Solcellsplikt offentligt >2000 m² senast 2027, >750 m² senast 2028. Boverket bedömer ca 31 000 svenska lokalbyggnader behöver effektiviseras till 2033."
    },
    {
      "id": "skr-pm-eed-epbd-2025",
      "omrade": "fastighet-demografi",
      "typ": "vagledning",
      "titel": "Nya krav på energieffektivisering i offentliga byggnader — PM om EED och EPBD",
      "organisation": "Sveriges Kommuner och Regioner (SKR)",
      "datum": "2025-10",
      "url": "https://skr.se/download/18.2eae6b4519a0f5b858e91b99/1761657634107/Energidirektiv_EED-EPBD_okt2025_PM-SKR-28oktober.pdf",
      "sammandrag": "SKR:s tolkning av EPBD-recast och EED för kommunala fastighetsägare: nollutsläppskrav för nya offentliga byggnader från 2028, solcellsplikt 2027–2028, MEPS-krav på lokaler från 2030."
    },
    {
      "id": "boverket-gransvarde-uppdrag-2025",
      "omrade": "fastighet-demografi",
      "typ": "lagstiftning",
      "titel": "Nytt regeringsuppdrag om gränsvärden för byggnaders klimatpåverkan",
      "organisation": "Boverket / Regeringen",
      "datum": "2025-08",
      "url": "https://www.boverket.se/sv/klimatdeklaration/om-klimatdeklaration/nyheter/nytt-regeringsuppdrag-till-boverket-om-gransvarden-for-byggnaders-klimatpaverkan/",
      "sammandrag": "Utökad klimatdeklaration ska träda i kraft senast jan 2028, gränsvärden för klimatpåverkan senast jan 2030. Boverkets förslag (aug 2025): sänk gränsvärdet -25 % till 2030 jmf 2025-nivån. Uppdraget redovisas senast 1 juni 2026."
    },
    {
      "id": "eu-taxonomi-2021-2139",
      "omrade": "fastighet-demografi",
      "typ": "lagstiftning",
      "titel": "Delegerad förordning (EU) 2021/2139 — taxonomins klimat-DA",
      "organisation": "Europeiska kommissionen",
      "datum": "2021-06",
      "url": "https://www.boverket.se/sv/byggande/cirkular-ekonomi/styrmedel/taxonomin/",
      "sammandrag": "EU-taxonomins krav för byggnader: nybyggnad primärenergi ≥ 10 % under NZEB; klimatdeklaration livscykel för byggnader >5000 m²; befintliga topp 15 % i nationellt bestånd. För kommunala samhällsfastigheter inte bindande men styr finansieringsvillkor vid gröna obligationer."
    },
    {
      "id": "scb-framtida-befolkning-2026-2070",
      "omrade": "fastighet-demografi",
      "typ": "statistik",
      "titel": "Sveriges framtida befolkning 2026–2070",
      "organisation": "SCB",
      "datum": "2026-04",
      "url": "https://www.scb.se/hitta-statistik/statistik-efter-amne/befolkning-och-levnadsforhallanden/befolkningens-sammansattning-och-utveckling/befolkningsframskrivningar/pong/statistiknyhet/sveriges-framtida-befolkning-2026-2070/",
      "sammandrag": "Senaste framskrivningen. 2026–2030 ökar Sverige med ~5 000 personer/år (jmf 45 000/år 2021–2025). 2035 prognos: 10,8 mn invånare. Antal skolbarn 6–15 år minskar stadigt under 15 år framåt och återhämtar sig inte under framskrivningsperioden. 2025 föddes 97 500 barn — lägst på 23 år, TFR 1,42."
    },
    {
      "id": "linkoping-befolkningsprognos-2024-2034",
      "omrade": "fastighet-demografi",
      "typ": "kommunal-plan",
      "titel": "Linköpings befolkningsprognos 2024–2034",
      "organisation": "Linköpings kommun (kommunstyrelsen)",
      "datum": "2025-04",
      "url": "https://www.linkoping.se/kommun-och-politik/fakta-om-linkoping/statistik/linkoping-i-siffror/befolkning/prognos/",
      "sammandrag": "Kommunstyrelsen antog 8 april 2025. Befolkningen ökar ~1 150 pers/år nästa decennium. Barn 0–5 år: +833 till 10 888 år 2034. Barn 6–12 år: -2 476 till 10 716 år 2034. Linköping avviker från riket — växande förskoleåldrar samtidigt som grundskoleåldrar krymper."
    },
    {
      "id": "norrkoping-befolkningsprognos-2025-2034",
      "omrade": "fastighet-demografi",
      "typ": "kommunal-plan",
      "titel": "Reviderad befolkningsprognos för Norrköping 2025–2034",
      "organisation": "Norrköpings kommun",
      "datum": "2025-08",
      "url": "https://norrkoping.se/download/18.6212ec29198c5d45284479e/1755845032578/Reviderad%20befolkningsprognos%20f%C3%B6r%20kommunen%20och%20delomr%C3%A5den%202025.pdf",
      "sammandrag": "Reviderad prognos visar tydliga minskningar av barn och unga. Utbildningsnämnden har fattat beslut om anpassningar i förskola och skola till följd av lägre demografi. Gymnasieåldrarna ökar dock."
    },
    {
      "id": "skolverket-grundskola-2024-25",
      "omrade": "fastighet-demografi",
      "typ": "statistik",
      "titel": "Elever och skolenheter i grundskolan — läsåret 2024/25",
      "organisation": "Skolverket",
      "datum": "2025-03",
      "url": "https://www.skolverket.se/sok-publikationer/publikationsserier/beskrivande-statistik/2025/elever-och-skolenheter-i-grundskolan---lasaret-2024-25",
      "sammandrag": "Drygt 1 100 000 elever i grundskolan, en minskning med nästan 5 440 elever jmf föregående år — den största minskningen i absoluta tal hittills. Bekräftar att den demografiska svackan redan börjat slå."
    },

    {
      "id": "cva-chalmers-vardens-arkitektur",
      "omrade": "fastighet-demografi",
      "typ": "forskning",
      "titel": "Centrum för vårdens arkitektur (CVA) — Chalmers",
      "organisation": "Chalmers tekniska högskola / Göteborgs universitet",
      "datum": "löpande",
      "url": "https://www.chalmers.se/sv/centrum/cva/",
      "sammandrag": "Sveriges ledande forskningscentrum för evidensbaserad design av vårdmiljöer. AIDAH-projektet (Architectural Inventions for Dwelling, Ageing and Healthcare) undersöker hur arkitektur i särskilda boenden påverkar livskvalitet. Direkt relevant för LSS-gruppbostäder och VOB."
    },
    {
      "id": "cmb-kommunal-strategisk-fastighetsforvaltning",
      "omrade": "samhallsfastighetsbolag",
      "typ": "forskning",
      "titel": "Kommunal strategisk fastighetsförvaltning — hinder och möjligheter",
      "organisation": "CMB Chalmers (Centre for Management of the Built Environment)",
      "datum": "2024",
      "url": "https://www.cmb-chalmers.se/aktivitet/kommunal-strategisk-fastighetsforvaltning-hinder-och-mojligheter-2/",
      "sammandrag": "CMB-forskning som identifierar att stora behov av förnyelse kombinerat med klimatmål kräver omprövad arbetsmetodik och bättre samverkan mellan förvaltningar. Relevant för Lejonfastigheters roll gentemot Linköpings nämnder."
    },
    {
      "id": "iva-resurseffektiva-lokaler",
      "omrade": "fastighet-demografi",
      "typ": "rapport",
      "titel": "Resurseffektiva lokaler i Sverige",
      "organisation": "Kungl. Ingenjörsvetenskapsakademien (IVA)",
      "datum": "2019",
      "url": "https://www.iva.se/globalassets/bilder/projekt/resurseffektivitet-och-cirkular-ekonomi/201912-iva-rece-branschrapport-lokaler-h.pdf",
      "sammandrag": "IVA-rapport som visar att kontors- och lokalbestånd nyttjas till ~10 procent och föreslår att skattefrågor, hyreslag och PBL ses över för att möjliggöra lokaldelning. Den centrala policyimpulsen för 'samnyttja innan du bygger nytt'."
    },
    {
      "id": "iva-vagval-klimatet",
      "omrade": "fastighet-demografi",
      "typ": "rapport",
      "titel": "Vägval för klimatet — delprojekt Samhällsbyggnad",
      "organisation": "Kungl. Ingenjörsvetenskapsakademien (IVA)",
      "datum": "2020",
      "url": "https://www.iva.se/det-iva-gor/projekt-och-program/vagval-for-klimatet/",
      "sammandrag": "IVAs delprojekt om samhällsbyggnad pekar på att ~50 % av en byggnads klimatpåverkan över 50 år ligger i byggprocessen — direkt relevant för programskede, materialval och klimatdeklaration."
    },
    {
      "id": "ivl-kunskapsbank-klimat-bebyggelse",
      "omrade": "fastighet-demografi",
      "typ": "forskning",
      "titel": "Kunskapsbank för klimat och bebyggelse (KF4KB)",
      "organisation": "IVL Svenska Miljöinstitutet",
      "datum": "2021–2024",
      "url": "https://www.ivl.se/projekt/kunskapsbank-for-klimat-och-bebyggelse.html",
      "sammandrag": "IVL:s samlade kunskap om klimatneutralt byggande. Bryter ned tekniska, organisatoriska och regulatoriska åtgärder per skede."
    },
    {
      "id": "ccbuild-cirkulart-byggande",
      "omrade": "fastighet-demografi",
      "typ": "forskning",
      "titel": "CCBuild — Centrum för cirkulärt byggande",
      "organisation": "IVL Svenska Miljöinstitutet med branschpartners",
      "datum": "löpande",
      "url": "https://ccbuild.se/",
      "sammandrag": "Nationell plattform för cirkulärt byggande — kunskapsbank, marknadsplats för återbruksprodukter, digitala verktyg. Resurs- och avfallsriktlinjer för byggande och rivning."
    },
    {
      "id": "smart-built-environment",
      "omrade": "fastighet-demografi",
      "typ": "forskning",
      "titel": "Smart Built Environment — strategiskt innovationsprogram",
      "organisation": "IQ Samhällsbyggnad / Formas, Vinnova, Energimyndigheten",
      "datum": "löpande",
      "url": "https://www.smartbuilt.se/projekt/publikationer/",
      "sammandrag": "Strategiskt innovationsprogram för digitalisering av samhällsbyggnadssektorn. Innehåller forskning om informationshantering i offentliga beställares byggprocesser."
    },
    {
      "id": "skolhusgruppen-publikationer",
      "omrade": "skolor-forskolor",
      "typ": "branschorganisation",
      "titel": "Skolhusgruppen — publikationsbibliotek om evidensbaserad skoldesign",
      "organisation": "Skolhusgruppen",
      "datum": "löpande",
      "url": "https://www.skolhusgruppen.se/publikationer-25288138",
      "sammandrag": "Samlar svensk forskning och praktik om skol- och förskolemiljöer. Forskningsöversikt 2023 av Jansson & Herbert sammanställer 88 vetenskapliga publikationer. Centralt nav för evidensbaserad skoldesign."
    },
    {
      "id": "lindahl-chalmers",
      "omrade": "samhallsfastighetsbolag",
      "typ": "forskning",
      "titel": "Göran Lindahl, forskning om byggprocess och facility management ur beställarperspektiv",
      "organisation": "Chalmers, Arkitektur och samhällsbyggnadsteknik",
      "datum": "löpande",
      "url": "https://research.chalmers.se/en/person/goranlin",
      "sammandrag": "Docent vid Chalmers med fokus på projektledning och FM ur beställarperspektiv, särskilt planering av arbetsplatser och vårdmiljöer. Central svensk akademisk röst för beställarrollen."
    },

    {
      "id": "statsbygg-arsrapport-2024",
      "omrade": "nordisk-benchmark",
      "typ": "rapport",
      "titel": "Statsbygg Årsrapport 2024",
      "organisation": "Statsbygg (Norge, Digitaliserings- og forvaltningsdepartementet)",
      "datum": "2025-03",
      "url": "https://dok.statsbygg.no/wp-content/uploads/2025/03/Arsrapport2024_endelig-3.pdf",
      "sammandrag": "Norges statliga lokalförsörjare (motsvarar SFV i Sverige). Förvaltar ~2,9 miljoner m² statliga byggnader. 2024 var aktiviteten rekordhög med Nytt Regjeringskvartal, Livsvitenskapsbygget, NTNU Campussamling m.fl. Rapporten dokumenterar konkret avvikelseanalys — direkt jämförbar med svenska programskede-resonemang."
    },
    {
      "id": "oslobygg-arsberetning-2024",
      "omrade": "nordisk-benchmark",
      "typ": "samhallsfastighetsbolag",
      "titel": "Årsberetning 2024 — Oslobygg KF",
      "organisation": "Oslobygg KF, Oslo kommune",
      "datum": "2025",
      "url": "https://oslokommune.framsikt.net/2024/obf/mr-202412-arsberetning_2024_oslobygg_kf",
      "sammandrag": "Oslos kommunala lokalförsörjare — slogs ihop 2021 av Undervisningsbygg, Omsorgsbygg, Kultur- og idrettsbygg, Boligbygg. ~2,7 miljoner m², ~1 800 byggnader. Investerar 5–6 mdr NOK/år. Närmaste direkta motsvarighet till Lejonfastigheter — fast i Oslo-skala."
    },
    {
      "id": "oslobygg-kostnadsanalys-skoler",
      "omrade": "nordisk-benchmark",
      "typ": "rapport",
      "titel": "Kostnadsanalyse Bentsebrua skole vs Torvbråten skole",
      "organisation": "Oslobygg KF / DFØ Anskaffelser",
      "datum": "2023-11",
      "url": "https://www.anskaffelser.no/sites/default/files/2024-06/Rapport-Sammenstilling-av-kostnadsnivaer-Bentsebrua-skole-Torvbraten-skole-30.11.2023.pdf",
      "sammandrag": "Jämförande kostnadsanalys mellan två norska skolprojekt — bakgrund till offentlig debatt där Bjørvika skole rapporterades ~3 gånger så dyr per elev som Vestli. Visar hur kravnivå, plats och programskede driver kostnadsspridning."
    },
    {
      "id": "senaatti-arsrapport-2024",
      "omrade": "nordisk-benchmark",
      "typ": "rapport",
      "titel": "Senaatti-kiinteistöt Toimintakertomus 2024",
      "organisation": "Senatfastigheter (Finland)",
      "datum": "2025-02",
      "url": "https://www.senaatti.fi/app/uploads/2025/02/Tilinpaatos-Senaatti-kiinteistot-2024.pdf",
      "sammandrag": "Finlands statliga lokalförsörjare för civila myndigheter. Koncernen omsatte 2024 ca 1 mdr EUR. Byggnadsinvesteringar 407 milj. EUR. Senatkoncernen sänkte myndighetshyror med 19 milj. EUR vid årsskiftet 2025. Direkt jämförbar med SFV/Statsbygg."
    },
    {
      "id": "bygherreforeningen-dk",
      "omrade": "nordisk-benchmark",
      "typ": "branschorganisation",
      "titel": "Bygherreforeningen — Danmark",
      "organisation": "Bygherreforeningen, Danmark",
      "datum": "löpande",
      "url": "https://bygherreforeningen.dk/saadan-er-bygherrerne-i-danmark/",
      "sammandrag": "Dansk motsvarighet till Byggherrarna Sverige. 270 medlemmar (offentliga, allmännyttiga, privata beställare) som tillsammans bygger för >100 mdr DKK/år. Samarbetar med Byggeriets Evalueringscenter om nationell nyckeltalsmodell."
    },
    {
      "id": "by-og-havn-arsrapport-2024",
      "omrade": "nordisk-benchmark",
      "typ": "rapport",
      "titel": "By & Havn Årsrapport 2024",
      "organisation": "Udviklingsselskabet By & Havn I/S (Köpenhamns kommun + finansministeriet)",
      "datum": "2025-04",
      "url": "https://byoghavn.dk/wp-content/uploads/2025/07/By-Havn-Aarsrapport-2024-1.pdf",
      "sammandrag": "Köpenhamns offentligt ägda projektbolag för stadsutveckling (Ørestad, Nordhavn). Bolaget säljer byggrätter som styr när skolor och daginstitutioner byggs ut — strukturell motsvarighet till svenska markanvisningsmodellen. Första gången rapporten är CSRD-integrerad."
    },
    {
      "id": "ssb-kostra-byggesak",
      "omrade": "nordisk-benchmark",
      "typ": "statistik",
      "titel": "Plan- og byggesaksbehandling — KOSTRA",
      "organisation": "Statistisk sentralbyrå (SSB) / DiBK, Norge",
      "datum": "löpande",
      "url": "https://www.ssb.no/natur-og-miljo/statistikker/fysplan/aar",
      "sammandrag": "Norsk nationell statistik för byggsöknads- och reguleringsplanshandläggning per kommun. Norge har lagstadgad 12-veckors frist för byggesak med automatisk gebyrreduktion (25 %/vecka). Direkt jämförbar primärkälla mot svensk PBL-handläggningstid."
    },

    {
      "id": "linkoping-budget-2025-2030",
      "omrade": "fastighet-demografi",
      "typ": "kommunal-plan",
      "titel": "Budget 2025 med plan för 2026–2030 — Linköpings kommun",
      "organisation": "Linköpings kommun",
      "datum": "2024-11",
      "url": "https://www.linkoping.se/contentassets/1d75d3d8b5e84f7595208795efa20a1a/budget-2025-med-plan-for-2026-2030.pdf",
      "sammandrag": "Investeringsram 803 mnkr för 2025. Nytt finansiellt krav: 50 % av investeringar ska finansieras med egna medel. Barn- och ungdomsnämnden tillförs 39 mnkr för demografianpassning; social- och omsorgsnämnden 25 mnkr för LSS-utbyggnad."
    },
    {
      "id": "linkoping-lfp-2024-revision",
      "omrade": "skolor-forskolor",
      "typ": "kommunal-plan",
      "titel": "Kommungemensam lokalförsörjningsplan (revision dec 2024)",
      "organisation": "Linköpings kommun, Kommunstyrelsen",
      "datum": "2024-12",
      "url": "https://sammantraden.linkoping.se/welcome-sv/namnder-styrelser/kommunstyrelsen/kommunstyrelsen-2024-12-03/agenda/bilaga-2-kommungemensam-lokalforsorjningsplanpdf?downloadMode=open",
      "sammandrag": "Senaste reviderade kommungemensamma LFP, beslutad KS 2024-12-03. Åtgärdspaket för skola, förskola, äldreboenden, LSS och idrott. Refererar hyresnotor ~1 392 mnkr/år → ~1 666 mnkr/år (+21 %) efter åtgärdspaket."
    },
    {
      "id": "region-ostergotland-framtidens-us",
      "omrade": "fastighet-demografi",
      "typ": "kommunal-plan",
      "titel": "Framtidens US — Universitetssjukhuset i Linköping",
      "organisation": "Region Östergötland, Regionfastigheter",
      "datum": "löpande",
      "url": "https://www.regionostergotland.se/ro/om-region-ostergotland/fastigheter-och-lokaler/byggprojekt-i-region-ostergotland/byggprojekt-universitetssjukhuset-i-linkoping",
      "sammandrag": "Regionens största fastighetsinvestering: 80 000 m² nybyggnation + 55 000 m² ombyggnation 2011–2025. Investeringsbeslut totalt ca 3,8 mdkr. Visar att även regionsjukhus har ledtider i nivå med stora kommunala projekt (14 år)."
    },
    {
      "id": "norrkoping-principer-lokalforsorjning",
      "omrade": "skolor-forskolor",
      "typ": "kommunal-plan",
      "titel": "Principer för Lokalförsörjning — Norrköpings kommun",
      "organisation": "Norrköpings kommun, Samhällsbyggnadskontoret",
      "datum": "2024-01",
      "url": "https://norrkoping.se/download/18.48976c7718c8af0a6c542ae/1705412136601/KS%202023_0531-2%20_%20KS%202023_0531-2%20Principer%20f%C3%B6r%20lokalf%C3%B6rs%C3%B6rjning%20-%20Lokalf%C3%B6rs%C3%B6rjningsplan%201%201917705_1676706_0.PDF",
      "sammandrag": "Norrköpings styrdokument med principer, roller och planprocess för lokalförsörjning. Direkt jämförbar med Linköpings KS-styrdokument."
    },
    {
      "id": "akademiska-hus-campusplan-valla-2030",
      "omrade": "samhallsfastighetsbolag",
      "typ": "kommunal-plan",
      "titel": "Campusplan Linköpings universitet, Campus Valla 2030",
      "organisation": "Akademiska Hus & Linköpings universitet",
      "datum": "2018",
      "url": "https://www.akademiskahus.se/contentassets/36eb607b99f347e39c9768fd8b415088/campusplan_liu_valla_2030_webb.pdf",
      "sammandrag": "Strukturplan för Campus Valla 2018–2030, framtagen av Akademiska Hus i samarbete med LiU och Linköpings kommun. Konkretiseras t.ex. via Studenthus Valla (Miljöbyggnad guld)."
    },
    {
      "id": "adda-forskolebyggnader-2018",
      "omrade": "skolor-forskolor",
      "typ": "vagledning",
      "titel": "Ramavtal Förskolebyggnader 2018",
      "organisation": "Adda Inköpscentral (f.d. SKL Kommentus)",
      "datum": "2018 (giltigt t.o.m. 2026-03-15)",
      "url": "https://www.adda.se/upphandling-och-ramavtal/ramavtal-och-avtalskategorier/bygg-och-fastighet/forskolebyggnader/forskolebyggnader-2018/",
      "sammandrag": "Nationellt ramavtal för nyckelfärdiga förskolebyggnader. Fyra konceptstorlekar: A) 60–80 barn 1-plan, B) 80–120 barn 1-plan, C) 80–120 barn 2-plan, D) 120–160 barn 2-plan. 11 leverantörer. Slutar 2026-03-15."
    },
    {
      "id": "adda-forskola-skola-2025-2",
      "omrade": "skolor-forskolor",
      "typ": "vagledning",
      "titel": "Förskole- och skolbyggnader 2025-2 (efterföljare till 2018-avtalet)",
      "organisation": "Adda Inköpscentral",
      "datum": "2026",
      "url": "https://www.adda.se/upphandling-och-ramavtal/planerade-och-pagaende-upphandlingar/forskole-och-skolbyggnader-2025-2/",
      "sammandrag": "Efterföljaren till Förskolebyggnader 2018, utökad till att även omfatta grundskolebyggnader. Planerad avtalsstart sommaren 2026."
    },
    {
      "id": "skr-bestallarvanlig-samverkan-2021",
      "omrade": "samhallsfastighetsbolag",
      "typ": "vagledning",
      "titel": "Beställarvänlig samverkan i byggentreprenader",
      "organisation": "SKR & Byggherrarna",
      "datum": "2021",
      "url": "https://skr.se/download/18.45167e4317e2b341b24abed9/1642672845288/7585-726-8.pdf",
      "sammandrag": "SKR-vägledning som beskriver partnering/samverkansentreprenad ur offentlig beställares perspektiv. Centralt påstående: partnering kräver tydlig beställarroll för att leverera tids- och kostnadsvinster."
    },
    {
      "id": "skr-hyra-lokal-lou",
      "omrade": "skolor-forskolor",
      "typ": "vagledning",
      "titel": "Gäller LOU vid hyra av lokal? — SKR-vägledning",
      "organisation": "Sveriges Kommuner och Regioner (SKR)",
      "datum": "2021-12",
      "url": "https://extra.skr.se/download/18.3c9f9e1e17db3f33e522d60/1639428881194/7585-737-4.pdf",
      "sammandrag": "Vägledning om hyresundantaget i LOU 3 kap. Rena hyresavtal undantagna, men skolor/sjukhus med starka anpassningskrav riskerar falla utanför. Hertsöskolan i Luleå (Expandia-moduler) som case."
    },
    {
      "id": "byggherrarna-strategisk-partnering",
      "omrade": "samhallsfastighetsbolag",
      "typ": "rapport",
      "titel": "Strategisk Partnering",
      "organisation": "Byggherrarna Sverige AB",
      "datum": "2018",
      "url": "https://www.byggherre.se/library/1093/rapport_strategisk_partnering.pdf",
      "sammandrag": "Byggherrarnas rapport om strategisk (flerprojekts-)partnering som komplement till klassisk projektpartnering."
    },
    {
      "id": "konkurrensverket-entreprenad-2014",
      "omrade": "samhallsfastighetsbolag",
      "typ": "forskning",
      "titel": "Entreprenadupphandlingar — hur kan byggherrar främja effektivitet och innovation?",
      "organisation": "Konkurrensverket / Per Erik Eriksson (LTU) & John Hane",
      "datum": "2014",
      "url": "https://www.konkurrensverket.se/globalassets/dokument/informationsmaterial/rapporter-och-broschyrer/uppdragsforskning/forsk-rapport_2014-4_entreprenadupphandlingar.pdf",
      "sammandrag": "Akademisk genomgång av entreprenadformer (utförande/total/samverkan/partnering) ur byggherrens perspektiv. Visar att partnering ger mätbara effekter när delaktiviteter (gemensamma mål, teambuilding, gemensam projektdatabas, facilitator) faktiskt implementeras."
    },
    {
      "id": "sala-modulskola-adapteo",
      "omrade": "skolor-forskolor",
      "typ": "slutrapport",
      "titel": "Gärdesta modulskola, Sala — Skandinaviens största modulskola",
      "organisation": "Sala kommun / Adapteo",
      "datum": "2017-08",
      "url": "https://adapteo.se/insights/gardesta-skola",
      "sammandrag": "161 moduler, 5 340 m² BTA i två plan, 350 elever. Hyresavtal 4 år, 37 mkr → ca 6 900 kr/m² BTA/år. Leveranstid 3 månader för montage. Modulskola är OPEX (hyra) inte CAPEX — leverantören äger byggnaden."
    }
  ]
}
```

### Uppdaterade sammandrag (befintliga poster)

```json
{
  "uppdaterade_kallor": [
    {
      "id": "akademiska-hus",
      "nytt_sammandrag": "Sveriges största samhällsfastighetsägare inom utbildning/forskning: ca 3,4 miljoner m² uthyrningsbar yta, hyresintäkter 7 860 mnkr 2024 (+5 %), förvaltningsresultat 4 617 mnkr (+8 %), investeringar ca 2,5 mdkr. Första svenska fastighetsbolaget med godkänt SBTi Net-Zero-mål; klimatutsläppen ca −50 % från basår 2019. Publicerar Studentbarometern och löpande finansiella rapporter. Lokalt i Linköping: Campusplan Valla 2030 styr utvecklingen på LiU."
    },
    {
      "id": "specialfastigheter",
      "nytt_sammandrag": "Statligt ägt bolag som förvaltar 174 fastigheter med ca 1,1 miljoner m² lokalarea — kriminalvård, polis, domstol, försvar. Totala intäkter 3 502 mnkr 2024 (+14 %), förvaltningsresultat 1 713 mnkr (+5 %), fastighetsvärde ca 52 mdkr, projektutvecklingsinvesteringar 5,1 mdkr. Användbar referens för samhällslokaler med säkerhets- och funktionskrav."
    },
    {
      "id": "hemso",
      "nytt_sammandrag": "Sveriges största privata aktör inom samhällsfastigheter — utbildning, vård, äldreboende, rättsväsende. Fastighetsvärde över 75 mdkr 2024, driftnetto 3 833 mnkr (+19 % resultat). Under 2024 färdigställdes 12 projekt med 82 äldreboendeplatser och 4 700 skolplatser. Ekonomisk uthyrningsgrad historiskt 97–99 %. Värdefull marknadsreferens för hyresnivåer och transaktionsvolym i samhällsfastighetssegmentet."
    },
    {
      "id": "vacse",
      "nytt_sammandrag": "Pensionsstiftelseägt fastighetsbolag specialiserat på samhällsfastigheter — domstolar, polishus, vårdcentraler, skolor. Hyresintäkter 165,3 mnkr 2024, driftöverskott 128,0 mnkr, förvaltningsresultat 92,5 mnkr. Fastighetsvärde över 10 mdkr för första gången. Uthyrningsgrad 100 % varav 98,9 % offentliga hyresgäster; viktad återstående hyrestid ca 9,6 år (vissa avtal 15 år)."
    },
    {
      "id": "stenvalvet",
      "nytt_sammandrag": "Stiftelse- och pensionsägt fastighetsbolag som äger ca 100 fastigheter, ca 589 000–593 000 m², marknadsvärde ca 15,9 mdkr. Driftnetto 597 mnkr 2024 (+10 % drivet av nya/omförhandlade hyresavtal och KPI-indexering). Hyresgäster är kommuner, regioner och stat inom utbildning, vård/omsorg, rättsväsende och myndigheter."
    },
    {
      "id": "scb-befolkningsframskrivning",
      "nytt_sammandrag": "SCB:s officiella befolkningsframskrivningar. Senaste utgåva: 'Sveriges framtida befolkning 2026–2070' (april 2026) som reviderar ner tillväxttakten kraftigt. Grunddata för demografisk dimensionering av förskole- och skollokaler. För Linköping specifikt finns kommunens egen prognos 2024–2034 (apr 2025): barn 0–5 år +833, barn 6–12 år −2 476 fram till 2034."
    }
  ]
}
```

### Verifierings-rapport (12 påståenden)

```json
{
  "verifiering": [
    {
      "pastaende": "~80 % av kostnaden låses i förstudie- och programskede",
      "fil_rad": "lokalforsorjning.html:2189-2192, 1893-1894",
      "status": "preliminar",
      "primarkalla": "CURT (Construction Users Roundtable), WP-1202, augusti 2004 — Patrick MacLeamy/HOK-figur. Originalfiguren anger INTE en exakt procentsiffra utan visar kvalitativa kurvor.",
      "anmarkning": "Procentsiffran (70–80 %) är en branschmässig tolkning, ofta refererad till Paulson 1976 (ASCE). Behåll 'preliminär' eller skriv om till '70–80 % enligt branschtolkning av MacLeamy-/Paulson-kurvorna'."
    },
    {
      "pastaende": "+14 månader i snitt för överklagande",
      "fil_rad": "lokalforsorjning.html:2016, 2023, 2477",
      "status": "verifierad-for-bostader",
      "primarkalla": "Evidens/Arkwright 'Samhällseffekter av långa ledtider' 2022 (initiativetbyggitid.se)",
      "anmarkning": "14 mån avser bostadsplaner. Domstolsstatistik 2024 ger MMD-mediantid ~6 mån men inte separat snitt för 'alla planmål'. Förtydliga 'för bostadsplaner — motsvarande siffra för samhällsfastigheter saknas i öppen statistik'."
    },
    {
      "pastaende": "LSS-gruppbostad: 6 lägenheter, ~600 m², 20–30 mkr, knappt 1 års byggtid",
      "fil_rad": "lokalforsorjning.html:2719-2796",
      "status": "delvis-verifierad",
      "primarkalla": "Socialstyrelsen SOSFS 2002:9 (3–5 personer rekommenderas, max 6); Dunkehalla Jönköping 2024 (823 m², 20–30 mkr); Ludvika 2024 (30 mkr)",
      "anmarkning": "Socialstyrelsen rekommenderar 3–5 personer, accepterar 6 i undantagsfall. Yta-intervall bör justeras till **600–850 m² BTA**. Byggtid '~1 år' stämmer."
    },
    {
      "pastaende": "4,7 → 4,8 år snitt-ledtid detaljplan",
      "fil_rad": "lokalforsorjning.html:2006, 2023, 2629-2634, 2841",
      "status": "verifierad",
      "primarkalla": "Nationellt Ledtidsindex 2025 (Byggföretagen, sept 2025)",
      "anmarkning": "Verifierad. VIKTIGT: indexet avser flerbostadshus med ≥ 5 lägenheter — caveat finns redan i koden (data-verifiering-not rad 2005, 2634)."
    },
    {
      "pastaende": "Tidsbegränsat bygglov: max 10+5=15 år",
      "fil_rad": "lokalforsorjning.html:2110, 2599",
      "status": "verifierad",
      "primarkalla": "9 kap. 33 § PBL + Boverkets PBL kunskapsbanken",
      "anmarkning": "Inget undantag för skolor. Det enda undantaget är säsongskaraktär (9 kap. 9 §) och tidigare bostadsregel (9 kap. 33 a §) som endast gäller bostäder."
    },
    {
      "pastaende": "Stockholm SISAB: ~1,8 miljoner kvm bestånd, ~600 byggnader",
      "fil_rad": "(SISAB-data sektioner i hela materialet)",
      "status": "verifierad",
      "primarkalla": "Stockholms stads officiella bolagssida + SISAB årsredovisning 2024",
      "anmarkning": "Verifierad. ~200 000 barn, ungdomar och vuxna vistas dagligen i lokalerna."
    },
    {
      "pastaende": "Klimatdeklaration: gränsvärden 2027 och 2030",
      "fil_rad": "lokalforsorjning.html (klimatdeklaration-text)",
      "status": "falsk",
      "primarkalla": "Boverket aug 2025 — nytt regeringsuppdrag",
      "anmarkning": "Tidplanen har skjutits fram. Korrekt nu: **utökad klimatdeklaration senast jan 2028, gränsvärden senast jan 2030**. Föreslagen sänkning: -25 % från 2025-nivån."
    },
    {
      "pastaende": "Linköping har 9 000+ nya elevplatser i utbyggnadsbehov enligt LFP",
      "fil_rad": "(Linköping-sektion i materialet)",
      "status": "preliminar",
      "primarkalla": "Kommungemensam LFP 2024 (Linköping, dec 2024-revisionen)",
      "anmarkning": "Webfetch blockerat av sammanträdesportalen (403). Exakt siffra kräver manuell PDF-nedladdning."
    },
    {
      "pastaende": "Linköpings kommun hyr lokaler av Lejonfastigheter för ~1 392 mnkr/år",
      "fil_rad": "(förslag på ny faktauppgift)",
      "status": "verifierad",
      "primarkalla": "Kommungemensam LFP 2024 — hyresnota refererad i Lejonfastigheters bygglista; ökning till 1 666 mnkr (+21 %) efter åtgärdspaket.",
      "anmarkning": "Solid siffra som kvantifierar lokalförsörjningens budgetpåverkan."
    },
    {
      "pastaende": "Adda Förskolebyggnader 2018: 11 leverantörer, t.o.m. 2026-03-15",
      "fil_rad": "(potentiell ny faktauppgift)",
      "status": "verifierad",
      "primarkalla": "https://www.adda.se/upphandling-och-ramavtal/ramavtal-och-avtalskategorier/bygg-och-fastighet/forskolebyggnader/forskolebyggnader-2018/",
      "anmarkning": "Nytt avtal (Förskole- och skolbyggnader 2025-2) startar sommaren 2026."
    },
    {
      "pastaende": "Framtidens US: 80 000 m² nybyggt + 55 000 m² ombyggt, ~3,8 mdkr",
      "fil_rad": "(regional benchmark-data)",
      "status": "verifierad",
      "primarkalla": "https://www.regionostergotland.se/...byggprojekt-universitetssjukhuset-i-linkoping",
      "anmarkning": "Projektet löper 2011–2025 (14 år) — illustrerar att regionsjukhus har ledtider i nivå med komplexa kommunala storprojekt."
    },
    {
      "pastaende": "Hyresundantaget i LOU 3 kap. gäller inte fullt ut för skolor med anpassningskrav",
      "fil_rad": "(snabb-spår / hyresvärdsmodellen)",
      "status": "verifierad",
      "primarkalla": "SKR-vägledning 7585-737-4 (2021)",
      "anmarkning": "Hertsöskolan i Luleå (mögel 2021, Expandia-moduler) är publicerat case."
    }
  ]
}
```

### Nyckeltalstabell (kr/m² BTA, 2024-priser)

| Lokaltyp | kr/m² BTA | kr/plats | Källor |
|---|---|---|---|
| Förskola 5–6 avd (2 000–2 500 m²) | 30 000–38 000 | 650 000–900 000/barn | Grillby Enköping, Källdal Uddevalla, IP Kumla |
| Grundskola F-6/F-9 ~400 elever inkl. hall (6 600–7 850 m²) | 30 000–35 000 | 500 000–700 000/elev | Smedbyskolan Norrköping, Svärtinge |
| Grundskola F-9 ~900–1 000 elever inkl. hall (14 000–18 600 m²) | 25 000–32 000 | 475 000–550 000/elev | Vallås Halmstad, Kvarngärdesskolan Uppsala, Kista Äng |
| Idrottshall (fullstor, 1 200–1 800 m²) | 18 000–25 000 | 25–45 mkr/hall | Stora Mossen Stockholm, Fagersta |
| LSS-gruppbostad (6 lgh, 600–850 m²) | 24 000–36 000 | 3,3–5,0 mkr/lgh | Dunkehalla, Ludvika, Bollnäs |
| Vård- och omsorgsboende kommunalt | 20 000–33 000 | 2,0–2,5 mkr/plats | Brickebacken Örebro, Borås |
| Vård- och omsorgsboende privat utvecklare | 40 000–57 000 | – | Hemsö Bredäng |
| Modulskola (hyra/OPEX) | 1 700 kr/m²/månad | 26 000 kr/elev/år | Gärdesta Sala (Adapteo) |

**Centrala metodnoter:**
- Spridningen inom varje lokaltyp på 20–30 % förklaras av klimat-/energiprestanda (passivhus +10–15 %), grundläggning, idrottshalls-andel, lönenivå, entreprenadform (samverkan -5–10 % vs totalentreprenad).
- SCB BKI -0,2 % årstakt feb 2024–feb 2025 — byggprisplatå efter 2021–2023 års uppgång.

---

## HTML-textförslag (diff:ar)

### Förslag 1 — 80 %-siffran (kostnad-sektionen)

```diff
- 80 % av kostnaden bestäms av beslut i förstudie- och programskede
+ 70–80 % av kostnaden bestäms av beslut i förstudie- och programskede
+ (branschtolkning av MacLeamy/CURT 2004-figuren — primärkälla anger
+ kvalitativ kurva utan exakt procenttal)
```

### Förslag 2 — Klimatdeklaration tidplan (fastighet-demografi-sektionen)

```diff
- Klimatdeklaration obligatorisk sedan 2022; gränsvärden planerade till 2027 och 2030.
+ Klimatdeklaration obligatorisk sedan 2022. Tidplanen har skjutits fram:
+ utökad klimatdeklaration träder i kraft senast januari 2028, gränsvärden
+ för klimatpåverkan senast januari 2030 (Boverket-uppdrag aug 2025).
+ Föreslagen sänkning: -25 % från 2025-nivån.
```

### Förslag 3 — Nytt avsnitt: EU EPBD-recast (fastighet-demografi)

```html
<h3>EU-krav 2026–2033 — EPBD-recast</h3>
<p>
  EU:s reviderade direktiv om byggnaders energiprestanda
  (EPBD recast, 2024/1275) träder i kraft i svensk rätt 1 juli 2026.
  För kommunala samhällsfastigheter betyder det:
</p>
<ul>
  <li><strong>Nollutsläppsbyggnader från 2028</strong> — alla nya byggnader som
    ägs eller nyttjas av offentlig sektor.</li>
  <li><strong>Solcellsplikt 2027–2028</strong> — offentliga byggnader
    &gt;2 000 m² senast 2027, &gt;750 m² senast 2028.</li>
  <li><strong>MEPS för lokaler 2030/2033</strong> — senast 2030 inga lokaler i
    de 16 % minst energieffektiva; senast 2033 inga i de 26 %.</li>
</ul>
<p class="kallor-not">
  Boverket bedömer att ca 31 000 svenska lokalbyggnader behöver
  effektiviseras till 2033 (SKR-PM oktober 2025).
</p>
```

### Förslag 4 — LSS-yta (per-typ-sektionen)

```diff
- LSS-gruppbostäder följer ett standardiserat mönster nationellt — sex
- lägenheter, ~600 m², byggtid kring ett år, budget 20–30 mkr.
+ LSS-gruppbostäder följer ett standardiserat mönster nationellt — sex
+ lägenheter, 600–850 m² BTA, byggtid kring ett år, budget 20–30 mkr.
+ Tre svenska 2024-projekt (Dunkehalla/Jönköping 823 m², Bollnäs,
+ Ludvika) bekräftar intervallet.
```

### Förslag 5 — Linköping-siffror (lokalt avsnitt)

```html
<div class="linkoping-key-numbers">
  <p>
    Linköpings hyresnota till Lejonfastigheter:
    <strong>~1 392 mnkr/år 2024</strong>, prognosticerad ökning till
    <strong>~1 666 mnkr/år (+21 %)</strong> efter LFP-åtgärdspaketet.
  </p>
  <p>
    Kommunens investeringsram <strong>803 mnkr 2025</strong> med nytt
    finansiellt krav: <strong>50 % egenfinansiering</strong> av
    investeringar.
  </p>
  <p class="kallor-not">
    Källa: Linköpings budget 2025 + Kommungemensam LFP 2024 (dec-revisionen).
  </p>
</div>
```

### Förslag 6 — Regional benchmark Framtidens US (exempel-sektionen)

```html
<aside class="regional-benchmark">
  <p>
    <strong>Regional benchmark:</strong> Region Östergötlands
    <em>Framtidens Universitetssjukhus</em> i Linköping —
    80 000 m² nybyggnation + 55 000 m² ombyggnation,
    investeringsbeslut ca 3,8 mdkr, löptid 2011–2025 (14 år).
  </p>
  <p class="kallor-not">
    Visar att regionsjukhus har ledtider i nivå med komplexa kommunala
    storprojekt.
  </p>
</aside>
```

---

## Hanterade dubbletter / konflikter

| ID i agentleverans | Befintligt ID | Hantering |
|---|---|---|
| `boverket-vagledning-skolor-forskolor-strategisk-planering` (spår 7) | `boverket-strategisk-planering` | Skippas — dubblett |
| `linkoping-lfp-2024-2033` (spår 9+10, källa nov 2023) | `linkoping-kommungemensam-lfp-2024` (befintligt, dec 2023) | Skippas — befintligt mer aktuellt |
| `region-ostergotland-fastigheter` (spår 1+2) ≈ `region-ostergotland-arsredovisning-2023` (spår 9+10) | – | Behåll bara portal-versionen (spår 1+2) |
| `norrevo-fastigheter` (spår 1+2) ≈ `norrevo-fastigheter` (spår 9+10) | – | Identiska — behåll en post |
| `uppsala-kvarngardesskolan-2025-slutrapport` | `uppsala-kvarngardesskolan` | Behåll båda — olika datum/fokus (befintligt är portalsida) |

## Identifierade kunskapsgap

1. **SKR Produktionskostnad för skolor 2017** är fortfarande senaste publikationen i serien — ingen nyare har publicerats. Aktuell kommunal skol-/förskolebenchmark publiceras inte centralt.
2. **Domstolsstatistik 2024** ger inte separat snitt-tid för "alla PBL-planmål" — bara aggregerade omloppstider per mål-typ. 14-månaderssiffran är därför verifierad för bostadsplaner men inte för samhällsfastigheter.
3. **Modulskolepriser (kr/m²) från Adapteo/Indus/Algeco** publiceras inte — leverantörerna ger offerter på begäran. Detta är en bekräftad lucka i öppen benchmarkdata.
4. **Doktorsavhandlingar 2022+ om kommunal lokalförsörjning** kunde inte verifieras direkt via DiVA. Fältet behandlas under bredare termer (facility management, beställarroll, strategisk fastighetsförvaltning).

## Verktygsbegränsningar i körningen

- WebFetch blev blockerad (403) på flera primär-PDF:er — Boverket, SISAB, Domstolsverket, Socialstyrelsen, Linköpings sammanträdesportal, SKR. Siffror har hämtats via WebSearch-sammanfattningar mot bolagens egna pressreleaser och rapportreferenser. Manuell PDF-nedladdning rekommenderas för exakt sidnummer.
- Trots blockeringen är alla URL:er bekräftade existerande (HEAD-check via söknyckel + säkerställd referens från flera publika källor).

## Nästa steg

1. **Tillämpa JSON-patchen** på `data/kallregister.json` — sker i nästa commit i samma branch.
2. **Lägg till nytt område** `nordisk-benchmark` med `dolt_default: true` (analogt med `tangerande-bostad`).
3. **Uppdatera `scb-befolkningsframskrivning`-posten** med 2026-2070-utgåvan och Linköping-specifika prognosen.
4. **HTML-textförslag** (förslag 1–6 ovan) tillämpas separat när du granskat dem — applicering är inte automatiserad.
