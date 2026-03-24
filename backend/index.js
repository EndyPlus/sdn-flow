const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(cors());

const dbPath = path.join(__dirname, "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

app.get("/api/topology", (req, res) => {
  res.json({ nodes: db.topology.nodes, edges: db.topology.edges });
});

app.listen(3001, () =>
  console.log("Server is running on http://localhost:3001"),
);
