// FILE: src/components/EventPhoto.jsx
//
// Shared component: shows an event's photo if one exists, otherwise
// falls back to a branded gold gradient placeholder with the VibePass logo.
// Used on EventCard, EventDetails, and Checkout so the fallback style
// only ever needs to change in one place.

function EventPhoto({ photoUrl, title, height = "160px", borderRadius = "0" }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={title || "Event photo"}
        style={{
          width: "100%",
          height,
          objectFit: "cover",
          display: "block",
          borderRadius,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height,
        background: "linear-gradient(135deg, #3D2B00 0%, #7A4F00 50%, #B87D00 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        borderRadius,
      }}
    >
      <span style={{ fontSize: "2rem", lineHeight: 1 }}>🎫</span>
      <span
        style={{
          color: "#F7B500",
          fontSize: "0.9rem",
          fontWeight: "800",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Vibe<span style={{ color: "#FAF8F5" }}>Pass</span>
      </span>
    </div>
  );
}

export default EventPhoto;