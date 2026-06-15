import { useEffect, useState } from "react";

function Sellers() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("http://localhost:5000/api/events");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.log("Error fetching seller data:", err);
      }
    }

    fetchEvents();
  }, []);

  // SUMMARY CALCULATIONS
  const totalEvents = events.length;

  const totalSold = events.reduce(
    (sum, e) => sum + (e.soldTickets || 0),
    0
  );

  const totalRevenue = events.reduce(
    (sum, e) => sum + (e.soldTickets || 0) * (e.price || 0),
    0
  );

  return (
    <div>
      <h2>Seller Dashboard 📊</h2>

      {/* SUMMARY CARDS */}
      <div style={cardRow}>
        <div style={card}>
          <h3>{totalEvents}</h3>
          <p>Total Events</p>
        </div>

        <div style={card}>
          <h3>{totalSold}</h3>
          <p>Tickets Sold</p>
        </div>

        <div style={card}>
          <h3>KES {totalRevenue}</h3>
          <p>Revenue</p>
        </div>
      </div>

      {/* EVENT TABLE */}
      <div style={{ marginTop: "20px" }}>
        <h3>Event Performance</h3>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Sold</th>
              <th>Remaining</th>
              <th>Price</th>
              <th>Progress</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => {
              const sold = event.soldTickets || 0;
              const total = event.totalTickets || 1;
              const percent = (sold / total) * 100;

              return (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{sold}</td>
                  <td>{event.remainingTickets}</td>
                  <td>KES {event.price}</td>
                  <td>
                    <div style={{ background: "#eee", borderRadius: "6px" }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          background: "green",
                          height: "8px",
                          borderRadius: "6px",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// STYLES (IMPORTANT)
const cardRow = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
};

const card = {
  flex: 1,
  background: "white",
  padding: "15px",
  borderRadius: "8px",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const tableStyle = {
  width: "100%",
  background: "white",
  borderRadius: "8px",
  padding: "10px",
};

export default Sellers;