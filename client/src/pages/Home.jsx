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

    // 🛠️ SAFE FALLBACKS: Keeps your design intact but prevents null pointers if database fields are blank
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

    <div>


      <div
        style={{
          background:
            "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)",

          borderRadius:"16px",

          padding:"50px 40px",

          color:"white",

          marginBottom:"40px"
        }}
      >

        <h1
          style={{
            fontSize:"2.5rem",
            margin:"0 0 10px 0",
            fontWeight:"800"
          }}
        >
          Find Your Next Vibe
        </h1>


        <p
          style={{
            fontSize:"1.1rem",
            opacity:0.9,
            marginBottom:"30px"
          }}
        >
          Discover verified events across East Africa. Instant tickets delivered via SMS and Email.
        </p>



        <input

          type="text"

          placeholder="🔍 Search events, artists, venues or cities..."

          value={search}

          onChange={(e)=>setSearch(e.target.value)}

          style={{
            width:"100%",
            maxWidth:"600px",
            padding:"16px 24px",
            borderRadius:"12px",
            border:"none",
            fontSize:"1rem"
          }}

        />


      </div>



      <div
        style={{
          display:"flex",
          gap:"12px",
          marginBottom:"30px",
          overflowX:"auto"
        }}
      >

        {
          categories.map(cat => (

            <Button

              key={cat}

              onClick={() => setActiveCategory(cat)}

              variant={
                activeCategory === cat
                  ? "primary"
                  : "secondary"
              }

              size="sm"

              style={{
                borderRadius:"24px"
              }}

            >

              {cat}

            </Button>

          ))

        }

      </div>



      <h2>
        Live Events
      </h2>



      {isLoading &&

        <p style={{color:"#64748b"}}>

          Loading dynamic event catalog...

        </p>

      }



      {error &&

        <div

          style={{
            padding:"15px",
            background:"#fef2f2",
            color:"#b91c1c",
            borderRadius:"8px"
          }}

        >

          {error}

        </div>

      }




      {!isLoading && !error && (

        <div

          style={{
            display:"grid",
            gridTemplateColumns:
              "repeat(auto-fill,minmax(280px,1fr))",

            gap:"24px",

            marginTop:"20px"
          }}

        >

          {
            filteredEvents.length === 0

            ?

            <p style={{color:"#64748b"}}>
              No events found matching your selection.
            </p>


            :

            filteredEvents.map(event => (

              <EventCard

                key={event.id}

                event={event}

              />

            ))

          }


        </div>

      )}


    </div>

  );

}


export default Home;