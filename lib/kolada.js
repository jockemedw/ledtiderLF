/**
 * Hämtning och bearbetning av kommunstatistik från Koladas API v3 (RKA).
 *
 * Logiken ligger här och inte i scripts/fetch-kolada.js så att testerna kan
 * importera katalogen och beräkningarna utan att göra nätverksanrop.
 *
 * LICENSVILLKOR — styr filens struktur. Koladas villkor tillåter "Källa: Kolada"
 * för råa värden men förbjuder Kolada som källa för egna bearbetningar. Därför
 * delas utdata i två toppnycklar: `varden` innehåller enbart det API:t
 * returnerade, `bearbetat` enbart det vi härlett (percentil, avvikelse,
 * fördelning). Sidan renderar råceller ur `varden` och härledda celler ur
 * `bearbetat`, aldrig blandat. Uppdelningen kontrolleras av testet.
 *
 * Fallgropar i API:t, verifierade 2026-09-04:
 *  - Sökvägssyntax, inte query-params. Query-params ger tomt svar utan fel.
 *  - Värden är könsuppdelade (T/M/K) i ogaranterad ordning — filtrera på T.
 *    values[0] gav 82 794 invånare för Linköping i stället för 168 714.
 *  - Svar kapas vid 5 000 rader och sätter next_url, som måste följas.
 *  - Riket (0000) saknar värden för planmåtten; kommunmedian används i stället,
 *    som en egen kolumn — aldrig substituerad in i Riket-kolumnen.
 */

const BAS = 'https://api.kolada.se/v3';
const FRAN_AR = 2015;
const LINKOPING = '0580';

// RKA:s egna jämförelsegrupper för Linköping. De är definierade av tredje part
// och innehåller inte Linköping självt, vilket gör dem till rena referenser.
const ENTITETER = {
  '0580': { namn: 'Linköping', slag: 'kommun' },
  '0000': { namn: 'Riket', slag: 'riket' },
  '0005': { namn: 'Region Östergötland', slag: 'region' },
  G37449: { namn: 'Liknande kommuner, övergripande, Linköping', slag: 'grupp' },
  G35989: { namn: 'Liknande kommuner grundskola, Linköping', slag: 'grupp' },
  G85875: { namn: 'Liknande kommuner förskola, Linköping', slag: 'grupp' },
  G36281: { namn: 'Liknande kommuner gymnasieskola, Linköping', slag: 'grupp' },
  G39622: { namn: 'Liknande kommuner LSS, Linköping', slag: 'grupp' },
  G176609: { namn: 'Liknande kommuner äldreomsorg, Linköping', slag: 'grupp' },
  G92790: { namn: 'Större stad', slag: 'grupp' },
  G30825: { namn: 'Kommuner 100 000–199 999 invånare', slag: 'grupp' },
  G33615: { namn: 'Östergötlands läns kommuner', slag: 'grupp' },
};

const STORRE_STAD = 'G92790';
const RIKET = '0000';
const REGION = '0005';
const LIKNANDE_OVRIGT = 'G37449';
const OVRIGA_REFERENSER = ['G30825', 'G33615'];

// De tre referenserna visas likvärdigt på sidan — ingen är primär.
const REFERENSGRUPPER = [
  {
    id: 'liknande',
    namn: 'Liknande kommuner',
    typ: 'kpi-specifik',
    not: 'RKA:s grupp om de sju mest liknande kommunerna för respektive verksamhetsområde. Ovägt medelvärde. Gruppen innehåller inte Linköping självt.',
  },
  {
    id: 'storre-stad',
    namn: 'Större stad',
    typ: 'fast',
    entitet: STORRE_STAD,
    not: 'SKR:s kommungruppsindelning, 23 kommuner. Ovägt medelvärde.',
  },
  {
    id: 'riket',
    namn: 'Riket',
    typ: 'fast',
    entitet: RIKET,
    not: 'Koladas riksvärde, oftast vägt. Alltså inte samma slags statistik som gruppernas ovägda medelvärden — jämförelsen är vägledande, inte exakt.',
  },
];

// Regionens fastigheter på anläggningsnivå. Kolada har inga motsvarande
// nyckeltal för kommuner — det här är närmaste offentliga benchmark, och
// anläggningarna ligger i Linköping och Östergötland.
const ENHETER = {
  V60E21001: { namn: 'Universitetssjukhuset i Linköping', region: REGION },
  V60E21013: { namn: 'Vrinnevisjukhuset i Norrköping', region: REGION },
  V60E21014: { namn: 'Lasarettet i Motala', region: REGION },
  V60E21011: { namn: 'Närsjukvården i Finspång', region: REGION },
};

const GRUPPER = [
  {
    id: 'planprocess',
    namn: 'Ledtider — planprocess och lov',
    ingress:
      'Det enda område där Kolada mäter samma sak som guidens ledtidsargument. Underlaget kommer från fyra olika håll — SKR:s öppna jämförelser inom detaljplaneområdet, kommunernas egen rapportering, SCB och Räkenskapssammandraget — och källan anges därför per mått. Tidsmåtten avser detaljplaner utan dokumenterad avgränsning till ändamål; volymmåtten räknar bostäder.',
  },
  {
    id: 'investering',
    namn: 'Investeringsvolym och ägarstruktur',
    ingress:
      'Kommunens samlade investeringsvolym och finansiering, samt anläggningstillgångar och avskrivningar för kommunen och kommunkoncernen sida vid sida. Skillnaden mellan de två nivåerna är det närmaste Kolada kommer att mäta Lejonfastigheter: beståndet ligger i bolaget, inte i kommunens egen balansräkning. Investeringsutgifter per verksamhet redovisas inte här: för en kommun som äger sina verksamhetslokaler genom ett bolag mäter de var ägandet sitter, inte vad som byggs.',
  },
  {
    id: 'lokalkostnad',
    namn: 'Lokalkostnader per verksamhet',
    ingress:
      'Räkenskapssammandragets driftkostnad för lokaler — i praktiken hyresnotan till Lejonfastigheter sedd från verksamhetens sida. Detta är löpande kostnad per elev eller plats, inte investering per plats. Kostnadsnivå är inte ett betyg.',
  },
  {
    id: 'bestand',
    namn: 'Lokalbestånd och kapacitet',
    ingress:
      'Antal anläggningar per invånare för de lokaltyper Kolada faktiskt räknar. Ett högre tal är inte automatiskt bättre — behovet styrs av demografi, geografi och föreningsliv.',
  },
  {
    id: 'energi',
    namn: 'Energi och media per kvadratmeter',
    ingress:
      'Nils Holgersson-modellen prissätter el, värme, vatten och avfall per kvadratmeter för en standardiserad typfastighet. Det är den enda kr/kvm Kolada har på kommunnivå — men typfastigheten är ett flerbostadshus, inte en skola.',
  },
  {
    id: 'demografi',
    namn: 'Demografi och framskrivning',
    ingress:
      'SCB:s kommunframskrivningar i de åldersgrupper lokalförsörjning dimensioneras efter, plus faktiskt utfall att kalibrera prognoserna mot.',
  },
  {
    id: 'volym',
    namn: 'Verksamhetsvolym',
    ingress:
      'Antal barn och elever samt inskrivningsgrad — det som översätter en befolkningsprognos till ett lokalbehov.',
  },
  {
    id: 'forvaltningskvalitet',
    namn: 'Förvaltningskvalitet',
    ingress:
      'Medborgarnas omdöme om hur kommunens verksamhetslokaler sköts. Det enda måttet i materialet som värderar själva förvaltningsuppdraget snarare än dess kostnad.',
  },
  {
    id: 'region-fastighet',
    namn: 'Regionens fastighetsnyckeltal',
    ingress:
      'Kolada har inga kostnader per kvadratmeter för kommunala verksamhetslokaler — serien finns bara för regioner. Region Östergötland och dess anläggningar är närmaste offentliga benchmark. Vårdfastigheter är inte skolor, och en region är inte en kommun.',
  },
];

// Under så här många kommuner i fördelningen används inte året som
// jämförelseår — insamlingen är då för ofullständig för att bära en percentil.
const MIN_KOMMUNER = 50;

const KLASSER = ['styrmatt', 'kostnadsmatt', 'kontextmatt'];
const RIKTNINGAR = ['lagre_battre', 'hogre_battre', 'ingen'];

const VILLKOR = {
  ravarde: 'Källa: Kolada',
  bearbetat: 'Egen bearbetning av data från Kolada',
  not: 'Kolada tillhandahålls i befintligt skick och revideras utan avisering. Varje värde bär referensår och hämtdatum.',
};

// Disambiguering som måste följa med N07926 överallt där talet visas.
const NOT_44_46 =
  'Förväxla inte med Ledtidsindex 46 månader: det är ett riksgenomsnitt från planuppdrag till laga kraft för flerbostadshusplaner, medan detta är Linköpings mediantid från planuppdrag till antagande. Olika ändpunkt, olika statistik, olika population — att talen ligger nära varandra är en tillfällighet.';

/**
 * Omfattningen på de fyra planmåtten är inte entydigt dokumenterad, och noten
 * ska säga just det i stället för att påstå något åt endera hållet. Kolada
 * formulerar frågan som "de detaljplaner som antogs i kommunen" utan
 * avgränsning, och för N07929 uttryckligen "alla detaljplaner, oavsett
 * förfarande" — medan SKR beskriver undersökningen som gjord med fokus på
 * bostäder. Materialet påstod tidigare att måtten avsåg enbart bostadsplaner;
 * det var en obelagd inskränkning som underskattade måttens relevans.
 */
const NOT_PLANOMFATTNING =
  'Omfattningen är inte entydigt dokumenterad. Kolada formulerar frågan som "de detaljplaner som antogs i kommunen", utan avgränsning till ändamål, medan SKR beskriver undersökningen som gjord med fokus på bostäder. Planer för skola, förskola, LSS och idrott är alltså varken uttryckligen inkluderade eller uteslutna.';

/**
 * Kommunraden och koncernraden mäter samma sak på två nivåer och får aldrig
 * läsas var för sig. Står på båda halvorna av varje par.
 */
const NOT_KONCERNSPEGEL =
  'Kommunkoncernen omfattar de kommunala bolagen, alltså även Lejonfastigheter. Kommunraden och koncernraden ska läsas tillsammans — beståndet ligger i bolaget, inte i kommunens egen balansräkning.';

// För de mått där Koladas egen beskrivning uttryckligen räknar bostäder.
const NOT_BOSTADSMATT =
  'Måttet räknar bostäder, inte samhällsfastigheter — det framgår av Koladas egen beskrivning.';

/**
 * klass styr både beräkning och presentation:
 *  styrmatt     — riktningen är entydig, avvikelsen får läsas som utfall
 *  kostnadsmatt — riktningen är tvetydig, avvikelsen redovisas utan värdering
 *  kontextmatt  — beskriver förutsättningar, ingen jämförelsevärdering alls
 *
 * percentil: false på absoluta tal, där en percentil bara mäter kommunstorlek.
 */
const KATALOG = [
  // --- Planprocess ---
  { id: 'N07926', kort: 'Mediantid planuppdrag → antagande', grupp: 'planprocess', enhet: 'månader', decimaler: 1, klass: 'styrmatt', riktning: 'lagre_battre', percentil: true, trend: true, liknande: LIKNANDE_OVRIGT, not: `${NOT_PLANOMFATTNING} Publiceras vartannat år; 2025 års värde speglar planer antagna 2023–2025. ${NOT_44_46}` },
  { id: 'N07927', kort: 'Mediantid samrådsstart → antagande', grupp: 'planprocess', enhet: 'månader', decimaler: 1, klass: 'styrmatt', riktning: 'lagre_battre', percentil: true, trend: true, liknande: LIKNANDE_OVRIGT, not: `${NOT_PLANOMFATTNING} Skillnaden mot planuppdrag → antagande visar hur mycket tid som ligger före samråd, alltså i utrednings- och programskedet.` },
  { id: 'U00810', kort: 'Handläggningstid bygglov, median', grupp: 'planprocess', enhet: 'dagar', decimaler: 1, klass: 'styrmatt', riktning: 'lagre_battre', percentil: true, liknande: LIKNANDE_OVRIGT, tangerande: true, not: 'Avser nybyggnad av en- och tvåbostadshus — inte samma ärendetyp som ett skolbygglov, men enda jämförbara måttet på lovhandläggning.' },
  { id: 'N07923', kort: 'Planberedskap, bostäder i gällande detaljplaner', grupp: 'planprocess', enhet: 'antal/1000 inv', decimaler: 1, klass: 'styrmatt', riktning: 'hogre_battre', percentil: true, liknande: LIKNANDE_OVRIGT, tangerande: true, not: 'Avser bostäder. Hög planberedskap för bostäder säger inget direkt om planberedskapen för samhällsfastigheter.' },
  { id: 'N07928', kort: 'Överklagade detaljplaner, senaste två åren', grupp: 'planprocess', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: `Andelen speglar både planernas karaktär och kommunens planeringsmiljö, inte enbart handläggningen. Därför kontextmått och inte styrmått. ${NOT_PLANOMFATTNING}` },
  { id: 'N07924', kort: 'Bostäder planlagda senaste två åren', grupp: 'planprocess', enhet: 'antal/1000 inv', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, tangerande: true, not: 'Volymmått som varierar kraftigt mellan mätperioder.' },
  { id: 'N07925', kort: 'Bostäder med beviljat bygglov senaste två åren', grupp: 'planprocess', enhet: 'antal/1000 inv', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, tangerande: true, not: '' },
  { id: 'N07929', kort: 'Antagna detaljplaner senaste två åren', grupp: 'planprocess', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: LIKNANDE_OVRIGT, not: 'Absolut antal, inte normerat mot kommunstorlek — därför ingen percentil. Koladas beskrivning anger uttryckligen alla detaljplaner där antagandebeslut fattats, oavsett förfarande och ändamål.' },
  { id: 'N07917', kort: 'Färdigställda bostäder, nybyggnad', grupp: 'planprocess', enhet: 'antal/1000 inv', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, tangerande: true, not: '' },
  { id: 'N07906', kort: 'Färdigställda bostäder i flerbostadshus', grupp: 'planprocess', enhet: 'antal/1000 inv', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, tangerande: true, not: '' },
  { id: 'N07001', kort: 'Kostnad fysisk och teknisk planering', grupp: 'planprocess', enhet: 'kr/inv', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Resursinsatsen i planeringen. Läses tillsammans med planledtiden — låg kostnad och lång ledtid är ett resursargument.' },

  // --- Lokalkostnad ---
  { id: 'N15009', kort: 'Lokalkostnad grundskola åk 1–9', grupp: 'lokalkostnad', enhet: 'kr/elev', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G35989', not: 'Hög kostnad kan spegla nyproduktionsandel, standard eller energiprestanda lika gärna som ineffektivt lokalutnyttjande.' },
  { id: 'N15061', kort: 'Lokalkostnad grundskola F–9', grupp: 'lokalkostnad', enhet: 'kr/elev', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G35989', not: 'Vidare avgränsning än åk 1–9 — inkluderar förskoleklass.' },
  { id: 'N15054', kort: 'Lokalkostnad förskoleklass', grupp: 'lokalkostnad', enhet: 'kr/elev', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G35989', not: '' },
  { id: 'N11020', kort: 'Lokalkostnad förskola, netto', grupp: 'lokalkostnad', enhet: 'kr/inskrivet barn', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G85875', not: 'Netto, alltså efter interna intäkter.' },
  { id: 'N11033', kort: 'Lokalkostnad förskola, brutto', grupp: 'lokalkostnad', enhet: 'kr/inskrivet barn', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G85875', not: '' },
  { id: 'N13029', kort: 'Lokalkostnad fritidshem, netto', grupp: 'lokalkostnad', enhet: 'kr/inskrivet barn', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G35989', not: 'Fritidshem delar oftast lokaler med skolan — kostnaden är en fördelning, inte en fristående lokalkostnad.' },
  { id: 'N17008', kort: 'Lokalkostnad gymnasieskola', grupp: 'lokalkostnad', enhet: 'kr/elev', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G36281', not: 'Programmix påverkar kraftigt — yrkesprogram kräver mer specialyta per elev.' },
  { id: 'N18028', kort: 'Lokalkostnad anpassad grundskola', grupp: 'lokalkostnad', enhet: 'kr/elev', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G35989', not: 'Små elevunderlag ger stora utslag mellan kommuner och år.' },
  { id: 'N18035', kort: 'Lokalkostnad anpassad gymnasieskola', grupp: 'lokalkostnad', enhet: 'kr/elev', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G36281', not: 'Små elevunderlag ger stora utslag mellan kommuner och år.' },
  { id: 'N20058', kort: 'Lokalkostnad äldreomsorg, brutto', grupp: 'lokalkostnad', enhet: 'kr/inv 65+', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G176609', not: '' },
  { id: 'N20060', kort: 'Lokalkostnad äldreomsorg, exkl. externa lokalintäkter', grupp: 'lokalkostnad', enhet: 'kr/inv 65+', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G176609', not: 'Normerat mot befolkning 65+, inte mot antal boendeplatser — täckningsgraden påverkar därför måttet.' },
  { id: 'N28033', kort: 'Lokalkostnad LSS, brutto', grupp: 'lokalkostnad', enhet: 'kr/inv', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: 'G39622', not: 'Normerat mot hela befolkningen, inte mot antal insatser — beslutsvolymen påverkar måttet.' },
  { id: 'N45019', kort: 'Kostnad arbetsområden och lokaler', grupp: 'lokalkostnad', enhet: 'kr/inv', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Avser kommunens näringslivslokaler och arbetsområden, inte verksamhetslokaler.' },

  // --- Demografi ---
  { id: 'N01951', kort: 'Invånare totalt', grupp: 'demografi', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: LIKNANDE_OVRIGT, not: '' },
  { id: 'N01926', kort: 'Invånare 1–5 år', grupp: 'demografi', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: LIKNANDE_OVRIGT, not: 'Dimensionerande för förskola.' },
  { id: 'N01953', kort: 'Invånare 6–15 år', grupp: 'demografi', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: LIKNANDE_OVRIGT, not: 'Dimensionerande för grundskola.' },
  { id: 'N01957', kort: 'Invånare 80+', grupp: 'demografi', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: LIKNANDE_OVRIGT, not: 'Dimensionerande för vård- och omsorgsboende.' },
  { id: 'N02907', kort: 'Framskrivning, invånare om 5 år', grupp: 'demografi', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: LIKNANDE_OVRIGT, not: 'SCB:s kommunframskrivning.' },
  { id: 'N02909', kort: 'Framskrivning, invånare 6–15 år om 5 år', grupp: 'demografi', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: LIKNANDE_OVRIGT, not: '' },
  { id: 'N02914', kort: 'Framskrivning, invånare 80+ om 5 år', grupp: 'demografi', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: LIKNANDE_OVRIGT, not: '' },
  { id: 'N02916', kort: 'Framskriven förändring 1–5 år, 5 år', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: '' },
  { id: 'N02917', kort: 'Framskriven förändring 6–15 år, 5 år', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: '' },
  { id: 'N02918', kort: 'Framskriven förändring 16–19 år, 5 år', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: '' },
  { id: 'N02922', kort: 'Framskriven förändring 80+, 5 år', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: '' },
  { id: 'N02881', kort: 'Framskriven förändring 1–5 år, 10 år', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: '' },
  { id: 'N02884', kort: 'Framskriven förändring 6–15 år, 10 år', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Tioårshorisonten motsvarar ledtiden för nybyggnad med ny detaljplan.' },
  { id: 'N02842', kort: 'Framskriven förändring 80+, 10 år', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: '' },
  { id: 'N02014', kort: 'Utfall, förändring 1–5 år senaste året', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Utfall, inte prognos — används för att kalibrera framskrivningarna.' },
  { id: 'N02015', kort: 'Utfall, förändring 6–15 år senaste året', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Utfall, inte prognos.' },
  { id: 'N02017', kort: 'Utfall, förändring 1–5 år senaste 5 åren', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Utfall, inte prognos.' },
  { id: 'N02018', kort: 'Utfall, förändring 6–15 år senaste 5 åren', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Utfall, inte prognos.' },
  { id: 'N02019', kort: 'Utfall, förändring 80+ senaste 5 åren', grupp: 'demografi', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Utfall, inte prognos.' },

  // --- Volym ---
  { id: 'N11730', kort: 'Inskrivna barn i förskola, kommunal regi', grupp: 'volym', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: 'G85875', not: '' },
  { id: 'N11807', kort: 'Inskrivna barn i förskola, hemkommun', grupp: 'volym', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: 'G85875', not: '' },
  { id: 'N11801', kort: 'Barn 1–5 år inskrivna i förskola', grupp: 'volym', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: 'G85875', not: 'Inskrivningsgraden avgör hur många platser en given årskull kräver.' },
  { id: 'N11710', kort: 'Barn i fristående förskola', grupp: 'volym', enhet: '% av inskrivna', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: 'G85875', not: 'Hög andel fristående minskar kommunens eget lokalbehov.' },
  { id: 'N15033', kort: 'Elever per lärare, grundskola åk 1–9', grupp: 'volym', enhet: 'antal', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: 'G35989', not: '' },

  // --- Investeringar och bestånd ---
  { id: 'N03148', kort: 'Investeringsutgifter, kommunen totalt', grupp: 'investering', enhet: 'kr/inv', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: `Avser kommunens egna investeringar. ${NOT_KONCERNSPEGEL}` },
  { id: 'N03132', kort: 'Nettoinvesteringar, kommunen totalt', grupp: 'investering', enhet: 'kr/inv', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Investeringsutgifter minus investeringsinkomster.' },
  { id: 'N03104', kort: 'Nettoinvesteringar, andel av skatt och statsbidrag', grupp: 'investering', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Investeringstakt satt i relation till kommunens intäkter.' },
  { id: 'N03103', kort: 'Självfinansieringsgrad för investeringar', grupp: 'investering', enhet: '%', decimaler: 1, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Andel av investeringarna som finansieras utan nyupplåning. Linköpings budget har ett krav på 50 procent egenfinansiering. Hög självfinansiering kan också betyda att investeringstakten är låg — därför kontextmått.' },
  { id: 'N03041', kort: 'Materiella anläggningstillgångar, kommunen', grupp: 'investering', enhet: 'kr/inv', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: `Kommunens eget bestånd. ${NOT_KONCERNSPEGEL}` },
  { id: 'N03051', kort: 'Materiella anläggningstillgångar, kommunkoncernen', grupp: 'investering', enhet: 'kr/inv', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Inklusive de kommunala bolagen. Läs tillsammans med kommunraden ovan — skillnaden är bolagens bestånd.' },
  { id: 'N03012', kort: 'Avskrivningar, kommunen', grupp: 'investering', enhet: 'kr/inv', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: `Redovisas som negativt tal i Kolada. ${NOT_KONCERNSPEGEL}` },
  { id: 'N03063', kort: 'Avskrivningar, kommunkoncernen', grupp: 'investering', enhet: 'kr/inv', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Redovisas som negativt tal i Kolada. Inklusive bolagen — spegling av koncernens fastighetsbestånd.' },

  // --- Lokalbestånd och kapacitet ---
  { id: 'U09717', kort: 'Idrottshallar, samtliga', grupp: 'bestand', enhet: 'antal/10 000 inv', decimaler: 2, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Behovet styrs av demografi, geografi och föreningsliv — fler hallar är inte automatiskt bättre.' },
  { id: 'U09898', kort: 'Idrottshallar per ung invånare', grupp: 'bestand', enhet: 'antal/1000 inv 7–20 år', decimaler: 2, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Normerat mot den åldersgrupp som använder hallarna mest.' },
  { id: 'U09843', kort: 'Idrottshall 18x36–22x42 m', grupp: 'bestand', enhet: 'antal/10 000 inv', decimaler: 2, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Normalstor hall.' },
  { id: 'U09864', kort: 'Idrottshall 22x42 m eller större', grupp: 'bestand', enhet: 'antal/10 000 inv', decimaler: 2, klass: 'kontextmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Fullstor hall, den storlek som krävs för matchspel i flera serier.' },
  { id: 'U09708', kort: 'Idrottshallar, antal', grupp: 'bestand', enhet: 'antal', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: LIKNANDE_OVRIGT, not: 'Absolut antal, inte normerat mot kommunstorlek — därför ingen percentil.' },
  { id: 'N09026', kort: 'Nettokostnad bibliotek', grupp: 'bestand', enhet: 'kr/inv', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'Hela biblioteksverksamheten, inte enbart lokalkostnaden.' },

  // --- Energi och media per kvadratmeter ---
  { id: 'N45901', kort: 'Fjärrvärmepris, typfastighet', grupp: 'energi', enhet: 'kr/kvm', decimaler: 1, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, tangerande: true, not: 'Nils Holgersson-modellen prissätter en standardiserad typfastighet — ett flerbostadshus om 15 lägenheter, inte en skola. Enda kr/kvm som finns på kommunnivå, men jämförelsen är indikativ.' },
  { id: 'N45900', kort: 'Elpris, typfastighet', grupp: 'energi', enhet: 'kr/kvm', decimaler: 1, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, tangerande: true, not: 'Nils Holgersson-modellen prissätter en standardiserad typfastighet — ett flerbostadshus om 15 lägenheter, inte en skola. Enda kr/kvm som finns på kommunnivå, men jämförelsen är indikativ.' },
  { id: 'N45924', kort: 'Vatten och avlopp, typfastighet', grupp: 'energi', enhet: 'kr/kvm', decimaler: 1, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, tangerande: true, not: 'Nils Holgersson-modellen prissätter en standardiserad typfastighet — ett flerbostadshus om 15 lägenheter, inte en skola. Enda kr/kvm som finns på kommunnivå, men jämförelsen är indikativ.' },
  { id: 'N45953', kort: 'Avfallshämtning, typfastighet', grupp: 'energi', enhet: 'kr/kvm', decimaler: 1, klass: 'kostnadsmatt', riktning: 'ingen', percentil: true, liknande: LIKNANDE_OVRIGT, tangerande: true, not: 'Nils Holgersson-modellen prissätter en standardiserad typfastighet — ett flerbostadshus om 15 lägenheter, inte en skola. Enda kr/kvm som finns på kommunnivå, men jämförelsen är indikativ.' },

  // --- Förvaltningskvalitet ---
  { id: 'N00609', kort: 'Skötsel av kommunens verksamhetsbyggnader fungerar bra', grupp: 'forvaltningskvalitet', enhet: '% som instämmer', decimaler: 1, klass: 'styrmatt', riktning: 'hogre_battre', percentil: true, liknande: LIKNANDE_OVRIGT, not: 'SCB:s medborgarundersökning. Det enda måttet i materialet som värderar förvaltningsuppdraget i sig och inte dess kostnad. Urvalsundersökning — enskilda års utfall bär osäkerhet.' },

  // --- Regionens fastigheter (kommunmotsvarighet saknas i Kolada) ---
  { id: 'U60800', kort: 'Area egna lokaler', grupp: 'region-fastighet', enhet: 'kvm BRA', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: null, not: '' },
  { id: 'U60802', kort: 'Area egna lokaler per invånare', grupp: 'region-fastighet', enhet: 'kvm BRA/inv', decimaler: 2, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: null, not: '' },
  { id: 'U60803', kort: 'Vakansgrad egna lokaler', grupp: 'region-fastighet', enhet: '%', decimaler: 1, klass: 'styrmatt', riktning: 'lagre_battre', percentil: false, liknande: null, not: '' },
  { id: 'U60045', kort: 'Drift, underhåll och kapitalkostnad', grupp: 'region-fastighet', enhet: 'kr/kvm BRA', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: false, liknande: null, not: '' },
  { id: 'U60042', kort: 'Driftkostnad lokaler', grupp: 'region-fastighet', enhet: 'kr/kvm BRA', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: false, liknande: null, not: '' },
  { id: 'U60009', kort: 'Planerat underhåll', grupp: 'region-fastighet', enhet: 'kr/kvm BRA', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: false, liknande: null, not: 'Lågt planerat underhåll är inte ett gott resultat — det bygger underhållsskuld.' },
  { id: 'U60013', kort: 'Kapitalkostnad lokaler', grupp: 'region-fastighet', enhet: 'kr/kvm BRA', decimaler: 0, klass: 'kostnadsmatt', riktning: 'ingen', percentil: false, liknande: null, not: '' },
  { id: 'U60032', kort: 'Snitt bokfört värde egna lokaler', grupp: 'region-fastighet', enhet: 'kr/kvm BRA', decimaler: 0, klass: 'kontextmatt', riktning: 'ingen', percentil: false, liknande: null, not: '' },
  { id: 'U60495', kort: 'Energianvändning verksamhetslokaler', grupp: 'region-fastighet', enhet: 'kWh/kvm BRA', decimaler: 0, klass: 'styrmatt', riktning: 'lagre_battre', percentil: false, liknande: null, not: '' },
];

// ---------------------------------------------------------------- beräkningar

function avrunda(v, decimaler = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  return Number(v.toFixed(decimaler));
}

/**
 * Plockar ut Koladas egen källangivelse ur beskrivningsfältet. Källan varierar
 * per mått, inte per grupp: planprocessgruppen har fyra olika källor och ingen
 * av dem är Boverket, vilket materialet tidigare påstod. Att läsa den ur
 * beskrivningen i stället för att skriva den för hand gör attributionen till
 * Koladas uppgift och inte vår.
 */
function koladaKalla(beskrivning) {
  const m = /Källa[:\s]+(.+?)(?:\.\s|\.$|$)/s.exec(beskrivning || '');
  return m ? m[1].trim().replace(/\s+/g, ' ') : null;
}

function formatSv(v, decimaler = 0) {
  if (v === null || v === undefined) return '–';
  return v.toLocaleString('sv-SE', { minimumFractionDigits: decimaler, maximumFractionDigits: decimaler });
}

/** Plockar totalvärdet ur en rad. Kön ligger i ogaranterad ordning — aldrig values[0]. */
function totalvarde(rad) {
  const t = (rad.values || []).find(v => v.gender === 'T');
  if (!t) return null;
  return t.value === undefined || t.value === null ? null : t.value;
}

function median(varden) {
  if (!varden.length) return null;
  const s = [...varden].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function kvartil(sorterade, andel) {
  if (!sorterade.length) return null;
  const i = Math.min(sorterade.length - 1, Math.floor(andel * sorterade.length));
  return sorterade[i];
}

/** Åtta sammanfattande tal i stället för hela kommunfördelningen. */
function fordelning(varden, decimaler = 1) {
  if (!varden.length) return null;
  const s = [...varden].sort((a, b) => a - b);
  return {
    n: s.length,
    min: avrunda(s[0], decimaler),
    p10: avrunda(kvartil(s, 0.1), decimaler),
    p25: avrunda(kvartil(s, 0.25), decimaler),
    median: avrunda(median(s), decimaler),
    p75: avrunda(kvartil(s, 0.75), decimaler),
    p90: avrunda(kvartil(s, 0.9), decimaler),
    max: avrunda(s[s.length - 1], decimaler),
  };
}

/** Andel kommuner med lägre värde, 0–100. */
function percentilFor(varden, varde) {
  if (!varden.length || varde === null || varde === undefined) return null;
  return Math.round((varden.filter(v => v < varde).length / varden.length) * 100);
}

/**
 * Nämnaren är referensens BELOPP, inte dess tecken. Avskrivningar redovisas som
 * negativa tal i Kolada, och med referensen i nämnaren skulle tecknet invertera:
 * Linköpings −1 962 mot referensens −4 118 är ett högre värde men gav −52,4 %.
 * Med beloppet i nämnaren blir det +52,4 %, vilket stämmer med talen i raden.
 * För positiva referenser är formlerna identiska.
 */
function avvikelse(varde, referens) {
  if (varde === null || referens === null || referens === undefined || referens === 0) return null;
  return avrunda(((varde - referens) / Math.abs(referens)) * 100, 1);
}

/**
 * Grönt eller rött får aldrig förekomma på ett kostnadsmått eller kontextmått —
 * riktningen är inte entydig där, och en färg vore ett betyg vi inte kan belägga.
 */
function avvikelseStil(matt, avv) {
  if (avv === null || avv === undefined) return { text: '–', ton: 'neutral' };
  const text = `${avv > 0 ? '+' : '−'}${formatSv(Math.abs(avv), 1)} %`;
  if (matt.klass !== 'styrmatt') return { text, ton: 'neutral' };
  const battre = matt.riktning === 'lagre_battre' ? avv < 0 : avv > 0;
  return { text, ton: battre ? 'bra' : 'daligt' };
}

// -------------------------------------------------------------------- hämtning

/** Hämtar en sökväg och följer next_url, som sätts när svaret kapas vid 5 000 rader. */
async function hamta(sokvag) {
  let url = sokvag.startsWith('http') ? sokvag : BAS + sokvag;
  const rader = [];
  for (let sida = 0; url; sida += 1) {
    if (sida > 40) {
      const err = new Error(`Fler än 40 sidor för ${sokvag} — avbryter.`);
      err.code = 'KOLADA_SIDOR';
      throw err;
    }
    const svar = await fetch(url);
    if (!svar.ok) {
      const err = new Error(`Kolada svarade ${svar.status} på ${url}`);
      err.code = 'KOLADA_HTTP';
      throw err;
    }
    const json = await svar.json();
    rader.push(...(json.values || []));
    url = json.next_url || null;
  }
  return rader;
}

/**
 * Trunkering ska bli ett hårt fel, inte tyst databortfall. Ett anrop med nio
 * nyckeltal kapades vid 5 000 rader och tappade sju av dem utan felmeddelande.
 */
function kravTackning(rader, kpiIdn, sokvag) {
  const funna = new Set(rader.map(r => r.kpi));
  const saknade = kpiIdn.filter(id => !funna.has(id));
  if (saknade.length) {
    const err = new Error(`Inga rader för ${saknade.join(', ')} från ${sokvag} — sannolikt trunkering.`);
    err.code = 'KOLADA_TACKNING';
    throw err;
  }
}

/** { kpi: { entitet: { år: värde } } }, avrundat enligt katalogen. */
function tillSerier(rader, decimalerFor) {
  const ut = {};
  for (const rad of rader) {
    const v = totalvarde(rad);
    if (v === null || rad.period < FRAN_AR) continue;
    ut[rad.kpi] ||= {};
    ut[rad.kpi][rad.municipality] ||= {};
    ut[rad.kpi][rad.municipality][rad.period] = avrunda(v, decimalerFor(rad.kpi));
  }
  return ut;
}

/** Kommunvärden ur ett årsuttag — grupper, regioner och riket räknas bort. */
function kommunvarden(rader, kpi, ar) {
  const ut = [];
  for (const rad of rader) {
    if (rad.kpi !== kpi || rad.period !== ar) continue;
    const m = rad.municipality;
    // Kommunkoder är fyrsiffriga och minst 0114; 0000 är riket och 0001–0025 regioner.
    if (!/^\d{4}$/.test(m) || Number(m) < 100) continue;
    const v = totalvarde(rad);
    if (v !== null) ut.push(v);
  }
  return ut;
}

/** Sorterade år som stigande strängnycklar, för stabil diff. */
function sorteradSerie(serie) {
  const ut = {};
  for (const ar of Object.keys(serie || {}).map(Number).sort((a, b) => a - b)) ut[ar] = serie[ar];
  return ut;
}

/** Senaste år subjektet har ett värde, fallande — kandidater för jämförelseår. */
function kandidatAr(matt, serier) {
  const subjekt = matt.grupp === 'region-fastighet' ? REGION : LINKOPING;
  const egen = (serier[matt.id] || {})[subjekt];
  if (!egen) return [];
  return Object.keys(egen).map(Number).sort((a, b) => b - a);
}

/**
 * Råa värden — enbart det API:t returnerade. Inga härledda tal här.
 *
 * `ar` sätts av anroparen och är inte alltid senaste år: insamlingen för det
 * senaste året kan vara ofullständig. U00810 hade 24 kommuner inrapporterade
 * för 2025 men 103 för 2024, och en percentil över 24 kommuner vore missvisande.
 */
function byggVarden(matt, serier, ar) {
  const perEntitet = serier[matt.id] || {};
  // Region-fastighetsnyckeltalen finns bara för regioner — där är Region
  // Östergötland subjektet, inte Linköping.
  const subjekt = matt.grupp === 'region-fastighet' ? REGION : LINKOPING;
  const egen = perEntitet[subjekt];
  if (!egen || egen[ar] === undefined || egen[ar] === null) return null;

  const ref = (id, saknasText) => {
    if (!id) return { entitet: null, varde: null, saknas: saknasText };
    const v = (perEntitet[id] || {})[ar];
    return v === undefined || v === null
      ? { entitet: id, varde: null, saknas: 'Kolada saknar värde för denna entitet' }
      : { entitet: id, varde: v, saknas: null };
  };

  const ovriga = {};
  for (const id of OVRIGA_REFERENSER) ovriga[id] = ref(id).varde;

  return {
    ar,
    subjekt,
    varde: egen[ar],
    serie: sorteradSerie(egen),
    referenser: {
      liknande: ref(matt.liknande, 'Ingen liknande-grupp definierad för detta nyckeltal'),
      'storre-stad': ref(matt.grupp === 'region-fastighet' ? null : STORRE_STAD, 'Gäller inte regionala nyckeltal'),
      riket: ref(RIKET),
    },
    ovriga,
    // Referensernas tidsserier lagras bara där en trendtabell ska visas —
    // annars växer filen utan att något renderar den.
    ...(matt.trend
      ? {
          referensserier: Object.fromEntries(
            [matt.liknande, STORRE_STAD]
              .filter(id => id && perEntitet[id])
              .map(id => [id, sorteradSerie(perEntitet[id])]),
          ),
        }
      : {}),
  };
}

/** Härledda tal — får enligt licensvillkoret inte tillskrivas Kolada. */
function byggBearbetat(matt, varden, kommunfordelning) {
  if (!varden) return null;
  const d = matt.decimaler;
  const fd = kommunfordelning && kommunfordelning.length ? fordelning(kommunfordelning, d) : null;
  const ar = Object.keys(varden.serie).map(Number).sort((a, b) => a - b);
  const forsta = ar[0];

  return {
    fordelning: fd,
    percentil: fd ? percentilFor(kommunfordelning, varden.varde) : null,
    avvikelse: {
      liknande: avvikelse(varden.varde, varden.referenser.liknande.varde),
      'storre-stad': avvikelse(varden.varde, varden.referenser['storre-stad'].varde),
      riket: avvikelse(varden.varde, varden.referenser.riket.varde),
      kommunmedian: fd ? avvikelse(varden.varde, fd.median) : null,
    },
    forandring:
      ar.length > 1
        ? { fran_ar: forsta, till_ar: varden.ar, procent: avvikelse(varden.varde, varden.serie[forsta]) }
        : null,
  };
}


module.exports = {
  BAS,
  FRAN_AR,
  LINKOPING,
  REGION,
  RIKET,
  STORRE_STAD,
  OVRIGA_REFERENSER,
  ENTITETER,
  ENHETER,
  REFERENSGRUPPER,
  GRUPPER,
  KATALOG,
  KLASSER,
  RIKTNINGAR,
  VILLKOR,
  avrunda,
  formatSv,
  koladaKalla,
  totalvarde,
  median,
  fordelning,
  percentilFor,
  avvikelse,
  avvikelseStil,
  hamta,
  kravTackning,
  tillSerier,
  kommunvarden,
  sorteradSerie,
  kandidatAr,
  byggVarden,
  byggBearbetat,
  MIN_KOMMUNER,
};
