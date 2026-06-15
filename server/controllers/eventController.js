// GET EVENTS
exports.getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

// CREATE EVENT
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, price, totalTickets } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        price: Number(price || 0),
        totalTickets: Number(totalTickets || 0),
        soldTickets: 0,
        remainingTickets: Number(totalTickets || 0),
      },
    });

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: "Failed to create event" });
  }
};

// DELETE EVENT ✅ FIXED
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event" });
  }
};