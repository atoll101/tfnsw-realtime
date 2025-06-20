import React, { useState, useEffect, useRef } from "react";
import { fetchDepartures, searchStops } from "../api";
import "./BusDepartures.css";
import SettingsModal from "./SettingsModal";
import { FaCog } from "react-icons/fa";
import BusDepartureBoard from "./BusDepartureBoard";

const BUS_PRODUCT_CLASS = 5;

// --- Helper Component for the Live Stop Search UI ---
const StopSearch = ({ onStopSelect }) => {
  // ... (no changes to this helper component)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchTimeoutRef = useRef(null);
  const minSearchLength = 2;

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchTerm.length < minSearchLength) {
      setSearchResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await searchStops(searchTerm, "stop");
        const filteredLocations = (data.locations || []).filter(
          (loc) =>
            loc.type === "stop" &&
            loc.assignedStops?.some((as) =>
              as.productClasses?.includes(BUS_PRODUCT_CLASS)
            )
        );
        setSearchResults(filteredLocations);
      } catch (err) {
        setError("Search failed. Please try again.");
        console.error("Error searching bus stops:", err);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);

  const handleSelect = (stop) => {
    onStopSelect(stop);
  };

  return (
    <div className="bus-search-container">
      <label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by stop name or ID..."
        />
      </label>
      <ul className="bus-stop-list">
        {loading && <li className="info-message">Searching...</li>}
        {error && <li className="info-message error-message">{error}</li>}
        {!loading &&
          searchResults.length > 0 &&
          searchResults.map((stop) => (
            <li key={stop.id} onMouseDown={() => handleSelect(stop)}>
              {stop.disassembledName || stop.name}
            </li>
          ))}
        {!loading &&
          searchTerm.length >= minSearchLength &&
          searchResults.length === 0 && (
            <li className="info-message">No matching bus stops found.</li>
          )}
        {searchTerm.length < minSearchLength && (
          <li className="info-message">
            Enter at least {minSearchLength} characters to search.
          </li>
        )}
      </ul>
    </div>
  );
};

// --- Main BusDepartures Component ---
function BusDepartures() {
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedStop?.departureId) {
      // <-- Use the new departureId
      setDepartures([]);
      return;
    }

    const getDepartures = async () => {
      setLoading(true);
      setError(null);
      try {
        // Pass the correct ID for departure monitoring
        const data = await fetchDepartures(selectedStop.departureId);
        const allDepartures = data.stopEvents || [];
        const filteredDepartures = allDepartures.filter(
          (dep) => dep.transportation?.product?.class === BUS_PRODUCT_CLASS
        );
        setDepartures(filteredDepartures);
      } catch (err) {
        setError("Failed to load bus departures for this stop.");
        console.error("Error fetching bus departures:", err);
      } finally {
        setLoading(false);
      }
    };

    getDepartures();
    const intervalId = setInterval(getDepartures, 30000);
    return () => clearInterval(intervalId);
  }, [selectedStop]);

  // --- vvv THIS IS THE KEY CHANGE vvv ---
  const handleStopSelect = (stop) => {
    // Extract the correct departure monitoring ID from the 'assignedStops' array.
    const departureId = stop.assignedStops?.[0]?.id;

    if (departureId) {
      setSelectedStop({
        // Store all the info we need in our state
        name: stop.disassembledName || stop.name,
        id: stop.id, // The simple ID (e.g., 203612)
        departureId: departureId, // The global ID for departures (e.g., G203612)
      });
      setIsSettingsModalOpen(false);
    } else {
      // Handle cases where the data might be missing, though unlikely
      setError("Selected stop is missing the required departure information.");
    }
  };

  if (!selectedStop) {
    return (
      <div className="bus-initial-screen-wrapper">
        <div className="bus-initial-prompt">
          <h2>Select a Bus Stop</h2>
          <p>Search for a bus stop by its name, suburb, or ID.</p>
          <StopSearch onStopSelect={handleStopSelect} />
        </div>
      </div>
    );
  }

  // Once a stop is selected, render the main departure board view
  return (
    <div className="bus-full-screen-view">
      <button
        className="settings-button"
        onClick={() => setIsSettingsModalOpen(true)}
      >
        <FaCog />
      </button>

      <div className="bus-timetable-content">
        {loading && (
          <p className="main-board-message">Loading bus departures...</p>
        )}
        {error && (
          <p className="main-board-message" style={{ color: "red" }}>
            {error}
          </p>
        )}

        {!loading && departures.length > 0 && (
          <BusDepartureBoard
            departures={departures}
            selectedStop={selectedStop}
          />
        )}

        {!loading && departures.length === 0 && !error && (
          <div className="bus-board-container empty">
            <p className="main-board-message">
              No departures found for {selectedStop.name} at this time.
            </p>
          </div>
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      >
        <div className="modal-station-selection-controls">
          <h2>Change Bus Stop</h2>
          <StopSearch onStopSelect={handleStopSelect} />
        </div>
      </SettingsModal>
    </div>
  );
}

export default BusDepartures;
