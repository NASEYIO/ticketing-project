// FILE: src/pages/Home.jsx
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
        const responseData = await api.getEvents();
        
        // Checks if responseData is the array, or if the array is nested inside a property
        if (Array.isArray(responseData)) {
          setEvents(responseData);
        } else if (responseData && Array.isArray(responseData.events)) {
          setEvents(responseData.events);
        } else if (responseData && Array.isArray(responseData.data)) {
          setEvents(responseData.data);
        } else {
          setEvents([]);
        }
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

  const filteredEvents = (events || []).filter(event => {
    const titleString = event.title || "";
    const venueString = event.venue || "";
    
    const matchesSearch =
      titleString.toLowerCase().includes(search.toLowerCase()) ||
      venueString.toLowerCase().includes(search.toLowerCase());

    if (activeCategory === "All") return matchesSearch;

    const currentActive = activeCategory.toLowerCase();
    const eventCategoryName = event.category && typeof event.category === 'object' 
      ? (event.category.name || "") 
      : (event.category || "");

    const matchesCategory =
      eventCategoryName.toLowerCase().includes(currentActive.replace(/s$/, "")) ||
      currentActive.includes(eventCategoryName.toLowerCase().replace(/s$/, ""));

    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

      {/* Hero — uses themed CSS variables so it flips with light/dark */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--header-bg) 0%, var(--bg-secondary) 100%)",
          borderRadius: "16px",
          padding: "40px 20px",
          marginBottom: "32px",
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
          transition: "background 0.3s ease, border-color 0.3s ease"
        }}
      >
        <span
          style={{
            background: "rgba(247, 181, 0, 0.12)",
            color: "var(--sol-yellow, #F7B500)",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "0.8rem",
            fontWeight: "700",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            border: "1px solid rgba(247, 181, 0, 0.25)",
            display: "inline-block",
            marginBottom: "12px",
          }}
        >
          ☀️ Sauti Sol Live Experience
        </span>

        <h1
          style={{
            fontSize: "2.2rem",
            margin: "0 0 10px 0",
            fontWeight: "800",
            lineHeight: "1.2",
            color: "var(--sol-cream, #FAF8F5)"
          }}
        >
          Find Your Next <span style={{ color: "var(--sol-yellow, #F7B500)" }}>Vibe</span>
        </h1>

        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--sol-cream, #FAF8F5)",
            opacity: 0.85,
            marginBottom: "24px",
            maxWidth: "600px"
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
          className="hero-search"
          style={{
            width: "100%",
            maxWidth: "100%",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "1px solid rgba(247, 181, 0, 0.45)",
            background: "rgba(0, 0, 0, 0.25)",
            color: "#FAF8F5",
            fontSize: "1rem",
            boxSizing: "border-box",
            outline: "none",
            transition: "border-color 0.2s ease"
          }}
        />

        <div style={{ marginTop: "16px" }}>
          <a
            href="/VibePass.apk"
            download
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "var(--sol-yellow, #F7B500)",
              color: "#1A1200",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.9rem",
              textDecoration: "none",
              transition: "transform 0.2s ease",
            }}
          >
            <span>📱</span> Download Android App
          </a>
        </div>
      </div>

      {/* Category List */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "30px",
          overflowX: "auto",
          width: "100%",
          paddingBottom: "8px"
        }}
      >
        {categories.map(cat => (
          <Button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            variant={activeCategory === cat ? "primary" : "secondary"}
            size="sm"
            className="category-pill"
            style={{
              borderRadius: "24px",
              whiteSpace: "nowrap"
            }}
          >
            {cat}
          </Button>
        ))}
      </div>

      <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-h, #121212)", marginBottom: "16px" }}>
        Live Events
      </h2>

      {isLoading && (
        <p style={{ color: "#64748b" }}>
          Loading dynamic event catalog...
        </p>
      )}

      {error && (
        <div
          style={{
            padding: "15px",
            background: "rgba(166, 43, 30, 0.1)",
            color: "var(--sol-red, #A62B1E)",
            border: "1px solid var(--sol-red, #A62B1E)",
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
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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