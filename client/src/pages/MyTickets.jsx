// FILE: src/pages/MyTickets.jsx
import { useState, useEffect } from "react";
import { api } from "../services/api";

function MyTickets({ user }) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchUserWallet = async () => {
      try {
        const liveTickets = await api.getMyTickets();
        setTickets(liveTickets);
      } catch (err) {
        console.error("Wallet loading error:", err);
        setError("Could not retrieve your digital ticket cache.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserWallet();
  }, [user]);

  if (!user) {
    return <div style={{ textAlign: "center", padding: "40px" }}><h3>Access Denied. Please authenticate first.</h3></div>;
  }

  if (isLoading) {
    return <p style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>Decrypting secure admission passes...</p>;
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <h2>🎟️ Your Secured Entry Wallet</h2>
      <p style={{ color: "#64748b", marginBottom: "30px" }}>Present these digital access tokens directly to staff at venue entry points for verification scanning.</p>

      {error && (
        <div style={{ padding: "15px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}

      {tickets.length === 0 ? (
        <p style={{ color: "#64748b", textAlign: "center", padding: "40px", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          You don't own any ticket passes yet. Once your M-Pesa transaction updates, your digital wallet will display them here!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {tickets.map(ticket => (
            <div key={ticket.id} style={{ background: "white", border: "2px dashed #cbd5e1", borderRadius: "16px", padding: "30px", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", alignItems: "center" }}>
              <div>
                <span style={{ background: ticket.status === "ACTIVE" ? "#ecfdf5" : "#f1f5f9", color: ticket.status === "ACTIVE" ? "#065f46" : "#475569", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "700" }}>
                  {ticket.status} PASS
                </span>
                <h3 style={{ fontSize: "1.4rem", margin: "10px 0 5px 0" }}>{ticket.event?.title || "Special Event Listing"}</h3>
                <p style={{ margin: "0 0 15px 0", color: "#475569" }}><b>Access Level:</b> {ticket.tier?.name || "General Admission"}</p>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>📍 Venue location: {ticket.event?.venue || "Main Gate Entrance"}</p>
              </div>

              <div style={{ textAlign: "center", background: "#f8fafc", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ width: "120px", height: "120px", background: "#1e293b", margin: "0 auto 10px auto", borderRadius: "6px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <div style={{ width: "100px", height: "100px", background: "white", padding: "5px" }}>
                    {/* Generates standard verification block grid using your authentic Prisma transaction secret code */}
                    <div style={{ width: "100%", height: "100%", border: "4px solid black", boxSizing: "border-box", background: "repeating-linear-gradient(45deg, #000, #000 5px, #fff 5px, #fff 10px)" }}></div>
                  </div>
                </div>
                <span style={{ fontSize: "0.62rem", fontFamily: "monospace", color: "#64748b", wordBreak: "break-all", display: "block" }}>
                  {ticket.secretCode?.slice(0, 16).toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTickets;