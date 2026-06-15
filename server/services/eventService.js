const prisma = require("../config/prisma");


const getEvents = () => {

    return prisma.event.findMany({
        orderBy:{
            createdAt:"desc"
        }
    });

};


const createEvent = (data)=>{

    return prisma.event.create({
        data
    });

};


const deleteEvent = (id)=>{

    return prisma.event.delete({
        where:{
            id
        }
    });

};


module.exports = {
    getEvents,
    createEvent,
    deleteEvent
};