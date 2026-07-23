const { app } = require("@azure/functions");

/**
 * Haalt een app-only toegangstoken op bij Entra ID (client credentials flow),
 * met de App Registration die rechten heeft op de Dynamics 365 Web API.
 * Vereist Application Settings in Azure:
 *   DYNAMICS_TENANT_ID, DYNAMICS_CLIENT_ID, DYNAMICS_CLIENT_SECRET, DYNAMICS_RESOURCE_URL
 */
async function haalDynamicsToken() {
  const tenantId = process.env.DYNAMICS_TENANT_ID;
  const clientId = process.env.DYNAMICS_CLIENT_ID;
  const clientSecret = process.env.DYNAMICS_CLIENT_SECRET;
  const resource = process.env.DYNAMICS_RESOURCE_URL;

  if (!tenantId || !clientId || !clientSecret || !resource) {
    throw new Error("MISSING_CONFIG");
  }

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

  if (!res.ok) {
    const tekst = await res.text();
    throw new Error(`Token ophalen mislukt (${res.status}): ${tekst}`);
  }

  const data = await res.json();
  return data.access_token;
}

app.http("klanten", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "klanten",
  handler: async (request, context) => {
    const resource = process.env.DYNAMICS_RESOURCE_URL;

    if (!resource) {
      // Nog niet geconfigureerd — de tool valt dan zelf terug op voorbeelddata.
      return {
        status: 501,
        jsonBody: {
          error: "Dynamics-koppeling is nog niet geconfigureerd. Zie README voor de benodigde Application Settings.",
        },
      };
    }

    try {
      const token = await haalDynamicsToken();

      // LET OP: de velden hieronder zijn gebaseerd op wat is opgegeven voor deze omgeving.
      // Klopt een veldnaam niet (bijv. omdat 'ie in jullie Dynamics anders heet), pas 'm
      // hieronder aan in zowel de $select/$expand als de mapping verderop.
      const query =
        `${resource}/api/data/v9.2/accounts` +
        `?$select=accountid,name,address1_line1,address1_postalcode,address1_city,` +
        `cr283_huisnummer,cr283_huisnummertoevoeging,emailaddress1` +
        `&$expand=primarycontactid($select=fullname),sk_account_Groepsnaam_sk_groepen` +
        `&$top=200`;

      const dynamicsRes = await fetch(query, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0",
        },
      });

      if (!dynamicsRes.ok) {
        const tekst = await dynamicsRes.text();
        context.error("Dynamics-fout:", tekst);
        return {
          status: 502,
          jsonBody: { error: "Ophalen bij Dynamics is mislukt.", detail: tekst },
        };
      }

      const data = await dynamicsRes.json();
      const klanten = (data.value || []).map((rij) => {
        // De klantgroep komt binnen als een los record via de expand. Welk veld daarvan de
        // weergavenaam is, weten we niet zeker vooraf — we proberen de meest voor de hand
        // liggende veldnamen. Klopt geen van deze, vul de juiste veldnaam hieronder aan.
        const groep = rij.sk_account_Groepsnaam_sk_groepen;
        const klantgroep =
          groep?.sk_name || groep?.sk_groepsnaam || groep?.name || groep?.cr283_naam || "";

        return {
          id: rij.accountid,
          naam: rij.name || "(naam onbekend)",
          straat: rij.address1_line1 || "",
          huisnummer: rij.cr283_huisnummer || "",
          huisnummertoevoeging: rij.cr283_huisnummertoevoeging || "",
          postcode: rij.address1_postalcode || "",
          plaats: rij.address1_city || "",
          contact: rij.primarycontactid?.fullname || "",
          email: rij.emailaddress1 || "",
          segment: klantgroep,
        };
      });

      return { jsonBody: klanten };
    } catch (err) {
      if (err.message === "MISSING_CONFIG") {
        return {
          status: 501,
          jsonBody: { error: "Dynamics-koppeling is nog niet volledig geconfigureerd." },
        };
      }
      context.error(err);
      return {
        status: 500,
        jsonBody: { error: "Onverwachte fout bij ophalen klanten.", detail: String(err) },
      };
    }
  },
});
