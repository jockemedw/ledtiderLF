# Linköping mot jämförbara kommuner — analys av Kolada-data

**Genomförd:** 2026-09-04
**Branch:** `claude/kolada-api-integration-1vqzbg`
**Underlag:** `data/kolada.json`, 57 nyckeltal hämtade ur Koladas API v3 med `scripts/fetch-kolada.js`
**Publicerat som:** `/linkoping` samt inline-block i `#kontext`, `#kostnad` och `#dp-skr`

---

## 1. Vad analysen är och inte är

Kolada mäter **kommunen**, inte Lejonfastigheter. Lokalkostnaden per elev är Linköpings kommuns bokförda kostnad — i praktiken hyresnotan sedd från verksamhetens sida. Planledtiden är plan- och byggförvaltningens. Ingetdera är fastighetsbolagets prestation, och materialet får aldrig påstå det.

Varje mått är därför klassat, och klassen styr både beräkning och presentation:

| Klass | Antal | Riktning | Vad som får sägas |
|---|---:|---|---|
| Styrmått | 6 | entydig | Avvikelsen är ett utfall — bättre eller sämre är rimliga ord |
| Kostnadsmått | 19 | tvetydig | Avvikelsen redovisas, men aldrig som betyg |
| Kontextmått | 32 | ingen | Beskriver förutsättningar, ingen värdering |
| **Summa** | **57** | | |

Regeln är kodad, inte bara skriven: `avvikelseStil()` i `lib/kolada.js` returnerar alltid neutral ton för kostnads- och kontextmått, och `lib/__tests__/kolada.test.js` faller om någon ändrar det.

Tre referenser visas likvärdigt — ingen är primär. **Liknande kommuner** är RKA:s egen grupp om de sju mest jämförbara kommunerna per verksamhet, definierad av tredje part och utan Linköping självt. **Större stad** är SKR:s kommungruppsindelning, 23 kommuner. **Riket** är Koladas riksvärde. Där riksvärde saknas — vilket gäller samtliga planmått — redovisas kommunmedianen i en egen kolumn, aldrig substituerad in i Riket-kolumnen.

---

## 2. Planprocessen — det tunga fyndet

### 2.1 Linköping ligger i den fjärdedel som har längst planledtid

Mediantid i månader, referensår 2025:

| Mått | Linköping | Liknande kommuner | Större stad | Kommunmedian | Percentil |
|---|---:|---:|---:|---:|---|
| Planuppdrag → antagande | **44,0** | 32,4 | 36,6 | 29,0 | p75 av 217 kn |
| Samrådsstart → antagande | **16,0** | 12,0 | 15,0 | 12,0 | p71 av 217 kn |
| **Skillnad — tid före samråd** | **28,0** | 20,4 | 21,6 | 17,0 | — |

Linköping ligger 36 % över jämförbara kommuner och 52 % över kommunmedianen. Tre av fyra svenska kommuner har kortare planledtid.

**28 av de 44 månaderna ligger före samrådsstart.** Nästan två tredjedelar av planledtiden förbrukas innan planen blir synlig utåt — i utrednings- och programskedet. Det är exakt det skede där guiden redan hävdar att 70–80 % av kostnaden låses. Tesen om tidiga skeden har därmed gått från branschtolkning till belagd med Linköpings egen data.

### 2.2 Men försämringen är nationell, inte linköpingsspecifik

Detta är den viktigaste nyanseringen i hela analysen, och den saknades i den ursprungliga utredningen:

| Planuppdrag → antagande | 2017 | 2019 | 2021 | 2023 | 2025 | Förändring |
|---|---:|---:|---:|---:|---:|---:|
| Linköping | 24,0 | 26,0 | 39,0 | 39,5 | 44,0 | **+83 %** |
| Liknande kommuner | 17,2 | 23,1 | 29,1 | 31,8 | 32,4 | +88 % |
| Större stad | 17,9 | 21,4 | 26,9 | 31,7 | 36,6 | +104 % |

Linköping har försämrats med 83 procent på åtta år. Jämförbara kommuner har försämrats med 88 och Större stad med 104 procent. **Linköping försämras alltså långsammare än sina jämförelsegrupper** — men startade högre och ligger fortfarande högre. Gapet mot liknande kommuner var +40 % 2017 och är +36 % 2025, alltså i stort sett oförändrat.

Slutsatsen är dubbel och båda halvorna behövs. Linköping har ett reellt problem i absoluta tal: 3,7 år bara till antagande, före laga kraft, bygglov och byggnation. Men det är inte ett problem som uppstått i Linköping eller som Linköping förvärrat snabbare än andra. Det är en nationell utveckling där Linköping ligger i det sämre skiktet. Ett material som bara redovisade den första halvan vore missvisande.

Uppdelningen är också informativ: tiden före samråd gick från 16 till 28 månader (+75 %), tiden från samråd till antagande från 8 till 16 (+100 %). Båda faserna har ungefär fördubblats.

### 2.3 Lovhandläggningen går åt andra hållet

| Mått | Linköping | Liknande kommuner | Större stad | Kommunmedian | Percentil |
|---|---:|---:|---:|---:|---|
| Bygglovstid, median (2023) | **41,0 dgr** | 63,4 | 58,4 | 59,0 | p22 av 139 kn |

Linköping handlägger bygglov på ungefär två tredjedelar av jämförelsekommunernas tid och är snabbare än 78 procent av landets kommuner. **Flaskhalsen sitter i planskedet, inte i lovgivningen.**

Det här är analysens motvikt, och den är inte kosmetisk. En jämförelse som bara redovisat det negativa hade varit både orättvis och lätt att avfärda. Kontrasten pekar dessutom åt ett konkret håll: resurser och arbetssätt i lovhanteringen fungerar, problemet ligger tidigare i kedjan.

*Not om året:* 2025 års värde är 28,5 dagar men bygger på bara 24 inrapporterade kommuner — insamlingen är inte klar. Skriptet väljer därför automatiskt senaste år med minst 50 kommuner, vilket för det här måttet blir 2023. Regeln ligger i `MIN_KOMMUNER` i `lib/kolada.js`.

### 2.4 Planberedskap och resursinsats

| Mått | Linköping | Liknande kommuner | Större stad | Kommunmedian | Percentil |
|---|---:|---:|---:|---:|---|
| Planberedskap, bostäder/1000 inv | 48,5 | 47,6 | 39,3 | 28,4 | p77 |
| Överklagade detaljplaner, % | 29,6 | 27,0 | 28,7 | 14,3 | p65 |
| Kostnad fysisk och teknisk planering, kr/inv | 1 127 | 1 386 | 1 284 | 1 240 | p42 |

Två saker att notera. Planberedskapen är god — bättre än tre fjärdedelar av landet — vilket gör den långa ledtiden svårare att förklara med brist på planlagd mark. Och **Linköping lägger mindre på fysisk planering per invånare än både jämförelsekommunerna och riket**, samtidigt som planledtiden är längre. Det är ett resursargument som materialet inte kunnat göra tidigare. Sambandet är inte bevisat av dessa två tal, men de pekar åt samma håll och är värda att pröva.

Andelen överklagade planer är dubbelt så hög som kommunmedianen. Det är dock ett kontextmått, inte ett styrmått — andelen speglar planernas karaktär och kommunens planeringsmiljö minst lika mycket som handläggningen.

---

## 3. Lokalkostnad — avvikelser, inte betyg

Referensår 2025, kronor:

| Mått | Linköping | Liknande kommuner | Större stad | Riket | Kommunmedian | Percentil |
|---|---:|---:|---:|---:|---:|---|
| Grundskola åk 1–9, kr/elev | 27 536 | 25 837 | 26 144 | 26 180 | 24 336 | p73 |
| Förskola netto, kr/inskrivet barn | 33 403 | 31 382 | 34 894 | 33 651 | 30 910 | p65 |
| Gymnasieskola, kr/elev | 28 942 | 27 581 | 28 616 | 25 802 | 26 936 | p61 |
| Äldreomsorg exkl. ext. intäkter, kr/inv 65+ | 4 620 | 5 445 | 4 942 | 3 956 | 3 765 | p68 |
| LSS brutto, kr/inv | 629 | 549 | 637 | 536 | 509 | p70 |

Linköping ligger över riket på samtliga fem, och över liknande kommuner på fyra av fem — undantaget är äldreomsorgen, där Linköping ligger 15 procent under.

**Detta är inte ett underbetyg, och får inte presenteras som ett.** Fyra rimliga förklaringar som alla drar åt samma håll:

1. **Nyproduktionsandel.** En nybyggd skola bär full kapitalkostnad. En kommun mitt i ett utbyggnadsprogram får högre kr/elev än en kommun med avskrivet bestånd — utan att vara sämre skött.
2. **Standard och energiprestanda.** Investeringar som sänker driftkostnad höjer kapitalkostnad. Nettoeffekten på kr/elev kan vara positiv i decennier innan den vänder.
3. **Internhyresmodellen.** Vad som ryms i "lokalkostnad" skiljer sig mellan kommuner. `N03187`, interna köp för gemensamma lokaler, är 0 kr/inv i Linköping mot kommunmedianens 242 — Linköping bokför alltså detta på ett annat sätt än flertalet kommuner, vilket i sig gör kostnadsjämförelser mellan kommuner osäkra.
4. **Spridningen är stor.** Grundskolans lokalkostnad spänner över landets 290 kommuner från 13 196 till 47 089 kr/elev, med p10 på 19 155 och p90 på 31 454. Linköpings 27 536 ligger inom det breda mittfältet, inte i något ytterläge.

Det som ändå är värt att följa är att avvikelsen är **konsekvent** — fem mått av fem över riket. Ett enskilt mått hade varit brus; en genomgående nivåskillnad är värd en förklaring, och den förklaringen bör Lejonfastigheter kunna ge innan någon annan formulerar den åt oss.

---

## 4. Demografi — bekräftar och skärper

| Mått | Linköping | Liknande kommuner | Större stad | Riket | Percentil |
|---|---:|---:|---:|---:|---|
| Framskriven förändring 6–15 år, 5 år | −9,1 % | −6,9 % | −7,4 % | −7,1 % | p31 |
| Framskriven förändring 6–15 år, 10 år | −17,6 % | −13,6 % | −15,4 % | −14,7 % | p36 |
| Framskriven förändring 80+, 5 år | +17,8 % | +22,8 % | +19,4 % | +19,4 % | p43 |
| Framskriven förändring 80+, 10 år | +26,1 % | +32,5 % | +27,3 % | +27,2 % | p58 |
| Utfall, 1–5 år senaste året | −3,2 % | −3,3 % | −3,5 % | −3,3 % | p61 |
| Utfall, 1–5 år senaste 5 åren | −12,1 % | −10,7 % | −11,5 % | −10,7 % | p50 |

Tre slutsatser.

**Skolåldersminskningen är brantare i Linköping än på de flesta håll.** −17,6 % på tio år mot rikets −14,7 %; endast en tredjedel av kommunerna har brantare fall. Tioårshorisonten är just den som motsvarar ledtiden för nybyggnad med ny detaljplan — det som beslutas idag levereras in i en mindre årskull.

**Åldringsökningen är däremot mildare än hos jämförelsekommunerna.** +26,1 % mot liknande kommuners +32,5 %. Behovsförskjutningen från skola till omsorg är alltså reell men något mindre dramatisk i Linköping än i gruppen.

**Svackan är bekräftad mot utfall.** Research-briefens Spår 6 efterlyste besked om huruvida den demografiska svackan är reell eller en prognosartefakt. Utfallet −12,1 % för 1–5 år över fem år ligger i linje med framskrivningarna och något under kommunmedianen. Svackan är reell.

> **Rättelse mot den ursprungliga utredningen.** `docs/kolada-utredning-2026-09-04.md` angav först −4,5 % och −10,8 % för dessa två utfallsmått. Det var kvinnovärdena, inte totalerna — Koladas könsuppdelning returnerar T/M/K i ogaranterad ordning. Rätt värden är −3,2 % och −12,1 %. Utredningen är rättad, och `scripts/fetch-kolada.js` har numera en hård spärr mot samma fel.

### Verksamhetsvolym

Inskrivningsgraden i förskola är 89,6 % mot kommunmedianens 88,1 — hög, vilket betyder att en given årskull kräver fler platser. Samtidigt går 24,0 % av barnen i fristående förskola mot kommunmedianens 12,3 %, vilket drar åt motsatt håll för kommunens eget lokalbehov. De två måtten måste läsas tillsammans när en årskull ska översättas till platser.

---

## 5. Fastighetsnyckeltal — vad som saknas

Kolada har 38 fastighetsnyckeltal i kr respektive kWh per kvm BRA — drift, underhåll, kapitalkostnad, area, vakansgrad. **Samtliga finns endast för regioner.** Verifierat: `U60800` för Linköping, Stockholm och Göteborg returnerar noll rader.

Det innebär att guidens centrala nyckeltalskategori — kr/m² BTA per lokaltyp — inte kan fyllas från Kolada. Det befintliga arbetssättet med enskilda projektreferenser är alltså rätt metod, inte en nödlösning.

Som närmaste offentliga benchmark redovisas Region Östergötland och dess fyra anläggningar, varav Universitetssjukhuset ligger i Linköping. Vårdfastigheter är inte skolor och en region är inte en kommun — talen ska läsas som storleksordning, inte som jämförelsetal.

Övrigt som Kolada inte kan ge: investerings- och produktionskostnader (Kolada mäter driftkostnad från Räkenskapssammandraget, inte entreprenad), kommunala bolag (Lejonfastigheter syns bara indirekt som hyreskostnad hos förvaltningen), och byggtider (bara planledtider — tiden från startbesked till inflyttning finns inte).

---

## 6. Vad detta bör leda till

Fyra saker som analysen ger underlag för, i fallande angelägenhet:

1. **Det förskedet vi redan argumenterar för är kvantifierat.** 28 av 44 månader ligger före samråd. Det är inte längre en branschtolkning utan Linköpings egen mätning, och det är den enskilt starkaste siffran i hela materialet för att motivera resurser till utrednings- och programskedet.

2. **Resursfrågan går att ställa skarpt.** Lägre planeringskostnad per invånare än jämförelsekommunerna, längre planledtid, god planberedskap. Det utesluter den enklaste förklaringen (brist på planlagd mark) och pekar mot bemanning och arbetssätt. Sambandet behöver prövas mot kommunens egen verksamhetsuppföljning innan det påstås.

3. **Lokalkostnadsnivån behöver en egen förklaring innan någon annan formulerar en.** Fem mått av fem över riket är en fråga som kommer att ställas. Nyproduktionsandel och internhyresmodell är de troliga förklaringarna, men de behöver beläggas med LF:s egna data — Kolada kan bara visa att skillnaden finns.

4. **Rutin för uppdatering.** Kolada reviderar utan avisering och publicerar löpande. `npm run kolada` följt av `git diff` visar vad som ändrats sedan sist. Lämpligen körs det i samband med den årliga mjukkontrollen 1 oktober enligt `docs/mjukkontroll-brief.md`, och därutöver när Räkenskapssammandraget publiceras.

---

## 7. Kvarstående

- **Bygglovsmåttet avser en- och tvåbostadshus.** Det finns inget jämförbart mått på handläggningstid för skol- eller omsorgsbygglov i Kolada. Slutsatsen om snabb lovhantering är därför indikativ, inte bevisad för vår ärendetyp.
- **Planmåtten avser bostadsplaner.** Caveaten står vid varje förekomst, men den försvinner inte. En detaljplan för skola kan ha annan komplexitet och annan politisk laddning.
- **N07926 publiceras vartannat år.** Nästa värde väntas 2027 och kommer att spegla planer antagna 2025–2027.
- **Nyproduktionsandelen är inte mätt.** Den är den mest sannolika förklaringen till lokalkostnadsnivån men finns inte i Kolada. Behöver hämtas ur LF:s eget bestånd för att kunna beläggas.
