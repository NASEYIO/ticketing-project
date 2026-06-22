// FILE: routes/admin.js

const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, requireRole } = require("../middleware/auth");


const prisma = new PrismaClient();



/*
GET ALL ORGANIZERS

/api/admin/organizers

*/

router.get(
"/organizers",
authenticateToken,
requireRole(["ADMIN"]),
async(req,res,next)=>{


try{


const organizers = await prisma.user.findMany({

where:{
role:"ORGANIZER"
},


select:{
id:true,
name:true,
email:true,
phoneNumber:true,
createdAt:true
}


});


res.json(organizers);



}catch(error){

next(error);

}


});





/*
GET PLATFORM STATISTICS

/api/admin/stats

*/


router.get(
"/stats",
authenticateToken,
requireRole(["ADMIN"]),
async(req,res,next)=>{


try{


const users = await prisma.user.count();

const events = await prisma.event.count();

const tickets = await prisma.ticket.count();


const revenue = await prisma.payment.aggregate({

_sum:{
amount:true
},

where:{
status:"SUCCESSFUL"
}


});


res.json({

users,
events,
tickets,
revenue: revenue._sum.amount || 0

});



}catch(error){

next(error);

}


});





/*
APPROVE EVENT

/api/admin/events/:id/approve

*/


router.patch(
"/events/:id/approve",
authenticateToken,
requireRole(["ADMIN"]),
async(req,res,next)=>{


try{


const event = await prisma.event.update({

where:{
id:req.params.id
},

data:{
isApproved:true
}

});


res.json({

message:"Event approved",
event

});



}catch(error){

next(error);

}


});




module.exports = router;