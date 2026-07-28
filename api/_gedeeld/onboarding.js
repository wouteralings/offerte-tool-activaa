const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

// ---------------------------------------------------------------------------
// Authenticatie — zelfde app-registratie (DYNAMICS_CLIENT_ID) als de rest van de
// tool, maar met twee verschillende "resources": Dataverse zelf, en Microsoft
// Graph (voor SharePoint). Voor Graph moet de app WEL apart de machtiging
// "Sites.ReadWrite.All" (Application permission, met beheerderstoestemming)
// hebben gekregen — dat is iets anders dan de Dataverse-rechten die er al waren.
// ---------------------------------------------------------------------------

async function haalToken(resource) {
  const tenantId = process.env.DYNAMICS_TENANT_ID;
  const clientId = process.env.DYNAMICS_CLIENT_ID;
  const clientSecret = process.env.DYNAMICS_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) throw new Error("MISSING_CONFIG");

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
  if (!res.ok) throw new Error(`Token ophalen mislukt (${resource}, ${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function haalDataverseToken() {
  const resource = process.env.DYNAMICS_RESOURCE_URL;
  if (!resource) throw new Error("MISSING_CONFIG");
  return haalToken(resource);
}

async function haalGraphToken() {
  return haalToken("https://graph.microsoft.com");
}

// ---------------------------------------------------------------------------
// Accountgegevens ophalen: de SharePoint-locatie en de gekoppelde Manager
// (voor de taaktoewijzing).
// ---------------------------------------------------------------------------
async function haalAccountGegevens(accountId, dataverseToken) {
  const resource = process.env.DYNAMICS_RESOURCE_URL;
  const res = await fetch(
    `${resource}/api/data/v9.2/accounts(${accountId})` +
      `?$select=cr283_sharepoint&$expand=cr283_Manager($select=systemuserid,fullname)`,
    { headers: { Authorization: `Bearer ${dataverseToken}`, Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`Account ophalen mislukt (${res.status}): ${await res.text()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// PDF's genereren met pdf-lib. Zelfde indeling, kleuren en volledige inhoud als
// het "Afdrukken"-scherm in de app (offerte-print-gebied in App.jsx) — logo,
// briefhoofd, Aan/Namens, categorieën, roadmap, bijlage-toelichting. Geen
// pixel-perfecte kopie: het Fraunces-lettertype wordt vervangen door het
// ingebouwde Times-Roman (seriffen-alternatief) en kaarten hebben rechte i.p.v.
// ronde hoeken — maar wel dezelfde onderdelen en dezelfde kleuren.
// ---------------------------------------------------------------------------

const MARGE = 50;
const PAGINA_BREEDTE = 595.28; // A4
const PAGINA_HOOGTE = 841.89;
const KOLOM_BREEDTE = PAGINA_BREEDTE - MARGE * 2;

// Zelfde palet als de app (App.jsx-stijlvariabelen), omgezet naar 0-1 RGB.
const KLEUR = {
  primair: rgb(0.11, 0.137, 0.129), // #1C2321
  secundair: rgb(0.357, 0.384, 0.349), // #5B6259
  zwak: rgb(0.541, 0.565, 0.537), // #8A9089
  rand: rgb(0.886, 0.894, 0.875), // #E2E4DF
  goud: rgb(0.725, 0.51, 0.216), // #B98237
  blauw: rgb(0.11, 0.365, 0.549), // #1C5D8C
  blauwLicht: rgb(0.918, 0.949, 0.973), // #EAF2F8
  fout: rgb(0.694, 0.29, 0.18), // #B14A2E
};

const CATEGORIE_LABELS_PDF = { eenmalig: "Eenmalige werkzaamheden", doorlopend: "Doorlopende dienstverlening" };

async function nieuwPdfDocument() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  return { doc, fonts: { regular, bold, serif, serifBold } };
}

// pdf-lib's ingebouwde lettertypen kunnen alleen WinAnsi-tekens coderen — een
// gebruiker die bijv. een pijltje "→" in een roadmap-titel of toelichting typt,
// zou de hele PDF (en dus het mailen/downloaden) laten crashen. Bekende
// symbolen worden vervangen door een ASCII-alternatief; elk ander teken dat
// het lettertype niet kan coderen wordt "?", in plaats van dat de PDF faalt.
function veiligeTekst(tekst, font) {
  const ruw = String(tekst ?? "")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/⇒/g, "=>")
    .replace(/⇐/g, "<=")
    .replace(/…/g, "...");
  let resultaat = "";
  for (const teken of ruw) {
    try {
      font.encodeText(teken);
      resultaat += teken;
    } catch (e) {
      resultaat += "?";
    }
  }
  return resultaat;
}

// Verdeelt tekst (met eventuele eigen regeleinden) in regels die daadwerkelijk
// passen binnen maxBreedte, op basis van de echte tekenbreedte van het lettertype.
// Maakt de tekst meteen ook veilig (zie veiligeTekst), zodat de breedtemeting
// en de latere tekening altijd op dezelfde (gecodeerde) tekst gebeuren.
function verdeelInRegels(ruweTekst, font, size, maxBreedte) {
  const tekst = veiligeTekst(ruweTekst, font);
  const paragrafen = String(tekst ?? "").split("\n");
  const regels = [];
  paragrafen.forEach((paragraaf) => {
    const woorden = paragraaf.split(/\s+/).filter(Boolean);
    if (woorden.length === 0) {
      regels.push("");
      return;
    }
    let huidige = "";
    woorden.forEach((woord) => {
      const kandidaat = huidige ? `${huidige} ${woord}` : woord;
      if (huidige && font.widthOfTextAtSize(kandidaat, size) > maxBreedte) {
        regels.push(huidige);
        huidige = woord;
      } else {
        huidige = kandidaat;
      }
    });
    regels.push(huidige);
  });
  return regels;
}

function nieuwSchrijver(doc, fonts) {
  const { regular, bold } = fonts;
  let page = doc.addPage([PAGINA_BREEDTE, PAGINA_HOOGTE]);
  let y = PAGINA_HOOGTE - MARGE;

  function nieuwePaginaIndienNodig(benodigdeRuimte = 20) {
    if (y - benodigdeRuimte < MARGE) {
      page = doc.addPage([PAGINA_BREEDTE, PAGINA_HOOGTE]);
      y = PAGINA_HOOGTE - MARGE;
      return true;
    }
    return false;
  }

  // Begin altijd een nieuwe pagina — gebruikt om elk onderdeel (offerte per
  // klant, roadmap, bijlage) op zijn eigen pagina te laten beginnen, zoals de
  // browser-afdrukstand dat ook doet (elk "offerte-doc"-blok = 1 pagina).
  function nieuwePagina() {
    page = doc.addPage([PAGINA_BREEDTE, PAGINA_HOOGTE]);
    y = PAGINA_HOOGTE - MARGE;
  }

  function regel(tekst, { size = 10.5, font = regular, kleur = KLEUR.primair, x = MARGE, ruimteNa = 14 } = {}) {
    nieuwePaginaIndienNodig(ruimteNa);
    page.drawText(veiligeTekst(tekst, font), { x, y, size, font, color: kleur });
    y -= ruimteNa;
  }

  // Tekst op een specifieke (x, y) tekenen zonder de cursor te verschuiven —
  // nodig voor kolommen/briefhoofd waar meerdere stukken tekst op dezelfde
  // hoogte moeten staan. uitlijning "rechts" trekt de tekst terug vanaf rechterX.
  function tekstOpY(tekst, x, yPos, { size = 10.5, font = regular, kleur = KLEUR.primair, uitlijning = "links", rechterX } = {}) {
    const inhoud = veiligeTekst(tekst, font);
    let tekenX = x;
    if (uitlijning === "rechts") {
      tekenX = (rechterX ?? x) - font.widthOfTextAtSize(inhoud, size);
    }
    page.drawText(inhoud, { x: tekenX, y: yPos, size, font, color: kleur });
  }

  function paragraaf(tekst, { size = 12, font = regular, kleur = KLEUR.secundair, x = MARGE, maxBreedte, regelHoogte, ruimteNa = 0 } = {}) {
    if (!tekst) return;
    const breedte = maxBreedte ?? PAGINA_BREEDTE - x - MARGE;
    const hoogte = regelHoogte ?? size * 1.45;
    verdeelInRegels(tekst, font, size, breedte).forEach((regelTekst) => {
      regel(regelTekst, { size, font, kleur, x, ruimteNa: hoogte });
    });
    if (ruimteNa) witruimte(ruimteNa);
  }

  function kop(tekst, { size = 15, font, kleur = KLEUR.primair, ruimteNa } = {}) {
    nieuwePaginaIndienNodig(size + 16);
    regel(tekst, { size, font: font || bold, kleur, ruimteNa: ruimteNa ?? size + 10 });
  }

  function lijn({ kleur = KLEUR.rand, dikte = 1, ruimteVoor = 0, ruimteNa = 12 } = {}) {
    if (ruimteVoor) witruimte(ruimteVoor);
    nieuwePaginaIndienNodig(ruimteNa);
    page.drawLine({ start: { x: MARGE, y }, end: { x: PAGINA_BREEDTE - MARGE, y }, thickness: dikte, color: kleur });
    y -= ruimteNa;
  }

  function witruimte(px) {
    y -= px;
  }

  return {
    regel,
    paragraaf,
    kop,
    lijn,
    witruimte,
    tekstOpY,
    huidigePagina: () => page,
    huidigeY: () => y,
    setY: (v) => (y = v),
    nieuwePaginaIndienNodig,
    nieuwePagina,
  };
}

function euro(bedrag) {
  const opgemaakt = Number(bedrag || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "€ " + opgemaakt;
}

// Probeert het logo (data-URL) als PNG/JPEG in te bedden. SVG's en andere
// formaten kan pdf-lib niet rasteren — dan wordt het logo gewoon overgeslagen,
// de rest van de PDF blijft daarbij gewoon werken.
async function embedLogo(doc, dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return null;
  try {
    const [header, base64] = dataUrl.split(",");
    const bytes = Buffer.from(base64 || "", "base64");
    if (header.includes("image/png")) return await doc.embedPng(bytes);
    if (header.includes("image/jpeg") || header.includes("image/jpg")) return await doc.embedJpg(bytes);
    return null;
  } catch (e) {
    return null;
  }
}

// Tekent het logo rechtsboven, met de bovenkant op yBoven — zelfde begrenzing
// als op het scherm (maxWidth 140, maxHeight 56, object-fit: contain).
// Tekent het logo rechtsboven en geeft de getekende hoogte terug, zodat de
// aanroeper de cursor (y) daarna kan verankeren tot onder het logo — anders
// kan tekst er per ongeluk overheen komen bij een logo dat richting de 56pt-
// maximumhoogte gaat.
function tekenLogoRechtsboven(page, logo, yBoven) {
  if (!logo) return 0;
  const schaal = Math.min(140 / logo.width, 56 / logo.height, 1);
  const breedte = logo.width * schaal;
  const hoogte = logo.height * schaal;
  page.drawImage(logo, { x: PAGINA_BREEDTE - MARGE - breedte, y: yBoven - hoogte, width: breedte, height: hoogte });
  return hoogte;
}

// Hoeveel verticale ruimte een roadmap-faskaart nodig heeft, zodat twee kaarten
// naast elkaar (2 koloms grid) op gelijke hoogte getekend kunnen worden.
function berekenFaseHoogte(fase, fonts, breedteBinnenKaart) {
  const { regular, bold } = fonts;
  const PADDING = 12;
  let hoogte = PADDING; // boven
  hoogte += 10 + 6; // label
  const titelRegels = verdeelInRegels(fase.titel || "", bold, 12.5, breedteBinnenKaart);
  hoogte += titelRegels.length * 15 + 6;
  const punten = (fase.puntenTekst || "").split("\n").map((p) => p.trim()).filter(Boolean);
  if (punten.length > 0) {
    punten.forEach((p) => {
      hoogte += verdeelInRegels(p, regular, 10.5, breedteBinnenKaart - 12).length * 13.5;
    });
    hoogte += 8;
  }
  if (fase.resultaatTekst) {
    const resultaatRegels = verdeelInRegels(fase.resultaatTekst, bold, 10.5, breedteBinnenKaart - 20);
    hoogte += 10 + 11 + resultaatRegels.length * 13 + 8;
  }
  hoogte += PADDING; // onder
  return hoogte;
}

// Hoogte van het lichtblauwe "resultaat/doel"-vakje onderin een faskaart, puur
// op basis van de eigen tekst van die kaart. Losstaand van berekenFaseHoogte
// zodat de roadmap-rij dit ook kan gebruiken om de kaarten in een rij op één
// gedeelde (gelijke) vakhoogte te laten uitkomen, i.p.v. dat elk vakje zijn
// eigen, mogelijk afwijkende hoogte krijgt.
function berekenResultaatVakHoogte(fase, bold, breedteBinnen) {
  if (!fase.resultaatTekst) return 0;
  const resultaatRegels = verdeelInRegels(fase.resultaatTekst, bold, 10.5, breedteBinnen - 20);
  return 10 + resultaatRegels.length * 13 + 8;
}

function tekenFaseKaart(page, fase, fonts, x, yBoven, breedte, hoogte, gedeeldeVakHoogte) {
  const { regular, bold } = fonts;
  const PADDING = 12;
  page.drawRectangle({ x, y: yBoven - hoogte, width: breedte, height: hoogte, borderColor: KLEUR.blauw, borderWidth: 1.3 });

  // Rondje met volgnummer/markering, met een lijntje ernaast — zoals op het scherm.
  const cirkelY = yBoven + 15;
  page.drawEllipse({ x: x + 15, y: cirkelY, xScale: 15, yScale: 15, color: KLEUR.blauw });
  const markering = veiligeTekst(fase.markering ?? "", bold);
  const markeringBreedte = bold.widthOfTextAtSize(markering, 10);
  page.drawText(markering, { x: x + 15 - markeringBreedte / 2, y: cirkelY - 3.5, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawLine({ start: { x: x + 34, y: cirkelY }, end: { x: x + breedte, y: cirkelY }, thickness: 1.5, color: KLEUR.blauwLicht });

  let yInhoud = yBoven - PADDING;
  const breedteBinnen = breedte - PADDING * 2;
  page.drawText(veiligeTekst((fase.label || "").toUpperCase(), bold), { x: x + PADDING, y: yInhoud, size: 9.5, font: bold, color: KLEUR.goud });
  yInhoud -= 16;
  verdeelInRegels(fase.titel || "", bold, 12.5, breedteBinnen).forEach((r) => {
    page.drawText(r, { x: x + PADDING, y: yInhoud, size: 12.5, font: bold, color: KLEUR.primair });
    yInhoud -= 15;
  });
  yInhoud -= 4;

  const punten = (fase.puntenTekst || "").split("\n").map((p) => p.trim()).filter(Boolean);
  punten.forEach((punt) => {
    const regels = verdeelInRegels(punt, regular, 10.5, breedteBinnen - 12);
    regels.forEach((r, i) => {
      page.drawText(i === 0 ? "•" : "", { x: x + PADDING, y: yInhoud, size: 10.5, font: regular, color: KLEUR.secundair });
      page.drawText(r, { x: x + PADDING + 12, y: yInhoud, size: 10.5, font: regular, color: KLEUR.secundair });
      yInhoud -= 13.5;
    });
  });
  if (punten.length > 0) yInhoud -= 6;

  if (fase.resultaatTekst) {
    const resultaatRegels = verdeelInRegels(fase.resultaatTekst, bold, 10.5, breedteBinnen - 20);
    const eigenVakHoogte = 10 + resultaatRegels.length * 13 + 8;
    // Als de aanroeper een gedeelde hoogte meegeeft (zodat alle vakjes in een
    // rij even groot zijn, ongeacht welke kaart de langste resultaattekst
    // heeft), gebruik die — anders gewoon de eigen, op de tekst afgestemde hoogte.
    const vakHoogte = gedeeldeVakHoogte ? Math.max(gedeeldeVakHoogte, eigenVakHoogte) : eigenVakHoogte;
    page.drawRectangle({ x: x + PADDING, y: yInhoud - vakHoogte, width: breedteBinnen - PADDING * 2 + 20, height: vakHoogte, color: KLEUR.blauwLicht });
    page.drawText(veiligeTekst((fase.resultaatLabel || "Resultaat").toUpperCase(), bold), { x: x + PADDING + 10, y: yInhoud - 12, size: 8.5, font: bold, color: KLEUR.blauw });
    let yResultaat = yInhoud - 25;
    resultaatRegels.forEach((r) => {
      page.drawText(r, { x: x + PADDING + 10, y: yResultaat, size: 10.5, font: bold, color: KLEUR.primair });
      yResultaat -= 13;
    });
  }
}

async function genereerOffertePdf(record) {
  const { doc, fonts } = await nieuwPdfDocument();
  const { regular, bold, serifBold } = fonts;
  const s = nieuwSchrijver(doc, fonts);
  const data = record.data || {};
  const gekozenKlanten = data.gekozenKlanten || [];
  const regelsPerKlant = data.regelsPerKlant || {};
  const afzender = data.afzender || {};
  const namens = data.namens || {};
  const algemeneVoorwaarden = data.algemeneVoorwaarden || {};
  const klantToelichtingen = data.klantToelichtingen || {};
  const algemeneToelichting = data.algemeneToelichting || "";
  const bijlageToelichtingen = data.bijlageToelichtingen || {};
  const roadmap = data.roadmap;
  const rechterRand = MARGE + KOLOM_BREEDTE;

  const logo = await embedLogo(doc, data.logo);

  // ------------------------------------------------------------------
  // Eén pagina per klant (bij meerdere klanten op één offerte), met
  // dezelfde inhoud/volgorde als offerte-print-gebied in App.jsx.
  // ------------------------------------------------------------------
  gekozenKlanten.forEach((klant, idx) => {
    if (idx > 0) s.nieuwePagina();

    const regels = regelsPerKlant[klant.id] || [];
    const subtotaal = regels.reduce((som, r) => som + (r.subtotaal || 0), 0);
    const btw = subtotaal * 0.21;
    const totaal = subtotaal + btw;
    const groepen = ["eenmalig", "doorlopend"]
      .map((cat) => ({ cat, items: regels.filter((r) => r.categorie === cat) }))
      .filter((g) => g.items.length > 0);

    const koptekstBovenY = s.huidigeY();
    if (gekozenKlanten.length > 1) {
      s.regel(`OFFERTE ${idx + 1} VAN ${gekozenKlanten.length}`, { size: 10, font: bold, kleur: KLEUR.goud, ruimteNa: 26 });
    }
    s.regel("Offerte", { size: 25, font: serifBold, kleur: KLEUR.primair, ruimteNa: 22 });
    const geldigheidTekst = afzender.geldigheid ? ` · Geldig ${afzender.geldigheid} dagen` : "";
    s.regel(`Datum: ${new Date(record.aangemaaktOp).toLocaleDateString("nl-NL")}${geldigheidTekst}`, { size: 11, kleur: KLEUR.zwak, ruimteNa: 26 });
    const logoHoogte1 = tekenLogoRechtsboven(s.huidigePagina(), logo, koptekstBovenY + 4);
    if (logoHoogte1) s.setY(Math.min(s.huidigeY(), koptekstBovenY + 4 - logoHoogte1 - 14));

    // Briefhoofd (afzender), rechts uitgelijnd.
    const briefhoofdRegels = [
      afzender.bedrijf,
      afzender.adres,
      [afzender.postcode, afzender.plaats].filter(Boolean).join(" "),
      afzender.kvk ? `KvK ${afzender.kvk}` : null,
    ].filter(Boolean);
    if (briefhoofdRegels.length) {
      let yBrief = s.huidigeY();
      briefhoofdRegels.forEach((r, i) => {
        s.tekstOpY(r, MARGE, yBrief, { size: 11, font: i === 0 ? bold : regular, kleur: i === 0 ? KLEUR.primair : KLEUR.secundair, uitlijning: "rechts", rechterX: rechterRand });
        yBrief -= 15;
      });
      s.setY(yBrief - 12);
    }

    // Aan / Namens — twee kolommen.
    const kolomRechtsX = MARGE + KOLOM_BREEDTE / 2 + 10;
    const straatRegel = [klant.straat, `${klant.huisnummer || ""}${klant.huisnummertoevoeging || ""}`.trim()].filter(Boolean).join(" ");
    const plaatsRegel = [klant.postcode, klant.plaats].filter(Boolean).join(" ");
    const aanRegels = [klant.naam, klant.contact, straatRegel, plaatsRegel, klant.email].filter(Boolean);
    const namensRegels = [namens.naam, namens.email && namens.email.toLowerCase() !== (namens.naam || "").toLowerCase() ? namens.email : null].filter(Boolean);

    const startY = s.huidigeY();
    s.tekstOpY("AAN", MARGE, startY, { size: 9.5, font: bold, kleur: KLEUR.zwak });
    if (namensRegels.length) s.tekstOpY("NAMENS", kolomRechtsX, startY, { size: 9.5, font: bold, kleur: KLEUR.zwak });
    let yLinks = startY - 17;
    aanRegels.forEach((r, i) => {
      s.tekstOpY(r, MARGE, yLinks, { size: i === 0 ? 12.5 : 11, font: i === 0 ? bold : regular, kleur: i === 0 ? KLEUR.primair : KLEUR.secundair });
      yLinks -= 14.5;
    });
    let yRechts = startY - 17;
    namensRegels.forEach((r, i) => {
      s.tekstOpY(r, kolomRechtsX, yRechts, { size: i === 0 ? 12.5 : 11, font: i === 0 ? bold : regular, kleur: i === 0 ? KLEUR.primair : KLEUR.secundair });
      yRechts -= 14.5;
    });
    s.setY(Math.min(yLinks, yRechts) - 6);
    s.lijn({ ruimteNa: 22 });

    // Inleiding.
    if ((afzender.inleiding || "").trim()) {
      s.paragraaf(afzender.inleiding, { size: 11.5, kleur: KLEUR.primair, ruimteNa: 12 });
    }

    // "Speciaal voor {klant}"-vak.
    const toelichtingKlant = (klantToelichtingen[klant.id] || "").trim();
    if (toelichtingKlant) {
      const lijnen = verdeelInRegels(toelichtingKlant, regular, 11, KOLOM_BREEDTE - 32);
      const boxHoogte = 20 + lijnen.length * 15 + 12;
      s.nieuwePaginaIndienNodig(boxHoogte + 14);
      const boxBovenY = s.huidigeY();
      s.huidigePagina().drawRectangle({ x: MARGE, y: boxBovenY - boxHoogte, width: KOLOM_BREEDTE, height: boxHoogte, color: KLEUR.blauwLicht });
      s.tekstOpY(`Speciaal voor ${klant.naam}`, MARGE + 16, boxBovenY - 20, { size: 9.5, font: bold, kleur: KLEUR.blauw });
      let yToe = boxBovenY - 36;
      lijnen.forEach((l) => {
        s.tekstOpY(l, MARGE + 16, yToe, { size: 11, kleur: KLEUR.primair });
        yToe -= 15;
      });
      s.setY(boxBovenY - boxHoogte - 16);
    }

    // Dienstentabel.
    const xSubtotaal = rechterRand;
    const xPrijs = rechterRand - 95;
    const xAantal = rechterRand - 180;
    s.nieuwePaginaIndienNodig(40);
    const kopY = s.huidigeY();
    s.tekstOpY("DIENST", MARGE, kopY, { size: 9.5, font: bold, kleur: KLEUR.secundair });
    s.tekstOpY("AANTAL", xAantal, kopY, { size: 9.5, font: bold, kleur: KLEUR.secundair, uitlijning: "rechts", rechterX: xAantal });
    s.tekstOpY("PRIJS", xPrijs, kopY, { size: 9.5, font: bold, kleur: KLEUR.secundair, uitlijning: "rechts", rechterX: xPrijs });
    s.tekstOpY("SUBTOTAAL", xSubtotaal, kopY, { size: 9.5, font: bold, kleur: KLEUR.secundair, uitlijning: "rechts", rechterX: xSubtotaal });
    s.setY(kopY - 8);
    s.lijn({ kleur: KLEUR.primair, dikte: 1.5, ruimteNa: 14 });

    groepen.forEach((groep) => {
      s.nieuwePaginaIndienNodig(24);
      s.regel((CATEGORIE_LABELS_PDF[groep.cat] || groep.cat).toUpperCase(), { size: 10, font: bold, kleur: KLEUR.goud, ruimteNa: 18 });
      groep.items.forEach((r) => {
        // Dienstnaam mag omslaan (lange namen liepen anders door tot in de
        // aantal-kolom) — de andere kolommen blijven op de eerste regel staan.
        // De beschikbare breedte houdt rekening met de daadwerkelijke breedte
        // van de aantal-tekst op déze regel (bijv. "12 maand" is breder dan
        // "1 traject") — een vast vrij te houden stuk was soms te smal,
        // waardoor de aantal-tekst over het einde van de dienstnaam heen viel.
        const aantalTekst = `${r.aantal} ${r.eenheid || ""}`.trim();
        const aantalBreedte = regular.widthOfTextAtSize(aantalTekst, 11.5);
        const naamBreedte = xAantal - MARGE - aantalBreedte - 24;
        const naamRegels = verdeelInRegels(r.naam, bold, 12, naamBreedte);
        const rijHoogte = Math.max(20, naamRegels.length * 15 + 5);
        s.nieuwePaginaIndienNodig(rijHoogte);
        const rijY = s.huidigeY();
        naamRegels.forEach((regelTekst, i) => {
          s.tekstOpY(regelTekst, MARGE, rijY - i * 15, { size: 12, font: bold, kleur: KLEUR.primair });
        });
        s.tekstOpY(aantalTekst, xAantal, rijY, { size: 11.5, kleur: KLEUR.primair, uitlijning: "rechts", rechterX: xAantal });
        const prijsTekst = r.opAanvraag ? "op aanvraag" : r.opNacalculatie ? "nacalculatie" : euro(r.prijs);
        s.tekstOpY(prijsTekst, xPrijs, rijY, { size: 11.5, kleur: KLEUR.primair, uitlijning: "rechts", rechterX: xPrijs });
        const subtotaalTekst = r.opAanvraag || r.opNacalculatie ? "—" : euro(r.subtotaal);
        s.tekstOpY(subtotaalTekst, xSubtotaal, rijY, { size: 11.5, font: bold, kleur: KLEUR.primair, uitlijning: "rechts", rechterX: xSubtotaal });
        // De grijze lijn kwam voorheen exact op de basislijn van de VOLGENDE
        // rij te staan (alle ruimte zat vóór de lijn, niets erna) — daardoor
        // leek de lijn aan de tekst eronder "vast te plakken" i.p.v. een
        // nette scheiding te zijn, en voelde het bij omgeslagen (meerregelige)
        // namen extra ongelijkmatig. Nu staat de lijn verder los: een klein
        // stukje ruimte na de laatste naamregel, én een stukje ruimte na de
        // lijn zelf vóór de volgende rij begint — de totale rijhoogte (en dus
        // de pagina-indeling) blijft precies gelijk, alleen de verdeling
        // ervan rond de lijn verandert.
        const laatsteBaseline = rijY - (naamRegels.length - 1) * 15;
        s.setY(laatsteBaseline - 8);
        s.lijn({ kleur: KLEUR.rand, ruimteNa: rijHoogte - (naamRegels.length - 1) * 15 - 8 });
      });
    });
    s.witruimte(20);

    // Totalenblok, rechts uitgelijnd.
    s.nieuwePaginaIndienNodig(70);
    const totaalX = rechterRand;
    let yTotaal = s.huidigeY();
    s.tekstOpY("Subtotaal", totaalX - 150, yTotaal, { size: 11.5, kleur: KLEUR.secundair });
    s.tekstOpY(euro(subtotaal), totaalX, yTotaal, { size: 11.5, kleur: KLEUR.primair, uitlijning: "rechts", rechterX: totaalX });
    yTotaal -= 17;
    s.tekstOpY("Btw (21%)", totaalX - 150, yTotaal, { size: 11.5, kleur: KLEUR.secundair });
    s.tekstOpY(euro(btw), totaalX, yTotaal, { size: 11.5, kleur: KLEUR.primair, uitlijning: "rechts", rechterX: totaalX });
    yTotaal -= 10;
    s.setY(yTotaal);
    s.lijn({ kleur: KLEUR.primair, dikte: 1.5, ruimteNa: 16 });
    yTotaal = s.huidigeY() + 4;
    s.tekstOpY("Totaal", totaalX - 150, yTotaal, { size: 13.5, font: bold, kleur: KLEUR.primair });
    s.tekstOpY(euro(totaal), totaalX, yTotaal, { size: 13.5, font: bold, kleur: KLEUR.primair, uitlijning: "rechts", rechterX: totaalX });
    s.witruimte(20);

    // Algemene voorwaarden.
    if (algemeneVoorwaarden.url) {
      s.lijn({ ruimteNa: 16 });
      const label = (algemeneVoorwaarden.titel || "algemene voorwaarden").toLowerCase();
      const voor = "Op deze offerte zijn onze ";
      const na = " van toepassing.";
      s.nieuwePaginaIndienNodig(28);
      const yLink = s.huidigeY();
      let xLink = MARGE;
      s.tekstOpY(voor, xLink, yLink, { size: 10, kleur: KLEUR.zwak });
      xLink += regular.widthOfTextAtSize(voor, 10);
      s.tekstOpY(label, xLink, yLink, { size: 10, kleur: KLEUR.blauw });
      const labelBreedte = regular.widthOfTextAtSize(label, 10);
      s.huidigePagina().drawLine({ start: { x: xLink, y: yLink - 1.5 }, end: { x: xLink + labelBreedte, y: yLink - 1.5 }, thickness: 0.6, color: KLEUR.blauw });
      s.tekstOpY(na, xLink + labelBreedte, yLink, { size: 10, kleur: KLEUR.zwak });
      s.setY(yLink - 13);
    }
  });

  // ------------------------------------------------------------------
  // Roadmap — eigen pagina, 2-koloms grid van faskaarten.
  // ------------------------------------------------------------------
  if (roadmap && (roadmap.fases || []).length > 0) {
    s.nieuwePagina();
    const kopY = s.huidigeY();
    s.paragraaf(roadmap.titel || "Planning & aanpak", {
      size: 20,
      font: serifBold,
      kleur: KLEUR.primair,
      x: MARGE,
      maxBreedte: logo ? KOLOM_BREEDTE - 160 : KOLOM_BREEDTE,
      regelHoogte: 22,
      ruimteNa: 6,
    });
    const logoHoogte2 = tekenLogoRechtsboven(s.huidigePagina(), logo, kopY + 4);
    if (logoHoogte2) s.setY(Math.min(s.huidigeY(), kopY + 4 - logoHoogte2 - 6));

    const kolomGap = 20;
    const kolomBreedte = (KOLOM_BREEDTE - kolomGap) / 2;
    const fases = roadmap.fases;
    for (let i = 0; i < fases.length; i += 2) {
      const rijFases = [fases[i], fases[i + 1]].filter(Boolean);
      const hoogtes = rijFases.map((f) => berekenFaseHoogte(f, fonts, kolomBreedte - 28));
      // De "resultaat/doel"-vakjes van de kaarten in deze rij op elkaar afstemmen
      // — anders krijgt elke kaart een eigen, op zijn eigen tekst afgestemde
      // vakhoogte, wat er per rij scheef/ongelijk uitziet (bijv. een kort
      // "Resultaat"-zinnetje naast een langer, 2 regels tellend zinnetje).
      // Kaarten met een kortere eigen vakhoogte krijgen er hier evenveel bij
      // opgeteld als het vakje groeit, zodat de tekst niet buiten de kaart valt.
      const eigenVakHoogtes = rijFases.map((f) => berekenResultaatVakHoogte(f, bold, kolomBreedte - 24));
      const gedeeldeVakHoogte = Math.max(0, ...eigenVakHoogtes);
      const kaartHoogte = Math.max(...hoogtes.map((h, idx) => h + Math.max(0, gedeeldeVakHoogte - eigenVakHoogtes[idx])));
      const rijHoogte = kaartHoogte + 14; // + ruimte voor het rondje/lijntje bovenaan
      s.nieuwePaginaIndienNodig(rijHoogte + 4);
      const rijBovenY = s.huidigeY() - 15;
      rijFases.forEach((fase, kol) => {
        const x = MARGE + kol * (kolomBreedte + kolomGap);
        tekenFaseKaart(s.huidigePagina(), fase, fonts, x, rijBovenY, kolomBreedte, kaartHoogte, gedeeldeVakHoogte);
      });
      s.setY(rijBovenY - rijHoogte + 15);
    }
  }

  // ------------------------------------------------------------------
  // Bijlage — toelichting per onderdeel — eigen pagina.
  // ------------------------------------------------------------------
  const eersteRegelsLijst = Object.values(regelsPerKlant)[0] || [];
  const heeftBijlageToelichting = eersteRegelsLijst.some((r) => (bijlageToelichtingen[r.id] || "").trim() !== "");
  if (algemeneToelichting.trim() !== "" || heeftBijlageToelichting) {
    s.nieuwePagina();
    const kopY = s.huidigeY();
    s.paragraaf("Bijlage — toelichting per onderdeel", {
      size: 18,
      font: serifBold,
      kleur: KLEUR.primair,
      x: MARGE,
      maxBreedte: logo ? KOLOM_BREEDTE - 160 : KOLOM_BREEDTE,
      regelHoogte: 22,
      ruimteNa: 8,
    });
    const logoHoogte3 = tekenLogoRechtsboven(s.huidigePagina(), logo, kopY + 4);
    if (logoHoogte3) s.setY(Math.min(s.huidigeY(), kopY + 4 - logoHoogte3 - 14));
    s.regel("Deze toelichting geldt voor alle bovenstaande offertes.", { size: 10.5, kleur: KLEUR.zwak, ruimteNa: 24 });

    if (algemeneToelichting.trim() !== "") {
      s.regel("Algemeen", { size: 12.5, font: bold, kleur: KLEUR.primair, ruimteNa: 17 });
      s.paragraaf(algemeneToelichting, { size: 11, kleur: KLEUR.secundair, ruimteNa: 12 });
      s.lijn({ ruimteNa: 16 });
    }
    eersteRegelsLijst
      .filter((r) => (bijlageToelichtingen[r.id] || "").trim() !== "")
      .forEach((r) => {
        s.regel(r.naam, { size: 12.5, font: bold, kleur: KLEUR.primair, ruimteNa: 17 });
        s.paragraaf(bijlageToelichtingen[r.id], { size: 11, kleur: KLEUR.secundair, ruimteNa: 12 });
        s.lijn({ ruimteNa: 16 });
      });
  }

  // ------------------------------------------------------------------
  // Ondertekeningsbewijs — eigen pagina, alleen als er al getekend/afgewezen is.
  // ------------------------------------------------------------------
  const ondertekening = record.ondertekening;
  if (ondertekening) {
    s.nieuwePagina();
    s.kop("Ondertekening", { size: 16, font: serifBold });
    s.regel(`Status: ${ondertekening.akkoord ? "Akkoord — ondertekend" : "Niet akkoord — afgewezen"}`, {
      font: bold,
      kleur: ondertekening.akkoord ? KLEUR.blauw : KLEUR.fout,
    });
    s.regel(`Naam: ${ondertekening.naam}`, { kleur: KLEUR.secundair });
    s.regel(`E-mailadres: ${ondertekening.email}`, { kleur: KLEUR.secundair });
    s.regel(`IP-adres: ${ondertekening.ip}`, { kleur: KLEUR.secundair });
    s.regel(`Tijdstip: ${new Date(ondertekening.op).toLocaleString("nl-NL")}`, { kleur: KLEUR.secundair });
    if (ondertekening.opmerking) s.regel(`Opmerking: "${ondertekening.opmerking}"`, { kleur: KLEUR.secundair });

    if (ondertekening.handtekening && ondertekening.handtekening.startsWith("data:image/png")) {
      try {
        const base64 = ondertekening.handtekening.split(",")[1];
        const bytes = Buffer.from(base64, "base64");
        const png = await doc.embedPng(bytes);
        const breedte = 220;
        const hoogte = (png.height / png.width) * breedte;
        s.nieuwePaginaIndienNodig(hoogte + 30);
        s.witruimte(6);
        s.huidigePagina().drawImage(png, { x: MARGE, y: s.huidigeY() - hoogte, width: breedte, height: hoogte });
        s.setY(s.huidigeY() - hoogte - 10);
      } catch (e) {
        s.regel("(handtekening kon niet worden weergegeven)", { kleur: KLEUR.fout });
      }
    }
  }

  return doc.save();
}

async function genereerLogPdf(record) {
  const { doc, fonts } = await nieuwPdfDocument();
  const schrijver = nieuwSchrijver(doc, fonts);

  schrijver.kop("Logboek — offerte", { size: 16 });
  schrijver.regel(`Offerte-ID: ${record.id}`, { kleur: KLEUR.zwak });
  schrijver.witruimte(10);

  const logboek = record.logboek || [];
  if (logboek.length === 0) {
    schrijver.regel("Geen gebeurtenissen gelogd.");
  } else {
    logboek.forEach((entry) => {
      const tijd = new Date(entry.op).toLocaleString("nl-NL");
      let regelTekst = `${tijd} — ${entry.gebeurtenis}`;
      if (entry.naam) regelTekst += ` — ${entry.naam} (${entry.email || ""})`;
      if (entry.ip) regelTekst += ` — IP ${entry.ip}`;
      schrijver.regel(regelTekst, { size: 10 });
    });
  }

  return doc.save();
}

// ---------------------------------------------------------------------------
// Uploaden naar SharePoint via Microsoft Graph. cr283_sharepoint bevat de
// site-URL + het pad naar de klantmap, bijv.:
//   https://activaa.sharepoint.com/sites/Klanten/account/JOWO Holding B-V-_...
// Het bestand komt terecht in: {die map}/1. Intern/0. Permanent dossier/{naam}
// ---------------------------------------------------------------------------
async function uploadNaarSharePoint({ sharepointUrl, bestandsnaam, bytes, contentType, graphToken }) {
  const urlObj = new URL(sharepointUrl);
  const segmenten = urlObj.pathname.split("/").filter(Boolean); // al percent-encoded, bijv. ["sites","Klanten","account","JOWO%20Holding..."]
  if (segmenten.length < 2 || segmenten[0] !== "sites") {
    throw new Error(`Onverwacht formaat voor cr283_sharepoint: ${sharepointUrl}`);
  }
  const sitePad = `/${segmenten.slice(0, 2).join("/")}`; // "/sites/Klanten"
  const klantMapSegmenten = segmenten.slice(2); // al percent-encoded

  const siteRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${urlObj.hostname}:${sitePad}`, {
    headers: { Authorization: `Bearer ${graphToken}` },
  });
  if (!siteRes.ok) throw new Error(`SharePoint-site niet gevonden (${siteRes.status}): ${await siteRes.text()}`);
  const site = await siteRes.json();

  const vastePad = ["1. Intern", "0. Permanent dossier"].map(encodeURIComponent);
  const volledigPad = [...klantMapSegmenten, ...vastePad, encodeURIComponent(bestandsnaam)].join("/");

  const uploadRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive/root:/${volledigPad}:/content`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${graphToken}`, "Content-Type": contentType },
    body: bytes,
  });
  if (!uploadRes.ok) throw new Error(`Upload naar SharePoint mislukt (${uploadRes.status}): ${await uploadRes.text()}`);
  const item = await uploadRes.json();
  return item.webUrl;
}

// ---------------------------------------------------------------------------
// Onboarding-taak aanmaken in Dataverse.
// ---------------------------------------------------------------------------
async function maakOnboardingTaak({ accountId, managerId, bestandsUrl, dataverseToken }) {
  const resource = process.env.DYNAMICS_RESOURCE_URL;
  const body = {
    subject: "Onboarding klant",
    cr283_soortactiecategorie: 8009, // Backoffice
    cr283_urlbestand: bestandsUrl,
    "regardingobjectid_account@odata.bind": `/accounts(${accountId})`,
  };
  if (managerId) {
    body["ownerid@odata.bind"] = `/systemusers(${managerId})`;
  }
  const res = await fetch(`${resource}/api/data/v9.2/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dataverseToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Taak aanmaken mislukt (${res.status}): ${await res.text()}`);
}

// ---------------------------------------------------------------------------
// Orkestratie: wordt aangeroepen ná een succesvolle ondertekening (akkoord).
// Faalt dit onderdeel, dan mag dat de ondertekening zelf niet ongedaan maken —
// de aanroeper vangt fouten hiervan af en logt ze, zonder de respons te breken.
// ---------------------------------------------------------------------------
async function verwerkOndertekeningNaSignering(record, contextLog) {
  const klanten = record.data?.gekozenKlanten || [];
  if (klanten.length === 0) {
    contextLog("Onboarding-verwerking overgeslagen: geen klant op de offerte.");
    return;
  }
  // Bij meerdere klanten op één offerte: elk krijgt zijn eigen bestand + taak.
  const dataverseToken = await haalDataverseToken();
  const graphToken = await haalGraphToken();

  const offertePdfBytes = await genereerOffertePdf(record);
  const logPdfBytes = await genereerLogPdf(record);

  const klantnaamVoorBestand = (naam) => naam.replace(/[\\/:*?"<>|]/g, "-").trim();
  const datumVoorBestand = new Date(record.aangemaaktOp).toISOString().slice(0, 10);

  for (const klant of klanten) {
    try {
      const account = await haalAccountGegevens(klant.id, dataverseToken);
      const sharepointUrl = account.cr283_sharepoint;
      if (!sharepointUrl) {
        contextLog(`Klant ${klant.naam}: geen cr283_sharepoint ingevuld, upload overgeslagen.`);
        continue;
      }

      const basisNaam = `Offerte - ${klantnaamVoorBestand(klant.naam)} - ${datumVoorBestand}`;
      const offerteUrl = await uploadNaarSharePoint({
        sharepointUrl,
        bestandsnaam: `${basisNaam}.pdf`,
        bytes: offertePdfBytes,
        contentType: "application/pdf",
        graphToken,
      });
      await uploadNaarSharePoint({
        sharepointUrl,
        bestandsnaam: `${basisNaam} - logbestand.pdf`,
        bytes: logPdfBytes,
        contentType: "application/pdf",
        graphToken,
      });

      const managerId = account.cr283_Manager?.systemuserid || null;
      await maakOnboardingTaak({ accountId: klant.id, managerId, bestandsUrl: offerteUrl, dataverseToken });

      contextLog(`Klant ${klant.naam}: PDF + logbestand geüpload, taak aangemaakt.`);
    } catch (e) {
      contextLog(`Klant ${klant.naam}: onboarding-verwerking mislukt: ${e.message}`);
    }
  }
}

module.exports = {
  verwerkOndertekeningNaSignering,
  genereerOffertePdf,
  genereerLogPdf,
  haalGraphToken,
  haalDataverseToken,
};
