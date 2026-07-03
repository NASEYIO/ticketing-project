// FILE: src/pages/CreateEvent.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { api } from "../services/api";

// Decode the JWT payload stored in localStorage, without any network call
function getUserFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch (err) {
    console.error("Failed to decode stored token:", err);
    return null;
  }
}

function CreateEvent({ user }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);

  const [tiers, setTiers] = useState([{ name: "General Admission", price: "", capacity: "" }]);

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

  // Fallback: if the `user` prop isn't populated yet, decode it locally from the stored token
  const currentUserContext = user?.id ? user : getUserFromToken();

  useEffect(() => {
    api.getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error pulling category objects:", err);
        setCategories([]);
      });
  }, []);

  if (!currentUserContext) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>⌛ Connecting Secure Session Context...</h3>
        <p style={{ color: "#64748b" }}>Please make sure you are logged in to your account on this domain.</p>
      </div>
    );
  }

  if (currentUserContext.role !== "ORGANIZER") {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>⛔ Access Denied. Organizer clearance required to publish events.</h3>
      </div>
    );
  }

  const handleAddTierRow = () => {
    setTiers([...tiers, { name: "", price: "", capacity: "" }]);
  };

  const handleRemoveTierRow = (index) => {
    if (tiers.length === 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...tiers];
    updatedTiers[index][field] = value;
    setTiers(updatedTiers);
  };

  const handleEventSubmission = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    setError("");

    const formattedTiers = tiers.map(t => ({
      name: t.name || "General Admission",
      price: parseFloat(t.price) || 0,
      capacity: parseInt(t.capacity) || 0
    }));

    try {
      await api.createEvent({
        title,
        description,
        date,
        venue,
        categoryId,
        tiers: formattedTiers
        // organizerId is no longer sent from the client —
        // the backend derives it securely from the verified JWT
      });

      alert(`🎉 "${title}" has been successfully broadcast live to VibePass listings!`);
      navigate("/organizer/dashboard");

    } catch (err) {
      setError(err.message || "Network pipeline exception occurred during transmission.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{ maxWidth: "650px", margin: "40px auto", padding: "40px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
      <h2>📅 Publish New Live Event</h2>
      <p style={{ color: "#64748b", marginBottom: "30px" }}>Fill in the parameters below to spin up real event seats and ticket allocation configurations inside PostgreSQL.</p>

      {error && (
        <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", marginBottom: "20px", fontSize: "0.9rem" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleEventSubmission} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Event Title</label>
          <input type="text" required placeholder="e.g., Amapiano Sunset Fest or Tech Meetup" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Description</label>
          <textarea rows="4" required placeholder="Describe what attendees should look forward to..." value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", fontFamily: "inherit" }}></textarea>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Event Date & Time</label>
            <input type="datetime-local" required value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Venue Location</label>
            <input type="text" required placeholder="e.g., Alchemist Bar, Westlands" value={venue} onChange={e => setVenue(e.target.value)} style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", fontWeight: "600", color: "#334155" }}>Event Category</label>
          <select
            required
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            style={{ width: "100%", padding: "12px", boxSizing: "border-box", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", background: "white" }}
          >
            <option value="">-- Choose a Category Index --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <hr style={{ borderColor: "#e2e8f0", margin: "10px 0" }} />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>🎟️ Ticket Tier Structures</h3>
            <button type="button" onClick={handleAddTierRow} style={{ background: "#eff6ff", color: "#2563eb", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" }}>
              + Add Tier Class
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tiers.map((tier, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1.2fr auto", gap: "10px", alignItems: "center", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <input type="text" required placeholder="Tier Class Name (e.g., VIP)" value={tier.name} onChange={e => handleTierChange(index, "name", e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                <input type="number" required min="0" placeholder="Price (KES)" value={tier.price} onChange={e => handleTierChange(index, "price", e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                <input type="number" required min="1" placeholder="Capacity" value={tier.capacity} onChange={e => handleTierChange(index, "capacity", e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />

                <button type="button" onClick={() => handleRemoveTierRow(index)} disabled={tiers.length === 1} style={{ background: "transparent", color: tiers.length === 1 ? "#cbd5e1" : "#ef4444", border: "none", fontSize: "1.2rem", cursor: tiers.length === 1 ? "not-allowed" : "pointer", padding: "0 5px" }}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" isLoading={isPublishing} size="lg" fullWidth style={{ marginTop: "15px" }}>
          Broadcast Event to Live Marketplace
        </Button>
      </form>
    </div>
  );
}

export default CreateEvent;