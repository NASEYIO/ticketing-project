/// FILE: src/pages/Home.jsx

import { useState, useEffect } from "react";
import EventCard from "../components/EventCard";
import { api } from "../services/api";
import Button from "../components/Button";

function Home() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = [
    "All",
    "Concerts",
    "Sports",
    "Conferences",
    "Parties"
  ];

  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        const data = await api.getEvents();
        setEvents(data);
      } catch (err) {
        setError(
          "Could not load events. Please check if backend server is online."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const titleString = event.title || "";
    const venueString = event.venue || "";
    const eventCategory = event.category || "All";

    const matchesSearch =
      titleString.toLowerCase().includes(search.toLowerCase()) ||
      venueString.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "All" ||
      eventCategory === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    /* Main container wrapper centered across mobile views */
    <div style={{ width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

      {/* Hero Blue Card */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)",
          borderRadius: "16px",
          padding: "40px 20px", /* Adjusted slightly down on mobile sides to give text more space */
          color: "white",
          marginBottom: "40px",
          width: "100%",
          boxSizing: "border-box", /* Forces padding to stay within inner width bounds */
        }}
      >
        <h1
          style={{
            fontSize: "2.2rem", /* Scaled slightly down to prevent single letter line wrapping */
            margin: "0 0 10px 0",
            fontWeight: "800"
          }}
        >
          Find Your Next Vibe
        </h1>

        <p
          style={{
            fontSize: "1.05rem",
            opacity: 0.9,
            marginBottom: "30px"
          }}
        >
          Discover verified events across East Africa. Instant tickets delivered via SMS and Email.
        </p>

        {/* Search Bar Input */}
        <input
          type="text"
          placeholder="🔍 Search events, artists, venues or cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "100%", /* Keeps it scaling inside your blue element boundary */
            padding: "16px 20px",
            borderRadius: "12px",
            border: "none",
            fontSize: "1rem",
            boxSizing: "border-box", /* Crucial: fixes the breaking/overlapping issue */
          }}
        />
      </div>

      {/* Horizontal Scroll Categories */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "30px",
          overflowX: "auto",
          width: "100%",
          paddingBottom: "8px" /* Extra room for mobile scroll bars */
        }}
      >
        {categories.map(cat => (
          <Button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            variant={activeCategory === cat ? "primary" : "secondary"}
            size="sm"
            style={{
              borderRadius: "24px",
              whiteSpace: "nowrap" /* Keeps text strings from stacking on small screen spaces */
            }}
          >
            {cat}
          </Button>
        ))}
      </div>

      <h2>Live Events</h2>

      {isLoading && (
        <p style={{ color: "#64748b" }}>
          Loading dynamic event catalog...
        </p>
      )}

      {error && (
        <div
          style={{
            padding: "15px",
            background: "#fef2f2",
            color: "#b91c1c",
            borderRadius: "8px",
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: "24px",
            marginTop: "20px",
            width: "100%"
          }}
        >
          {filteredEvents.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              No events found matching your selection.
            </p>
          ) : (
            filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Home;