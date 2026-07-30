// FILE: src/components/EventPhoto.jsx
//
// Shared component: shows an event's photo if one exists, otherwise
// falls back to a branded blue gradient with the VibePass logo.
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
        background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "1.2rem",
        fontWeight: "700",
        borderRadius,
      }}
    >
      🎫 VibePass
    </div>
  );
}

export default EventPhoto;