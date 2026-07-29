const crypto = require("crypto");
const { lijstRuweOpdrachtbevestigingen, slaOpdrachtbevestigingRecordOp } = require("../_gedeeld/offertes-opslag");

// ---------------------------------------------------------------------------
// Automatisch een concept-vervolg-opdrachtbevestiging klaarzetten zodra de tarieven-einddatum
// (data.tariefEinddatum, zie src/App.jsx) van een geaccepteerde opdrachtbevestiging verstreken
// is. Zie README, sectie "Automatisch concept na einddatum tarieven".
//
// Dit endpoint wordt bewust NIET vanuit de tool zelf aangeroepen (er is geen betrouwbare
// tijdgestuurde achtergrondfunctie mogelijk op de huidige Azure Static Web Apps-hosting — zie
// uitgeschakeld/opschonen-timerfunctie, die om dezelfde reden buiten api/ is gezet). In plaats
// daarvan roep je 'm zelf dagelijks aan vanuit een externe schema-trigger (Power Automate-flow
// of Azure Logic App met een "Recurrence"-trigger), met de geheime sleutel als bevestiging.
//
// Puur lezend/aanmakend op de eigen blob-opslag van de tool (geen Dataverse-aanroepen nodig) —
// werkt dus ook als de Dataverse-tarieven-registratie zelf (nog) niet aanstaat of ooit een keer
// mislukt is; de detectie is volledig gebaseerd op wat de tool zelf al over een
// opdrachtbevestiging weet.
// ---------------------------------------------------------------------------

function vandaagIso() {
  return new Date().toISOString().slice(0, 10);
}

function volgendeDagIso(datumIso) {
  const datum = new Date(`${datumIso}T00:00:00Z`);
  datum.setUTCDate(datum.getUTCDate() + 1);
  return datum.toISOString().slice(0, 10);
}

module.exports = async function (context, req) {
  const verwachteSleutel = process.env.VERLOPEN_CONCEPT_SLEUTEL;
  if (!verwachteSleutel) {
    context.res = {
      status: 501,
      headers: { "Content-Type": "application/json" },
      body: { error: "Nog niet geconfigureerd (ontbrekende Application Setting VERLOPEN_CONCEPT_SLEUTEL). Zie README." },
    };
    return;
  }
  if (!req.query.sleutel || req.query.sleutel !== verwachteSleutel) {
    context.res = {
      status: 403,
      headers: { "Content-Type": "application/json" },
      body: { error: "Ongeldige of ontbrekende sleutel." },
    };
    return;
  }

  try {
    const alle = await lijstRuweOpdrachtbevestigingen();

    // Records die al een vervolg-concept hebben (data.herbevestigingVanId wijst ernaar) mogen
    // nooit nogmaals een concept opleveren — dit maakt herhaald aanroepen (bijv. de externe
    // trigger die per ongeluk twee keer vuurt) veilig/idempotent.
    const heeftAlVervolg = new Set(alle.map((r) => r.data?.herbevestigingVanId).filter(Boolean));

    const vandaag = vandaagIso();
    const verlopen = alle.filter(
      (r) => r.status === "geaccepteerd" && r.data?.tariefEinddatum && r.data.tariefEinddatum <= vandaag && !heeftAlVervolg.has(r.id)
    );

    const concepten = [];
    for (const bron of verlopen) {
      const nu = new Date().toISOString();
      const nieuwId = `opdrachtbevestiging-${crypto.randomUUID()}`;
      const nieuwRecord = {
        id: nieuwId,
        soort: "opdrachtbevestiging",
        aangemaaktOp: nu,
        aangemaaktDoor: bron.aangemaaktDoor || "Onbekend",
        aangemaaktDoorEmail: bron.aangemaaktDoorEmail || "",
        gewijzigdOp: nu,
        gewijzigdDoor: bron.aangemaaktDoor || "Onbekend",
        klantNamen: bron.klantNamen || [],
        klantGroepen: bron.klantGroepen || [],
        status: "in_bewerking",
        opdrachttypeId: bron.opdrachttypeId || null,
        opdrachttypeNaam: bron.opdrachttypeNaam || "",
        // Duidelijk gemarkeerd als automatisch aangemaakt, zodat het overzicht in de tool dit
        // apart kan tonen ("controleer en verstuur") i.p.v. het te laten lijken op een concept
        // dat een collega zelf is gestart.
        automatischGegenereerd: true,
        automatischGegenereerdVan: bron.id,
        data: {
          ...(bron.data || {}),
          // Koppelt dit concept aan de verlopen opdrachtbevestiging (zelfde mechanisme als de
          // handmatige herbevestiging-kiezer in de wizard) — bij ondertekenen sluit dit de
          // tarieven van de vorige rij in Dataverse af.
          herbevestigingVanId: bron.id,
          // Nieuwe looptijd pakt door waar de vorige ophield (geen gat tussen de twee
          // afspraken) — blijft aanpasbaar door de gebruiker vóór het versturen.
          tariefIngangsdatum: volgendeDagIso(bron.data.tariefEinddatum),
          // Volgende einddatum is bewust niet over te nemen — moet elke keer opnieuw bewust
          // gekozen worden (of leeg gelaten voor een doorlopende afspraak).
          tariefEinddatum: "",
        },
      };
      await slaOpdrachtbevestigingRecordOp(nieuwRecord);
      concepten.push({ id: nieuwId, klantNamen: nieuwRecord.klantNamen, vanId: bron.id });
    }

    context.res = {
      headers: { "Content-Type": "application/json" },
      body: { ok: true, aantalGegenereerd: concepten.length, concepten },
    };
  } catch (err) {
    if (err.message === "MISSING_CONFIG") {
      context.res = {
        status: 501,
        headers: { "Content-Type": "application/json" },
        body: { error: "Opslag is nog niet geconfigureerd (ontbrekende STORAGE_CONNECTION_STRING)." },
      };
      return;
    }
    context.log.error(err);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "Er ging iets mis. Probeer het later opnieuw." },
    };
  }
};
