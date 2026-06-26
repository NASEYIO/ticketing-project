// FILE: src/pages/CreateEvent.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

function CreateEvent({ user }) {
  const navigate = useNavigate();

  // State hooks executed unconditionally on every single render loop
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  
  // Dynamic Ticket Tiers State (Starts with one default tier)
  const [tiers, setTiers] = useState([{ name: "General Admission", price: "", capacity: "" }]);
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

  // Fetch Category Records on Mount (JWT-Free)
  useEffect(() => {
    fetch("http://localhost:5000/api/categories", {
      headers: { "Content-Type": "application/json" }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch categories.");
        return res.json();
      })
      .then((data) => { setCategories(Array.isArray(data) ? data : []); })
      .catch((err) => {
        console.error("Error pulling category objects:", err);
        setCategories([]);
      });
  }, []);

  // Access Gate Guard Intercept (Safely positioned after all hook declarations)
  if (!user || user.role !== "ORGANIZER") {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>⛔ Access Denied. Organizer clearance required to publish events.</h3>
      </div>
    );
  }

  // Handle adding a new ticket class input row (e.g. VIP)
  const handleAddTierRow = () => {
    setTiers([...tiers, { name: "", price: "", capacity: "" }]);
  };

  // Handle removing a ticket tier input row
  const handleRemoveTierRow = (index) => {
    if (tiers.length === 1) return; // Keep at least one tier
    setTiers(tiers.filter((_, i) => i !== index));
  };

  // Handle dynamic individual input mutations inside our tier array list structure
  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...tiers];
    updatedTiers[index][field] = value;
    setTiers(updatedTiers);
  };

  const handleEventSubmission = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    setError("");

    // Validate and format numbers safely for your Prisma model structure types
    const formattedTiers = tiers.map(t => ({
      name: t.name || "General Admission",
      price: parseFloat(t.price) || 0,
      capacity: parseInt(t.capacity) || 0
    }));

    try {
      const response = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
          // 🛠️ REMOVED: JWT Authorization header dropped completely
        },
        body: JSON.stringify({
          title,
          description,
          date,
          venue,
          categoryId,
          organizerId: user.id, // 🛠️ ADDED: Explicitly sending real database user ID context in body
          tiers: formattedTiers
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to publish listing to database.");

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
        {/* Core Event Fields */}
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

        {/* Dynamic Category Select Dropdown Component */}
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

        {/* Dynamic Ticket Allocation Engine */}
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

        {/* Submit Actions */}
        <Button type="submit" isLoading={isPublishing} size="lg" fullWidth style={{ marginTop: "15px" }}>
          Broadcast Event to Live Marketplace
        </Button>
      </form>
    </div>
  );
}

export default CreateEvent;