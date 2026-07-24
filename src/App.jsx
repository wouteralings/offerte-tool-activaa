import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  FileText,
  Settings as SettingsIcon,
  Users,
  ClipboardList,
  Printer,
  Shield,
  Loader2,
  LogOut,
  Plus,
  Minus,
  Euro,
  RotateCcw,
  Layers,
  Trash2,
  PlusCircle,
  PenLine,
  BookOpen,
  ImageUp,
  Milestone,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mockdata — staat straks voor echte Dynamics 365-data (accounts, contacten,
// producten uit de Product Catalog / Price List).
// ---------------------------------------------------------------------------

const MOCK_USER = {
  naam: "Jasper de Vries",
  email: "jasper.devries@onzefirma.nl",
  rol: "Account Manager",
  initialen: "JV",
};

const MOCK_KLANTEN = [
  {
    id: "acc-1041",
    naam: "Van Rijn Bouwgroep B.V.",
    plaats: "Utrecht",
    contact: "M. van Rijn",
    email: "m.vanrijn@vanrijnbouw.nl",
    segment: "Bouw & Infra",
  },
  {
    id: "acc-2093",
    naam: "Noordzee Logistiek",
    plaats: "Rotterdam",
    contact: "S. Kramer",
    email: "s.kramer@noordzeelog.nl",
    segment: "Transport",
  },
  {
    id: "acc-3187",
    naam: "Heldergroen Zorginstellingen",
    plaats: "Amersfoort",
    contact: "F. Bakker",
    email: "f.bakker@heldergroen.nl",
    segment: "Zorg",
  },
  {
    id: "acc-4402",
    naam: "Studio Molenwerf",
    plaats: "Haarlem",
    contact: "T. de Boer",
    email: "t.deboer@molenwerf.studio",
    segment: "Creatief",
  },
  {
    id: "acc-5510",
    naam: "Kastermans Financieel Advies",
    plaats: "Eindhoven",
    contact: "R. Kastermans",
    email: "r.kastermans@kastermans.nl",
    segment: "Financieel",
  },
];

const CATEGORIE_LABELS = {
  eenmalig: "Eenmalige werkzaamheden",
  doorlopend: "Doorlopende dienstverlening",
};

let volgnr = 1;
function nieuwId(prefix) {
  volgnr += 1;
  return `${prefix}-${Date.now().toString(36)}-${volgnr}`;
}

const STANDAARD_VOORWAARDEN_TEKST = `Artikel 1. Definities

1. De met hoofdletters aangegeven definities hebben in het kader van deze algemene voorwaarden de volgende betekenis:
a. Bescheiden: alle door Opdrachtgever aan Opdrachtnemer ter beschikking gestelde informatie of gegevens, al dan niet vervat op (on)stoffelijke dragers en al dan niet ondergebracht bij derden, alsmede alle in het kader van de uitvoering van de Opdracht/Overeenkomst door Opdrachtnemer vervaardigde of verzamelde gegevens, al dan niet vervat op (on)stoffelijke dragers en al dan niet ondergebracht bij derden, alsmede alle overige informatie van enige relevantie voor de uitvoering of voltooiing van de Opdracht.
b. Medewerker: een natuurlijke persoon werkzaam bij of verbonden aan de Opdrachtnemer al dan niet op grond van een arbeidsovereenkomst.
c. Opdracht/Overeenkomst: de overeenkomst van opdracht, waarbij Opdrachtnemer zich jegens Opdrachtgever verbindt om bepaalde Werkzaamheden te verrichten.
d. Opdrachtgever: de natuurlijke persoon of de rechtspersoon die aan Opdrachtnemer de opdracht heeft gegeven tot het verrichten van Werkzaamheden.
e. Opdrachtnemer: de besloten vennootschap Activaa BV, statutair en feitelijk gevestigd te IJsselstein (KvK-nummer: 58201718) en/of aan haar gelieerde vennootschappen.
f. Werkzaamheden: alle door Opdrachtnemer ten behoeve van Opdrachtgever uit te voeren Werkzaamheden waartoe Opdracht is gegeven en die door Opdrachtnemer zijn aanvaard, alsmede alle daaruit voor Opdrachtnemer voortvloeiende Werkzaamheden.
2. Alle Opdrachten worden uitsluitend aanvaard en uitgevoerd door het kantoor, niet door of vanwege een individuele Medewerker, ongeacht of Opdrachtgever de Opdracht uitdrukkelijk of stilzwijgend heeft verleend met het oog op uitvoering hiervan door een bepaalde Medewerker of bepaalde Medewerkers. De artikelen 7:404, 7:407 lid 2 en 7:409 BW worden uitdrukkelijk van toepassing uitgesloten.
3. Opdrachtgever zal eventuele vorderings- of verhaalsrechten uitsluitend uitoefenen tegen Opdrachtnemer en niet tegen bestuurders, aandeelhouders, Medewerkers of door Opdrachtnemer ingeschakelde derden c.q. hulppersonen.

Artikel 2. Toepasselijkheid

1. Deze algemene voorwaarden zijn van toepassing op: alle aanbiedingen, offertes, Opdrachten, rechtsbetrekkingen en overeenkomsten, hoe ook genaamd, waarbij Opdrachtnemer zich verbindt/zal verbinden om Werkzaamheden te verrichten voor Opdrachtgever, alsmede op alle daaruit voor Opdrachtnemer voortvloeiende Werkzaamheden.
2. Afwijkingen van, en aanvullingen op, deze algemene voorwaarden zijn slechts geldig indien deze uitdrukkelijk en schriftelijk zijn overeengekomen, bijvoorbeeld in een (schriftelijke) overeenkomst of opdrachtbevestiging.
3. Indien enige voorwaarde in deze algemene voorwaarden en in de opdrachtbevestiging onderling tegenstrijdig zijn, geldt de in de opdrachtbevestiging opgenomen voorwaarde voor wat betreft de tegenstrijdigheid.
4. De toepasselijkheid van de algemene voorwaarden van Opdrachtgever wordt door Opdrachtnemer uitdrukkelijk van de hand gewezen.
5. Deze algemene voorwaarden gelden ook voor eventuele aanvullende of vervolgopdrachten.
6. Op deze algemene voorwaarden kunnen zich ook die natuurlijke en rechtspersonen beroepen die direct of indirect, al dan niet op grond van een arbeidsovereenkomst, bij de dienstverlening aan Opdrachtgever door of vanwege Opdrachtnemer zijn betrokken.

Artikel 3. Totstandkoming & uitvoering opdracht

1. De Opdracht komt tot stand (i) op het moment dat de opdrachtbevestiging door Opdrachtnemer en Opdrachtgever is ondertekend en deze door Opdrachtnemer retour is ontvangen, (ii) indien geen opdrachtbevestiging wordt toegestuurd, op het moment waarop een door Opdrachtnemer gedaan aanbod door Opdrachtgever uitdrukkelijk mondeling of schriftelijk en ongewijzigd is aanvaard, en (iii) indien de door Opdrachtgever verstrekte opdracht niet is voorafgegaan door een aanbod van Opdrachtnemer, op het moment waarop Opdrachtnemer met de uitvoering van de Opdracht een aanvang heeft gemaakt. De Overeenkomst is gebaseerd op de voorafgaand aan de totstandkoming van de Overeenkomst door Opdrachtgever aan Opdrachtnemer verstrekte Bescheiden.
2. Indien de Opdracht mondeling is verstrekt, dan wel indien de Overeenkomst (nog) niet getekend retour is ontvangen, wordt de Opdracht geacht tot stand te zijn gekomen onder toepasselijkheid van deze algemene voorwaarden op het moment dat Opdrachtnemer op verzoek van Opdrachtgever met de uitvoering van de Opdracht is gestart.
3. Het staat partijen vrij te bewijzen dat de Overeenkomst op een andere wijze tot stand is gekomen.
4. Opdrachtnemer bepaalt de wijze waarop de Opdracht wordt uitgevoerd en door welke Medewerker(s).
5. Opdrachtnemer heeft het recht om Werkzaamheden te laten verrichten door een door Opdrachtnemer aan te wijzen derde.
6. De uitvoering van verstrekte opdrachten door Opdrachtnemer geschiedt uitsluitend ten behoeve van Opdrachtgever. Derden kunnen aan de uitvoering van de voor Opdrachtgever verrichte werkzaamheden geen enkel recht ontlenen. Opdrachtnemer voert de Opdracht uit naar beste kunnen en met inachtneming van de toepasselijke wet- en regelgeving.

Artikel 4. Gegevens opdrachtgever

1. Opdrachtgever is gehouden om alle Bescheiden welke Opdrachtnemer naar zijn oordeel nodig heeft voor het correct uitvoeren van de verleende Opdracht, in de gewenste vorm, op de gewenste wijze en tijdig ter beschikking van Opdrachtnemer te stellen. Opdrachtnemer bepaalt wat onder gewenste vorm, gewenste wijze en tijdig dient te worden verstaan.
2. Opdrachtgever staat in voor de juistheid, volledigheid en betrouwbaarheid van de door hem verstrekte Bescheiden, ook indien deze van derden afkomstig zijn, voor zover uit de aard van de Opdracht niet anders voortvloeit.
3. Opdrachtnemer heeft het recht om de uitvoering van de Opdracht op te schorten tot het moment dat Opdrachtgever aan de in het eerste en tweede lid genoemde verplichtingen heeft voldaan.
4. Opdrachtgever vrijwaart Opdrachtnemer voor schade die het gevolg is van onjuiste of onvolledige Bescheiden.
5. Voor rekening en risico van Opdrachtgever zijn de door Opdrachtnemer gemaakte extra kosten en extra uren, alsmede de overige schade voor Opdrachtnemer, vanwege het niet, niet tijdig of niet behoorlijk verschaffen door Opdrachtgever van voor de uitvoering van de Werkzaamheden noodzakelijke Bescheiden.
6. Opdrachtnemer heeft het recht om de uitvoering van de Opdracht op te schorten tot het moment dat Opdrachtgever aan de in het eerste lid genoemde verplichtingen heeft voldaan.
7. Op eerste verzoek van Opdrachtgever zal Opdrachtnemer de originele, door Opdrachtgever verstrekte, Bescheiden aan Opdrachtgever retourneren.

Artikel 5. Regelgeving

1. Opdrachtgever verleent telkens en volledig medewerking aan de verplichtingen die voor Opdrachtnemer voortvloeien uit de toepasselijke regelgeving.
2. Opdrachtgever is ermee bekend dat Opdrachtnemer in sommige gevallen op basis van (inter)nationale wet- of regelgeving verplicht wordt tot openbaarmaking van vertrouwelijke informatie van Opdrachtgever. Voor zover nodig, geeft Opdrachtgever hierbij haar toestemming en medewerking aan dergelijke openbaarmaking, waaronder (maar niet uitsluitend) in de gevallen dat Opdrachtnemer:
a. in wet- en regelgeving omschreven en tijdens de uitvoering van zijn Werkzaamheden bekend geworden transacties dient te melden aan de daarvoor van overheidswege ingestelde autoriteiten;
b. op grond van geldende wet- en regelgeving in bepaalde situaties een fraudemelding zal moeten doen;
c. krachtens geldende wet- en regelgeving verplicht kan zijn om een onderzoek naar de (identiteit van) Opdrachtgever c.q. de cliënt te doen.
3. Opdrachtnemer sluit iedere aansprakelijkheid uit voor schade die ontstaat bij Opdrachtgever ten gevolge van het voldoen door Opdrachtnemer aan de voor hem geldende wet- en regelgeving.

Artikel 6. Intellectuele eigendom

1. Het uitvoeren van de Opdracht door Opdrachtnemer houdt niet in de overdracht van intellectuele eigendomsrechten die bij Opdrachtnemer rusten. Alle intellectuele eigendomsrechten die ontstaan tijdens, of voortvloeien uit, de uitvoering van de Opdracht behoren toe aan Opdrachtnemer.
2. Het is Opdrachtgever uitdrukkelijk verboden om de producten waarin intellectuele eigendomsrechten van Opdrachtnemer zijn vervat, dan wel producten waarop intellectuele eigendomsrechten rusten met betrekking tot het gebruik waarvan Opdrachtnemer gebruiksrechten heeft verworven — waaronder in dit verband in elk geval, maar niet uitsluitend, begrepen: computerprogramma's, systeemontwerpen, werkwijzen, adviezen, (model)contracten, rapportages, templates, macro's en andere geestesproducten — te verveelvoudigen, te openbaren of te exploiteren.
3. Het is Opdrachtgever niet toegestaan om de in het tweede lid genoemde producten zonder voorafgaande schriftelijke toestemming van Opdrachtnemer aan derden ter hand te stellen, anders dan ter verkrijging van een deskundig oordeel omtrent de uitvoering van de Werkzaamheden door Opdrachtnemer. Opdrachtgever zal in dat geval zijn verplichtingen op grond van dit artikel opleggen aan de door hem ingeschakelde derden.

Artikel 7. Overmacht

1. Indien partijen de verplichtingen uit de overeenkomst niet, niet tijdig of niet behoorlijk kunnen nakomen ten gevolge van overmacht in de zin van art. 6:75 BW, dan worden die verplichtingen opgeschort tot op het moment dat partijen alsnog in staat zijn deze op de overeengekomen wijze na te komen.
2. In geval de situatie als bedoeld in het eerste lid zich voordoet, hebben partijen het recht om de overeenkomst geheel of gedeeltelijk en met onmiddellijke ingang schriftelijk op te zeggen, overigens zonder dat recht op enige schadevergoeding bestaat.
3. Indien Opdrachtnemer bij het intreden van de overmachtssituatie al gedeeltelijk aan de overeengekomen verplichtingen heeft voldaan, is Opdrachtnemer gerechtigd de verrichte Werkzaamheden afzonderlijk en tussentijds te factureren en dient Opdrachtgever deze factuur te voldoen alsof het een afzonderlijke transactie betrof.

Artikel 8. Honorarium en kosten

1. De door Opdrachtnemer uitgevoerde Werkzaamheden worden op basis van bestede tijd en gemaakte kosten aan Opdrachtgever in rekening gebracht. Betaling van het honorarium is niet afhankelijk van het resultaat van de Werkzaamheden, tenzij anders overeengekomen. Reistijd en verblijfskosten worden apart in rekening gebracht.
2. Naast het honorarium worden de door Opdrachtnemer gemaakte onkosten en de declaraties van door Opdrachtnemer ingeschakelde derden aan Opdrachtgever in rekening gebracht.
3. Opdrachtnemer heeft het recht om een voorschot te vragen aan Opdrachtgever. Het niet (tijdig) betalen van het voorschot kan een reden zijn voor Opdrachtnemer om de Werkzaamheden (tijdelijk) op te schorten.
4. Indien na de totstandkoming van de Overeenkomst, doch voordat de Opdracht geheel is uitgevoerd, honoraria of prijzen een wijziging ondergaan, is Opdrachtnemer gerechtigd het overeengekomen tarief dienovereenkomstig aan te passen.
5. Over alle door Opdrachtgever aan Opdrachtnemer verschuldigde bedragen wordt, indien de wet daartoe verplicht, de omzetbelasting afzonderlijk in rekening gebracht.

Artikel 9. Betaling

1. Betaling door Opdrachtgever van de aan Opdrachtnemer verschuldigde bedragen dient, zonder dat Opdrachtgever recht heeft op enige aftrek, korting of verrekening, te geschieden binnen 30 dagen na de factuurdatum, tenzij anders overeengekomen. De dag van betaling is de dag van bijschrijving van het verschuldigde op de rekening van Opdrachtnemer.
2. Indien Opdrachtgever niet binnen de in het eerste lid genoemde termijn heeft betaald, is Opdrachtgever van rechtswege in verzuim en is Opdrachtnemer gerechtigd om vanaf dat moment de wettelijke (handels)rente in rekening te brengen.
3. Indien Opdrachtgever niet binnen de in het eerste lid genoemde termijn heeft betaald, is Opdrachtgever gehouden tot vergoeding van alle door Opdrachtnemer gemaakte gerechtelijke en buitengerechtelijke (incasso)kosten. De vergoeding van de gemaakte kosten beperkt zich niet tot de eventueel door de rechter vastgestelde kostenveroordeling.
4. In geval van een gezamenlijk gegeven Opdracht zijn Opdrachtgevers hoofdelijk aansprakelijk voor de betaling van het factuurbedrag en de verschuldigde rente(n) en kosten.
5. Indien de financiële positie of het betalingsgedrag van Opdrachtgever naar het oordeel van Opdrachtnemer daartoe aanleiding geeft, dan wel indien Opdrachtgever nalaat een voorschot dan wel een declaratie binnen de daarvoor gestelde betalingstermijn te voldoen, is Opdrachtnemer gerechtigd van Opdrachtgever te verlangen dat deze onverwijld (aanvullende) zekerheid stelt in een door Opdrachtnemer te bepalen vorm. Indien Opdrachtgever nalaat de verlangde zekerheid te stellen, is Opdrachtnemer gerechtigd, onverminderd zijn overige rechten, de verdere uitvoering van de overeenkomst onmiddellijk op te schorten, en is al hetgeen Opdrachtgever aan Opdrachtnemer uit welke hoofde ook verschuldigd is, direct opeisbaar.

Artikel 10. Termijnen

1. Indien tussen Opdrachtgever en Opdrachtnemer een termijn/datum is afgesproken waarbinnen de Opdracht dient te worden uitgevoerd en Opdrachtgever verzuimt om (a) een vooruitbetaling te voldoen — indien overeengekomen — of (b) de noodzakelijke Bescheiden tijdig, volledig, in de gewenste vorm en op de gewenste wijze ter beschikking te stellen, dan treden Opdrachtgever en Opdrachtnemer in overleg over een nieuwe termijn/datum waarbinnen de Opdracht dient te worden uitgevoerd.
2. Termijnen waarbinnen de Werkzaamheden dienen te zijn afgerond, zijn slechts te beschouwen als een fatale termijn indien dit uitdrukkelijk en met zoveel woorden tussen Opdrachtgever en Opdrachtnemer is overeengekomen.

Artikel 11. Aansprakelijkheid en vrijwaringen

1. Opdrachtnemer is niet aansprakelijk voor schade van Opdrachtgever die ontstaat doordat Opdrachtgever aan Opdrachtnemer onjuiste of onvolledige Bescheiden heeft verstrekt.
2. Opdrachtnemer is niet aansprakelijk voor enige gevolgschade, bedrijfsschade of indirecte schade die het gevolg is van het niet, niet tijdig of niet deugdelijk presteren door Opdrachtnemer.
3. De contractuele en buitencontractuele aansprakelijkheid van Opdrachtnemer voor schade, voortvloeiend uit of verband houdend met de uitvoering van de Opdracht en eventuele tekortkomingen daarbij, is beperkt tot het bedrag dat in het desbetreffende geval zal worden uitgekeerd door de door Opdrachtnemer gesloten beroepsaansprakelijkheidsverzekering, vermeerderd met het eigen risico van Opdrachtnemer op grond van de polisvoorwaarden van deze beroepsaansprakelijkheidsverzekering. Indien, om welke reden dan ook, de aansprakelijkheidsverzekeraar niet tot uitkering overgaat, is de aansprakelijkheid van Opdrachtnemer beperkt tot het bedrag van het voor de uitvoering van de Opdracht in rekening gebrachte honorarium. Indien de Opdracht een duurovereenkomst betreft met een looptijd van meer dan een jaar, dan wordt het hiervoor bedoelde bedrag gesteld op één maal het bedrag van het honorarium dat in de twaalf maanden voorafgaand aan het ontstaan van de schade in rekening is gebracht aan Opdrachtgever.
4. Een samenhangende serie van toerekenbare tekortkomingen geldt als één (1) toerekenbare tekortkoming.
5. De in dit artikel opgenomen beperkingen van aansprakelijkheid zijn niet van toepassing indien en voor zover sprake is van opzet of bewuste roekeloosheid van Opdrachtnemer of haar leidinggevend management.
6. Opdrachtgever is gehouden om schade beperkende maatregelen te nemen. Opdrachtnemer heeft het recht om de schade ongedaan te maken of te beperken door herstel of verbetering van de uitgevoerde Werkzaamheden.
7. Opdrachtgever vrijwaart Opdrachtnemer voor vorderingen van derden wegens schade die is veroorzaakt doordat Opdrachtgever aan Opdrachtnemer geen, onjuiste of onvolledige Bescheiden heeft verstrekt.
8. Opdrachtgever vrijwaart Opdrachtnemer voor aanspraken van derden (Medewerkers van Opdrachtnemer en door Opdrachtnemer ingeschakelde derden daaronder begrepen) die in verband met de uitvoering van de Opdracht schade lijden welke het gevolg is van het handelen of nalaten van Opdrachtgever of van onveilige situaties in diens bedrijf of organisatie.
9. Het bepaalde in dit artikel heeft zowel betrekking op de contractuele als de buitencontractuele aansprakelijkheid (onrechtmatige daad) van Opdrachtnemer jegens Opdrachtgever.

Artikel 12. Opzegging

1. Opdrachtgever en Opdrachtnemer kunnen te allen tijde (tussentijds) de overeenkomst opzeggen zonder inachtneming van een opzegtermijn. Indien de overeenkomst eindigt voordat de Opdracht is voltooid, is Opdrachtgever het honorarium verschuldigd overeenkomstig de door Opdrachtnemer opgegeven uren voor Werkzaamheden die ten behoeve van Opdrachtgever zijn verricht.
2. Opzegging dient schriftelijk te geschieden.
3. Indien tot (tussentijdse) opzegging is overgegaan door Opdrachtgever, heeft Opdrachtnemer recht op vergoeding van het aan zijn zijde ontstane en aannemelijk te maken bezettingsverlies, alsmede op vergoeding van additionele kosten die Opdrachtnemer reeds heeft gemaakt en kosten die voortvloeien uit eventuele annulering van ingeschakelde derden (zoals — onder meer — eventuele kosten met betrekking tot onderaanneming).
4. Indien tot (tussentijdse) opzegging is overgegaan door Opdrachtnemer, heeft Opdrachtgever recht op medewerking van Opdrachtnemer bij overdracht van Werkzaamheden aan derden, tenzij er sprake is van opzet of bewuste roekeloosheid aan de zijde van Opdrachtgever waardoor Opdrachtnemer zich genoodzaakt ziet tot opzegging over te gaan. Voorwaarde voor het recht op medewerking als in dit lid bepaald, is dat Opdrachtgever alle onderliggende openstaande voorschotten dan wel alle declaraties heeft voldaan.

Artikel 13. Opschortingsrecht

1. Opdrachtnemer is bevoegd om, na een zorgvuldige belangenafweging, de nakoming van al zijn verplichtingen op te schorten — waaronder begrepen de afgifte van Bescheiden of andere zaken aan Opdrachtgever of derden — tot op het moment dat alle opeisbare vorderingen op Opdrachtgever volledig zijn voldaan.
2. Het eerste lid is niet van toepassing met betrekking tot Bescheiden van Opdrachtgever die (nog) geen bewerking door Opdrachtnemer hebben ondergaan.

Artikel 14. Vervaltermijn

Voor zover in deze algemene voorwaarden niet anders is bepaald, vervallen vorderingsrechten en andere bevoegdheden van Opdrachtgever uit welke hoofde ook jegens Opdrachtnemer in verband met het verrichten van Werkzaamheden door Opdrachtnemer, in ieder geval na één jaar na het moment waarop Opdrachtgever bekend werd of redelijkerwijs bekend kon zijn met het bestaan van deze rechten en bevoegdheden. Deze termijn betreft niet de mogelijkheid om een klacht in te dienen bij de daartoe aangewezen instantie(s) voor de klachtbehandeling en/of de Raad voor Geschillen.

Artikel 15. Elektronische communicatie

1. Tijdens de uitvoering van de Opdracht kunnen Opdrachtgever en Opdrachtnemer op verzoek van Opdrachtgever door middel van elektronische middelen met elkaar communiceren.
2. Opdrachtgever en Opdrachtnemer zijn jegens elkaar niet aansprakelijk voor schade die eventueel voortvloeit bij één of ieder van hen ten gevolge van het gebruik van elektronische middelen van communicatie, waaronder — maar niet beperkt tot — schade ten gevolge van niet-aflevering of vertraging bij de aflevering van elektronische communicatie, onderschepping of manipulatie van elektronische communicatie door derden of door programmatuur/apparatuur gebruikt voor verzending, ontvangst of verwerking van elektronische communicatie, overbrenging van virussen en het niet of niet goed functioneren van het telecommunicatienetwerk of andere voor elektronische communicatie benodigde middelen, behoudens voor zover de schade het gevolg is van opzet of grove schuld.
3. Zowel Opdrachtgever als Opdrachtnemer zullen al hetgeen redelijkerwijs van ieder van hen verwacht mag worden doen of nalaten ter voorkoming van het optreden van voornoemde risico's.
4. De data-uittreksels uit de computersystemen van verzender leveren dwingend bewijs op van (de inhoud van) de door verzender verzonden elektronische communicatie, tot het moment dat tegenbewijs is geleverd door de ontvanger.

Artikel 16. Overige bepalingen

1. Indien Opdrachtnemer op locatie van Opdrachtgever Werkzaamheden verricht, draagt Opdrachtgever zorg voor een geschikte werkplek, die voldoet aan de wettelijk gestelde Arbonormen en aan andere toepasselijke regelgeving met betrekking tot arbeidsomstandigheden. Opdrachtgever dient er voor zorg te dragen dat Opdrachtnemer in dat geval wordt voorzien van kantoorruimte en overige faciliteiten die naar het oordeel van Opdrachtnemer noodzakelijk of nuttig zijn om de Overeenkomst uit te voeren en die voldoen aan alle daaraan te stellen (wettelijke) vereisten. Met betrekking tot beschikbaar gestelde (computer)faciliteiten is Opdrachtgever verplicht voor continuïteit zorg te dragen, onder meer door middel van afdoende back-up-, veiligheids- en viruscontroleprocedures. Opdrachtnemer zal viruscontroleprocedures toepassen wanneer Opdrachtnemer van de faciliteiten van Opdrachtgever gebruikmaakt.
2. Opdrachtgever zal geen bij de uitvoering van de Werkzaamheden betrokken Medewerkers aannemen of benaderen om bij Opdrachtgever, al dan niet tijdelijk, direct of indirect in dienst te treden, dan wel direct of indirect ten behoeve van Opdrachtgever, al dan niet in loondienst, werkzaamheden te verrichten, gedurende de looptijd van de Overeenkomst of enige verlenging daarvan en gedurende de 12 maanden daarna.

Artikel 17. Toepasselijk recht en forumkeuze

1. De Overeenkomst wordt beheerst door Nederlands recht.
2. Alle geschillen zullen worden beslecht door de bevoegde rechter in het arrondissement waarin Opdrachtnemer is gevestigd.

Artikel 18. Reparatieclausule nietigheden

1. Indien enige bepaling uit deze algemene voorwaarden of uit de onderliggende Opdracht/Overeenkomst geheel of ten dele nietig en/of niet geldig en/of niet afdwingbaar mocht zijn, dit ten gevolge van enig wettelijk voorschrift, rechterlijke uitspraak dan wel anderszins, dan zal dit geen enkel gevolg hebben voor de geldigheid van alle andere bepalingen van deze algemene voorwaarden of de onderliggende Opdracht/Overeenkomst.
2. Indien een bepaling van deze algemene voorwaarden of de onderliggende Opdracht/Overeenkomst niet geldig mocht zijn om een reden als bedoeld in het vorige lid, maar wel geldig zou zijn indien deze een beperktere omvang of strekking zou hebben, dan zal deze bepaling automatisch gelden met de meest verstrekkende of omvangrijkste beperktere omvang of strekking waarmee of waarin zij wel geldig is.
3. Onverminderd het bepaalde in lid 2 kunnen partijen desgewenst in overleg treden teneinde nieuwe bepalingen ter vervanging van de nietige c.q. vernietigde bepalingen overeen te komen. Daarbij zal zoveel mogelijk aangesloten worden bij het doel en de strekking van de nietige c.q. vernietigde bepalingen.`;

const STANDAARD_ROADMAP = {
  titel: "90 dagen roadmap: Kennismaking → Inrichting → Borging",
  fases: [
    {
      id: "fase-1",
      markering: "W1",
      label: "WEEK 1 · KENNISMAKING",
      titel: "We leren uw organisatie en administratie kennen",
      puntenTekst:
        "Kick-off gesprek: scope, aanspreekpunten, planning\nInventarisatie van bestaande systemen en administratie\nEerste proces volledig in kaart gebracht",
      resultaatLabel: "RESULTAAT",
      resultaatTekst: "Plan van aanpak staat + nulmeting ligt vast",
    },
    {
      id: "fase-2",
      markering: "W2",
      label: "WEEK 2 · INVENTARISATIE",
      titel: "Weten wat er nodig is om goed van start te gaan",
      puntenTekst:
        "Overzicht van de huidige situatie, inclusief aandachtspunten\nPer onderdeel: wat kan direct, wat vraagt meer tijd\nPrioriteiten bepalen op basis van impact",
      resultaatLabel: "RESULTAAT",
      resultaatTekst: "Inrichtingsplan met heldere prioriteiten",
    },
    {
      id: "fase-3",
      markering: "30",
      label: "DAG 30 · EERSTE RESULTAAT",
      titel: "Eerste onderdeel staat en draait",
      puntenTekst:
        "Ingericht op basis van het plan van aanpak\nU ziet het resultaat en denkt mee waar nodig\nOplevering met korte toelichting",
      resultaatLabel: "DOEL DAG 30",
      resultaatTekst: "Eerste onderdeel bewezen en werkend",
    },
    {
      id: "fase-4",
      markering: "60",
      label: "DAG 60 · OPSCHALEN",
      titel: "Van eerste onderdeel naar volledige administratie",
      puntenTekst:
        "Resterende onderdelen gefaseerd ingericht\nWerkwijze verder afgestemd op uw organisatie\nEerste voortgangsrapportage",
      resultaatLabel: "DOEL DAG 60",
      resultaatTekst: "Volledig operationeel + eerste rapportage",
    },
    {
      id: "fase-5",
      markering: "90",
      label: "DAG 90 · BORGING",
      titel: "Vast ritme en meetbaar resultaat",
      puntenTekst:
        "Resultaat gemeten ten opzichte van de nulmeting\nVaste rapportagemomenten afgesproken\nVervolgpunten en aandachtsgebieden besproken",
      resultaatLabel: "DOEL DAG 90",
      resultaatTekst: "Vast ritme en heldere afspraken voor de lange termijn",
    },
  ],
};

const INITIAL_CATALOGUS = [
  {
    id: "svc-impl",
    categorie: "eenmalig",
    naam: "Implementatie & inrichting",
    eenheid: "traject",
    varianten: [
      { id: "v1", naam: "Klein", prijs: 750 },
      { id: "v2", naam: "Middel", prijs: 1250 },
      { id: "v3", naam: "Groot", prijs: 2000 },
    ],
  },
  {
    id: "svc-migratie",
    categorie: "eenmalig",
    naam: "Data-migratie",
    eenheid: "traject",
    varianten: [
      { id: "v1", naam: "Klein", prijs: 900 },
      { id: "v2", naam: "Middel", prijs: 1500 },
      { id: "v3", naam: "Groot", prijs: 2200 },
    ],
  },
  {
    id: "svc-training",
    categorie: "eenmalig",
    naam: "Training en uitleg systemen",
    eenheid: "dagdeel",
    varianten: [{ id: "v1", naam: "", prijs: 500 }],
  },
  {
    id: "svc-onderhoud",
    categorie: "doorlopend",
    naam: "Onderhoud & support administratie",
    eenheid: "maand",
    varianten: [
      { id: "v1", naam: "0-50 facturen", prijs: 125 },
      { id: "v2", naam: "51-100 facturen", prijs: 175 },
      { id: "v3", naam: "101-200 facturen", prijs: 250 },
      { id: "v4", naam: "201-300 facturen", prijs: 300 },
      { id: "v5", naam: "301-400 facturen", prijs: 400 },
      { id: "v6", naam: "401-500 facturen", prijs: 450 },
      { id: "v7", naam: "500+ facturen", prijs: null },
    ],
  },
  {
    id: "svc-jaarrekening",
    categorie: "doorlopend",
    naam: "Samenstellen jaarrekening, publicatiestukken en notulen",
    eenheid: "jaar",
    varianten: [
      { id: "v1", naam: "Klein", prijs: 999 },
      { id: "v2", naam: "Middel", prijs: 1499 },
      { id: "v3", naam: "Groot", prijs: 2249 },
    ],
  },
  {
    id: "svc-vpb",
    categorie: "doorlopend",
    naam: "Aangifte vennootschapsbelasting",
    eenheid: "aangifte",
    varianten: [{ id: "v1", naam: "", prijs: 399 }],
  },
  {
    id: "svc-ib",
    categorie: "doorlopend",
    naam: "Aangifte inkomstenbelasting",
    eenheid: "aangifte",
    varianten: [{ id: "v1", naam: "", prijs: 399 }],
  },
];

const STAPPEN = [
  { key: "login", label: "Aanmelden", icon: Shield },
  { key: "instellingen", label: "Afzender", icon: SettingsIcon },
  { key: "klant", label: "Klant", icon: Users },
  { key: "diensten", label: "Diensten kiezen", icon: ClipboardList },
  { key: "prijzen", label: "Prijzen", icon: Euro },
  { key: "bijlage", label: "Bijlage", icon: PenLine },
  { key: "offerte", label: "Offerte", icon: FileText },
];

function currency(n) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function klantAdresRegels(klant) {
  const nummerDeel = `${klant.huisnummer || ""}${klant.huisnummertoevoeging || ""}`.trim();
  const straatRegel = [klant.straat, nummerDeel].filter(Boolean).join(" ");
  const plaatsRegel = [klant.postcode, klant.plaats].filter(Boolean).join(" ");
  return [straatRegel, plaatsRegel].filter(Boolean);
}

// ---------------------------------------------------------------------------
// Opslaghulp: gebruikt window.storage zolang die beschikbaar is (bijv. hier in
// Claude), en valt anders automatisch terug op de eigen Azure Function
// (/api/instellingen) — zo werkt hetzelfde bestand zowel hier als live op Azure.
// ---------------------------------------------------------------------------
async function opslagGet(sleutel) {
  if (typeof window !== "undefined" && window.storage) {
    try {
      const resultaat = await window.storage.get(sleutel, false);
      return resultaat?.value;
    } catch (e) {
      return undefined;
    }
  }
  try {
    const res = await fetch(`/api/instellingen/${encodeURIComponent(sleutel)}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.value;
  } catch (e) {
    return undefined;
  }
}

async function opslagSet(sleutel, waarde) {
  if (typeof window !== "undefined" && window.storage) {
    try {
      await window.storage.set(sleutel, waarde, false);
    } catch (e) {
      console.error("Opslaan mislukt:", e); // wijziging blijft wel zichtbaar voor deze sessie
    }
    return;
  }
  try {
    const res = await fetch(`/api/instellingen/${encodeURIComponent(sleutel)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: waarde }),
    });
    if (!res.ok) {
      const foutdata = await res.json().catch(() => null);
      console.error("Opslaan mislukt:", foutdata?.detail || foutdata?.error || `HTTP ${res.status}`);
    }
  } catch (e) {
    console.error("Opslaan mislukt:", e); // wijziging blijft wel zichtbaar voor deze sessie
  }
}

async function opslagDelete(sleutel) {
  if (typeof window !== "undefined" && window.storage) {
    try {
      await window.storage.delete(sleutel, false);
    } catch (e) {
      // niets opgeslagen om te verwijderen
    }
    return;
  }
  try {
    await fetch(`/api/instellingen/${encodeURIComponent(sleutel)}`, { method: "DELETE" });
  } catch (e) {
    // niets opgeslagen om te verwijderen
  }
}

function genereerStandaardLogo(bedrijfsnaam) {
  const initialen = (bedrijfsnaam || "OF")
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0] || ""))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "OF";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
    <rect width='200' height='200' rx='30' fill='#1C5D8C'/>
    <circle cx='158' cy='46' r='10' fill='#B98237'/>
    <text x='96' y='134' font-family='Georgia, serif' font-size='92' font-weight='600' fill='#F5F6F4' text-anchor='middle'>${initialen}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function OffertetoolApp() {
  const [stap, setStap] = useState("login");
  const [terugNaarStap, setTerugNaarStap] = useState("instellingen");
  const [ingelogd, setIngelogd] = useState(false);
  const [bezigMetInloggen, setBezigMetInloggen] = useState(false);

  // Echte ingelogde gebruiker ophalen bij Azure Static Web Apps (werkt alleen op de live site,
  // niet in lokale ontwikkeling — daar valt de tool terug op de gesimuleerde inlogknop).
  const [echteGebruiker, setEchteGebruiker] = useState(null);
  const [authGecontroleerd, setAuthGecontroleerd] = useState(false);

  useEffect(() => {
    let actief = true;
    fetch("/.auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!actief) return;
        const principal = data?.clientPrincipal;
        if (principal?.userDetails) {
          // userDetails is bij Microsoft-login meestal het e-mailadres/UPN. De echte
          // weergavenaam zit (indien beschikbaar) tussen de losse "claims" van het account.
          const naamClaim = principal.claims?.find(
            (c) =>
              c.typ === "name" ||
              c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" ||
              c.typ?.endsWith("/claims/name")
          );
          const naam = naamClaim?.val || principal.userDetails;
          const emailClaim = principal.claims?.find(
            (c) => c.typ === "preferred_username" || c.typ?.endsWith("/emailaddress")
          );
          const email = emailClaim?.val || principal.userDetails;
          setEchteGebruiker({
            naam,
            email,
            rol: "Ingelogd via Microsoft",
            initialen: naam
              .split(/[.\s@]/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join(""),
          });
          setIngelogd(true);
          setStap((huidige) => (huidige === "login" ? "instellingen" : huidige));
        }
      })
      .catch(() => {
        // /.auth/me bestaat niet (bijv. lokale ontwikkeling) — dan blijft de gesimuleerde login werken
      })
      .finally(() => {
        if (actief) setAuthGecontroleerd(true);
      });
    return () => {
      actief = false;
    };
  }, []);

  const huidigeGebruiker = echteGebruiker || MOCK_USER;

  const [afzender, setAfzender] = useState({
    bedrijf: "Onze Firma B.V.",
    adres: "Handelskade 12",
    postcode: "3011 CV",
    plaats: "Rotterdam",
    kvk: "84120933",
    ondertekenaar: MOCK_USER.naam,
    geldigheid: "30",
    inleiding:
      "Hartelijk dank voor uw interesse. Hieronder vindt u onze offerte, samengesteld op basis van het besproken traject.",
  });
  const [afzenderGeladen, setAfzenderGeladen] = useState(false);

  // Afzendergegevens laden uit persistente opslag.
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("afzender");
        if (actief && waarde) {
          setAfzender(JSON.parse(waarde));
        }
      } catch (e) {
        // nog geen afzendergegevens opgeslagen, of opslag niet beschikbaar
      }
      if (actief) setAfzenderGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  // Afzendergegevens bewaren zodra er iets in wijzigt (pas nadat de eerste keer geladen is).
  useEffect(() => {
    if (!afzenderGeladen) return;
    (async () => {
      try {
        await opslagSet("afzender", JSON.stringify(afzender));
      } catch (e) {
        console.error("Opslaan mislukt:", e); // wijzigingen blijven wel zichtbaar voor deze sessie
      }
    })();
  }, [afzender, afzenderGeladen]);

  // "Ondertekenaar" (Namens) en het bijbehorende e-mailadres volgen automatisch de echt
  // ingelogde Microsoft-gebruiker — bij elke login opnieuw, zodat elke collega (van de 10)
  // gewoon zichzelf ziet staan zonder dat iemand dit handmatig hoeft in te stellen.
  useEffect(() => {
    if (echteGebruiker && afzenderGeladen) {
      setAfzender((prev) => ({
        ...prev,
        ondertekenaar: echteGebruiker.naam,
        ondertekenaarEmail: echteGebruiker.email,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echteGebruiker, afzenderGeladen]);

  const [logo, setLogo] = useState(null); // base64/SVG data-URL van het logo, of null zolang het nog laadt
  const [logoGeladen, setLogoGeladen] = useState(false);

  // Logo laden uit persistente opslag; anders eenmalig een standaardlogo genereren en opslaan.
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("logo");
        if (actief && waarde) {
          setLogo(waarde);
          setLogoGeladen(true);
          return;
        }
      } catch (e) {
        // nog geen logo opgeslagen, of opslag niet beschikbaar — dan vullen we de standaard in
      }
      if (!actief) return;
      const standaard = genereerStandaardLogo(afzender.bedrijf);
      setLogo(standaard);
      setLogoGeladen(true);
      try {
        await opslagSet("logo", standaard);
      } catch (e) {
        console.error("Opslaan mislukt:", e); // logo blijft wel zichtbaar voor deze sessie
      }
    })();
    return () => {
      actief = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logoUploaden(bestand) {
    if (!bestand) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setLogo(dataUrl);
      try {
        await opslagSet("logo", dataUrl);
      } catch (err) {
        console.error("Opslaan mislukt:", err); // logo blijft wel zichtbaar voor deze sessie
      }
    };
    reader.readAsDataURL(bestand);
  }

  async function logoVerwijderen() {
    setLogo(null);
    try {
      await opslagDelete("logo");
    } catch (e) {
      // niets opgeslagen om te verwijderen
    }
  }

  const [dienstenCatalogus, setDienstenCatalogus] = useState(INITIAL_CATALOGUS);
  const [catalogusGeladen, setCatalogusGeladen] = useState(false);

  const [zoekKlant, setZoekKlant] = useState("");
  const [gekozenKlanten, setGekozenKlanten] = useState([]); // array van klant-objecten

  // geselecteerd: { [dienstId]: { aantal } }
  const [geselecteerd, setGeselecteerd] = useState({});
  // klantVarianten: "klantId::dienstId" -> gekozen variantId (per klant instelbaar, bijv. Klein/Middel/Groot)
  const [klantVarianten, setKlantVarianten] = useState({});
  // aangepastePrijzen: "klantId::dienstId" -> handmatige prijs (string of number)
  const [aangepastePrijzen, setAangepastePrijzen] = useState({});
  // uitgeschakeldVoorKlant: "klantId::dienstId" -> true als deze dienst voor déze klant uitstaat,
  // terwijl hij voor andere klanten wel meegenomen wordt
  const [uitgeschakeldVoorKlant, setUitgeschakeldVoorKlant] = useState({});
  // bijlageToelichtingen: "dienstId" -> vrije tekst voor de gezamenlijke bijlage
  const [bijlageToelichtingen, setBijlageToelichtingen] = useState({});
  // algemeneToelichting: vrije tekst die los van een specifieke dienst in de bijlage komt
  const [algemeneToelichting, setAlgemeneToelichting] = useState("");
  // klantToelichtingen: "klantId" -> klantspecifieke tekst, komt op de offerte van díe klant
  const [klantToelichtingen, setKlantToelichtingen] = useState({});
  const [bijlageGeladen, setBijlageGeladen] = useState(false);

  // Bijlage-teksten (algemeen, per dienst, per klant) laden uit persistente opslag.
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const [algemeenWaarde, perDienstWaarde, perKlantWaarde] = await Promise.all([
          opslagGet("bijlage-algemeen"),
          opslagGet("bijlage-per-dienst"),
          opslagGet("bijlage-per-klant"),
        ]);
        if (actief) {
          if (algemeenWaarde) setAlgemeneToelichting(algemeenWaarde);
          if (perDienstWaarde) setBijlageToelichtingen(JSON.parse(perDienstWaarde));
          if (perKlantWaarde) setKlantToelichtingen(JSON.parse(perKlantWaarde));
        }
      } catch (e) {
        // nog niets opgeslagen, of opslag niet beschikbaar
      }
      if (actief) setBijlageGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  // Bijlage-teksten bewaren zodra er iets in wijzigt (pas nadat de eerste keer geladen is).
  useEffect(() => {
    if (!bijlageGeladen) return;
    (async () => {
      try {
        await opslagSet("bijlage-algemeen", algemeneToelichting);
      } catch (e) {}
    })();
  }, [algemeneToelichting, bijlageGeladen]);

  useEffect(() => {
    if (!bijlageGeladen) return;
    (async () => {
      try {
        await opslagSet("bijlage-per-dienst", JSON.stringify(bijlageToelichtingen));
      } catch (e) {}
    })();
  }, [bijlageToelichtingen, bijlageGeladen]);

  useEffect(() => {
    if (!bijlageGeladen) return;
    (async () => {
      try {
        await opslagSet("bijlage-per-klant", JSON.stringify(klantToelichtingen));
      } catch (e) {}
    })();
  }, [klantToelichtingen, bijlageGeladen]);

  // standaardTeksten: herbruikbare standaardteksten, net als de dienstencatalogus zelf te beheren
  const [standaardTeksten, setStandaardTeksten] = useState({
    algemeen: "",
    perDienst: {}, // { [dienstId]: tekst }
  });
  const [tekstenGeladen, setTekstenGeladen] = useState(false);

  // algemeneVoorwaarden: los te beheren, komt als extra pagina('s) mee in dezelfde afdruk/PDF
  const [algemeneVoorwaarden, setAlgemeneVoorwaarden] = useState({
    titel: "Algemene Voorwaarden",
    tekst: STANDAARD_VOORWAARDEN_TEKST,
  });
  const [voorwaardenGeladen, setVoorwaardenGeladen] = useState(false);

  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("algemenevoorwaarden");
        if (actief && waarde) {
          setAlgemeneVoorwaarden(JSON.parse(waarde));
        }
      } catch (e) {
        // nog geen eigen voorwaarden opgeslagen — dan blijft de standaardtekst staan
      }
      if (actief) setVoorwaardenGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  useEffect(() => {
    if (!voorwaardenGeladen) return;
    (async () => {
      try {
        await opslagSet("algemenevoorwaarden", JSON.stringify(algemeneVoorwaarden));
      } catch (e) {
        console.error("Opslaan mislukt:", e);
      }
    })();
  }, [algemeneVoorwaarden, voorwaardenGeladen]);

  // roadmap: beheerbare, in Azure opgeslagen roadmap (net als de voorwaarden).
  const [roadmap, setRoadmap] = useState(STANDAARD_ROADMAP);
  const [roadmapGeladen, setRoadmapGeladen] = useState(false);
  // roadmapToevoegen: per-offerte aan/uit-schakelaar, geen bewaarde instelling maar een keuze per keer.
  const [roadmapToevoegen, setRoadmapToevoegen] = useState(false);

  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("roadmap");
        if (actief && waarde) {
          setRoadmap(JSON.parse(waarde));
        }
      } catch (e) {
        // nog geen eigen roadmap opgeslagen — dan blijft de standaardroadmap staan
      }
      if (actief) setRoadmapGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  useEffect(() => {
    if (!roadmapGeladen) return;
    (async () => {
      try {
        await opslagSet("roadmap", JSON.stringify(roadmap));
      } catch (e) {
        console.error("Opslaan mislukt:", e);
      }
    })();
  }, [roadmap, roadmapGeladen]);

  function voegFaseToe() {
    setRoadmap((prev) => ({
      ...prev,
      fases: [
        ...prev.fases,
        {
          id: nieuwId("fase"),
          markering: "•",
          label: "NIEUWE FASE",
          titel: "Titel van deze fase",
          puntenTekst: "",
          resultaatLabel: "RESULTAAT",
          resultaatTekst: "",
        },
      ],
    }));
  }
  function verwijderFase(id) {
    setRoadmap((prev) => ({ ...prev, fases: prev.fases.filter((f) => f.id !== id) }));
  }
  function bijwerkFase(id, veld, waarde) {
    setRoadmap((prev) => ({
      ...prev,
      fases: prev.fases.map((f) => (f.id === id ? { ...f, [veld]: waarde } : f)),
    }));
  }

  // Dienstencatalogus laden uit persistente opslag (valt terug op de ingebouwde standaardlijst).
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("dienstencatalogus");
        if (actief && waarde) {
          setDienstenCatalogus(JSON.parse(waarde));
        }
      } catch (e) {
        // nog niets opgeslagen, of opslag niet beschikbaar — dan blijft de standaardcatalogus staan
      }
      if (actief) setCatalogusGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  // Dienstencatalogus bewaren zodra er iets in wijzigt (pas nadat de eerste keer geladen is).
  useEffect(() => {
    if (!catalogusGeladen) return;
    (async () => {
      try {
        await opslagSet("dienstencatalogus", JSON.stringify(dienstenCatalogus));
      } catch (e) {
        console.error("Opslaan mislukt:", e); // wijzigingen blijven wel zichtbaar voor deze sessie
      }
    })();
  }, [dienstenCatalogus, catalogusGeladen]);

  // Standaardteksten laden uit persistente opslag.
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("standaardteksten");
        if (actief && waarde) {
          setStandaardTeksten(JSON.parse(waarde));
        }
      } catch (e) {
        // nog geen standaardteksten opgeslagen, of opslag niet beschikbaar
      }
      if (actief) setTekstenGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  // Standaardteksten bewaren zodra er iets in wijzigt (pas nadat de eerste keer geladen is).
  useEffect(() => {
    if (!tekstenGeladen) return;
    (async () => {
      try {
        await opslagSet("standaardteksten", JSON.stringify(standaardTeksten));
      } catch (e) {
        console.error("Opslaan mislukt:", e); // wijzigingen blijven wel zichtbaar voor deze sessie
      }
    })();
  }, [standaardTeksten, tekstenGeladen]);

  // Klanten ophalen bij de eigen Dynamics-koppeling (Azure Function op /api/klanten).
  // Lukt dit niet (nog niet geconfigureerd, lokale ontwikkeling, of een fout) dan valt
  // de tool terug op de voorbeeldklanten, zodat de tool altijd blijft werken.
  const [klantenBron, setKlantenBron] = useState(MOCK_KLANTEN);
  const [klantenUitDynamics, setKlantenUitDynamics] = useState(false);
  const [klantenFoutmelding, setKlantenFoutmelding] = useState(null);
  const [klantenMeerBeschikbaar, setKlantenMeerBeschikbaar] = useState(false);
  const [klantenLaden, setKlantenLaden] = useState(false);

  async function haalKlantenOp(zoekterm) {
    setKlantenLaden(true);
    try {
      const url = zoekterm ? `/api/klanten?zoek=${encodeURIComponent(zoekterm)}` : "/api/klanten";
      const res = await fetch(url);
      if (!res.ok) {
        const foutdata = await res.json().catch(() => null);
        throw new Error(foutdata?.detail || foutdata?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setKlantenMeerBeschikbaar(data.length > 10);
        setKlantenBron(data.slice(0, 10));
        setKlantenUitDynamics(true);
        setKlantenFoutmelding(null);
      }
    } catch (err) {
      // API niet bereikbaar (bijv. lokale ontwikkeling) geeft een generieke fetch-fout —
      // dat tonen we niet als "fout", want dat is normaal. Een fout mét inhoud (vanuit
      // onze eigen Azure Function) tonen we wél, want die is nuttig om te debuggen.
      if (err.message && err.message !== "Failed to fetch") {
        setKlantenFoutmelding(err.message);
      }
    } finally {
      setKlantenLaden(false);
    }
  }

  // Eerste keer laden: standaardlijst (alfabetisch, eerste 10).
  useEffect(() => {
    haalKlantenOp("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bij elke wijziging in het zoekveld: de zoekopdracht bij Dynamics zelf uitvoeren
  // (server-side), zodat álle klanten vindbaar zijn — niet alleen een vooraf geladen setje.
  // Een korte pauze (debounce) voorkomt dat elke toetsaanslag meteen een aanroep doet.
  useEffect(() => {
    if (!klantenUitDynamics) return; // nog geen live koppeling; dan lokaal filteren op voorbeelddata
    const timer = setTimeout(() => {
      haalKlantenOp(zoekKlant.trim());
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoekKlant, klantenUitDynamics]);

  const gefilterdeKlanten = useMemo(() => {
    if (klantenUitDynamics) return klantenBron; // al server-side gefilterd en beperkt
    const q = zoekKlant.trim().toLowerCase();
    if (!q) return klantenBron;
    return klantenBron.filter(
      (k) =>
        k.naam.toLowerCase().includes(q) ||
        (k.plaats || "").toLowerCase().includes(q) ||
        (k.segment || "").toLowerCase().includes(q)
    );
  }, [zoekKlant, klantenBron, klantenUitDynamics]);

  const heeftMeerResultaten = klantenUitDynamics ? klantenMeerBeschikbaar : gefilterdeKlanten.length > 10;

  function dienstById(id) {
    return dienstenCatalogus.find((d) => d.id === id);
  }
  function variantById(dienst, variantId) {
    return dienst?.varianten.find((v) => v.id === variantId);
  }

  const geselecteerdeEntries = useMemo(() => {
    return Object.keys(geselecteerd)
      .map((dienstId) => {
        const dienst = dienstById(dienstId);
        if (!dienst) return null;
        const info = geselecteerd[dienstId];
        return { dienst, aantal: info.aantal || 1 };
      })
      .filter(Boolean);
  }, [geselecteerd, dienstenCatalogus]);

  function toggleDienstSelectie(dienst) {
    setGeselecteerd((prev) => {
      const next = { ...prev };
      if (next[dienst.id]) {
        delete next[dienst.id];
      } else {
        next[dienst.id] = { aantal: 1 };
      }
      return next;
    });
    wisPrijsOverridesVoorDienst(dienst.id);
    wisUitschakelingenVoorDienst(dienst.id);
  }

  function isUitgeschakeldVoorKlant(klantId, dienstId) {
    return !!uitgeschakeldVoorKlant[prijsSleutel(klantId, dienstId)];
  }

  function toggleDienstVoorKlant(klantId, dienstId) {
    setUitgeschakeldVoorKlant((prev) => {
      const key = prijsSleutel(klantId, dienstId);
      return { ...prev, [key]: !prev[key] };
    });
  }

  function wisUitschakelingenVoorDienst(dienstId) {
    setUitgeschakeldVoorKlant((prev) => {
      const next = {};
      Object.entries(prev).forEach(([key, val]) => {
        if (!key.endsWith(`::${dienstId}`)) next[key] = val;
      });
      return next;
    });
  }

  function variantVoorKlant(klantId, dienst) {
    const key = prijsSleutel(klantId, dienst.id);
    const gekozenId = klantVarianten[key];
    return variantById(dienst, gekozenId) || dienst.varianten[0];
  }

  function kiesVariantVoorKlant(klantId, dienstId, variantId) {
    setKlantVarianten((prev) => ({
      ...prev,
      [prijsSleutel(klantId, dienstId)]: variantId,
    }));
    resetPrijs(klantId, dienstId);
  }

  function zetAantal(dienstId, aantal) {
    setGeselecteerd((prev) => ({
      ...prev,
      [dienstId]: { ...prev[dienstId], aantal: Math.max(1, aantal) },
    }));
  }

  function wisPrijsOverridesVoorDienst(dienstId) {
    setAangepastePrijzen((prev) => {
      const next = {};
      Object.entries(prev).forEach(([key, val]) => {
        if (!key.endsWith(`::${dienstId}`)) next[key] = val;
      });
      return next;
    });
  }

  function prijsSleutel(klantId, dienstId) {
    return `${klantId}::${dienstId}`;
  }

  function catalogusPrijsVoor(klantId, dienst) {
    const variant = variantVoorKlant(klantId, dienst);
    if (variant?.prijs === null) return { prijs: 0, opAanvraag: true, opNacalculatie: false, variant };
    if (variant?.prijs === "nacalculatie") return { prijs: 0, opAanvraag: false, opNacalculatie: true, variant };
    return { prijs: variant?.prijs ?? 0, opAanvraag: false, opNacalculatie: false, variant };
  }

  function prijsVoor(klantId, dienst) {
    const key = prijsSleutel(klantId, dienst.id);
    const override = aangepastePrijzen[key];
    const catalogus = catalogusPrijsVoor(klantId, dienst);
    if (override !== undefined && override !== "" && override !== null) {
      return { prijs: Number(override), opAanvraag: false, opNacalculatie: false, variant: catalogus.variant };
    }
    return catalogus;
  }

  function zetPrijs(klantId, dienstId, waarde) {
    setAangepastePrijzen((prev) => ({
      ...prev,
      [prijsSleutel(klantId, dienstId)]: waarde,
    }));
  }

  function resetPrijs(klantId, dienstId) {
    setAangepastePrijzen((prev) => {
      const next = { ...prev };
      delete next[prijsSleutel(klantId, dienstId)];
      return next;
    });
  }

  function regelsVoorKlant(klantId) {
    return geselecteerdeEntries
      .filter(({ dienst }) => !isUitgeschakeldVoorKlant(klantId, dienst.id))
      .map(({ dienst, aantal }) => {
        const { prijs, opAanvraag, opNacalculatie, variant } = prijsVoor(klantId, dienst);
        return {
          id: dienst.id,
          naam: variant?.naam ? `${dienst.naam} — ${variant.naam}` : dienst.naam,
          eenheid: dienst.eenheid,
          categorie: dienst.categorie,
          aantal,
          prijs,
          opAanvraag,
          opNacalculatie,
          subtotaal: opAanvraag || opNacalculatie ? 0 : aantal * prijs,
        };
      });
  }

  const heeftMeerdereVarianten = geselecteerdeEntries.some(({ dienst }) => dienst.varianten.length > 1);

  // ---------------- Catalogusbeheer ----------------
  function voegDienstToe(categorie) {
    setDienstenCatalogus((prev) => [
      ...prev,
      {
        id: nieuwId("svc"),
        categorie,
        naam: "Nieuwe dienst",
        eenheid: "stuk",
        varianten: [{ id: nieuwId("v"), naam: "", prijs: 0 }],
      },
    ]);
  }
  function verwijderDienst(id) {
    setDienstenCatalogus((prev) => prev.filter((d) => d.id !== id));
    setGeselecteerd((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    wisPrijsOverridesVoorDienst(id);
  }
  function bijwerkDienstVeld(id, veld, waarde) {
    setDienstenCatalogus((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [veld]: waarde } : d))
    );
  }
  function voegVariantToe(dienstId) {
    setDienstenCatalogus((prev) =>
      prev.map((d) =>
        d.id === dienstId
          ? { ...d, varianten: [...d.varianten, { id: nieuwId("v"), naam: "", prijs: 0 }] }
          : d
      )
    );
  }
  function verwijderVariant(dienstId, variantId) {
    setDienstenCatalogus((prev) =>
      prev.map((d) =>
        d.id === dienstId
          ? { ...d, varianten: d.varianten.filter((v) => v.id !== variantId) }
          : d
      )
    );
  }
  function bijwerkVariant(dienstId, variantId, veld, waarde) {
    setDienstenCatalogus((prev) =>
      prev.map((d) =>
        d.id === dienstId
          ? {
              ...d,
              varianten: d.varianten.map((v) =>
                v.id === variantId ? { ...v, [veld]: waarde } : v
              ),
            }
          : d
      )
    );
  }

  function toggleKlant(k) {
    setGekozenKlanten((prev) =>
      prev.some((x) => x.id === k.id)
        ? prev.filter((x) => x.id !== k.id)
        : [...prev, k]
    );
  }

  function startLogin() {
    setBezigMetInloggen(true);
    setTimeout(() => {
      setBezigMetInloggen(false);
      setIngelogd(true);
      setStap("instellingen");
    }, 1400);
  }

  function uitloggen() {
    setIngelogd(false);
    setGekozenKlanten([]);
    setGeselecteerd({});
    setKlantVarianten({});
    setAangepastePrijzen({});
    setUitgeschakeldVoorKlant({});
    setStap("login");
  }

  function stapIndex(key) {
    return STAPPEN.findIndex((s) => s.key === key);
  }
  function volgende() {
    const i = stapIndex(stap);
    if (i < STAPPEN.length - 1) setStap(STAPPEN[i + 1].key);
  }
  function vorige() {
    const i = stapIndex(stap);
    if (i > 0) setStap(STAPPEN[i - 1].key);
  }
  const BEHEERSCHERMEN = ["catalogus", "teksten", "voorwaarden", "roadmap"];
  function openCatalogus() {
    if (!BEHEERSCHERMEN.includes(stap)) setTerugNaarStap(stap);
    setStap("catalogus");
  }
  function openTeksten() {
    if (!BEHEERSCHERMEN.includes(stap)) setTerugNaarStap(stap);
    setStap("teksten");
  }
  function openVoorwaarden() {
    if (!BEHEERSCHERMEN.includes(stap)) setTerugNaarStap(stap);
    setStap("voorwaarden");
  }
  function openRoadmap() {
    if (!BEHEERSCHERMEN.includes(stap)) setTerugNaarStap(stap);
    setStap("roadmap");
  }

  function bijwerkStandaardAlgemeen(tekst) {
    setStandaardTeksten((prev) => ({ ...prev, algemeen: tekst }));
  }
  function bijwerkStandaardDienstTekst(dienstId, tekst) {
    setStandaardTeksten((prev) => ({ ...prev, perDienst: { ...prev.perDienst, [dienstId]: tekst } }));
  }

  // Standaardteksten automatisch invullen zodra diensten geselecteerd zijn — werkt ongeacht
  // via welke stap de gebruiker bij de offerte terechtkomt, niet alleen via de Bijlage-stap.
  useEffect(() => {
    if (!tekstenGeladen || !bijlageGeladen) return;
    setBijlageToelichtingen((prev) => {
      let gewijzigd = false;
      const next = { ...prev };
      geselecteerdeEntries.forEach(({ dienst }) => {
        const standaard = standaardTeksten.perDienst[dienst.id];
        if (standaard && (!next[dienst.id] || next[dienst.id].trim() === "")) {
          next[dienst.id] = standaard;
          gewijzigd = true;
        }
      });
      return gewijzigd ? next : prev;
    });
    setAlgemeneToelichting((prev) =>
      prev.trim() === "" && standaardTeksten.algemeen.trim() !== "" ? standaardTeksten.algemeen : prev
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geselecteerdeEntries, standaardTeksten, tekstenGeladen, bijlageGeladen]);

  function naarBijlage() {
    setStap("bijlage");
  }

  function afdrukken() {
    window.print();
  }

  const kanNaarDiensten = gekozenKlanten.length > 0;
  const kanNaarPrijzen = geselecteerdeEntries.length > 0;
  const kanNaarOfferte = geselecteerdeEntries.length > 0;

  return (
    <div
      style={{
        fontFamily:
          "'Source Sans 3', 'Segoe UI', system-ui, -apple-system, sans-serif",
        background: "#F5F6F4",
        color: "#1C2321",
        minHeight: "100%",
      }}
    >
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/fraunces');
        .offertetool-serif { font-family: 'Fraunces', 'Georgia', serif; }
        .ot-card { background:#fff; border:1px solid #E2E4DF; border-radius: 10px; }
        .ot-btn-primary {
          background:#1C5D8C; color:#F5F6F4; border:1px solid #1C5D8C;
          border-radius: 8px; padding: 10px 18px; font-weight:600; font-size:14px;
          display:inline-flex; align-items:center; gap:8px; cursor:pointer;
          transition: background .15s ease;
        }
        .ot-btn-primary:hover:not(:disabled) { background:#123F5E; }
        .ot-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
        .ot-btn-secondary {
          background:#fff; color:#1C5D8C; border:1px solid #C8CDC5;
          border-radius: 8px; padding: 10px 18px; font-weight:600; font-size:14px;
          display:inline-flex; align-items:center; gap:8px; cursor:pointer;
        }
        .ot-btn-secondary:hover { border-color:#1C5D8C; }
        .ot-btn-ghost {
          background:transparent; color:#1C5D8C; border:none; padding:4px 6px;
          font-weight:600; font-size:12.5px; display:inline-flex; align-items:center; gap:5px; cursor:pointer;
        }
        .ot-btn-ghost:hover { text-decoration:underline; }
        .ot-input {
          border:1px solid #C8CDC5; border-radius:8px; padding:9px 12px; font-size:14px;
          width:100%; background:#fff; color:#1C2321;
        }
        .ot-input:focus { outline:2px solid #B98237; outline-offset:1px; }
        .ot-input:disabled { background:#F0F0EC; color:#A5AA9F; }
        .ot-label { font-size:12px; font-weight:600; color:#5B6259; text-transform:uppercase; letter-spacing:.04em; margin-bottom:6px; display:block; }
        .ot-pill {
          border:1.5px solid #C8CDC5; background:#fff; color:#1C2321; border-radius:20px;
          padding:6px 13px; font-size:12.5px; font-weight:600; cursor:pointer;
        }
        .ot-pill.actief { border-color:#1C5D8C; background:#1C5D8C; color:#fff; }
        .ot-cat-koptekst {
          font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em;
          color:#B98237; margin: 26px 0 10px; display:flex; align-items:center; justify-content:space-between;
        }
        .ot-cat-koptekst:first-child { margin-top:0; }
        @media print {
          body * { visibility: hidden; }
          #offerte-print-gebied, #offerte-print-gebied * { visibility: visible; }
          #offerte-print-gebied {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .offerte-doc { break-after: page; page-break-after: always; margin-bottom: 0 !important; }
          .offerte-doc:last-of-type { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      {/* Topbalk */}
      <div style={{ borderBottom: "1px solid #E2E4DF", background: "#FFFFFF" }}>
        <div
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: logo ? "transparent" : "#1C5D8C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {logo ? (
                <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <FileText size={18} color="#F5F6F4" />
              )}
            </div>
            <div>
              <div className="offertetool-serif" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.1 }}>
                Offertetool
              </div>
              <div style={{ fontSize: 11.5, color: "#8A9089" }}>gekoppeld aan Microsoft Dynamics</div>
            </div>
          </div>

          {ingelogd && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{huidigeGebruiker.naam}</div>
                <div style={{ fontSize: 11.5, color: "#8A9089" }}>{huidigeGebruiker.rol}</div>
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#B98237",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {huidigeGebruiker.initialen}
              </div>
              <button
                onClick={uitloggen}
                title="Afmelden"
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#8A9089", display: "flex" }}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stappenbalk */}
      {ingelogd && (
        <div style={{ borderBottom: "1px solid #E2E4DF", background: "#FBFBF9" }}>
          <div
            style={{
              maxWidth: 1040,
              margin: "0 auto",
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {STAPPEN.filter((s) => s.key !== "login").map((s) => {
                const actief = s.key === stap;
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStap(s.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "none",
                      background: actief ? "#1C5D8C" : "transparent",
                      color: actief ? "#fff" : "#1C5D8C",
                      padding: "7px 12px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={14} />
                    {s.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={openCatalogus}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #C8CDC5",
                  background: stap === "catalogus" ? "#1C5D8C" : "#fff",
                  color: stap === "catalogus" ? "#fff" : "#5B6259",
                  padding: "7px 12px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Layers size={14} />
                Diensten beheren
              </button>
              <button
                onClick={openTeksten}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #C8CDC5",
                  background: stap === "teksten" ? "#1C5D8C" : "#fff",
                  color: stap === "teksten" ? "#fff" : "#5B6259",
                  padding: "7px 12px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <BookOpen size={14} />
                Teksten beheren
              </button>
              <button
                onClick={openVoorwaarden}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #C8CDC5",
                  background: stap === "voorwaarden" ? "#1C5D8C" : "#fff",
                  color: stap === "voorwaarden" ? "#fff" : "#5B6259",
                  padding: "7px 12px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <FileText size={14} />
                Voorwaarden beheren
              </button>
              <button
                onClick={openRoadmap}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #C8CDC5",
                  background: stap === "roadmap" ? "#1C5D8C" : "#fff",
                  color: stap === "roadmap" ? "#fff" : "#5B6259",
                  padding: "7px 12px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Milestone size={14} />
                Roadmap beheren
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 24px 60px" }}>
        {/* -------------------- LOGIN -------------------- */}
        {stap === "login" && !authGecontroleerd && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80, color: "#8A9089", fontSize: 13.5 }}>
            Bezig met inloggen controleren…
          </div>
        )}
        {stap === "login" && authGecontroleerd && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
            <div className="ot-card" style={{ width: 420, padding: 36, textAlign: "center" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "#F0EEE6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                }}
              >
                <Building2 size={26} color="#1C5D8C" />
              </div>
              <h1 className="offertetool-serif" style={{ fontSize: 22, marginBottom: 6 }}>
                Welkom bij de offertetool
              </h1>
              <p style={{ fontSize: 13.5, color: "#5B6259", marginBottom: 26, lineHeight: 1.5 }}>
                Meld u aan met uw Microsoft-account. Uw rechten in Dynamics bepalen welke
                klanten en gegevens u kunt ophalen.
              </p>
              <button
                className="ot-btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={startLogin}
                disabled={bezigMetInloggen}
              >
                {bezigMetInloggen ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Rechten controleren…
                  </>
                ) : (
                  <>
                    <MicrosoftLogo />
                    Aanmelden met Microsoft
                  </>
                )}
              </button>
              <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
              <p style={{ fontSize: 11.5, color: "#A5AA9F", marginTop: 18 }}>
                Dit is een demo-omgeving met voorbeelddata. Er wordt geen echte
                Microsoft-verbinding gemaakt.
              </p>
            </div>
          </div>
        )}

        {/* -------------------- INSTELLINGEN / AFZENDER -------------------- */}
        {stap === "instellingen" && (
          <StapWrapper
            titel="Wie schrijven we aan namens?"
            toelichting="Deze gegevens komen op elke offerte te staan. Standaard ingevuld vanuit Activaa CRM - profiel — je kunt ze per offerte aanpassen."
          >
            <div className="ot-card" style={{ padding: 24, display: "grid", gap: 16 }}>
              <div>
                <label className="ot-label">Logo</label>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      border: "1px dashed #C8CDC5",
                      background: "#FBFBF9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {logo ? (
                      <img src={logo} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <Building2 size={24} color="#B4B9AE" />
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label className="ot-btn-secondary" style={{ width: "fit-content", cursor: "pointer" }}>
                      <ImageUp size={15} />
                      {logo ? "Ander logo kiezen" : "Logo kiezen"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => logoUploaden(e.target.files?.[0])}
                        style={{ display: "none" }}
                      />
                    </label>
                    {logo && (
                      <button className="ot-btn-ghost" style={{ width: "fit-content" }} onClick={logoVerwijderen}>
                        Logo verwijderen
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 11.5, color: "#8A9089", marginTop: 8 }}>
                  Verschijnt in de menubalk en op elke offerte. Een PNG met transparante achtergrond werkt het best. Wordt automatisch bewaard, ook na herladen of opnieuw inloggen.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="ot-label">Bedrijfsnaam</label>
                  <input className="ot-input" value={afzender.bedrijf} onChange={(e) => setAfzender({ ...afzender, bedrijf: e.target.value })} />
                </div>
                <div>
                  <label className="ot-label">KvK-nummer</label>
                  <input className="ot-input" value={afzender.kvk} onChange={(e) => setAfzender({ ...afzender, kvk: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="ot-label">Adres (straat en huisnummer)</label>
                <input className="ot-input" value={afzender.adres} onChange={(e) => setAfzender({ ...afzender, adres: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
                <div>
                  <label className="ot-label">Postcode</label>
                  <input className="ot-input" value={afzender.postcode} onChange={(e) => setAfzender({ ...afzender, postcode: e.target.value })} />
                </div>
                <div>
                  <label className="ot-label">Plaats</label>
                  <input className="ot-input" value={afzender.plaats} onChange={(e) => setAfzender({ ...afzender, plaats: e.target.value })} />
                </div>
              </div>
              <div
                style={{
                  padding: "12px 14px",
                  background: "#EAF2F8",
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: "#1C5D8C",
                }}
              >
                <strong>Ondertekenaar (Namens):</strong> {huidigeGebruiker.naam}
                {huidigeGebruiker.email && huidigeGebruiker.email !== huidigeGebruiker.naam
                  ? ` · ${huidigeGebruiker.email}`
                  : ""}
                <div style={{ color: "#5B6259", marginTop: 2 }}>
                  Dit wordt automatisch bepaald aan de hand van wie is ingelogd — elke collega ziet hier zichzelf staan.
                </div>
              </div>
              <div>
                <label className="ot-label">Inleidende tekst op de offerte</label>
                <textarea className="ot-input" rows={3} value={afzender.inleiding} onChange={(e) => setAfzender({ ...afzender, inleiding: e.target.value })} />
              </div>
            </div>

            <div className="ot-card" style={{ padding: 24, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <label className="ot-label" style={{ marginBottom: 2 }}>Geldigheid offerte</label>
                <p style={{ fontSize: 12.5, color: "#8A9089", margin: 0 }}>
                  Aantal dagen dat een offerte geldig is nadat deze is opgesteld.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  className="ot-input"
                  type="number"
                  min="1"
                  style={{ width: 90, textAlign: "right" }}
                  value={afzender.geldigheid}
                  onChange={(e) => setAfzender({ ...afzender, geldigheid: e.target.value })}
                />
                <span style={{ fontSize: 13.5, color: "#5B6259" }}>dagen</span>
              </div>
            </div>
            <StapNavigatie onVolgende={volgende} volgendeLabel="Klant kiezen" />
          </StapWrapper>
        )}

        {/* -------------------- CATALOGUS BEHEREN -------------------- */}
        {stap === "catalogus" && (
          <StapWrapper
            titel="Dienstencatalogus beheren"
            toelichting="Optioneel: onderhoud hier alle eenmalige en doorlopende diensten met hun varianten en prijzen. U hoeft dit niet elke keer te doorlopen — wijzigingen gelden meteen voor nieuwe offertes."
          >
            {["eenmalig", "doorlopend"].map((cat) => (
              <div key={cat}>
                <div className="ot-cat-koptekst">
                  <span>{CATEGORIE_LABELS[cat]}</span>
                  <button className="ot-btn-ghost" onClick={() => voegDienstToe(cat)}>
                    <PlusCircle size={14} />
                    Dienst toevoegen
                  </button>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {dienstenCatalogus
                    .filter((d) => d.categorie === cat)
                    .map((dienst) => (
                      <div key={dienst.id} className="ot-card" style={{ padding: 18 }}>
                        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-end" }}>
                          <div style={{ flex: 2 }}>
                            <label className="ot-label">Dienstnaam</label>
                            <input
                              className="ot-input"
                              value={dienst.naam}
                              onChange={(e) => bijwerkDienstVeld(dienst.id, "naam", e.target.value)}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="ot-label">Eenheid</label>
                            <input
                              className="ot-input"
                              value={dienst.eenheid}
                              onChange={(e) => bijwerkDienstVeld(dienst.id, "eenheid", e.target.value)}
                            />
                          </div>
                          <button
                            onClick={() => verwijderDienst(dienst.id)}
                            title="Dienst verwijderen"
                            style={{ border: "1px solid #E2C4B0", background: "#FBF2EC", color: "#B14A2E", borderRadius: 8, padding: 9, cursor: "pointer", display: "flex" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#8A9089", borderBottom: "1px solid #E2E4DF" }}>Variant / staffel</th>
                              <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#8A9089", borderBottom: "1px solid #E2E4DF", width: 280 }}>Prijs</th>
                              <th style={{ width: 34, borderBottom: "1px solid #E2E4DF" }} />
                            </tr>
                          </thead>
                          <tbody>
                            {dienst.varianten.map((v) => (
                              <tr key={v.id}>
                                <td style={{ padding: "6px 4px" }}>
                                  <input
                                    className="ot-input"
                                    placeholder="(standaard, geen varianten)"
                                    value={v.naam}
                                    onChange={(e) => bijwerkVariant(dienst.id, v.id, "naam", e.target.value)}
                                  />
                                </td>
                                <td style={{ padding: "6px 4px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ position: "relative", flex: 1, minWidth: 110 }}>
                                      <span style={{ position: "absolute", left: 10, top: 10, fontSize: 13, color: "#8A9089" }}>€</span>
                                      <input
                                        className="ot-input"
                                        style={{ paddingLeft: 22 }}
                                        type="number"
                                        step="0.01"
                                        disabled={v.prijs === null || v.prijs === "nacalculatie"}
                                        value={v.prijs === null || v.prijs === "nacalculatie" ? "" : v.prijs}
                                        placeholder={v.prijs === null ? "op aanvraag" : v.prijs === "nacalculatie" ? "nacalculatie" : ""}
                                        onChange={(e) => bijwerkVariant(dienst.id, v.id, "prijs", e.target.value === "" ? 0 : Number(e.target.value))}
                                      />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
                                      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#5B6259", whiteSpace: "nowrap" }}>
                                        <input
                                          type="checkbox"
                                          checked={v.prijs === null}
                                          onChange={(e) => bijwerkVariant(dienst.id, v.id, "prijs", e.target.checked ? null : 0)}
                                          style={{ accentColor: "#1C5D8C" }}
                                        />
                                        op aanvraag
                                      </label>
                                      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#5B6259", whiteSpace: "nowrap" }}>
                                        <input
                                          type="checkbox"
                                          checked={v.prijs === "nacalculatie"}
                                          onChange={(e) => bijwerkVariant(dienst.id, v.id, "prijs", e.target.checked ? "nacalculatie" : 0)}
                                          style={{ accentColor: "#1C5D8C" }}
                                        />
                                        op nacalculatie
                                      </label>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: "6px 4px", textAlign: "center" }}>
                                  {dienst.varianten.length > 1 && (
                                    <button
                                      onClick={() => verwijderVariant(dienst.id, v.id)}
                                      title="Variant verwijderen"
                                      style={{ border: "none", background: "transparent", color: "#B4B9AE", cursor: "pointer", display: "flex" }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button className="ot-btn-ghost" style={{ marginTop: 8 }} onClick={() => voegVariantToe(dienst.id)}>
                          <PlusCircle size={13} />
                          Variant / staffel toevoegen
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 22 }}>
              <button className="ot-btn-secondary" onClick={() => setStap(terugNaarStap)}>
                <ChevronLeft size={15} />
                Terug naar offerte
              </button>
            </div>
          </StapWrapper>
        )}

        {/* -------------------- TEKSTEN BEHEREN -------------------- */}
        {stap === "teksten" && (
          <StapWrapper
            titel="Standaardteksten beheren"
            toelichting="Leg hier standaardteksten vast voor de bijlage, net als bij de dienstencatalogus. Bij een nieuwe offerte worden lege velden automatisch met deze standaardtekst gevuld — u kunt ze per offerte nog altijd aanpassen."
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div className="ot-card" style={{ padding: 18 }}>
                <label className="ot-label">Algemeen</label>
                <textarea
                  className="ot-input"
                  rows={4}
                  placeholder="Standaardtekst voor de algemene toelichting…"
                  value={standaardTeksten.algemeen}
                  onChange={(e) => bijwerkStandaardAlgemeen(e.target.value)}
                />
              </div>

              {["eenmalig", "doorlopend"].map((cat) => (
                <div key={cat}>
                  <div className="ot-cat-koptekst">
                    <span>{CATEGORIE_LABELS[cat]}</span>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {dienstenCatalogus
                      .filter((d) => d.categorie === cat)
                      .map((dienst) => (
                        <div key={dienst.id} className="ot-card" style={{ padding: 18 }}>
                          <label className="ot-label">{dienst.naam}</label>
                          <textarea
                            className="ot-input"
                            rows={3}
                            placeholder={`Standaardtekst bij ${dienst.naam.toLowerCase()}…`}
                            value={standaardTeksten.perDienst[dienst.id] || ""}
                            onChange={(e) => bijwerkStandaardDienstTekst(dienst.id, e.target.value)}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 22 }}>
              <button className="ot-btn-secondary" onClick={() => setStap(terugNaarStap)}>
                <ChevronLeft size={15} />
                Terug naar offerte
              </button>
            </div>
          </StapWrapper>
        )}

        {/* -------------------- VOORWAARDEN BEHEREN -------------------- */}
        {stap === "voorwaarden" && (
          <StapWrapper
            titel="Algemene voorwaarden beheren"
            toelichting="Deze tekst komt automatisch als extra pagina('s) mee bij het afdrukken/opslaan als PDF van een offerte — achteraan, na de eventuele bijlage. Zo ontstaat er in één keer één PDF met de offerte(s) én de voorwaarden erbij."
          >
            <div className="ot-card" style={{ padding: 18, display: "grid", gap: 14 }}>
              <div>
                <label className="ot-label">Titel</label>
                <input
                  className="ot-input"
                  value={algemeneVoorwaarden.titel}
                  onChange={(e) => setAlgemeneVoorwaarden((prev) => ({ ...prev, titel: e.target.value }))}
                />
              </div>
              <div>
                <label className="ot-label">Tekst</label>
                <textarea
                  className="ot-input"
                  rows={20}
                  style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5, lineHeight: 1.6 }}
                  value={algemeneVoorwaarden.tekst}
                  onChange={(e) => setAlgemeneVoorwaarden((prev) => ({ ...prev, tekst: e.target.value }))}
                />
                <p style={{ fontSize: 11.5, color: "#8A9089", marginTop: 6 }}>
                  Laat een lege regel tussen artikelen staan voor een nette alinea-indeling op de afdruk.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 22 }}>
              <button className="ot-btn-secondary" onClick={() => setStap(terugNaarStap)}>
                <ChevronLeft size={15} />
                Terug naar offerte
              </button>
            </div>
          </StapWrapper>
        )}

        {/* -------------------- ROADMAP BEHEREN -------------------- */}
        {stap === "roadmap" && (
          <StapWrapper
            titel="Roadmap beheren"
            toelichting="Stel hier een stappenplan/roadmap samen (bijv. week 1, dag 30, dag 60...). Bij een offerte kan deze per keer aan- of uitgezet worden — handig als niet elke offerte een roadmap nodig heeft."
          >
            <div style={{ marginBottom: 14 }}>
              <label className="ot-label">Titel van de roadmap</label>
              <input
                className="ot-input"
                value={roadmap.titel}
                onChange={(e) => setRoadmap((prev) => ({ ...prev, titel: e.target.value }))}
              />
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {roadmap.fases.map((fase, i) => (
                <div key={fase.id} className="ot-card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-end" }}>
                    <div style={{ width: 70 }}>
                      <label className="ot-label">Markering</label>
                      <input
                        className="ot-input"
                        value={fase.markering}
                        onChange={(e) => bijwerkFase(fase.id, "markering", e.target.value)}
                        placeholder="W1"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="ot-label">Label (klein, bovenaan)</label>
                      <input
                        className="ot-input"
                        value={fase.label}
                        onChange={(e) => bijwerkFase(fase.id, "label", e.target.value)}
                        placeholder="WEEK 1 · FUNDAMENT"
                      />
                    </div>
                    <button
                      onClick={() => verwijderFase(fase.id)}
                      title="Fase verwijderen"
                      style={{ border: "1px solid #E2C4B0", background: "#FBF2EC", color: "#B14A2E", borderRadius: 8, padding: 9, cursor: "pointer", display: "flex", flexShrink: 0 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label className="ot-label">Titel van deze fase</label>
                    <input
                      className="ot-input"
                      value={fase.titel}
                      onChange={(e) => bijwerkFase(fase.id, "titel", e.target.value)}
                    />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label className="ot-label">Bullet points (één per regel)</label>
                    <textarea
                      className="ot-input"
                      rows={3}
                      value={fase.puntenTekst}
                      onChange={(e) => bijwerkFase(fase.id, "puntenTekst", e.target.value)}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <div>
                      <label className="ot-label">Resultaat-label</label>
                      <input
                        className="ot-input"
                        value={fase.resultaatLabel}
                        onChange={(e) => bijwerkFase(fase.id, "resultaatLabel", e.target.value)}
                        placeholder="RESULTAAT"
                      />
                    </div>
                    <div>
                      <label className="ot-label">Resultaat-tekst</label>
                      <input
                        className="ot-input"
                        value={fase.resultaatTekst}
                        onChange={(e) => bijwerkFase(fase.id, "resultaatTekst", e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#8A9089", marginTop: 8 }}>Fase {i + 1}</div>
                </div>
              ))}
            </div>

            <button className="ot-btn-ghost" style={{ marginTop: 12 }} onClick={voegFaseToe}>
              <PlusCircle size={14} />
              Fase toevoegen
            </button>

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 22 }}>
              <button className="ot-btn-secondary" onClick={() => setStap(terugNaarStap)}>
                <ChevronLeft size={15} />
                Terug naar offerte
              </button>
            </div>
          </StapWrapper>
        )}

        {/* -------------------- KLANT -------------------- */}
        {stap === "klant" && (
          <StapWrapper
            titel="Selecteer klanten"
            toelichting="Klanten worden opgehaald uit Dynamics op basis van uw rechten. U kunt er meerdere kiezen — er wordt dan per klant een aparte offerte gemaakt met dezelfde diensten."
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 20,
                marginBottom: 14,
                background: klantenUitDynamics ? "#EAF2F8" : "#FBF2EC",
                color: klantenUitDynamics ? "#1C5D8C" : "#B14A2E",
              }}
            >
              {klantenUitDynamics ? "● Live data uit Dynamics" : "● Voorbeelddata (Dynamics nog niet gekoppeld)"}
            </div>
            {klantenFoutmelding && (
              <div
                style={{
                  fontSize: 12,
                  color: "#B14A2E",
                  background: "#FBF2EC",
                  border: "1px solid #E2C4B0",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginTop: -6,
                  marginBottom: 14,
                  fontFamily: "ui-monospace, monospace",
                  wordBreak: "break-word",
                }}
              >
                <strong>Foutmelding Dynamics-koppeling:</strong> {klantenFoutmelding}
              </div>
            )}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#8A9089" }} />
              <input
                className="ot-input"
                style={{ paddingLeft: 36, paddingRight: klantenLaden ? 90 : undefined }}
                placeholder="Zoek op klantnaam, plaats of klantgroep…"
                value={zoekKlant}
                onChange={(e) => setZoekKlant(e.target.value)}
              />
              {klantenLaden && (
                <span style={{ position: "absolute", right: 12, top: 11, fontSize: 12, color: "#8A9089" }}>
                  zoeken…
                </span>
              )}
            </div>

            {gekozenKlanten.length > 0 && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  background: "#EAF2F8",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "#3A4038" }}>
                  <strong>{gekozenKlanten.length}</strong> klant{gekozenKlanten.length > 1 ? "en" : ""} geselecteerd
                </span>
                <button
                  onClick={() => setGekozenKlanten([])}
                  style={{ border: "none", background: "transparent", color: "#8A9089", fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}
                >
                  Selectie wissen
                </button>
              </div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              {gefilterdeKlanten.slice(0, 10).map((k) => {
                const actief = gekozenKlanten.some((x) => x.id === k.id);
                const metaDelen = [k.contact, k.plaats, k.segment].filter(Boolean);
                return (
                  <button
                    key={k.id}
                    onClick={() => toggleKlant(k)}
                    className="ot-card"
                    style={{
                      textAlign: "left",
                      padding: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      borderColor: actief ? "#1C5D8C" : "#E2E4DF",
                      borderWidth: actief ? 2 : 1,
                      background: actief ? "#EAF2F8" : "#fff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          border: actief ? "none" : "1.5px solid #C8CDC5",
                          background: actief ? "#1C5D8C" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {actief && <Check size={13} color="#fff" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{k.naam}</div>
                        {metaDelen.length > 0 && (
                          <div style={{ fontSize: 12.5, color: "#5B6259", marginTop: 2 }}>
                            {metaDelen.join(" · ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {heeftMeerResultaten && (
                <div style={{ textAlign: "center", padding: "10px 4px", color: "#8A9089", fontSize: 12.5 }}>
                  Meer klanten gevonden — verfijn uw zoekopdracht om ze te zien.
                </div>
              )}
              {gefilterdeKlanten.length === 0 && !klantenLaden && (
                <div style={{ textAlign: "center", padding: 30, color: "#8A9089", fontSize: 13.5 }}>
                  Geen klanten gevonden voor "{zoekKlant}".
                </div>
              )}
            </div>

            <StapNavigatie onVorige={vorige} onVolgende={volgende} volgendeDisabled={!kanNaarDiensten} volgendeLabel="Diensten kiezen" />
          </StapWrapper>
        )}

        {/* -------------------- DIENSTEN KIEZEN -------------------- */}
        {stap === "diensten" && (
          <StapWrapper
            titel="Vink diensten aan"
            toelichting="Kies welke diensten meegaan en het aantal. Heeft een dienst varianten of staffels (zoals Klein/Middel/Groot)? Die kiest u per klant bij de volgende stap, Prijzen."
          >
            {["eenmalig", "doorlopend"].map((cat) => (
              <div key={cat}>
                <div className="ot-cat-koptekst">
                  <span>{CATEGORIE_LABELS[cat]}</span>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {dienstenCatalogus
                    .filter((d) => d.categorie === cat)
                    .map((dienst) => {
                      const info = geselecteerd[dienst.id];
                      const actief = !!info;
                      const meerdereVarianten = dienst.varianten.length > 1;
                      const prijzen = dienst.varianten
                        .map((v) => v.prijs)
                        .filter((p) => p !== null && p !== "nacalculatie");
                      const prijsIndicatie =
                        !meerdereVarianten
                          ? dienst.varianten[0].prijs === null
                            ? "op aanvraag"
                            : dienst.varianten[0].prijs === "nacalculatie"
                            ? "op nacalculatie"
                            : `${currency(dienst.varianten[0].prijs)} / ${dienst.eenheid}`
                          : prijzen.length
                          ? `${currency(Math.min(...prijzen))} – ${currency(Math.max(...prijzen))} / ${dienst.eenheid}`
                          : "op aanvraag / nacalculatie";

                      return (
                        <div
                          key={dienst.id}
                          className="ot-card"
                          style={{ padding: 16, borderColor: actief ? "#1C5D8C" : "#E2E4DF" }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={actief}
                                onChange={() => toggleDienstSelectie(dienst)}
                                style={{ marginTop: 3, width: 16, height: 16, accentColor: "#1C5D8C" }}
                              />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{dienst.naam}</div>
                                <div style={{ fontSize: 12.5, color: "#B98237", marginTop: 3, fontWeight: 600 }}>
                                  {prijsIndicatie}
                                  {meerdereVarianten && (
                                    <span style={{ color: "#8A9089", fontWeight: 500 }}> · {dienst.varianten.map((v) => v.naam || "Standaard").join(" / ")}</span>
                                  )}
                                </div>
                              </div>
                            </label>

                            {actief && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button onClick={() => zetAantal(dienst.id, (info.aantal || 1) - 1)} style={stapKnopStyle}>
                                  <Minus size={13} />
                                </button>
                                <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700, fontSize: 14 }}>{info.aantal || 1}</span>
                                <button onClick={() => zetAantal(dienst.id, (info.aantal || 1) + 1)} style={stapKnopStyle}>
                                  <Plus size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}

            {geselecteerdeEntries.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  background: "#EAF2F8",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13.5,
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <span style={{ color: "#5B6259" }}>{geselecteerdeEntries.length} dienst(en) geselecteerd</span>
                {heeftMeerdereVarianten && (
                  <span style={{ color: "#5B6259" }}>Kies varianten per klant bij de volgende stap</span>
                )}
              </div>
            )}

            <StapNavigatie onVorige={vorige} onVolgende={volgende} volgendeDisabled={!kanNaarPrijzen} volgendeLabel="Prijzen per klant" />
          </StapWrapper>
        )}

        {/* -------------------- PRIJZEN PER KLANT -------------------- */}
        {stap === "prijzen" && (
          <StapWrapper
            titel="Prijs (en variant) per dienst, per klant"
            toelichting="Kies voor elke klant welke variant of staffel geldt (indien van toepassing) en pas de prijs aan waar nodig. Heeft u meerdere klanten? Dan kunt u per klant een dienst ook los aan- of uitzetten met het vinkje bovenin elke cel."
          >
            <div className="ot-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 + gekozenKlanten.length * 200 }}>
                  <thead>
                    <tr style={{ background: "#FBFBF9", borderBottom: "1px solid #E2E4DF" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px 16px",
                          fontSize: 11.5,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                          color: "#5B6259",
                          position: "sticky",
                          left: 0,
                          background: "#FBFBF9",
                          minWidth: 220,
                        }}
                      >
                        Dienst
                      </th>
                      {gekozenKlanten.map((k) => (
                        <th
                          key={k.id}
                          style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: "#1C2321", minWidth: 200, borderLeft: "1px solid #E2E4DF" }}
                        >
                          {k.naam}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {geselecteerdeEntries.map(({ dienst, aantal }) => {
                      const meerdereVarianten = dienst.varianten.length > 1;
                      return (
                        <tr key={dienst.id} style={{ borderBottom: "1px solid #E2E4DF" }}>
                          <td style={{ padding: "12px 16px", position: "sticky", left: 0, background: "#fff", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{dienst.naam}</div>
                            <div style={{ fontSize: 11.5, color: "#8A9089", marginTop: 2 }}>
                              {dienst.eenheid} · {aantal}×
                            </div>
                          </td>
                          {gekozenKlanten.map((k) => {
                            const variant = variantVoorKlant(k.id, dienst);
                            const key = prijsSleutel(k.id, dienst.id);
                            const aangepast = aangepastePrijzen[key] !== undefined && aangepastePrijzen[key] !== "";
                            const huidigeWaarde =
                              aangepastePrijzen[key] !== undefined
                                ? aangepastePrijzen[key]
                                : variant?.prijs === null || variant?.prijs === "nacalculatie"
                                ? ""
                                : variant.prijs;
                            const uitgeschakeld = isUitgeschakeldVoorKlant(k.id, dienst.id);
                            return (
                              <td key={k.id} style={{ padding: "10px 16px", borderLeft: "1px solid #E2E4DF", verticalAlign: "top" }}>
                                {gekozenKlanten.length > 1 && (
                                  <label
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      fontSize: 11.5,
                                      color: uitgeschakeld ? "#B4B9AE" : "#5B6259",
                                      marginBottom: 8,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!uitgeschakeld}
                                      onChange={() => toggleDienstVoorKlant(k.id, dienst.id)}
                                      style={{ width: 14, height: 14, accentColor: "#1C5D8C" }}
                                    />
                                    {uitgeschakeld ? "Niet voor deze klant" : "Voor deze klant"}
                                  </label>
                                )}
                                {!uitgeschakeld && (
                                  <>
                                {meerdereVarianten && (
                                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                                    {dienst.varianten.map((v) => (
                                      <button
                                        key={v.id}
                                        className={`ot-pill ${variant.id === v.id ? "actief" : ""}`}
                                        style={{ padding: "4px 10px", fontSize: 11.5 }}
                                        onClick={() => kiesVariantVoorKlant(k.id, dienst.id, v.id)}
                                      >
                                        {v.naam || "Standaard"}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ position: "absolute", left: 10, fontSize: 13, color: "#8A9089" }}>€</span>
                                  <input
                                    className="ot-input"
                                    type="number"
                                    step="0.01"
                                    placeholder={
                                      variant?.prijs === null
                                        ? "op aanvraag"
                                        : variant?.prijs === "nacalculatie"
                                        ? "nacalculatie"
                                        : ""
                                    }
                                    style={{ paddingLeft: 22, fontWeight: aangepast ? 700 : 400, borderColor: aangepast ? "#B98237" : "#C8CDC5" }}
                                    value={huidigeWaarde}
                                    onChange={(e) => zetPrijs(k.id, dienst.id, e.target.value)}
                                  />
                                  {aangepast && (
                                    <button
                                      title="Terug naar catalogusprijs"
                                      onClick={() => resetPrijs(k.id, dienst.id)}
                                      style={{ border: "none", background: "transparent", color: "#8A9089", cursor: "pointer", display: "flex", flexShrink: 0 }}
                                    >
                                      <RotateCcw size={14} />
                                    </button>
                                  )}
                                </div>
                                  </>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, position: "sticky", left: 0, background: "#FBFBF9", borderTop: "2px solid #1C2321" }}>
                        Totaal (excl. btw)
                      </td>
                      {gekozenKlanten.map((k) => {
                        const t = regelsVoorKlant(k.id).reduce((s, r) => s + r.subtotaal, 0);
                        return (
                          <td key={k.id} style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13.5, borderLeft: "1px solid #E2E4DF", borderTop: "2px solid #1C2321", background: "#FBFBF9" }}>
                            {currency(t)}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#8A9089", marginTop: 12 }}>
              <RotateCcw size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />
              zet een aangepaste prijs terug naar de catalogusprijs.
            </p>

            <StapNavigatie onVorige={vorige} onVolgende={naarBijlage} volgendeDisabled={!kanNaarOfferte} volgendeLabel="Bijlage toevoegen" />
          </StapWrapper>
        )}

        {/* -------------------- BIJLAGE (TOELICHTING) -------------------- */}
        {stap === "bijlage" && (
          <StapWrapper
            titel="Toelichting per onderdeel"
            toelichting="Schrijf optioneel een algemene toelichting, iets klantspecifieks en/of een toelichting per dienst. Alles wordt bewaard en samengevoegd in één gezamenlijke bijlage na de offertes — de klantspecifieke tekst verschijnt op de offerte van díe klant zelf."
          >
            <div
              className="ot-card"
              style={{
                padding: 16,
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderColor: roadmapToevoegen ? "#1C5D8C" : "#E2E4DF",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={roadmapToevoegen}
                  onChange={(e) => setRoadmapToevoegen(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#1C5D8C" }}
                />
                <span>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Roadmap toevoegen aan deze offerte</div>
                  <div style={{ fontSize: 12, color: "#8A9089" }}>"{roadmap.titel}" — te beheren via "Roadmap beheren"</div>
                </span>
              </label>
              <Milestone size={20} color={roadmapToevoegen ? "#1C5D8C" : "#B4B9AE"} />
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div className="ot-card" style={{ padding: 16, borderColor: "#1C5D8C" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label className="ot-label">Algemeen</label>
                  {standaardTeksten.algemeen.trim() !== "" && (
                    <button
                      className="ot-btn-ghost"
                      onClick={() => setAlgemeneToelichting(standaardTeksten.algemeen)}
                      title="Standaardtekst gebruiken"
                    >
                      <RotateCcw size={12} />
                      Standaardtekst
                    </button>
                  )}
                </div>
                <textarea
                  className="ot-input"
                  rows={4}
                  placeholder="Algemene toelichting, niet gekoppeld aan een specifieke dienst…"
                  value={algemeneToelichting}
                  onChange={(e) => setAlgemeneToelichting(e.target.value)}
                />
              </div>

              {gekozenKlanten.length > 0 && (
                <div>
                  <div className="ot-cat-koptekst">
                    <span>Klantspecifiek</span>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {gekozenKlanten.map((klant) => (
                      <div key={klant.id} className="ot-card" style={{ padding: 16 }}>
                        <label className="ot-label">{klant.naam}</label>
                        <textarea
                          className="ot-input"
                          rows={3}
                          placeholder={`Iets specifieks over ${klant.naam}…`}
                          value={klantToelichtingen[klant.id] || ""}
                          onChange={(e) =>
                            setKlantToelichtingen((prev) => ({ ...prev, [klant.id]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {geselecteerdeEntries.map(({ dienst }) => (
                <div key={dienst.id} className="ot-card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label className="ot-label">{dienst.naam}</label>
                    {(standaardTeksten.perDienst[dienst.id] || "").trim() !== "" && (
                      <button
                        className="ot-btn-ghost"
                        onClick={() =>
                          setBijlageToelichtingen((prev) => ({ ...prev, [dienst.id]: standaardTeksten.perDienst[dienst.id] }))
                        }
                        title="Standaardtekst gebruiken"
                      >
                        <RotateCcw size={12} />
                        Standaardtekst
                      </button>
                    )}
                  </div>
                  <textarea
                    className="ot-input"
                    rows={3}
                    placeholder={`Toelichting bij ${dienst.naam.toLowerCase()}…`}
                    value={bijlageToelichtingen[dienst.id] || ""}
                    onChange={(e) =>
                      setBijlageToelichtingen((prev) => ({ ...prev, [dienst.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
              {geselecteerdeEntries.length === 0 && (
                <div style={{ textAlign: "center", padding: 30, color: "#8A9089", fontSize: 13.5 }}>
                  Nog geen diensten geselecteerd.
                </div>
              )}
            </div>

            <StapNavigatie onVorige={vorige} onVolgende={volgende} volgendeLabel="Offerte bekijken" />
          </StapWrapper>
        )}

        {/* -------------------- OFFERTE -------------------- */}
        {stap === "offerte" && (
          <StapWrapper
            titel={gekozenKlanten.length > 1 ? `${gekozenKlanten.length} offertes` : "Offerte"}
            toelichting={
              gekozenKlanten.length > 1
                ? "Voor elke geselecteerde klant is een eigen offerte samengesteld. Druk alles in één keer af of sla op als PDF."
                : "Controleer de offerte en druk af of sla op als PDF."
            }
          >
            {gekozenKlanten.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#8A9089", fontSize: 13.5 }}>
                Nog geen klant geselecteerd.
                <div style={{ marginTop: 12 }}>
                  <button className="ot-btn-secondary" onClick={() => setStap("klant")}>
                    <Users size={15} />
                    Klant kiezen
                  </button>
                </div>
              </div>
            ) : (
              <>
            <div id="offerte-print-gebied">
            {gekozenKlanten.map((klant, idx) => {
              const klantRegels = regelsVoorKlant(klant.id);
              const klantTotaalExcl = klantRegels.reduce((s, r) => s + r.subtotaal, 0);
              const klantBtw = klantTotaalExcl * 0.21;
              const klantTotaalIncl = klantTotaalExcl + klantBtw;
              const groepen = ["eenmalig", "doorlopend"]
                .map((cat) => ({ cat, items: klantRegels.filter((r) => r.categorie === cat) }))
                .filter((g) => g.items.length > 0);

              return (
                <div
                  key={klant.id}
                  className="ot-card offerte-doc"
                  style={{ padding: 40, marginBottom: idx < gekozenKlanten.length - 1 ? 24 : 0 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      {gekozenKlanten.length > 1 && (
                        <div style={{ fontSize: 11.5, color: "#B98237", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>
                          Offerte {idx + 1} van {gekozenKlanten.length}
                        </div>
                      )}
                      <div className="offertetool-serif" style={{ fontSize: 26, fontWeight: 600 }}>Offerte</div>
                      <div style={{ fontSize: 12.5, color: "#8A9089", marginTop: 4 }}>
                        Datum: {new Date().toLocaleDateString("nl-NL")} · Geldig {afzender.geldigheid} dagen
                      </div>
                    </div>
                    {logo && (
                      <img
                        src={logo}
                        alt="Logo"
                        style={{ maxWidth: 140, maxHeight: 56, objectFit: "contain", flexShrink: 0, marginLeft: 24 }}
                      />
                    )}
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12.5, color: "#5B6259", lineHeight: 1.5, marginBottom: 32 }}>
                    <div style={{ fontWeight: 700, color: "#1C2321" }}>{afzender.bedrijf}</div>
                    <div>{afzender.adres}</div>
                    <div>{afzender.postcode} {afzender.plaats}</div>
                    <div>KvK {afzender.kvk}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #E2E4DF" }}>
                    <div>
                      <div className="ot-label">Aan</div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{klant.naam}</div>
                      <div style={{ fontSize: 13, color: "#5B6259" }}>{klant.contact}</div>
                      {klantAdresRegels(klant).map((regel, i) => (
                        <div key={i} style={{ fontSize: 13, color: "#5B6259" }}>{regel}</div>
                      ))}
                      <div style={{ fontSize: 13, color: "#5B6259" }}>{klant.email}</div>
                    </div>
                    <div>
                      <div className="ot-label">Namens</div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{huidigeGebruiker.naam}</div>
                      {huidigeGebruiker.email && huidigeGebruiker.email.toLowerCase() !== (huidigeGebruiker.naam || "").toLowerCase() && (
                        <div style={{ fontSize: 13, color: "#5B6259" }}>{huidigeGebruiker.email}</div>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3A4038", marginBottom: 24 }}>{afzender.inleiding}</p>

                  {(klantToelichtingen[klant.id] || "").trim() !== "" && (
                    <div style={{ background: "#EAF2F8", borderRadius: 8, padding: 16, marginBottom: 24 }}>
                      <div className="ot-label" style={{ color: "#1C5D8C" }}>Speciaal voor {klant.naam}</div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3A4038", whiteSpace: "pre-wrap" }}>
                        {klantToelichtingen[klant.id]}
                      </div>
                    </div>
                  )}

                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #1C2321" }}>
                        <th style={{ textAlign: "left", padding: "8px 4px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".04em", color: "#5B6259" }}>Dienst</th>
                        <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".04em", color: "#5B6259" }}>Aantal</th>
                        <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".04em", color: "#5B6259" }}>Prijs</th>
                        <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".04em", color: "#5B6259" }}>Subtotaal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groepen.map((g) => (
                        <React.Fragment key={g.cat}>
                          <tr>
                            <td colSpan={4} style={{ padding: "12px 4px 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#B98237" }}>
                              {CATEGORIE_LABELS[g.cat]}
                            </td>
                          </tr>
                          {g.items.map((r) => (
                            <tr key={r.id} style={{ borderBottom: "1px solid #E2E4DF" }}>
                              <td style={{ padding: "10px 4px" }}>
                                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.naam}</div>
                              </td>
                              <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 13.5 }}>{r.aantal} {r.eenheid}</td>
                              <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 13.5 }}>
                                {r.opAanvraag ? "op aanvraag" : r.opNacalculatie ? "nacalculatie" : currency(r.prijs)}
                              </td>
                              <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 13.5, fontWeight: 700 }}>
                                {r.opAanvraag || r.opNacalculatie ? "—" : currency(r.subtotaal)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: 240, fontSize: 13.5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                        <span style={{ color: "#5B6259" }}>Subtotaal</span>
                        <span>{currency(klantTotaalExcl)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                        <span style={{ color: "#5B6259" }}>Btw (21%)</span>
                        <span>{currency(klantBtw)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", marginTop: 6, borderTop: "2px solid #1C2321", fontWeight: 700, fontSize: 15 }}>
                        <span>Totaal</span>
                        <span>{currency(klantTotaalIncl)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {roadmapToevoegen && roadmap.fases.length > 0 && (
              <div className="ot-card offerte-doc" style={{ padding: 40 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div className="offertetool-serif" style={{ fontSize: 22, fontWeight: 600 }}>
                    {roadmap.titel}
                  </div>
                  {logo && (
                    <img
                      src={logo}
                      alt="Logo"
                      style={{ maxWidth: 140, maxHeight: 56, objectFit: "contain", flexShrink: 0, marginLeft: 24 }}
                    />
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {roadmap.fases.map((fase) => (
                    <div key={fase.id} style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: "#1C5D8C",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {fase.markering}
                        </div>
                        <div style={{ height: 2, background: "#EAF2F8", flex: 1 }} />
                      </div>
                      <div
                        style={{
                          border: "1.5px solid #1C5D8C",
                          borderRadius: 10,
                          padding: 14,
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#B98237", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>
                          {fase.label}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1C2321", marginBottom: 8 }}>
                          {fase.titel}
                        </div>
                        {fase.puntenTekst
                          .split("\n")
                          .map((p) => p.trim())
                          .filter(Boolean).length > 0 && (
                          <ul style={{ margin: 0, marginBottom: 10, paddingLeft: 16, fontSize: 11.5, color: "#3A4038", lineHeight: 1.5 }}>
                            {fase.puntenTekst
                              .split("\n")
                              .map((p) => p.trim())
                              .filter(Boolean)
                              .map((punt, i) => (
                                <li key={i}>{punt}</li>
                              ))}
                          </ul>
                        )}
                        {fase.resultaatTekst && (
                          <div
                            style={{
                              marginTop: "auto",
                              background: "#EAF2F8",
                              borderRadius: 6,
                              padding: "8px 10px",
                            }}
                          >
                            <div style={{ fontSize: 9.5, fontWeight: 700, color: "#1C5D8C", textTransform: "uppercase", letterSpacing: ".04em" }}>
                              {fase.resultaatLabel}
                            </div>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#1C2321" }}>{fase.resultaatTekst}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(algemeneToelichting.trim() !== "" ||
              geselecteerdeEntries.some(({ dienst }) => (bijlageToelichtingen[dienst.id] || "").trim() !== "")) && (
              <div className="ot-card offerte-doc" style={{ padding: 40 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div className="offertetool-serif" style={{ fontSize: 22, fontWeight: 600 }}>
                    Bijlage — toelichting per onderdeel
                  </div>
                  {logo && (
                    <img
                      src={logo}
                      alt="Logo"
                      style={{ maxWidth: 140, maxHeight: 56, objectFit: "contain", flexShrink: 0, marginLeft: 24 }}
                    />
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#8A9089", marginBottom: 24 }}>
                  Deze toelichting geldt voor alle bovenstaande offertes.
                </div>
                <div style={{ display: "grid", gap: 20 }}>
                  {algemeneToelichting.trim() !== "" && (
                    <div style={{ paddingBottom: 16, borderBottom: "1px solid #E2E4DF" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Algemeen</div>
                      <div style={{ fontSize: 13, color: "#3A4038", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {algemeneToelichting}
                      </div>
                    </div>
                  )}
                  {geselecteerdeEntries
                    .filter(({ dienst }) => (bijlageToelichtingen[dienst.id] || "").trim() !== "")
                    .map(({ dienst }) => (
                      <div key={dienst.id} style={{ paddingBottom: 16, borderBottom: "1px solid #E2E4DF" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{dienst.naam}</div>
                        <div style={{ fontSize: 13, color: "#3A4038", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {bijlageToelichtingen[dienst.id]}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {algemeneVoorwaarden.tekst.trim() !== "" && (
              <div className="ot-card offerte-doc" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div className="offertetool-serif" style={{ fontSize: 13, fontWeight: 600 }}>
                    {algemeneVoorwaarden.titel || "Algemene Voorwaarden"}
                  </div>
                  {logo && (
                    <img
                      src={logo}
                      alt="Logo"
                      style={{ maxWidth: 140, maxHeight: 56, objectFit: "contain", flexShrink: 0, marginLeft: 24 }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 5.3,
                    color: "#3A4038",
                    lineHeight: 1.17,
                    whiteSpace: "pre-wrap",
                    columnCount: 2,
                    columnGap: 16,
                    columnFill: "auto",
                    height: "260mm",
                  }}
                >
                  {algemeneVoorwaarden.tekst}
                </div>
              </div>
            )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button className="ot-btn-secondary" onClick={vorige}>
                <ChevronLeft size={15} />
                Terug naar bijlage
              </button>
              <button className="ot-btn-primary" onClick={afdrukken}>
                <Printer size={15} />
                {gekozenKlanten.length > 1 ? "Alles afdrukken / opslaan als PDF" : "Afdrukken / opslaan als PDF"}
              </button>
            </div>
            </>
            )}
          </StapWrapper>
        )}
      </div>
    </div>
  );
}

const stapKnopStyle = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: "1px solid #C8CDC5",
  background: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function StapWrapper({ titel, toelichting, children }) {
  return (
    <div>
      <h2 className="offertetool-serif" style={{ fontSize: 22, marginBottom: 4 }}>{titel}</h2>
      <p style={{ fontSize: 13.5, color: "#5B6259", marginBottom: 22 }}>{toelichting}</p>
      {children}
    </div>
  );
}

function StapNavigatie({ onVorige, onVolgende, volgendeDisabled, volgendeLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
      {onVorige ? (
        <button className="ot-btn-secondary" onClick={onVorige}>
          <ChevronLeft size={15} />
          Vorige
        </button>
      ) : (
        <span />
      )}
      <button className="ot-btn-primary" onClick={onVolgende} disabled={volgendeDisabled}>
        {volgendeLabel}
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
