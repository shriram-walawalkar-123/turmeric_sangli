require("dotenv").config();
const express = require("express");
const cors = require("cors");
const harvestRoutes = require("./route");
const authRoutes = require("./routes/auth");
const stageAuthRoutes = require("./routes/stageAuth");
const roleRoutes = require("./routes/roles");
const connectDB = require("./config/database");

const app = express();

// Connect to MongoDB
connectDB();

// ✅ Middlewares
app.use(cors());
app.use(express.json()); // replaces bodyParser.json()
// Increase body limit for on-chain payloads if needed
app.use(express.json({ limit: '1mb' }));

// ✅ Mount routes
app.use("/api", harvestRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/stage", stageAuthRoutes);
app.use("/api/roles", roleRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Hello World");
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
