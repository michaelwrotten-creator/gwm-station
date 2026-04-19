const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from backend" });
});

app.listen(4242, () => {
  console.log("Server running on http://localhost:4242");
});