# Kolada som datakälla — utredning

**Datum:** 2026-09-04
**Fråga:** Använder guiden källor från Kolada idag? Om inte, varför? Går API:t att anropa, och vad finns där som är användbart?
**Metod:** Genomsökning av repot samt live-anrop mot Koladas API v3 (samtliga siffror nedan hämtade 2026-09-04).

---

## 1. Svar: nej, inte som egen källa

Kolada förekommer på exakt ett ställe i repot, och då som passiv omnämning i organisationsfältet på en annan källa:

`data/kallregister.json` → `skr-jamforelser-detaljplan` → `"organisation": "Sveriges Kommuner och Regioner (SKR) i samarbete med RKA/Kolada"`

Utöver det nämns `kolada.se` som förstaval i Spår 6 i `docs/research-brief.md` (demografi). Det spåret verkar aldrig ha gått hela vägen — inga Kolada-poster finns i registret och inget nyckeltal i `data/siffror.json` har Kolada som `kalla_id`.

**Varför inte** — tre orsaker, i fallande betydelse:

1. **Researchen har varit dokumentcentrerad.** Både `research-brief.md` och hårdkontrollen bygger på ett arbetssätt där en källa är en *publikation* med en URL som kan hämtas och läsas (`metod: "webfetch"` / `"pdf-nedladdning"`). Kolada är inte en publikation utan en databas — den passar inte in i det mönstret och föll därför utanför sökrutinen.

2. **SKR har stått som mellanhand.** Flera av guidens starkaste ledtidspåståenden är i praktiken redan Kolada-data, fast hämtade i andra hand. `detaljplan.html` skriver att andelen kommuner som klarar planuppdrag → antagande på två år sjunkit från 48 % (2014–2015) till 13 % (2022–2023). Den siffran kommer från SKR:s Öppna jämförelser detaljplan, vars uppgifter kommunerna själva rapporterar in — publicerade rad för rad i Kolada som N07926. Vi har alltså använt Koladas data utan att gå till Kolada, och därmed utan att kunna bryta ner den på Linköping.

3. **Fokus på samhällsfastigheter har lett fel om Koladas innehåll.** Kolada uppfattas som en verksamhetsdatabas (skolresultat, brukarnöjdhet, personaltäthet) snarare än en fastighetsdatabas. Det stämmer delvis — se avsnitt 4 om vad som faktiskt saknas — men lokalkostnadsnyckeltalen och plan­ledtiderna har missats.

Bedömningen är att detta är en reell lucka, inte ett medvetet val.

---

## 2. API:t fungerar — men v2 är död

Verifierat 2026-09-04:

| | |
|---|---|
| **v2** | `HTTP 410` — `{"error": "This endpoint is deprecated. Please use /v3 instead."}` |
| **v3** | Fungerar. Ingen API-nyckel, ingen registrering, ingen rate limit som slog till |
| **Bas-URL** | `https://api.kolada.se/v3` |
| **Prestanda** | Ett helt nyckeltal för samtliga kommuner ett år: 3 858 rader, 555 kB, 1,7 s |
| **Swagger** | `https://api.kolada.se/v3/docs` |

v3 släpptes 2025-04-04 och v2 stängdes ungefär ett halvår senare. Alla exempel som ligger ute på nätet från före 2025 använder v2-syntax och fungerar inte.

### Användarvillkor

Ordagrant från `kolada.se/om-oss/api/`:

> Utnyttjande av data från Koladas API är avgiftsfritt och kräver inget avtal. Om du använder data från Kolada i en tjänst, ska källan anges ('Källa: Kolada'). **Gör du egna bearbetningar på vår data, får inte Kolada anges som källa.** Det är tillåtet att använda vår data för kommersiella ändamål. […] Tjänsten tillhandahålls i befintligt skick.

Två saker som direkt påverkar oss:

- **Bearbetningsregeln.** Om vi visar `N15009` för Linköping rakt av skriver vi "Källa: Kolada". Om vi räknar ut ett riksmedianvärde, ett index eller en Linköping-mot-riket-kvot är det vår bearbetning — då får Kolada *inte* anges som källa, utan får hänvisas till som underlag ("Egen bearbetning av data från Kolada"). Det behöver in i källregistrets schema om vi går vidare.
- **Revideringar aviseras inte.** Kolada skriver explicit att data kan revideras och att enskilda nyckeltal kan tas bort utan förvarning. För ett material som vårt, där hela poängen är spårbara och tidsstämplade siffror, innebär det att en Kolada-siffra måste bära hämtdatum och referensår — inte bara publiceringsår.

### Anropsmönster och fallgropar

Sökvägsbaserad syntax, inte query-parametrar. `?kpi=X&municipality=Y` returnerar tomt utan felmeddelande:

```
/kpi?title=lokalkostnad                          # metadata, fritextsök
/municipality?title=Linköping                    # → 0580
/data/kpi/N15009/municipality/0580               # hela tidsserien
/data/kpi/N15009/municipality/0580/year/2025     # ett år
/data/kpi/N15009/year/2025                       # alla kommuner, ett år
/oudata/kpi/U60045/ou/V60E21001                  # enhetsnivå
```

Tre fallgropar som kostade tid:

1. **Könsuppdelning.** Nyckeltal med `is_divided_by_gender: true` returnerar tre poster per år (`T`, `M`, `K`) i **ogaranterad ordning**. Att ta `values[0]` ger ibland kvinnvärdet. `N01951` för Linköping 2025 gav 82 794 invånare i första försöket; rätt värde är 168 714. Filtrera alltid på `gender == "T"`.
2. **Ogiltiga filter tystnar.** `/kpi_groups?id=G2KPI121849` ignorerar filtret och returnerar första gruppen utan fel. Använd `/kpi_groups/G2KPI121849`.
3. **Områdes-id.** Kommuner har fyrsiffriga koder (Linköping `0580`), regioner egna fyrsiffriga (Region Östergötland `0005`, inte `09`), riket `0000`. Grupp-id börjar på `G`. En bulkhämtning per år blandar kommuner, regioner och grupper i samma svar — filtrera.

---

## 3. Vad som finns och är användbart

### 3.1 Planledtider per kommun — det starkaste fyndet

`N07926` *Mediantid från planuppdrag till antagande under de senaste två åren, mediantid i månader*
`N07927` *Mediantid från samrådsstart till antagande under de senaste två åren, mediantid i månader*

Detta är samma mätning som ligger bakom SKR:s Öppna jämförelser, men per kommun och som tidsserie. Guiden bygger idag hela ledtidsargumentet på Bygg i Tids Ledtidsindex — 52 kommuner, flerbostadshus, riksgenomsnitt. Kolada ger 217 kommuner och, viktigast, **Linköpings egen siffra**.

Planuppdrag → antagande, mediantid i månader:

| Kommun | 2019 | 2021 | 2023 | 2025 |
|---|---:|---:|---:|---:|
| Linköping | 26,0 | 39,0 | 39,5 | **44,0** |
| Norrköping | 28,0 | 23,5 | 24,0 | 44,0 |
| Jönköping | 21,0 | 20,0 | 27,0 | 40,0 |
| Örebro | 22,0 | 18,0 | 18,0 | 25,0 |
| Västerås | 27,0 | 22,0 | 28,0 | 31,0 |
| Uppsala | 27,0 | 43,5 | 37,5 | 25,5 |
| Stockholm | 22,0 | 41,0 | 36,0 | 49,0 |
| Göteborg | 36,0 | 29,5 | 31,0 | 37,5 |
| Malmö | 15,0 | 21,0 | 22,5 | 25,1 |
| **Riksmedian (n=217)** | – | – | – | **29,0** |

Riksfördelning 2025: p10 = 12 mån, median = 29 mån, p90 = 64 mån, max = 361 mån.

Samrådsstart → antagande 2025: Linköping 16,0 mån mot riksmedian 12,0 (p10 5, p90 30).

Två slutsatser som materialet inte kan göra idag:

- **Linköping ligger klart över riksmedianen och har försämrats stadigt** — 26 → 39 → 39,5 → 44 månader sedan 2019. Det är 3,7 år bara från planuppdrag till antagande, före laga kraft, bygglov och byggnation. Det underbygger guidens 5–8-årsintervall för Spår D med ny detaljplan, med Linköpings egen data i stället för ett riksgenomsnitt för flerbostadshus.
- **Skillnaden mellan de två måtten visar var tiden ligger.** Linköping 2025: 44 månader totalt, varav 16 från samrådsstart. Alltså **28 månader — nästan två tredjedelar — före samråd**, i utrednings- och programskedet. Det är precis den tes guiden driver om tidiga skeden, och den går nu att belägga med Linköping-specifik data i stället för branschtolkning.

Övriga i samma familj: `N07923` planberedskap (Linköping 48,5 bostäder/1000 inv 2025), `N07924` planlagda bostäder senaste två åren, `N07928` andel överklagade detaljplaner (Linköping 29,6 % 2025 mot Örebro 15,0 % — guiden anger 25 % som riksnivå), `N07929` antal antagna detaljplaner (Linköping 27).

Reservation som måste med: omfattningen är inte entydigt dokumenterad.

> **Rättelse 2026-09-04.** Här stod först att Boverkets enkät avser bostadsplaner. Båda leden var fel. Kolada anger "Källa: SKR och egen undersökning i kommunen" — inte Boverket — och beskriver frågan som "de detaljplaner som antogs i kommunen", utan avgränsning till ändamål; för `N07929` uttryckligen "alla detaljplaner, oavsett förfarande". SKR beskriver undersökningen som gjord med fokus på bostäder, men den sida som skulle reda ut tidsmåttets avgränsning ger 404. Påståendet var alltså en obelagd inskränkning som dessutom underskattade måttets relevans: om skolplaner ingår är siffran direkt tillämplig på lokalförsörjning. Märkning, källattribution och noter rättade i katalogen, källregistret och på `/linkoping`.

### 3.2 Lokalkostnader per verksamhet — kommunnivå

Från Räkenskapssammandraget, publicerat årligen. **2025 års utfall finns redan.**

| Nyckeltal | Linköping | Riket | Spridning i urvalet |
|---|---:|---:|---|
| `N15009` Lokalkostnad grundskola åk 1–9, kr/elev | 27 536 | 26 180 | Jönköping 21 361 – Örebro 34 173 |
| `N11020` Nettokostnad lokaler förskola, kr/inskrivet barn | 33 403 | 33 651 | Norrköping 32 085 – Uppsala 42 470 |
| `N17008` Lokalkostnad gymnasieskola, kr/elev | 28 942 | 25 802 | Jönköping 19 111 – Örebro 36 842 |
| `N20060` Lokalkostnad äldreomsorg exkl. ext. intäkter, kr/inv 65+ | 4 620 | 3 956 | Linköping 4 620 – Norrköping 6 045 |
| `N28033` Bruttokostnad lokaler LSS, kr/inv | 629 | 536 | Jönköping 396 – Norrköping 833 |

*(Samtliga referensår 2025. Riksvärdet för N15009 är ett vägt riksvärde; medianen över alla kommuner är 24 868 kr/elev, p10 22 325, p90 27 799.)*

Detta är den enda offentliga, jämförbara serien över vad kommunens lokalförsörjning faktiskt kostar verksamheten — och det är i praktiken Lejonfastigheters hyresnota sedd från hyresgästens sida. Guiden har idag `dem-linkoping-hyresnota` (1 392 → 1 666 mnkr/år) från den kommungemensamma LFP:n, men ingenting som sätter den i relation till andra kommuner.

Notera att Linköping ligger över riket på fyra av fem mått. Det är en siffra som kommer att ställas frågor om, och det är bättre att vi har den och kan förklara den (nyproduktionsandel, standard, internhyresmodell) än att någon annan tar fram den.

### 3.3 Demografisk framskrivning per kommun

Kolada publicerar SCB:s kommunframskrivningar i exakt de åldersgrupper lokalförsörjning dimensioneras efter:

| | Linköping | Norrköping | Jönköping | Örebro | Riket |
|---|---:|---:|---:|---:|---:|
| Inv 1–5 år, antal (`N01926`) | 8 169 | 7 420 | 7 769 | 8 139 | 540 186 |
| Inv 6–15 år, antal (`N01953`) | 18 825 | 17 203 | 17 499 | 18 923 | 1 237 592 |
| Inv 80+, antal (`N01957`) | 9 907 | 8 842 | 9 397 | 9 377 | 683 962 |
| Framskr. 1–5 år, +5 år (`N02916`) | −9,5 % | −9,6 % | −7,7 % | −8,9 % | −8,9 % |
| Framskr. 6–15 år, +5 år (`N02917`) | −9,1 % | −8,4 % | −5,5 % | −8,9 % | −7,1 % |
| Framskr. 80+, +5 år (`N02922`) | +17,8 % | +18,7 % | +17,9 % | +24,0 % | +19,4 % |
| Framskr. 1–5 år, +10 år (`N02881`) | −2,6 % | −5,1 % | −1,3 % | −1,6 % | −3,7 % |
| Framskr. 6–15 år, +10 år (`N02884`) | −17,6 % | −17,4 % | −12,2 % | −17,6 % | −14,7 % |
| Framskr. 80+, +10 år (`N02842`) | +26,1 % | +24,9 % | +24,1 % | +32,6 % | +27,2 % |

Detta bekräftar och skärper guidens demografiavsnitt. `dem-linkoping-grundskola` anger −2 476 barn 6–12 år 2024–2034 från Linköpings egen prognos; Kolada ger −17,6 % för 6–15 år på tio år, vilket i absoluta tal blir cirka −3 300. Samma riktning, olika åldersintervall och prognosbas — värt att redovisa båda och förklara skillnaden hellre än att välja en.

Poängen är dessutom att Kolada gör siffran **jämförbar**: Linköping ligger nära Norrköping och Örebro men sämre än Jönköping på skolåldrarna, och lägst av de fyra på 80+-ökningen. Det ger en mycket bättre grund för resonemanget "vi bygger skola samtidigt som elevkullarna minskar och omsorgsbehovet ökar" än en enskild kommunprognos.

Utfallsdata finns också: Linköpings faktiska förändring 1–5 år var −3,2 % bara under 2025 (`N02014`), och −12,1 % över senaste femårsperioden (`N02017`).

> **Rättelse 2026-09-04.** Här stod först −4,5 % och −10,8 %. Det var kvinnovärdena, inte totalerna — precis den könsuppdelningsfälla som beskrivs i avsnitt 2. Talen ovan är kontrollerade mot `gender === "T"` och stämmer med det som `scripts/fetch-kolada.js` nu hämtar. Det gör att prognoserna går att kalibrera mot utfall — vilket är precis vad `docs/research-brief.md` Spår 6 efterlyste ("bekräfta att svackan är reell och inte en artefakt").

### 3.4 Fastighetsnyckeltal — men bara för regioner

38 nyckeltal i serien `U600xx`/`U608xx`: drift, underhåll, kapitalkostnad, energi, area, vakansgrad — allt i kr respektive kWh per kvm BRA. Det är den fastighetsekonomiska struktur guiden efterfrågar.

**Men de är märkta `municipality_type: "L"` — de finns endast för regioner, inte för kommuner.** Verifierat: `/data/kpi/U60800/municipality/0580` ger noll rader, liksom för Stockholm och Göteborg.

Region Östergötland (`0005`), senaste tre åren:

| Nyckeltal | 2023 | 2024 | 2025 |
|---|---:|---:|---:|
| `U60800` Area egna lokaler, kvm BRA | 697 026 | 703 836 | 710 517 |
| `U60802` Area egna lokaler, kvm BRA/inv | 1,48 | 1,49 | 1,50 |
| `U60803` Vakansgrad egna lokaler, % | 2,0 | 3,0 | 3,0 |
| `U60045` Drift + underhåll (FAUH+PU) + kapitalkostnad, kr/kvm BRA | 2 033 | 2 060 | 1 872 |
| `U60009` Planerat underhåll, kr/kvm BRA | 46,4 | 55,0 | 59,9 |
| `U60495` Energianvändning verksamhetslokaler, kWh/kvm BRA | 182,7 | 171,7 | 174,0 |

Dessutom finns **enhetsdata per anläggning** (`V60`-serien). Universitetssjukhuset i Linköping (`V60E21001`): 375 813 kvm BRA 2025, drift + underhåll + kapitalkostnad 2 200 kr/kvm, planerat underhåll 60,4 kr/kvm. Vrinnevisjukhuset, Lasarettet i Motala och Närsjukvården i Finspång finns på samma nivå.

Vårdfastigheter är inte skolor, men detta är den enda offentliga svenska serien med den strukturen — och den avser byggnader i Linköping. Som benchmark för planerat underhåll per kvm är den mer användbar än ingenting, förutsatt att caveaten är tydlig.

### 3.5 Övrigt av värde

- `N07001` Kostnad fysisk och teknisk planering, kr/inv — Linköping 1 127 mot riket 1 361 (2025). Kommunen lägger alltså mindre än riket på planering per invånare samtidigt som planledtiden är längre än riksmedianen. Det är ett resursargument som guiden idag inte kan göra.
- `N11730` Inskrivna barn på förskola, kommunal regi (Linköping 5 554, 2025) och `N15033` elever per lärare — volymtal för att räkna om kr/elev till total lokalnota.
- `U00810`/`N00820` Handläggningstid bygglov, median dagar. Täckningen är dålig — Linköping, Norrköping, Västerås och Lund saknar värden helt; Jönköping 55,5, Örebro 63, Uppsala 53 (2024). Avser dessutom en- och tvåbostadshus. Kan inte användas för vår del av processen.
- Kommungrupper (`G`-prefix) ger färdiga jämförelsegrupper, exempelvis "större stad" eller kommunalförbund, som ovägda medelvärden.

---

## 4. Vad som inte finns — och som gör att Kolada inte kan bära materialet

Det här är lika viktigt som fynden ovan:

1. **Ingen lokalarea för kommuner.** Ingen kvm, ingen kr/kvm BRA, ingen vakansgrad för kommunala verksamhetslokaler. Serien finns bara för regioner. Guidens centrala nyckeltalskategori — kr/m² BTA per lokaltyp — kan alltså inte fyllas från Kolada. Det motiverar i efterhand det befintliga arbetssättet med enskilda projektreferenser (Smedbyskolan, Vallåsskolan, Kvarngärdesskolan).
2. **Inga investerings- eller produktionskostnader.** Kolada mäter driftkostnader från Räkenskapssammandraget, inte entreprenadkostnader. Ingenting om kr/plats, kr/elevplats eller projektbudget.
3. **Inga kommunala bolag.** Kolada redovisar kommunen som huvudman. Lejonfastigheter, SISAB, Futurum och Norrevo syns bara indirekt, som hyreskostnad hos den kommunala förvaltningen. Aktörsjämförelserna i kategorin `aktorer` går inte att ersätta.
4. **Inga byggtider.** Bara planledtider. Tiden från startbesked till inflyttning — som är halva guidens ämne — finns inte.
5. **Två års eftersläpning i planledtidsdata.** `N07926` avser "de senaste två åren" och publiceras vartannat år. 2025 års värde speglar planer antagna 2023–2025.

Sammantaget: Kolada stärker guidens **kontext och jämförbarhet** (ledtider, demografi, lokalkostnad per elev, planberedskap). Den kan inte ersätta **projektdata** (kr/m², kr/plats, byggtider) eller **aktörsdata**.

---

## 5. Förslag

Utan att ha byggt något ännu — tre alternativ i stigande ambition:

**A. Kolada som källa i registret, siffrorna manuellt införda.** Lägg in Kolada som en eller flera poster i `data/kallregister.json` med `typ: "statistik"`, och för in de starkaste siffrorna i `data/siffror.json` med hämtdatum och referensår. Ingen kodändring, ingen driftrisk, följer befintligt arbetssätt. Fångar 80 % av värdet.

**B. Ett hämtskript, siffrorna committade.** `scripts/fetch-kolada.js` som hämtar en definierad uppsättning nyckeltal och skriver `data/kolada.json`, körs manuellt vid uppdatering och committas. Data i repot förblir statiskt och spårbart, men uppdateringen blir ett kommando i stället för handpåläggning. Löser också revideringsproblemet: en diff visar vad Kolada ändrat sedan sist.

**C. Live-anrop vid build eller runtime.** Går tekniskt, men bryter mot materialets grundprincip att varje siffra är hårdkontrollerad och tidsstämplad. Rekommenderas inte.

**Rekommendation: B**, med A som första steg. Det ger jämförelsetabellerna i avsnitt 3.1–3.3 som återanvändbar data utan att göra sidan beroende av en extern tjänst som explicit levereras "i befintligt skick" och reviderar utan avisering.

Två saker behöver beslutas innan något byggs:

- **Ska Linköpings egna siffror in i det publika materialet?** Att guiden visar att Linköping har 44 månaders planledtid mot riksmedianens 29, och ligger över riket på fyra av fem lokalkostnadsmått, är korrekt men politiskt laddat. Det är ett ägarbeslut, inte ett tekniskt.
- **Var i strukturen hör Kolada-data hemma?** Löst: ett eget område `kommunstatistik` i registret. Planledtidernas omfattning visade sig dessutom inte vara begränsad till bostadsplaner — se rättelsen ovan.
