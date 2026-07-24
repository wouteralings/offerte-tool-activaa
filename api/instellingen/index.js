const { BlobServiceClient } = require("@azure/storage-blob");

const CONTAINER_NAAM = "instellingen";

let cachedContainerClient = null;

/**
 * Verbinding met de Blob-container maken (en aanmaken als die nog niet bestaat).
 * Vereist de Application Setting (Omgevingsvariabele) STORAGE_CONNECTION_STRING in Azure.
 */
async function haalContainerClient() {
  if (cachedContainerClient) return cachedContainerClient;

  const connectionString = process.env.STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("MISSING_CONFIG");
  }

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

// Blobnamen mogen geen rare tekens bevatten; onze sleutels zijn intern altijd
// simpele woorden met koppeltekens, maar we maken 'm voor de zekerheid veilig.
function veiligeBlobNaam(sleutel) {
  return sleutel.replace(/[^a-zA-Z0-9-_]/g, "_");
}

module.exports = async function (context, req) {
  const sleutel = context.bindingData.sleutel;

  if (!sleutel) {
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Geen sleutel opgegeven." },
    };
    return;
  }

  try {
    const containerClient = await haalContainerClient();
    const blobClient = containerClient.getBlockBlobClient(veiligeBlobNaam(sleutel));

    if (req.method === "GET") {
      const bestaat = await blobClient.exists();
      if (!bestaat) {
        context.res = {
          status: 404,
          headers: { "Content-Type": "application/json" },
          body: { error: "Niet gevonden." },
        };
        return;
      }
      const downloadResponse = await blobClient.download();
      const waarde = await streamNaarTekst(downloadResponse.readableStreamBody);
      context.res = {
        headers: { "Content-Type": "application/json" },
        body: { key: sleutel, value: waarde },
      };
      return;
    }

    if (req.method === "PUT") {
      const waarde = req.body?.value;
      if (waarde === undefined) {
        context.res = {
          status: 400,
          headers: { "Content-Type": "application/json" },
          body: { error: "Veld 'value' ontbreekt in de request body." },
        };
        return;
      }
      const inhoud = String(waarde);
      const buffer = Buffer.from(inhoud, "utf-8");
      await blobClient.upload(buffer, buffer.length, { overwrite: true });
      context.res = {
        headers: { "Content-Type": "application/json" },
        body: { key: sleutel, value: waarde },
      };
      return;
    }

    if (req.method === "DELETE") {
      await blobClient.deleteIfExists();
      context.res = {
        headers: { "Content-Type": "application/json" },
        body: { key: sleutel, deleted: true },
      };
      return;
    }

    context.res = { status: 405, body: { error: "Methode niet ondersteund." } };
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
      body: { error: "Onverwachte fout bij de opslag.", detail: String(err) },
    };
  }
};
