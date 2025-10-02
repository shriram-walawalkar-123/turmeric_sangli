require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./route");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/api", routes);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
