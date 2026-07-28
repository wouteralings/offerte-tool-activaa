const { haalGraphToken, genereerOffertePdf } = require("../_gedeeld/onboarding.js");
const { haalOfferteRecord } = require("../_gedeeld/offertes-opslag.js");

// Vast afzenderadres — een gedeelde/functionele mailbox, geen persoonlijk account. Kan later
// eventueel een omgevingsvariabele worden als dit ooit moet wisselen.
const AFZENDER_MAILBOX = "correspondentie@activaa.nl";

function escapeHtml(tekst) {
  return String(tekst || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Platte, door de gebruiker (evt. bewerkte) tekst omzetten naar simpele HTML: regeleinden
// worden <br/>, en elke http(s)-link wordt automatisch klikbaar gemaakt. Kleuren staan
// bewust overal expliciet inline (i.p.v. te vertrouwen op een mailclient-standaard) — anders
// kan een mailprogramma met een donker thema (Outlook/Gmail dark mode) de tekst en/of link
// onbedoeld wit-op-wit (onzichtbaar) weergeven.
function tekstNaarHtml(tekst) {
  const geescaped = escapeHtml(tekst);
  const metLinks = geescaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" style="color:#1C5D8C; text-decoration:underline;">${url}</a>`
  );
  return metLinks.replace(/\n/g, "<br/>");
}

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = { status: 405, body: { error: "Methode niet ondersteund." } };
    return;
  }

  const invoer = req.body || {};
  const naar = (invoer.naar || "").trim();
  const onderwerp = (invoer.onderwerp || "Offerte").trim();
  const tekst = (invoer.tekst || "").trim();
  const offerteId = (invoer.offerteId || "").trim();

  if (!naar || !tekst) {
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "E-mailadres en berichttekst zijn verplicht." },
    };
    return;
  }

  try {
    const token = await haalGraphToken();

    const htmlBody = `<div style="color:#1C2321; background-color:#ffffff; font-family:Arial, Helvetica, sans-serif; font-size:14px;">${tekstNaarHtml(tekst)}</div>`;

    const bericht = {
      message: {
        subject: onderwerp,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients: [{ emailAddress: { address: naar } }],
      },
      saveToSentItems: true,
    };

    // De offerte-PDF als bijlage meesturen (zelfde generator/opmaak als de tekenlink en
    // "Afdrukken / opslaan als PDF") — puur een extra gemak naast de tekenlink die al in de
    // hoofdtekst staat, dus dit mag het versturen van de mail zelf nooit blokkeren. Lukt het
    // niet (offerte nog niet opgeslagen, PDF-generatie mislukt), dan gaat de mail gewoon zonder
    // bijlage de deur uit en wordt de fout alleen gelogd.
    let pdfBijgevoegd = false;
    if (offerteId) {
      try {
        const record = await haalOfferteRecord(offerteId);
        if (record) {
          const pdfBytes = await genereerOffertePdf(record);
          const klantnaam = (record.klantNamen || [])[0] || "offerte";
          const veiligeNaam = klantnaam.replace(/[\\/:*?"<>|]/g, "-").trim();
          bericht.message.attachments = [
            {
              "@odata.type": "#microsoft.graph.fileAttachment",
              name: `Offerte - ${veiligeNaam}.pdf`,
              contentType: "application/pdf",
              contentBytes: Buffer.from(pdfBytes).toString("base64"),
            },
          ];
          pdfBijgevoegd = true;
        } else {
          context.log.error(`verstuur-mail: offerte ${offerteId} niet gevonden, mail gaat zonder PDF-bijlage.`);
        }
      } catch (e) {
        context.log.error("verstuur-mail: PDF-bijlage genereren mislukt, mail gaat zonder bijlage:", e);
      }
    }

    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${AFZENDER_MAILBOX}/sendMail`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bericht),
    });

    if (!res.ok) {
      const tekst = await res.text();
      throw new Error(`Graph sendMail mislukt (${res.status}): ${tekst}`);
    }

    context.res = {
      headers: { "Content-Type": "application/json" },
      body: { verzonden: true, van: AFZENDER_MAILBOX, pdfBijgevoegd },
    };
  } catch (err) {
    if (err.message === "MISSING_CONFIG") {
      context.res = {
        status: 501,
        headers: { "Content-Type": "application/json" },
        body: { error: "Dynamics/Graph-koppeling is nog niet geconfigureerd." },
      };
      return;
    }
    context.log.error(err);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        error:
          "Versturen via " +
          AFZENDER_MAILBOX +
          " is mislukt. Controleer of de app-registratie de machtiging 'Mail.Send' (Application, met " +
          "beheerderstoestemming) heeft.",
        detail: String(err),
      },
    };
  }
};
