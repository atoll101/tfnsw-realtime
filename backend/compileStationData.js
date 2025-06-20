// compileStationData.js
require("dotenv").config({ path: "./.env" }); // Load .env file

const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const csv = require("csv-parser");
const { Readable } = require("stream");

const API_KEY = process.env.TFN_API_KEY;
const BACKEND_BASE_URL = "http://localhost:5001"; // Your backend server URL

const GTFS_STOPS_URL =
  "https://opendata.transport.nsw.gov.au/dataset/e9d94351-f22d-46ea-b64d-10e7e238368a/resource/03163152-4462-432d-965a-8b17b204646a/download/gtfs-stops.txt"; // Direct link to stops.txt

// Product class IDs for filtering (from Trip Planner API doc for consistency)
const PRODUCT_CLASSES = {
  TRAIN: 1,
  BUS: 5,
  LIGHT_RAIL: 4,
  FERRY: 9,
  COACH: 7,
};

const CONFIGS = [
  {
    mode: "Train",
    productClass: PRODUCT_CLASSES.TRAIN,
    outputFile: "../frontend/src/data/trainStations.json",
  },
  {
    mode: "Bus",
    productClass: PRODUCT_CLASSES.BUS,
    outputFile: "../frontend/src/data/busStops.json",
  },
  {
    mode: "Light Rail",
    productClass: PRODUCT_CLASSES.LIGHT_RAIL,
    outputFile: "../frontend/src/data/lightRailStops.json",
  },
  {
    mode: "Ferry",
    productClass: PRODUCT_CLASSES.FERRY,
    outputFile: "../frontend/src/data/ferryWharves.json",
  },
  {
    mode: "Coach",
    productClass: PRODUCT_CLASSES.COACH,
    outputFile: "../frontend/src/data/coachStops.json",
  },
];

async function downloadAndParseGTFSStops() {
  console.log(`Downloading GTFS stops.txt from: ${GTFS_STOPS_URL}`);
  const response = await axios.get(GTFS_STOPS_URL, { responseType: "text" });
  if (!response.data) {
    throw new Error("GTFS stops.txt download was empty or failed.");
  }
  const csvText = response.data;

  const stops = [];
  return new Promise((resolve, reject) => {
    Readable.from([csvText])
      .pipe(csv())
      .on("data", (row) => {
        stops.push({
          gtfs_stop_id: row.stop_id,
          stop_name: row.stop_name,
          stop_code: row.stop_code,
          location_type: row.location_type,
          parent_station: row.parent_station,
        });
      })
      .on("end", () => {
        console.log(`Successfully parsed ${stops.length} stops from GTFS.`);
        const uniqueStops = Array.from(
          new Map(stops.map((s) => [s.gtfs_stop_id, s])).values()
        );
        uniqueStops.sort((a, b) => a.stop_name.localeCompare(b.stop_name));
        resolve(uniqueStops);
      })
      .on("error", (err) => {
        console.error("Error parsing GTFS CSV:", err);
        reject(err);
      });
  });
}

// Function to verify a GTFS stop_id against stop_finder API for productClass
async function verifyStopIdAndGetDetails(gtfsStopId, modeProductClass) {
  if (
    !gtfsStopId ||
    typeof gtfsStopId !== "string" ||
    gtfsStopId.trim() === ""
  ) {
    return null;
  }

  try {
    const stopFinderApiUrl = `${BACKEND_BASE_URL}/api/stop-finder?query=${encodeURIComponent(
      gtfsStopId
    )}&type_sf=stop&anyMaxSizeHitList=1`;

    const response = await axios.get(stopFinderApiUrl, {
      headers: {
        Authorization: `apikey ${API_KEY}`,
      },
      timeout: 5000,
    });

    const locations = response.data.locations || [];
    if (locations.length === 0) {
      return null;
    }

    const exactMatch = locations.find((loc) => loc.id === gtfsStopId); // Find the exact match by ID
    if (!exactMatch) {
      return null;
    }

    if (
      exactMatch.type === "stop" &&
      exactMatch.assignedStops &&
      exactMatch.assignedStops.length > 0
    ) {
      if (
        exactMatch.assignedStops[0].productClasses.includes(modeProductClass)
      ) {
        return {
          id: exactMatch.id,
          name: exactMatch.disassembledName || exactMatch.name,
          suburb: exactMatch.parent?.name || "",
        };
      }
    }
    return null;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error(
        `Rate Limit Hit (429) for ID ${gtfsStopId}. Increase pause!`
      );
      throw error;
    } else if (error.response) {
      console.warn(
        `Warning: API error for ID ${gtfsStopId}: Status ${
          error.response.status
        }, ${error.response.data.ErrorDetails?.Message || error.message}`
      );
    } else {
      console.warn(
        `Warning: Network error for ID ${gtfsStopId}: ${error.message}`
      );
    }
    return null;
  }
}

async function compileStationData() {
  if (!API_KEY) {
    console.error("Error: TFN_API_KEY is not set in your .env file.");
    process.exit(1);
  }

  // 1. Download and parse the raw GTFS stops.txt once
  const allGTFSStops = await downloadAndParseGTFSStops();

  // CRUCIAL FIX: Ensure we're using the successfully parsed 'allGTFSStops' array for iteration
  if (
    !allGTFSStops ||
    !Array.isArray(allGTFSStops) ||
    allGTFSStops.length === 0
  ) {
    console.error(
      "Error: No valid GTFS stops parsed or the array is empty. Cannot proceed with compilation."
    );
    process.exit(1);
  }
  console.log(
    `Starting compilation, processing ${allGTFSStops.length} GTFS stops...`
  ); // Corrected log message

  // 2. Iterate through modes and compile lists
  for (const config of CONFIGS) {
    console.log(`\n--- Compiling ${config.mode} Stations ---`);
    const modeSpecificStations = new Map();

    let processedCount = 0;
    // CORRECTED LOOP: Ensure we iterate over the actual allGTFSStops array
    for (const gtfsStop of allGTFSStops) {
      // Direct iteration over the correct array
      const stationDetails = await verifyStopIdAndGetDetails(
        gtfsStop.gtfs_stop_id,
        config.productClass
      );
      if (stationDetails) {
        if (!modeSpecificStations.has(stationDetails.id)) {
          modeSpecificStations.set(stationDetails.id, stationDetails);
        }
      }
      processedCount++;
      if (processedCount % 100 === 0) {
        process.stdout.write(
          `  Processed ${processedCount}/${allGTFSStops.length} stops for ${config.mode}... (${modeSpecificStations.size} found so far)\r`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 300)); // Pause for 300ms per request
    }
    process.stdout.write(`\n`);

    let finalStationList = Array.from(modeSpecificStations.values());
    finalStationList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    const outputPath = path.resolve(__dirname, config.outputFile);
    const outputDir = path.dirname(outputPath);

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(finalStationList, null, 2));

    console.log(
      `Successfully compiled ${finalStationList.length} ${config.mode} stations to ${outputPath}`
    );
  }

  console.log("\n--- All compilation complete ---");
}

compileStationData().catch((error) => {
  console.error("Compilation failed:", error);
  process.exit(1);
});
