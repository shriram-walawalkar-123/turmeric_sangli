// server.js
const express = require("express");
const bodyParser = require("body-parser");
const harvestRoutes = require("./interact"); // Your router file

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Use your router
app.use("/api", harvestRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Turmeric Supply Chain Backend is running!");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
