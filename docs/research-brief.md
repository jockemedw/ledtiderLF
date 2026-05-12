# Research-brief: utöka datan i Lejonfastigheters lokalförsörjningsguide

**Sista uppdatering av brief:** 2026-05-11
**Källregistrets nuvarande status:** 46 källor över 5 områden (commit `d97f3a0` på branch `claude/fix-header-height-H7vEF`)
**Tidsbudget:** En natt — sikta på djup snarare än utdragen täckning av allt

---

## 1. Kontext

Lejonfastigheter AB är Linköpings kommuns lokalförsörjare. Den här webbplatsen (`lokalforsorjning.html` + `data/kallregister.json`) förklarar för politiker, kommunledning och allmänhet **varför kommunal lokalförsörjning tar 3 månader till 8 år**, vad som styr tiden, och vad det betyder för Linköpings investeringsbeslut.

Fokus är **samhällsfastigheter**: skolor, förskolor, vård- och omsorgsboenden, LSS-gruppbostäder, idrottshallar, fritidsgårdar, bibliotek, räddningstjänst. Vi pratar *inte* om marknadsbostäder.

Tidigare iteration hade en hel del bostads-tung referensdata (Bygg i Tid, Evidens, SKR Öppna jämförelser) som vi just har flyttat till ett tangerande-område (`tangerande-bostad`, default avbockad på `/kallregister`). Vi har också lagt till fem nya samhällsfastighetsbolag som benchmark-aktörer (Akademiska Hus, Specialfastigheter, Hemsö, Vacse, Stenvalvet) men deras poster i registret är fortfarande korta och allmänna.

**Materialets centrala påståenden** (många är märkta `preliminär` i koden och behöver verifieras):
- "80 % av kostnaden låses i förstudie- och programskede" — branschdata, primärkälla saknas
- Plan- och bygglovsprocess kan ta 4,8 år i snitt (men siffran är för flerbostadshus, inte kommunala lokaler)
- Överklagande av detaljplan förlänger med ~14 månader i snitt
- LSS-gruppbostäder: 6 lägenheter, ~600 m², ~1 års byggtid, 20–30 mkr budget
- Klimatdeklaration obligatorisk sedan 2022; gränsvärden planerade till 2027 och 2030
- Linköping har 9 000+ nya elevplatser i utbyggnadsbehov enligt nuvarande kommungemensam LFP

## 2. Mål

Utöka registret med **hög kvalitet** så att standardvyn (samhällsfastigheter) blir den självklara referensresursen för svensk kommunal lokalförsörjning. Konkret:

- **Komplettera och verifiera** — varje siffra i materialet som idag är märkt preliminär eller saknar primärkälla ska efter denna research antingen ha en primärkälla (citerad med sidnummer/avsnitt om möjligt) eller markeras tydligt som ej verifierbar.
- **Bredda** — fyll luckor i bolagsreferenser, regionala aktörer, internationell benchmark, forskning.
- **Skärpa** — varje ny källa ska kunna direkt motiveras med "den här används till X i materialet" eller "den här är benchmark för Y".

Sikta på **15–25 nya poster** + **5–10 uppdaterade befintliga poster** + en **verifierings-rapport** för de preliminära siffrorna.

## 3. Leveransform

### A) JSON-patch (primär leverans)

Lägg svaret som ett enda JSON-block enligt befintligt schema i `data/kallregister.json`:

```json
{
  "nya_kallor": [
    {
      "id": "kort-stabilt-slug-id",
      "omrade": "skolor-forskolor | fastighet-demografi | samhallsfastighetsbolag | tangerande-bostad | detaljplan",
      "typ": "rapport | branschindex | vagledning | kommunal-plan | lagstiftning | statistik | forskning | branschorganisation | finansiering | slutrapport | samhallsfastighetsbolag",
      "titel": "Exakt rubrik enligt källan",
      "organisation": "Utgivare",
      "datum": "YYYY-MM eller YYYY (eller 'löpande')",
      "url": "Direktlänk till primärkällan (PDF eller webbsida)",
      "sammandrag": "1–3 meningar: vad rapporten innehåller och varför den är relevant för svensk samhällsfastighetsförsörjning. Citera centrala siffror.",
      "anvandsTill": "Fritextfält som beskriver i vilken sektion av materialet källan motiverar något — t.ex. 'Underbyggnad för 80%-siffran i kostnad-sektionen' eller 'Benchmark för kr/m² BTA grundskola i exempel-sektionen'."
    }
  ],
  "uppdaterade_kallor": [
    {
      "id": "befintligt-id-i-registret",
      "andring": "Beskriv vad som ska uppdateras — t.ex. nytt sammandrag, nyare datum, ny URL till senare rapport",
      "nytt_sammandrag": "Endast om sammandraget byts"
    }
  ],
  "verifiering": [
    {
      "pastaende": "Kort citat ur materialet — t.ex. '80 % av kostnaden låses tidigt'",
      "fil_rad": "lokalforsorjning.html:N (var i koden påståendet syns)",
      "status": "verifierad | preliminar | falsk | ej-verifierbar",
      "primarkalla": "URL + sida/avsnitt",
      "anmarkning": "Eventuell nyansering. T.ex. 'Källan anger 70–85 % beroende på projekttyp; 80 % är en accepterad medelnivå.'"
    }
  ]
}
```

`anvandsTill`-fältet är intern markering — det behöver inte committas till `kallregister.json`-schemat men hjälper redigeraren välja vad som faktiskt ska in.

### B) HTML-textförslag (sekundär leverans)

För varje siffra eller påstående i `lokalforsorjning.html` / `detaljplan.html` där researchen ger nytt underlag, leverera en föreslagen textuppdatering i diff-format:

```diff
- Ledtiderna är typiskt 4,8 år för en detaljplan.
+ Ledtiderna är typiskt 4,8 år för detaljplaner för flerbostadshus (Ledtidsindex 2025).
+ För kommunala samhällsfastigheter rapporterar Akademiska Hus 2,5–3 år
+ för universitetsbyggnader på egen mark (Akademiska Hus årsredovisning 2024).
```

Inkludera filsökväg + radnummer så redigeraren snabbt kan applicera ändringen.

## 4. Kvalitetskriterier

**Acceptera bara källor som uppfyller alla av följande:**

1. **Primärkälla.** Inte en sammanfattning eller wiki — direkt till rapporten/lagtexten/årsredovisningen.
2. **Daterad.** Publiceringsår krävs. För årligt uppdaterade indexar: notera "löpande" + senaste utgåvas år.
3. **Identifierbar utgivare.** Statlig myndighet, kommun, region, branschorganisation, fastighetsbolag, akademisk institution, kommersiell branschdataleverantör. Inte konsultbloggar eller dagspress.
4. **Konkret relevans.** Sammandraget måste säga *varför* källan finns med — vilken siffra/påstående den underbygger eller vilket gap den fyller.
5. **Direkt URL.** Helst PDF eller statisk landningssida — inte sökresultat eller arkivet.

**Avvisa:**
- Wikipedia, Allabolag, Hitta, andra aggregatorer
- Konsulthus-rapporter som lever bakom kundvägg utan publik PDF (de hittas inte av läsaren)
- Reklammaterial från enskilda byggentreprenörer
- Källor utanför svensk/nordisk kontext om de inte är direkt benchmark (se spår 8)
- Allt som rör hyresmarknaden för privatbostäder, bostadsförsörjningslagen, hyresnivåer i marknadsbostäder

## 5. Forskningsspår

Varje spår nedan har: (a) vad som ska göras, (b) konkreta frågor att svara på, (c) urval av första källor att börja med.

### Spår 1 — Komplettera de fem nya samhällsfastighetsbolagen

**Vad:** De fem nya posterna i registret (`akademiska-hus`, `specialfastigheter`, `hemso`, `vacse`, `stenvalvet`) har korta allmänna sammandrag. Hitta för varje:

- Senaste års- och hållbarhetsredovisning (URL + datum)
- 2–3 specifika nyckeltal som kan citeras: t.ex. kr/m² driftkostnad, hyresnivå kr/m²/år, vakansgrad, klimatpåverkan kg CO₂e/m²
- Eventuell egen branschrapport (Akademiska Hus' Campusbarometern, Hemsös marknadsrapporter etc.)
- Ett konkret exempelprojekt med datum, ytor, kostnad om publicerat

**Frågor:**
- Vilken är den största samhällsfastighetsägaren i Sverige mätt i m² BTA?
- Vad är "typiskt" driftnetto kr/m² för en samhällsfastighet 2024–2025?
- Hur långa är hyresavtalen i samhällsfastighetssegmentet? (Vacse anger ofta 10–15 år — bekräfta)

**Förstaval av källor:** akademiskahus.se/finansiell-information, specialfastigheter.se/om-oss/finansiella-rapporter, hemso.se/investor-relations, vacse.se/rapporter, stenvalvet.se/rapporter.

### Spår 2 — Saknade samhällsfastighets-aktörer

**Vad:** Identifiera och dokumentera kommunala/regionala samhällsfastighetsbolag som idag saknas i registret men som är direkt jämförbara med Lejonfastigheter.

**Frågor:**
- Vilka kommuner har egna fastighetsbolag/förvaltningar för samhällsfastigheter? (Stockholm: SISAB/Micasa. Göteborg: Stadsfastigheter. Malmö: Stadsfastigheter. Uppsala: Skolfastigheter. Och resten?)
- Vad publicerar t.ex. Micasa (Stockholms äldreboenden), Helsingborgshem (om dom har samhällsfastighetsspår), Norrköpings kommun (Norrevo), Västerås Fastighet, Örebroporten, Jönköpings kommun fastighet, Umeå kommunföretag, Sundsvall, Karlstad, Gävle?
- Region-ägda fastighetsbolag (regionsjukhus, vårdcentraler) — Region Östergötland, Region Skåne, Region VG?

**Förvänta:** 5–8 nya poster med direkta motsvarigheter till Lejonfastigheter, helst kommuner i Linköpings storleksklass (~165 000 inv).

### Spår 3 — Verifiera kärnpåståenden i materialet

**Vad:** Materialet innehåller siffror som är märkta `data-verifiering="preliminar"` i HTML. Sök primärkällor.

**Påståenden att verifiera (icke uttömmande lista — sök fler med `grep "preliminar" lokalforsorjning.html`):**

1. **"~80 % av kostnaden låses i förstudie- och programskede"** — påstås vara branschdata. Möjliga primärkällor: Macleamy-kurvan (HOK Building Design Group), SBUF-rapporter, Boverket-utredningar, Forsman & Bodenfors avhandlingar. Hitta originalkällan, citera procentintervall och vilket skede det avser.
2. **"+14 månader i snitt för överklagande"** — Evidens 2023 har siffran för bostadsplaner. Kontrollera om Domstolsverkets statistik för PBL-mål specifikt 2023–2024 ger en motsvarande siffra för *alla* planmål (inte bara bostäder).
3. **"LSS-gruppbostad: ~600 m², 20–30 mkr"** — Socialstyrelsens vägledning + några faktiska upphandlingar. Bekräfta intervall.
4. **"4,7 → 4,8 år snitt-ledtid detaljplan"** — Ledtidsindex 2024 vs 2025. Kontrollera exakta siffror och om SKR:s öppna jämförelser ger samma bild.
5. **Tidsbegränsat bygglov: maxtider 10/15 år** — bekräfta mot 9 kap. 33 § PBL och Boverkets vägledning. Finns det undantag för skolor?
6. **"Stockholm SISAB: 1,8 miljoner kvm bestånd"** — bekräfta från SISAB:s årsredovisning.

För varje: lämna en `verifiering`-post enligt schemat ovan.

### Spår 4 — Aktuella kr/m² BTA-nyckeltal 2024–2026

**Vad:** Materialet citerar inte kr/m² men "exempel"-sektionen vill jämföra Linköpings nybyggnationer mot riksgenomsnitt. Samla nyckeltal.

**Frågor (per lokaltyp):**
- **Förskola** (5–6 avdelningar): typisk byggentreprenadkostnad kr/m² BTA 2024–2025
- **Grundskola** (F–9, ~600 elever): kr/m² BTA + kr/elevplats
- **Grundskola** (F–9, ~1 000 elever, som Kvarngärdesskolan)
- **Idrottshall** (typisk skolidrottshall)
- **LSS-gruppbostad**
- **Vård- och omsorgsboende** (60–80 platser)
- **Modulskola** (paviljonglösning för 100–200 elever)

**Förstaval av källor:** SKR FoU-fonden (Produktionskostnad för skolor 2017 är gammal — finns nyare?), Repab Fakta 2024/2025, faktiska kommunala upphandlingar via opic.se/Mercell, branscharkitekter (Liljewall, Tengbom, Sweco-publikationer).

### Spår 5 — Lagstiftning, policy, EU 2024–2026

**Vad:** Identifiera lagändringar och policyutveckling som påverkar lokalförsörjning under planhorisonten.

**Frågor:**
- PBL-utredningen 2022 (SOU 2022:34 "En enklare för fastighetsbildning…") — vad blev av förslagen? Proposition? Tidplan?
- Ny PBL från 2024–2025? Statussondering av regeringens utredning om kortare ledtider för detaljplaner.
- EPBD-recast (EU Energy Performance of Buildings Directive 2024) — vilka krav blir gällande för svenska kommunala lokaler? När? Renoveringsplikt nära-nollenergi för offentliga byggnader?
- Boverkets klimatdeklaration: gränsvärden 2027 och 2030 — vad är nuvarande föreslagna nivåer? Hur långt gick utredningen?
- EU-taxonomi för fastigheter (delegated act 2021) — vad krävs av en svensk kommunal samhällsfastighet idag?

**Förstaval:** regeringen.se/utredningar, riksdagen.se/SOU, boverket.se/publikationer, naturvardsverket.se.

### Spår 6 — Demografi-prognos 2025 + regional kontext

**Vad:** Senaste SCB-prognos och nedbrytning på Östergötland/Linköping.

**Frågor:**
- Vilken är senaste utgåvan av SCB:s regionala befolkningsframskrivning (årtal + URL)?
- Vad säger den för 1–6-åringar och 6–15-åringar i Linköping 2025–2035?
- Hur stämmer Skolverkets prognoser med SCB:s? Var avviker de?
- Regionala variationer: vilka kommuner i Östergötland har växande respektive minskande elevkullar?
- "Demografisk svacka" runt 2028–2032 — bekräfta från SCB att den är reell och inte en artefakt.

**Förstaval:** scb.se/befolkning, skolverket.se/statistik, kolada.se, Region Östergötland statistik.

### Spår 7 — Pågående forskning och evidensbaserad design

**Vad:** Akademisk forskning som underbygger materialet eller pekar mot uppdateringar.

**Frågor:**
- Pågående forskning vid KTH (avd. fastigheter och byggande), Chalmers (fastighetsekonomi, ARCH), LiU (CASE, fastighetsförvaltning), Lund (LTH) om lokalförsörjning, beställarroll, programarbete?
- Evidensbaserad design för skolor — Pernilla Hagbert (KTH), Ulla Westerberg, projekt på White/Tengbom som publicerats?
- LCC-forskning för offentliga fastigheter (Per Forsling, ÅF/Afry, Bengt Wånggren)?
- IVA:s rapporter om byggandet (löpande projekt, t.ex. Resurs- och avfallsriktlinjer för byggandet)?

**Förstaval:** diva-portal.org, kth.diva-portal.org, iva.se/publikationer, formas.se (finansieringsprojekt), Vinnova.

### Spår 8 — Nordisk benchmark

**Vad:** Jämföra svensk kommunal lokalförsörjning mot Norge och Danmark. Identifiera 2–4 jämförbara aktörer och centrala nyckeltal.

**Frågor:**
- Statsbygg (Norge) — vad publicerar de om byggprocess och ledtider?
- Undervisningsbygg Oslo KF — Oslos motsvarighet till SISAB. Nyckeltal?
- Byggherrene i Norge — branschorganisation, motsvarighet till Byggherrarna Sverige
- BUF (Børne- og Ungdomsforvaltningen) i Köpenhamn — vad rapporterar de för skolbyggande?
- DiBi (Direktoratet for byggkvalitet i Norge) — nationell statistik?
- Senast publicerade nordiska jämförelser av byggledtider för offentliga lokaler?

**Förstaval:** statsbygg.no, ubf.oslo.kommune.no, dibk.no, kk.dk (Köpenhamn), bygherre.dk.

### Spår 9 — Linköpingsregionen och kommunala samverkansformer

**Vad:** Specifik kontext för Linköping och Östergötland.

**Frågor:**
- Linköpings senaste budgetbeslut 2024–2026 som rör lokalinvesteringar — vad är investeringstaket? Vilka prioriterade objekt?
- Region Östergötlands fastighetsbolag (Region Östergötland fastighet/serviceförvaltning) — publicerar de något om vård-/sjukhusfastigheter?
- Östsvenska samverkansorgan för lokalplanering? Östsam? Östsvenska handelskammaren?
- Norrköpings kommun (Norrevo) — direkt jämförbar storlek. Lokalförsörjningsplan?
- Linköpings universitet (Akademiska Hus är hyresvärd) — finns campusplan publicerad?

**Förstaval:** linkoping.se/protokoll, regionostergotland.se, norrkoping.se, lejonfastigheter.se.

### Spår 10 — Modulbyggande, ramavtal och kommunala upphandlingsmodeller

**Vad:** Lokalförsörjningens "snabba" spår — moduler, hyresvärds­upphandling, partnering. Materialet refererar SISAB UPP-konceptet och nämner Bifrostvägen-projektet, men luckorna är stora.

**Frågor:**
- SKL Kommentus / Adda Inköpscentral — finns ramavtal för moduler/skolpaviljonger? Status, leverantörer, prisnivå?
- Akademibyggarna, Adapteo, Cramo, Indus — vad är typiska kr/m² BTA + leveranstid för en skolmodul 2024–2025?
- Partnering vs totalentreprenad vs samverkansentreprenad — vilka kommuner har publicerade utvärderingar?
- Allmänt om hyresvärdsmodellen ("hyresvärds­upphandling"): typisk LOU-process tid, exempelupphandlingar.
- Branschundersökningar från BIM Alliance, Byggherrarna, Sveriges Byggindustrier specifika för offentliga beställare?

**Förstaval:** adda.se/inkopscentralen, sklkommentus.se, byggherre.se, bimalliance.se.

## 6. Vad som INTE ska forskas på

- Bostadsmarknad, hyresnivåer för privatbostäder, bostadsförsörjningslagen, bostadssociala frågor
- Generella PBL-bibliotek — vi har redan Boverket-vägledningarna i registret
- Bygg i Tid/Evidens/SKR-data om bostadsplaner — befintliga poster räcker, finns under `tangerande-bostad`
- Internationella aktörer utanför Norden om de inte är direkt benchmark (USA/UK skolbyggande är *inte* relevant för svensk kommunal kontext)
- Allmän klimat- och hållbarhetspolitik — endast det som har konkret påverkan på samhällsfastigheter

## 7. Slutkontroll innan leverans

Innan resultatet levereras:

- [ ] Varje ny post har en URL som faktiskt löser till en levande sida
- [ ] Varje ny post har `omrade`-värde som finns i registrets `omraden`-lista (eller flagga om nytt område behövs)
- [ ] Alla `id`-värden är unika gentemot befintliga 46 källor
- [ ] Sammandragen är 1–3 meningar — inte mer
- [ ] Verifierings-rapporten har minst de 6 påståenden som listas i Spår 3
- [ ] HTML-textförslagen pekar mot konkreta filer:rader

## 8. Schema-referens

Befintligt `omraden`-värden i registret:

| id | namn | färg |
|---|---|---|
| `detaljplan` | Detaljplan & planprocess | `#2563EB` |
| `skolor-forskolor` | Skol- och förskolelokaler | `#059669` |
| `fastighet-demografi` | Fastighet & demografi | `#B5822A` |
| `samhallsfastighetsbolag` | Samhällsfastighetsbolag | `#7C3AED` |
| `tangerande-bostad` | Tangerande (bostadsbenchmark) | `#9CA3AF` |

Om ett nytt område behöver introduceras (t.ex. `regional-samverkan` eller `internationell-benchmark`) — föreslå det med namn + färg, men introducera inte mer än 1–2 nya områden totalt.

`typ`-värden idag: `rapport`, `slutrapport`, `branschindex`, `vagledning`, `kommunal-plan`, `lagstiftning`, `statistik`, `forskning`, `branschorganisation`, `finansiering`, `samhallsfastighetsbolag`. Om en ny `typ` behövs (t.ex. `nordisk-benchmark`, `pagaende-forskning`) — föreslå men introducera sparsamt.
