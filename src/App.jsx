import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  FileText,
  Settings as SettingsIcon,
  Users,
  ClipboardList,
  Printer,
  Shield,
  Loader2,
  LogOut,
  Plus,
  Minus,
  Euro,
  RotateCcw,
  Layers,
  Trash2,
  PlusCircle,
  PenLine,
  BookOpen,
  ImageUp,
  Milestone,
  List,
  FolderOpen,
  Save,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mockdata — staat straks voor echte Dynamics 365-data (accounts, contacten,
// producten uit de Product Catalog / Price List).
// ---------------------------------------------------------------------------

const MOCK_USER = {
  naam: "Jasper de Vries",
  email: "jasper.devries@onzefirma.nl",
  rol: "Account Manager",
  initialen: "JV",
};

const MOCK_KLANTEN = [
  {
    id: "acc-1041",
    naam: "Van Rijn Bouwgroep B.V.",
    plaats: "Utrecht",
    contact: "M. van Rijn",
    email: "m.vanrijn@vanrijnbouw.nl",
    segment: "Bouw & Infra",
  },
  {
    id: "acc-2093",
    naam: "Noordzee Logistiek",
    plaats: "Rotterdam",
    contact: "S. Kramer",
    email: "s.kramer@noordzeelog.nl",
    segment: "Transport",
  },
  {
    id: "acc-3187",
    naam: "Heldergroen Zorginstellingen",
    plaats: "Amersfoort",
    contact: "F. Bakker",
    email: "f.bakker@heldergroen.nl",
    segment: "Zorg",
  },
  {
    id: "acc-4402",
    naam: "Studio Molenwerf",
    plaats: "Haarlem",
    contact: "T. de Boer",
    email: "t.deboer@molenwerf.studio",
    segment: "Creatief",
  },
  {
    id: "acc-5510",
    naam: "Kastermans Financieel Advies",
    plaats: "Eindhoven",
    contact: "R. Kastermans",
    email: "r.kastermans@kastermans.nl",
    segment: "Financieel",
  },
];

const CATEGORIE_LABELS = {
  eenmalig: "Eenmalige werkzaamheden",
  doorlopend: "Doorlopende dienstverlening",
};

// Status van een offerte: wordt automatisch op "verzonden" gezet bij de eerste opslag
// (= het moment van afdrukken/PDF), en is daarna handmatig te wijzigen in het overzicht.
const OFFERTE_STATUS_STANDAARD = "verzonden";
const OFFERTE_STATUSSEN = [
  { key: "in_bewerking", label: "In bewerking", kleur: "#5B6259", achtergrond: "#EEF0EC" },
  { key: "verzonden", label: "Verzonden", kleur: "#1C5D8C", achtergrond: "#EAF2F8" },
  { key: "besproken", label: "Besproken", kleur: "#8A6A1E", achtergrond: "#FBF3DE" },
  { key: "geaccepteerd", label: "Geaccepteerd", kleur: "#2E7D4F", achtergrond: "#E7F4EC" },
  { key: "niet_geaccepteerd", label: "Niet geaccepteerd", kleur: "#B14A2E", achtergrond: "#FBF2EC" },
];
function offerteStatusInfo(key) {
  return OFFERTE_STATUSSEN.find((s) => s.key === key) || OFFERTE_STATUSSEN[0];
}

let volgnr = 1;
function nieuwId(prefix) {
  volgnr += 1;
  return `${prefix}-${Date.now().toString(36)}-${volgnr}`;
}

const STANDAARD_ROADMAP = {
  titel: "90 dagen roadmap: Kennismaking → Inrichting → Borging",
  fases: [
    {
      id: "fase-1",
      markering: "W1",
      label: "WEEK 1 · KENNISMAKING",
      titel: "We leren uw organisatie en administratie kennen",
      puntenTekst:
        "Kick-off gesprek: scope, aanspreekpunten, planning\nInventarisatie van bestaande systemen en administratie\nEerste proces volledig in kaart gebracht",
      resultaatLabel: "RESULTAAT",
      resultaatTekst: "Plan van aanpak staat + nulmeting ligt vast",
    },
    {
      id: "fase-2",
      markering: "W2",
      label: "WEEK 2 · INVENTARISATIE",
      titel: "Weten wat er nodig is om goed van start te gaan",
      puntenTekst:
        "Overzicht van de huidige situatie, inclusief aandachtspunten\nPer onderdeel: wat kan direct, wat vraagt meer tijd\nPrioriteiten bepalen op basis van impact",
      resultaatLabel: "RESULTAAT",
      resultaatTekst: "Inrichtingsplan met heldere prioriteiten",
    },
    {
      id: "fase-3",
      markering: "30",
      label: "DAG 30 · EERSTE RESULTAAT",
      titel: "Eerste onderdeel staat en draait",
      puntenTekst:
        "Ingericht op basis van het plan van aanpak\nU ziet het resultaat en denkt mee waar nodig\nOplevering met korte toelichting",
      resultaatLabel: "DOEL DAG 30",
      resultaatTekst: "Eerste onderdeel bewezen en werkend",
    },
    {
      id: "fase-4",
      markering: "60",
      label: "DAG 60 · OPSCHALEN",
      titel: "Van eerste onderdeel naar volledige administratie",
      puntenTekst:
        "Resterende onderdelen gefaseerd ingericht\nWerkwijze verder afgestemd op uw organisatie\nEerste voortgangsrapportage",
      resultaatLabel: "DOEL DAG 60",
      resultaatTekst: "Volledig operationeel + eerste rapportage",
    },
    {
      id: "fase-5",
      markering: "90",
      label: "DAG 90 · BORGING",
      titel: "Vast ritme en meetbaar resultaat",
      puntenTekst:
        "Resultaat gemeten ten opzichte van de nulmeting\nVaste rapportagemomenten afgesproken\nVervolgpunten en aandachtsgebieden besproken",
      resultaatLabel: "DOEL DAG 90",
      resultaatTekst: "Vast ritme en heldere afspraken voor de lange termijn",
    },
  ],
};

const INITIAL_CATALOGUS = [
  {
    id: "svc-impl",
    categorie: "eenmalig",
    naam: "Implementatie & inrichting",
    eenheid: "traject",
    varianten: [
      { id: "v1", naam: "Klein", prijs: 750 },
      { id: "v2", naam: "Middel", prijs: 1250 },
      { id: "v3", naam: "Groot", prijs: 2000 },
    ],
  },
  {
    id: "svc-migratie",
    categorie: "eenmalig",
    naam: "Data-migratie",
    eenheid: "traject",
    varianten: [
      { id: "v1", naam: "Klein", prijs: 900 },
      { id: "v2", naam: "Middel", prijs: 1500 },
      { id: "v3", naam: "Groot", prijs: 2200 },
    ],
  },
  {
    id: "svc-training",
    categorie: "eenmalig",
    naam: "Training en uitleg systemen",
    eenheid: "dagdeel",
    varianten: [{ id: "v1", naam: "", prijs: 500 }],
  },
  {
    id: "svc-onderhoud",
    categorie: "doorlopend",
    naam: "Onderhoud & support administratie",
    eenheid: "maand",
    varianten: [
      { id: "v1", naam: "0-50 facturen", prijs: 125 },
      { id: "v2", naam: "51-100 facturen", prijs: 175 },
      { id: "v3", naam: "101-200 facturen", prijs: 250 },
      { id: "v4", naam: "201-300 facturen", prijs: 300 },
      { id: "v5", naam: "301-400 facturen", prijs: 400 },
      { id: "v6", naam: "401-500 facturen", prijs: 450 },
      { id: "v7", naam: "500+ facturen", prijs: null },
    ],
  },
  {
    id: "svc-jaarrekening",
    categorie: "doorlopend",
    naam: "Samenstellen jaarrekening, publicatiestukken en notulen",
    eenheid: "jaar",
    varianten: [
      { id: "v1", naam: "Klein", prijs: 999 },
      { id: "v2", naam: "Middel", prijs: 1499 },
      { id: "v3", naam: "Groot", prijs: 2249 },
    ],
  },
  {
    id: "svc-vpb",
    categorie: "doorlopend",
    naam: "Aangifte vennootschapsbelasting",
    eenheid: "aangifte",
    varianten: [{ id: "v1", naam: "", prijs: 399 }],
  },
  {
    id: "svc-ib",
    categorie: "doorlopend",
    naam: "Aangifte inkomstenbelasting",
    eenheid: "aangifte",
    varianten: [{ id: "v1", naam: "", prijs: 399 }],
  },
];

const STAPPEN = [
  { key: "login", label: "Aanmelden", icon: Shield },
  { key: "instellingen", label: "Afzender", icon: SettingsIcon },
  { key: "klant", label: "Klant", icon: Users },
  { key: "diensten", label: "Diensten kiezen", icon: ClipboardList },
  { key: "prijzen", label: "Prijzen", icon: Euro },
  { key: "bijlage", label: "Bijlage", icon: PenLine },
  { key: "offerte", label: "Offerte", icon: FileText },
];

function currency(n) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function datumTijd(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "—";
  }
}

function klantAdresRegels(klant) {
  const nummerDeel = `${klant.huisnummer || ""}${klant.huisnummertoevoeging || ""}`.trim();
  const straatRegel = [klant.straat, nummerDeel].filter(Boolean).join(" ");
  const plaatsRegel = [klant.postcode, klant.plaats].filter(Boolean).join(" ");
  return [straatRegel, plaatsRegel].filter(Boolean);
}

// ---------------------------------------------------------------------------
// Opslaghulp: gebruikt window.storage zolang die beschikbaar is (bijv. hier in
// Claude), en valt anders automatisch terug op de eigen Azure Function
// (/api/instellingen) — zo werkt hetzelfde bestand zowel hier als live op Azure.
// ---------------------------------------------------------------------------
async function opslagGet(sleutel) {
  if (typeof window !== "undefined" && window.storage) {
    try {
      const resultaat = await window.storage.get(sleutel, false);
      return resultaat?.value;
    } catch (e) {
      return undefined;
    }
  }
  try {
    const res = await fetch(`/api/instellingen/${encodeURIComponent(sleutel)}`);
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.value;
  } catch (e) {
    return undefined;
  }
}

async function opslagSet(sleutel, waarde) {
  if (typeof window !== "undefined" && window.storage) {
    try {
      await window.storage.set(sleutel, waarde, false);
    } catch (e) {
      console.error("Opslaan mislukt:", e); // wijziging blijft wel zichtbaar voor deze sessie
    }
    return;
  }
  try {
    const res = await fetch(`/api/instellingen/${encodeURIComponent(sleutel)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: waarde }),
    });
    if (!res.ok) {
      const foutdata = await res.json().catch(() => null);
      console.error("Opslaan mislukt:", foutdata?.detail || foutdata?.error || `HTTP ${res.status}`);
    }
  } catch (e) {
    console.error("Opslaan mislukt:", e); // wijziging blijft wel zichtbaar voor deze sessie
  }
}

async function opslagDelete(sleutel) {
  if (typeof window !== "undefined" && window.storage) {
    try {
      await window.storage.delete(sleutel, false);
    } catch (e) {
      // niets opgeslagen om te verwijderen
    }
    return;
  }
  try {
    await fetch(`/api/instellingen/${encodeURIComponent(sleutel)}`, { method: "DELETE" });
  } catch (e) {
    // niets opgeslagen om te verwijderen
  }
}

// ---------------------------------------------------------------------------
// Offertes bewaren/opzoeken/verwijderen — zelfde dual-mode aanpak als hierboven:
// gebruikt window.storage zolang die beschikbaar is (bijv. hier in Claude, met
// shared=true zodat "iedereen mag alles zien" ook hier klopt), en valt anders
// terug op de eigen Azure Functions (/api/offerte/{id} en /api/offertes).
// ---------------------------------------------------------------------------
function offerteSleutel(id) {
  return `offerte:${id}`;
}

async function offertesIndexOphalen() {
  try {
    const r = await window.storage.get("offertes-index", true);
    return r?.value ? JSON.parse(r.value) : [];
  } catch (e) {
    return [];
  }
}

async function offertesLijstOphalen() {
  if (typeof window !== "undefined" && window.storage) {
    const ids = await offertesIndexOphalen();
    const records = [];
    for (const id of ids) {
      try {
        const r = await window.storage.get(offerteSleutel(id), true);
        if (r?.value) records.push(JSON.parse(r.value));
      } catch (e) {
        // deze offerte overslaan, rest van de lijst blijft werken
      }
    }
    records.sort((a, b) => new Date(b.gewijzigdOp) - new Date(a.gewijzigdOp));
    return records.map((r) => ({
      id: r.id,
      klantNamen: r.klantNamen || [],
      klantGroepen: r.klantGroepen || [],
      status: r.status || OFFERTE_STATUS_STANDAARD,
      aangemaaktOp: r.aangemaaktOp,
      aangemaaktDoor: r.aangemaaktDoor,
      gewijzigdOp: r.gewijzigdOp,
      gewijzigdDoor: r.gewijzigdDoor,
    }));
  }
  const res = await fetch("/api/offertes");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function offerteOphalen(id) {
  if (typeof window !== "undefined" && window.storage) {
    const r = await window.storage.get(offerteSleutel(id), true);
    if (!r?.value) throw new Error("Offerte niet gevonden.");
    return JSON.parse(r.value);
  }
  const res = await fetch(`/api/offerte/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// payload mag een deelverzameling zijn van { data, klantNamen, klantGroepen, status,
// gebruikerNaam }. Ontbrekende velden worden overgenomen van het bestaande record —
// zo kan een statuswijziging (bijv. vanuit het overzicht) de rest van de offerte
// ongemoeid laten, en hoeft een volledige opslag (bij afdrukken) niet de status te
// resetten. Nieuwe offertes krijgen automatisch status "Verzonden".
async function offerteOpslaan(id, payload) {
  if (typeof window !== "undefined" && window.storage) {
    const nu = new Date().toISOString();
    let bestaandRecord = null;
    try {
      const bestaand = await window.storage.get(offerteSleutel(id), true);
      if (bestaand?.value) bestaandRecord = JSON.parse(bestaand.value);
    } catch (e) {
      // nog geen bestaand record; dit is dan de eerste opslag
    }
    const record = {
      id,
      aangemaaktOp: bestaandRecord?.aangemaaktOp || nu,
      aangemaaktDoor: bestaandRecord?.aangemaaktDoor || payload.gebruikerNaam,
      gewijzigdOp: nu,
      gewijzigdDoor: payload.gebruikerNaam,
      klantNamen: payload.klantNamen !== undefined ? payload.klantNamen : bestaandRecord?.klantNamen || [],
      klantGroepen: payload.klantGroepen !== undefined ? payload.klantGroepen : bestaandRecord?.klantGroepen || [],
      status: payload.status !== undefined ? payload.status : bestaandRecord?.status || OFFERTE_STATUS_STANDAARD,
      data: payload.data !== undefined ? payload.data : bestaandRecord?.data || {},
    };
    await window.storage.set(offerteSleutel(id), JSON.stringify(record), true);
    const ids = await offertesIndexOphalen();
    if (!ids.includes(id)) {
      ids.push(id);
      await window.storage.set("offertes-index", JSON.stringify(ids), true);
    }
    return record;
  }
  const res = await fetch(`/api/offerte/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function offertesVerwijderen(ids) {
  if (typeof window !== "undefined" && window.storage) {
    await Promise.all(
      ids.map(async (id) => {
        try {
          await window.storage.delete(offerteSleutel(id), true);
        } catch (e) {
          // niets opgeslagen om te verwijderen, of al weg
        }
      })
    );
    const huidigeIndex = await offertesIndexOphalen();
    const nieuweIndex = huidigeIndex.filter((id) => !ids.includes(id));
    await window.storage.set("offertes-index", JSON.stringify(nieuweIndex), true);
    return;
  }
  await Promise.all(
    ids.map((id) => fetch(`/api/offerte/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null))
  );
}

// Het echte Activaa-logo, ingebakken als standaardlogo. Wordt gebruikt zolang er
// geen eigen logo is geüpload via "Logo uploaden" — zo verschijnt er nooit meer
// eerst een gegenereerd placeholder-logo (initialen) voordat het echte laadt.
const ACTIVAA_LOGO = "data:image/png;base64,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";

function genereerStandaardLogo() {
  return ACTIVAA_LOGO;
}

export default function OffertetoolApp() {
  const [stap, setStap] = useState("login");
  const [terugNaarStap, setTerugNaarStap] = useState("instellingen");
  const [ingelogd, setIngelogd] = useState(false);
  const [bezigMetInloggen, setBezigMetInloggen] = useState(false);

  // Echte ingelogde gebruiker ophalen bij Azure Static Web Apps (werkt alleen op de live site,
  // niet in lokale ontwikkeling — daar valt de tool terug op de gesimuleerde inlogknop).
  const [echteGebruiker, setEchteGebruiker] = useState(null);
  const [authGecontroleerd, setAuthGecontroleerd] = useState(false);

  useEffect(() => {
    let actief = true;
    fetch("/.auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!actief) return;
        const principal = data?.clientPrincipal;
        if (principal?.userDetails) {
          // userDetails is bij Microsoft-login meestal het e-mailadres/UPN. De echte
          // weergavenaam zit (indien beschikbaar) tussen de losse "claims" van het account.
          const naamClaim = principal.claims?.find(
            (c) =>
              c.typ === "name" ||
              c.typ === "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" ||
              c.typ?.endsWith("/claims/name")
          );
          const naam = naamClaim?.val || principal.userDetails;
          const emailClaim = principal.claims?.find(
            (c) => c.typ === "preferred_username" || c.typ?.endsWith("/emailaddress")
          );
          const email = emailClaim?.val || principal.userDetails;
          setEchteGebruiker({
            naam,
            email,
            rol: "Ingelogd via Microsoft",
            initialen: naam
              .split(/[.\s@]/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join(""),
          });
          setIngelogd(true);
          setStap((huidige) => (huidige === "login" ? "instellingen" : huidige));
        }
      })
      .catch(() => {
        // /.auth/me bestaat niet (bijv. lokale ontwikkeling) — dan blijft de gesimuleerde login werken
      })
      .finally(() => {
        if (actief) setAuthGecontroleerd(true);
      });
    return () => {
      actief = false;
    };
  }, []);

  const huidigeGebruiker = echteGebruiker || MOCK_USER;

  const [afzender, setAfzender] = useState({
    bedrijf: "Onze Firma B.V.",
    adres: "Handelskade 12",
    postcode: "3011 CV",
    plaats: "Rotterdam",
    kvk: "84120933",
    ondertekenaar: MOCK_USER.naam,
    geldigheid: "30",
    inleiding:
      "Hartelijk dank voor uw interesse. Hieronder vindt u onze offerte, samengesteld op basis van het besproken traject.",
  });
  const [afzenderGeladen, setAfzenderGeladen] = useState(false);

  // Afzendergegevens laden uit persistente opslag.
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("afzender");
        if (actief && waarde) {
          setAfzender(JSON.parse(waarde));
        }
      } catch (e) {
        // nog geen afzendergegevens opgeslagen, of opslag niet beschikbaar
      }
      if (actief) setAfzenderGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  // Afzendergegevens bewaren zodra er iets in wijzigt (pas nadat de eerste keer geladen is).
  useEffect(() => {
    if (!afzenderGeladen) return;
    (async () => {
      try {
        await opslagSet("afzender", JSON.stringify(afzender));
      } catch (e) {
        console.error("Opslaan mislukt:", e); // wijzigingen blijven wel zichtbaar voor deze sessie
      }
    })();
  }, [afzender, afzenderGeladen]);

  // "Ondertekenaar" (Namens) en het bijbehorende e-mailadres volgen automatisch de echt
  // ingelogde Microsoft-gebruiker — bij elke login opnieuw, zodat elke collega (van de 10)
  // gewoon zichzelf ziet staan zonder dat iemand dit handmatig hoeft in te stellen.
  useEffect(() => {
    if (echteGebruiker && afzenderGeladen) {
      setAfzender((prev) => ({
        ...prev,
        ondertekenaar: echteGebruiker.naam,
        ondertekenaarEmail: echteGebruiker.email,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echteGebruiker, afzenderGeladen]);

  const [logo, setLogo] = useState(null); // base64/SVG data-URL van het logo, of null zolang het nog laadt
  const [logoGeladen, setLogoGeladen] = useState(false);

  // Logo laden uit persistente opslag; anders eenmalig een standaardlogo genereren en opslaan.
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("logo");
        if (actief && waarde) {
          setLogo(waarde);
          setLogoGeladen(true);
          return;
        }
      } catch (e) {
        // nog geen logo opgeslagen, of opslag niet beschikbaar — dan vullen we de standaard in
      }
      if (!actief) return;
      const standaard = genereerStandaardLogo(afzender.bedrijf);
      setLogo(standaard);
      setLogoGeladen(true);
      try {
        await opslagSet("logo", standaard);
      } catch (e) {
        console.error("Opslaan mislukt:", e); // logo blijft wel zichtbaar voor deze sessie
      }
    })();
    return () => {
      actief = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logoUploaden(bestand) {
    if (!bestand) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setLogo(dataUrl);
      try {
        await opslagSet("logo", dataUrl);
      } catch (err) {
        console.error("Opslaan mislukt:", err); // logo blijft wel zichtbaar voor deze sessie
      }
    };
    reader.readAsDataURL(bestand);
  }

  async function logoVerwijderen() {
    setLogo(null);
    try {
      await opslagDelete("logo");
    } catch (e) {
      // niets opgeslagen om te verwijderen
    }
  }

  const [dienstenCatalogus, setDienstenCatalogus] = useState(INITIAL_CATALOGUS);
  const [catalogusGeladen, setCatalogusGeladen] = useState(false);

  const [zoekKlant, setZoekKlant] = useState("");
  const [gekozenKlanten, setGekozenKlanten] = useState([]); // array van klant-objecten

  // Opgeslagen offertes: overzicht van iedereen (datum, klant(en), opgemaakt/gewijzigd door).
  const [offertesLijst, setOffertesLijst] = useState([]);
  const [offertesLijstBezig, setOffertesLijstBezig] = useState(false);
  const [offertesLijstFout, setOffertesLijstFout] = useState(false);
  // Zoeken (vrije tekst over klant, klantgroep, opgemaakt/gewijzigd door) en filteren
  // per kolom (klantgroep en opgemaakt door) in het offertes-overzicht.
  const [offertesZoekterm, setOffertesZoekterm] = useState("");
  const [offertesFilterKlantgroep, setOffertesFilterKlantgroep] = useState("");
  const [offertesFilterGebruiker, setOffertesFilterGebruiker] = useState("");
  const [offertesFilterStatus, setOffertesFilterStatus] = useState("");
  const [offerteStatusBezigId, setOfferteStatusBezigId] = useState(null);
  const [offertesPagina, setOffertesPagina] = useState(1);
  const OFFERTES_PER_PAGINA = 20;
  const [offertesSelectie, setOffertesSelectie] = useState(() => new Set());
  const [offertesVerwijderenBezig, setOffertesVerwijderenBezig] = useState(false);
  const [offertesBevestigenTonen, setOffertesBevestigenTonen] = useState(false);
  // huidigeOfferteId: null = nog niet opgeslagen (nieuwe offerte). Eenmaal opgeslagen
  // (bij het afdrukken/PDF) wordt een volgende opslag van dezelfde offerte een update
  // van hetzelfde record ("laatst gewijzigd"), in plaats van een nieuwe offerte.
  const [huidigeOfferteId, setHuidigeOfferteId] = useState(null);
  const [offerteOpslaanStatus, setOfferteOpslaanStatus] = useState("idle"); // idle | bezig | opgeslagen | fout
  // Status van de offerte die nu open staat (alleen relevant tijdens het bewerken/bekijken
  // van één offerte — het overzicht zelf houdt per rij zijn eigen status bij).
  const [huidigeOfferteStatus, setHuidigeOfferteStatus] = useState(OFFERTE_STATUS_STANDAARD);
  // Na het sluiten van het afdrukvenster vragen of de status op "Verzonden" gezet mag worden.
  const [offerteVraagStatusTonen, setOfferteVraagStatusTonen] = useState(false);

  async function laadOffertesLijst() {
    setOffertesLijstBezig(true);
    setOffertesLijstFout(false);
    try {
      const data = await offertesLijstOphalen();
      setOffertesLijst(data);
      setOffertesSelectie(new Set());
    } catch (e) {
      setOffertesLijstFout(true);
    } finally {
      setOffertesLijstBezig(false);
    }
  }

  function toggleOfferteSelectie(id) {
    setOffertesSelectie((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAlleOffertesOpPagina(ids, allesGeselecteerd) {
    setOffertesSelectie((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allesGeselecteerd ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  useEffect(() => {
    if (offertesSelectie.size === 0) setOffertesBevestigenTonen(false);
  }, [offertesSelectie]);

  async function verwijderGeselecteerdeOffertes() {
    if (offertesSelectie.size === 0) return;

    setOffertesVerwijderenBezig(true);
    try {
      const ids = [...offertesSelectie];
      await offertesVerwijderen(ids);
      // Verwijderde offerte(n) meteen uit het huidige overzicht halen, ook als een
      // vernieuwing van de lijst nog niet is uitgevoerd.
      setOffertesLijst((prev) => prev.filter((o) => !offertesSelectie.has(o.id)));
      // Wordt de op dit moment geopende offerte verwijderd? Dan de koppeling loslaten
      // zodat een volgende opslag niet per ongeluk die verwijderde offerte herschept.
      if (huidigeOfferteId && offertesSelectie.has(huidigeOfferteId)) {
        setHuidigeOfferteId(null);
      }
      setOffertesSelectie(new Set());
      setOffertesBevestigenTonen(false);
      await laadOffertesLijst();
    } finally {
      setOffertesVerwijderenBezig(false);
    }
  }

  // Alle offerte-inhoud die bij het opslaan/laden van één offerte hoort. Instellingen die
  // los beheerd worden (afzender, dienstencatalogus, standaardteksten, voorwaarden, roadmap-
  // sjabloon zelf) horen hier bewust niet bij — dat blijft gedeelde, doorlopende configuratie.
  function huidigeOfferteSnapshot() {
    return {
      gekozenKlanten,
      geselecteerd,
      klantVarianten,
      aangepastePrijzen,
      uitgeschakeldVoorKlant,
      algemeneToelichting,
      bijlageToelichtingen,
      klantToelichtingen,
      roadmapToevoegen,
    };
  }

  async function slaOfferteOp() {
    if (gekozenKlanten.length === 0) return null;
    const id = huidigeOfferteId || nieuwId("offerte");
    setOfferteOpslaanStatus("bezig");
    try {
      const record = await offerteOpslaan(id, {
        data: huidigeOfferteSnapshot(),
        klantNamen: gekozenKlanten.map((k) => k.naam),
        klantGroepen: [...new Set(gekozenKlanten.map((k) => k.segment).filter(Boolean))],
        gebruikerNaam: huidigeGebruiker?.naam || "Onbekend",
      });
      setHuidigeOfferteId(id);
      setHuidigeOfferteStatus(record?.status || OFFERTE_STATUS_STANDAARD);
      setOfferteOpslaanStatus("opgeslagen");
      return id;
    } catch (e) {
      setOfferteOpslaanStatus("fout");
      return null;
    }
  }

  async function openOfferte(id) {
    try {
      const record = await offerteOphalen(id);
      const snap = record.data || {};
      setGekozenKlanten(snap.gekozenKlanten || []);
      setGeselecteerd(snap.geselecteerd || {});
      setKlantVarianten(snap.klantVarianten || {});
      setAangepastePrijzen(snap.aangepastePrijzen || {});
      setUitgeschakeldVoorKlant(snap.uitgeschakeldVoorKlant || {});
      setAlgemeneToelichting(snap.algemeneToelichting || "");
      setBijlageToelichtingen(snap.bijlageToelichtingen || {});
      setKlantToelichtingen(snap.klantToelichtingen || {});
      setRoadmapToevoegen(!!snap.roadmapToevoegen);
      setHuidigeOfferteId(id);
      setHuidigeOfferteStatus(record.status || OFFERTE_STATUS_STANDAARD);
      setOfferteOpslaanStatus("idle");
      setOfferteVraagStatusTonen(false);
      setStap("offerte");
    } catch (e) {
      setOffertesLijstFout(true);
    }
  }

  async function wijzigOfferteStatus(id, nieuweStatus) {
    const vorige = offertesLijst;
    // Optimistisch bijwerken: meteen zichtbaar in het overzicht, ook al is de opslag
    // nog bezig — voelt direct aan. Mislukt de opslag, dan zetten we 'm terug.
    setOffertesLijst((prev) => prev.map((o) => (o.id === id ? { ...o, status: nieuweStatus } : o)));
    setOfferteStatusBezigId(id);
    try {
      await offerteOpslaan(id, {
        status: nieuweStatus,
        gebruikerNaam: huidigeGebruiker?.naam || "Onbekend",
      });
      await laadOffertesLijst();
    } catch (e) {
      setOffertesLijst(vorige);
    } finally {
      setOfferteStatusBezigId(null);
    }
  }


  function nieuweOfferte() {
    setGekozenKlanten([]);
    setGeselecteerd({});
    setKlantVarianten({});
    setAangepastePrijzen({});
    setUitgeschakeldVoorKlant({});
    setAlgemeneToelichting("");
    setBijlageToelichtingen({});
    setKlantToelichtingen({});
    setRoadmapToevoegen(false);
    setHuidigeOfferteId(null);
    setHuidigeOfferteStatus(OFFERTE_STATUS_STANDAARD);
    setOfferteOpslaanStatus("idle");
    setOfferteVraagStatusTonen(false);
    setStap("klant");
  }

  // Unieke waarden voor de filter-dropdowns, afgeleid uit de geladen offertes.
  const offertesKlantgroepen = useMemo(() => {
    const set = new Set();
    offertesLijst.forEach((o) => (o.klantGroepen || []).forEach((g) => g && set.add(g)));
    return [...set].sort((a, b) => a.localeCompare(b, "nl"));
  }, [offertesLijst]);

  const offertesGebruikers = useMemo(() => {
    const set = new Set();
    offertesLijst.forEach((o) => {
      if (o.aangemaaktDoor) set.add(o.aangemaaktDoor);
      if (o.gewijzigdDoor) set.add(o.gewijzigdDoor);
    });
    return [...set].sort((a, b) => a.localeCompare(b, "nl"));
  }, [offertesLijst]);

  // Zoeken (klant, klantgroep, opgemaakt/gewijzigd door) + kolomfilters (klantgroep,
  // opgemaakt door) samen toegepast op het overzicht.
  const gefilterdeOffertes = useMemo(() => {
    const q = offertesZoekterm.trim().toLowerCase();
    return offertesLijst.filter((o) => {
      if (offertesFilterKlantgroep && !(o.klantGroepen || []).includes(offertesFilterKlantgroep)) {
        return false;
      }
      if (
        offertesFilterGebruiker &&
        o.aangemaaktDoor !== offertesFilterGebruiker &&
        o.gewijzigdDoor !== offertesFilterGebruiker
      ) {
        return false;
      }
      if (offertesFilterStatus && (o.status || OFFERTE_STATUS_STANDAARD) !== offertesFilterStatus) {
        return false;
      }
      if (!q) return true;
      const doorzoekbaar = [
        ...(o.klantNamen || []),
        ...(o.klantGroepen || []),
        o.aangemaaktDoor || "",
        o.gewijzigdDoor || "",
        offerteStatusInfo(o.status).label,
      ]
        .join(" ")
        .toLowerCase();
      return doorzoekbaar.includes(q);
    });
  }, [offertesLijst, offertesZoekterm, offertesFilterKlantgroep, offertesFilterGebruiker, offertesFilterStatus]);

  // Bij elke wijziging in zoekterm/filters (of een nieuw geladen lijst) weer bij pagina 1 beginnen.
  useEffect(() => {
    setOffertesPagina(1);
  }, [offertesZoekterm, offertesFilterKlantgroep, offertesFilterGebruiker, offertesFilterStatus, offertesLijst]);

  const offertesTotaalPaginas = Math.max(1, Math.ceil(gefilterdeOffertes.length / OFFERTES_PER_PAGINA));
  const offertesPaginaVeilig = Math.min(offertesPagina, offertesTotaalPaginas);
  const gepagineerdeOffertes = gefilterdeOffertes.slice(
    (offertesPaginaVeilig - 1) * OFFERTES_PER_PAGINA,
    offertesPaginaVeilig * OFFERTES_PER_PAGINA
  );

  // geselecteerd: { [dienstId]: { aantal } }
  const [geselecteerd, setGeselecteerd] = useState({});
  // klantVarianten: "klantId::dienstId" -> gekozen variantId (per klant instelbaar, bijv. Klein/Middel/Groot)
  const [klantVarianten, setKlantVarianten] = useState({});
  // aangepastePrijzen: "klantId::dienstId" -> handmatige prijs (string of number)
  const [aangepastePrijzen, setAangepastePrijzen] = useState({});
  // uitgeschakeldVoorKlant: "klantId::dienstId" -> true als deze dienst voor déze klant uitstaat,
  // terwijl hij voor andere klanten wel meegenomen wordt
  const [uitgeschakeldVoorKlant, setUitgeschakeldVoorKlant] = useState({});
  // bijlageToelichtingen: "dienstId" -> vrije tekst voor de gezamenlijke bijlage
  const [bijlageToelichtingen, setBijlageToelichtingen] = useState({});
  // algemeneToelichting: vrije tekst die los van een specifieke dienst in de bijlage komt
  const [algemeneToelichting, setAlgemeneToelichting] = useState("");
  // klantToelichtingen: "klantId" -> klantspecifieke tekst, komt op de offerte van díe klant
  const [klantToelichtingen, setKlantToelichtingen] = useState({});
  const [bijlageGeladen, setBijlageGeladen] = useState(false);

  // Bijlage-teksten (algemeen, per dienst, per klant) laden uit persistente opslag.
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const [algemeenWaarde, perDienstWaarde, perKlantWaarde] = await Promise.all([
          opslagGet("bijlage-algemeen"),
          opslagGet("bijlage-per-dienst"),
          opslagGet("bijlage-per-klant"),
        ]);
        if (actief) {
          if (algemeenWaarde) setAlgemeneToelichting(algemeenWaarde);
          if (perDienstWaarde) setBijlageToelichtingen(JSON.parse(perDienstWaarde));
          if (perKlantWaarde) setKlantToelichtingen(JSON.parse(perKlantWaarde));
        }
      } catch (e) {
        // nog niets opgeslagen, of opslag niet beschikbaar
      }
      if (actief) setBijlageGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  // Bijlage-teksten bewaren zodra er iets in wijzigt (pas nadat de eerste keer geladen is).
  useEffect(() => {
    if (!bijlageGeladen) return;
    (async () => {
      try {
        await opslagSet("bijlage-algemeen", algemeneToelichting);
      } catch (e) {}
    })();
  }, [algemeneToelichting, bijlageGeladen]);

  useEffect(() => {
    if (!bijlageGeladen) return;
    (async () => {
      try {
        await opslagSet("bijlage-per-dienst", JSON.stringify(bijlageToelichtingen));
      } catch (e) {}
    })();
  }, [bijlageToelichtingen, bijlageGeladen]);

  useEffect(() => {
    if (!bijlageGeladen) return;
    (async () => {
      try {
        await opslagSet("bijlage-per-klant", JSON.stringify(klantToelichtingen));
      } catch (e) {}
    })();
  }, [klantToelichtingen, bijlageGeladen]);

  // standaardTeksten: herbruikbare standaardteksten, net als de dienstencatalogus zelf te beheren
  const [standaardTeksten, setStandaardTeksten] = useState({
    algemeen: "",
    perDienst: {}, // { [dienstId]: tekst }
  });
  const [tekstenGeladen, setTekstenGeladen] = useState(false);

  // algemeneVoorwaarden: los te beheren, verschijnt als klikbare link op elke offerte
  const [algemeneVoorwaarden, setAlgemeneVoorwaarden] = useState({
    titel: "Algemene Voorwaarden",
    url: "https://activaa.nl/wp-content/uploads/2022/03/Algemene-Voorwaarden-Nederland-2022.pdf",
  });
  const [voorwaardenGeladen, setVoorwaardenGeladen] = useState(false);

  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("algemenevoorwaarden");
        if (actief && waarde) {
          const geparsed = JSON.parse(waarde);
          // Alleen titel en url overnemen — een eventueel oud 'tekst'-veld (uit een eerdere
          // versie van de tool) wordt hiermee genegeerd en bij de volgende opslag opgeschoond.
          setAlgemeneVoorwaarden((prev) => ({
            titel: geparsed.titel || prev.titel,
            url: geparsed.url ?? prev.url,
          }));
        }
      } catch (e) {
        // nog geen eigen voorwaarden opgeslagen — dan blijft de standaardtekst staan
      }
      if (actief) setVoorwaardenGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  useEffect(() => {
    if (!voorwaardenGeladen) return;
    (async () => {
      try {
        await opslagSet("algemenevoorwaarden", JSON.stringify(algemeneVoorwaarden));
      } catch (e) {
        console.error("Opslaan mislukt:", e);
      }
    })();
  }, [algemeneVoorwaarden, voorwaardenGeladen]);

  // roadmap: beheerbare, in Azure opgeslagen roadmap (net als de voorwaarden).
  const [roadmap, setRoadmap] = useState(STANDAARD_ROADMAP);
  const [roadmapGeladen, setRoadmapGeladen] = useState(false);
  // roadmapToevoegen: per-offerte aan/uit-schakelaar, geen bewaarde instelling maar een keuze per keer.
  const [roadmapToevoegen, setRoadmapToevoegen] = useState(false);

  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("roadmap");
        if (actief && waarde) {
          setRoadmap(JSON.parse(waarde));
        }
      } catch (e) {
        // nog geen eigen roadmap opgeslagen — dan blijft de standaardroadmap staan
      }
      if (actief) setRoadmapGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  useEffect(() => {
    if (!roadmapGeladen) return;
    (async () => {
      try {
        await opslagSet("roadmap", JSON.stringify(roadmap));
      } catch (e) {
        console.error("Opslaan mislukt:", e);
      }
    })();
  }, [roadmap, roadmapGeladen]);

  function voegFaseToe() {
    setRoadmap((prev) => ({
      ...prev,
      fases: [
        ...prev.fases,
        {
          id: nieuwId("fase"),
          markering: "•",
          label: "NIEUWE FASE",
          titel: "Titel van deze fase",
          puntenTekst: "",
          resultaatLabel: "RESULTAAT",
          resultaatTekst: "",
        },
      ],
    }));
  }
  function verwijderFase(id) {
    setRoadmap((prev) => ({ ...prev, fases: prev.fases.filter((f) => f.id !== id) }));
  }
  function bijwerkFase(id, veld, waarde) {
    setRoadmap((prev) => ({
      ...prev,
      fases: prev.fases.map((f) => (f.id === id ? { ...f, [veld]: waarde } : f)),
    }));
  }

  // Dienstencatalogus laden uit persistente opslag (valt terug op de ingebouwde standaardlijst).
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("dienstencatalogus");
        if (actief && waarde) {
          setDienstenCatalogus(JSON.parse(waarde));
        }
      } catch (e) {
        // nog niets opgeslagen, of opslag niet beschikbaar — dan blijft de standaardcatalogus staan
      }
      if (actief) setCatalogusGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  // Dienstencatalogus bewaren zodra er iets in wijzigt (pas nadat de eerste keer geladen is).
  useEffect(() => {
    if (!catalogusGeladen) return;
    (async () => {
      try {
        await opslagSet("dienstencatalogus", JSON.stringify(dienstenCatalogus));
      } catch (e) {
        console.error("Opslaan mislukt:", e); // wijzigingen blijven wel zichtbaar voor deze sessie
      }
    })();
  }, [dienstenCatalogus, catalogusGeladen]);

  // Standaardteksten laden uit persistente opslag.
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const waarde = await opslagGet("standaardteksten");
        if (actief && waarde) {
          setStandaardTeksten(JSON.parse(waarde));
        }
      } catch (e) {
        // nog geen standaardteksten opgeslagen, of opslag niet beschikbaar
      }
      if (actief) setTekstenGeladen(true);
    })();
    return () => {
      actief = false;
    };
  }, []);

  // Standaardteksten bewaren zodra er iets in wijzigt (pas nadat de eerste keer geladen is).
  useEffect(() => {
    if (!tekstenGeladen) return;
    (async () => {
      try {
        await opslagSet("standaardteksten", JSON.stringify(standaardTeksten));
      } catch (e) {
        console.error("Opslaan mislukt:", e); // wijzigingen blijven wel zichtbaar voor deze sessie
      }
    })();
  }, [standaardTeksten, tekstenGeladen]);

  // Klanten ophalen bij de eigen Dynamics-koppeling (Azure Function op /api/klanten).
  // Lukt dit niet (nog niet geconfigureerd, lokale ontwikkeling, of een fout) dan valt
  // de tool terug op de voorbeeldklanten, zodat de tool altijd blijft werken.
  const [klantenBron, setKlantenBron] = useState(MOCK_KLANTEN);
  const [klantenUitDynamics, setKlantenUitDynamics] = useState(false);
  const [klantenFoutmelding, setKlantenFoutmelding] = useState(null);
  const [klantenMeerBeschikbaar, setKlantenMeerBeschikbaar] = useState(false);
  const [klantenLaden, setKlantenLaden] = useState(false);

  async function haalKlantenOp(zoekterm) {
    setKlantenLaden(true);
    try {
      const url = zoekterm ? `/api/klanten?zoek=${encodeURIComponent(zoekterm)}` : "/api/klanten";
      const res = await fetch(url);
      if (!res.ok) {
        const foutdata = await res.json().catch(() => null);
        throw new Error(foutdata?.detail || foutdata?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setKlantenMeerBeschikbaar(data.length > 10);
        setKlantenBron(data.slice(0, 10));
        setKlantenUitDynamics(true);
        setKlantenFoutmelding(null);
      }
    } catch (err) {
      // API niet bereikbaar (bijv. lokale ontwikkeling) geeft een generieke fetch-fout —
      // dat tonen we niet als "fout", want dat is normaal. Een fout mét inhoud (vanuit
      // onze eigen Azure Function) tonen we wél, want die is nuttig om te debuggen.
      if (err.message && err.message !== "Failed to fetch") {
        setKlantenFoutmelding(err.message);
      }
    } finally {
      setKlantenLaden(false);
    }
  }

  // Eerste keer laden: standaardlijst (alfabetisch, eerste 10).
  useEffect(() => {
    haalKlantenOp("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bij elke wijziging in het zoekveld: de zoekopdracht bij Dynamics zelf uitvoeren
  // (server-side), zodat álle klanten vindbaar zijn — niet alleen een vooraf geladen setje.
  // Een korte pauze (debounce) voorkomt dat elke toetsaanslag meteen een aanroep doet.
  useEffect(() => {
    if (!klantenUitDynamics) return; // nog geen live koppeling; dan lokaal filteren op voorbeelddata
    const timer = setTimeout(() => {
      haalKlantenOp(zoekKlant.trim());
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoekKlant, klantenUitDynamics]);

  const gefilterdeKlanten = useMemo(() => {
    if (klantenUitDynamics) return klantenBron; // al server-side gefilterd en beperkt
    const q = zoekKlant.trim().toLowerCase();
    if (!q) return klantenBron;
    return klantenBron.filter(
      (k) =>
        k.naam.toLowerCase().includes(q) ||
        (k.plaats || "").toLowerCase().includes(q) ||
        (k.segment || "").toLowerCase().includes(q)
    );
  }, [zoekKlant, klantenBron, klantenUitDynamics]);

  const heeftMeerResultaten = klantenUitDynamics ? klantenMeerBeschikbaar : gefilterdeKlanten.length > 10;

  function dienstById(id) {
    return dienstenCatalogus.find((d) => d.id === id);
  }
  function variantById(dienst, variantId) {
    return dienst?.varianten.find((v) => v.id === variantId);
  }

  const geselecteerdeEntries = useMemo(() => {
    return Object.keys(geselecteerd)
      .map((dienstId) => {
        const dienst = dienstById(dienstId);
        if (!dienst) return null;
        const info = geselecteerd[dienstId];
        return { dienst, aantal: info.aantal || 1 };
      })
      .filter(Boolean);
  }, [geselecteerd, dienstenCatalogus]);

  function toggleDienstSelectie(dienst) {
    setGeselecteerd((prev) => {
      const next = { ...prev };
      if (next[dienst.id]) {
        delete next[dienst.id];
      } else {
        next[dienst.id] = { aantal: 1 };
      }
      return next;
    });
    wisPrijsOverridesVoorDienst(dienst.id);
    wisUitschakelingenVoorDienst(dienst.id);
  }

  function isUitgeschakeldVoorKlant(klantId, dienstId) {
    return !!uitgeschakeldVoorKlant[prijsSleutel(klantId, dienstId)];
  }

  function toggleDienstVoorKlant(klantId, dienstId) {
    setUitgeschakeldVoorKlant((prev) => {
      const key = prijsSleutel(klantId, dienstId);
      return { ...prev, [key]: !prev[key] };
    });
  }

  function wisUitschakelingenVoorDienst(dienstId) {
    setUitgeschakeldVoorKlant((prev) => {
      const next = {};
      Object.entries(prev).forEach(([key, val]) => {
        if (!key.endsWith(`::${dienstId}`)) next[key] = val;
      });
      return next;
    });
  }

  function variantVoorKlant(klantId, dienst) {
    const key = prijsSleutel(klantId, dienst.id);
    const gekozenId = klantVarianten[key];
    return variantById(dienst, gekozenId) || dienst.varianten[0];
  }

  function kiesVariantVoorKlant(klantId, dienstId, variantId) {
    setKlantVarianten((prev) => ({
      ...prev,
      [prijsSleutel(klantId, dienstId)]: variantId,
    }));
    resetPrijs(klantId, dienstId);
  }

  function zetAantal(dienstId, aantal) {
    setGeselecteerd((prev) => ({
      ...prev,
      [dienstId]: { ...prev[dienstId], aantal: Math.max(1, aantal) },
    }));
  }

  function wisPrijsOverridesVoorDienst(dienstId) {
    setAangepastePrijzen((prev) => {
      const next = {};
      Object.entries(prev).forEach(([key, val]) => {
        if (!key.endsWith(`::${dienstId}`)) next[key] = val;
      });
      return next;
    });
  }

  function prijsSleutel(klantId, dienstId) {
    return `${klantId}::${dienstId}`;
  }

  function catalogusPrijsVoor(klantId, dienst) {
    const variant = variantVoorKlant(klantId, dienst);
    if (variant?.prijs === null) return { prijs: 0, opAanvraag: true, opNacalculatie: false, variant };
    if (variant?.prijs === "nacalculatie") return { prijs: 0, opAanvraag: false, opNacalculatie: true, variant };
    return { prijs: variant?.prijs ?? 0, opAanvraag: false, opNacalculatie: false, variant };
  }

  function prijsVoor(klantId, dienst) {
    const key = prijsSleutel(klantId, dienst.id);
    const override = aangepastePrijzen[key];
    const catalogus = catalogusPrijsVoor(klantId, dienst);
    if (override !== undefined && override !== "" && override !== null) {
      return { prijs: Number(override), opAanvraag: false, opNacalculatie: false, variant: catalogus.variant };
    }
    return catalogus;
  }

  function zetPrijs(klantId, dienstId, waarde) {
    setAangepastePrijzen((prev) => ({
      ...prev,
      [prijsSleutel(klantId, dienstId)]: waarde,
    }));
  }

  function resetPrijs(klantId, dienstId) {
    setAangepastePrijzen((prev) => {
      const next = { ...prev };
      delete next[prijsSleutel(klantId, dienstId)];
      return next;
    });
  }

  function regelsVoorKlant(klantId) {
    return geselecteerdeEntries
      .filter(({ dienst }) => !isUitgeschakeldVoorKlant(klantId, dienst.id))
      .map(({ dienst, aantal }) => {
        const { prijs, opAanvraag, opNacalculatie, variant } = prijsVoor(klantId, dienst);
        return {
          id: dienst.id,
          naam: variant?.naam ? `${dienst.naam} — ${variant.naam}` : dienst.naam,
          eenheid: dienst.eenheid,
          categorie: dienst.categorie,
          aantal,
          prijs,
          opAanvraag,
          opNacalculatie,
          subtotaal: opAanvraag || opNacalculatie ? 0 : aantal * prijs,
        };
      });
  }

  const heeftMeerdereVarianten = geselecteerdeEntries.some(({ dienst }) => dienst.varianten.length > 1);

  // ---------------- Catalogusbeheer ----------------
  function voegDienstToe(categorie) {
    setDienstenCatalogus((prev) => [
      ...prev,
      {
        id: nieuwId("svc"),
        categorie,
        naam: "Nieuwe dienst",
        eenheid: "stuk",
        varianten: [{ id: nieuwId("v"), naam: "", prijs: 0 }],
      },
    ]);
  }
  function verwijderDienst(id) {
    setDienstenCatalogus((prev) => prev.filter((d) => d.id !== id));
    setGeselecteerd((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    wisPrijsOverridesVoorDienst(id);
  }
  function bijwerkDienstVeld(id, veld, waarde) {
    setDienstenCatalogus((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [veld]: waarde } : d))
    );
  }
  function voegVariantToe(dienstId) {
    setDienstenCatalogus((prev) =>
      prev.map((d) =>
        d.id === dienstId
          ? { ...d, varianten: [...d.varianten, { id: nieuwId("v"), naam: "", prijs: 0 }] }
          : d
      )
    );
  }
  function verwijderVariant(dienstId, variantId) {
    setDienstenCatalogus((prev) =>
      prev.map((d) =>
        d.id === dienstId
          ? { ...d, varianten: d.varianten.filter((v) => v.id !== variantId) }
          : d
      )
    );
  }
  function bijwerkVariant(dienstId, variantId, veld, waarde) {
    setDienstenCatalogus((prev) =>
      prev.map((d) =>
        d.id === dienstId
          ? {
              ...d,
              varianten: d.varianten.map((v) =>
                v.id === variantId ? { ...v, [veld]: waarde } : v
              ),
            }
          : d
      )
    );
  }

  function toggleKlant(k) {
    setGekozenKlanten((prev) =>
      prev.some((x) => x.id === k.id)
        ? prev.filter((x) => x.id !== k.id)
        : [...prev, k]
    );
  }

  function startLogin() {
    setBezigMetInloggen(true);
    setTimeout(() => {
      setBezigMetInloggen(false);
      setIngelogd(true);
      setStap("instellingen");
    }, 1400);
  }

  function uitloggen() {
    const wasEchteMicrosoftLogin = !!echteGebruiker;
    setIngelogd(false);
    setEchteGebruiker(null);
    setGekozenKlanten([]);
    setGeselecteerd({});
    setKlantVarianten({});
    setAangepastePrijzen({});
    setUitgeschakeldVoorKlant({});
    setHuidigeOfferteId(null);
    setHuidigeOfferteStatus(OFFERTE_STATUS_STANDAARD);
    setOfferteOpslaanStatus("idle");
    setOfferteVraagStatusTonen(false);
    setStap("login");
    // Stuurt de browser naar het ingebouwde logout-endpoint van Azure Static Web
    // Apps, zodat ook de échte Microsoft-sessie wordt beëindigd. Dat endpoint
    // bestaat alleen als er ook echt via Microsoft is ingelogd (dus niet in de
    // gesimuleerde/demo-login) — anders zou deze regel de pagina onnodig verlaten.
    if (wasEchteMicrosoftLogin) {
      window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
    }
  }

  function stapIndex(key) {
    return STAPPEN.findIndex((s) => s.key === key);
  }
  function volgende() {
    const i = stapIndex(stap);
    if (i < STAPPEN.length - 1) setStap(STAPPEN[i + 1].key);
  }
  function vorige() {
    const i = stapIndex(stap);
    if (i > 0) setStap(STAPPEN[i - 1].key);
  }
  const BEHEERSCHERMEN = ["catalogus", "teksten", "voorwaarden", "roadmap", "offertes"];
  function openCatalogus() {
    if (!BEHEERSCHERMEN.includes(stap)) setTerugNaarStap(stap);
    setStap("catalogus");
  }
  function openTeksten() {
    if (!BEHEERSCHERMEN.includes(stap)) setTerugNaarStap(stap);
    setStap("teksten");
  }
  function openVoorwaarden() {
    if (!BEHEERSCHERMEN.includes(stap)) setTerugNaarStap(stap);
    setStap("voorwaarden");
  }
  function openRoadmap() {
    if (!BEHEERSCHERMEN.includes(stap)) setTerugNaarStap(stap);
    setStap("roadmap");
  }
  function openOffertesOverzicht() {
    if (!BEHEERSCHERMEN.includes(stap)) setTerugNaarStap(stap);
    setStap("offertes");
    laadOffertesLijst();
  }

  function bijwerkStandaardAlgemeen(tekst) {
    setStandaardTeksten((prev) => ({ ...prev, algemeen: tekst }));
  }
  function bijwerkStandaardDienstTekst(dienstId, tekst) {
    setStandaardTeksten((prev) => ({ ...prev, perDienst: { ...prev.perDienst, [dienstId]: tekst } }));
  }

  // Standaardteksten automatisch invullen zodra diensten geselecteerd zijn — werkt ongeacht
  // via welke stap de gebruiker bij de offerte terechtkomt, niet alleen via de Bijlage-stap.
  useEffect(() => {
    if (!tekstenGeladen || !bijlageGeladen) return;
    setBijlageToelichtingen((prev) => {
      let gewijzigd = false;
      const next = { ...prev };
      geselecteerdeEntries.forEach(({ dienst }) => {
        const standaard = standaardTeksten.perDienst[dienst.id];
        if (standaard && (!next[dienst.id] || next[dienst.id].trim() === "")) {
          next[dienst.id] = standaard;
          gewijzigd = true;
        }
      });
      return gewijzigd ? next : prev;
    });
    setAlgemeneToelichting((prev) =>
      prev.trim() === "" && standaardTeksten.algemeen.trim() !== "" ? standaardTeksten.algemeen : prev
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geselecteerdeEntries, standaardTeksten, tekstenGeladen, bijlageGeladen]);

  function naarBijlage() {
    setStap("bijlage");
  }

  async function afdrukken() {
    // Offerte automatisch opslaan/bijwerken op het moment van afdrukken/PDF maken.
    // Print blijft ook doorgaan als het opslaan onverhoopt mislukt (bijv. opslag
    // nog niet geconfigureerd) — dat mag het maken van de offerte niet blokkeren.
    await slaOfferteOp();

    // Zodra het afdrukvenster weer sluit (gebruiker heeft afgedrukt of geannuleerd),
    // vragen of de status naar "Verzonden" mag — maar alleen als dat nog niet de
    // status is (voorkomt onnodig vragen bij elke herafdruk van een reeds verzonden/
    // besproken/geaccepteerde offerte).
    const vraagStatus = () => {
      window.removeEventListener("afterprint", vraagStatus);
      if (huidigeOfferteStatus !== "verzonden") {
        setOfferteVraagStatusTonen(true);
      }
    };
    window.addEventListener("afterprint", vraagStatus, { once: true });
    window.print();
  }

  async function zetOfferteOpVerzonden() {
    if (!huidigeOfferteId) {
      setOfferteVraagStatusTonen(false);
      return;
    }
    try {
      await offerteOpslaan(huidigeOfferteId, {
        status: "verzonden",
        gebruikerNaam: huidigeGebruiker?.naam || "Onbekend",
      });
      setHuidigeOfferteStatus("verzonden");
    } catch (e) {
      // status-wijziging mislukt; blijft op de vorige status staan, kan later via het overzicht
    } finally {
      setOfferteVraagStatusTonen(false);
    }
  }

  const kanNaarDiensten = gekozenKlanten.length > 0;
  const kanNaarPrijzen = geselecteerdeEntries.length > 0;
  const kanNaarOfferte = geselecteerdeEntries.length > 0;

  return (
    <div
      style={{
        fontFamily:
          "'Source Sans 3', 'Segoe UI', system-ui, -apple-system, sans-serif",
        background: "#F5F6F4",
        color: "#1C2321",
        minHeight: "100%",
      }}
    >
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/fraunces');
        .offertetool-serif { font-family: 'Fraunces', 'Georgia', serif; }
        .ot-card { background:#fff; border:1px solid #E2E4DF; border-radius: 10px; }
        .ot-btn-primary {
          background:#1C5D8C; color:#F5F6F4; border:1px solid #1C5D8C;
          border-radius: 8px; padding: 10px 18px; font-weight:600; font-size:14px;
          display:inline-flex; align-items:center; gap:8px; cursor:pointer;
          transition: background .15s ease;
        }
        .ot-btn-primary:hover:not(:disabled) { background:#123F5E; }
        .ot-btn-primary:disabled { opacity:.4; cursor:not-allowed; }
        .ot-btn-secondary {
          background:#fff; color:#1C5D8C; border:1px solid #C8CDC5;
          border-radius: 8px; padding: 10px 18px; font-weight:600; font-size:14px;
          display:inline-flex; align-items:center; gap:8px; cursor:pointer;
        }
        .ot-btn-secondary:hover { border-color:#1C5D8C; }
        .ot-btn-ghost {
          background:transparent; color:#1C5D8C; border:none; padding:4px 6px;
          font-weight:600; font-size:12.5px; display:inline-flex; align-items:center; gap:5px; cursor:pointer;
        }
        .ot-btn-ghost:hover { text-decoration:underline; }
        .ot-input {
          border:1px solid #C8CDC5; border-radius:8px; padding:9px 12px; font-size:14px;
          width:100%; background:#fff; color:#1C2321;
        }
        .ot-input:focus { outline:2px solid #B98237; outline-offset:1px; }
        .ot-input:disabled { background:#F0F0EC; color:#A5AA9F; }
        .ot-label { font-size:12px; font-weight:600; color:#5B6259; text-transform:uppercase; letter-spacing:.04em; margin-bottom:6px; display:block; }
        .ot-pill {
          border:1.5px solid #C8CDC5; background:#fff; color:#1C2321; border-radius:20px;
          padding:6px 13px; font-size:12.5px; font-weight:600; cursor:pointer;
        }
        .ot-pill.actief { border-color:#1C5D8C; background:#1C5D8C; color:#fff; }
        .ot-cat-koptekst {
          font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:.06em;
          color:#B98237; margin: 26px 0 10px; display:flex; align-items:center; justify-content:space-between;
        }
        .ot-cat-koptekst:first-child { margin-top:0; }
        @page {
          size: A4;
          margin: 12mm;
        }
        @media print {
          body * { visibility: hidden; }
          #offerte-print-gebied, #offerte-print-gebied * { visibility: visible; }
          #offerte-print-gebied {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .offerte-doc { break-after: page; page-break-after: always; margin-bottom: 0 !important; }
          .offerte-doc:last-of-type { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      {/* Topbalk */}
      <div style={{ borderBottom: "1px solid #E2E4DF", background: "#FFFFFF" }}>
        <div
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: logo ? "transparent" : "#1C5D8C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {logo ? (
                <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <FileText size={18} color="#F5F6F4" />
              )}
            </div>
            <div>
              <div className="offertetool-serif" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.1 }}>
                Offertetool
              </div>
              <div style={{ fontSize: 11.5, color: "#8A9089" }}>gekoppeld aan Microsoft Dynamics</div>
            </div>
          </div>

          {ingelogd && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{huidigeGebruiker.naam}</div>
                <div style={{ fontSize: 11.5, color: "#8A9089" }}>{huidigeGebruiker.rol}</div>
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#B98237",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {huidigeGebruiker.initialen}
              </div>
              <button
                onClick={uitloggen}
                title="Afmelden"
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#8A9089", display: "flex" }}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stappenbalk */}
      {ingelogd && (
        <div style={{ borderBottom: "1px solid #E2E4DF", background: "#FBFBF9" }}>
          <div
            style={{
              maxWidth: 1040,
              margin: "0 auto",
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {STAPPEN.filter((s) => s.key !== "login").map((s) => {
                const actief = s.key === stap;
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStap(s.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "none",
                      background: actief ? "#1C5D8C" : "transparent",
                      color: actief ? "#fff" : "#1C5D8C",
                      padding: "7px 12px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={14} />
                    {s.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={openCatalogus}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #C8CDC5",
                  background: stap === "catalogus" ? "#1C5D8C" : "#fff",
                  color: stap === "catalogus" ? "#fff" : "#5B6259",
                  padding: "7px 12px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Layers size={14} />
                Diensten beheren
              </button>
              <button
                onClick={openTeksten}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #C8CDC5",
                  background: stap === "teksten" ? "#1C5D8C" : "#fff",
                  color: stap === "teksten" ? "#fff" : "#5B6259",
                  padding: "7px 12px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <BookOpen size={14} />
                Teksten beheren
              </button>
              <button
                onClick={openVoorwaarden}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #C8CDC5",
                  background: stap === "voorwaarden" ? "#1C5D8C" : "#fff",
                  color: stap === "voorwaarden" ? "#fff" : "#5B6259",
                  padding: "7px 12px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <FileText size={14} />
                Voorwaarden beheren
              </button>
              <button
                onClick={openRoadmap}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #C8CDC5",
                  background: stap === "roadmap" ? "#1C5D8C" : "#fff",
                  color: stap === "roadmap" ? "#fff" : "#5B6259",
                  padding: "7px 12px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Milestone size={14} />
                Roadmap beheren
              </button>
              <button
                onClick={openOffertesOverzicht}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "1px solid #C8CDC5",
                  background: stap === "offertes" ? "#1C5D8C" : "#fff",
                  color: stap === "offertes" ? "#fff" : "#5B6259",
                  padding: "7px 12px",
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <List size={14} />
                Offertes
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 24px 60px" }}>
        {/* -------------------- LOGIN -------------------- */}
        {stap === "login" && !authGecontroleerd && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80, color: "#8A9089", fontSize: 13.5 }}>
            Bezig met inloggen controleren…
          </div>
        )}
        {stap === "login" && authGecontroleerd && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
            <div className="ot-card" style={{ width: 420, padding: 36, textAlign: "center" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "#F0EEE6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                }}
              >
                <Building2 size={26} color="#1C5D8C" />
              </div>
              <h1 className="offertetool-serif" style={{ fontSize: 22, marginBottom: 6 }}>
                Welkom bij de offertetool
              </h1>
              <p style={{ fontSize: 13.5, color: "#5B6259", marginBottom: 26, lineHeight: 1.5 }}>
                Meld u aan met uw Microsoft-account. Uw rechten in Dynamics bepalen welke
                klanten en gegevens u kunt ophalen.
              </p>
              <button
                className="ot-btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={startLogin}
                disabled={bezigMetInloggen}
              >
                {bezigMetInloggen ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Rechten controleren…
                  </>
                ) : (
                  <>
                    <MicrosoftLogo />
                    Aanmelden met Microsoft
                  </>
                )}
              </button>
              <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
              <p style={{ fontSize: 11.5, color: "#A5AA9F", marginTop: 18 }}>
                Dit is een demo-omgeving met voorbeelddata. Er wordt geen echte
                Microsoft-verbinding gemaakt.
              </p>
            </div>
          </div>
        )}

        {/* -------------------- INSTELLINGEN / AFZENDER -------------------- */}
        {stap === "instellingen" && (
          <StapWrapper
            titel="Wie schrijven we aan namens?"
            toelichting="Deze gegevens komen op elke offerte te staan. Standaard ingevuld vanuit Activaa CRM - profiel — je kunt ze per offerte aanpassen."
          >
            <div className="ot-card" style={{ padding: 24, display: "grid", gap: 16 }}>
              <div>
                <label className="ot-label">Logo</label>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 10,
                      border: "1px dashed #C8CDC5",
                      background: "#FBFBF9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {logo ? (
                      <img src={logo} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <Building2 size={24} color="#B4B9AE" />
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label className="ot-btn-secondary" style={{ width: "fit-content", cursor: "pointer" }}>
                      <ImageUp size={15} />
                      {logo ? "Ander logo kiezen" : "Logo kiezen"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => logoUploaden(e.target.files?.[0])}
                        style={{ display: "none" }}
                      />
                    </label>
                    {logo && (
                      <button className="ot-btn-ghost" style={{ width: "fit-content" }} onClick={logoVerwijderen}>
                        Logo verwijderen
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 11.5, color: "#8A9089", marginTop: 8 }}>
                  Verschijnt in de menubalk en op elke offerte. Een PNG met transparante achtergrond werkt het best. Wordt automatisch bewaard, ook na herladen of opnieuw inloggen.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="ot-label">Bedrijfsnaam</label>
                  <input className="ot-input" value={afzender.bedrijf} onChange={(e) => setAfzender({ ...afzender, bedrijf: e.target.value })} />
                </div>
                <div>
                  <label className="ot-label">KvK-nummer</label>
                  <input className="ot-input" value={afzender.kvk} onChange={(e) => setAfzender({ ...afzender, kvk: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="ot-label">Adres (straat en huisnummer)</label>
                <input className="ot-input" value={afzender.adres} onChange={(e) => setAfzender({ ...afzender, adres: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
                <div>
                  <label className="ot-label">Postcode</label>
                  <input className="ot-input" value={afzender.postcode} onChange={(e) => setAfzender({ ...afzender, postcode: e.target.value })} />
                </div>
                <div>
                  <label className="ot-label">Plaats</label>
                  <input className="ot-input" value={afzender.plaats} onChange={(e) => setAfzender({ ...afzender, plaats: e.target.value })} />
                </div>
              </div>
              <div
                style={{
                  padding: "12px 14px",
                  background: "#EAF2F8",
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: "#1C5D8C",
                }}
              >
                <strong>Ondertekenaar (Namens):</strong> {huidigeGebruiker.naam}
                {huidigeGebruiker.email && huidigeGebruiker.email !== huidigeGebruiker.naam
                  ? ` · ${huidigeGebruiker.email}`
                  : ""}
                <div style={{ color: "#5B6259", marginTop: 2 }}>
                  Dit wordt automatisch bepaald aan de hand van wie is ingelogd — elke collega ziet hier zichzelf staan.
                </div>
              </div>
              <div>
                <label className="ot-label">Inleidende tekst op de offerte</label>
                <textarea className="ot-input" rows={3} value={afzender.inleiding} onChange={(e) => setAfzender({ ...afzender, inleiding: e.target.value })} />
              </div>
            </div>

            <div className="ot-card" style={{ padding: 24, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <label className="ot-label" style={{ marginBottom: 2 }}>Geldigheid offerte</label>
                <p style={{ fontSize: 12.5, color: "#8A9089", margin: 0 }}>
                  Aantal dagen dat een offerte geldig is nadat deze is opgesteld.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  className="ot-input"
                  type="number"
                  min="1"
                  style={{ width: 90, textAlign: "right" }}
                  value={afzender.geldigheid}
                  onChange={(e) => setAfzender({ ...afzender, geldigheid: e.target.value })}
                />
                <span style={{ fontSize: 13.5, color: "#5B6259" }}>dagen</span>
              </div>
            </div>
            <StapNavigatie onVolgende={volgende} volgendeLabel="Klant kiezen" />
          </StapWrapper>
        )}

        {/* -------------------- CATALOGUS BEHEREN -------------------- */}
        {stap === "catalogus" && (
          <StapWrapper
            titel="Dienstencatalogus beheren"
            toelichting="Optioneel: onderhoud hier alle eenmalige en doorlopende diensten met hun varianten en prijzen. U hoeft dit niet elke keer te doorlopen — wijzigingen gelden meteen voor nieuwe offertes."
          >
            {["eenmalig", "doorlopend"].map((cat) => (
              <div key={cat}>
                <div className="ot-cat-koptekst">
                  <span>{CATEGORIE_LABELS[cat]}</span>
                  <button className="ot-btn-ghost" onClick={() => voegDienstToe(cat)}>
                    <PlusCircle size={14} />
                    Dienst toevoegen
                  </button>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {dienstenCatalogus
                    .filter((d) => d.categorie === cat)
                    .map((dienst) => (
                      <div key={dienst.id} className="ot-card" style={{ padding: 18 }}>
                        <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-end" }}>
                          <div style={{ flex: 2 }}>
                            <label className="ot-label">Dienstnaam</label>
                            <input
                              className="ot-input"
                              value={dienst.naam}
                              onChange={(e) => bijwerkDienstVeld(dienst.id, "naam", e.target.value)}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="ot-label">Eenheid</label>
                            <input
                              className="ot-input"
                              value={dienst.eenheid}
                              onChange={(e) => bijwerkDienstVeld(dienst.id, "eenheid", e.target.value)}
                            />
                          </div>
                          <button
                            onClick={() => verwijderDienst(dienst.id)}
                            title="Dienst verwijderen"
                            style={{ border: "1px solid #E2C4B0", background: "#FBF2EC", color: "#B14A2E", borderRadius: 8, padding: 9, cursor: "pointer", display: "flex" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#8A9089", borderBottom: "1px solid #E2E4DF" }}>Variant / staffel</th>
                              <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#8A9089", borderBottom: "1px solid #E2E4DF", width: 280 }}>Prijs</th>
                              <th style={{ width: 34, borderBottom: "1px solid #E2E4DF" }} />
                            </tr>
                          </thead>
                          <tbody>
                            {dienst.varianten.map((v) => (
                              <tr key={v.id}>
                                <td style={{ padding: "6px 4px" }}>
                                  <input
                                    className="ot-input"
                                    placeholder="(standaard, geen varianten)"
                                    value={v.naam}
                                    onChange={(e) => bijwerkVariant(dienst.id, v.id, "naam", e.target.value)}
                                  />
                                </td>
                                <td style={{ padding: "6px 4px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ position: "relative", flex: 1, minWidth: 110 }}>
                                      <span style={{ position: "absolute", left: 10, top: 10, fontSize: 13, color: "#8A9089" }}>€</span>
                                      <input
                                        className="ot-input"
                                        style={{ paddingLeft: 22 }}
                                        type="number"
                                        step="0.01"
                                        disabled={v.prijs === null || v.prijs === "nacalculatie"}
                                        value={v.prijs === null || v.prijs === "nacalculatie" ? "" : v.prijs}
                                        placeholder={v.prijs === null ? "op aanvraag" : v.prijs === "nacalculatie" ? "nacalculatie" : ""}
                                        onChange={(e) => bijwerkVariant(dienst.id, v.id, "prijs", e.target.value === "" ? 0 : Number(e.target.value))}
                                      />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
                                      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#5B6259", whiteSpace: "nowrap" }}>
                                        <input
                                          type="checkbox"
                                          checked={v.prijs === null}
                                          onChange={(e) => bijwerkVariant(dienst.id, v.id, "prijs", e.target.checked ? null : 0)}
                                          style={{ accentColor: "#1C5D8C" }}
                                        />
                                        op aanvraag
                                      </label>
                                      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#5B6259", whiteSpace: "nowrap" }}>
                                        <input
                                          type="checkbox"
                                          checked={v.prijs === "nacalculatie"}
                                          onChange={(e) => bijwerkVariant(dienst.id, v.id, "prijs", e.target.checked ? "nacalculatie" : 0)}
                                          style={{ accentColor: "#1C5D8C" }}
                                        />
                                        op nacalculatie
                                      </label>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: "6px 4px", textAlign: "center" }}>
                                  {dienst.varianten.length > 1 && (
                                    <button
                                      onClick={() => verwijderVariant(dienst.id, v.id)}
                                      title="Variant verwijderen"
                                      style={{ border: "none", background: "transparent", color: "#B4B9AE", cursor: "pointer", display: "flex" }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button className="ot-btn-ghost" style={{ marginTop: 8 }} onClick={() => voegVariantToe(dienst.id)}>
                          <PlusCircle size={13} />
                          Variant / staffel toevoegen
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 22 }}>
              <button className="ot-btn-secondary" onClick={() => setStap(terugNaarStap)}>
                <ChevronLeft size={15} />
                Terug naar offerte
              </button>
            </div>
          </StapWrapper>
        )}

        {/* -------------------- TEKSTEN BEHEREN -------------------- */}
        {stap === "teksten" && (
          <StapWrapper
            titel="Standaardteksten beheren"
            toelichting="Leg hier standaardteksten vast voor de bijlage, net als bij de dienstencatalogus. Bij een nieuwe offerte worden lege velden automatisch met deze standaardtekst gevuld — u kunt ze per offerte nog altijd aanpassen."
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div className="ot-card" style={{ padding: 18 }}>
                <label className="ot-label">Algemeen</label>
                <textarea
                  className="ot-input"
                  rows={4}
                  placeholder="Standaardtekst voor de algemene toelichting…"
                  value={standaardTeksten.algemeen}
                  onChange={(e) => bijwerkStandaardAlgemeen(e.target.value)}
                />
              </div>

              {["eenmalig", "doorlopend"].map((cat) => (
                <div key={cat}>
                  <div className="ot-cat-koptekst">
                    <span>{CATEGORIE_LABELS[cat]}</span>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {dienstenCatalogus
                      .filter((d) => d.categorie === cat)
                      .map((dienst) => (
                        <div key={dienst.id} className="ot-card" style={{ padding: 18 }}>
                          <label className="ot-label">{dienst.naam}</label>
                          <textarea
                            className="ot-input"
                            rows={3}
                            placeholder={`Standaardtekst bij ${dienst.naam.toLowerCase()}…`}
                            value={standaardTeksten.perDienst[dienst.id] || ""}
                            onChange={(e) => bijwerkStandaardDienstTekst(dienst.id, e.target.value)}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 22 }}>
              <button className="ot-btn-secondary" onClick={() => setStap(terugNaarStap)}>
                <ChevronLeft size={15} />
                Terug naar offerte
              </button>
            </div>
          </StapWrapper>
        )}

        {/* -------------------- VOORWAARDEN BEHEREN -------------------- */}
        {stap === "voorwaarden" && (
          <StapWrapper
            titel="Algemene voorwaarden beheren"
            toelichting="Deze link verschijnt als klikbare verwijzing op elke offerte, bijv. 'Op deze offerte zijn onze algemene voorwaarden van toepassing.'"
          >
            <div className="ot-card" style={{ padding: 18, display: "grid", gap: 14 }}>
              <div>
                <label className="ot-label">Titel</label>
                <input
                  className="ot-input"
                  value={algemeneVoorwaarden.titel}
                  onChange={(e) => setAlgemeneVoorwaarden((prev) => ({ ...prev, titel: e.target.value }))}
                />
              </div>
              <div>
                <label className="ot-label">Link naar de voorwaarden (PDF op de website)</label>
                <input
                  className="ot-input"
                  type="url"
                  placeholder="https://activaa.nl/algemene-voorwaarden.pdf"
                  value={algemeneVoorwaarden.url || ""}
                  onChange={(e) => setAlgemeneVoorwaarden((prev) => ({ ...prev, url: e.target.value }))}
                />
                <p style={{ fontSize: 11.5, color: "#8A9089", marginTop: 6 }}>
                  Deze link staat als klikbare tekst op elke offerte — ook in de PDF blijft dit aanklikbaar. Laat leeg om geen link te tonen.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 22 }}>
              <button className="ot-btn-secondary" onClick={() => setStap(terugNaarStap)}>
                <ChevronLeft size={15} />
                Terug naar offerte
              </button>
            </div>
          </StapWrapper>
        )}

        {/* -------------------- ROADMAP BEHEREN -------------------- */}
        {stap === "roadmap" && (
          <StapWrapper
            titel="Roadmap beheren"
            toelichting="Stel hier een stappenplan/roadmap samen (bijv. week 1, dag 30, dag 60...). Bij een offerte kan deze per keer aan- of uitgezet worden — handig als niet elke offerte een roadmap nodig heeft."
          >
            <div style={{ marginBottom: 14 }}>
              <label className="ot-label">Titel van de roadmap</label>
              <input
                className="ot-input"
                value={roadmap.titel}
                onChange={(e) => setRoadmap((prev) => ({ ...prev, titel: e.target.value }))}
              />
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {roadmap.fases.map((fase, i) => (
                <div key={fase.id} className="ot-card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-end" }}>
                    <div style={{ width: 70 }}>
                      <label className="ot-label">Markering</label>
                      <input
                        className="ot-input"
                        value={fase.markering}
                        onChange={(e) => bijwerkFase(fase.id, "markering", e.target.value)}
                        placeholder="W1"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="ot-label">Label (klein, bovenaan)</label>
                      <input
                        className="ot-input"
                        value={fase.label}
                        onChange={(e) => bijwerkFase(fase.id, "label", e.target.value)}
                        placeholder="WEEK 1 · FUNDAMENT"
                      />
                    </div>
                    <button
                      onClick={() => verwijderFase(fase.id)}
                      title="Fase verwijderen"
                      style={{ border: "1px solid #E2C4B0", background: "#FBF2EC", color: "#B14A2E", borderRadius: 8, padding: 9, cursor: "pointer", display: "flex", flexShrink: 0 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label className="ot-label">Titel van deze fase</label>
                    <input
                      className="ot-input"
                      value={fase.titel}
                      onChange={(e) => bijwerkFase(fase.id, "titel", e.target.value)}
                    />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label className="ot-label">Bullet points (één per regel)</label>
                    <textarea
                      className="ot-input"
                      rows={3}
                      value={fase.puntenTekst}
                      onChange={(e) => bijwerkFase(fase.id, "puntenTekst", e.target.value)}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                    <div>
                      <label className="ot-label">Resultaat-label</label>
                      <input
                        className="ot-input"
                        value={fase.resultaatLabel}
                        onChange={(e) => bijwerkFase(fase.id, "resultaatLabel", e.target.value)}
                        placeholder="RESULTAAT"
                      />
                    </div>
                    <div>
                      <label className="ot-label">Resultaat-tekst</label>
                      <input
                        className="ot-input"
                        value={fase.resultaatTekst}
                        onChange={(e) => bijwerkFase(fase.id, "resultaatTekst", e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#8A9089", marginTop: 8 }}>Fase {i + 1}</div>
                </div>
              ))}
            </div>

            <button className="ot-btn-ghost" style={{ marginTop: 12 }} onClick={voegFaseToe}>
              <PlusCircle size={14} />
              Fase toevoegen
            </button>

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 22 }}>
              <button className="ot-btn-secondary" onClick={() => setStap(terugNaarStap)}>
                <ChevronLeft size={15} />
                Terug naar offerte
              </button>
            </div>
          </StapWrapper>
        )}

        {/* -------------------- OFFERTES OVERZICHT -------------------- */}
        {stap === "offertes" && (
          <StapWrapper
            titel="Offertes overzicht"
            toelichting="Alle opgeslagen offertes van iedereen. Open er één om een kleine wijziging te maken — bij opnieuw afdrukken/PDF wordt dezelfde offerte bijgewerkt."
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="ot-btn-ghost" onClick={laadOffertesLijst} disabled={offertesLijstBezig}>
                  <RotateCcw size={13} />
                  {offertesLijstBezig ? "Bezig met laden…" : "Vernieuwen"}
                </button>
                {offertesSelectie.size > 0 && (
                  <button
                    onClick={() => setOffertesBevestigenTonen(true)}
                    disabled={offertesVerwijderenBezig}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid #E2C4B0",
                      background: "#FBF2EC",
                      color: "#B14A2E",
                      padding: "7px 12px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: offertesVerwijderenBezig ? "default" : "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                    {offertesVerwijderenBezig
                      ? "Bezig met verwijderen…"
                      : `${offertesSelectie.size} geselecteerd — verwijderen`}
                  </button>
                )}
              </div>
              <button className="ot-btn-primary" onClick={nieuweOfferte}>
                <PlusCircle size={15} />
                Nieuwe offerte
              </button>
            </div>

            {offertesBevestigenTonen && offertesSelectie.size > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#FBF2EC",
                  border: "1px solid #E2C4B0",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 13, color: "#7A3520" }}>
                  {offertesSelectie.size === 1
                    ? "Deze offerte definitief verwijderen? Dit kan niet ongedaan worden gemaakt."
                    : `${offertesSelectie.size} offertes definitief verwijderen? Dit kan niet ongedaan worden gemaakt.`}
                </span>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    className="ot-btn-secondary"
                    onClick={() => setOffertesBevestigenTonen(false)}
                    disabled={offertesVerwijderenBezig}
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={verwijderGeselecteerdeOffertes}
                    disabled={offertesVerwijderenBezig}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "none",
                      background: "#B14A2E",
                      color: "#fff",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: offertesVerwijderenBezig ? "default" : "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                    {offertesVerwijderenBezig ? "Bezig…" : "Ja, verwijderen"}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8A9089" }} />
                <input
                  className="ot-input"
                  style={{ paddingLeft: 30 }}
                  placeholder="Zoek op klant, klantgroep of naam…"
                  value={offertesZoekterm}
                  onChange={(e) => setOffertesZoekterm(e.target.value)}
                />
              </div>
              <select
                className="ot-input"
                style={{ width: 200 }}
                value={offertesFilterKlantgroep}
                onChange={(e) => setOffertesFilterKlantgroep(e.target.value)}
              >
                <option value="">Alle klantgroepen</option>
                {offertesKlantgroepen.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                className="ot-input"
                style={{ width: 200 }}
                value={offertesFilterGebruiker}
                onChange={(e) => setOffertesFilterGebruiker(e.target.value)}
              >
                <option value="">Iedereen</option>
                {offertesGebruikers.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                className="ot-input"
                style={{ width: 180 }}
                value={offertesFilterStatus}
                onChange={(e) => setOffertesFilterStatus(e.target.value)}
              >
                <option value="">Alle statussen</option>
                {OFFERTE_STATUSSEN.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              {(offertesZoekterm || offertesFilterKlantgroep || offertesFilterGebruiker || offertesFilterStatus) && (
                <button
                  className="ot-btn-ghost"
                  onClick={() => {
                    setOffertesZoekterm("");
                    setOffertesFilterKlantgroep("");
                    setOffertesFilterGebruiker("");
                    setOffertesFilterStatus("");
                  }}
                >
                  Filters wissen
                </button>
              )}
            </div>

            {offertesLijstFout && (
              <div style={{ padding: 14, borderRadius: 10, background: "#FBF2EC", color: "#B14A2E", fontSize: 13, marginBottom: 16 }}>
                Kon de offertes niet laden. Controleer of de opslag is geconfigureerd (zie README, stap "Opslag van instellingen").
              </div>
            )}

            {offertesLijstBezig && offertesLijst.length === 0 && !offertesLijstFout && (
              <div style={{ textAlign: "center", padding: 40, color: "#8A9089", fontSize: 13.5 }}>
                Bezig met laden…
              </div>
            )}

            {!offertesLijstBezig && offertesLijst.length === 0 && !offertesLijstFout && (
              <div style={{ textAlign: "center", padding: 40, color: "#8A9089", fontSize: 13.5 }}>
                Nog geen offertes opgeslagen.
              </div>
            )}

            {offertesLijst.length > 0 && gefilterdeOffertes.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#8A9089", fontSize: 13.5 }}>
                Geen offertes gevonden met deze zoekterm/filters.
              </div>
            )}

            {gefilterdeOffertes.length > 0 && (
              <div className="ot-card" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F0EEE6", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px", width: 1 }}>
                        <input
                          type="checkbox"
                          checked={
                            gepagineerdeOffertes.length > 0 &&
                            gepagineerdeOffertes.every((o) => offertesSelectie.has(o.id))
                          }
                          onChange={() =>
                            toggleAlleOffertesOpPagina(
                              gepagineerdeOffertes.map((o) => o.id),
                              gepagineerdeOffertes.length > 0 && gepagineerdeOffertes.every((o) => offertesSelectie.has(o.id))
                            )
                          }
                          title="Alles op deze pagina (de)selecteren"
                        />
                      </th>
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#5B6259" }}>Datum</th>
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#5B6259" }}>Klant(en)</th>
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#5B6259" }}>Klantgroep</th>
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#5B6259" }}>Status</th>
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#5B6259" }}>Opgemaakt door</th>
                      <th style={{ padding: "10px 14px", fontWeight: 700, color: "#5B6259" }}>Laatst gewijzigd</th>
                      <th style={{ padding: "10px 14px" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {gepagineerdeOffertes.map((o) => {
                      const gewijzigd = o.gewijzigdOp && o.gewijzigdOp !== o.aangemaaktOp;
                      const statusInfo = offerteStatusInfo(o.status);
                      return (
                        <tr
                          key={o.id}
                          style={{
                            borderTop: "1px solid #E2E4DF",
                            background: offertesSelectie.has(o.id) ? "#EAF2F8" : "transparent",
                          }}
                        >
                          <td style={{ padding: "10px 12px" }}>
                            <input
                              type="checkbox"
                              checked={offertesSelectie.has(o.id)}
                              onChange={() => toggleOfferteSelectie(o.id)}
                            />
                          </td>
                          <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{datumTijd(o.aangemaaktOp)}</td>
                          <td style={{ padding: "10px 14px" }}>
                            {o.klantNamen && o.klantNamen.length > 0 ? o.klantNamen.join(", ") : "—"}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            {o.klantGroepen && o.klantGroepen.length > 0 ? o.klantGroepen.join(", ") : "—"}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <select
                              value={o.status || OFFERTE_STATUS_STANDAARD}
                              onChange={(e) => wijzigOfferteStatus(o.id, e.target.value)}
                              disabled={offerteStatusBezigId === o.id}
                              style={{
                                border: "1px solid " + statusInfo.kleur + "33",
                                background: statusInfo.achtergrond,
                                color: statusInfo.kleur,
                                fontWeight: 600,
                                fontSize: 12,
                                borderRadius: 6,
                                padding: "5px 8px",
                                cursor: offerteStatusBezigId === o.id ? "default" : "pointer",
                              }}
                            >
                              {OFFERTE_STATUSSEN.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: "10px 14px" }}>{o.aangemaaktDoor || "—"}</td>
                          <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                            {gewijzigd ? (
                              <>
                                {datumTijd(o.gewijzigdOp)}
                                <div style={{ fontSize: 11.5, color: "#8A9089" }}>door {o.gewijzigdDoor}</div>
                              </>
                            ) : (
                              <span style={{ color: "#A5AA9F" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right" }}>
                            <button className="ot-btn-ghost" onClick={() => openOfferte(o.id)}>
                              <FolderOpen size={13} />
                              Openen
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {gefilterdeOffertes.length > 0 && offertesTotaalPaginas > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
                <button
                  className="ot-btn-ghost"
                  disabled={offertesPaginaVeilig === 1}
                  onClick={() => setOffertesPagina((p) => Math.max(1, p - 1))}
                  style={{ opacity: offertesPaginaVeilig === 1 ? 0.4 : 1 }}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: offertesTotaalPaginas }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setOffertesPagina(p)}
                    style={{
                      minWidth: 30,
                      height: 30,
                      border: "1px solid #C8CDC5",
                      background: p === offertesPaginaVeilig ? "#1C5D8C" : "#fff",
                      color: p === offertesPaginaVeilig ? "#fff" : "#5B6259",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="ot-btn-ghost"
                  disabled={offertesPaginaVeilig === offertesTotaalPaginas}
                  onClick={() => setOffertesPagina((p) => Math.min(offertesTotaalPaginas, p + 1))}
                  style={{ opacity: offertesPaginaVeilig === offertesTotaalPaginas ? 0.4 : 1 }}
                >
                  <ChevronRight size={14} />
                </button>
                <span style={{ fontSize: 12, color: "#8A9089", marginLeft: 8 }}>
                  {gefilterdeOffertes.length} offerte{gefilterdeOffertes.length === 1 ? "" : "s"} · pagina {offertesPaginaVeilig} van {offertesTotaalPaginas}
                </span>
              </div>
            )}
          </StapWrapper>
        )}

        {/* -------------------- KLANT -------------------- */}
        {stap === "klant" && (
          <StapWrapper
            titel="Selecteer klanten"
            toelichting="Klanten worden opgehaald uit Dynamics op basis van uw rechten. U kunt er meerdere kiezen — er wordt dan per klant een aparte offerte gemaakt met dezelfde diensten."
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 20,
                marginBottom: 14,
                background: klantenUitDynamics ? "#EAF2F8" : "#FBF2EC",
                color: klantenUitDynamics ? "#1C5D8C" : "#B14A2E",
              }}
            >
              {klantenUitDynamics ? "● Live data uit Dynamics" : "● Voorbeelddata (Dynamics nog niet gekoppeld)"}
            </div>
            {klantenFoutmelding && (
              <div
                style={{
                  fontSize: 12,
                  color: "#B14A2E",
                  background: "#FBF2EC",
                  border: "1px solid #E2C4B0",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginTop: -6,
                  marginBottom: 14,
                  fontFamily: "ui-monospace, monospace",
                  wordBreak: "break-word",
                }}
              >
                <strong>Foutmelding Dynamics-koppeling:</strong> {klantenFoutmelding}
              </div>
            )}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#8A9089" }} />
              <input
                className="ot-input"
                style={{ paddingLeft: 36, paddingRight: klantenLaden ? 90 : undefined }}
                placeholder="Zoek op klantnaam, plaats of klantgroep…"
                value={zoekKlant}
                onChange={(e) => setZoekKlant(e.target.value)}
              />
              {klantenLaden && (
                <span style={{ position: "absolute", right: 12, top: 11, fontSize: 12, color: "#8A9089" }}>
                  zoeken…
                </span>
              )}
            </div>

            {gekozenKlanten.length > 0 && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  background: "#EAF2F8",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "#3A4038" }}>
                  <strong>{gekozenKlanten.length}</strong> klant{gekozenKlanten.length > 1 ? "en" : ""} geselecteerd
                </span>
                <button
                  onClick={() => setGekozenKlanten([])}
                  style={{ border: "none", background: "transparent", color: "#8A9089", fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}
                >
                  Selectie wissen
                </button>
              </div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              {gefilterdeKlanten.slice(0, 10).map((k) => {
                const actief = gekozenKlanten.some((x) => x.id === k.id);
                const metaDelen = [k.contact, k.plaats, k.segment].filter(Boolean);
                return (
                  <button
                    key={k.id}
                    onClick={() => toggleKlant(k)}
                    className="ot-card"
                    style={{
                      textAlign: "left",
                      padding: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      borderColor: actief ? "#1C5D8C" : "#E2E4DF",
                      borderWidth: actief ? 2 : 1,
                      background: actief ? "#EAF2F8" : "#fff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          border: actief ? "none" : "1.5px solid #C8CDC5",
                          background: actief ? "#1C5D8C" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        {actief && <Check size={13} color="#fff" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{k.naam}</div>
                        {metaDelen.length > 0 && (
                          <div style={{ fontSize: 12.5, color: "#5B6259", marginTop: 2 }}>
                            {metaDelen.join(" · ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {heeftMeerResultaten && (
                <div style={{ textAlign: "center", padding: "10px 4px", color: "#8A9089", fontSize: 12.5 }}>
                  Meer klanten gevonden — verfijn uw zoekopdracht om ze te zien.
                </div>
              )}
              {gefilterdeKlanten.length === 0 && !klantenLaden && (
                <div style={{ textAlign: "center", padding: 30, color: "#8A9089", fontSize: 13.5 }}>
                  Geen klanten gevonden voor "{zoekKlant}".
                </div>
              )}
            </div>

            <StapNavigatie onVorige={vorige} onVolgende={volgende} volgendeDisabled={!kanNaarDiensten} volgendeLabel="Diensten kiezen" />
          </StapWrapper>
        )}

        {/* -------------------- DIENSTEN KIEZEN -------------------- */}
        {stap === "diensten" && (
          <StapWrapper
            titel="Vink diensten aan"
            toelichting="Kies welke diensten meegaan en het aantal. Heeft een dienst varianten of staffels (zoals Klein/Middel/Groot)? Die kiest u per klant bij de volgende stap, Prijzen."
          >
            {["eenmalig", "doorlopend"].map((cat) => (
              <div key={cat}>
                <div className="ot-cat-koptekst">
                  <span>{CATEGORIE_LABELS[cat]}</span>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {dienstenCatalogus
                    .filter((d) => d.categorie === cat)
                    .map((dienst) => {
                      const info = geselecteerd[dienst.id];
                      const actief = !!info;
                      const meerdereVarianten = dienst.varianten.length > 1;
                      const prijzen = dienst.varianten
                        .map((v) => v.prijs)
                        .filter((p) => p !== null && p !== "nacalculatie");
                      const prijsIndicatie =
                        !meerdereVarianten
                          ? dienst.varianten[0].prijs === null
                            ? "op aanvraag"
                            : dienst.varianten[0].prijs === "nacalculatie"
                            ? "op nacalculatie"
                            : `${currency(dienst.varianten[0].prijs)} / ${dienst.eenheid}`
                          : prijzen.length
                          ? `${currency(Math.min(...prijzen))} – ${currency(Math.max(...prijzen))} / ${dienst.eenheid}`
                          : "op aanvraag / nacalculatie";

                      return (
                        <div
                          key={dienst.id}
                          className="ot-card"
                          style={{ padding: 16, borderColor: actief ? "#1C5D8C" : "#E2E4DF" }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={actief}
                                onChange={() => toggleDienstSelectie(dienst)}
                                style={{ marginTop: 3, width: 16, height: 16, accentColor: "#1C5D8C" }}
                              />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{dienst.naam}</div>
                                <div style={{ fontSize: 12.5, color: "#B98237", marginTop: 3, fontWeight: 600 }}>
                                  {prijsIndicatie}
                                  {meerdereVarianten && (
                                    <span style={{ color: "#8A9089", fontWeight: 500 }}> · {dienst.varianten.map((v) => v.naam || "Standaard").join(" / ")}</span>
                                  )}
                                </div>
                              </div>
                            </label>

                            {actief && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button onClick={() => zetAantal(dienst.id, (info.aantal || 1) - 1)} style={stapKnopStyle}>
                                  <Minus size={13} />
                                </button>
                                <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700, fontSize: 14 }}>{info.aantal || 1}</span>
                                <button onClick={() => zetAantal(dienst.id, (info.aantal || 1) + 1)} style={stapKnopStyle}>
                                  <Plus size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}

            {geselecteerdeEntries.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  background: "#EAF2F8",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13.5,
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <span style={{ color: "#5B6259" }}>{geselecteerdeEntries.length} dienst(en) geselecteerd</span>
                {heeftMeerdereVarianten && (
                  <span style={{ color: "#5B6259" }}>Kies varianten per klant bij de volgende stap</span>
                )}
              </div>
            )}

            <StapNavigatie onVorige={vorige} onVolgende={volgende} volgendeDisabled={!kanNaarPrijzen} volgendeLabel="Prijzen per klant" />
          </StapWrapper>
        )}

        {/* -------------------- PRIJZEN PER KLANT -------------------- */}
        {stap === "prijzen" && (
          <StapWrapper
            titel="Prijs (en variant) per dienst, per klant"
            toelichting="Kies voor elke klant welke variant of staffel geldt (indien van toepassing) en pas de prijs aan waar nodig. Heeft u meerdere klanten? Dan kunt u per klant een dienst ook los aan- of uitzetten met het vinkje bovenin elke cel."
          >
            <div className="ot-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 + gekozenKlanten.length * 200 }}>
                  <thead>
                    <tr style={{ background: "#FBFBF9", borderBottom: "1px solid #E2E4DF" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px 16px",
                          fontSize: 11.5,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                          color: "#5B6259",
                          position: "sticky",
                          left: 0,
                          background: "#FBFBF9",
                          minWidth: 220,
                        }}
                      >
                        Dienst
                      </th>
                      {gekozenKlanten.map((k) => (
                        <th
                          key={k.id}
                          style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: "#1C2321", minWidth: 200, borderLeft: "1px solid #E2E4DF" }}
                        >
                          {k.naam}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {geselecteerdeEntries.map(({ dienst, aantal }) => {
                      const meerdereVarianten = dienst.varianten.length > 1;
                      return (
                        <tr key={dienst.id} style={{ borderBottom: "1px solid #E2E4DF" }}>
                          <td style={{ padding: "12px 16px", position: "sticky", left: 0, background: "#fff", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{dienst.naam}</div>
                            <div style={{ fontSize: 11.5, color: "#8A9089", marginTop: 2 }}>
                              {dienst.eenheid} · {aantal}×
                            </div>
                          </td>
                          {gekozenKlanten.map((k) => {
                            const variant = variantVoorKlant(k.id, dienst);
                            const key = prijsSleutel(k.id, dienst.id);
                            const aangepast = aangepastePrijzen[key] !== undefined && aangepastePrijzen[key] !== "";
                            const huidigeWaarde =
                              aangepastePrijzen[key] !== undefined
                                ? aangepastePrijzen[key]
                                : variant?.prijs === null || variant?.prijs === "nacalculatie"
                                ? ""
                                : variant.prijs;
                            const uitgeschakeld = isUitgeschakeldVoorKlant(k.id, dienst.id);
                            return (
                              <td key={k.id} style={{ padding: "10px 16px", borderLeft: "1px solid #E2E4DF", verticalAlign: "top" }}>
                                {gekozenKlanten.length > 1 && (
                                  <label
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      fontSize: 11.5,
                                      color: uitgeschakeld ? "#B4B9AE" : "#5B6259",
                                      marginBottom: 8,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!uitgeschakeld}
                                      onChange={() => toggleDienstVoorKlant(k.id, dienst.id)}
                                      style={{ width: 14, height: 14, accentColor: "#1C5D8C" }}
                                    />
                                    {uitgeschakeld ? "Niet voor deze klant" : "Voor deze klant"}
                                  </label>
                                )}
                                {!uitgeschakeld && (
                                  <>
                                {meerdereVarianten && (
                                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                                    {dienst.varianten.map((v) => (
                                      <button
                                        key={v.id}
                                        className={`ot-pill ${variant.id === v.id ? "actief" : ""}`}
                                        style={{ padding: "4px 10px", fontSize: 11.5 }}
                                        onClick={() => kiesVariantVoorKlant(k.id, dienst.id, v.id)}
                                      >
                                        {v.naam || "Standaard"}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ position: "absolute", left: 10, fontSize: 13, color: "#8A9089" }}>€</span>
                                  <input
                                    className="ot-input"
                                    type="number"
                                    step="0.01"
                                    placeholder={
                                      variant?.prijs === null
                                        ? "op aanvraag"
                                        : variant?.prijs === "nacalculatie"
                                        ? "nacalculatie"
                                        : ""
                                    }
                                    style={{ paddingLeft: 22, fontWeight: aangepast ? 700 : 400, borderColor: aangepast ? "#B98237" : "#C8CDC5" }}
                                    value={huidigeWaarde}
                                    onChange={(e) => zetPrijs(k.id, dienst.id, e.target.value)}
                                  />
                                  {aangepast && (
                                    <button
                                      title="Terug naar catalogusprijs"
                                      onClick={() => resetPrijs(k.id, dienst.id)}
                                      style={{ border: "none", background: "transparent", color: "#8A9089", cursor: "pointer", display: "flex", flexShrink: 0 }}
                                    >
                                      <RotateCcw size={14} />
                                    </button>
                                  )}
                                </div>
                                  </>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13, position: "sticky", left: 0, background: "#FBFBF9", borderTop: "2px solid #1C2321" }}>
                        Totaal (excl. btw)
                      </td>
                      {gekozenKlanten.map((k) => {
                        const t = regelsVoorKlant(k.id).reduce((s, r) => s + r.subtotaal, 0);
                        return (
                          <td key={k.id} style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13.5, borderLeft: "1px solid #E2E4DF", borderTop: "2px solid #1C2321", background: "#FBFBF9" }}>
                            {currency(t)}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#8A9089", marginTop: 12 }}>
              <RotateCcw size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />
              zet een aangepaste prijs terug naar de catalogusprijs.
            </p>

            <StapNavigatie onVorige={vorige} onVolgende={naarBijlage} volgendeDisabled={!kanNaarOfferte} volgendeLabel="Bijlage toevoegen" />
          </StapWrapper>
        )}

        {/* -------------------- BIJLAGE (TOELICHTING) -------------------- */}
        {stap === "bijlage" && (
          <StapWrapper
            titel="Toelichting per onderdeel"
            toelichting="Schrijf optioneel een algemene toelichting, iets klantspecifieks en/of een toelichting per dienst. Alles wordt bewaard en samengevoegd in één gezamenlijke bijlage na de offertes — de klantspecifieke tekst verschijnt op de offerte van díe klant zelf."
          >
            <div
              className="ot-card"
              style={{
                padding: 16,
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderColor: roadmapToevoegen ? "#1C5D8C" : "#E2E4DF",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={roadmapToevoegen}
                  onChange={(e) => setRoadmapToevoegen(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#1C5D8C" }}
                />
                <span>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Roadmap toevoegen aan deze offerte</div>
                  <div style={{ fontSize: 12, color: "#8A9089" }}>"{roadmap.titel}" — te beheren via "Roadmap beheren"</div>
                </span>
              </label>
              <Milestone size={20} color={roadmapToevoegen ? "#1C5D8C" : "#B4B9AE"} />
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div className="ot-card" style={{ padding: 16, borderColor: "#1C5D8C" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label className="ot-label">Algemeen</label>
                  {standaardTeksten.algemeen.trim() !== "" && (
                    <button
                      className="ot-btn-ghost"
                      onClick={() => setAlgemeneToelichting(standaardTeksten.algemeen)}
                      title="Standaardtekst gebruiken"
                    >
                      <RotateCcw size={12} />
                      Standaardtekst
                    </button>
                  )}
                </div>
                <textarea
                  className="ot-input"
                  rows={4}
                  placeholder="Algemene toelichting, niet gekoppeld aan een specifieke dienst…"
                  value={algemeneToelichting}
                  onChange={(e) => setAlgemeneToelichting(e.target.value)}
                />
              </div>

              {gekozenKlanten.length > 0 && (
                <div>
                  <div className="ot-cat-koptekst">
                    <span>Klantspecifiek</span>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {gekozenKlanten.map((klant) => (
                      <div key={klant.id} className="ot-card" style={{ padding: 16 }}>
                        <label className="ot-label">{klant.naam}</label>
                        <textarea
                          className="ot-input"
                          rows={3}
                          placeholder={`Iets specifieks over ${klant.naam}…`}
                          value={klantToelichtingen[klant.id] || ""}
                          onChange={(e) =>
                            setKlantToelichtingen((prev) => ({ ...prev, [klant.id]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {geselecteerdeEntries.map(({ dienst }) => (
                <div key={dienst.id} className="ot-card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label className="ot-label">{dienst.naam}</label>
                    {(standaardTeksten.perDienst[dienst.id] || "").trim() !== "" && (
                      <button
                        className="ot-btn-ghost"
                        onClick={() =>
                          setBijlageToelichtingen((prev) => ({ ...prev, [dienst.id]: standaardTeksten.perDienst[dienst.id] }))
                        }
                        title="Standaardtekst gebruiken"
                      >
                        <RotateCcw size={12} />
                        Standaardtekst
                      </button>
                    )}
                  </div>
                  <textarea
                    className="ot-input"
                    rows={3}
                    placeholder={`Toelichting bij ${dienst.naam.toLowerCase()}…`}
                    value={bijlageToelichtingen[dienst.id] || ""}
                    onChange={(e) =>
                      setBijlageToelichtingen((prev) => ({ ...prev, [dienst.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
              {geselecteerdeEntries.length === 0 && (
                <div style={{ textAlign: "center", padding: 30, color: "#8A9089", fontSize: 13.5 }}>
                  Nog geen diensten geselecteerd.
                </div>
              )}
            </div>

            <StapNavigatie onVorige={vorige} onVolgende={volgende} volgendeLabel="Offerte bekijken" />
          </StapWrapper>
        )}

        {/* -------------------- OFFERTE -------------------- */}
        {stap === "offerte" && (
          <StapWrapper
            titel={gekozenKlanten.length > 1 ? `${gekozenKlanten.length} offertes` : "Offerte"}
            toelichting={
              gekozenKlanten.length > 1
                ? "Voor elke geselecteerde klant is een eigen offerte samengesteld. Druk alles in één keer af of sla op als PDF."
                : "Controleer de offerte en druk af of sla op als PDF."
            }
          >
            {gekozenKlanten.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#8A9089", fontSize: 13.5 }}>
                Nog geen klant geselecteerd.
                <div style={{ marginTop: 12 }}>
                  <button className="ot-btn-secondary" onClick={() => setStap("klant")}>
                    <Users size={15} />
                    Klant kiezen
                  </button>
                </div>
              </div>
            ) : (
              <>
            <div id="offerte-print-gebied">
            {gekozenKlanten.map((klant, idx) => {
              const klantRegels = regelsVoorKlant(klant.id);
              const klantTotaalExcl = klantRegels.reduce((s, r) => s + r.subtotaal, 0);
              const klantBtw = klantTotaalExcl * 0.21;
              const klantTotaalIncl = klantTotaalExcl + klantBtw;
              const groepen = ["eenmalig", "doorlopend"]
                .map((cat) => ({ cat, items: klantRegels.filter((r) => r.categorie === cat) }))
                .filter((g) => g.items.length > 0);

              return (
                <div
                  key={klant.id}
                  className="ot-card offerte-doc"
                  style={{ padding: 40, marginBottom: idx < gekozenKlanten.length - 1 ? 24 : 0 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      {gekozenKlanten.length > 1 && (
                        <div style={{ fontSize: 11.5, color: "#B98237", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>
                          Offerte {idx + 1} van {gekozenKlanten.length}
                        </div>
                      )}
                      <div className="offertetool-serif" style={{ fontSize: 26, fontWeight: 600 }}>Offerte</div>
                      <div style={{ fontSize: 12.5, color: "#8A9089", marginTop: 4 }}>
                        Datum: {new Date().toLocaleDateString("nl-NL")} · Geldig {afzender.geldigheid} dagen
                      </div>
                    </div>
                    {logo && (
                      <img
                        src={logo}
                        alt="Logo"
                        style={{ maxWidth: 140, maxHeight: 56, objectFit: "contain", flexShrink: 0, marginLeft: 24 }}
                      />
                    )}
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12.5, color: "#5B6259", lineHeight: 1.5, marginBottom: 32 }}>
                    <div style={{ fontWeight: 700, color: "#1C2321" }}>{afzender.bedrijf}</div>
                    <div>{afzender.adres}</div>
                    <div>{afzender.postcode} {afzender.plaats}</div>
                    <div>KvK {afzender.kvk}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #E2E4DF" }}>
                    <div>
                      <div className="ot-label">Aan</div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{klant.naam}</div>
                      <div style={{ fontSize: 13, color: "#5B6259" }}>{klant.contact}</div>
                      {klantAdresRegels(klant).map((regel, i) => (
                        <div key={i} style={{ fontSize: 13, color: "#5B6259" }}>{regel}</div>
                      ))}
                      <div style={{ fontSize: 13, color: "#5B6259" }}>{klant.email}</div>
                    </div>
                    <div>
                      <div className="ot-label">Namens</div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{huidigeGebruiker.naam}</div>
                      {huidigeGebruiker.email && huidigeGebruiker.email.toLowerCase() !== (huidigeGebruiker.naam || "").toLowerCase() && (
                        <div style={{ fontSize: 13, color: "#5B6259" }}>{huidigeGebruiker.email}</div>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3A4038", marginBottom: 24 }}>
                    {afzender.inleiding}
                  </p>

                  {(klantToelichtingen[klant.id] || "").trim() !== "" && (
                    <div style={{ background: "#EAF2F8", borderRadius: 8, padding: 16, marginBottom: 24 }}>
                      <div className="ot-label" style={{ color: "#1C5D8C" }}>Speciaal voor {klant.naam}</div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3A4038", whiteSpace: "pre-wrap" }}>
                        {klantToelichtingen[klant.id]}
                      </div>
                    </div>
                  )}

                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #1C2321" }}>
                        <th style={{ textAlign: "left", padding: "8px 4px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".04em", color: "#5B6259" }}>Dienst</th>
                        <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".04em", color: "#5B6259" }}>Aantal</th>
                        <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".04em", color: "#5B6259" }}>Prijs</th>
                        <th style={{ textAlign: "right", padding: "8px 4px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".04em", color: "#5B6259" }}>Subtotaal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groepen.map((g) => (
                        <React.Fragment key={g.cat}>
                          <tr>
                            <td colSpan={4} style={{ padding: "12px 4px 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#B98237" }}>
                              {CATEGORIE_LABELS[g.cat]}
                            </td>
                          </tr>
                          {g.items.map((r) => (
                            <tr key={r.id} style={{ borderBottom: "1px solid #E2E4DF" }}>
                              <td style={{ padding: "10px 4px" }}>
                                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.naam}</div>
                              </td>
                              <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 13.5 }}>{r.aantal} {r.eenheid}</td>
                              <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 13.5 }}>
                                {r.opAanvraag ? "op aanvraag" : r.opNacalculatie ? "nacalculatie" : currency(r.prijs)}
                              </td>
                              <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 13.5, fontWeight: 700 }}>
                                {r.opAanvraag || r.opNacalculatie ? "—" : currency(r.subtotaal)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: 240, fontSize: 13.5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                        <span style={{ color: "#5B6259" }}>Subtotaal</span>
                        <span>{currency(klantTotaalExcl)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                        <span style={{ color: "#5B6259" }}>Btw (21%)</span>
                        <span>{currency(klantBtw)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", marginTop: 6, borderTop: "2px solid #1C2321", fontWeight: 700, fontSize: 15 }}>
                        <span>Totaal</span>
                        <span>{currency(klantTotaalIncl)}</span>
                      </div>
                    </div>
                  </div>

                  {algemeneVoorwaarden.url && (
                    <p style={{ fontSize: 11, color: "#8A9089", marginTop: 32, paddingTop: 12, borderTop: "1px solid #E2E4DF" }}>
                      Op deze offerte zijn onze{" "}
                      <a
                        href={algemeneVoorwaarden.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#1C5D8C", textDecoration: "underline" }}
                      >
                        {algemeneVoorwaarden.titel?.toLowerCase() || "algemene voorwaarden"}
                      </a>{" "}
                      van toepassing.
                    </p>
                  )}
                </div>
              );
            })}

            {roadmapToevoegen && roadmap.fases.length > 0 && (
              <div className="ot-card offerte-doc" style={{ padding: 40 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div className="offertetool-serif" style={{ fontSize: 22, fontWeight: 600 }}>
                    {roadmap.titel}
                  </div>
                  {logo && (
                    <img
                      src={logo}
                      alt="Logo"
                      style={{ maxWidth: 140, maxHeight: 56, objectFit: "contain", flexShrink: 0, marginLeft: 24 }}
                    />
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  {roadmap.fases.map((fase) => (
                    <div key={fase.id} style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: "#1C5D8C",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {fase.markering}
                        </div>
                        <div style={{ height: 2, background: "#EAF2F8", flex: 1 }} />
                      </div>
                      <div
                        style={{
                          border: "1.5px solid #1C5D8C",
                          borderRadius: 10,
                          padding: 14,
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#B98237", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>
                          {fase.label}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1C2321", marginBottom: 8 }}>
                          {fase.titel}
                        </div>
                        {fase.puntenTekst
                          .split("\n")
                          .map((p) => p.trim())
                          .filter(Boolean).length > 0 && (
                          <ul style={{ margin: 0, marginBottom: 10, paddingLeft: 16, fontSize: 11.5, color: "#3A4038", lineHeight: 1.5 }}>
                            {fase.puntenTekst
                              .split("\n")
                              .map((p) => p.trim())
                              .filter(Boolean)
                              .map((punt, i) => (
                                <li key={i}>{punt}</li>
                              ))}
                          </ul>
                        )}
                        {fase.resultaatTekst && (
                          <div
                            style={{
                              marginTop: "auto",
                              background: "#EAF2F8",
                              borderRadius: 6,
                              padding: "8px 10px",
                            }}
                          >
                            <div style={{ fontSize: 9.5, fontWeight: 700, color: "#1C5D8C", textTransform: "uppercase", letterSpacing: ".04em" }}>
                              {fase.resultaatLabel}
                            </div>
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#1C2321" }}>{fase.resultaatTekst}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(algemeneToelichting.trim() !== "" ||
              geselecteerdeEntries.some(({ dienst }) => (bijlageToelichtingen[dienst.id] || "").trim() !== "")) && (
              <div className="ot-card offerte-doc" style={{ padding: 40 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div className="offertetool-serif" style={{ fontSize: 22, fontWeight: 600 }}>
                    Bijlage — toelichting per onderdeel
                  </div>
                  {logo && (
                    <img
                      src={logo}
                      alt="Logo"
                      style={{ maxWidth: 140, maxHeight: 56, objectFit: "contain", flexShrink: 0, marginLeft: 24 }}
                    />
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#8A9089", marginBottom: 24 }}>
                  Deze toelichting geldt voor alle bovenstaande offertes.
                </div>
                <div style={{ display: "grid", gap: 20 }}>
                  {algemeneToelichting.trim() !== "" && (
                    <div style={{ paddingBottom: 16, borderBottom: "1px solid #E2E4DF" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Algemeen</div>
                      <div style={{ fontSize: 13, color: "#3A4038", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {algemeneToelichting}
                      </div>
                    </div>
                  )}
                  {geselecteerdeEntries
                    .filter(({ dienst }) => (bijlageToelichtingen[dienst.id] || "").trim() !== "")
                    .map(({ dienst }) => (
                      <div key={dienst.id} style={{ paddingBottom: 16, borderBottom: "1px solid #E2E4DF" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{dienst.naam}</div>
                        <div style={{ fontSize: 13, color: "#3A4038", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {bijlageToelichtingen[dienst.id]}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            </div>

            {offerteVraagStatusTonen && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#EAF2F8",
                  border: "1px solid #B7CFE0",
                  marginTop: 20,
                }}
              >
                <span style={{ fontSize: 13, color: "#1C5D8C" }}>
                  Offerte afgedrukt/opgeslagen als PDF. Status bijwerken naar "Verzonden"?
                </span>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="ot-btn-secondary" onClick={() => setOfferteVraagStatusTonen(false)}>
                    Nee, laten staan
                  </button>
                  <button
                    onClick={zetOfferteOpVerzonden}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "none",
                      background: "#1C5D8C",
                      color: "#fff",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Check size={14} />
                    Ja, zet op Verzonden
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
              <button className="ot-btn-secondary" onClick={vorige}>
                <ChevronLeft size={15} />
                Terug naar bijlage
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#8A9089" }}>
                  {offerteOpslaanStatus === "bezig" && "Offerte opslaan…"}
                  {offerteOpslaanStatus === "opgeslagen" && (
                    <>
                      <Save size={12} style={{ verticalAlign: "-1px", marginRight: 4 }} />
                      Opgeslagen
                    </>
                  )}
                  {offerteOpslaanStatus === "fout" && (
                    <span style={{ color: "#B14A2E" }}>Opslaan mislukt (offerte blijft wel bruikbaar)</span>
                  )}
                </span>
                <button className="ot-btn-primary" onClick={afdrukken}>
                  <Printer size={15} />
                  {gekozenKlanten.length > 1 ? "Alles afdrukken / opslaan als PDF" : "Afdrukken / opslaan als PDF"}
                </button>
              </div>
            </div>
            </>
            )}
          </StapWrapper>
        )}
      </div>
    </div>
  );
}

const stapKnopStyle = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: "1px solid #C8CDC5",
  background: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function StapWrapper({ titel, toelichting, children }) {
  return (
    <div>
      <h2 className="offertetool-serif" style={{ fontSize: 22, marginBottom: 4 }}>{titel}</h2>
      <p style={{ fontSize: 13.5, color: "#5B6259", marginBottom: 22 }}>{toelichting}</p>
      {children}
    </div>
  );
}

function StapNavigatie({ onVorige, onVolgende, volgendeDisabled, volgendeLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
      {onVorige ? (
        <button className="ot-btn-secondary" onClick={onVorige}>
          <ChevronLeft size={15} />
          Vorige
        </button>
      ) : (
        <span />
      )}
      <button className="ot-btn-primary" onClick={onVolgende} disabled={volgendeDisabled}>
        {volgendeLabel}
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
