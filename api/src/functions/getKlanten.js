const { app } = require('@azure/functions');
const { ConfidentialClientApplication } = require('@azure/msal-node');

// Deze waarden komen straks uit veilige omgevingsvariabelen (Application Settings),
// nooit hardcoded in de code zetten.
const TENANT_ID = process.env.DYNAMICS_TENANT_ID;
const CLIENT_ID = process.env.DYNAMICS_CLIENT_ID;
const CLIENT_SECRET = process.env.DYNAMICS_CLIENT_SECRET;
// Bijvoorbeeld: https://jouworganisatie.crm4.dynamics.com
const DYNAMICS_URL = process.env.DYNAMICS_URL;

const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    clientSecret: CLIENT_SECRET,
  },
});

async function getAccessToken() {
  const result = await msalClient.acquireTokenByClientCredential({
    scopes: [`${DYNAMICS_URL}/.default`],
  });
  return result.accessToken;
}

app.http('getKlanten', {
  methods: ['GET'],
  authLevel: 'anonymous', // Static Web Apps beveiligt dit endpoint al via het platform
  route: 'klanten',
  handler: async (request, context) => {
    try {
      const token = await getAccessToken();

      // 'accounts' = klanten/bedrijven in Dynamics 365 Sales.
      // $select beperkt de velden tot wat je nodig hebt (sneller + minder data).
      const response = await fetch(
        `${DYNAMICS_URL}/api/data/v9.2/accounts?$select=name,telephone1,emailaddress1,address1_city`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        context.error('Dynamics API fout:', errorText);
        return { status: response.status, jsonBody: { error: 'Kon klanten niet ophalen uit Dynamics' } };
      }

      const data = await response.json();

      return {
        status: 200,
        jsonBody: data.value.map((klant) => ({
          naam: klant.name,
          telefoon: klant.telephone1,
          email: klant.emailaddress1,
          plaats: klant.address1_city,
        })),
      };
    } catch (err) {
      context.error('Serverfout:', err);
      return { status: 500, jsonBody: { error: 'Er ging iets mis bij het ophalen van klanten' } };
    }
  },
});
