// FILE: src/components/EventCard.jsx
import { Link } from "react-router-dom";
import Button from "./Button";

function EventCard({ event }) {
  // 🛠️ DYNAMIC PRICE EXTRACTION: Find the minimum price among dynamic database tiers
  const prices = event.tiers?.map(t => Number(t.price)) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  return (
    <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
      <div style={{ padding: "20px" }}>
        {/* 🛠️ FIXED: Placed the comment inside valid JSX brackets so it doesn't print as plain text */}
        <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {event.category?.name}
        </span>
        <h3 style={{ fontSize: "1.15rem", margin: "8px 0", fontWeight: "700", lineHeight: "1.3" }}>{event.title}</h3>
        <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 12px 0" }}>📍 {event.venue}</p>
        {/* 🛠️ DATE SAFE FORMATTING: Formats standard PostgreSQL timestamp clean strings */}
        <p style={{ color: "#0f172a", fontSize: "0.9rem", fontWeight: "600" }}>📅 {new Date(event.date).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
      </div>
      
      <div style={{ padding: "15px 20px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Tickets from</span>
          <span style={{ fontWeight: "700", color: "#0f172a" }}>KES {minPrice.toLocaleString()}</span>
        </div>
        <Button as={Link} to={`/event/${event.id}`} size="sm" style={{ textDecoration: "none" }}>View Details</Button>
      </div>
    </div>
  );
}

export default EventCard;