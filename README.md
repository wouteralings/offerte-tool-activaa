# Offertetool

Werkend prototype van de offertetool, gebouwd met React + Vite, met een Azure Function-API
voor de koppeling met Dynamics 365.

## Lokaal starten (alleen de frontend, met voorbeelddata)

```bash
npm install
npm run dev
```

Open daarna http://localhost:5173

## Bouwen voor productie

```bash
npm run build
```

## Echte Dynamics-data aansluiten

De tool haalt klanten op bij `/api/klanten` (een Azure Function in de map `api/`). Zolang
die niet is geconfigureerd, valt de tool automatisch terug op voorbeelddata — je ziet dit
ook aan het label op de klant-stap ("Voorbeelddata" vs. "Live data uit Dynamics").

### Stap 1 — App Registration in Entra ID (door IT/beheerder)

1. Ga naar **Entra ID → App registrations → New registration**.
2. Geef een naam, bijv. `offertetool-dynamics-integratie`.
3. Noteer na het aanmaken: **Application (client) ID** en **Directory (tenant) ID**.
4. Ga naar **Certificates & secrets → New client secret**, maak er één aan en noteer de
   **waarde** meteen (die is later niet meer zichtbaar).
5. Ga naar **API permissions → Add a permission → Dynamics CRM** → geef de juiste
   application permission (bijv. `user_impersonation` is voor delegated flows; voor deze
   app-only opzet is het meestal voldoende dat de Application User in Dynamics zelf een
   passende security role krijgt — zie stap 2). Laat een beheerder dit met "Grant admin
   consent" bevestigen.

### Stap 2 — Application User in Dynamics 365 (door Dynamics-beheerder)

1. Ga in de Power Platform admin center naar de betreffende omgeving → **S2S apps** /
   **Application users**.
2. Maak een nieuwe Application User aan op basis van de App Registration uit stap 1
   (Application ID invoeren).
3. Geef deze Application User een **beveiligingsrol** met (minimaal) leesrechten op de
   entiteit `Account` (en eventueel andere entiteiten die je later wilt ontsluiten).

### Stap 3 — Instellingen in Azure toevoegen

Ga naar de Static Web App-resource in Azure → **Configuration** (Instellingen) →
**Application settings**, en voeg toe:

| Naam | Waarde |
|---|---|
| `DYNAMICS_TENANT_ID` | Tenant ID uit stap 1 |
| `DYNAMICS_CLIENT_ID` | Application (client) ID uit stap 1 |
| `DYNAMICS_CLIENT_SECRET` | Client secret uit stap 1 |
| `DYNAMICS_RESOURCE_URL` | Bijv. `https://jouworganisatie.crm4.dynamics.com` (zonder `/` op het eind) |

Opslaan — de Function herstart automatisch met de nieuwe instellingen.

### Stap 4 — API meenemen in de build

Azure heeft bij het aanmaken van de Static Web App automatisch een workflow-bestand aan de
GitHub-repository toegevoegd (`.github/workflows/azure-static-web-apps-....yml`). Daarin
staat een regel `api_location: ""` — verander die naar:
```
api_location: "api"
```
Commit en push die wijziging. Bij de eerstvolgende deploy neemt Azure dan ook de map `api/`
mee als bijbehorende Function App.

### Stap 5 — Veldnamen controleren

De query in `api/klanten/index.js` gaat uit van de standaard Dynamics-velden voor het
entiteit `Account` (`name`, `address1_city`, `emailaddress1`, `primarycontactid`). Wijkt
jullie omgeving hiervan af (aangepaste velden), pas dan de `$select`/`$expand` in dat
bestand aan.

## Let op — overige onderdelen zijn nog niet live gekoppeld

- **Microsoft-login**: werkt al écht via de ingebouwde authenticatie van Azure Static Web
  Apps (`staticwebapp.config.json`) — geen actie nodig.
- **Diensten/prijzen**: blijven bewust een zelf te beheren catalogus binnen de tool zelf
  (via "Diensten beheren"), niet gekoppeld aan Dynamics — de staffels/varianten die deze
  tool gebruikt zijn specifiek voor het offerteproces.
- **Opslag van instellingen** (logo, dienstencatalogus, standaardteksten): gebruikt nu de
  opslag-API van de ontwikkelomgeving waarin dit gebouwd is. Voor productie is op termijn
  een echte database aan te raden.

## Instellingen (logo, catalogus, teksten) blijvend bewaren

Naast de klantkoppeling is er nu ook een Function `api/instellingen` die logo, afzendergegevens,
dienstencatalogus, standaardteksten en bijlage-teksten blijvend opslaat via **Azure Table Storage**.
Zonder deze koppeling blijft de tool gewoon werken, maar onthoudt hij niets tussen sessies in.

### Stap 1 — Een Storage Account aanmaken

1. Ga in Azure naar **"Een resource maken"** → zoek **"Storage account"** → **Maken**.
2. Kies dezelfde resourcegroep als je Static Web App. Naam bijv. `stoffertetool` (alleen
   kleine letters/cijfers, moet uniek zijn binnen Azure).
3. Performance: **Standard**, Redundancy: **LRS** is voldoende (goedkoopste optie).
4. Aanmaken.

### Stap 2 — Connection string ophalen

1. Ga naar het nieuwe Storage Account → **"Access keys"** (Toegangssleutels) in het menu.
2. Klik bij **key1** op **"Show"** (Weergeven) en kopieer de **Connection string**.

### Stap 3 — Instelling toevoegen aan de Static Web App

Ga naar je Static Web App → **Omgevingsvariabelen** → **+ Toevoegen**:
- **Naam**: `STORAGE_CONNECTION_STRING`
- **Waarde**: de connection string uit stap 2

Opslaan. De tabel `instellingen` wordt automatisch aangemaakt bij het eerste gebruik.

## Offertes bewaren en later wijzigen

Er zijn twee nieuwe Functions bijgekomen: `api/offerte/{id}` (één offerte ophalen/opslaan/
verwijderen) en `api/offertes` (overzicht van alle opgeslagen offertes). Deze gebruiken
dezelfde `STORAGE_CONNECTION_STRING` als hierboven — geen extra Azure-configuratie nodig als
die al is ingesteld. Er wordt automatisch een nieuwe blob-container `offertes` aangemaakt.

Gedrag:
- Een offerte wordt automatisch opgeslagen op het moment dat je op **"Afdrukken / opslaan als
  PDF"** klikt (niet eerder, en niet bij elke tussentijdse wijziging).
- Open je een bestaande offerte via **"Offertes"** in de bovenbalk en druk je 'm opnieuw af,
  dan wordt diezelfde offerte bijgewerkt ("laatst gewijzigd") — er komt geen kopie bij.
- In het overzicht ziet iedereen alle offertes van alle collega's: datum, klant(en), door wie
  opgemaakt, en (indien van toepassing) wanneer en door wie voor het laatst gewijzigd.

## Inloggen beperken tot alleen jullie eigen Microsoft-tenant

Standaard gebruikt Azure Static Web Apps een ingebouwde, **multi-tenant** Microsoft-login —
daarmee kan in principe iedereen met een zakelijk Microsoft-account (van willekeurig welke
organisatie) inloggen. `staticwebapp.config.json` is nu aangepast om in plaats daarvan een
**eigen, single-tenant app-registratie** te gebruiken, zodat alleen accounts uit jullie eigen
Microsoft 365/Entra ID-tenant kunnen inloggen. Dit vraagt eenmalig wat instelwerk in Azure:

**Stap 1 — Eigen tenant-ID opzoeken**
1. Ga naar **Microsoft Entra ID** (voorheen Azure Active Directory) in de Azure Portal.
2. Op het **Overzicht**-scherm staat **Tenant-ID** — kopieer deze GUID.

**Stap 2 — Nieuwe app-registratie aanmaken**
1. Ga in Entra ID naar **App-registraties** → **+ Nieuwe registratie**.
2. Naam: bijv. `OfferteTool Activaa - login`.
3. Bij **Ondersteunde accounttypen**: kies **"Accounts in this organizational directory only
   (Single tenant)"** — dit is de kern van de beperking.
4. **Redirect URI**: type **Web**, waarde:
   `https://<jouw-static-web-app-domein>/.auth/login/aad/callback`
   (het domein vind je bovenaan het Overzicht van je Static Web App, bijv.
   `https://icy-plant-xxxxxxx.azurestaticapps.net` — of je eigen custom domain als je dat hebt).
5. **Registreren**.

**Stap 3 — Client secret aanmaken**
1. Ga naar **Certificates & secrets** → **+ New client secret**.
2. Geef 'm een naam en bewaartermijn, **Add**.
3. Kopieer meteen de **Value** (niet de Secret ID) — die is later niet meer zichtbaar.

**Stap 4 — Gegevens invullen**
1. Kopieer bij **Overview** van de app-registratie de **Application (client) ID**.
2. Ga naar je Static Web App → **Omgevingsvariabelen** → **+ Toevoegen**, en voeg twee nieuwe
   waarden toe (naast de bestaande `STORAGE_CONNECTION_STRING`):
   - **Naam**: `AAD_CLIENT_ID` → **Waarde**: de Application (client) ID uit stap 4.1
   - **Naam**: `AAD_CLIENT_SECRET` → **Waarde**: de secret-waarde uit stap 3.3
3. Open `staticwebapp.config.json` in de code en vervang `AAD_TENANT_ID` door de echte tenant-ID
   uit stap 1 (dit moet letterlijk in het bestand staan, dit kan niet via een omgevingsvariabele).

**Stap 5 — Committen en pushen**
Zoals gewoonlijk: `git add -A`, `git commit`, `git push`. Na de deploy loggen alleen accounts
uit jullie eigen tenant nog in; andere organisaties krijgen een foutmelding van Microsoft bij
het inloggen.

## Offertes laten ondertekenen (publieke tekenlink)

Er is een publieke tekenpagina bijgekomen op `/tekenen/{offerte-id}` — bereikbaar **zonder**
Microsoft-login, want klanten hebben geen Activaa-account. Het offerte-ID in de link is de
toegangssleutel (net als bij een gedeelde documentlink). Geen extra Azure-configuratie nodig:
dit gebruikt dezelfde `STORAGE_CONNECTION_STRING` als de rest.

Werking:
- Klik op **"Tekenlink kopiëren"** op het offerte-eindscherm (slaat de offerte zo nodig eerst
  op) en stuur de link zelf naar de klant (bijv. via e-mail — er is geen automatische
  mailfunctie).
- De klant ziet de volledige offerte-inhoud en kan **"Akkoord — ondertekenen"** of **"Niet
  akkoord"** kiezen, met naam + e-mailadres verplicht.
- Vastgelegd bij ondertekenen/afwijzen: naam, e-mail, IP-adres, tijdstip, en elke keer dat de
  link geopend is (view-tracking). Eenmaal getekend/afgewezen kan een link niet nogmaals worden
  gebruikt om te overschrijven.
- De status van de offerte springt automatisch naar "Geaccepteerd" of "Niet geaccepteerd".
- Bekijk het volledige logboek en de ondertekeningsgegevens via de knop **"Log"** bij elke
  offerte in het overzicht.

**Let op — dit is geen gecertificeerde elektronische handtekening** (geen eIDAS-keurmerk zoals
DocuSign/Adobe Sign dat kunnen bieden). Voor de meeste offertes is dit prima bewijs, maar het is
juridisch niet exact hetzelfde niveau als een "gekwalificeerde" handtekening.

## Na ondertekening: PDF naar SharePoint + onboarding-taak

Zodra een klant een offerte **ondertekent** (akkoord — niet bij afwijzen), gebeurt automatisch:

1. Een PDF van de ondertekende offerte (met handtekening en ondertekeningsgegevens) en een los
   PDF-logbestand (het volledige auditlog) worden aangemaakt.
2. Beide worden weggeschreven naar SharePoint, op basis van het veld **`cr283_sharepoint`** op
   het account (klant) in Dynamics:
   ```
   {cr283_sharepoint}/1. Intern/0. Permanent dossier/Offerte - {klant} - {datum}.pdf
   {cr283_sharepoint}/1. Intern/0. Permanent dossier/Offerte - {klant} - {datum} - logbestand.pdf
   ```
3. Er wordt een taak aangemaakt in Dataverse: onderwerp **"Onboarding klant"**, veld
   `cr283_soortactiecategorie` = **8009** (Backoffice), veld `cr283_urlbestand` = de link naar
   het geüploade PDF-bestand, gekoppeld aan het account (`regardingobjectid`), en toegewezen aan
   de **Manager** van dat account (`cr283_Manager`).

Dit blokkeert de ondertekening zelf nooit — mislukt een van deze stappen (bijv. omdat de
rechten hieronder nog niet zijn ingesteld), dan blijft de handtekening van de klant gewoon
geldig en zichtbaar. De fout wordt alleen gelogd (Azure Application Insights / Function-logs).

### Extra rechten nodig: Microsoft Graph (SharePoint)

De bestaande app-registratie (`DYNAMICS_CLIENT_ID`) heeft hiervoor **naast** de Dataverse-
rechten óók rechten op Microsoft Graph nodig:

1. Ga naar die app-registratie in Entra ID → **API-machtigingen** → **+ Een machtiging toevoegen**.
2. Kies **Microsoft APIs** → **Microsoft Graph** → **Application permissions** (niet Delegated).
3. Zoek en vink aan: **`Sites.ReadWrite.All`**.
4. **Add permissions**, en klik daarna op **"Grant admin consent for [tenant]"** — dit vereist
   beheerdersrechten en is verplicht (Application permissions werken niet zonder).

Zonder deze stap blijft het ondertekenen zelf gewoon werken; alleen de SharePoint-upload en de
taak worden dan overgeslagen (met een foutmelding in de logs).

## Tarieven-registratie in Dataverse opzetten

Bij het **ondertekenen van een opdrachtbevestiging** (niet bij offerte) kan de tool automatisch
twee eigen Dataverse-tabellen bijhouden:

- **Opdrachtbevestiging** (`cr283_opdrachtbevestiging`) — één rij per klant per ondertekende
  opdrachtbevestiging, met een uniek, automatisch gegenereerd **kenmerk** (bijv. `OB-00001`),
  de ondertekeningsdatum, het opdrachttype, een samengevoegde omschrijving van de gekozen
  diensten ("wat ze afnemen"), het totaalbedrag, en — bij een herbevestiging/tariefswijziging —
  een koppeling naar de vorige opdrachtbevestiging.
- **Tarief** (`cr283_tarief`) — één rij per gekozen dienst op die opdrachtbevestiging, met prijs,
  eenheid, aantal, categorie en een **looptijd (van / tot en met)**. Rechtstreeks gekoppeld aan
  zowel de opdrachtbevestiging als de klant, zodat "welke tarieven zijn nu actief" rechtstreeks
  op het klant-formulier te bekijken is (zie stap 3 hieronder).

Bij een **herbevestiging/tariefswijziging** (gekozen via de kiezer op de Opdrachtbevestiging-stap
in de tool: "Herbevestiging / tariefswijziging van eerdere opdrachtbevestiging") worden de nog
openstaande tarieven van de vorige opdrachtbevestiging automatisch afgesloten (looptijd tot en
met = de dag vóór de nieuwe looptijd begint) — er staan dus nooit twee "actieve" tarieven voor
dezelfde dienst/klant tegelijk open.

Twee extra instelmogelijkheden, voor als je invloed wilt op waar en wanneer de tarieven precies
terechtkomen:

- **Kolom-koppeling** — in **Instellingen**, sectie "Tarieven — kolom-koppeling in Dataverse",
  stel je in naar welke kolom van `cr283_tarief` het bedrag en de dienstomschrijving worden
  geschreven. Staat standaard op `cr283_prijs` / `cr283_dienstomschrijving` (de kolommen die het
  opzet-endpoint zelf aanmaakt) — handig als je liever een eigen, al bestaande kolom gebruikt.
  `cr283_dienstomschrijving` is ook de naamgevende kolom van de Tarief-tabel en wordt daarom
  hoe dan ook altijd gevuld; een onbekende of foutief overlappende kolomnaam wordt bij het
  wegschrijven genegeerd, met stille terugval op de standaardkolom.
- **Ingangsdatum tarieven** — op de Opdrachtbevestiging-stap zelf, bij de
  herbevestiging-kiezer, kun je optioneel een "Ingangsdatum tarieven" invullen. Leeg = de
  tarieven gaan in op de ondertekendatum (zoals voorheen). Handig als je vandaag een
  tariefswijziging ondertekent die pas op een latere datum in moet gaan — de vorige, nog
  openstaande tarieven worden dan afgesloten op de dag vóór die ingangsdatum, in plaats van
  vóór de ondertekendatum.

### Stap 1 — Tabellen eenmalig aanmaken

De tool kan deze twee tabellen zelf aanmaken via de Dataverse Web API, met dezelfde
app-registratie (`DYNAMICS_CLIENT_ID`) als de rest van de koppeling. Dat vereist tijdelijk een
bredere bevoegdheid dan waarvoor die Application User tot nu toe is ingericht:

1. Ga in de Power Platform admin center naar de omgeving → **S2S apps** / **Application users**,
   zoek de Application User van deze tool op.
2. Ken tijdelijk de systeemrol **"System Customizer"** toe (naast de bestaande rol) — dit is
   nodig om nieuwe tabellen/kolommen/relaties aan te mogen maken.
3. Roep, terwijl je bent ingelogd in de tool, het opzet-endpoint eenmalig aan:
   ```
   POST /api/dataverse-schema-setup?bevestig=ja
   ```
   Bijvoorbeeld met de browser-devtools (Console-tab, terwijl je op de site bent ingelogd):
   ```js
   fetch("/api/dataverse-schema-setup?bevestig=ja", {
     method: "POST",
     headers: { "X-Requested-With": "offertetool" },
   }).then((r) => r.json()).then(console.log);
   ```
4. Dit is **veilig herhaalbaar** — elke stap controleert eerst of het onderdeel (tabel/kolom/
   relatie) al bestaat voordat het wordt aangemaakt, en er wordt nooit iets verwijderd. Mislukt
   een stap door ontbrekende rechten, dan meldt de respons dat duidelijk — gewoon de systeemrol
   controleren en opnieuw aanroepen.
5. Zet na afloop de systeemrol van de Application User weer terug naar de oorspronkelijke,
   minimale rol — "System Customizer" was alleen nodig voor deze eenmalige opzet, niet voor het
   dagelijkse wegschrijven van tarieven zelf (dat gebruikt alleen gewone lees/schrijfrechten op
   de nieuwe tabellen, die de nieuwe rol niet meer hoeft te hebben).

### Stap 2 — Schakelaar aanzetten

Ga naar het **Instellingen**-scherm, sectie "Opdrachtbevestiging — tarieven naar Dataverse", en
zet de schakelaar **"Tarieven wegschrijven bij ondertekening"** aan. Staat deze uit (standaard),
dan gebeurt er niets — precies zoals bij de taak-instellingen hierboven.

### Stap 3 — "Actieve tarieven" op het klant-formulier tonen

De Metadata API maakt de tabellen/kolommen/relaties aan, maar **geen kant-en-klare weergave** op
het Account-formulier zelf (formulier-lay-out aanpassen via de API is foutgevoelig en dus bewust
overgeslagen). Voeg dit handmatig toe in de Power Apps-portal (make.powerapps.com):

1. Open het Account-formulier (of de tabel "Account" → Formulieren) in de formulier-designer.
2. Voeg een **subgrid** toe (gerelateerde tabel "Tarieven"), eventueel met een view/filter op
   "Looptijd tot en met is leeg OF op/na vandaag" voor een echt "alleen actieve tarieven"-overzicht.
3. Publiceer het formulier.

Zonder deze stap zijn de tarieven gewoon te bekijken via de tabel "Tarief" zelf in de
Power Apps-portal — alleen niet direct zichtbaar op het klant-formulier.

## Tekenlink per e-mail versturen (rechtstreeks, niet via je eigen mailprogramma)

De knop **"Mail versturen"** op het offerte-eindscherm verstuurt de mail rechtstreeks via
Microsoft Graph, vanaf het vaste adres **`correspondentie@activaa.nl`** — dus niet meer via een
`mailto:`-koppeling die je eigen mailprogramma opent. Dit levert een nette HTML-mail op met een
echt klikbare link.

### Extra rechten nodig: Mail.Send

Dezelfde app-registratie (`DYNAMICS_CLIENT_ID`) heeft hiervoor **nóg een** Microsoft Graph-
machtiging nodig, naast `Sites.ReadWrite.All`:

1. Ga naar die app-registratie → **API-machtigingen** → **+ Een machtiging toevoegen**.
2. **Microsoft Graph** → **Application permissions** (niet Delegated).
3. Zoek en vink aan: **`Mail.Send`**.
4. **Add permissions**, en klik daarna op **"Grant admin consent for [tenant]"**.

### Aanbevolen: toegang beperken tot alleen deze mailbox

Met `Mail.Send` (Application) kan de app in principe **namens elke mailbox** in de tenant mail
versturen — niet alleen `correspondentie@activaa.nl`. Voor de meeste omgevingen is het
verstandig dit te beperken met een **Exchange Application Access Policy**, zodat de app
uitsluitend mail mag versturen vanaf die ene mailbox. Dit vereist Exchange Online PowerShell en
is een aparte, optionele hardeningsstap (vraag dit na bij wie Exchange beheert als dit relevant
is voor jullie beveiligingsbeleid).

Zonder deze machtiging blijft "Tekenlink kopiëren" gewoon werken; "Mail versturen" geeft dan een
duidelijke foutmelding in plaats van de mail te versturen.
