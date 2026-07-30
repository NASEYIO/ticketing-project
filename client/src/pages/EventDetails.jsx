// FILE: src/pages/EventDetails.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import Button from "../components/Button";
import EventPhoto from "../components/EventPhoto";

function EventDetails({ setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [selectedTierId, setSelectedTierId] = useState("");
  const [qty, setQty] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLiveDetails = async () => {
      try {
        const data = await api.getEventDetails(id);
        setEvent(data);
        if (data.tiers && data.tiers.length > 0) {
          setSelectedTierId(data.tiers[0].id);
        }
      } catch (err) {
        setError(err.message || "Failed to retrieve live event specifications.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLiveDetails();
  }, [id]);

  if (isLoading) {
    return <p style={{ textAlign: "center", color: "var(--text-subtle, #666666)", padding: "40px" }}>Loading venue and ticket tier data...</p>;
  }

  if (error) {
    return (
      <div style={{ padding: "20px", background: "rgba(166, 43, 30, 0.1)", color: "var(--sol-red, #A62B1E)", border: "1px solid var(--sol-red, #A62B1E)", borderRadius: "10px" }}>
        ⚠️ {error}
      </div>
    );
  }

  if (!event) return <p style={{ color: "var(--text-h, #121212)" }}>Requested event could not be found.</p>;

  // DYNAMIC FALLBACK DATA BINDING
  const eventTiers = event.tiers || [];
  const activeTier = eventTiers.find(t => t.id === selectedTierId);
  const activePrice = activeTier ? Number(activeTier.price) : 0;
  const remainingSpaces = activeTier ? (Number(activeTier.capacity) - Number(activeTier.sold)) : 0;
  const isSoldOut = !activeTier || remainingSpaces <= 0;

  const handleCheckoutInitiation = () => {
    if (!activeTier) return;
    setCart({
      eventId: event.id,
      eventTitle: event.title,
      photoUrl: event.photoUrls && event.photoUrls.length > 0 ? event.photoUrls[0] : null,
      tierId: activeTier.id,
      tierLabel: activeTier.name,
      quantity: Number(qty),
      unitPrice: activePrice,
      totalAmount: activePrice * qty
    });
    navigate("/checkout");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", alignItems: "start" }}>
      
      {/* MAIN CONTENT CARD */}
      <div 
        style={{ 
          background: "var(--sol-card, #FFFFFF)", 
          borderRadius: "16px", 
          border: "1px solid var(--border, #E5E2DC)", 
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)" 
        }}
      >
        <EventPhoto
          photoUrl={event.photoUrls && event.photoUrls.length > 0 ? event.photoUrls[0] : null}
          title={event.title}
          height="320px"
        />

        <div style={{ padding: "32px" }}>
          <span 
            style={{ 
              background: "rgba(247, 181, 0, 0.15)", 
              color: "var(--sol-yellow, #F7B500)", 
              padding: "6px 14px", 
              borderRadius: "20px", 
              fontSize: "0.8rem", 
              fontWeight: "700",
              letterSpacing: "0.5px",
              border: "1px solid rgba(247, 181, 0, 0.3)",
              display: "inline-block",
              marginBottom: "12px"
            }}
          >
            ☀️ VERIFIED LISTING
          </span>

          <h1 style={{ fontSize: "2.2rem", margin: "0 0 12px 0", color: "var(--text-h, #121212)", fontWeight: "800", lineHeight: "1.2" }}>
            {event.title}
          </h1>

          <p style={{ color: "var(--text-subtle, #666666)", fontWeight: "500", fontSize: "0.95rem", margin: "0 0 24px 0" }}>
            📍 {event.venue} &nbsp;|&nbsp; 📅 {new Date(event.date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>

          <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid var(--border, #E5E2DC)" }} />

          <h3 style={{ color: "var(--text-h, #121212)", fontSize: "1.25rem", margin: "0 0 12px 0", fontWeight: "700" }}>
            About This Event
          </h3>

          <p style={{ color: "var(--text-h, #121212)", lineHeight: "1.7", fontSize: "1rem", whiteSpace: "pre-wrap", margin: 0 }}>
            {event.description}
          </p>
        </div>
      </div>

      {/* TICKET SELECTION PANEL */}
      <div 
        style={{ 
          background: "var(--sol-card, #FFFFFF)", 
          padding: "28px", 
          borderRadius: "16px", 
          border: "1px solid var(--border, #E5E2DC)", 
          position: "sticky", 
          top: "100px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)" 
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", color: "var(--text-h, #121212)", fontSize: "1.3rem", fontWeight: "700" }}>
          Select Tickets
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {eventTiers.map(tier => {
            const isSelected = tier.id === selectedTierId;
            const remaining = Number(tier.capacity) - Number(tier.sold);

            return (
              <div 
                key={tier.id}
                onClick={() => setSelectedTierId(tier.id)}
                style={{ 
                  padding: "16px", 
                  borderRadius: "12px", 
                  border: isSelected 
                    ? "2px solid var(--sol-yellow, #F7B500)" 
                    : "1px solid var(--border, #E5E2DC)", 
                  cursor: "pointer", 
                  background: isSelected 
                    ? "rgba(247, 181, 0, 0.08)" 
                    : "transparent",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "0 2px 8px rgba(247, 181, 0, 0.15)" : "none"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", color: "var(--text-h, #121212)" }}>
                  <span>{tier.name}</span>
                  <span style={{ color: "var(--sol-yellow, #F7B500)" }}>KES {Number(tier.price).toLocaleString()}</span>
                </div>
                <span 
                  style={{ 
                    fontSize: "0.8rem", 
                    color: remaining < 20 ? "var(--sol-red, #A62B1E)" : "var(--text-subtle, #666666)", 
                    fontWeight: remaining < 20 ? "700" : "500",
                    display: "block",
                    marginTop: "4px"
                  }}
                >
                  {remaining <= 0 ? "⚠️ Sold Out" : `${remaining} spaces remaining`}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontWeight: "600", color: "var(--text-h, #121212)" }}>Quantity:</label>
          <select 
            value={qty} 
            onChange={(e) => setQty(Number(e.target.value))} 
            disabled={isSoldOut}
            style={{ 
              padding: "8px 16px", 
              borderRadius: "8px", 
              border: "1px solid var(--border, #E5E2DC)", 
              background: "var(--sol-card, #FFFFFF)",
              color: "var(--text-h, #121212)",
              fontSize: "1rem",
              fontWeight: "600",
              outline: "none"
            }}
          >
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div style={{ borderTop: "1px solid var(--border, #E5E2DC)", paddingTop: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: "800" }}>
            <span style={{ color: "var(--text-h, #121212)" }}>Total Amount:</span>
            <span style={{ color: "var(--sol-yellow, #F7B500)" }}>KES {(activePrice * qty).toLocaleString()}</span>
          </div>
        </div>

        <Button 
          onClick={handleCheckoutInitiation} 
          disabled={isSoldOut}
          fullWidth
          variant="primary"
          size="lg"
        >
          {isSoldOut ? "Unavailable" : "Buy Ticket"}
        </Button>
      </div>
    </div>
  );
}

export default EventDetails;