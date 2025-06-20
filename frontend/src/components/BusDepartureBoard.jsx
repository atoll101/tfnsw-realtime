import React, { useState, useEffect } from "react";
import "./BusDepartureBoard.css";
import { IoMan } from "react-icons/io5";

// --- Helper component to display occupancy ---
const OccupancyDisplay = ({ occupancy }) => {
  let text = "n/a";
  let className = "occupancy-unknown";

  switch (occupancy) {
    case "EMPTY":
    case "MANY_SEATS_AVAILABLE":
      text = "Many seats available";
      className = "occupancy-low";
      break;
    case "FEW_SEATS_AVAILABLE":
      text = "Few seats available";
      className = "occupancy-medium";
      break;
    case "STANDING_ROOM_ONLY":
      text = "Standing room only";
      className = "occupancy-high";
      break;
    case "CRUSHED_STANDING_ROOM_ONLY":
      text = "Full";
      className = "occupancy-full";
      break;
    default:
      break;
  }

  if (className === "occupancy-unknown") {
    return <div className="col-capacity occupancy-unknown">–</div>;
  }

  return (
    <div className={`col-capacity ${className}`}>
      <IoMan className="occupancy-icon" />
      <span className="occupancy-text">{text}</span>
    </div>
  );
};

const BusDepartureBoard = ({ departures, selectedStop }) => {
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bus-board-container">
      <div className="bus-board-header">
        <span className="bus-header-stop-name">{selectedStop.name}</span>
        <div className="bus-header-stop-id-container">
          <span className="bus-header-stop-id-label">BUS STOP</span>
          <span className="bus-header-stop-id-number">{selectedStop.id}</span>
        </div>
      </div>

      {/* --- vvv COLUMNS REORDERED AND RENAMED vvv --- */}
      <div className="bus-board-columns">
        <span className="column-header-next-bus">Next bus</span>
        <span className="column-header-travelling-to">Travelling to</span>
        <span className="column-header-departs">Time now: {currentTime}</span>
        <span className="column-header-capacity">Capacity</span>
      </div>
      {/* --- ^^^ END OF UPDATED SECTION ^^^ --- */}

      <div className="bus-departure-list-container">
        {departures.map((departure) => {
          const plannedTime = new Date(departure.departureTimePlanned);
          const estimatedTime = departure.departureTimeEstimated
            ? new Date(departure.departureTimeEstimated)
            : null;
          const timeToDisplay = estimatedTime || plannedTime;
          const diffMinutes = Math.round(
            (timeToDisplay.getTime() - new Date().getTime()) / (1000 * 60)
          );

          let departsDisplay = "";
          if (diffMinutes <= 0) {
            departsDisplay = "Now";
          } else if (!estimatedTime || diffMinutes > 59) {
            departsDisplay = timeToDisplay.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          } else {
            departsDisplay = `${diffMinutes} min`;
          }

          const occupancy = departure.properties?.realtimeTrip?.occupancy;

          return (
            <div key={departure.id} className="bus-board-row">
              <p className="col-route">{departure.transportation.number}</p>
              <p className="col-dest">
                {departure.transportation.destination.name}
              </p>
              {/* --- vvv COLUMNS REORDERED vvv --- */}
              <p className="col-departs">{departsDisplay}</p>
              <OccupancyDisplay occupancy={occupancy} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusDepartureBoard;
