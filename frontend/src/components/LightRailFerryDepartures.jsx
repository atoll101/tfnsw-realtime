import React, { useState, useEffect, useRef } from "react";
import { fetchDepartures, searchStops } from "../api";
import "./LightRailFerryDepartures.css"; // Import specific CSS
import SettingsModal from "./SettingsModal"; // Import the new modal component
import { FaCog } from "react-icons/fa"; // For settings icon, install react-icons

const PRODUCT_CLASSES = {
  1: "Train",
  2: "Metro",
  4: "Light Rail",
  5: "Bus",
  7: "Coach",
  9: "Ferry",
  11: "School Bus",
};
const LIGHT_RAIL_PRODUCT_CLASS = 4;
const FERRY_PRODUCT_CLASS = 9;
const COACH_PRODUCT_CLASS = 7;

function LightRailFerryDepartures({ modeType }) {
  // modeType will be 'Light Rail', 'Ferry', or 'Coach'
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);

  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // State for modal

  let currentProductClass;
  if (modeType === "Light Rail") {
    currentProductClass = LIGHT_RAIL_PRODUCT_CLASS;
  } else if (modeType === "Ferry") {
    currentProductClass = FERRY_PRODUCT_CLASS;
  } else if (modeType === "Coach") {
    currentProductClass = COACH_PRODUCT_CLASS;
  }

  const minSearchLength = 2;

  // Effect for searching stops (for Light Rail, Ferry, or Coach type)
  useEffect(() => {
    if (searchTerm.length < minSearchLength) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await searchStops(searchTerm, "stop");

        const filteredLocations = (data.locations || []).filter((loc) => {
          if (
            loc.type === "stop" &&
            loc.assignedStops &&
            loc.assignedStops.length > 0
          ) {
            return loc.assignedStops[0].productClasses.includes(
              currentProductClass
            );
          }
          return false;
        });
        setSearchResults(filteredLocations);
      } catch (err) {
        setError(`Error searching for ${modeType} stops.`);
        console.error(`Error searching ${modeType} stops:`, err);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [searchTerm, modeType, currentProductClass, minSearchLength]);

  // Effect for fetching and filtering departures
  useEffect(() => {
    if (!selectedStation) {
      setDepartures([]);
      return;
    }

    const getDepartures = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDepartures(selectedStation.id);
        const allDepartures = data.stopEvents || [];

        const filteredDepartures = allDepartures.filter(
          (dep) => dep.transportation?.product?.class === currentProductClass
        );
        setDepartures(filteredDepartures);
      } catch (err) {
        setError(`Failed to load ${modeType} departures for this stop.`);
        console.error(`Error fetching ${modeType} departures:`, err);
      } finally {
        setLoading(false);
      }
    };

    getDepartures();
    const intervalId = setInterval(getDepartures, 30000);
    return () => clearInterval(intervalId);
  }, [selectedStation, modeType, currentProductClass]);

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setSearchTerm(station.disassembledName || station.name);
    setSearchResults([]);
    searchInputRef.current?.blur();
    setIsSettingsModalOpen(false); // Close modal on selection
  };

  // Pre-calculate common conditions for cleaner JSX
  const showSearchingMessage = loading && searchTerm.length >= minSearchLength;
  const showNoResultsMessage =
    !loading &&
    searchTerm.length >= minSearchLength &&
    searchResults.length === 0;

  return (
    <div className="lrf-full-screen-view">
      {" "}
      {/* New wrapper for full screen */}
      {/* Settings icon */}
      <button
        className="settings-button"
        onClick={() => setIsSettingsModalOpen(true)}
      >
        <FaCog /> {/* Settings icon */}
      </button>
      {/* Content for the actual departure board */}
      <div className="lrf-departure-content">
        {" "}
        {/* Content div to hold messages and board */}
        {!loading && !selectedStation && (
          <p className="initial-message">
            Press the settings icon to select a {modeType} stop.
          </p>
        )}
        {loading && selectedStation && <p>Loading {modeType} departures...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && departures.length === 0 && !error && selectedStation && (
          <p>
            No {modeType} departures found for {selectedStation.name} at this
            time. Try refreshing.
          </p>
        )}
        {!loading && departures.length > 0 && selectedStation && (
          <div className="lrf-departure-board-container">
            {" "}
            {/* Specific board container for LR/Ferry/Coach */}
            <div className="lrf-board-header">
              {" "}
              {/* Specific header for LR/Ferry/Coach */}
              <span>Departures</span>
              <span className="time-now">
                Time now{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="lrf-board-column-headers">
              {" "}
              {/* Specific column headers for LR/Ferry/Coach */}
              <span className="service-to">Service to</span>
              <span className="departs">Departs</span>
              <span className="plat">Plat</span>
            </div>
            <div className="lrf-departure-list">
              {" "}
              {/* Specific departure list for LR/Ferry/Coach */}
              {departures.map((departure, index) => {
                const plannedTime = new Date(departure.departureTimePlanned);
                const estimatedTime = departure.departureTimeEstimated
                  ? new Date(departure.departureTimeEstimated)
                  : null;

                const now = new Date();
                const timeToDisplay = estimatedTime || plannedTime;
                const diffMinutes = Math.round(
                  (timeToDisplay.getTime() - now.getTime()) / (1000 * 60)
                );

                const displayActualTime = timeToDisplay.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const displayDepartsMin =
                  diffMinutes <= 0 ? "Due" : `${diffMinutes} min`;

                const isDelayed =
                  estimatedTime &&
                  estimatedTime.getTime() > plannedTime.getTime() + 60000;
                const departsMinutesClass = isDelayed ? "delayed-time" : "";

                const rawPlatform = departure.location.properties?.platform;
                const cleanPlatform = rawPlatform
                  ? rawPlatform.replace(/[^0-9]/g, "")
                  : "N/A"; // Remove all non-numeric characters

                return (
                  <div key={index} className="lrf-departure-item">
                    {" "}
                    {/* Specific item for LR/Ferry/Coach */}
                    <p className="service-info">
                      {departure.transportation.destination.name}
                    </p>
                    <p className="departs">
                      <span className="service-time">{displayActualTime}</span>
                      <span className={`time-until ${departsMinutesClass}`}>
                        {displayDepartsMin}
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
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      >
        <div className="modal-station-selection-controls">
          <h2>{modeType} Stop Settings</h2> {/* Modal header */}
          <label>
            Stop:
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Type ${modeType} stop name...`}
              ref={searchInputRef}
              onFocus={() =>
                searchTerm.length >= minSearchLength &&
                setSearchResults(searchResults)
              }
              onBlur={() => setTimeout(() => setSearchResults([]), 100)}
            />
          </label>
          {searchResults.length > 0 && (
            <ul className="lrf-search-results-dropdown">
              {searchResults.map((station) => (
                <li
                  key={station.id}
                  onClick={() => handleStationSelect(station)}
                >
                  {station.disassembledName || station.name}
                </li>
              ))}
            </ul>
          )}
          {showSearchingMessage && (
            <p className="lrf-loading-search">Searching...</p>
          )}
          {showNoResultsMessage && (
            <p className="lrf-no-search-results">
              No {modeType} stops found. Try a different name.
            </p>
          )}
        </div>
      </SettingsModal>
    </div>
  );
}

export default LightRailFerryDepartures;
