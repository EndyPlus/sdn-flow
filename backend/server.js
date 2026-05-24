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
 * Get valid authentication token from Cisco DNA Center
 * Implements 55-minute caching for stable auth
 * @returns {Promise<string>} Valid auth token
 */
async function getValidToken() {
  const now = Date.now();
  const FIFTY_FIVE_MINUTES = 55 * 60 * 1000; // 55 minutes in ms

  // Return cached token if still valid (55 minute cache)
  if (tokenCache.token && tokenCache.expiresAt && now < tokenCache.expiresAt) {
    console.log("[AUTH] Using cached token (valid)");
    return tokenCache.token;
  }

  console.log("[AUTH] Fetching new token from Cisco...");

  try {
    const response = await axios.post(
      `${CISCO_BASE_URL}${CISCO_AUTH_ENDPOINT}`,
      {},
      {
        httpsAgent,  // SSL bypass for self-signed cert
        auth: {
          username: CISCO_USERNAME,
          password: CISCO_PASSWORD,
        },
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const token = response.data?.Token;
    if (!token) {
      throw new Error("No Token in response");
    }

    // Cache for 55 minutes (Cisco tokens are valid for 60 minutes)
    tokenCache = {
      token,
      expiresAt: now + FIFTY_FIVE_MINUTES,
    };

    console.log("[AUTH] New token cached for 55 minutes");
    return token;
  } catch (error) {
    console.error("[AUTH] Failed to get token:", error.message);
    if (error.response) {
      console.error("[AUTH] Response status:", error.response.status);
    }
    throw new Error("Authentication failed");
  }
}

/**
 * Make authenticated request to Cisco API
 * Uses getValidToken for 55-minute cached auth
 * Automatically retries with new token on 401
 */
async function makeCiscoRequest(endpoint, retryCount = 0) {
  const token = await getValidToken();

  try {
    const response = await axios.get(`${CISCO_BASE_URL}${endpoint}`, {
      httpsAgent,  // SSL bypass for self-signed cert
      headers: {
        "X-Auth-Token": token,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    // If 401 Unauthorized, clear token cache and retry once
    if (error.response?.status === 401 && retryCount === 0) {
      console.log(`[API] 401 received, clearing token cache and retrying...`);
      tokenCache = { token: null, expiresAt: null };
      return makeCiscoRequest(endpoint, retryCount + 1);
    }

    console.error(`[API] Cisco API request failed for ${endpoint}:`, error.message);
    if (error.response) {
      console.error(`[API] Status: ${error.response.status}`);
    }
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
  if (device.isVirtual && device.virtualType === "industrial") {
    return 2;
  }

  // SDN Controller is Level 0 (top, above CORE)
  if (device.isVirtual && device.virtualType === "controller") {
    return 0;
  }

  const role = (device.role || "").toUpperCase();
  const family = (device.family || "").toLowerCase();

  // Level 0 (Top): CORE role, Distribution, or Controller
  if (role === "CORE" || role === "DISTRIBUTION" || role === "CONTROLLER") {
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
 * Generate hierarchical positions for nodes with TIGHT layout (NO COLLISION)
 * Controller: y = 0 (top center, x=0)
 * Level 1 (Switches): y = 200, with 1200px spacing
 * Level 2 (CNC): y = 400, with 350px spacing between CNCs
 * @param {Array} devices - Array of device objects
 * @param {Map} switchAssignments - Map of CNC id -> assigned switch id
 * @returns {Map} Map of device ID to position {x, y}
 */
function generateHierarchicalPositions(devices, switchAssignments = new Map()) {
  if (!Array.isArray(devices)) return new Map();

  // Separate controller from other devices
  const controller = devices.find(d => d.isVirtual && d.virtualType === "controller");
  const otherDevices = devices.filter(d => !(d.isVirtual && d.virtualType === "controller"));

  // Group non-controller devices by level
  const levelGroups = new Map();
  for (const device of otherDevices) {
    const level = getDeviceLevel(device);
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level).push(device);
  }

  const positions = new Map();

  // Controller at absolute center (x=0, y=0)
  if (controller) {
    positions.set(controller.id, { x: 0, y: 0 });
  }

  // Vertical positions - TIGHT but safe spacing
  const Y_SWITCH = 200;  // Level 1
  const Y_CNC = 400;     // Level 2
  const SPACING_SWITCH = 1200; // Switch-to-switch gap (1200px - prevents inter-group collision)
  const SPACING_CNC = 350;     // CNC-to-CNC gap (350px - tight but no touch)

  // Level 0 (Core/Distribution) at y=0 (same level as controller, side by side)
  if (levelGroups.has(0)) {
    const level0Devices = levelGroups.get(0).filter(d => !(d.isVirtual && d.virtualType === "controller"));
    if (level0Devices.length > 0) {
      const sorted = level0Devices.sort((a, b) => {
        const nameA = (a.hostname || a.id || "").toString().toLowerCase();
        const nameB = (b.hostname || b.id || "").toString().toLowerCase();
        return nameA.localeCompare(nameB);
      });
      const rowLength = sorted.length;
      sorted.forEach((device, index) => {
        const x = (index - (rowLength - 1) / 2) * SPACING_SWITCH;
        positions.set(device.id, { x, y: 0 });
      });
    }
  }

  // Level 1 (Switches) at y=200 with 400px spacing
  let switchPositions = new Map();
  if (levelGroups.has(1)) {
    const level1Devices = levelGroups.get(1).sort((a, b) => {
      const nameA = (a.hostname || a.id || "").toString().toLowerCase();
      const nameB = (b.hostname || b.id || "").toString().toLowerCase();
      return nameA.localeCompare(nameB);
    });
    const rowLength = level1Devices.length;
    level1Devices.forEach((device, index) => {
      const x = (index - (rowLength - 1) / 2) * SPACING_SWITCH;
      positions.set(device.id, { x, y: Y_SWITCH });
      switchPositions.set(device.id, x);
    });
  }

  // Level 2 (CNC Machines) at y=400, grouped under switches with 280px gap
  if (levelGroups.has(2)) {
    const level2Devices = levelGroups.get(2);

    // Group CNCs by their assigned switch
    const cncsBySwitch = new Map();
    for (const cnc of level2Devices) {
      const assignedSwitchId = switchAssignments.get(cnc.id);
      if (!cncsBySwitch.has(assignedSwitchId)) {
        cncsBySwitch.set(assignedSwitchId, []);
      }
      cncsBySwitch.get(assignedSwitchId).push(cnc);
    }

    // Position CNCs centered under each switch with 350px spacing
    for (const [switchId, cncs] of cncsBySwitch) {
      const switchX = switchPositions.get(switchId) || 0;
      const cncCount = cncs.length;
      cncs.forEach((cnc, index) => {
        // 350px gap between CNCs - tight but no collision
        const groupOffset = (index - (cncCount - 1) / 2) * SPACING_CNC;
        positions.set(cnc.id, { x: switchX + groupOffset, y: Y_CNC });
      });
    }
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
 * @param {Array} devices - Device objects
 * @param {Map} positions - Pre-calculated positions (optional)
 * @returns {Array} React Flow nodes
 */
function mapDevicesToNodes(devices, positions = null) {
  if (!Array.isArray(devices)) return [];

  // Use provided positions or generate new ones
  const devicePositions = positions || generateHierarchicalPositions(devices);

  return devices.map((device) => {
    const position = devicePositions.get(device.id) || { x: 0, y: 0 };
    const isVirtual = device.isVirtual || false;
    const virtualType = device.virtualType || null;

    // Determine node type: controller -> server, industrial -> industrial, real devices -> switch
    let nodeType = "switch";
    if (isVirtual && virtualType === "controller") {
      nodeType = "server";
    } else if (isVirtual && virtualType === "industrial") {
      nodeType = "industrial";
    }

    // Determine status
    let status = "offline";
    if (isVirtual && virtualType === "industrial") {
      status = device.reachabilityStatus === "Unreachable" ? "offline" : "warning";
    } else if (isVirtual && virtualType === "controller") {
      status = "online"; // Controller is always online
    } else {
      status = device.reachabilityStatus === "Reachable" ? "online" : "offline";
    }

    return {
      id: device.id,
      type: nodeType,
      position: position,
      data: {
        label: device.hostname || "Unknown",
        status: status,
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

    // Determine edge color based on connection type
    // Controller->Switch: Cyan #00e5ff, Switch->Industrial: Green #22c55e
    let edgeColor = "#22c55e"; // Default Green for switch->CNC
    let isAnimated = false;

    if (sourceInfo.isVirtual || targetInfo.isVirtual) {
      // Connection involving virtual nodes at level 0 (controller)
      if (sourceInfo.level === 0 || targetInfo.level === 0) {
        edgeColor = "#00e5ff"; // Cyan for controller connections
        isAnimated = true;
      }
    }

    edges.push({
      id: link.id || `edge-${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      type: "smoothstep",
      animated: isAnimated,
      style: {
        strokeWidth: 2,
        stroke: edgeColor,
      },
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
 * @returns {Object} { edges: Array, switchAssignments: Map } - edges and CNC->switch mapping
 */
function generateVirtualEdges(devices, existingEdges) {
  if (!Array.isArray(devices)) return { edges: [], switchAssignments: new Map() };

  // Find Level 1 switches (real Cisco switches, not virtual)
  const level1Switches = devices.filter(
    (d) => !d.isVirtual && getDeviceLevel(d) === 1
  );

  if (level1Switches.length === 0) {
    console.warn("[VIRTUAL EDGES] No Level 1 switches found for virtual edge creation");
    return { edges: [], switchAssignments: new Map() };
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
    return { edges: [], switchAssignments: new Map() };
  }

  // Sort CNC machines by ID for consistent ordering
  const sortedCNCs = virtualIndustrial.sort((a, b) => {
    const idA = a.id.toString().toLowerCase();
    const idB = b.id.toString().toLowerCase();
    return idA.localeCompare(idB);
  });

  console.log(`[VIRTUAL EDGES] Distributing ${sortedCNCs.length} CNC machines across ${sortedSwitches.length} switches`);

  const virtualEdges = [];
  const switchAssignments = new Map(); // CNC id -> switch id
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

    // Store assignment for positioning
    switchAssignments.set(cncNode.id, sourceSwitch.id);

    const pairKey = `${sourceSwitch.id}-${cncNode.id}`;
    const reverseKey = `${cncNode.id}-${sourceSwitch.id}`;

    if (!existingEdgePairs.has(pairKey) && !existingEdgePairs.has(reverseKey)) {
      // Determine edge color based on CNC status
      // Green (#22c55e) for normal, Amber (#f59e0b) for warning, Red (#ef4444) for offline
      const isOffline = cncNode.reachabilityStatus === "Unreachable" ||
                        cncNode.reachabilityStatus === "offline";
      const isWarning = !isOffline && (cncNode.reachabilityStatus === "Partial" ||
                        cncNode.reachabilityStatus === "warning");

      let edgeColor = "#22c55e"; // Green (normal)
      let edgeLabel = null;
      let isAnimated = false;

      if (isOffline) {
        edgeColor = "#ef4444"; // Red (offline)
        edgeLabel = "● OFFLINE";
      } else if (isWarning) {
        edgeColor = "#f59e0b"; // Amber (warning)
        edgeLabel = "⚠ WARNING";
        isAnimated = true;
      }

      virtualEdges.push({
        id: `e-manual-${sourceSwitch.id}-${cncNode.id}`,
        source: sourceSwitch.id,
        target: cncNode.id,
        type: "smoothstep",
        animated: isAnimated,
        label: edgeLabel,
        labelStyle: { fill: edgeColor, fontWeight: "bold", fontSize: 10 },
        labelBgStyle: { fill: "#1e293b", rx: 4 },
        style: {
          strokeWidth: 2,
          stroke: edgeColor,
        },
        pathOptions: {
          borderRadius: 10,
          offset: 20,
        },
      });
      console.log(`  CNC ${cncIndex + 1}/${sortedCNCs.length} (${cncNode.id}) -> Switch ${switchIndex + 1} [${isOffline ? "OFFLINE" : isWarning ? "WARNING" : "OK"}]`);
    }
  });

  console.log(`[VIRTUAL EDGES] Created ${virtualEdges.length} virtual edges total`);
  return { edges: virtualEdges, switchAssignments };
}

/**
 * Map Cisco devices to lightweight status nodes for polling
 */
function mapDevicesToStatus(devices) {
  if (!Array.isArray(devices)) return [];

  return devices.map((device) => {
    const isVirtual = device.isVirtual || false;
    const virtualType = device.virtualType || null;

    // Handle SDN Controller
    if (isVirtual && virtualType === "controller") {
      return {
        id: device.id,
        status: "online",
        uptime: device.uptime || 30 * 24 * 60 * 60,
        load: 25,
        latency: 5,
      };
    }

    // Handle virtual industrial nodes
    if (isVirtual && virtualType === "industrial") {
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
    console.log("\n=== TOPOLOGY REQUEST ===");
    console.log(`[${new Date().toISOString()}] Fetching from Cisco...`);

    // Fetch devices and topology in parallel
    const [devicesData, topologyData] = await Promise.all([
      makeCiscoRequest(CISCO_DEVICES_ENDPOINT),
      makeCiscoRequest(CISCO_TOPOLOGY_ENDPOINT),
    ]);

    console.log(`[SUCCESS] Got devices and topology from Cisco`);

    let devices = devicesData.response || [];
    const topology = topologyData.response || {};
    const links = topology.links || [];

    console.log(`[DATA] ${devices.length} devices, ${links.length} links from Cisco`);

    // Inject SDN Controller Node at the top of the hierarchy
    const controllerNode = {
      id: "sdn-controller-core",
      hostname: "SDN Controller (Catalyst Center)",
      managementIpAddress: "10.10.10.1",
      reachabilityStatus: "Reachable",
      role: "CONTROLLER",
      family: "Controller",
      isVirtual: true,
      virtualType: "controller",
      uptime: 30 * 24 * 60 * 60,
    };
    devices.unshift(controllerNode);
    console.log(`[CONTROLLER] Added SDN Controller node at top of hierarchy`);

    // Hybrid Mode: Add virtual industrial nodes if fewer than 15 devices
    const MIN_DEVICE_COUNT = 15;
    if (devices.length < MIN_DEVICE_COUNT) {
      const virtualCount = MIN_DEVICE_COUNT - devices.length;
      const virtualNodes = generateVirtualIndustrialNodes(virtualCount, devices.length);
      devices = [...devices, ...virtualNodes];
    }

    // Generate virtual edges and get switch assignments for positioning
    const { edges: virtualEdges, switchAssignments } = generateVirtualEdges(devices, []);

    // Now generate positions with switch assignments for CNC grouping
    const positions = generateHierarchicalPositions(devices, switchAssignments);

    // Map devices to nodes with the calculated positions
    const nodes = mapDevicesToNodes(devices, positions);

    // Map topology links to edges with neon green styling
    const topologyEdges = mapLinksToEdges(links, devices);

    // Add SDN Controller edges - connect to Level 1 switches (CAT-SRE nodes)
    // CYAN (#00e5ff) for backbone traffic, animated
    const level1Switches = devices.filter(
      (d) => !d.isVirtual && getDeviceLevel(d) === 1
    );
    const controllerEdges = level1Switches.map((sw) => ({
      id: `e-ctrl-${sw.id}`,
      source: "sdn-controller-core",
      target: sw.id,
      type: "smoothstep",
      animated: true,
      style: {
        strokeWidth: 2,
        stroke: "#00e5ff", // Cyan for controller->switch
      },
      pathOptions: {
        borderRadius: 10,
        offset: 20,
      },
    }));
    console.log(`[CONTROLLER] Connected to ${controllerEdges.length} switches with CYAN backbone edges`);

    // Combine all edges: controller edges first, then topology, then virtual
    const edges = [...controllerEdges, ...topologyEdges, ...virtualEdges];

    // Log hierarchy breakdown
    const levelCounts = { 0: 0, 1: 0, 2: 0 };
    for (const device of devices) {
      const level = getDeviceLevel(device);
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    }

    console.log(`[TOPOLOGY] ${nodes.length} nodes, ${edges.length} edges`);
    console.log(`  Level 0 (Controller): ${levelCounts[0]} nodes at y=0 (x=0 center)`);
    console.log(`  Level 1 (Switches): ${levelCounts[1]} nodes at y=200 (1200px gap)`);
    console.log(`  Level 2 (CNC): ${levelCounts[2]} nodes at y=400 (350px gap - closer)`);
    console.log(`  Edge Colors: Cyan (#00e5ff)=Backbone, Green (#22c55e)=Normal, Orange (#f59e0b)=Warning, Red (#ef4444)=Offline`);

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
    console.error("\n=== TOPOLOGY ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code || "N/A");

    // Detailed error logging for debugging
    if (error.response) {
      console.error("Cisco response status:", error.response.status);
      console.error("Cisco response data:", error.response.data);
    }
    if (error.stack) {
      console.error("Stack trace:", error.stack.split('\n').slice(0, 5).join('\n'));
    }

    // Return appropriate error response
    res.status(500).json({
      error: "Failed to fetch topology from Cisco DNA Center",
      message: error.message,
      code: error.code || "UNKNOWN",
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
    console.log("\n=== STATUS REQUEST ===");
    console.log(`[${new Date().toISOString()}] Fetching status from Cisco...`);

    const devicesData = await makeCiscoRequest(CISCO_DEVICES_ENDPOINT);
    let devices = devicesData.response || [];
    console.log(`[SUCCESS] Got ${devices.length} devices from Cisco`);

    // Add SDN Controller Node for consistency with topology endpoint
    const controllerNode = {
      id: "sdn-controller-core",
      hostname: "SDN Controller (Catalyst Center)",
      managementIpAddress: "10.10.10.1",
      reachabilityStatus: "Reachable",
      role: "CONTROLLER",
      family: "Controller",
      isVirtual: true,
      virtualType: "controller",
      uptime: 30 * 24 * 60 * 60,
    };
    devices.unshift(controllerNode);

    // Hybrid Mode: Add same virtual industrial nodes if fewer than 15 devices
    const MIN_DEVICE_COUNT = 15;
    if (devices.length < MIN_DEVICE_COUNT) {
      const virtualCount = MIN_DEVICE_COUNT - devices.length;
      const virtualNodes = generateVirtualIndustrialNodes(virtualCount, devices.length);
      devices = [...devices, ...virtualNodes];
    }

    const nodes = mapDevicesToStatus(devices);
    console.log(`[STATUS] Returning ${nodes.length} status nodes`);

    res.json({ nodes });
  } catch (error) {
    console.error("\n=== STATUS ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code || "N/A");

    if (error.response) {
      console.error("Cisco response status:", error.response.status);
      console.error("Cisco response data:", error.response.data);
    }

    res.status(500).json({
      error: "Failed to fetch device status from Cisco DNA Center",
      message: error.message,
      code: error.code || "UNKNOWN",
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
