const router = require("express").Router();
const jwt = require('jsonwebtoken'); 
const {
  getEvents,
  createEvent,
  deleteEvent
} = require("../controllers/eventController");

router.get("/", getEvents);
router.post("/", createEvent);
router.delete("/:id", deleteEvent);

module.exports = router;