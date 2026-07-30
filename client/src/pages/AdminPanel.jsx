import { useEffect, useState } from "react";
import Button from "../components/Button";
import { api } from "../services/api";

const TABS = ["Analytics", "Users", "Events", "Orders", "Tickets"];

function AdminPanel({ user }) {
  const isAdmin = user?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState("Analytics");

  if (!user || !isAdmin) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h3>Access Denied. Administrative Clearances Required.</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "var(--sol-red, #a62b1e)", margin: "0 0 6px 0" }}>
        🛡️ Platform Control Panel
      </h2>
      <p style={{ color: "#64748b", margin: 0 }}>
        System-wide analytics, users, event approvals, and financial orders.
      </p>

      {/* TABS HEADER */}
      <div style={{ display: "flex", gap: "8px", marginTop: "20px", borderBottom: "1px solid #e2e8f0" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 18px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontWeight: activeTab === tab ? "700" : "500",
              color: activeTab === tab ? "var(--sol-red, #a62b1e)" : "#64748b",
              borderBottom: activeTab === tab ? "3px solid var(--sol-red, #a62b1e)" : "3px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div style={{ marginTop: "25px" }}>
        {activeTab === "Analytics" && <AnalyticsTab />}
        {activeTab === "Users" && <UsersTab />}
        {activeTab === "Events" && <EventsTab />}
        {activeTab === "Orders" && <OrdersTab />}
        {activeTab === "Tickets" && <TicketsTab />}
      </div>
    </div>
  );
}

// ---------- ANALYTICS TAB ----------
function AnalyticsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // Fetch aggregated data from backend
        const data = await api.getAdminAnalytics();
        setStats(data);
      } catch (err) {
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading system analytics...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* SUMMARY CARDS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <MetricCard
          title="Total Gross Revenue"
          value={`KES ${stats?.totalRevenue?.toLocaleString() || 0}`}
          subtitle="From completed transactions"
          color="var(--sol-red, #a62b1e)"
        />
        <MetricCard
          title="Tickets Sold"
          value={stats?.totalTicketsSold || 0}
          subtitle={`${stats?.scannedTickets || 0} Checked In`}
          color="#16a34a"
        />
        <MetricCard
          title="Active Events"
          value={stats?.totalEvents || 0}
          subtitle={`${stats?.pendingEvents || 0} Pending Approval`}
          color="#d97706"
        />
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.totalOrganizers || 0} Organizers`}
          color="#2563eb"
        />
      </div>

      {/* DETAILED STATS SECTIONS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Top Events */}
        <Panel title="🔥 Top Performing Events">
          {stats?.topEvents?.length === 0 ? (
            <p style={{ color: "#666" }}>No ticket sales yet.</p>
          ) : (
            stats?.topEvents?.map((event, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span>{event.title}</span>
                <strong style={{ color: "var(--sol-red, #a62b1e)" }}>{event.ticketsSold} tickets</strong>
              </div>
            ))
          )}
        </Panel>

        {/* Payment Health */}
        <Panel title="💳 M-Pesa Payment Status">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
            <StatRow label="Successful Payments" count={stats?.payments?.successful || 0} statusColor="#16a34a" />
            <StatRow label="Pending Transactions" count={stats?.payments?.pending || 0} statusColor="#d97706" />
            <StatRow label="Failed / Cancelled" count={stats?.payments?.failed || 0} statusColor="#dc2626" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

// Helper Metric Card Component
function MetricCard({ title, value, subtitle, color }) {
  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: `5px solid ${color}` }}>
      <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>{title}</p>
      <h2 style={{ margin: "8px 0 4px 0", fontSize: "1.6rem", color: "#0f172a" }}>{value}</h2>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>{subtitle}</p>
    </div>
  );
}

function StatRow({ label, count, statusColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px" }}>
      <span style={{ fontSize: "0.9rem", color: "#334155" }}>{label}</span>
      <strong style={{ color: statusColor, fontSize: "1rem" }}>{count}</strong>
    </div>
  );
}

// ---------- USERS TAB ----------
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await api.updateUserRole(userId, role);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBanToggle = async (userId, isBanned) => {
    try {
      await api.toggleUserBan(userId, !isBanned);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    try {
      await api.deleteUser(userId);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <Panel title="Users">
      {users.length === 0 ? <p>No users found.</p> : users.map((u) => (
        <Row key={u.id}>
          <div style={{ cursor: "pointer" }} onClick={() => setSelectedUserId(u.id)}>
            <h4 style={{ margin: 0, color: "#2563eb" }}>
              {u.name} {u.isBanned && <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>(BANNED)</span>}
            </h4>
            <p style={{ fontSize: "0.85rem", color: "#666", margin: "4px 0" }}>{u.email}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              value={u.role}
              onChange={(e) => handleRoleChange(u.id, e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            >
              <option value="BUYER">BUYER</option>
              <option value="ORGANIZER">ORGANIZER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <Button
              variant={u.isBanned ? "secondary" : "danger"}
              size="sm"
              onClick={() => handleBanToggle(u.id, u.isBanned)}
            >
              {u.isBanned ? "Unban" : "Ban"}
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(u.id, u.name)}>
              Delete
            </Button>
          </div>
        </Row>
      ))}

      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </Panel>
  );
}

// ---------- USER DETAIL MODAL ----------
function UserDetailModal({ userId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getUserDetail(userId);
        setDetail(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(15, 23, 42, 0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: "12px", padding: "30px",
          maxWidth: "600px", width: "100%", maxHeight: "80vh", overflowY: "auto",
        }}
      >
        {loading && <p>Loading details...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {detail && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <h3 style={{ margin: 0 }}>{detail.name}</h3>
              <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#334155", lineHeight: "1.6" }}>
              <p><strong>Email:</strong> {detail.email}</p>
              <p><strong>Phone:</strong> {detail.phoneNumber}</p>
              <p><strong>Role:</strong> {detail.role}</p>
              <p><strong>Status:</strong> {detail.isBanned ? "🚫 Banned" : "✅ Active"}</p>
              <p><strong>Joined:</strong> {new Date(detail.createdAt).toLocaleString()}</p>
              <p><strong>Last updated:</strong> {new Date(detail.updatedAt).toLocaleString()}</p>
            </div>

            {detail.events?.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h4>Events Organized ({detail.events.length})</h4>
                {detail.events.map((ev) => (
                  <div key={ev.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee", fontSize: "0.9rem" }}>
                    {ev.title} — {ev.venue} · {new Date(ev.date).toLocaleDateString()} · {ev.isApproved ? "Approved" : "Pending"}
                  </div>
                ))}
              </div>
            )}

            {detail.orders?.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h4>Orders ({detail.orders.length})</h4>
                {detail.orders.map((o) => (
                  <div key={o.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee", fontSize: "0.9rem" }}>
                    KES {o.totalAmount} · {o.status} · {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                ))}
              </div>
            )}

            {detail.tickets?.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h4>Tickets ({detail.tickets.length})</h4>
                {detail.tickets.map((t) => (
                  <div key={t.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee", fontSize: "0.9rem" }}>
                    {t.event?.title} — {t.tier?.name} · {t.status}
                  </div>
                ))}
              </div>
            )}

            {detail.events?.length === 0 && detail.orders?.length === 0 && detail.tickets?.length === 0 && (
              <p style={{ marginTop: "20px", color: "#64748b" }}>No activity yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------- EVENTS TAB ----------
function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingEvents();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (eventId) => {
    try {
      await api.approveEvent(eventId);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (eventId) => {
    if (!confirm("Reject and delete this event?")) return;
    try {
      await api.rejectEvent(eventId);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Loading pending events...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <Panel title="Pending Events">
      {events.length === 0 ? <p>No pending events.</p> : events.map((ev) => (
        <Row key={ev.id}>
          <div>
            <h4 style={{ margin: 0 }}>{ev.title}</h4>
            <p style={{ fontSize: "0.85rem", color: "#666", margin: "4px 0" }}>
              {ev.venue} · {new Date(ev.date).toLocaleDateString()} · by {ev.organizer?.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="primary" size="sm" onClick={() => handleApprove(ev.id)}>Approve</Button>
            <Button variant="danger" size="sm" onClick={() => handleReject(ev.id)}>Reject</Button>
          </div>
        </Row>
      ))}
    </Panel>
  );
}

// ---------- ORDERS TAB ----------
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAdminOrders();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <Panel title="All Orders">
      {orders.length === 0 ? <p>No orders found.</p> : orders.map((o) => (
        <Row key={o.id}>
          <div>
            <h4 style={{ margin: 0 }}>Order #{o.id.slice(0, 8)}</h4>
            <p style={{ fontSize: "0.85rem", color: "#666", margin: "4px 0" }}>
              {o.buyer?.name} ({o.buyer?.email}) · KES {o.totalAmount}
            </p>
          </div>
          <span style={{ fontWeight: "600", color: o.status === "SUCCESSFUL" ? "#16a34a" : "#dc2626" }}>
            {o.status}
          </span>
        </Row>
      ))}
    </Panel>
  );
}

// ---------- TICKETS TAB ----------
function TicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAdminTickets();
        setTickets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading tickets...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <Panel title="All Tickets">
      {tickets.length === 0 ? <p>No tickets found.</p> : tickets.map((t) => (
        <Row key={t.id}>
          <div>
            <h4 style={{ margin: 0 }}>{t.event?.title}</h4>
            <p style={{ fontSize: "0.85rem", color: "#666", margin: "4px 0" }}>
              {t.tier?.name} · {t.buyer?.name} · {t.status}
            </p>
          </div>
        </Row>
      ))}
    </Panel>
  );
}

// ---------- SHARED LAYOUT ----------
function Panel({ title, children }) {
  return (
    <div style={{ background: "white", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ padding: "15px 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
      {children}
    </div>
  );
}

export default AdminPanel;