// FILE: src/pages/OrganizerDashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";

function OrganizerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSalesAnalyticsData = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/payments/organizer-metrics", {
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analytics generation error.");
      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Failed to parse database records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAnalyticsData();
  }, []);

  const handleDeleteEvent = async (eventId, eventTitle) => {
    const confirmClearance = window.confirm(`Are you absolutely sure you want to completely delete "${eventTitle}"? This will permanently wipe all tickets, tiers, and associated data.`);
    if (!confirmClearance) return;

    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete event.");

      alert(data.message);
      fetchSalesAnalyticsData(); // Instant data synchronization reload
    } catch (err) {
      alert(`Delete operation failed: ${err.message}`);
    }
  };

  if (isLoading) return <p style={{ textAlign: "center", padding: "40px" }}>Compiling metrics...</p>;
  if (error) return <div style={{ padding: "20px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px" }}>⚠️ {error}</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Organizer Hub</h1>
          <p style={{ color: "#64748b" }}>Management Portal (JWT Bypassed)</p>
        </div>
        <Button as={Link} to="/organizer/create" style={{ textDecoration: "none" }}>+ Create New Event</Button>
      </div>

      {/* Summary Analytics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" }}>
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>REAL GROSS EARNINGS</span>
          <h2 style={{ fontSize: "2rem", margin: "10px 0 0 0", color: "#10b981" }}>KES {analytics?.grossRevenue?.toLocaleString() || 0}</h2>
        </div>
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>REAL TICKETS SOLD</span>
          <h2 style={{ fontSize: "2rem", margin: "10px 0 0 0", color: "#2563eb" }}>{analytics?.totalTicketsSold || 0} Passes</h2>
        </div>
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>ACTIVE LIVE LISTINGS</span>
          <h2 style={{ fontSize: "2rem", margin: "10px 0 0 0", color: "#f59e0b" }}>{analytics?.activeEventsCount || 0} Events</h2>
        </div>
      </div>

      <h3>Your Active Events Performance</h3>
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "16px" }}>Event Title</th>
              <th style={{ padding: "16px" }}>Date</th>
              <th style={{ padding: "16px" }}>Tier Allocations</th>
              <th style={{ padding: "16px" }}>Revenue Attained</th>
              <th style={{ padding: "16px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!analytics?.eventsList || analytics.eventsList.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No event listings published yet.</td></tr>
            ) : (
              analytics.eventsList.map(evt => (
                <tr key={evt.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "16px", fontWeight: "bold" }}>{evt.title}</td>
                  <td style={{ padding: "16px", color: "#475569" }}>{new Date(evt.date).toLocaleDateString("en-KE")}</td>
                  <td style={{ padding: "16px" }}>
                    {evt.tiers?.map(t => (
                      <div key={t.id} style={{ fontSize: "0.85rem" }}>
                        • {t.name}: <b>{t.sold}</b> / {t.capacity}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: "16px", color: "#10b981", fontWeight: "bold" }}>KES {evt.revenue?.toLocaleString() || 0}</td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <button 
                      onClick={() => handleDeleteEvent(evt.id, evt.title)}
                      style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fee2e2", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "500", transition: "0.2s" }}
                      onMouseOver={(e) => e.target.style.background = "#fee2e2"}
                      onMouseOut={(e) => e.target.style.background = "#fef2f2"}
                    >
                      🗑️ Delete Event
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrganizerDashboard;