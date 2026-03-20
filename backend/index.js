const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

const networkData = {
  nodes: [
    {
      id: "1",
      type: "input",
      data: { label: "Головний сервер" },
      position: { x: 250, y: 5 },
    },
    {
      id: "2",
      data: { label: "Комутатор Цеху №1" },
      position: { x: 100, y: 100 },
    },
    {
      id: "3",
      data: { label: "Верстат ЧПК 01" },
      position: { x: 100, y: 200 },
    },
  ],
  edges: [
    { id: "e1-2", source: "1", target: "2", animated: true },
    { id: "e2-3", source: "2", target: "3" },
  ],
};

app.get("/api/topology", (req, res) => {
  res.json(networkData);
});

app.listen(3001, () =>
  console.log("Server is running on http://localhost:3001"),
);
