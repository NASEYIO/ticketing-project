// FILE: src/pages/OrganizerDashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";

function OrganizerDashboard({ user }) {
  if (!user || user.role !== "ORGANIZER") {
    return <div style={{ padding: "40px", textAlign: "center" }}><h3>⛔ Access Denied. Organizer clearance required.</h3></div>;
  }

  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSalesAnalyticsData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/payments/organizer-metrics", {
          headers: {
            // 🛠️ ALIGNMENT FIX: Updated key from "authToken" to "token" to match localStorage
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
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
    fetchSalesAnalyticsData();
  }, []);

  if (isLoading) return <p style={{ textAlign: "center", padding: "40px" }}>Compiling financial metrics and ticket tracking frameworks...</p>;
  if (error) return <div style={{ padding: "20px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px" }}>⚠️ {error}</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Organizer Hub</h1>
          <p style={{ color: "#64748b", margin: "5px 0 0 0" }}>Welcome back, <b>{user.name}</b></p>
        </div>
        <Button as={Link} to="/organizer/create" size="lg" style={{ textDecoration: "none" }}>+ Create New Event</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" }}>
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>GROSS EARNINGS</span>
          <h2 style={{ fontSize: "2rem", margin: "10px 0 0 0", color: "#10b981" }}>KES {analytics?.grossRevenue?.toLocaleString() || 0}</h2>
        </div>
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>TICKETS MINTED & SOLD</span>
          <h2 style={{ fontSize: "2rem", margin: "10px 0 0 0", color: "#2563eb" }}>{analytics?.totalTicketsSold || 0} <span style={{ fontSize: "1rem", color: "#64748b", fontWeight: "400" }}>Passes</span></h2>
        </div>
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>ACTIVE MANAGEMENT EVENT COUNT</span>
          <h2 style={{ fontSize: "2rem", margin: "10px 0 0 0", color: "#f59e0b" }}>{analytics?.activeEventsCount || 0} Live Listings</h2>
        </div>
      </div>

      <h3>Your Active Events Performance</h3>
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", marginTop: "15px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "16px" }}>Event Description Context</th>
              <th style={{ padding: "16px" }}>Date Status</th>
              <th style={{ padding: "16px" }}>Tier Allocation Sold Tracking Breakdown</th>
              <th style={{ padding: "16px" }}>Revenue Attained</th>
            </tr>
          </thead>
          <tbody>
            {!analytics?.eventsList || analytics.eventsList.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No event listings published yet.</td></tr>
            ) : (
              analytics.eventsList.map(evt => (
                <tr key={evt.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "16px", fontWeight: "bold" }}>{evt.title}</td>
                  <td style={{ padding: "16px", color: "#475569" }}>{new Date(evt.date).toLocaleDateString("en-KE")}</td>
                  <td style={{ padding: "16px" }}>
                    {evt.tiers?.map(t => (
                      <div key={t.id} style={{ fontSize: "0.85rem", margin: "2px 0" }}>
                        • {t.name}: <b>{t.sold}</b> / {t.capacity}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: "16px", color: "#10b981", fontWeight: "bold" }}>KES {evt.revenue?.toLocaleString() || 0}</td>
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