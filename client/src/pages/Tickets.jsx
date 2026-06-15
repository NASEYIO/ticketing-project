import React from "react";

function Tickets() {
  const tickets = [
    {
      id: 1,
      event: "Music Concert",
      user: "John Doe",
      date: "2026-06-20",
      status: "Confirmed",
    },
    {
      id: 2,
      event: "Tech Meetup",
      user: "Mary Wanjiku",
      date: "2026-07-01",
      status: "Pending",
    },
    {
      id: 3,
      event: "Art Expo",
      user: "Alex Kim",
      date: "2026-07-10",
      status: "Cancelled",
    },
  ];

  const total = tickets.length;
  const confirmed = tickets.filter(t => t.status === "Confirmed").length;
  const pending = tickets.filter(t => t.status === "Pending").length;
  const cancelled = tickets.filter(t => t.status === "Cancelled").length;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Tickets Dashboard 🎟</h1>

      {/* SUMMARY CARDS */}
      <div style={cardRow}>
        <div style={card}>Total: {total}</div>
        <div style={card}>Confirmed: {confirmed}</div>
        <div style={card}>Pending: {pending}</div>
        <div style={card}>Cancelled: {cancelled}</div>
      </div>

      {/* TABLE */}
      <div style={{ marginTop: "30px" }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4" }}>
              <th style={thStyle}>Event</th>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} style={{ textAlign: "center", borderBottom: "1px solid #ddd" }}>
                <td style={tdStyle}>{t.event}</td>
                <td style={tdStyle}>{t.user}</td>
                <td style={tdStyle}>{t.date}</td>
                <td style={tdStyle}>
                  <span style={getStatusStyle(t.status)}>
                    {t.status}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button style={btn}>View</button>
                  <button style={{...btn, backgroundColor: "#dc3545", marginLeft: "5px"}}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ✅ DEFINE MISSED STYLES & FUNCTIONS TO PREVENT RUNTIME CRASHES
const cardRow = {
  display: "flex",
  gap: "15px",
  marginTop: "20px"
};

const card = {
  flex: 1,
  padding: "15px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  fontWeight: "bold"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px"
};

const thStyle = {
  padding: "12px",
  borderBottom: "2px solid #ddd",
  textAlign: "center"
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd"
};

const btn = {
  padding: "6px 12px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const getStatusStyle = (status) => {
  let bg = "#6c757d";
  if (status === "Confirmed") bg = "#28a745";
  if (status === "Pending") bg = "#ffc107";
  if (status === "Cancelled") bg = "#dc3545";

  return {
    padding: "4px 8px",
    backgroundColor: bg,
    color: status === "Pending" ? "black" : "white",
    borderRadius: "4px",
    fontSize: "0.85rem",
    fontWeight: "bold"
  };
};

// ✅ THE CRITICAL EXPORT: Connects directly back to App.jsx
export default Tickets;