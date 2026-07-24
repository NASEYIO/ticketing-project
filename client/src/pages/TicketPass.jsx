// FILE: src/pages/TicketPass.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../services/api";

function TicketPass() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getTicketById(ticketId)
      .then(setTicket)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [ticketId]);

  if (isLoading) {
    return <div style={{ padding: "60px", textAlign: "center" }}>Loading your ticket...</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: "450px", margin: "60px auto", padding: "40px", textAlign: "center" }}>
        <h3>⚠️ {error}</h3>
        <Link to="/buyer/tickets" style={{ color: "#2563eb" }}>Back to My Tickets</Link>
      </div>
    );
  }

  const statusColors = {
    ACTIVE: { bg: "#ecfdf5", text: "#065f46" },
    USED: { bg: "#f1f5f9", text: "#475569" },
    REFUNDED: { bg: "#fef2f2", text: "#b91c1c" },
  };
  const statusStyle = statusColors[ticket.status] || statusColors.ACTIVE;

  return (
    <div style={{ maxWidth: "420px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ background: "white", border: "2px dashed #cbd5e1", borderRadius: "16px", padding: "30px", textAlign: "center" }}>
        <span style={{ background: statusStyle.bg, color: statusStyle.text, padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700" }}>
          {ticket.status} PASS
        </span>

        <h2 style={{ margin: "16px 0 4px 0" }}>{ticket.tier?.event?.title || "Event Ticket"}</h2>
        <p style={{ color: "#64748b", margin: "0 0 4px 0" }}>{ticket.tier?.name || "General Admission"}</p>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 24px 0" }}>
          📍 {ticket.tier?.event?.venue || "Main Gate"} · {ticket.tier?.event?.date ? new Date(ticket.tier.event.date).toLocaleDateString("en-KE") : ""}
        </p>

        <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "inline-block" }}>
          <QRCodeSVG value={ticket.secretCode} size={180} level="M" />
        </div>

        <p style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#64748b", marginTop: "16px", wordBreak: "break-all" }}>
          {ticket.secretCode}
        </p>

        {ticket.status === "USED" && (
          <p style={{ color: "#b91c1c", fontSize: "0.85rem", marginTop: "8px" }}>
            This ticket has already been scanned and used for entry.
          </p>
        )}
      </div>
    </div>
  );
}

export default TicketPass;