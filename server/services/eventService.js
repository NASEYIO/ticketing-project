const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createEvent = async (data) => {
  return await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      date: new Date(data.date),
      price: data.price ?? 0,
      totalTickets: data.totalTickets ?? 0,
      soldTickets: 0,
      remainingTickets: data.totalTickets ?? 0
    }
  });
};