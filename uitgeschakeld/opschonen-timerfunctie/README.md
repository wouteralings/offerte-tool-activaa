# Tijdelijk uitgeschakeld: opschonen (AVG-anonimisering)

Deze functie draaide nachtelijks (timerTrigger, 03:00 uur) om offertes ouder dan de AVG-
bewaartermijn van 7 jaar te anonimiseren (handtekening-afbeelding en IP-adressen verwijderen,
zakelijke kerngegevens blijven staan — zie code/comments in `index.js`).

**Waarom uitgeschakeld:** Azure Static Web Apps' ingebouwde (managed) Functions ondersteunen
alleen `httpTrigger`s. Zolang deze map met een `timerTrigger`-`function.json` in `api/` stond,
faalde de hele build-en-deploy van de site (zie GitHub Actions-foutmelding: "invalid trigger
of type 'timerTrigger'"). Op 28 juli 2026 is deze map daarom buiten `api/`
gezet, zodat de rest van de site weer normaal deployt. De opschoon-functionaliteit zelf doet
op dit moment niets meer.

**Om dit weer aan te zetten**, twee opties:

1. **HTTP-endpoint + gratis GitHub Actions-cron (aanbevolen):** verplaats deze map terug naar
   `api/opschonen`, verander `function.json` naar een `httpTrigger` (net als de andere functies
   in `api/`), voeg een simpele geheime-sleutel-check toe in `index.js` vóór de bestaande logica
   (zodat niet zomaar iedereen dit endpoint kan aanroepen), en zet er een dagelijkse GitHub
   Actions workflow met een `schedule:`-cron voor die het endpoint aanroept.
2. **Losstaande Azure Function App (Premium):** een aparte, aan de Static Web App gekoppelde
   Azure Function App-resource, die wél alle triggertypes ondersteunt (incl. timerTrigger) —
   vereist een betaald App Service Plan naast de huidige SWA.

Zie ook het gesprek met Claude van 28 juli 2026 (fix van de tekenlink) voor de volledige
context van deze beslissing.
