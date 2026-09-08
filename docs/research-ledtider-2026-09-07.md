# Ledtider per skede i kommunala verksamhetslokaler — eget dataset

Sammanställt 2026-09-07 för att ersätta Lekebergs schablontabell som enda källa för skedeslängder i Lejonguiden. 35 projekt (skola, förskola, vård- och omsorgsboende, LSS, idrottshall) från kommunala fastighetsbolag, insamlade ur styrelseprotokoll, slutrapporter, projektsidor och lokalpress. Rådata i `research-ledtider-dataset-2026-09-07.csv`. Inga datum är uppskattade; obelagda fält är tomma.

## Vad datat faktiskt bär, och vad det inte bär

Var ärlig mot ledningen om detta: **byggtiden är väl belagd, de tidiga skedena är det inte.** Insamlingen gav starka datapunkter för byggnation och för total ledtid, men skede-för-skede-tider i förstudie, program och projektering finns bara hos ett bolag (Uppsala Skolfastigheter) plus en nationell schablon (SKR). Politiska beslutsdatum ligger i diarier och gick att nå men extraherades inte per projekt.

| Skede | Evidens | Grund |
|---|---|---|
| Byggnation | Stark | 17 projekt med byggstart och inflytt, flera lokaltyper |
| Från investeringsbeslut till inflytt | Medel–stark | SISAB:s slutrapporter, genomförandebeslut → färdigt |
| Program (förslagshandling) | Svag–medel | Endast Uppsala Skolfastigheter, 3 projekt |
| Förstudie | Svag | Härleds ur totalschablon minus kända skeden |
| Projektering (LF:s del före TE-kontrakt) | Svag | Överlappar upphandling och plan, svår att isolera |
| Upphandling och överprövning | Medel | Myndighetsstatistik för frekvens och domstolstid |
| Bygglov | Endast frist | Ingen uppmätt statistik för lokaler finns |

## 1. Byggtid per lokaltyp (byggstart → inflytt), median av belagda projekt

Atypiska projekt (överklaganden, dolda skador, kontraktshävning) är uteslutna ur medianen och redovisas separat.

| Lokaltyp | n | Median | Spann | Kommentar |
|---|---|---|---|---|
| Skola/förskola, alla | 8 | 34,5 mån | 14–38 | Tvåtoppig, se nedan |
| — liten förskola/mindre skola | — | ~16 mån | 14–19 | Brokind 14, Carlslund 18, Änglanda 19 |
| — stor F–6/F–9 med idrottshall | — | ~36 mån | 33–38 | Svärtinge, Styrstad, Smedby, Kvarngärde, Gårdsten |
| Vård- och omsorgsboende | 3 | 24 mån | 24–24 | Rinkeby, Berga, Harvestad — påfallande samstämmigt |
| LSS-gruppbostad | 3 | 14 mån | 11–16 | Dunkehalla 11, Perennväg 14, Domsjö 16 |
| Fullstor idrottshall, fristående | 3 | 20 mån | 12–25 | Renodlad hall (Nyköping) 12; större anläggning mer |

**Slutsats byggtid:** guidens nuvarande byggnationssegment på 18 månader som medelvärde över lokaltyper är för lågt för en stor skola. Rekommendation: differentiera. Liten förskola/LSS ca 12–16 mån, vårdboende ca 24 mån, stor skola med idrottshall ca 34–36 mån. Idrottshall ensam ca 12–18 mån.

## 2. Från investeringsbeslut till färdigt — den starkaste ankarpunkten

SISAB:s slutrapporter anger genomförandebeslut (GB) och godkänd entreprenad i samma dokument. Detta motsvarar nollpunkten som guidens byggtidskällor (SISAB, Micasa) använder: investeringsbeslut, inte uppdrag.

| Projekt | GB → färdigt |
|---|---|
| Bromma Gymnasium | 32 mån |
| Hässelby (ombyggnad) | 36 mån |
| Bifrostvägen förskola | 37 mån |
| Sjöviksskolan F–9 | 53 mån |

Median cirka 36 månader, alltså **tre år från investeringsbeslut till inflytt** för en skola. Det rymmer projektering efter GB, upphandling, entreprenörens bygghandling, byggnation och slutskede. Skanskvarnsskolan (67 mån) är utesluten som atypisk, överprövning.

## 3. De tidiga skedena — det viktigaste fyndet

Uppsala Skolfastigheter publicerar avslutdatum per skede. Det ger den enda direkta mätningen av program-/förslagshandlingsskedet:

| Projekt | Förslagshandling (programfas) |
|---|---|
| Flogsta | 15 mån |
| Bälinge | 18 mån |
| Kvarngärde | 29 mån |

Median cirka 18 månader för enbart programskedet. **Det är långt mer än guidens nuvarande antagande om 4–7 månader för program.** SKR:s idéskrift bekräftar bilden uppifrån: framförhållning fem år för en förskola och sex till åtta år för en skola, från idé till inbruktagande (verifierat i primärkällan, s. 13). Om byggtiden är tre år och plan- och lovskedet ligger fast, måste de tidiga skedena tillsammans vara flera år, inte månader.

Reservationen är att programsiffran bara kommer från ett bolag med en metod och tre projekt. Confidence medel. Men riktningen, att förstudie och program är underskattade i guiden, stöds av både Uppsala och SKR.

## 4. Politiska beslut och upphandling

**Beslut till beslut är kort.** Uppdrag till investeringsbeslut: Gårdsten 6 mån, Mölledal 4 mån, Lund idrottshall 3 mån. Det långa är arbetet mellan besluten (program), inte besluten i sig.

**Upphandling och överprövning (Upphandlingsmyndigheten, verifierat):** byggentreprenader överprövas i 5,5 procent av fallen (244 av 4417 annonserade, 2024), och andelen stiger med kontraktsvärdet, vilket är relevant för stora skolentreprenader. Avtalsspärren är tio dagar från tilldelning. Vid överprövning tar förvaltningsrätten omkring två till tre månader för sakprövade mål (median 2,1). En överprövning lägger alltså typiskt tre till sex månader till upphandlingsskedet, men bara i en minoritet av projekten.

**Bygglov:** endast den lagstadgade fristen finns, tio veckor från komplett ansökan med en förlängning om högst tio veckor (PBL 9 kap. 27 §). Ingen uppmätt handläggningstidsstatistik för lokaler existerar; Koladas mått avser bara småhus. Bygglovet löper i praktiken parallellt med bygghandling och är sällan ensam kritisk linje.

## 5. Rekommenderat normalfall per skede, totalentreprenad

Nollpunkt: uppdrag till Lejonfastigheter. Byggnation inkluderar entreprenörens bygghandling och slutskede.

| Skede | Rekommendation | Confidence | Grund |
|---|---|---|---|
| Förstudie | 6–12 mån | Låg | SKR-totalschablon minus kända skeden |
| Program (rumsfunktionsprogram → beslutsunderlag) | 12–24 mån | Medel | Uppsala 15–29 mån, median 18 |
| Projektering LF + upphandling TE | 8–14 mån | Låg | Överlappar; frister sourced, längd erfarenhet |
| Byggnation (per lokaltyp) | LSS 12–16, VoB 24, stor skola 30–36, hall 12–18 | Hög | 17 projekt |
| Slutskede och inflytt | 2–4 mån | Låg | Terminsstyrt för skola |
| Detaljplan (vid ny plan) | oförändrat | — | Behålls från Kolada, se guiden |

Kontrollpunkt mot verkligheten: SISAB ger tre år från investeringsbeslut till inflytt för skola, och SKR ger sex till åtta år från idé för skola. Ett normalfall byggt på tabellen ovan ska landa mellan dessa.

## 6. Källor att lägga till i registret

Alla verifierade i primärkälla där inget annat sägs.

- **Upphandlingsmyndigheten, Andelen överprövningar minskar 2024** (2025). Byggentreprenad överprövas 5,5 procent (244 av 4417), 28 procent av alla överprövade upphandlingar. https://www.upphandlingsmyndigheten.se/statistik/rattsfallsstatistik/andelen-overprovningar-minskar-2024/
- **Upphandlingsmyndigheten, Handläggningstiden för upphandlingsmål minskar 2024** (2025). Förvaltningsrätt sakprövade mål median 2,1 mån, kammarrätt median 8,5. https://www.upphandlingsmyndigheten.se/statistik/rattsfallsstatistik/handlaggningstiden-for-upphandlingsmal-minskar-2024/
- **SKR/FoU-fonden, Kommunala verksamhetslokaler — idéskrift** (7585-855-5). Framförhållning fem år förskola, sex till åtta år skola, idé till inbruktagande (s. 13). https://rka.nu/download/18.5627773817e39e979ef5d4f7/1644999903535/7585-855-5.pdf
- **Boverket, Tidsfrister för handläggning av bygglov** (PBL 9 kap. 27 §). Tio veckor plus en förlängning om tio veckor, gäller även skolor och lokaler. https://www.boverket.se/sv/PBL-kunskapsbanken/lov--byggande/handlaggning/tidsfrister-for-handlaggning/
- **SISAB slutrapporter** (Skanskvarn, Hässelby Villastad, Bromma Gymnasium, Sjövik, Kämpetorp), publicerade via meetingspublic.stockholm.se. Genomförandebeslut och godkänd entreprenad per projekt.
- **Uppsala Skolfastigheter projektsidor** (Kvarngärde, Bälinge, Flogsta). Avslutdatum per skede — enda öppna källan med skedeslängder.
- **Micasa, Lägesredovisning Stora Projekt T2 2025**, meetingspublic.stockholm.se. Beslutsläge och budget för hela VoB-portföljen.

## 7. Vad som inte gick att belägga

- **Skede-för-skede-tider utanför Uppsala.** Andra bolag publicerar bara start och slut, inte faspunkter. En egen tidsserie kräver LF:s milstolpedatum ur diariet.
- **Bygglovshandläggningstid för lokaler.** Ingen statistik finns; bara den lagstadgade fristen.
- **Upphandlingstilldelningsdatum.** Står inte i slutrapporterna; kräver TED eller e-Avrop.
- **Linköpings egna beslutsdatum per projekt.** Diariets PDF:er är nåbara men extraherades inte projekt för projekt. Detta är den mest värdefulla kvarvarande luckan och är åtkomlig.

## 8. Nästa steg som skulle ge riktig LF-statistik

Tio till femton avslutade Lejonfastigheter-projekt med milstolpedatum ur projektportalen (uppdrag, inriktningsbeslut, FFU ut, kontrakt, startbesked, slutbesked) skulle ge egna medianer per skede och göra guidens tider till Linköpings faktiska utfall i stället för branschbedömning. Det är den enda vägen till skedestider med hög confidence.
