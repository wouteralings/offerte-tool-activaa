const { haalGraphToken } = require("../_gedeeld/onboarding.js");

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
// worden <br/>, en elke http(s)-link wordt automatisch klikbaar gemaakt.
function tekstNaarHtml(tekst) {
  const geescaped = escapeHtml(tekst);
  const metLinks = geescaped.replace(/(https?:\/\/[^\s<]+)/g, (url) => `<a href="${url}">${url}</a>`);
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

    const htmlBody = `<div>${tekstNaarHtml(tekst)}</div>`;

    const bericht = {
      message: {
        subject: onderwerp,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients: [{ emailAddress: { address: naar } }],
      },
      saveToSentItems: true,
    };

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
      body: { verzonden: true, van: AFZENDER_MAILBOX },
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
