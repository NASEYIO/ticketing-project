import { useEffect, useState } from "react";
import Button from "../components/Button";
import { api } from "../services/api";

function AdminPanel({ user }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔐 ACCESS CONTROL FIRST (no hooks inside condition)
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;

    const fetchOrganizers = async () => {
      try {
        const res = await api.get("/admin/organizers");
        setQueue(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load organizers"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizers();
  }, [isAdmin]);

  // ❌ NOT ADMIN VIEW
  if (!user || !isAdmin) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h3>Access Denied. Administrative Clearances Required.</h3>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: "40px" }}>Loading admin data...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "40px", color: "red" }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: "#dc2626" }}>🛡️ Platform Control Panel</h2>

      <p style={{ color: "#64748b" }}>
        Manage organizer accounts and platform activity.
      </p>

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginTop: "30px",
        }}
      >
        <h3>Organizers</h3>

        {queue.length === 0 ? (
          <p>No organizers found.</p>
        ) : (
          queue.map((org) => (
            <div
              key={org.id}
              style={{
                padding: "15px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h4>{org.name}</h4>
                <p style={{ fontSize: "0.85rem", color: "#666" }}>
                  {org.email}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => alert("Approve feature coming next")}
              >
                Approve
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminPanel;