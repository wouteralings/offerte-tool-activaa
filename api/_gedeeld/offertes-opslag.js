const { BlobServiceClient } = require("@azure/storage-blob");

// Zelfde container/blob-indeling als api/offerte en api/teken (die dupliceren dit
// nog los van elkaar) — nieuwe functies die alleen een offerte-record hoeven te
// *lezen* (zoals verstuur-mail, voor de PDF-bijlage) gebruiken vanaf nu deze ene
// gedeelde plek, zodat er niet een derde/vierde kopie van dezelfde blob-logica
// ontstaat.
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

// Geeft het offerte-record terug, of null als het (nog) niet bestaat/opgeslagen is.
async function haalOfferteRecord(id) {
  const containerClient = await haalContainerClient();
  const blobClient = containerClient.getBlockBlobClient(veiligeBlobNaam(id));
  const bestaat = await blobClient.exists();
  if (!bestaat) return null;
  const downloadResponse = await blobClient.download();
  const tekst = await streamNaarTekst(downloadResponse.readableStreamBody);
  return JSON.parse(tekst);
}

module.exports = { haalOfferteRecord };
