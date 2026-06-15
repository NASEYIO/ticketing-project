function EventCard({ event }) {

  return (

    <div style={cardStyle}>

      <h2>
        {event.title}
      </h2>


      <p>
        📅 {event.date}
      </p>


      <p>
        📍 {event.location}
      </p>


      <p>
        💰 Ksh {event.price}
      </p>


      <p>
        🎟 Tickets left: {event.ticketsLeft}
      </p>


      <button style={buttonStyle}>
        View Event
      </button>


    </div>

  );

}



const cardStyle = {

  background:"white",

  padding:"20px",

  borderRadius:"10px",

  boxShadow:
  "0 2px 8px rgba(0,0,0,0.1)"

};



const buttonStyle = {

  padding:"8px 15px",

  border:"none",

  borderRadius:"6px",

  background:"#2563eb",

  color:"white",

  cursor:"pointer"

};



export default EventCard;