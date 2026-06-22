// FILE: routes/users.js

const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");

const prisma = new PrismaClient();


/*
GET CURRENT USER PROFILE
/api/users/me
*/

router.get("/me", authenticateToken, async (req, res, next) => {

  try {

    const user = await prisma.user.findUnique({

      where:{
        id:req.user.id
      },

      select:{
        id:true,
        name:true,
        email:true,
        phoneNumber:true,
        role:true,
        createdAt:true
      }

    });


    if(!user){
      return res.status(404).json({
        message:"User not found"
      });
    }


    res.json(user);


  } catch(error){

    next(error);

  }

});



/*
UPDATE PROFILE
/api/users/me
*/

router.put("/me", authenticateToken, async(req,res,next)=>{

  try{

    const updatedUser = await prisma.user.update({

      where:{
        id:req.user.id
      },


      data:{
        name:req.body.name,
        phoneNumber:req.body.phoneNumber
      },


      select:{
        id:true,
        name:true,
        email:true,
        phoneNumber:true,
        role:true
      }

    });


    res.json(updatedUser);


  }catch(error){

    next(error);

  }

});


module.exports = router;