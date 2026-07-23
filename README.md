# Offertetool

Werkend prototype van de offertetool, gebouwd met React + Vite.

## Lokaal starten

```bash
npm install
npm run dev
```

Open daarna http://localhost:5173

## Bouwen voor productie

```bash
npm run build
```

De output komt in de map `dist/`, klaar om te hosten (bijv. Azure Static Web Apps, Vercel, Netlify).

## Let op — dit is nog een prototype

- **Microsoft-login** is nu een simulatie. Voor een echte login is een App Registration in Azure AD
  (Entra ID) nodig, plus MSAL in de code.
- **Dynamics 365-koppeling** ontbreekt nog. Klant- en dienstgegevens zijn mockdata. Een echte koppeling
  vereist een backend (bijv. Azure Function) die namens de ingelogde gebruiker de Dynamics Web API aanroept.
- **Automatisch bewaren** (logo, dienstencatalogus, standaardteksten) gebruikt nu `window.storage`,
  een opslag-API die alleen binnen Claude-artifacts werkt. Voor een live versie moet dit vervangen worden
  door een echte database (of eventueel `localStorage` als tussenstap, met de kanttekening dat dit dan
  per browser is en niet gedeeld wordt tussen collega's).

## Volgende stappen

1. Azure AD App Registration + MSAL voor echte Microsoft-login.
2. Backend/API-laag voor de Dynamics 365 Web API.
3. Database voor persistente opslag i.p.v. `window.storage`.
4. Hosten (Azure Static Web Apps / App Service, Vercel, etc.).
