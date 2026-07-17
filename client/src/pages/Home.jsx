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
        const responseData = await api.getEvents();
        
        // 💡 Checks if responseData is the array, or if the array is nested inside a property
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

    // 💡 Completely bulletproof fallback: if activeCategory is 'All', immediately match.
    // Otherwise, check if the string matches loosely or if the category object name matches.
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

      {/* Hero Card */}
      <div
        style={{
          background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)",
          borderRadius: "16px",
          padding: "40px 20px", /* Slightly brought down side padding for clean mobile edges */
          color: "white",
          marginBottom: "40px",
          width: "100%",
          boxSizing: "border-box", /* Keeps internal items locked inside */
        }}
      >
        <h1
          style={{
            fontSize: "2.2rem", /* Reduced text size slightly to look sharp on small screens */
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

        {/* Fixed Search Bar Input */}
        <input
          type="text"
          placeholder="🔍 Search events, artists, venues or cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "100%",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "none",
            fontSize: "1rem",
            boxSizing: "border-box", /* CRUCIAL: Keeps search input completely inside blue area */
          }}
        />
<a href="/VibePass.apk" download style={{display:"inline-block",marginTop:"16px",padding:"12px 20px",background:"white",color:"#2563eb",borderRadius:"10px",fontWeight:"700",fontSize:"0.9rem",textDecoration:"none"}}>Download Android App</a>








      </div>

      {/* Category List */}
      <div
        style={{
          display: "flex",
          gap: "12px",
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