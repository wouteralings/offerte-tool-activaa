const { BlobServiceClient } = require("@azure/storage-blob");

// Zelfde container/blob-indeling als api/offerte, api/opdrachtbevestiging en api/teken
// (die dupliceren dit nog los van elkaar) — nieuwe functies die alleen een document
// hoeven te *lezen* (zoals verstuur-mail, voor de PDF-bijlage) gebruiken vanaf nu deze
// ene gedeelde plek, zodat er niet een derde/vierde kopie van dezelfde blob-logica
// ontstaat.
const CONTAINERS = { offerte: "offertes", opdrachtbevestiging: "opdrachtbevestigingen" };

const cachedContainerClients = {};

async function haalContainerClient(soort) {
  if (cachedContainerClients[soort]) return cachedContainerClients[soort];
  const connectionString = process.env.STORAGE_CONNECTION_STRING;
  if (!connectionString) throw new Error("MISSING_CONFIG");
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(CONTAINERS[soort]);
  await containerClient.createIfNotExists();
  cachedContainerClients[soort] = containerClient;
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

// Geeft het offerte-record terug, of null als het (nog) niet bestaat/opgeslagen is.
// Blijft bestaan voor bestaande aanroepers; nieuwe code gebruikt haalDocumentRecord.
async function haalOfferteRecord(id) {
  const containerClient = await haalContainerClient("offerte");
  const blobClient = containerClient.getBlockBlobClient(veiligeBlobNaam(id));
  const bestaat = await blobClient.exists();
  if (!bestaat) return null;
  const downloadResponse = await blobClient.download();
  const tekst = await streamNaarTekst(downloadResponse.readableStreamBody);
  return JSON.parse(tekst);
}

// Zoekt een document-ID op in beide containers (eerst offertes, dan opdrachtbevestigingen)
// — zelfde "probeer beide" aanpak als vindBlobClient in api/teken/index.js, maar dan alleen
// lezend. Geeft { record, soort } terug, of null als het ID in geen van beide bestaat.
async function haalDocumentRecord(id) {
  for (const soort of Object.keys(CONTAINERS)) {
    const containerClient = await haalContainerClient(soort);
    const blobClient = containerClient.getBlockBlobClient(veiligeBlobNaam(id));
    const bestaat = await blobClient.exists();
    if (!bestaat) continue;
    const downloadResponse = await blobClient.download();
    const tekst = await streamNaarTekst(downloadResponse.readableStreamBody);
    return { record: JSON.parse(tekst), soort };
  }
  return null;
}

module.exports = { haalOfferteRecord, haalDocumentRecord };
