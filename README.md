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

De query in `api/src/functions/klanten.js` gaat uit van de standaard Dynamics-velden voor
het entiteit `Account` (`name`, `address1_city`, `emailaddress1`, `primarycontactid`). Wijkt
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
