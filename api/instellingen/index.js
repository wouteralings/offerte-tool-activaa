const { TableClient } = require("@azure/data-tables");

const TABEL_NAAM = "instellingen";
const PARTITIE = "global"; // alle instellingen zijn gedeeld binnen het hele bedrijf

let cachedClient = null;

/**
 * Verbinding met de Azure Table maken (en de tabel aanmaken als die nog niet bestaat).
 * Vereist de Application Setting (Omgevingsvariabele) STORAGE_CONNECTION_STRING in Azure.
 */
async function haalTableClient() {
  if (cachedClient) return cachedClient;

  const connectionString = process.env.STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("MISSING_CONFIG");
  }

  const client = TableClient.fromConnectionString(connectionString, TABEL_NAAM, {
    allowInsecureConnection: false,
  });

  try {
    await client.createTable();
  } catch (err) {
    // Tabel bestaat al — prima, negeren.
    if (err.statusCode !== 409) throw err;
  }

  cachedClient = client;
  return client;
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
    const client = await haalTableClient();

    if (req.method === "GET") {
      try {
        const entiteit = await client.getEntity(PARTITIE, sleutel);
        context.res = {
          headers: { "Content-Type": "application/json" },
          body: { key: sleutel, value: entiteit.waarde },
        };
      } catch (err) {
        if (err.statusCode === 404) {
          context.res = {
            status: 404,
            headers: { "Content-Type": "application/json" },
            body: { error: "Niet gevonden." },
          };
          return;
        }
        throw err;
      }
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
      await client.upsertEntity(
        { partitionKey: PARTITIE, rowKey: sleutel, waarde: String(waarde) },
        "Replace"
      );
      context.res = {
        headers: { "Content-Type": "application/json" },
        body: { key: sleutel, value: waarde },
      };
      return;
    }

    if (req.method === "DELETE") {
      try {
        await client.deleteEntity(PARTITIE, sleutel);
      } catch (err) {
        // Al niet (meer) aanwezig — dat is prima, resultaat is toch wat we willen.
        if (err.statusCode !== 404) throw err;
      }
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
