require("dotenv").config();
const express = require("express");
const cors = require("cors");
const harvestRoutes = require("./route"); // ✅ make sure this file exists and exports a router

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json()); // replaces bodyParser.json()

// ✅ Mount routes
app.use("/api", harvestRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Hello World");
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
