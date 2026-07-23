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

let volgnr = 1;
function nieuwId(prefix) {
  volgnr += 1;
  return `${prefix}-${Date.now().toString(36)}-${volgnr}`;
}

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

function klantAdresRegels(klant) {
  const nummerDeel = `${klant.huisnummer || ""}${klant.huisnummertoevoeging || ""}`.trim();
  const straatRegel = [klant.straat, nummerDeel].filter(Boolean).join(" ");
  const plaatsRegel = [klant.postcode, klant.plaats].filter(Boolean).join(" ");
  return [straatRegel, plaatsRegel].filter(Boolean);
}

function genereerStandaardLogo(bedrijfsnaam) {
  const initialen = (bedrijfsnaam || "OF")
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0] || ""))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "OF";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
    <rect width='200' height='200' rx='30' fill='#1C5D8C'/>
    <circle cx='158' cy='46' r='10' fill='#B98237'/>
    <text x='96' y='134' font-family='Georgia, serif' font-size='92' font-weight='600' fill='#F5F6F4' text-anchor='middle'>${initialen}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
          const naam = principal.userDetails;
          setEchteGebruiker({
            naam,
            email: naam,
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
        if (window.storage) {
          const resultaat = await window.storage.get("afzender", false);
          if (actief && resultaat?.value) {
            setAfzender(JSON.parse(resultaat.value));
          }
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
        if (window.storage) await window.storage.set("afzender", JSON.stringify(afzender), false);
      } catch (e) {
        // opslaan mislukt — wijzigingen blijven dan wel zichtbaar voor deze sessie
      }
    })();
  }, [afzender, afzenderGeladen]);

  const [logo, setLogo] = useState(null); // base64/SVG data-URL van het logo, of null zolang het nog laadt
  const [logoGeladen, setLogoGeladen] = useState(false);

  // Logo laden uit persistente opslag; anders eenmalig een standaardlogo genereren en opslaan.
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        if (window.storage) {
          const resultaat = await window.storage.get("logo", false);
          if (actief && resultaat?.value) {
            setLogo(resultaat.value);
            setLogoGeladen(true);
            return;
          }
        }
      } catch (e) {
        // nog geen logo opgeslagen, of opslag niet beschikbaar — dan vullen we de standaard in
      }
      if (!actief) return;
      const standaard = genereerStandaardLogo(afzender.bedrijf);
      setLogo(standaard);
      setLogoGeladen(true);
      try {
        if (window.storage) await window.storage.set("logo", standaard, false);
      } catch (e) {
        // opslaan mislukt — logo blijft dan wel zichtbaar voor deze sessie
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
        if (window.storage) await window.storage.set("logo", dataUrl, false);
      } catch (err) {
        // opslaan mislukt — logo blijft dan wel zichtbaar voor deze sessie
      }
    };
    reader.readAsDataURL(bestand);
  }

  async function logoVerwijderen() {
    setLogo(null);
    try {
      if (window.storage) await window.storage.delete("logo", false);
    } catch (e) {
      // niets opgeslagen om te verwijderen
    }
  }

  const [dienstenCatalogus, setDienstenCatalogus] = useState(INITIAL_CATALOGUS);
  const [catalogusGeladen, setCatalogusGeladen] = useState(false);

  const [zoekKlant, setZoekKlant] = useState("");
  const [gekozenKlanten, setGekozenKlanten] = useState([]); // array van klant-objecten

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
        if (window.storage) {
          const [algemeenResultaat, perDienstResultaat, perKlantResultaat] = await Promise.all([
            window.storage.get("bijlage-algemeen", false).catch(() => null),
            window.storage.get("bijlage-per-dienst", false).catch(() => null),
            window.storage.get("bijlage-per-klant", false).catch(() => null),
          ]);
          if (actief) {
            if (algemeenResultaat?.value) setAlgemeneToelichting(algemeenResultaat.value);
            if (perDienstResultaat?.value) setBijlageToelichtingen(JSON.parse(perDienstResultaat.value));
            if (perKlantResultaat?.value) setKlantToelichtingen(JSON.parse(perKlantResultaat.value));
          }
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
        if (window.storage) await window.storage.set("bijlage-algemeen", algemeneToelichting, false);
      } catch (e) {}
    })();
  }, [algemeneToelichting, bijlageGeladen]);

  useEffect(() => {
    if (!bijlageGeladen) return;
    (async () => {
      try {
        if (window.storage) await window.storage.set("bijlage-per-dienst", JSON.stringify(bijlageToelichtingen), false);
      } catch (e) {}
    })();
  }, [bijlageToelichtingen, bijlageGeladen]);

  useEffect(() => {
    if (!bijlageGeladen) return;
    (async () => {
      try {
        if (window.storage) await window.storage.set("bijlage-per-klant", JSON.stringify(klantToelichtingen), false);
      } catch (e) {}
    })();
  }, [klantToelichtingen, bijlageGeladen]);

  // standaardTeksten: herbruikbare standaardteksten, net als de dienstencatalogus zelf te beheren
  const [standaardTeksten, setStandaardTeksten] = useState({
    algemeen: "",
    perDienst: {}, // { [dienstId]: tekst }
  });
  const [tekstenGeladen, setTekstenGeladen] = useState(false);

  // Dienstencatalogus laden uit persistente opslag (valt terug op de ingebouwde standaardlijst).
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        if (window.storage) {
          const resultaat = await window.storage.get("dienstencatalogus", false);
          if (actief && resultaat?.value) {
            setDienstenCatalogus(JSON.parse(resultaat.value));
          }
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
        if (window.storage) await window.storage.set("dienstencatalogus", JSON.stringify(dienstenCatalogus), false);
      } catch (e) {
        // opslaan mislukt — wijzigingen blijven dan wel zichtbaar voor deze sessie
      }
    })();
  }, [dienstenCatalogus, catalogusGeladen]);

  // Standaardteksten laden uit persistente opslag.
  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        if (window.storage) {
          const resultaat = await window.storage.get("standaardteksten", false);
          if (actief && resultaat?.value) {
            setStandaardTeksten(JSON.parse(resultaat.value));
          }
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
        if (window.storage) await window.storage.set("standaardteksten", JSON.stringify(standaardTeksten), false);
      } catch (e) {
        // opslaan mislukt — wijzigingen blijven dan wel zichtbaar voor deze sessie
      }
    })();
  }, [standaardTeksten, tekstenGeladen]);

  // Klanten ophalen bij de eigen Dynamics-koppeling (Azure Function op /api/klanten).
  // Lukt dit niet (nog niet geconfigureerd, lokale ontwikkeling, of een fout) dan valt
  // de tool terug op de voorbeeldklanten, zodat de tool altijd blijft werken.
  const [klantenBron, setKlantenBron] = useState(MOCK_KLANTEN);
  const [klantenUitDynamics, setKlantenUitDynamics] = useState(false);

  useEffect(() => {
    let actief = true;
    fetch("/api/klanten")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!actief) return;
        if (Array.isArray(data) && data.length > 0) {
          setKlantenBron(data);
          setKlantenUitDynamics(true);
        }
      })
      .catch(() => {
        // API nog niet beschikbaar/geconfigureerd — voorbeelddata blijft dan gewoon staan
      });
    return () => {
      actief = false;
    };
  }, []);

  const gefilterdeKlanten = useMemo(() => {
    const q = zoekKlant.trim().toLowerCase();
    if (!q) return klantenBron;
    return klantenBron.filter(
      (k) =>
        k.naam.toLowerCase().includes(q) ||
        (k.plaats || "").toLowerCase().includes(q) ||
        (k.segment || "").toLowerCase().includes(q)
    );
  }, [zoekKlant, klantenBron]);

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
    if (variant?.prijs === null) return { prijs: 0, opAanvraag: true, variant };
    return { prijs: variant?.prijs ?? 0, opAanvraag: false, variant };
  }

  function prijsVoor(klantId, dienst) {
    const key = prijsSleutel(klantId, dienst.id);
    const override = aangepastePrijzen[key];
    const catalogus = catalogusPrijsVoor(klantId, dienst);
    if (override !== undefined && override !== "" && override !== null) {
      return { prijs: Number(override), opAanvraag: false, variant: catalogus.variant };
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
        const { prijs, opAanvraag, variant } = prijsVoor(klantId, dienst);
        return {
          id: dienst.id,
          naam: variant?.naam ? `${dienst.naam} — ${variant.naam}` : dienst.naam,
          eenheid: dienst.eenheid,
          categorie: dienst.categorie,
          aantal,
          prijs,
          opAanvraag,
          subtotaal: opAanvraag ? 0 : aantal * prijs,
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
    setIngelogd(false);
    setGekozenKlanten([]);
    setGeselecteerd({});
    setKlantVarianten({});
    setAangepastePrijzen({});
    setUitgeschakeldVoorKlant({});
    setStap("login");
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
  function openCatalogus() {
    if (stap !== "catalogus" && stap !== "teksten") setTerugNaarStap(stap);
    setStap("catalogus");
  }
  function openTeksten() {
    if (stap !== "catalogus" && stap !== "teksten") setTerugNaarStap(stap);
    setStap("teksten");
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

  function afdrukken() {
    window.print();
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
            toelichting="Deze gegevens komen op elke offerte te staan. Standaard ingevuld vanuit uw Dynamics-profiel — u kunt ze per offerte aanpassen."
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
              <div>
                <label className="ot-label">Ondertekenaar</label>
                <input className="ot-input" value={afzender.ondertekenaar} onChange={(e) => setAfzender({ ...afzender, ondertekenaar: e.target.value })} />
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
                              <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#8A9089", borderBottom: "1px solid #E2E4DF", width: 170 }}>Prijs</th>
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
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ position: "relative", flex: 1 }}>
                                      <span style={{ position: "absolute", left: 10, top: 10, fontSize: 13, color: "#8A9089" }}>€</span>
                                      <input
                                        className="ot-input"
                                        style={{ paddingLeft: 22 }}
                                        type="number"
                                        step="0.01"
                                        disabled={v.prijs === null}
                                        value={v.prijs === null ? "" : v.prijs}
                                        placeholder={v.prijs === null ? "op aanvraag" : ""}
                                        onChange={(e) => bijwerkVariant(dienst.id, v.id, "prijs", e.target.value === "" ? 0 : Number(e.target.value))}
                                      />
                                    </div>
                                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#5B6259", whiteSpace: "nowrap" }}>
                                      <input
                                        type="checkbox"
                                        checked={v.prijs === null}
                                        onChange={(e) => bijwerkVariant(dienst.id, v.id, "prijs", e.target.checked ? null : 0)}
                                        style={{ accentColor: "#1C5D8C" }}
                                      />
                                      op aanvraag
                                    </label>
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
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "#8A9089" }} />
              <input
                className="ot-input"
                style={{ paddingLeft: 36 }}
                placeholder="Zoek op klantnaam, plaats of klantgroep…"
                value={zoekKlant}
                onChange={(e) => setZoekKlant(e.target.value)}
              />
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
              {gefilterdeKlanten.length > 10 && (
                <div style={{ textAlign: "center", padding: "10px 4px", color: "#8A9089", fontSize: 12.5 }}>
                  {gefilterdeKlanten.length - 10} meer klant{gefilterdeKlanten.length - 10 > 1 ? "en" : ""} gevonden — verfijn uw zoekopdracht om ze te zien.
                </div>
              )}
              {gefilterdeKlanten.length === 0 && (
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
                      const prijzen = dienst.varianten.map((v) => v.prijs).filter((p) => p !== null);
                      const prijsIndicatie =
                        !meerdereVarianten
                          ? dienst.varianten[0].prijs === null
                            ? "op aanvraag"
                            : `${currency(dienst.varianten[0].prijs)} / ${dienst.eenheid}`
                          : prijzen.length
                          ? `${currency(Math.min(...prijzen))} – ${currency(Math.max(...prijzen))} / ${dienst.eenheid}`
                          : "op aanvraag";

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
                              aangepastePrijzen[key] !== undefined ? aangepastePrijzen[key] : variant?.prijs === null ? "" : variant.prijs;
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
                                    placeholder={variant?.prijs === null ? "op aanvraag" : ""}
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
                        style={{ maxWidth: 180, maxHeight: 72, objectFit: "contain", flexShrink: 0, marginLeft: 24 }}
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
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{afzender.ondertekenaar}</div>
                      <div style={{ fontSize: 13, color: "#5B6259" }}>{huidigeGebruiker.email}</div>
                    </div>
                  </div>

                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#3A4038", marginBottom: 24 }}>{afzender.inleiding}</p>

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
                                {r.opAanvraag ? "op aanvraag" : currency(r.prijs)}
                              </td>
                              <td style={{ padding: "10px 4px", textAlign: "right", fontSize: 13.5, fontWeight: 700 }}>
                                {r.opAanvraag ? "—" : currency(r.subtotaal)}
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
                </div>
              );
            })}

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
                      style={{ maxWidth: 160, maxHeight: 64, objectFit: "contain", flexShrink: 0, marginLeft: 24 }}
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

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button className="ot-btn-secondary" onClick={vorige}>
                <ChevronLeft size={15} />
                Terug naar bijlage
              </button>
              <button className="ot-btn-primary" onClick={afdrukken}>
                <Printer size={15} />
                {gekozenKlanten.length > 1 ? "Alles afdrukken / opslaan als PDF" : "Afdrukken / opslaan als PDF"}
              </button>
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
