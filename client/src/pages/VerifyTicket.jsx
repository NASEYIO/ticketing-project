// FILE: src/pages/VerifyTicket.jsx
import { useState } from "react";
import Button from "../components/Button";
import { api } from "../services/api";

function VerifyTicket() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    const data = await api.verifyTicket(code.trim());
    setResult(data);
    setIsLoading(false);
  };

  const statusColor = result?.valid ? "#16a34a" : "#dc2626";
  const statusBg = result?.valid ? "#f0fdf4" : "#fef2f2";
  const statusBorder = result?.valid ? "#86efac" : "#fca5a5";

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <h2 style={{ marginTop: 0 }}>🔍 Verify a Ticket</h2>
        <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
          Buying from someone other than VibePass directly? Paste their ticket's entry code below
          to check if it's genuine before you pay. <b>Never send money for a ticket that fails this check.</b>
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
          <input
            type="text"
            required
            placeholder="Paste the entry code here"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", fontFamily: "monospace" }}
          />
          <Button type="submit" isLoading={isLoading} size="lg">
            Check This Ticket
          </Button>
        </form>

        {result && (
          <div style={{ marginTop: "24px", padding: "16px", borderRadius: "10px", background: statusBg, border: `1px solid ${statusBorder}` }}>
            <p style={{ margin: 0, fontWeight: "700", color: statusColor, fontSize: "1rem" }}>
              {result.valid ? "✅ Genuine Ticket" : "⚠️ Not Safe To Buy"}
            </p>
            <p style={{ margin: "8px 0 0 0", color: "#334155", fontSize: "0.9rem" }}>{result.message}</p>

            {result.eventTitle && (
              <div style={{ marginTop: "12px", fontSize: "0.9rem", color: "#475569" }}>
                <p style={{ margin: "2px 0" }}><b>Event:</b> {result.eventTitle}</p>
                {result.venue && <p style={{ margin: "2px 0" }}><b>Venue:</b> {result.venue}</p>}
                {result.date && <p style={{ margin: "2px 0" }}><b>Date:</b> {new Date(result.date).toLocaleDateString("en-KE")}</p>}
                {result.tierName && <p style={{ margin: "2px 0" }}><b>Tier:</b> {result.tierName}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyTicket;