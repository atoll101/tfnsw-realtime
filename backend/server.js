// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000; // Use port 5001 or whatever is available

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Get your API key from environment variables
const API_KEY = process.env.TFN_API_KEY;

// Base URL for the Transport for NSW API
const TFN_BASE_URL = "https://api.transport.nsw.gov.au/v1/tp/";

// Product class IDs for filtering (used internally, not directly in endpoints now)
const PRODUCT_CLASSES = {
  TRAIN: 1,
  METRO: 2,
  LIGHT_RAIL: 4,
  BUS: 5,
  COACH: 7,
  FERRY: 9,
  SCHOOL_BUS: 11,
};

// Root route for testing server
app.get("/", (req, res) => {
  res.send("Backend for Live Departure Board is running!");
});

// Proxy endpoint for Departures
app.get("/api/departures", async (req, res) => {
  // Extract query parameters from the frontend request
  const { stationId } = req.query;

  if (!stationId) {
    return res.status(400).json({ error: "Missing stationId query parameter" });
  }

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const itdDate = `${year}${month}${day}`;
    const itdTime = `${hours}${minutes}`;

    const apiUrl = `${TFN_BASE_URL}departure_mon?outputFormat=rapidJSON&coordOutputFormat=EPSG:4326&mode=direct&type_dm=stop&name_dm=${stationId}&depArrMacro=dep&itdDate=${itdDate}&itdTime=${itdTime}&TfNSWDM=true`;

    console.log(`Fetching from TfNSW API: ${apiUrl}`);

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `apikey ${API_KEY}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching data from TfNSW API:", error.message);
    if (error.response) {
      console.error("TfNSW API Error Response:", error.response.data);
      console.error("TfNSW API Status:", error.response.status);
      console.error("TfNSW API Headers:", error.response.headers);
    }
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch departures from Transport for NSW API",
      details: error.response?.data || error.message,
    });
  }
});

// Proxy endpoint for Stop Finder
app.get("/api/stop-finder", async (req, res) => {
  const { query, type_sf } = req.query;

  if (!query) {
    return res
      .status(400)
      .json({ error: "Missing query parameter for stop finder" });
  }

  try {
    const stopFinderApiUrl = `${TFN_BASE_URL}stop_finder?outputFormat=rapidJSON&coordOutputFormat=EPSG:4326&name_sf=${encodeURIComponent(
      query
    )}&type_sf=${type_sf || "any"}&anyMaxSizeHitList=10`;

    console.log(`Fetching from TfNSW Stop Finder API: ${stopFinderApiUrl}`);

    const response = await axios.get(stopFinderApiUrl, {
      headers: {
        Authorization: `apikey ${API_KEY}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching data from TfNSW Stop Finder API:",
      error.message
    );
    if (error.response) {
      console.error(
        "TfNSW Stop Finder API Error Response:",
        error.response.data
      );
      console.error("TfNSW API Status:", error.response.status);
      console.error("TfNSW API Headers:", error.response.headers);
    }
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch stops from Transport for NSW API",
      details: error.response?.data || error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access it at http://localhost:${PORT}`);
});
