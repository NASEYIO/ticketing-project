// FILE: src/pages/EventDetails.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import Button from "../components/Button";

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

  if (isLoading) return <p style={{ textAlign: "center", color: "#64748b" }}>Loading venue and ticket tier data...</p>;
  if (error) return <div style={{ padding: "20px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px" }}>⚠️ {error}</div>;
  if (!event) return <p>Requested event could not be found.</p>;

  // 🛠️ DYNAMIC FALLBACK DATA BINDING
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
      tierId: activeTier.id,
      tierLabel: activeTier.name,
      quantity: Number(qty),
      unitPrice: activePrice,
      totalAmount: activePrice * qty
    });
    navigate("/checkout");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px", alignItems: "start" }}>
      <div style={{ background: "white", padding: "35px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <span style={{ background: "#dbeafe", color: "#1e40af", padding: "6px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "700" }}>
          VERIFIED LISTING
        </span>
        <h1 style={{ fontSize: "2.2rem", margin: "15px 0 10px 0" }}>{event.title}</h1>
        <p style={{ color: "#475569", fontWeight: "500" }}>
          📍 {event.venue} | 📅 {new Date(event.date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <hr style={{ margin: "25px 0", borderColor: "#f1f5f9" }} />
        <h3>About This Event</h3>
        <p style={{ color: "#334155", lineHeight: "1.7", fontSize: "1.05rem", whiteSpace: "pre-wrap" }}>{event.description}</p>
      </div>

      <div style={{ background: "white", padding: "30px", borderRadius: "16px", border: "1px solid #e2e8f0", position: "sticky", top: "100px" }}>
        <h3 style={{ margin: "0 0 20px 0" }}>Select Tickets</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          {eventTiers.map(tier => {
            const isSelected = tier.id === selectedTierId;
            const remaining = Number(tier.capacity) - Number(tier.sold);

            return (
              <div 
                key={tier.id}
                onClick={() => setSelectedTierId(tier.id)}
                style={{ 
                  padding: "15px", 
                  borderRadius: "10px", 
                  border: `2px solid ${isSelected ? "#2563eb" : "#e2e8f0"}`, 
                  cursor: "pointer", 
                  background: isSelected ? "#f0fdf4" : "white",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                  <span>{tier.name}</span>
                  <span style={{ color: "#2563eb" }}>KES {Number(tier.price).toLocaleString()}</span>
                </div>
                <span style={{ fontSize: "0.8rem", color: remaining < 20 ? "#e11d48" : "#64748b", fontWeight: remaining < 20 ? "600" : "400" }}>
                  {remaining <= 0 ? "⚠️ Sold Out" : `${remaining} spaces remaining`}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom: "25px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontWeight: "600" }}>Quantity:</label>
          <select 
            value={qty} 
            onChange={(e) => setQty(Number(e.target.value))} 
            disabled={isSoldOut}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1rem" }}
          >
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: "bold" }}>
            <span>Total Amount:</span>
            <span style={{ color: "#2563eb" }}>KES {(activePrice * qty).toLocaleString()}</span>
          </div>
        </div>

        <Button 
          onClick={handleCheckoutInitiation} 
          disabled={isSoldOut}
          style={{ width: "100%" }}
          size="lg"
        >
          {isSoldOut ? "Unavailable" : "Buy Ticket"}
        </Button>
      </div>
    </div>
  );
}

export default EventDetails;