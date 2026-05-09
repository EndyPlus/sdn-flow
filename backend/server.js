const express = require("express");
const cors = require("cors");
const axios = require("axios");
const https = require("https");

const app = express();
app.use(cors());

// Cisco DNA Center Configuration
const CISCO_BASE_URL = "https://sandboxdnac.cisco.com";
const CISCO_AUTH_ENDPOINT = "/dna/system/api/v1/auth/token";
const CISCO_DEVICES_ENDPOINT = "/dna/intent/api/v1/network-device";
const CISCO_TOPOLOGY_ENDPOINT = "/dna/intent/api/v1/topology/physical-topology";

const CISCO_USERNAME = "devnetuser";
const CISCO_PASSWORD = "Cisco123!";

// HTTPS Agent to bypass SSL certificate verification (Cisco sandbox uses self-signed cert)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Token cache
let tokenCache = {
  token: null,
  expiresAt: null,
};

/**
 * Get authentication token from Cisco DNA Center
 * Implements caching - only fetches new token if missing or expired
 */
async function getAuthToken() {
  const now = Date.now();

  // Return cached token if still valid (with 5 minute buffer)
  if (tokenCache.token && tokenCache.expiresAt && now < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.token;
  }

  try {
    const response = await axios.post(
      `${CISCO_BASE_URL}${CISCO_AUTH_ENDPOINT}`,
      {},
      {
        httpsAgent,
        auth: {
          username: CISCO_USERNAME,
          password: CISCO_PASSWORD,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const token = response.data.Token;
    // Token is valid for 1 hour
    tokenCache = {
      token,
      expiresAt: now + 60 * 60 * 1000,
    };

    return token;
  } catch (error) {
    console.error("Failed to get auth token:", error.message);
    throw new Error("Authentication failed");
  }
}

/**
 * Make authenticated request to Cisco API
 * Automatically retries with new token on 401
 */
async function makeCiscoRequest(endpoint, retryCount = 0) {
  const token = await getAuthToken();

  try {
    const response = await axios.get(`${CISCO_BASE_URL}${endpoint}`, {
      httpsAgent,
      headers: {
        "X-Auth-Token": token,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    // If 401 Unauthorized, clear token cache and retry once
    if (error.response?.status === 401 && retryCount === 0) {
      tokenCache = { token: null, expiresAt: null };
      return makeCiscoRequest(endpoint, retryCount + 1);
    }

    console.error(`Cisco API request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Determine hierarchy level for a device based on Cisco properties
 * Row 0 (Top, y=0): Core and Distribution devices
 * Row 1 (Middle, y=300): Access switches and Switches and Hubs
 * Row 2 (Bottom, y=600): Industrial nodes and PCs
 * @param {Object} device - Device object
 * @returns {number} Hierarchy level (0, 1, or 2)
 */
function getDeviceLevel(device) {
  // Virtual industrial nodes are Level 2 (bottom row)
  if (device.isVirtual || device.virtualType === "industrial") {
    return 2;
  }

  const role = (device.role || "").toUpperCase();
  const family = (device.family || "").toLowerCase();

  // Level 0 (Top): CORE role or Distribution
  if (role === "CORE" || role === "DISTRIBUTION") {
    return 0;
  }

  // Level 2 (Bottom): PCs or endpoints
  if (family === "pcs" || device.deviceType?.toLowerCase().includes("pc")) {
    return 2;
  }

  // Level 1 (Middle): ACCESS switches and all other Switches and Hubs
  // This is the default for most switches
  return 1;
}

/**
 * Generate hierarchical positions for nodes with logical sorting
 * Row 0: y = 0, Row 1: y = 400, Row 2: y = 800
 * x = (index - (nodesInRow.length - 1) / 2) * 350
 * Sorts nodes alphabetically within each level to ensure straight lines
 * @param {Array} devices - Array of device objects
 * @returns {Map} Map of device ID to position {x, y}
 */
function generateHierarchicalPositions(devices) {
  if (!Array.isArray(devices)) return new Map();

  // Group devices by level
  const levelGroups = new Map();
  for (const device of devices) {
    const level = getDeviceLevel(device);
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level).push(device);
  }

  const positions = new Map();
  const rowHeight = 400; // y = 0, 400, 800
  const spacingX = 350; // 350px horizontal gap

  // Process each level: sort alphabetically, then assign positions
  for (const [level, levelDevices] of levelGroups) {
    const y = level * rowHeight;

    // Sort by hostname/label alphabetically for logical alignment
    const sortedDevices = levelDevices.sort((a, b) => {
      const nameA = (a.hostname || a.label || a.id || "").toString().toLowerCase();
      const nameB = (b.hostname || b.label || b.id || "").toString().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const rowLength = sortedDevices.length;

    sortedDevices.forEach((device, index) => {
      // Formula: x = (index - (rowLength - 1) / 2) * 350
      // This centers the row at x=0
      const x = (index - (rowLength - 1) / 2) * spacingX;
      positions.set(device.id, { x, y });
    });

    console.log(`[LAYOUT] Level ${level}: ${rowLength} nodes, y=${y}, x-range: ${(0 - (rowLength - 1) / 2) * spacingX} to ${(rowLength - 1 - (rowLength - 1) / 2) * spacingX}`);
  }

  return positions;
}

/**
 * Generate virtual industrial nodes (CNC machines) to supplement low device count
 * @param {number} count - Number of virtual nodes to generate
 * @param {number} startIndex - Starting index for virtual node IDs
 * @returns {Array} Array of virtual device objects
 */
function generateVirtualIndustrialNodes(count, startIndex) {
  const virtualNodes = [];
  const statuses = ["warning", "offline", "warning", "offline"];

  for (let i = 0; i < count; i++) {
    const status = statuses[i % statuses.length];
    virtualNodes.push({
      id: `virtual-cnc-${startIndex + i}`,
      hostname: `CNC-Machine-${String(startIndex + i).padStart(2, "0")}`,
      reachabilityStatus: status === "offline" ? "Unreachable" : "Partial",
      managementIpAddress: `192.168.100.${10 + startIndex + i}`,
      isVirtual: true,
      virtualType: "industrial",
    });
  }

  return virtualNodes;
}

/**
 * Map Cisco devices to React Flow nodes with hierarchical positioning
 */
function mapDevicesToNodes(devices) {
  if (!Array.isArray(devices)) return [];

  // Generate positions based on hierarchy
  const positions = generateHierarchicalPositions(devices);

  return devices.map((device) => {
    const position = positions.get(device.id) || { x: 0, y: 0 };
    const isVirtual = device.isVirtual || device.virtualType === "industrial";

    return {
      id: device.id,
      type: isVirtual ? "industrial" : "switch",
      position: position,
      data: {
        label: device.hostname || "Unknown",
        status: isVirtual
          ? device.reachabilityStatus === "Unreachable"
            ? "offline"
            : "warning"
          : device.reachabilityStatus === "Reachable"
            ? "online"
            : "offline",
        ip: device.managementIpAddress || "",
      },
    };
  });
}

/**
 * Map Cisco topology links to React Flow edges with hierarchy filtering
 * ONLY keeps edges where source.level < target.level (top-down)
 * Filters out peer-to-peer connections (same level)
 * Removes duplicate edges between same node pairs
 * @param {Array} links - Topology links from Cisco
 * @param {Array} devices - Device array for validation and level detection
 * @returns {Array} React Flow edges with type and animated properties
 */
function mapLinksToEdges(links, devices) {
  if (!Array.isArray(links)) return [];

  // Build map of valid device IDs and their levels
  const deviceInfo = new Map();
  if (devices) {
    for (const device of devices) {
      deviceInfo.set(device.id, {
        level: getDeviceLevel(device),
        isVirtual: device.isVirtual || false,
      });
    }
  }

  const edges = [];
  const seenPairs = new Set(); // Track unique source-target pairs
  let filteredSameLevel = 0;
  let filteredInvalidLevel = 0;
  let filteredDuplicates = 0;
  let filteredMissingNodes = 0;

  for (const link of links) {
    const sourceId = link.source;
    const targetId = link.target;

    if (!sourceId || !targetId) {
      console.warn(`[EDGE ERROR] Missing source or target in link: ${JSON.stringify(link)}`);
      continue;
    }

    // Validate that both nodes exist
    const sourceInfo = deviceInfo.get(sourceId);
    const targetInfo = deviceInfo.get(targetId);

    if (!sourceInfo || !targetInfo) {
      filteredMissingNodes++;
      continue;
    }

    // FILTER 1: Only allow top-down edges (source.level < target.level)
    // This removes peer-to-peer connections between switches
    if (sourceInfo.level >= targetInfo.level) {
      if (sourceInfo.level === targetInfo.level) {
        filteredSameLevel++;
      } else {
        filteredInvalidLevel++;
      }
      continue;
    }

    // FILTER 2: Remove duplicate edges (same pair, regardless of direction)
    const pairKey = `${sourceId}-${targetId}`;
    const reverseKey = `${targetId}-${sourceId}`;
    if (seenPairs.has(pairKey) || seenPairs.has(reverseKey)) {
      filteredDuplicates++;
      continue;
    }
    seenPairs.add(pairKey);

    // Determine if this is a Core-to-Switch connection (animated)
    const isCoreConnection = sourceInfo.level === 0 || targetInfo.level === 0;

    edges.push({
      id: link.id || `edge-${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      type: "smoothstep",
      animated: isCoreConnection,
      style: { strokeWidth: 2 },
      pathOptions: {
        borderRadius: 10,
        offset: 20,
      },
    });
  }

  // Log filtering results
  const totalFiltered = filteredSameLevel + filteredInvalidLevel + filteredDuplicates + filteredMissingNodes;
  if (totalFiltered > 0) {
    console.log(`[EDGE FILTER] From ${links.length} Cisco links, kept ${edges.length}, filtered ${totalFiltered}:`);
    console.log(`  - Same level (peer-to-peer): ${filteredSameLevel}`);
    console.log(`  - Invalid direction (bottom-up): ${filteredInvalidLevel}`);
    console.log(`  - Duplicates: ${filteredDuplicates}`);
    console.log(`  - Missing nodes: ${filteredMissingNodes}`);
  } else {
    console.log(`[EDGE FILTER] Kept all ${edges.length} edges from Cisco`);
  }

  return edges;
}

/**
 * Generate virtual edges connecting industrial nodes FROM Level 1 switches
 * CRITICAL: source = switch, target = CNC (top-down flow)
 * CNC machines are DISTRIBUTED EVENLY across available switches
 * @param {Array} devices - All devices including virtual ones
 * @param {Array} existingEdges - Already created edges from topology
 * @returns {Array} Additional edges for virtual industrial nodes
 */
function generateVirtualEdges(devices, existingEdges) {
  if (!Array.isArray(devices)) return [];

  // Find Level 1 switches (real Cisco switches, not virtual)
  const level1Switches = devices.filter(
    (d) => !d.isVirtual && getDeviceLevel(d) === 1
  );

  if (level1Switches.length === 0) {
    console.warn("[VIRTUAL EDGES] No Level 1 switches found for virtual edge creation");
    return [];
  }

  // Sort switches by hostname for consistent ordering
  const sortedSwitches = level1Switches.sort((a, b) => {
    const nameA = (a.hostname || a.id || "").toString().toLowerCase();
    const nameB = (b.hostname || b.id || "").toString().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  console.log(`[VIRTUAL EDGES] Available switches (${sortedSwitches.length}): ${sortedSwitches.map(s => s.hostname || s.id).join(", ")}`);

  // Find all virtual industrial nodes (Level 2)
  const virtualIndustrial = devices.filter((d) => d.isVirtual && d.virtualType === "industrial");

  if (virtualIndustrial.length === 0) {
    console.log("[VIRTUAL EDGES] No virtual industrial nodes found");
    return [];
  }

  // Sort CNC machines by ID for consistent ordering
  const sortedCNCs = virtualIndustrial.sort((a, b) => {
    const idA = a.id.toString().toLowerCase();
    const idB = b.id.toString().toLowerCase();
    return idA.localeCompare(idB);
  });

  console.log(`[VIRTUAL EDGES] Distributing ${sortedCNCs.length} CNC machines across ${sortedSwitches.length} switches`);

  const virtualEdges = [];
  const existingEdgePairs = new Set();

  // Build set of existing edge pairs to avoid duplicates
  for (const edge of existingEdges) {
    existingEdgePairs.add(`${edge.source}-${edge.target}`);
    existingEdgePairs.add(`${edge.target}-${edge.source}`);
  }

  // DISTRIBUTE CNCs EVENLY across switches
  // e.g., CNC 1-3 -> Switch A, CNC 4-6 -> Switch B, etc.
  const cncsPerSwitch = Math.ceil(sortedCNCs.length / sortedSwitches.length);

  sortedCNCs.forEach((cncNode, cncIndex) => {
    // Determine which switch this CNC connects to
    const switchIndex = Math.floor(cncIndex / cncsPerSwitch) % sortedSwitches.length;
    const sourceSwitch = sortedSwitches[switchIndex];

    const pairKey = `${sourceSwitch.id}-${cncNode.id}`;
    const reverseKey = `${cncNode.id}-${sourceSwitch.id}`;

    if (!existingEdgePairs.has(pairKey) && !existingEdgePairs.has(reverseKey)) {
      virtualEdges.push({
        id: `e-manual-${sourceSwitch.id}-${cncNode.id}`,
        source: sourceSwitch.id,  // Switch is the source (top)
        target: cncNode.id,       // CNC is the target (bottom)
        type: "smoothstep",
        animated: false,
        style: { strokeWidth: 2 },
        pathOptions: {
          borderRadius: 10,
          offset: 20,
        },
      });
      console.log(`  CNC ${cncIndex + 1}/${sortedCNCs.length} (${cncNode.id}) -> Switch ${switchIndex + 1} (${sourceSwitch.hostname || sourceSwitch.id})`);
    }
  });

  console.log(`[VIRTUAL EDGES] Created ${virtualEdges.length} virtual edges total`);
  return virtualEdges;
}

/**
 * Map Cisco devices to lightweight status nodes for polling
 */
function mapDevicesToStatus(devices) {
  if (!Array.isArray(devices)) return [];

  return devices.map((device) => {
    // Handle virtual industrial nodes
    if (device.isVirtual) {
      return {
        id: device.id,
        status: device.reachabilityStatus === "Unreachable" ? "offline" : "warning",
        uptime: 0,
        load: device.reachabilityStatus === "Unreachable" ? 0 : 75,
        latency: device.reachabilityStatus === "Unreachable" ? 0 : 150,
      };
    }

    // Handle real Cisco devices
    return {
      id: device.id,
      status: device.reachabilityStatus === "Reachable" ? "online" : "offline",
      uptime: device.uptimeSeconds || 0,
      load: device.cpuLoad !== undefined ? device.cpuLoad : null,
      latency: null,
    };
  });
}

/**
 * GET /api/topology - Full topology for initial React Flow render
 * Fetches both devices and topology links from Cisco DNA Center
 * Hybrid Mode: If fewer than 15 devices, adds virtual industrial nodes (CNC machines)
 */
app.get("/api/topology", async (req, res) => {
  try {
    // Fetch devices and topology in parallel
    const [devicesData, topologyData] = await Promise.all([
      makeCiscoRequest(CISCO_DEVICES_ENDPOINT),
      makeCiscoRequest(CISCO_TOPOLOGY_ENDPOINT),
    ]);

    let devices = devicesData.response || [];
    const topology = topologyData.response || {};
    const links = topology.links || [];

    // Hybrid Mode: Add virtual industrial nodes if fewer than 15 devices
    const MIN_DEVICE_COUNT = 15;
    if (devices.length < MIN_DEVICE_COUNT) {
      const virtualCount = MIN_DEVICE_COUNT - devices.length;
      const virtualNodes = generateVirtualIndustrialNodes(virtualCount, devices.length);
      devices = [...devices, ...virtualNodes];
    }

    const nodes = mapDevicesToNodes(devices);

    // Map topology links to edges with device validation
    const topologyEdges = mapLinksToEdges(links, devices);

    // Generate virtual edges connecting industrial nodes to switches
    const virtualEdges = generateVirtualEdges(devices, topologyEdges);

    // Combine all edges
    const edges = [...topologyEdges, ...virtualEdges];

    // Log hierarchy breakdown
    const levelCounts = { 0: 0, 1: 0, 2: 0 };
    for (const device of devices) {
      const level = getDeviceLevel(device);
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    }

    console.log(`[TOPOLOGY] ${nodes.length} nodes, ${edges.length} edges`);
    console.log(`  Level 0 (Core/Distribution): ${levelCounts[0]} nodes at y=0`);
    console.log(`  Level 1 (Access/Switches): ${levelCounts[1]} nodes at y=400`);
    console.log(`  Level 2 (Industrial/PCs): ${levelCounts[2]} nodes at y=800`);
    console.log(`  Edges breakdown: ${topologyEdges.length} from Cisco, ${virtualEdges.length} virtual`);

    // CRITICAL: Log all edges for debugging ID consistency
    console.log(`[TOPOLOGY] All edges (${edges.length}):`);
    edges.forEach((edge, i) => {
      console.log(`  [${i}] ${edge.id}: ${edge.source} -> ${edge.target}`);
    });

    // Validate: Check that all edge sources/targets exist in nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    const invalidEdges = edges.filter(e => !nodeIds.has(e.source) || !nodeIds.has(e.target));
    if (invalidEdges.length > 0) {
      console.error(`[TOPOLOGY ERROR] ${invalidEdges.length} edges reference non-existent nodes!`);
      invalidEdges.forEach(e => console.error(`  INVALID: ${e.id}: ${e.source} -> ${e.target}`));
    }

    res.json({ nodes, edges });
  } catch (error) {
    console.error("Error fetching topology:", error.message);
    res.status(500).json({
      error: "Failed to fetch topology from Cisco DNA Center",
      message: error.message,
    });
  }
});

/**
 * GET /api/topology/status - Lightweight status polling endpoint
 * Only fetches devices, no topology links
 * Returns same virtual nodes as topology endpoint for consistency
 */
app.get("/api/topology/status", async (req, res) => {
  try {
    const devicesData = await makeCiscoRequest(CISCO_DEVICES_ENDPOINT);
    let devices = devicesData.response || [];

    // Hybrid Mode: Add same virtual industrial nodes if fewer than 15 devices
    const MIN_DEVICE_COUNT = 15;
    if (devices.length < MIN_DEVICE_COUNT) {
      const virtualCount = MIN_DEVICE_COUNT - devices.length;
      const virtualNodes = generateVirtualIndustrialNodes(virtualCount, devices.length);
      devices = [...devices, ...virtualNodes];
    }

    const nodes = mapDevicesToStatus(devices);

    res.json({ nodes });
  } catch (error) {
    console.error("Error fetching status:", error.message);
    res.status(500).json({
      error: "Failed to fetch device status from Cisco DNA Center",
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
