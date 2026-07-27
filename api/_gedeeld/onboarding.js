const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

// ---------------------------------------------------------------------------
// Authenticatie — zelfde app-registratie (DYNAMICS_CLIENT_ID) als de rest van de
// tool, maar met twee verschillende "resources": Dataverse zelf, en Microsoft
// Graph (voor SharePoint). Voor Graph moet de app WEL apart de machtiging
// "Sites.ReadWrite.All" (Application permission, met beheerderstoestemming)
// hebben gekregen — dat is iets anders dan de Dataverse-rechten die er al waren.
// ---------------------------------------------------------------------------

async function haalToken(resource) {
  const tenantId = process.env.DYNAMICS_TENANT_ID;
  const clientId = process.env.DYNAMICS_CLIENT_ID;
  const clientSecret = process.env.DYNAMICS_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) throw new Error("MISSING_CONFIG");

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: `${resource}/.default`,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token ophalen mislukt (${resource}, ${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function haalDataverseToken() {
  const resource = process.env.DYNAMICS_RESOURCE_URL;
  if (!resource) throw new Error("MISSING_CONFIG");
  return haalToken(resource);
}

async function haalGraphToken() {
  return haalToken("https://graph.microsoft.com");
}

// ---------------------------------------------------------------------------
// Accountgegevens ophalen: de SharePoint-locatie en de gekoppelde Manager
// (voor de taaktoewijzing).
// ---------------------------------------------------------------------------
async function haalAccountGegevens(accountId, dataverseToken) {
  const resource = process.env.DYNAMICS_RESOURCE_URL;
  const res = await fetch(
    `${resource}/api/data/v9.2/accounts(${accountId})` +
      `?$select=cr283_sharepoint&$expand=cr283_Manager($select=systemuserid,fullname)`,
    { headers: { Authorization: `Bearer ${dataverseToken}`, Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Account ophalen mislukt (${res.status}): ${await res.text()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// PDF's genereren met pdf-lib. Dit is een eigen, opgeschoonde lay-out — géén
// pixel-perfecte kopie van het scherm, maar wel alle relevante inhoud: klant,
// diensten/prijzen/totalen, en het ondertekeningsbewijs met de handtekening.
// ---------------------------------------------------------------------------

const MARGE = 50;
const PAGINA_BREEDTE = 595.28; // A4
const PAGINA_HOOGTE = 841.89;

async function nieuwPdfDocument() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  return { doc, regular, bold };
}

function nieuwSchrijver(doc, regular, bold) {
  let page = doc.addPage([PAGINA_BREEDTE, PAGINA_HOOGTE]);
  let y = PAGINA_HOOGTE - MARGE;

  function nieuwePaginaIndienNodig(benodigdeRuimte = 20) {
    if (y - benodigdeRuimte < MARGE) {
      page = doc.addPage([PAGINA_BREEDTE, PAGINA_HOOGTE]);
      y = PAGINA_HOOGTE - MARGE;
    }
  }

  function regel(tekst, { size = 10.5, font = regular, kleur = rgb(0.16, 0.18, 0.16), x = MARGE, ruimteNa = 14 } = {}) {
    nieuwePaginaIndienNodig(ruimteNa);
    page.drawText(String(tekst ?? ""), { x, y, size, font, color: kleur });
    y -= ruimteNa;
  }

  function kop(tekst, size = 15) {
    nieuwePaginaIndienNodig(size + 16);
    regel(tekst, { size, font: bold, ruimteNa: size + 10 });
  }

  function witruimte(px) {
    y -= px;
  }

  return { regel, kop, witruimte, huidigePagina: () => page, huidigeY: () => y, setY: (v) => (y = v), nieuwePaginaIndienNodig };
}

function euro(bedrag) {
  return "€ " + Number(bedrag || 0).toFixed(2).replace(".", ",");
}

async function genereerOffertePdf(record) {
  const { doc, regular, bold } = await nieuwPdfDocument();
  const schrijver = nieuwSchrijver(doc, regular, bold);
  const data = record.data || {};
  const gekozenKlanten = data.gekozenKlanten || [];
  const regelsPerKlant = data.regelsPerKlant || {};
  const afzender = data.afzender || {};

  schrijver.kop("Ondertekende offerte", 18);
  schrijver.regel(`Aangemaakt: ${new Date(record.aangemaaktOp).toLocaleString("nl-NL")}`, { kleur: rgb(0.4, 0.42, 0.4) });
  schrijver.witruimte(10);

  gekozenKlanten.forEach((klant, idx) => {
    const regels = regelsPerKlant[klant.id] || [];
    const subtotaal = regels.reduce((s, r) => s + (r.subtotaal || 0), 0);
    const btw = subtotaal * 0.21;
    const totaal = subtotaal + btw;

    schrijver.kop(gekozenKlanten.length > 1 ? `Klant ${idx + 1}: ${klant.naam}` : klant.naam, 13);
    if (klant.contact) schrijver.regel(`Contactpersoon: ${klant.contact}`);
    if (klant.email) schrijver.regel(`E-mail: ${klant.email}`);
    schrijver.witruimte(6);

    regels.forEach((r) => {
      const prijsTekst = r.opAanvraag ? "op aanvraag" : r.opNacalculatie ? "nacalculatie" : euro(r.prijs);
      const subtotaalTekst = r.opAanvraag || r.opNacalculatie ? "—" : euro(r.subtotaal);
      schrijver.regel(`${r.naam}  —  ${r.aantal} ${r.eenheid}  —  ${prijsTekst}  —  ${subtotaalTekst}`, { size: 10 });
    });

    schrijver.witruimte(6);
    schrijver.regel(`Subtotaal: ${euro(subtotaal)}`, { x: 350, ruimteNa: 13 });
    schrijver.regel(`Btw (21%): ${euro(btw)}`, { x: 350, ruimteNa: 13 });
    schrijver.regel(`Totaal: ${euro(totaal)}`, { x: 350, font: bold, ruimteNa: 20 });
    schrijver.witruimte(10);
  });

  // Ondertekeningsbewijs
  const ondertekening = record.ondertekening;
  if (ondertekening) {
    schrijver.kop("Ondertekening", 14);
    schrijver.regel(`Status: ${ondertekening.akkoord ? "Akkoord — ondertekend" : "Niet akkoord — afgewezen"}`, { font: bold });
    schrijver.regel(`Naam: ${ondertekening.naam}`);
    schrijver.regel(`E-mailadres: ${ondertekening.email}`);
    schrijver.regel(`IP-adres: ${ondertekening.ip}`);
    schrijver.regel(`Tijdstip: ${new Date(ondertekening.op).toLocaleString("nl-NL")}`);
    if (ondertekening.opmerking) schrijver.regel(`Opmerking: "${ondertekening.opmerking}"`);

    if (ondertekening.handtekening && ondertekening.handtekening.startsWith("data:image/png")) {
      try {
        const base64 = ondertekening.handtekening.split(",")[1];
        const bytes = Buffer.from(base64, "base64");
        const png = await doc.embedPng(bytes);
        const breedte = 220;
        const hoogte = (png.height / png.width) * breedte;
        schrijver.nieuwePaginaIndienNodig(hoogte + 30);
        schrijver.witruimte(6);
        schrijver.huidigePagina().drawImage(png, {
          x: MARGE,
          y: schrijver.huidigeY() - hoogte,
          width: breedte,
          height: hoogte,
        });
        schrijver.setY(schrijver.huidigeY() - hoogte - 10);
      } catch (e) {
        schrijver.regel("(handtekening kon niet worden weergegeven)", { kleur: rgb(0.6, 0.3, 0.2) });
      }
    }
  }

  return doc.save();
}

async function genereerLogPdf(record) {
  const { doc, regular, bold } = await nieuwPdfDocument();
  const schrijver = nieuwSchrijver(doc, regular, bold);

  schrijver.kop("Logboek — offerte", 16);
  schrijver.regel(`Offerte-ID: ${record.id}`, { kleur: rgb(0.4, 0.42, 0.4) });
  schrijver.witruimte(10);

  const logboek = record.logboek || [];
  if (logboek.length === 0) {
    schrijver.regel("Geen gebeurtenissen gelogd.");
  } else {
    logboek.forEach((entry) => {
      const tijd = new Date(entry.op).toLocaleString("nl-NL");
      let regelTekst = `${tijd} — ${entry.gebeurtenis}`;
      if (entry.naam) regelTekst += ` — ${entry.naam} (${entry.email || ""})`;
      if (entry.ip) regelTekst += ` — IP ${entry.ip}`;
      schrijver.regel(regelTekst, { size: 10 });
    });
  }

  return doc.save();
}

// ---------------------------------------------------------------------------
// Uploaden naar SharePoint via Microsoft Graph. cr283_sharepoint bevat de
// site-URL + het pad naar de klantmap, bijv.:
//   https://activaa.sharepoint.com/sites/Klanten/account/JOWO Holding B-V-_...
// Het bestand komt terecht in: {die map}/1. Intern/0. Permanent dossier/{naam}
// ---------------------------------------------------------------------------
async function uploadNaarSharePoint({ sharepointUrl, bestandsnaam, bytes, contentType, graphToken }) {
  const urlObj = new URL(sharepointUrl);
  const segmenten = urlObj.pathname.split("/").filter(Boolean); // al percent-encoded, bijv. ["sites","Klanten","account","JOWO%20Holding..."]
  if (segmenten.length < 2 || segmenten[0] !== "sites") {
    throw new Error(`Onverwacht formaat voor cr283_sharepoint: ${sharepointUrl}`);
  }
  const sitePad = `/${segmenten.slice(0, 2).join("/")}`; // "/sites/Klanten"
  const klantMapSegmenten = segmenten.slice(2); // al percent-encoded

  const siteRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${urlObj.hostname}:${sitePad}`, {
    headers: { Authorization: `Bearer ${graphToken}` },
  });
  if (!siteRes.ok) throw new Error(`SharePoint-site niet gevonden (${siteRes.status}): ${await siteRes.text()}`);
  const site = await siteRes.json();

  const vastePad = ["1. Intern", "0. Permanent dossier"].map(encodeURIComponent);
  const volledigPad = [...klantMapSegmenten, ...vastePad, encodeURIComponent(bestandsnaam)].join("/");

  const uploadRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive/root:/${volledigPad}:/content`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${graphToken}`, "Content-Type": contentType },
    body: bytes,
  });
  if (!uploadRes.ok) throw new Error(`Upload naar SharePoint mislukt (${uploadRes.status}): ${await uploadRes.text()}`);
  const item = await uploadRes.json();
  return item.webUrl;
}

// ---------------------------------------------------------------------------
// Onboarding-taak aanmaken in Dataverse.
// ---------------------------------------------------------------------------
async function maakOnboardingTaak({ accountId, managerId, bestandsUrl, dataverseToken }) {
  const resource = process.env.DYNAMICS_RESOURCE_URL;
  const body = {
    subject: "Onboarding klant",
    cr283_soortactiecategorie: 8009, // Backoffice
    cr283_urlbestand: bestandsUrl,
    "regardingobjectid_account@odata.bind": `/accounts(${accountId})`,
  };
  if (managerId) {
    body["ownerid@odata.bind"] = `/systemusers(${managerId})`;
  }
  const res = await fetch(`${resource}/api/data/v9.2/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dataverseToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Taak aanmaken mislukt (${res.status}): ${await res.text()}`);
}

// ---------------------------------------------------------------------------
// Orkestratie: wordt aangeroepen ná een succesvolle ondertekening (akkoord).
// Faalt dit onderdeel, dan mag dat de ondertekening zelf niet ongedaan maken —
// de aanroeper vangt fouten hiervan af en logt ze, zonder de respons te breken.
// ---------------------------------------------------------------------------
async function verwerkOndertekeningNaSignering(record, contextLog) {
  const klanten = record.data?.gekozenKlanten || [];
  if (klanten.length === 0) {
    contextLog("Onboarding-verwerking overgeslagen: geen klant op de offerte.");
    return;
  }
  // Bij meerdere klanten op één offerte: elk krijgt zijn eigen bestand + taak.
  const dataverseToken = await haalDataverseToken();
  const graphToken = await haalGraphToken();

  const offertePdfBytes = await genereerOffertePdf(record);
  const logPdfBytes = await genereerLogPdf(record);

  const klantnaamVoorBestand = (naam) => naam.replace(/[\\/:*?"<>|]/g, "-").trim();
  const datumVoorBestand = new Date(record.aangemaaktOp).toISOString().slice(0, 10);

  for (const klant of klanten) {
    try {
      const account = await haalAccountGegevens(klant.id, dataverseToken);
      const sharepointUrl = account.cr283_sharepoint;
      if (!sharepointUrl) {
        contextLog(`Klant ${klant.naam}: geen cr283_sharepoint ingevuld, upload overgeslagen.`);
        continue;
      }

      const basisNaam = `Offerte - ${klantnaamVoorBestand(klant.naam)} - ${datumVoorBestand}`;
      const offerteUrl = await uploadNaarSharePoint({
        sharepointUrl,
        bestandsnaam: `${basisNaam}.pdf`,
        bytes: offertePdfBytes,
        contentType: "application/pdf",
        graphToken,
      });
      await uploadNaarSharePoint({
        sharepointUrl,
        bestandsnaam: `${basisNaam} - logbestand.pdf`,
        bytes: logPdfBytes,
        contentType: "application/pdf",
        graphToken,
      });

      const managerId = account.cr283_Manager?.systemuserid || null;
      await maakOnboardingTaak({ accountId: klant.id, managerId, bestandsUrl: offerteUrl, dataverseToken });

      contextLog(`Klant ${klant.naam}: PDF + logbestand geüpload, taak aangemaakt.`);
    } catch (e) {
      contextLog(`Klant ${klant.naam}: onboarding-verwerking mislukt: ${e.message}`);
    }
  }
}

module.exports = { verwerkOndertekeningNaSignering, genereerOffertePdf, genereerLogPdf };
