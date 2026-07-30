// FILE: src/pages/MyTickets.jsx
import { useState, useEffect } from "react";
import { api } from "../services/api";
import Button from "../components/Button";
import { Link } from "react-router-dom";

function MyTickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [transferModalTicketId, setTransferModalTicketId] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSendingTransfer, setIsSendingTransfer] = useState(false);
  const [transferMessage, setTransferMessage] = useState("");

  const fetchMyTickets = async () => {
    try {
      const data = await api.getMyTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Wallet Fetch Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const handleSendTransfer = async (e) => {
    e.preventDefault();
    setIsSendingTransfer(true);
    try {
      const result = await api.createTransfer(transferModalTicketId, recipientEmail);
      setTransferMessage(result.message);
      setRecipientEmail("");
      setTransferModalTicketId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSendingTransfer(false);
    }
  };

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--text)" }}>Loading your secured entry wallet...</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px" }}>
      <h2 style={{ color: "var(--text-h)" }}>🎟️ Your Secured Entry Wallet</h2>
      <p style={{ color: "var(--text-muted)" }}>Present these digital access tokens directly to staff at venue entry points for verification scanning.</p>

      {error && (
        <div style={{ padding: "12px", background: "rgba(166,43,30,0.08)", color: "var(--sol-red, #A62B1E)", borderRadius: "6px", marginTop: "10px", border: "1px solid rgba(166,43,30,0.25)" }}>
          ⚠️ {error}
        </div>
      )}

      {transferMessage && (
        <div style={{ padding: "16px", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.35)", borderRadius: "10px", marginTop: "16px" }}>
          <p style={{ margin: 0, color: "#166534" }}>✅ {transferMessage}</p>
          <Button size="sm" variant="secondary" onClick={() => setTransferMessage("")} style={{ marginTop: "8px" }}>Done</Button>
        </div>
      )}

      {tickets.length === 0 && !error ? (
        <div style={{ textAlign: "center", padding: "40px", border: "2px dashed var(--border)", borderRadius: "12px", marginTop: "20px", color: "var(--text)" }}>
          <p>You don't own any active ticket passes yet. Once your M-Pesa transaction clears, your tickets will appear here automatically!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
          {tickets.map((ticket) => (
            <div key={ticket.id} style={{ background: "var(--sol-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", background: "rgba(247,181,0,0.15)", color: "var(--accent)", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", border: "1px solid rgba(247,181,0,0.3)" }}>
                  {ticket.status}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {ticket.tier?.event?.date ? new Date(ticket.tier.event.date).toLocaleDateString("en-KE") : "N/A"}
                </span>
              </div>
              <h4 style={{ margin: "10px 0 5px 0", fontSize: "1.2rem", color: "var(--text-h)" }}>{ticket.tier?.event?.title || "Event Ticket"}</h4>
              <p style={{ margin: "0 0 15px 0", fontSize: "0.95rem", color: "var(--text)" }}>
                <b>Tier:</b> {ticket.tier?.name || "Standard"} — <b>Venue:</b> {ticket.tier?.event?.venue || "Main Gate"}
              </p>

              <div style={{ background: "var(--code-bg)", padding: "12px", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.95rem", textAlign: "center", border: "1px dashed var(--border)", color: "var(--text-h)", marginBottom: "12px" }}>
                🔑 ENTRY CODE: {ticket.secretCode}
              </div>

              <Link to={`/t/${ticket.id}`} style={{ textDecoration: "none" }}>
                <Button size="sm" fullWidth style={{ marginBottom: "8px" }}>
                  📱 View QR Code
                </Button>
              </Link>

              {ticket.status === "ACTIVE" && (
                transferModalTicketId === ticket.id ? (
                  <form onSubmit={handleSendTransfer} style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <input
                      type="email"
                      required
                      placeholder="Recipient's email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-h)" }}
                    />
                    <Button type="submit" size="sm" isLoading={isSendingTransfer}>Send</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setTransferModalTicketId(null)}>Cancel</Button>
                  </form>
                ) : (
                  <Button size="sm" variant="secondary" fullWidth onClick={() => setTransferModalTicketId(ticket.id)}>
                    🔁 Transfer This Ticket
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTickets;