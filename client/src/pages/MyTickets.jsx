// FILE: src/pages/MyTickets.jsx
import { useState, useEffect } from "react";
import { api } from "../services/api";

function MyTickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

 useEffect(() => {
    const fetchMyTickets = async () => {
      try {
        // Fetch directly from the un-guarded route that tracks the database buyer
        const response = await fetch("http://localhost:5000/api/tickets/my-wallet", {
          headers: {
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not retrieve your digital ticket cache.");
        
        setTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Wallet Fetch Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTickets();
  }, []);

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading your secured entry wallet...</div>;

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px" }}>
      <h2>🎟️ Your Secured Entry Wallet</h2>
      <p style={{ color: "#64748b" }}>Present these digital access tokens directly to staff at venue entry points for verification scanning.</p>

      {error && (
        <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", marginTop: "10px" }}>
          ⚠️ {error}
        </div>
      )}

      {tickets.length === 0 && !error ? (
        <div style={{ textAlign: "center", padding: "40px", border: "2px dashed #cbd5e1", borderRadius: "12px", marginTop: "20px" }}>
          <p>You don't own any active ticket passes yet. Once your M-Pesa transaction clears, your tickets will appear here automatically!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
          {tickets.map((ticket) => (
            <div key={ticket.id} style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", background: "#dbeafe", color: "#1e40af", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>
                  {ticket.status}
                </span>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {ticket.tier?.event?.date ? new Date(ticket.tier.event.date).toLocaleDateString("en-KE") : "N/A"}
                </span>
              </div>
              <h4 style={{ margin: "10px 0 5px 0", fontSize: "1.2rem" }}>{ticket.tier?.event?.title || "Event Ticket"}</h4>
              <p style={{ margin: "0 0 15px 0", fontSize: "0.95rem", color: "#475569" }}>
                <b>Tier:</b> {ticket.tier?.name || "Standard"} — <b>Venue:</b> {ticket.tier?.event?.venue || "Main Gate"}
              </p>
              
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", fontFamily: "monospace", fontSize: "0.95rem", textAlign: "center", border: "1px dashed #cbd5e1", color: "#0f172a" }}>
                🔑 ENTRY CODE: {ticket.secretCode}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTickets;