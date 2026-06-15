const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

console.log("1. SERVER STARTING");

// health check
app.get("/", (req, res) => {
  res.send("Backend Running");
});

console.log("2. HEALTH CHECK READY");

let eventRoutes;

try {
  eventRoutes = require("./routes/eventRoutes");
  console.log("3. ROUTES FILE LOADED");
} catch (err) {
  console.error("❌ ROUTES IMPORT FAILED:", err);
}

if (eventRoutes) {
  app.use("/api/events", eventRoutes);
  console.log("4. ROUTES REGISTERED");
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`5. SERVER RUNNING ON http://localhost:${PORT}`);
});