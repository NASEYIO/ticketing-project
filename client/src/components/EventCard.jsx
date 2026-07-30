// FILE: src/components/EventCard.jsx
import { Link } from "react-router-dom";
import Button from "./Button";
import EventPhoto from "./EventPhoto";

function EventCard({ event }) {
  const prices = event.tiers?.map(t => Number(t.price)) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const coverPhoto = event.photoUrls && event.photoUrls.length > 0 ? event.photoUrls[0] : null;

  return (
    <div
      style={{
        background: "var(--sol-card, #FFFFFF)",
        borderRadius: "16px",
        border: "1px solid var(--border, #E5E2DC)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div style={{ position: "relative" }}>
        <EventPhoto photoUrl={coverPhoto} title={event.title} height="160px" />
        
        {event.category?.name && (
          <span
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "var(--header-bg, #3D2B00)",
              color: "var(--sol-yellow, #F7B500)",
              fontSize: "0.7rem",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "4px 10px",
              borderRadius: "20px",
              border: "1px solid rgba(247, 181, 0, 0.3)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            {event.category.name}
          </span>
        )}
      </div>

      <div style={{ padding: "20px", flex: 1 }}>
        <h3
          style={{
            fontSize: "1.15rem",
            margin: "0 0 8px 0",
            fontWeight: "800",
            lineHeight: "1.3",
            color: "var(--text-h, #121212)",
          }}
        >
          {event.title}
        </h3>

        <p style={{ color: "var(--text-subtle, #666666)", fontSize: "0.85rem", margin: "0 0 8px 0" }}>
          📍 {event.venue}
        </p>

        <p style={{ color: "var(--text-h, #121212)", fontSize: "0.88rem", fontWeight: "600", margin: 0 }}>
          📅 {new Date(event.date).toLocaleDateString("en-KE", { dateStyle: "medium" })}
        </p>
      </div>

      <div
        style={{
          padding: "16px 20px",
          background: "var(--accent-bg, rgba(0,0,0,0.02))",
          borderTop: "1px solid var(--border, #E5E2DC)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-subtle, #666666)", display: "block" }}>
            Tickets from
          </span>
          <span style={{ fontWeight: "800", color: "var(--sol-yellow, #F7B500)", fontSize: "1.1rem" }}>
            KES {minPrice.toLocaleString()}
          </span>
        </div>

        <Button
          as={Link}
          to={`/event/${event.id}`}
          variant="primary"
          size="sm"
          style={{ textDecoration: "none" }}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}

export default EventCard;