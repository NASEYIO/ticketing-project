const eventService = require("../services/eventService");

// 1. GET ALL EVENTS (Placeholder)
exports.getEvents = async (req, res) => {
  try {
    // You can implement this later with: await eventService.getEvents()
    return res.status(200).json({ message: "Get events route works!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// 2. CREATE EVENT (Your existing code)
exports.createEvent = async (req, res) => {
  try {
    const event = await eventService.createEvent(req.body);
    return res.status(201).json(event);
  } catch (err) {
    console.log("🔥 FULL CREATE EVENT ERROR:");
    console.log(err);

    return res.status(500).json({
      message: err.message,
      name: err.name,
    });
  }
};

// 3. DELETE EVENT (Placeholder)
exports.deleteEvent = async (req, res) => {
  try {
    return res.status(200).json({ message: `Delete event ${req.params.id} route works!` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};