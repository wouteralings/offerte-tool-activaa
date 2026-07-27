import React, { useState, useEffect, useRef } from "react";
import { Check, X, Loader2, ShieldCheck, ShieldAlert, Eraser } from "lucide-react";
import { ACTIVAA_LOGO, CATEGORIE_LABELS, currency, datumTijd, offerteStatusInfo } from "./App.jsx";

// Publieke, niet-ingelogde pagina waarmee een klant een offerte kan bekijken en digitaal kan
// ondertekenen (naam + e-mail + een echte, met muis/vinger getekende handtekening) of expliciet
// kan afwijzen. Het offerte-ID in de link functioneert als toegangssleutel — er is bewust geen
// Microsoft-login voor nodig, zodat klanten die niet bij Activaa werken de link gewoon kunnen
// openen.
export default function TekenPagina({ id }) {
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState(null);
  const [record, setRecord] = useState(null);

  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [opmerking, setOpmerking] = useState("");
  const [bezig, setBezig] = useState(false);
  const [resultaat, setResultaat] = useState(null); // { akkoord, naam, op, handtekening } na succesvolle actie
  const [inzendFout, setInzendFout] = useState(null);

  // Handtekening-canvas: tekenen met muis of vinger.
  const canvasRef = useRef(null);
  const tekentRef = useRef(false);
  const laatstePuntRef = useRef(null);
  const [handtekeningLeeg, setHandtekeningLeeg] = useState(true);

  function canvasPositie(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const punt = event.touches ? event.touches[0] : event;
    return {
      x: ((punt.clientX - rect.left) / rect.width) * canvas.width,
      y: ((punt.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function tekenStart(event) {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    tekentRef.current = true;
    laatstePuntRef.current = canvasPositie(canvas, event);
  }

  function tekenBeweeg(event) {
    if (!tekentRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const nieuw = canvasPositie(canvas, event);
    ctx.strokeStyle = "#1C2E3D";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(laatstePuntRef.current.x, laatstePuntRef.current.y);
    ctx.lineTo(nieuw.x, nieuw.y);
    ctx.stroke();
    laatstePuntRef.current = nieuw;
    setHandtekeningLeeg(false);
  }

  function tekenStop() {
    tekentRef.current = false;
  }

  function wisHandtekening() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHandtekeningLeeg(true);
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/teken/${encodeURIComponent(id)}`);
        if (!res.ok) {
          setFout(res.status === 404 ? "Deze offerte kon niet worden gevonden." : "Er ging iets mis bij het laden.");
          return;
        }
        const data = await res.json();
        setRecord(data);
      } catch (e) {
        setFout("Er ging iets mis bij het laden. Controleer je internetverbinding.");
      } finally {
        setLaden(false);
      }
    })();
  }, [id]);

  async function versturen(akkoord) {
    if (!naam.trim() || !email.trim()) {
      setInzendFout("Vul zowel je naam als je e-mailadres in.");
      return;
    }
    if (akkoord && handtekeningLeeg) {
      setInzendFout("Zet eerst je handtekening in het vak hierboven voordat je ondertekent.");
      return;
    }
    setInzendFout(null);
    setBezig(true);
    try {
      const handtekening = akkoord && canvasRef.current ? canvasRef.current.toDataURL("image/png") : null;
      const res = await fetch(`/api/teken/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naam: naam.trim(), email: email.trim(), opmerking: opmerking.trim(), akkoord, handtekening }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.ondertekening) {
          setResultaat(data.ondertekening);
          return;
        }
        setInzendFout(data.error || "Versturen is niet gelukt. Probeer het nogmaals.");
        return;
      }
      setResultaat(data.ondertekening);
    } catch (e) {
      setInzendFout("Versturen is niet gelukt. Controleer je internetverbinding en probeer het nogmaals.");
    } finally {
      setBezig(false);
    }
  }

  const scherm = {
    minHeight: "100vh",
    background: "#F5F6F4",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    color: "#2B2F2A",
    padding: "32px 16px",
  };
  const kaart = {
    maxWidth: 720,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #E2E4DF",
    overflow: "hidden",
  };
  const invoer = {
    width: "100%",
    border: "1px solid #C8CDC5",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  if (laden) {
    return (
      <div style={{ ...scherm, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} className="ot-spin" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (fout) {
    return (
      <div style={scherm}>
        <div style={{ ...kaart, padding: 32, textAlign: "center" }}>
          <ShieldAlert size={32} color="#B14A2E" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15 }}>{fout}</p>
        </div>
      </div>
    );
  }

  // Al eerder ondertekend/afgewezen — of net nu ondertekend.
  const definitieveOndertekening = resultaat || record?.ondertekening;

  const klantNamen = record?.klantNamen?.length ? record.klantNamen.join(", ") : "";
  const regelsPerKlant = record?.data?.regelsPerKlant || {};
  const gekozenKlanten = record?.data?.gekozenKlanten || [];
  const algemeneToelichting = record?.data?.algemeneToelichting || "";

  return (
    <div style={scherm}>
      <div style={kaart}>
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #E2E4DF", display: "flex", alignItems: "center", gap: 14 }}>
          <img src={ACTIVAA_LOGO} alt="Logo" style={{ height: 40, width: "auto" }} />
          <div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#8A9089", fontWeight: 700 }}>
              Offerte ter ondertekening
            </div>
            {klantNamen && <div style={{ fontSize: 15, fontWeight: 700 }}>{klantNamen}</div>}
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {algemeneToelichting && (
            <p style={{ fontSize: 13.5, color: "#5B6259", marginBottom: 20, whiteSpace: "pre-wrap" }}>{algemeneToelichting}</p>
          )}

          {gekozenKlanten.map((klant) => {
            const regels = regelsPerKlant[klant.id] || [];
            const subtotaal = regels.reduce((s, r) => s + r.subtotaal, 0);
            const btw = subtotaal * 0.21;
            const totaal = subtotaal + btw;
            const gegroepeerd = ["eenmalig", "doorlopend"]
              .map((cat) => ({ cat, items: regels.filter((r) => r.categorie === cat) }))
              .filter((g) => g.items.length > 0);

            return (
              <div key={klant.id} style={{ marginBottom: 24 }}>
                {gekozenKlanten.length > 1 && (
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>{klant.naam}</div>
                )}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E2E4DF" }}>
                      <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 11, color: "#8A9089", textTransform: "uppercase" }}>Dienst</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 11, color: "#8A9089", textTransform: "uppercase" }}>Aantal</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 11, color: "#8A9089", textTransform: "uppercase" }}>Prijs</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 11, color: "#8A9089", textTransform: "uppercase" }}>Subtotaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gegroepeerd.map((g) => (
                      <React.Fragment key={g.cat}>
                        <tr>
                          <td colSpan={4} style={{ padding: "10px 4px 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#B98237" }}>
                            {CATEGORIE_LABELS[g.cat] || g.cat}
                          </td>
                        </tr>
                        {g.items.map((r) => (
                          <tr key={r.id} style={{ borderBottom: "1px solid #F0EEE6" }}>
                            <td style={{ padding: "8px 4px" }}>{r.naam}</td>
                            <td style={{ padding: "8px 4px", textAlign: "right" }}>{r.aantal} {r.eenheid}</td>
                            <td style={{ padding: "8px 4px", textAlign: "right" }}>
                              {r.opAanvraag ? "op aanvraag" : r.opNacalculatie ? "nacalculatie" : currency(r.prijs)}
                            </td>
                            <td style={{ padding: "8px 4px", textAlign: "right", fontWeight: 700 }}>
                              {r.opAanvraag || r.opNacalculatie ? "—" : currency(r.subtotaal)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <div style={{ width: 220, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#5B6259" }}>
                      <span>Subtotaal</span>
                      <span>{currency(subtotaal)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#5B6259" }}>
                      <span>Btw (21%)</span>
                      <span>{currency(btw)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid #E2E4DF", fontWeight: 700 }}>
                      <span>Totaal</span>
                      <span>{currency(totaal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "24px 28px", borderTop: "1px solid #E2E4DF", background: "#FAFAF7" }}>
          {definitieveOndertekening ? (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: 16,
                borderRadius: 10,
                background: definitieveOndertekening.akkoord ? "#E7F4EC" : "#FBF2EC",
                border: `1px solid ${definitieveOndertekening.akkoord ? "#BFE0CC" : "#E2C4B0"}`,
              }}
            >
              {definitieveOndertekening.akkoord ? (
                <ShieldCheck size={22} color="#2E7D4F" style={{ flexShrink: 0, marginTop: 2 }} />
              ) : (
                <ShieldAlert size={22} color="#B14A2E" style={{ flexShrink: 0, marginTop: 2 }} />
              )}
              <div style={{ fontSize: 13.5 }}>
                <strong>
                  {definitieveOndertekening.akkoord
                    ? "Deze offerte is ondertekend."
                    : "Deze offerte is afgewezen."}
                </strong>
                <div style={{ marginTop: 4, color: "#5B6259" }}>
                  Door {definitieveOndertekening.naam} ({definitieveOndertekening.email})<br />
                  op {datumTijd(definitieveOndertekening.op)}
                </div>
                {definitieveOndertekening.handtekening && (
                  <div style={{ marginTop: 10 }}>
                    <img
                      src={definitieveOndertekening.handtekening}
                      alt="Handtekening"
                      style={{ maxWidth: 260, background: "#fff", border: "1px solid #E2E4DF", borderRadius: 6 }}
                    />
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 11.5, color: "#8A9089" }}>
                  Vastgelegd inclusief tijdstip en IP-adres, als bevestiging van deze reactie.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Naam</label>
                  <input style={invoer} value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Voor- en achternaam" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>E-mailadres</label>
                  <input
                    style={invoer}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="naam@bedrijf.nl"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Toelichting (optioneel)
                  </label>
                  <textarea
                    style={{ ...invoer, minHeight: 70, resize: "vertical" }}
                    value={opmerking}
                    onChange={(e) => setOpmerking(e.target.value)}
                    placeholder="Eventuele opmerkingen…"
                  />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>
                      Handtekening (nodig om akkoord te geven — teken met muis of vinger)
                    </label>
                    <button
                      type="button"
                      onClick={wisHandtekening}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        border: "none",
                        background: "none",
                        color: "#8A9089",
                        fontSize: 11.5,
                        cursor: "pointer",
                        padding: 2,
                      }}
                    >
                      <Eraser size={12} />
                      Wissen
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={180}
                    onMouseDown={tekenStart}
                    onMouseMove={tekenBeweeg}
                    onMouseUp={tekenStop}
                    onMouseLeave={tekenStop}
                    onTouchStart={tekenStart}
                    onTouchMove={tekenBeweeg}
                    onTouchEnd={tekenStop}
                    style={{
                      width: "100%",
                      height: 140,
                      display: "block",
                      background: "#FAFAF7",
                      border: "1px solid #C8CDC5",
                      borderRadius: 8,
                      touchAction: "none",
                      cursor: "crosshair",
                    }}
                  />
                </div>
              </div>

              {inzendFout && (
                <div style={{ fontSize: 12.5, color: "#B14A2E", marginBottom: 12 }}>{inzendFout}</div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  disabled={bezig}
                  onClick={() => versturen(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "none",
                    background: "#1C5D8C",
                    color: "#fff",
                    padding: "12px 20px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: bezig ? "default" : "pointer",
                    opacity: bezig ? 0.6 : handtekeningLeeg ? 0.5 : 1,
                  }}
                >
                  <Check size={16} />
                  Akkoord — ondertekenen
                </button>
                <button
                  disabled={bezig}
                  onClick={() => versturen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #C8CDC5",
                    background: "#fff",
                    color: "#5B6259",
                    padding: "12px 20px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: bezig ? "default" : "pointer",
                    opacity: bezig ? 0.6 : 1,
                  }}
                >
                  <X size={16} />
                  Niet akkoord
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#8A9089", marginTop: 12 }}>
                Voor akkoord is een handtekening in het vak hierboven verplicht; voor "Niet akkoord" hoeft dat niet.
                Door te versturen bevestig je dat jij deze reactie geeft. We leggen daarbij je naam, e-mailadres,
                handtekening, het tijdstip en je IP-adres vast als bewijs.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
