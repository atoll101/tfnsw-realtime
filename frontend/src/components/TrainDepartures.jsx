import React, { useState, useEffect, useRef } from "react";
import { fetchDepartures } from "../api";
import "./TrainDepartures.css"; // Import specific CSS
import SettingsModal from "./SettingsModal";
import { FaCog } from "react-icons/fa";

// Import the local JSON file directly
import trainStationsData from "../data/trainStations.json";

const TRAIN_PRODUCT_CLASS = 1;

// --- Helper Component for the Search UI ---
// This avoids duplicating the search logic between the initial screen and the modal
const StationSearch = ({ onStationSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [allTrainStations] = useState(() =>
    trainStationsData.sort((a, b) => a.name.localeCompare(b.name))
  );
  const [filteredStations, setFilteredStations] = useState(allTrainStations);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const newFiltered = allTrainStations.filter((station) =>
      station.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredStations(newFiltered);
  }, [searchTerm, allTrainStations]);

  const handleStationSelect = (station) => {
    setSearchTerm(station.name);
    onStationSelect(station); // Pass the selected station up to the parent
  };

  return (
    <div className="train-search-container">
      <label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a station..."
          ref={searchInputRef}
        />
      </label>

      {/* --- This is now a scrollable list, not a dropdown --- */}
      <ul className="train-station-list">
        {filteredStations.length > 0 ? (
          filteredStations.map((station) => (
            <li
              key={station.id}
              onMouseDown={() => handleStationSelect(station)}
            >
              {station.name}
            </li>
          ))
        ) : (
          <li className="no-results-message">No matching stations found.</li>
        )}
      </ul>
    </div>
  );
};

// --- Main TrainDepartures Component ---
function TrainDepartures() {
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Effect for fetching departures based on the selected station
  useEffect(() => {
    if (!selectedStation) {
      setDepartures([]);
      return;
    }

    const getDepartures = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDepartures(selectedStation.id);
        const allDepartures = data.stopEvents || [];
        const filteredDepartures = allDepartures.filter(
          (dep) => dep.transportation?.product?.class === TRAIN_PRODUCT_CLASS
        );
        setDepartures(filteredDepartures);
      } catch (err) {
        setError("Failed to load train departures for this station.");
        console.error("Error fetching train departures:", err);
      } finally {
        setLoading(false);
      }
    };

    getDepartures();
    const intervalId = setInterval(getDepartures, 30000);
    return () => clearInterval(intervalId);
  }, [selectedStation]);

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setIsSettingsModalOpen(false); // Close modal on selection
  };

  // Render the initial station selection screen if no station is chosen
  if (!selectedStation) {
    return (
      <div className="train-initial-screen-wrapper">
        <div className="train-initial-prompt">
          <h2>Select a Train Station</h2>
          <p>Select your departure station.</p>
          <StationSearch onStationSelect={handleStationSelect} />
        </div>
      </div>
    );
  }

  // Once a station is selected, render the full timetable view
  return (
    <div className="train-full-screen-view">
      <button
        className="settings-button"
        onClick={() => setIsSettingsModalOpen(true)}
      >
        <FaCog />
      </button>

      <div className="train-timetable-content">
        {loading && (
          <p className="main-board-message">Loading train departures...</p>
        )}
        {error && (
          <p className="main-board-message" style={{ color: "red" }}>
            {error}
          </p>
        )}
        {!loading && departures.length === 0 && !error && (
          <p className="main-board-message">
            No train departures found for {selectedStation.name} at this time.
          </p>
        )}

        {!loading && departures.length > 0 && (
          <div className="train-departure-board-container">
            <div className="train-board-header">
              <span className="train-header-departures">Departures</span>
              <div className="train-header-time-container">
                <span className="train-header-time-label">Time now</span>
                <span className="train-header-current-time">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <div className="train-board-column-headers">
              <span className="service-to">Service to</span>
              <span className="departs">Departs</span>
              <span className="plat">Plat</span>
            </div>
            <div className="train-column-border-line"></div>
            <div className="train-departure-list">
              {departures.map((departure) => {
                const plannedTime = new Date(departure.departureTimePlanned);
                const estimatedTime = departure.departureTimeEstimated
                  ? new Date(departure.departureTimeEstimated)
                  : null;
                const timeToDisplay = estimatedTime || plannedTime;
                const diffMinutes = Math.round(
                  (timeToDisplay.getTime() - new Date().getTime()) / (1000 * 60)
                );

                let displayDepartsHrsMins = "";
                if (diffMinutes <= 0) {
                  displayDepartsHrsMins = "Due";
                } else if (diffMinutes < 60) {
                  displayDepartsHrsMins = `${diffMinutes} min`;
                } else {
                  const hours = Math.floor(diffMinutes / 60);
                  const remainingMinutes = diffMinutes % 60;
                  displayDepartsHrsMins = `${hours}h ${remainingMinutes}m`;
                }

                const displayActualTime = timeToDisplay.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const isDelayed =
                  estimatedTime &&
                  estimatedTime.getTime() > plannedTime.getTime() + 60000;
                const departsMinutesClass = isDelayed ? "delayed-time" : "";

                const rawPlatform = departure.location.properties?.platform;
                const cleanPlatform = rawPlatform
                  ? rawPlatform.replace(/[^0-9]/g, "")
                  : "–";

                return (
                  <div key={departure.id} className="train-departure-item">
                    <p className="service-time">{displayActualTime}</p>
                    <p className="service-info">
                      {departure.transportation.destination.name}
                    </p>
                    <p className="departs">
                      <span className={`time-until ${departsMinutesClass}`}>
                        {displayDepartsHrsMins}
                      </span>
                    </p>
                    <p className="plat-info">{cleanPlatform}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      >
        <div className="modal-station-selection-controls">
          <h2>Change Train Station</h2>
          <StationSearch onStationSelect={handleStationSelect} />
        </div>
      </SettingsModal>
    </div>
  );
}

export default TrainDepartures;
