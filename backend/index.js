const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

const networkData = {
  nodes: [
    {
      id: "node-1",
      type: "server",
      data: {
        label: "SDN Controller",
        status: "online",
        ip: "192.168.1.1",
        latency: 5,
        uptime: 720,
      },
      position: { x: 600, y: 0 },
    },
    {
      id: "node-2",
      type: "switch",
      data: {
        label: "Switch - Workshop 1",
        status: "online",
        ip: "192.168.1.10",
        latency: 12,
        uptime: 680,
      },
      position: { x: 250, y: 300 },
    },
    {
      id: "node-3",
      type: "switch",
      data: {
        label: "Switch - Workshop 2",
        status: "online",
        ip: "192.168.1.11",
        latency: 15,
        uptime: 650,
      },
      position: { x: 950, y: 300 },
    },
    {
      id: "node-4",
      type: "industrial",
      data: {
        label: "CNC Machine 01",
        status: "online",
        ip: "192.168.1.100",
        load: 45,
        latency: 18,
        uptime: 120,
      },
      position: { x: 50, y: 600 },
    },
    {
      id: "node-5",
      type: "industrial",
      data: {
        label: "CNC Machine 02",
        status: "warning",
        ip: "192.168.1.101",
        load: 85,
        latency: 25,
        uptime: 96,
      },
      position: { x: 450, y: 600 },
    },
    {
      id: "node-6",
      type: "industrial",
      data: {
        label: "CNC Machine 03",
        status: "online",
        ip: "192.168.1.102",
        load: 62,
        latency: 20,
        uptime: 200,
      },
      position: { x: 750, y: 600 },
    },
    {
      id: "node-7",
      type: "industrial",
      data: {
        label: "CNC Machine 04",
        status: "offline",
        ip: "192.168.1.103",
        load: 0,
        latency: 0,
        uptime: 0,
      },
      position: { x: 1150, y: 600 },
    },
    {
      id: "node-8",
      type: "server",
      data: {
        label: "Backup Server",
        status: "online",
        ip: "192.168.1.2",
        latency: 8,
        uptime: 500,
      },
      position: { x: 600, y: 750 },
    },
  ],
  edges: [
    { id: "e1-2", source: "node-1", target: "node-2", animated: true },
    { id: "e1-3", source: "node-1", target: "node-3", animated: true },
    { id: "e2-4", source: "node-2", target: "node-4", animated: true },
    { id: "e2-5", source: "node-2", target: "node-5", animated: false },
    { id: "e3-6", source: "node-3", target: "node-6", animated: true },
    { id: "e3-7", source: "node-3", target: "node-7", animated: false },
    { id: "e1-8", source: "node-1", target: "node-8", animated: true, type: "straight" },
  ],
};

app.get("/api/topology", (req, res) => {
  res.json(networkData);
});

app.listen(3001, () =>
  console.log("Server is running on http://localhost:3001"),
);
