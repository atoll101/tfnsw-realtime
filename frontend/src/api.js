import axios from "axios";

const API_BASE_URL = "https://tfnsw-realtime.onrender.com/"; // Ensure this matches your backend port

// Function to fetch departures
export const fetchDepartures = async (stationId) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const itdDate = `${year}${month}${day}`;
    const itdTime = `${hours}${minutes}`;

    // Note: The 'mode' parameter for TfNSWTRansportMode will be applied during *display* on the frontend.
    // We fetch all types of departures for the given stationId here.
    const response = await axios.get(`${API_BASE_URL}/api/departures`, {
      params: {
        stationId: stationId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching departures from backend:", error);
    throw error;
  }
};

// Function to search for stops
export const searchStops = async (query, type_sf = "stop") => {
  // Default type_sf to 'stop'
  try {
    const response = await axios.get(`${API_BASE_URL}/api/stop-finder`, {
      params: {
        query: query,
        type_sf: type_sf,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching stops from backend:", error);
    throw error;
  }
};
