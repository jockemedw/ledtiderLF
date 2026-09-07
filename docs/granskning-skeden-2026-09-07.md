# Granskning av skedena i spår A–D och tidsjämförelsen — 2026-09-07

Extern granskning ur byggprojektledarperspektiv av `DATA.spar` (skedelistor per scenario) och `DATA.gantt` (tidsjämförelsen) i `lokalforsorjning.html`, beställd efter att gantt-raderna räknats om (#47, #48). Rapporten är ett underlag: inget i den är infört i sidan. Avsnitt A är fel som bör rättas, B tveksamheter med rekommendation, C bedömningsfrågor för ägaren, G–H färdiga förslag på skedelistor och gantt-rader, I osäkerheter och saknade primärkällor.

# Granskning av skedena i Lejonguidens fyra spår

## 0. Sammanfattande bild

Skedelistorna är i huvudsak rätt tänkta och innehåller de tunga momenten, men de har tre systematiska svagheter:

1. **Nollpunkten är odefinierad.** Nyckeltalen i `siffror.json` mäter delvis från *genomförandebeslut* (SISAB: "GB→inflytt"), delvis från *inriktningsbeslut* (Micasa), delvis från "tanke" (Lund ~7 år). Skedelistorna mäter från förstudiestart. Gantt-diagrammet har en tydlig nollpunkt ("Uppdrag startar") som ingen av `totalText`-siffrorna är knuten till. Detta är den enskilt största orsaken till att summorna inte går ihop.
2. **Skedelistorna presenteras som rena sekvenser men innehåller moment som alltid löper parallellt** (bygglov mot upphandling, evakuering mot projektering, fastighetsbildning mot projektering). Därför överstiger sekventiell summa `totalText` i fem av sex scenarier.
3. **Genomförandeskedet efter byggnation saknas i flera spår** — slutbesiktning, slutbesked och verksamhetsstart finns bara i B och A2, inte i C och inte alls i D.

Sekventiell summa mot angivet totalspann:

| Scenario | Summa av skeden (min–max) | `totalText` | Mittvärde av skeden | Gantt-rad |
|---|---|---|---|---|
| A1 Befintlig lokal | 5,25–13 mån (3,75–10,5 utan "ev.") | 3–12 mån | 7,1 mån | 6 mån |
| A2 Hyresvärdsupphandling | 30–60 mån (2,5–5 år) | 2–4 år | 45 mån | 42 mån |
| B utan ny DP | 31–71 mån (2,6–5,9 år) | 2–5 år | 51 mån | 42 mån |
| C inom DP | 26–50 mån (2,2–4,2 år) | 2–3,5 år | 38 mån | 36 mån |
| D befintlig DP | 30–76 mån (2,5–6,3 år) | 2,5–4 år | 53 mån | 40 mån |
| D ny DP | 41–109 mån (3,4–9,1 år) | 5–8 år | 75 mån | 72 mån |

Gantt-raderna för B (−9 mån) och D befintlig DP (−13 mån) är alltså kraftigt komprimerade mot sina egna skedelistor utan att komprimeringen framgår någonstans utom i en kodkommentar.

---

## A. Fel som bör rättas

### A1 — ordningsföljden mellan förhandling och beslut är omkastad

**Var:** Spår A, scenario A1, skede 2–3.
**Vad:** "Politiskt beslut" (4–8 v) ligger före "Avtalsförhandling" (2–6 v).
**Varför:** Ett inhyrningsbeslut fattas på ett förhandlat avtalsförslag. Man går inte till nämnd eller bolagsstyrelse med "vi vill hyra någonstans" — beslutsunderlaget är hyresnivå, löptid, indexklausul, anpassningsansvar och avflyttningsvillkor. I praktiken: sök → teknisk och verksamhetsmässig lämplighetsprövning → förhandling/avsiktsförklaring → beslut → tecknande.
**Förslag:** Byt plats på skedena och lägg till ett prövningssteg:

```
Söka och identifiera lokal                          1–3 mån
Lämplighetsprövning (brand/VK, ventilation,
  tillgänglighet, friyta, buller, arbetsmiljö)      1–2 mån
Förhandling och avsiktsförklaring                   1–2 mån
Politiskt beslut och tecknande av hyresavtal        1,5–3 mån
```

### A1 — startbesked och slutbesked saknas helt

**Var:** Spår A, scenario A1, skede 4–5.
**Vad:** Efter "Ev. bygglov" går listan direkt till "Hyresgästanpassning" och slutar där.
**Varför:** Två formella spärrar saknas. (i) Åtgärder i hyresgästanpassning som rör bärande konstruktion, brandskydd, ventilation eller VA är anmälningspliktiga och **får inte påbörjas utan startbesked**. (ii) Lokalen **får inte tas i bruk innan slutbesked** (interimistiskt slutbesked är möjligt). Att sluta listan vid "hyresgästanpassning" ger intrycket att inflyttning sker direkt när hantverkarna går ut, vilket är precis det missförstånd som ger sena verksamhetsstarter.
**Förslag:** Lägg till som sista skede: `Slutbesiktning, slutbesked och verksamhetsstart — 1–2 mån`, och komplettera bygglovsskedets kommentar med "anmälan och startbesked krävs även när bygglov inte krävs".

### A1 — "Max 20 v lagstadgat" saknas här men är fel formulerat i D

**Var:** Spår D, befintlig DP, skedet "Bygglov + startbesked", kommentar "Max 20 v lagstadgat + tekniskt samråd".
**Vad:** Formuleringen antyder att lagen garanterar besked inom 20 veckor.
**Varför:** Regeln är att beslut ska meddelas inom **tio veckor från komplett ansökan**, med möjlighet att förlänga fristen **en gång med högst tio veckor** — 20 veckor är alltså undantaget, inte normen, och fristen börjar först när ansökan är komplett (kompletteringsrundor räknas inte). Dessutom får åtgärden verkställas tidigast **fyra veckor efter kungörelsen i Post- och Inrikes Tidningar**, även med startbesked i hand. Och startbesked förutsätter tekniskt samråd, kontrollansvarig och fastställd kontrollplan.
**Förslag ny kommentar:** "10 veckor från komplett ansökan, kan förlängas en gång till högst 20 veckor. Tekniskt samråd, kontrollansvarig och kontrollplan krävs för startbesked. Byggstart tidigast fyra veckor efter kungörelse."
**Osäkerhet:** Paragrafnumreringen i 9 kap. PBL har ändrats (Lag 2026:504, jfr hårdkontrollsnoten på `boverket-tidsbegransat-bygglov` och `ledtid-tidsbegransat-bygglov`). Ange inte paragrafnummer utan att kontrollera aktuell lydelse — noten i `siffror.json` säger att 9 kap. 33 § numera är 9 kap. 71–72 a §§.

### D befintlig DP — projektet slutar vid byggnation

**Var:** Spår D, befintlig DP, sista skedet.
**Vad:** Listan slutar med "Byggnation 12–30 mån".
**Varför:** Slutbesiktning enligt AB 04/ABT 06 kap. 7, slutbesked enligt PBL, inflyttning, inredning och verksamhetsstart saknas. För en skola är detta inte marginellt: inflyttning måste normalt läggas mot terminsstart, vilket i värsta fall kostar upp till sex månaders väntetid på en färdig byggnad. B har skedet ("Slutbesked + inflyttning"), D har det inte.
**Förslag:** Lägg till `Slutbesiktning, slutbesked, inredning och verksamhetsstart — 2–4 mån`, med kommentar "Verksamhetsstart för skola/förskola styrs av terminsstart — kan lägga till upp till 6 mån".

### D ny DP — bygglovsskedet saknas helt

**Var:** Spår D, ny detaljplan, skedelistan.
**Vad:** Efter "Projektering + upphandling" går listan direkt till "Byggnation".
**Varför:** Bygglov, tekniskt samråd och startbesked försvinner i sammanslagningen. Det är 3–6 månader på kritisk linje som inte syns någonstans i det scenario där kritisk linje är som viktigast.
**Förslag:** Dela upp: `Projektering (system-/bygghandling) 8–14 mån` · `Bygglov, tekniskt samråd och startbesked 3–6 mån` · `Upphandling entreprenad och genomförandebeslut 3–6 mån` (de två senare parallella).

### D ny DP — förstudien ligger efter laga kraft

**Var:** Spår D, ny DP, skede 4 "Förstudie & politiska beslut 4–8 mån" placerat efter "Laga kraft".
**Vad:** Ordningsfel.
**Varför:** Detta motsäger guidens egen slutsats i `#provning`: "när detaljplanen startar är en förutsättning för en effektiv process att behovet är tydligt". En plan kan inte beställas utan att behov, volym, lokaliseringsalternativ och ungefärlig byggrätt är utredda. Det som *kan* ligga efter laga kraft är genomförandebeslutet, inte förstudien.
**Förslag:** Dela i två skeden på var sin sida om planprocessen:

```
Behovsanalys, lokaliseringsutredning, beställning till planenheten   4–8 mån   (före planbesked)
...planprocess...
Genomförandebeslut (investeringsbeslut)                              2–4 mån   (efter laga kraft)
```

### `tidGuide` motsäger spår B:s egna siffror

**Var:** `DATA.tidGuide`, raden "1–3 år → B. Bygga om".
**Vad:** Spår B har `minManader: 24` och `totalText` "2–5 år"; skedesumman ger 2,6 år som minimum.
**Varför:** Ett behov som ska mötas om ett år kan inte lösas med spår B. Rekommendationen är internt motsägelsefull.
**Förslag:** Ändra raden till "2–4 år → B. Bygga om" och låt "< 2 år" gå till A/modul.

### `minManader`/`maxManader` behandlar planskedet olika mellan spåren

**Var:** Spårkorten. B: 24–60 (täcker bara "utan DP", trots att scenariot "med ny DP" anger 4–8 år). C: 24–42 (samma problem, "med ny DP" anger 4–7 år). D: 30–96 (täcker båda).
**Förslag:** Antingen låt B bli 24–96 och C 24–84, eller markera på korten att spannet avser scenariot utan ny detaljplan. Det senare är att föredra pedagogiskt.

---

## B. Tveksamheter där jag rekommenderar ändring

### B.1 Investeringsbeslutet ligger på ett ställe men fattas på två

Alla spår utom A1 har ett enda "Politiska beslut". I kommunal praxis — och i Linköpings egen projektstyrningsmodell — finns minst två beslutspunkter: **inriktningsbeslut** på programhandling med kalkylosäkerhet ±20–25 %, och **genomförandebeslut/investeringsbeslut** på verkligt anbud. Det andra beslutet är det som oftast överraskar tidplanen, eftersom det ligger efter anbudsöppning och inför en nämndcykel mitt i entreprenörens anbudsbundenhet.

**Förslag:** I B, C, D (båda) — ersätt ett beslutssteg med två:
- `Inriktningsbeslut (styrelse/nämnd) — 2–3 mån` efter programhandling
- `Genomförandebeslut på anbud — 1,5–3 mån` efter upphandling, före kontraktsskrivning

Notera också att formuleringen "Nämnd → KS → KF" inte är helt rätt för ett kommunalt bolag: kedjan är beställande nämnds beslut om hyreskostnad, LF:s styrelsebeslut, och KF endast när ärendet är av principiell beskaffenhet eller större vikt (kommunallagen 10 kap. 3 §). Förslag till kommentar: "Beställande nämnd → LF:s styrelse → KS/KF vid principiell beskaffenhet".

### B.2 "Projektering" är en svart låda i alla spår

Ingenstans framgår program- → system- → bygghandling, trots att det är där 70–80 % av kostnaden låses (guidens egen tldr-siffra). Spår B har "Programhandling" som eget skede men inte de övriga två; C och D har inget av dem.

**Förslag:** Låt alla spår med projektering ha samma tregrening, med tider som varierar per spår:

| Delskede | B ombyggnad | C tillbyggnad | D nybyggnad |
|---|---|---|---|
| Programhandling / rumsfunktionsprogram | 2–4 mån | 2–3 mån | 3–5 mån |
| Systemhandling | 3–5 mån | 3–4 mån | 4–6 mån |
| Bygghandling | 3–6 mån | 3–5 mån | 4–8 mån |

Vid total- eller samverkansentreprenad upphandlas efter systemhandling och bygghandlingen görs av entreprenören — det är den verkliga mekanismen bakom påståendet att totalentreprenad sparar tid.

### B.3 "Evakuering + bygglov" är ett hopslaget skede av två olika saker

**Var:** Spår B, skede 6, `fas: "evakuering"`, tid 3–12 mån.
**Varför problematiskt:** Bygglov och evakuering har olika drivkrafter, olika risk och olika kritikalitet. Evakuering är sällan på kritisk linje som *ett block* — evakueringslokalen måste finnas vid byggstart, men arbetet med den löper parallellt med projektering och upphandling. Bygglov är däremot en hård spärr före startbesked. Att slå ihop dem gör att ingen av dem kan tidsättas rätt.
**Förslag:** Två skeden:
- `Bygglov eller anmälan, tekniskt samråd och startbesked — 3–6 mån (parallellt med upphandling)`
- `Evakuering av verksamheten — 3–12 mån (parallellt; ska vara klar vid byggstart)`

Kommentaren "Politiskt känsligt; kan överklagas" hör till evakueringen, inte till bygglovet — behåll den där, gärna med Järfällahänvisningen som redan finns i `begransningar`.

### B.4 Fas-kategorin `evakuering` används för rena lovskeden

I C och D används `fas: "evakuering"` för skeden som heter "Bygglov" respektive "Bygglov + startbesked". Vid nybyggnad på obebyggd mark finns ingen evakuering alls. Legendtexten "Evakuering & bygglov" räddar det halvvägs, men i gantt-diagrammet får spår D ett rosa "evakuering"-segment som inte betyder evakuering.
**Förslag:** Dela `fasFarger` i `lov` ("Bygglov, tekniskt samråd, startbesked") och `evakuering` ("Evakuering av verksamhet"), alternativt döp om den befintliga till "Bygglov och startbesked (samt ev. evakuering)". Ren datafil-ändring, ingen kodändring krävs.

### B.5 Steg som saknas i D och som ofta hamnar på kritisk linje

Dessa saknas i båda D-scenarierna och bör åtminstone finnas med som parallella skeden med varningstext:

| Saknat skede | Typisk tid | Varför det spelar roll |
|---|---|---|
| Geoteknisk undersökning och markmiljöteknisk provtaging | 2–4 mån | Styr grundläggningsval och kan välta kalkylen; bör ligga i förstudien |
| Fastighetsbildning (avstyckning, servitut, ledningsrätt) | 6–12 mån | Kan inte påbörjas före laga kraft vid ny DP; bygglov kan kräva att fastigheten finns |
| Anslutningsavtal el, VA, fjärrvärme, kapacitetsbesked | 3–12 mån | Elnätsanslutning har blivit en reell kritisk linje sedan 2023 |
| Utbyggnad av allmän plats (gata, VA) efter laga kraft | 6–18 mån | Ofta annan huvudman än LF; skolan kan stå klar utan tillfart |
| Rivning och sanering (rivningslov/anmälan, asbestanmälan) | 2–5 mån | Vid ersättningsbyggnad på samma tomt |

Lantmäteriets sida om förrättningstider finns redan i `DATA.kallor` — hämta siffran därifrån i stället för att uppskatta. Jag anger 6–12 mån som erfarenhetsvärde och flaggar att primärkälla saknas i registret.

### B.6 Detaljplaneskedet beskrivs olika i B/C och D

| Spår | Formulering |
|---|---|
| B med ny DP | "+1–4 år · Standardförfarande 9–18 mån; utökat 18–48 mån" |
| C med ny DP | "+1–4 år" |
| D ny DP | "Planbesked 4 mån · Detaljplaneprocess 12–48 mån (kommunmedian 29 mån) · Laga kraft 3 veckor" |

B och C saknar planbesked, laga kraft och Kolada-medianen, och deras "9–18 mån för standardförfarande" är en påtagligt optimistisk siffra jämfört med den 29-månadersmedian som `#provning` nu vilar på (och 44 månader för Linköping enligt `lkpg-planledtid-antagande`).
**Förslag:** Ge alla tre samma treradiga struktur som D, med samma siffror, och låt "+1–4 år" ersättas av "+2,5–4,5 år (kommunmedian 29 mån planuppdrag→antagande; Linköping 44 mån)".

### B.7 A2 — detaljplanen ligger efter upphandlingen

**Var:** Spår A, A2, skede 4 "Ev. detaljplan på hyresvärdens mark" placerat efter LOU-upphandlingen.
**Varför:** En kommun upphandlar inte ett långt hyresavtal på en fastighet som saknar planstöd — planrisken skulle bäras av kommunen genom anbudspriset eller genom att avtalet inte kan fullföljas. Normalfallet är att planläget är en kvalificeringsförutsättning i upphandlingen. Att placera planprocessen efter tilldelningen ger fel bild av var risken ligger.
**Förslag:** Flytta upp den som förutsättning före upphandlingen och skriv om kommentaren: "Rätt planändamål är normalt ett kvalificeringskrav — saknas det bär hyresvärden planrisken och tidplanen blir ovillkorad. Tillkommer hela planprocessen (2,5–4,5 år)."

### B.8 Enskilda tidsintervall jag ifrågasätter

| Var | Nuvarande | Förslag | Motivering |
|---|---|---|---|
| A1, "Politiskt beslut" | 4–8 veckor | 1,5–3 mån | Nämnd- och styrelsecykler ligger 4–8 veckor isär, men ärendet ska beredas och vara inne 3–4 veckor före sammanträdet. Sommar- och juluppehåll gör 8 veckor till golvet, inte taket. |
| A1, "Ev. bygglov" | 6–10 veckor | 3–5 mån | 10 veckors lagstadgad frist räknas från *komplett* ansökan. Ändrad användning till skola/förskola utlöser prövning av friyta, buller, tillgänglighet och brandskydd (VK 2B/5B), vilket i praktiken alltid ger minst en kompletteringsrunda. Plus tekniskt samråd och startbesked. |
| A2, "Projektering & bygglov" | 6–12 mån | 8–14 mån | Ska rymma hyresvärdens projektering, kommunens granskning mot kravspecifikationen *och* bygglov med startbesked. 6 mån är inte realistiskt för en skola eller ett VoB. |
| A2, "Inflyttning" | 1–2 mån | 2–3 mån | Ska rymma slutbesiktning, avhjälpande av besiktningsanmärkningar, slutbesked, inredning och verksamhetsstart. |
| B, "Projektering" | 6–12 mån | 8–14 mån | Ombyggnadsprojektering är normalt *längre* per m² än nybyggnad: relationshandlingar saknas eller stämmer inte, inmätning krävs, och lösningarna måste anpassas till befintlig stomme och installationer. 6 mån är för optimistiskt annat än för mycket små projekt. |
| B, "Byggnation" | 10–24 mån | 12–24 mån | SISAB:s åtta dokumenterade ombyggnader ger ~18 mån median (`ledtid-total-grundskola-ombyggnad`). 10 mån som undre gräns är svår att belägga för en F–9-ombyggnad. |
| C, "Upphandling + byggnation" | 12–24 mån (ett skede) | Dela: upphandling 3–5 mån, byggnation 10–20 mån | Sammanslagningen döljer upphandlingen helt och ger fel färg i gantt. Tillbyggnad är normalt mindre volym än nybyggnad men byggs vid pågående verksamhet i etapper, vilket förlänger. |
| D bDP, "Projektering" | 6–18 mån | 8–14 mån | 6–18 är för brett för att styra på — spannet spänner över faktor tre. Jämför med den primärkälla guiden själv åberopar: Lekebergs LFP Tabell 1 anger projektering 3–8 mån. Guiden ligger alltså långt över sin egen källa i underkant och långt över i överkant. Antingen sänk spannet eller lägg till noten att guidens siffra avser hela program→bygghandling medan Lekeberg avser bygghandlingsskedet. |
| D bDP, "Byggnation" | 12–30 mån | Behåll 12–30, men lägg till LSS och idrottshall i kommentaren | Kommentaren nämner förskola, skola och äldreboende men inte LSS (10–15 mån enligt `ledtid-total-lss`) eller idrottshall (12–18 mån enligt `ledtid-total-idrottshall`), som båda är LF-relevanta lokaltyper. |
| D nyDP, "Detaljplaneprocess" | 12–48 mån | 18–48 mån | 12 månader från planuppdrag till antagande förekommer, men i kombination med scenariots övriga minvärden ger det en totaltid på 3,4 år, vilket motsäger `totalText` 5–8 år och underskrider allt tillgängligt underlag. |
| D nyDP, "Laga kraft" | 3 veckor | 1–2 mån | Tre veckor räknas från att justerat protokoll tillkännagetts på anslagstavlan; justering och tillkännagivande tar i sig 1–3 veckor efter sammanträdet. |

### B.9 Terminologi — konkreta rättelser

| Var | Nuvarande | Förslag |
|---|---|---|
| A1 | "Ev. bygglov (verksamhetsändring)" | "Bygglov för ändrad användning, samt anmälan och startbesked" |
| A2 | "Byggentreprenadsupphandling — ej hyresundantag" | "Upphandling av byggentreprenad enligt LOU — hyresundantaget gäller inte" |
| A2 | "Kravställning och marknadsanalys" | "Behovs- och kravställning (funktions- och rumsfunktionsprogram) samt marknadsanalys" |
| B | "Upphandling entreprenad" | "Upphandling av entreprenad (AB 04 vid utförandeentreprenad, ABT 06 vid totalentreprenad)" |
| B | "Slutbesked + inflyttning" | "Slutbesiktning, slutbesked och inflyttning" — slutbesiktning är entreprenadrättslig (AB 04/ABT 06 kap. 7), slutbesked är ett myndighetsbeslut enligt PBL. De blandas ofta ihop och det är värt att guiden håller isär dem. |
| B | "Förstudie inkl. miljöinventering" | "Förstudie inkl. statusbesiktning och inventering av farliga ämnen (asbest, PCB)" — "miljöinventering" används olika i branschen; materialinventering inför rivning är det som är obligatoriskt. |
| D bDP | "Totalentreprenad sparar 6–12 mån vs. utförandeentreprenad" | "Total- eller samverkansentreprenad kortar tiden till byggstart genom att bygghandling och produktion överlappar" — se osäkerhetsavsnittet nedan. |
| D nyDP | "Planbesked 4 mån — lagstadgat" | Se bedömningsfråga C.3 nedan. |
| `matris` | "Evakuering kan behövas: d: Nej" | "d: Ibland" — vid ersättningsbyggnad på samma tomt (rivning av befintlig skola) krävs evakuering, och det är ett vanligt LF-fall. |

---

## C. Bedömningsfrågor för ägaren

**C.1 Nollpunkt för `totalText`.** Ska spannen räknas från *uppdrag till LF* (samma nollpunkt som gantt-diagrammet) eller från *genomförandebeslut* (samma som SISAB-/Micasa-nyckeltalen)? Jag rekommenderar starkt uppdrag, med en parentes per scenario om tiden från GB, eftersom det är verksamheternas fråga guiden svarar på. Men det innebär att D befintlig DP måste skrivas upp från "2,5–4 år" till ungefär "3–5 år från uppdrag (2,5–3,5 år från genomförandebeslut)", vilket är en ändring av en av guidens mest citerade siffror.

**C.2 Nationell median eller Linköpings egen.** Gantt-radens planskede på 35 månader bygger på Koladas kommunmedian 29 mån. Linköpings egen median är 44 mån (`lkpg-planledtid-antagande`), vilket skulle ge ett planskede på ca 49 mån och en total på ca 7,5 år i stället för 6. Argumentet för nationell median är att lokalförsörjning har förtur i Linköpings prioriteringsprinciper och att Linköpings median innehåller kötid som LF:s projekt inte har. Argumentet emot är att en Linköpingsguide som visar 6 år när kommunens faktiska median pekar mot 7,5 riskerar att bli motsagd av det egna utfallet. Minimirekommendation: behåll 29 mån i stapeln men skriv ut båda talen i gantt-noten.

**C.3 Planbesked eller planuppdrag.** Skedet "Planbesked 4 mån — lagstadgat" är korrekt beskrivet för en extern byggherre. För LF som kommunägt bolag är den vanliga vägen i stället en begäran som behandlas som *planuppdrag* i samhällsbyggnadsnämnden, där fyramånadersfristen inte gäller på samma sätt. Detta bör stämmas av med planenheten, som guiden ju redan har kontakt med — jag har inte underlag att avgöra vilken väg Linköping faktiskt använder för LF:s projekt.

**C.4 Hur parallellitet ska visas.** Tre alternativ, i min prioritetsordning:
1. **Markera parallella skeden i data** (rekommenderas): lägg `‖ parallellt med föregående` i `kommentar`-fältet och en avslutande rad under listan: "Skedena överlappar — totaltiden är därför kortare än summan." Kräver ingen kodändring, bara datatext.
2. Justera intervallen nedåt tills summan möter `totalText` — sämre, eftersom det ger felaktiga intervall per skede.
3. Deklarera listan som sekventiellt worst case och skriv upp `totalText` — pedagogiskt sämst, eftersom `totalText` då inte längre är jämförbar med nyckeltalen.

**C.5 A1:s huvudsiffra.** "3–12 mån" håller bara om ändrad användning inte är bygglovspliktig. För skola, förskola och omsorg — guidens kärnverksamheter — är den nästan alltid det. Antingen behålls 3–12 mån med tillägget "+3–5 mån vid bygglovspliktig ändrad användning", eller så skrivs spannet upp till 6–14 mån. Det första alternativet bevarar nyckeltalet och är mer ärligt mot att `ledtid-spar-a` inte har någon primärkälla.

---

## D. Spår A2 särskilt — LOU-hanteringen

Grundbedömningen i guiden är riktig och ovanligt välformulerad: när hyresvärden uppför en byggnad efter kommunens anvisningar är det ett byggentreprenadkontrakt, inte ett hyresavtal, och hyresundantaget faller. Det är också rätt att lägga tyngdpunkten på att "avtalets utformning avgör".

Vad jag saknar i skedelistan:

1. **Avtalsspärr och överprövningsrisk.** Efter tilldelningsbeslut löper avtalsspärr (minst tio dagar vid elektronisk kommunikation) och en ansökan om överprövning förlänger den till dess förvaltningsrätten avgjort målet. För ett kontrakt av den här storleken är överprövning ett realistiskt utfall, inte en randanmärkning. Förslag: eget skede `Avtalsspärr och ev. överprövning — 0,5 mån, vid överprövning +3–6 mån`.
2. **Beslut om att teckna hyresavtalet.** Ett 20–25-årigt hyresavtal för en skola är normalt av principiell beskaffenhet och går till KF, inte bara till nämnd. Det finns ett "Politiska beslut" tidigt men inget beslut efter tilldelning.
3. **Kommunens roll under byggtiden.** Kommentaren "Hyresvärden ansvarar men kommunen ställer krav" är rätt men underskattar arbetsinsatsen. Kommunen behöver granska handlingar mot kravspecifikationen, delta i byggmöten och genomföra egen besiktning som blivande hyresgäst — annars upptäcks avvikelserna vid inflyttning när förhandlingsläget är borta. Förslag på tillägg i kommentaren: "Kommunen behöver granska handlingar mot kravspecifikationen löpande och delta i besiktning — avvikelser som upptäcks vid inflyttning är i praktiken svåra att få rättade."
4. **Vad som händer efter avtalstiden.** Finns i `begransningar` men inte som skede; det är rimligt att lämna det där.
5. **Val av förfarande.** För den här kontraktstypen är förhandlat förfarande med föregående annonsering eller konkurrenspräglad dialog vanligare än öppet förfarande, eftersom kraven behöver mejslas fram mot marknaden. Det motiverar också spannet 6–12 mån bättre än ett öppet förfarande skulle göra. Förslag på kommentar: "Förhandlat förfarande eller konkurrenspräglad dialog är vanligt — kravbilden behöver mejslas fram mot marknaden."

Tidsspannen i A2 är i övrigt rimliga; det är summan (30–60 mån) mot `totalText` (2–4 år) som inte går ihop. Se förslaget nedan.

---

## E. Gantt-raderna — bedömning av härledningen

**Metoden är sund** (mittvärde per skede, "ev."-steg utelämnade, komprimerade överlapp) men den tillämpas inte konsekvent, och komprimeringen är osynlig utanför kodkommentaren.

| Rad | Total | Mittvärde av skedelistan | Kommentar |
|---|---|---|---|
| A1 | 6 mån | 7,1 mån | Rimlig, men "söka lokal 1 mån" är i underkant och inflyttning saknas. |
| A2 | 42 mån | 45 mån | Nära; men `totalText` 2–4 år ligger under båda. |
| B | 42 mån | 51 mån | 9 mån bortkomprimerade utan förklaring. En del är legitim (evakuering parallell), en del är inte det (byggnation satt till 17 mot mittvärdet 17 är rätt, men beslut 7 mot 9 och projektering 8 mot 9 är rena nedskrivningar). |
| C | 36 mån | 38 mån | Rimlig. Byggnation 15 mot mittvärdet 18 är en nedskrivning; jag skulle hellre sänka intervallet till 10–20 så att mittvärdet blir 15. |
| D bDP | 40 mån | 53 mån | **Största avvikelsen.** Projektering satt till 8 mån mot ett intervall på 6–18 (mittvärde 12) är inte en komprimering av överlapp utan ett annat värde. Bygglov 3 mot mittvärdet 5. Byggnation 18 mot 21. |
| D nyDP | 72 mån | 75 mån | Bäst kalibrerade raden. Planskedet 35 mån = 4 + 29 + ~1 stämmer med Kolada. |

**"Projektering 8 mån på alla rader" håller inte.** Det är rimligt för A2, B och C men står i direkt konflikt med D:s eget intervall 6–18. Antingen sänks D:s intervall till 8–14 (min rekommendation, se B.8) eller så höjs radens projektering till 10–12.

**"Byggnation 18 mån på alla nybyggnadsrader"** är däremot en rimlig normalfallssiffra: den ligger i mitten av 12–30, matchar SISAB-förskolornas 21–37 mån endast i nedre delen men matchar LSS, idrottshall och mindre förskolor väl. För en stor F–9-skola är den för låg (36 mån enligt Kvarngärdesskolan) — men eftersom raden är ett normalfall över alla lokaltyper är 18 försvarbart. Bör dock nämnas i gantt-noten.

**Förskedet** (6/12/12/12/18/24 mån) är rimligt kalibrerat och stämmer med den utskrivna intervallet 6–24 mån. En invändning: 18 mån förskede för D befintlig DP mot 12 för C är svårt att motivera — samma verksamhet, samma beredningsprocess, skillnaden ligger i genomförandet, inte i verksamhetens förberedelse. Jag skulle sätta båda till 12–15. Förskedet 24 mån för D ny DP är däremot väl motiverat, eftersom beställningen in i en planprocess kräver mer förarbete.

---

## F. Konsekvens mellan spåren

Samma skede tidsätts olika utan att skillnaden är motiverad:

| Skede | A2 | B | C | D bDP | D nyDP | Förslag |
|---|---|---|---|---|---|---|
| Upphandling projektering | (ingår) | 2–3 | 2–3 | 2–5 | (ingår) | 2–4 överallt, "ramavtal: 2–6 veckor" |
| Projektering | 6–12 | 6–12 | 6–10 | 6–18 | 8–18 | B 8–14 · C 6–10 · D 8–14 |
| Bygglov + startbesked | (ingår) | (ihop m. evak.) | 2–5 | 3–7 | saknas | 3–6 överallt; ombyggnad kan bli anmälan i stället |
| Upphandling entreprenad | (ingår i LOU) | 3–5 | (ihop m. bygg) | 3–6 | (ingår) | 3–6 överallt, med not om avtalsspärr och överprövning |
| Byggnation | 12–24 | 10–24 | 12–24 | 12–30 | 12–30 | B 12–24 · C 10–20 · D 12–30 |
| Politiska beslut | 2–4 | 2–4 | (ihop m. förstudie) | 2–4 | (ihop) | Två beslut à 2–3 resp. 1,5–3 mån i B, C, D |
| Slutskede | 1–2 | 1–3 | saknas | saknas | saknas | 2–4 mån i alla utom A1 (1–2) |

De motiverade skillnaderna som *bör* framgå och delvis inte gör det: ombyggnad har längre projektering men kortare byggtid än nybyggnad; tillbyggnad har kortare byggtid i volym men förlängs av etappindelning vid pågående verksamhet; nybyggnad har längst byggtid men enklast logistik.

---

## G. Förslagna skedelistor per scenario

Tid i månader. `‖` = löper parallellt med föregående skede och ska inte adderas till totalen.

### A1. Hyra in befintlig lokal — `totalText`: "3–12 mån (+3–5 mån vid bygglovspliktig ändrad användning)"

| # | Skede | Fas | Tid | Parallell |
|---|---|---|---|---|
| 1 | Söka och identifiera lokal | beslut | 1–3 mån | |
| 2 | Lämplighetsprövning (brand/VK, ventilation, tillgänglighet, friyta, arbetsmiljö) | beslut | 1–2 mån | ‖ delvis |
| 3 | Förhandling och avsiktsförklaring | upphandling | 1–2 mån | |
| 4 | Politiskt beslut och tecknande av hyresavtal | beslut | 1,5–3 mån | |
| 5 | Ev. bygglov för ändrad användning, anmälan och startbesked | lov | 3–5 mån | ‖ med 6 |
| 6 | Projektering och upphandling av hyresgästanpassning | projektering | 1–3 mån | |
| 7 | Hyresgästanpassning (utförande) | anpassning | 2–6 mån | |
| 8 | Slutbesiktning, slutbesked och verksamhetsstart | anpassning | 1–2 mån | |

### A2. Hyresvärdsupphandling — `totalText`: "2,5–5 år (rätt detaljplan förutsatt)"

| # | Skede | Fas | Tid | Parallell |
|---|---|---|---|---|
| 0 | Förutsättning: rätt planändamål på hyresvärdens mark — annars +2,5–4,5 år | plan | — | |
| 1 | Behovs- och kravställning, funktionsprogram, marknadsanalys | beslut | 3–6 mån | |
| 2 | Inriktningsbeslut | beslut | 2–3 mån | |
| 3 | Upphandling av byggentreprenad enligt LOU (förhandlat förfarande vanligt) | upphandling | 6–12 mån | |
| 4 | Avtalsspärr, ev. överprövning, beslut om och tecknande av hyresavtal | upphandling | 1–3 mån (+3–6 vid överprövning) | |
| 5 | Hyresvärdens projektering, bygglov och startbesked; kommunens granskning | projektering | 8–14 mån | |
| 6 | Byggnation | byggnation | 12–24 mån | |
| 7 | Besiktning, slutbesked, inredning och verksamhetsstart | anpassning | 2–3 mån | |

### B. Bygga om, utan ny detaljplan — `totalText`: "2,5–5 år (normalfall ca 3,5 år)"

| # | Skede | Fas | Tid | Parallell |
|---|---|---|---|---|
| 1 | Förstudie inkl. statusbesiktning och inventering av farliga ämnen | beslut | 3–5 mån | |
| 2 | Programhandling / rumsfunktionsprogram | beslut | 2–4 mån | |
| 3 | Inriktningsbeslut | beslut | 2–3 mån | |
| 4 | Upphandling projektering (ramavtal: 2–6 v) | upphandling | 2–4 mån | |
| 5 | Projektering: systemhandling → bygghandling | projektering | 8–14 mån | |
| 6 | Bygglov eller anmälan, tekniskt samråd, KA, startbesked | lov | 3–6 mån | ‖ med 5/7 |
| 7 | Upphandling entreprenad och genomförandebeslut | upphandling | 3–6 mån | |
| 8 | Evakuering av verksamheten | evakuering | 3–12 mån | ‖ klar vid byggstart |
| 9 | Byggnation | byggnation | 12–24 mån | |
| 10 | Slutbesiktning, slutbesked, återflytt och verksamhetsstart | byggnation | 2–3 mån | |

### B. Bygga om, med ny detaljplan — `totalText`: "4,5–8 år"

Ersätt "Detaljplaneprocess +1–4 år" med samma tre skeden som i D ny DP (planbesked/planuppdrag, planprocess med Kolada-median, laga kraft) och behåll "Resterande steg — som ovan".

### C. Tillbyggnad inom befintlig detaljplan — `totalText`: "2,5–4 år"

| # | Skede | Fas | Tid | Parallell |
|---|---|---|---|---|
| 1 | Förstudie och programhandling (kontrollera e-tal, höjd, BTA) | beslut | 3–6 mån | |
| 2 | Inriktningsbeslut | beslut | 2–3 mån | |
| 3 | Upphandling projektering | upphandling | 2–4 mån | |
| 4 | Projektering: systemhandling → bygghandling | projektering | 6–10 mån | |
| 5 | Bygglov, tekniskt samråd och startbesked | lov | 3–5 mån | ‖ med 6 |
| 6 | Upphandling entreprenad och genomförandebeslut | upphandling | 3–5 mån | |
| 7 | Byggnation i etapper med verksamheten i drift | byggnation | 10–20 mån | |
| 8 | Slutbesiktning, slutbesked och inflyttning | byggnation | 2–3 mån | |

### C. Tillbyggnad med ny/ändrad detaljplan — `totalText`: "4,5–7 år"

Samma strukturändring i planskedet som B.

### D. Nybyggnad, befintlig DP — `totalText`: "3–5 år från uppdrag (2,5–3,5 år från genomförandebeslut)"

| # | Skede | Fas | Tid | Parallell |
|---|---|---|---|---|
| 1 | Förstudie, lokaliseringsstudie, geoteknisk och markmiljöteknisk undersökning | beslut | 3–6 mån | |
| 2 | Programhandling / rumsfunktionsprogram | beslut | 3–5 mån | |
| 3 | Inriktningsbeslut | beslut | 2–3 mån | |
| 4 | Upphandling projektering (eller tidig upphandling av total-/samverkansentreprenad) | upphandling | 2–4 mån | |
| 5 | Projektering: systemhandling → bygghandling | projektering | 8–14 mån | |
| 6 | Fastighetsbildning, servitut, ledningsrätt, anslutningsavtal el/VA/fjärrvärme | beslut | 4–12 mån | ‖ kan bli kritisk linje |
| 7 | Bygglov, tekniskt samråd, KA och startbesked | lov | 3–6 mån | ‖ med 8 |
| 8 | Upphandling entreprenad och genomförandebeslut | upphandling | 3–6 mån | |
| 9 | Byggnation (förskola 12–18 · LSS 10–15 · idrottshall 12–18 · VoB 18–30 · skola 24–36) | byggnation | 12–30 mån | |
| 10 | Slutbesiktning, slutbesked, inredning och verksamhetsstart | byggnation | 2–4 mån | |

### D. Nybyggnad, ny detaljplan — `totalText`: "5–8 år (Linköpings planmedian: 6–9 år)"

| # | Skede | Fas | Tid | Parallell |
|---|---|---|---|---|
| 1 | Behovsanalys, lokaliseringsutredning, beställning till planenheten | beslut | 4–8 mån | |
| 2 | Planbesked eller planuppdrag | plan | 2–4 mån | |
| 3 | Detaljplaneprocess, planuppdrag → antagande | plan | 18–48 mån (kommunmedian 29, Linköping 44) | |
| 4 | Laga kraft — vid överklagande +14 mån i snitt (25 % av planerna) | plan | 1–2 mån | |
| 5 | Program- och systemhandling, upphandling projektering | projektering | 8–14 mån | ‖ kan starta under granskning vid stabil planinriktning |
| 6 | Genomförandebeslut (investeringsbeslut) | beslut | 2–4 mån | |
| 7 | Fastighetsbildning och utbyggnad av allmän plats/VA | beslut | 6–18 mån | ‖ efter laga kraft |
| 8 | Bygglov, tekniskt samråd och startbesked | lov | 3–6 mån | ‖ med 9 |
| 9 | Upphandling entreprenad | upphandling | 3–6 mån | |
| 10 | Byggnation | byggnation | 12–30 mån | |
| 11 | Slutbesiktning, slutbesked och verksamhetsstart | byggnation | 2–4 mån | |

---

## H. Förslagna gantt-rader

Månader per segment; `andel` beräknas som mån/total. Fas `lov` förutsätter att `fasFarger` delas enligt B.4 — behålls dagens indelning används `evakuering` som idag.

| Rad | Förskede | Total | beslut | plan | upphandling | projektering | lov | evakuering | byggnation | anpassning |
|---|---|---|---|---|---|---|---|---|---|---|
| A1 Befintlig lokal | 6 | **8** (0,7 år) | 3 | — | 1 | — | — | — | — | 4 |
| A2 Hyresvärdsupphandling | 12 | **45** (3,75 år) | 7 | — | 9 | 9 | — | — | 18 | 2 |
| B Bygga om, utan ny DP | 12 | **44** (3,7 år) | 9 | — | 6 | 9 | 3 | (parallell) | 17 | — |
| C Tillbyggnad inom DP | 12 | **38** (3,2 år) | 7 | — | 6 | 8 | 2 | — | 15 | — |
| D Nybyggnad, befintlig DP | 15 | **46** (3,8 år) | 8 | — | 7 | 10 | 3 | — | 18 | — |
| D Nybyggnad, ny DP | 24 | **74** (6,2 år) | 6 | 34 | 6 | 7 | 3 | — | 18 | — |

Motsvarande `andel`-värden:

- **A1** beslut 0,375 · upphandling 0,125 · anpassning 0,500
- **A2** beslut 0,156 · upphandling 0,200 · projektering 0,200 · byggnation 0,400 · anpassning 0,044
- **B** beslut 0,205 · upphandling 0,136 · projektering 0,205 · lov 0,068 · byggnation 0,386
- **C** beslut 0,184 · upphandling 0,158 · projektering 0,211 · lov 0,053 · byggnation 0,394
- **D bDP** beslut 0,174 · upphandling 0,152 · projektering 0,217 · lov 0,065 · byggnation 0,392
- **D nyDP** plan 0,459 · beslut 0,081 · upphandling 0,081 · projektering 0,095 · lov 0,041 · byggnation 0,243

Planskedet 34 mån = planuppdrag 3 + planprocess 29 (Kolada-median) + laga kraft 1,5. Projekteringen i D nyDP är satt till 7 mån i stapeln (mot 8–14 i skedelistan) därför att den där uttryckligen antas delvis löpa under planens granskningsskede — det antagandet bör skrivas ut i gantt-noten, inte bara i kodkommentaren.

Förslag till tillägg i `gantt-note`: "Staplarna är normalfall där skeden som i praktiken överlappar — bygglov mot upphandling, evakuering mot projektering — räknats en gång. Sekventiell summa av skedena i respektive spårs skedelista är därför 10–25 % längre. Byggnationssegmentet 18 månader är ett medelvärde över lokaltyper; en stor F–9-skola tar snarare 24–36 månader. Planskedet bygger på kommunmedianen 29 månader (Kolada 2025) — Linköpings egen median är 44 månader, vilket skulle förlänga stapeln med ca 1,3 år."

---

## I. Osäkerheter och saknade primärkällor

Följande påståenden i granskningen vilar på erfarenhet, inte på källa i repot, och bör antingen källbeläggas eller märkas som erfarenhetsvärde om de förs in:

- **"Totalentreprenad sparar 6–12 mån vs. utförandeentreprenad"** (finns redan i guiden, spår D). Jag känner inte till någon svensk studie som kvantifierar detta för kommunala lokalprojekt. Antingen källbelägg eller skriv om till mekanismen ("bygghandling och produktion överlappar") utan siffra.
- **Fastighetsbildning 6–12 mån.** Lantmäteriets sida om handläggningstider är redan länkad i `DATA.kallor` — hämta siffran därifrån, gissa inte.
- **Anslutningstider för elnät 3–12 mån.** Jag har inget underlag i repot; regionala skillnader är stora. Bör verifieras mot Tekniska verken innan det skrivs in.
- **Rättsfallsstöd för A2:s LOU-bedömning.** Jag har i minnet EU-domstolens praxis om hyra av byggnad som ännu inte uppförts (Pizzarotti, C-213/13) och Helmut Müller (C-451/08), men jag har inte verifierat dem här och de finns inte i `kallregister.json`. Notera samtidigt att hårdkontrollen på `ver-lou-hyresundantag` (2026-08-26) redan konstaterar att guidens nuvarande Hertsöskolan-case **inte** finns i SKR/SKL-källan — närmaste faktiska case är Kammarrätten i Sundsvall, mål 395-10, s. 60 i den PDF som ligger under `skr-hyra-lokal-lou`. Det är ett kvarstående fel i nyckeltalsnoten som inte är åtgärdat.
- **LOU:s tröskelvärde för byggentreprenader.** Jag anger medvetet ingen siffra; Upphandlingsmyndighetens sida om 2026 års tröskelvärden är redan länkad i `DATA.kallor`.
- **Nämndcyklernas längd i Linköping.** Mina 1,5–3 mån för ett politiskt beslut är ett generellt erfarenhetsvärde; Linköpings faktiska sammanträdeskalender bör läggas till grund om siffran ska skärpas.
- **Planbesked kontra planuppdrag för LF** (bedömningsfråga C.3) — kräver besked från planenheten.
- **`ledtid-spar-a` och `ledtid-spar-a2`** har enligt sina egna noter ingen primärkälla alls ("branschbedömning/erfarenhetsvärde"). Alla mina förslag om A1 och A2 vilar därför på samma grund som guidens nuvarande siffror, inte på starkare underlag.

En faktisk konflikt jag vill lyfta särskilt: guidens projekteringsintervall (6–18 mån i D) ligger långt över den enda primärkälla guiden själv åberopar för momentsummor, **Lekebergs LFP Tabell 1, som anger projektering 3–8 mån**. Antingen mäter guiden hela program→bygghandling där Lekeberg mäter bygghandling, eller så är intervallet för högt satt. Det bör redas ut och skrivas ut i en not, eftersom `ledtid-spar-b`, `ledtid-spar-c` och `ledtid-spar-d-bdp` alla hänger på just den källan.
