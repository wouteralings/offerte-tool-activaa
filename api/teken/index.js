const { BlobServiceClient } = require("@azure/storage-blob");
const { verwerkOndertekeningNaSignering } = require("../_gedeeld/onboarding");

// Zelfde container/blob-indeling als api/offerte, zodat dit gewoon dezelfde offerte-records
// leest en bijwerkt — deze Function is puur een publiek, anoniem toegankelijk "loket" erbovenop.
const CONTAINER_NAAM = "offertes";

let cachedContainerClient = null;

async function haalContainerClient() {
  if (cachedContainerClient) return cachedContainerClient;
  const connectionString = process.env.STORAGE_CONNECTION_STRING;
  if (!connectionString) throw new Error("MISSING_CONFIG");
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAAM);
  await containerClient.createIfNotExists();
  cachedContainerClient = containerClient;
  return containerClient;
}

async function streamNaarTekst(readableStream) {
  const stukken = [];
  for await (const stuk of readableStream) {
    stukken.push(Buffer.isBuffer(stuk) ? stuk : Buffer.from(stuk));
  }
  return Buffer.concat(stukken).toString("utf-8");
}

function veiligeBlobNaam(id) {
  return `${id.replace(/[^a-zA-Z0-9-_]/g, "_")}.json`;
}

// Client-IP proberen te bepalen. Azure Static Web Apps/Functions geeft dit door via de
// "x-forwarded-for" header (formaat: "client-ip:poort, proxy-ip, ..."). We pakken het
// eerste, meest linkse adres — dat is het daadwerkelijke client-IP.
function haalClientIp(req) {
  const header = req.headers?.["x-forwarded-for"] || req.headers?.["X-Forwarded-For"];
  if (!header) return "onbekend";
  const eersteDeel = header.split(",")[0].trim();
  // IPv4 met poort ("1.2.3.4:5678") -> alleen het adres; IPv6 laten we ongemoeid.
  const zonderPoort = eersteDeel.includes(".") ? eersteDeel.split(":")[0] : eersteDeel;
  return zonderPoort || "onbekend";
}

module.exports = async function (context, req) {
  const id = context.bindingData.id;
  if (!id) {
    context.res = { status: 400, headers: { "Content-Type": "application/json" }, body: { error: "Geen offerte-ID opgegeven." } };
    return;
  }

  try {
    const containerClient = await haalContainerClient();
    const blobClient = containerClient.getBlockBlobClient(veiligeBlobNaam(id));

    const bestaat = await blobClient.exists();
    if (!bestaat) {
      context.res = { status: 404, headers: { "Content-Type": "application/json" }, body: { error: "Offerte niet gevonden." } };
      return;
    }

    const downloadResponse = await blobClient.download();
    const tekst = await streamNaarTekst(downloadResponse.readableStreamBody);
    const record = JSON.parse(tekst);
    const nu = new Date().toISOString();
    const ip = haalClientIp(req);

    if (req.method === "GET") {
      // Elke keer openen loggen (view-tracking, zoals bij DocuSign) — blokkeert de respons niet
      // bij een schrijffout, dat mag het bekijken van de offerte niet in de weg staan.
      try {
        record.logboek = Array.isArray(record.logboek) ? record.logboek : [];
        record.logboek.push({ gebeurtenis: "geopend", op: nu, ip });
        const buffer = Buffer.from(JSON.stringify(record), "utf-8");
        await blobClient.upload(buffer, buffer.length, { overwrite: true });
      } catch (e) {
        context.log.error("Kon 'geopend' niet loggen:", e);
      }

      context.res = {
        headers: { "Content-Type": "application/json" },
        body: {
          id: record.id,
          klantNamen: record.klantNamen || [],
          data: record.data || {},
          status: record.status || "verzonden",
          ondertekening: record.ondertekening || null,
        },
      };
      return;
    }

    if (req.method === "POST") {
      if (record.ondertekening) {
        // Al eerder getekend/afgewezen — niet nogmaals laten overschrijven, dat zou het
        // bewijs van de eerste ondertekening vernietigen. Gewoon de bestaande status tonen.
        context.res = {
          status: 409,
          headers: { "Content-Type": "application/json" },
          body: {
            error: "Deze offerte is al eerder ondertekend of afgewezen.",
            ondertekening: record.ondertekening,
            status: record.status,
          },
        };
        return;
      }

      const invoer = req.body || {};
      const naam = (invoer.naam || "").trim();
      const email = (invoer.email || "").trim();
      const akkoord = !!invoer.akkoord;
      const opmerking = (invoer.opmerking || "").trim();
      const handtekening = (invoer.handtekening || "").trim(); // base64 PNG data-URL vanaf het canvas

      if (!naam || !email) {
        context.res = {
          status: 400,
          headers: { "Content-Type": "application/json" },
          body: { error: "Naam en e-mailadres zijn verplicht." },
        };
        return;
      }
      // Een getekende handtekening is alleen verplicht bij akkoord — bij afwijzen hoeft er
      // niets getekend te worden.
      if (akkoord && (!handtekening || !handtekening.startsWith("data:image/"))) {
        context.res = {
          status: 400,
          headers: { "Content-Type": "application/json" },
          body: { error: "Handtekening ontbreekt." },
        };
        return;
      }

      record.ondertekening = { naam, email, opmerking, akkoord, handtekening: akkoord ? handtekening : null, ip, op: nu };
      record.status = akkoord ? "geaccepteerd" : "niet_geaccepteerd";
      record.gewijzigdOp = nu;
      record.gewijzigdDoor = `${naam} (klant)`;
      record.logboek = Array.isArray(record.logboek) ? record.logboek : [];
      record.logboek.push({
        gebeurtenis: akkoord ? "ondertekend" : "afgewezen",
        op: nu,
        naam,
        email,
        ip,
      });

      const buffer = Buffer.from(JSON.stringify(record), "utf-8");
      await blobClient.upload(buffer, buffer.length, { overwrite: true });

      // Alleen bij een echte ondertekening (akkoord) — niet bij afwijzen — het
      // ondertekende document + logbestand naar SharePoint wegschrijven en de
      // onboarding-taak aanmaken. Dit mag de ondertekening zelf nooit blokkeren
      // of ongedaan maken: fouten hier worden alleen gelogd.
      if (akkoord) {
        try {
          await verwerkOndertekeningNaSignering(record, (bericht) => context.log(`[onboarding] ${bericht}`));
        } catch (e) {
          context.log.error("[onboarding] Verwerking na ondertekening mislukt:", e);
        }
      }

      context.res = {
        headers: { "Content-Type": "application/json" },
        body: { ondertekening: record.ondertekening, status: record.status },
      };
      return;
    }

    context.res = { status: 405, body: { error: "Methode niet ondersteund." } };
  } catch (err) {
    if (err.message === "MISSING_CONFIG") {
      context.res = {
        status: 501,
        headers: { "Content-Type": "application/json" },
        body: { error: "Opslag is nog niet geconfigureerd." },
      };
      return;
    }
    context.log.error(err);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "Onverwachte fout.", detail: String(err) },
    };
  }
};
