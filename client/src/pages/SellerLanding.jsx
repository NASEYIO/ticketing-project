// FILE: src/pages/SellerLanding.jsx

import { Link } from "react-router-dom";
import Button from "../components/Button";


function SellerLanding(){

  return (

    <div

      style={{
        textAlign:"center",
        padding:"60px 20px"
      }}

    >


      <h1

        style={{
          fontSize:"2.8rem",
          color:"#1e293b"
        }}

      >

        Turn your passions into ticketing events. Monetize globally.

      </h1>



      <p

        style={{
          color:"#475569",
          fontSize:"1.2rem"
        }}

      >

        Join thousands of organizers managing ticket inventory, scanning entries, and generating scalable revenue with clear analytics.

      </p>



      <div

        style={{
          display:"flex",
          gap:"15px",
          justifyContent:"center"
        }}

      >


        <Link

          to="/register"

          style={{
            textDecoration:"none"
          }}

        >

          <Button size="lg">

            Create Organizer Account

          </Button>


        </Link>





        <Link

          to="/login"

          style={{
            textDecoration:"none"
          }}

        >

          <Button

            variant="secondary"

            size="lg"

          >

            Merchant Sign In

          </Button>


        </Link>


      </div>


    </div>

  );

}


export default SellerLanding;