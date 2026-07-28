const { BlobServiceClient } = require("@azure/storage-blob");

// AVG-bewaartermijn (#11): persoonsgegevens in offertes (handtekening-afbeelding, IP-adressen
// in het logboek en in de ondertekening) worden na deze termijn verwijderd. De zakelijke
// kerngegevens (klant, diensten, prijzen, status) blijven wél bewaard — die zijn nodig voor de
// bedrijfsvoering/administratie en vallen niet onder dezelfde AVG-overweging als IP-adres en
// handtekening. Afgesproken bewaartermijn: 7 jaar.
const BEWAARTERMIJN_JAREN = 7;
const CONTAINER_NAAM = "offertes";

async function haalContainerClient() {
  const connectionString = process.env.STORAGE_CONNECTION_STRING;
  if (!connectionString) throw new Error("MISSING_CONFIG");
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAAM);
  await containerClient.createIfNotExists();
  return containerClient;
}

async function streamNaarTekst(readableStream) {
  const stukken = [];
  for await (const stuk of readableStream) {
    stukken.push(Buffer.isBuffer(stuk) ? stuk : Buffer.from(stuk));
  }
  return Buffer.concat(stukken).toString("utf-8");
}

function ouderDanBewaartermijn(record) {
  // De meest recente relevante datum: laatste wijziging, of (indien later) het moment van
  // ondertekenen — zodat een net getekende offerte niet per ongeluk als "oud" wordt gezien
  // puur omdat 'aangemaaktOp' lang geleden was.
  const datums = [record.gewijzigdOp, record.ondertekening?.op, record.aangemaaktOp]
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  if (datums.length === 0) return false; // geen bruikbare datum -> voor de zekerheid overslaan
  const meestRecent = Math.max(...datums);
  const grens = Date.now() - BEWAARTERMIJN_JAREN * 365.25 * 24 * 60 * 60 * 1000;
  return meestRecent < grens;
}

// Verwijdert alleen de persoonsgegevens (handtekening-afbeelding, IP-adressen) uit een record;
// de zakelijke kerngegevens (klant, diensten, prijzen, status, wie 'm intern heeft opgesteld)
// blijven staan.
function anonimiseer(record) {
  if (record.ondertekening) {
    record.ondertekening = {
      ...record.ondertekening,
      handtekening: null,
      ip: "geanonimiseerd",
    };
  }
  if (Array.isArray(record.logboek)) {
    record.logboek = record.logboek.map((entry) => ({ ...entry, ip: "geanonimiseerd" }));
  }
  record.geanonimiseerdOp = new Date().toISOString();
  return record;
}

module.exports = async function (context, myTimer) {
  try {
    const containerClient = await haalContainerClient();
    let aantalGeanonimiseerd = 0;
    let aantalBekeken = 0;

    for await (const blob of containerClient.listBlobsFlat()) {
      aantalBekeken++;
      try {
        const blobClient = containerClient.getBlockBlobClient(blob.name);
        const downloadResponse = await blobClient.download();
        const tekst = await streamNaarTekst(downloadResponse.readableStreamBody);
        const record = JSON.parse(tekst);

        // Al eerder geanonimiseerd -> niets meer te doen, scheelt onnodig herschrijven.
        if (record.geanonimiseerdOp) continue;

        if (ouderDanBewaartermijn(record)) {
          const geanonimiseerdRecord = anonimiseer(record);
          const buffer = Buffer.from(JSON.stringify(geanonimiseerdRecord), "utf-8");
          await blobClient.upload(buffer, buffer.length, { overwrite: true });
          aantalGeanonimiseerd++;
        }
      } catch (e) {
        context.log.error(`Kon ${blob.name} niet verwerken tijdens opschonen:`, e);
      }
    }

    context.log(
      `[opschonen] Klaar: ${aantalBekeken} offertes bekeken, ${aantalGeanonimiseerd} geanonimiseerd (bewaartermijn: ${BEWAARTERMIJN_JAREN} jaar).`
    );
  } catch (err) {
    context.log.error("[opschonen] Onverwachte fout:", err);
  }
};
