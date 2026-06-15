import { useState } from "react";


function Admin() {


  const [form, setForm] = useState({

    title: "",

    description: "",

    date: ""

  });



  const handleChange = (e)=>{

    setForm({

      ...form,

      [e.target.name]: e.target.value

    });

  };




  const createEvent = async (e)=>{

    e.preventDefault();


    try {


      const response = await fetch(
        "http://localhost:5000/api/events",
        {

          method:"POST",

          headers:{

            "Content-Type":"application/json"

          },


          body:JSON.stringify(form)

        }

      );



      const data = await response.json();


      console.log(data);


      alert("Event created successfully");



      setForm({

        title:"",

        description:"",

        date:""

      });



    } catch(error){


      console.log(error);

      alert("Failed creating event");


    }


  };




  return (

    <div>


      <h1>
        Create Event
      </h1>



      <form onSubmit={createEvent}>


        <input

          name="title"

          placeholder="Event title"

          value={form.title}

          onChange={handleChange}

        />



        <br/><br/>




        <textarea

          name="description"

          placeholder="Description"

          value={form.description}

          onChange={handleChange}

        />



        <br/><br/>




        <input

          type="datetime-local"

          name="date"

          value={form.date}

          onChange={handleChange}

        />



        <br/><br/>




        <button>

          Create Event

        </button>



      </form>


    </div>

  );


}



export default Admin;