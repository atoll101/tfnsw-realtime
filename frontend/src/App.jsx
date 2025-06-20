import React, { useState } from "react";
import "./App.css"; // Main App styling (for App layout, title, mode buttons, back button)

// Import mode-specific components
import TrainDepartures from "./components/TrainDepartures";
import BusDepartures from "./components/BusDepartures";
import LightRailFerryDepartures from "./components/LightRailFerryDepartures";

// Import icons for the main mode selection buttons (used directly in this file)
import iconBus from "./assets/icon-bus.svg";
import iconFerry from "./assets/icon-ferry.svg";
import iconLightrail from "./assets/icon-lightrail.svg";
import iconTrain from "./assets/icon-train.svg";
import iconCoach from "./assets/icon-bus.svg"; // Placeholder for Coach icon

function App() {
  const [selectedModeView, setSelectedModeView] = useState(null); // 'train', 'bus', 'lightrail', 'ferry', 'coach'

  const handleModeSelect = (mode) => {
    setSelectedModeView(mode);
  };

  const renderCurrentScreen = () => {
    switch (selectedModeView) {
      case "train":
        return <TrainDepartures />;
      case "bus":
        return <BusDepartures />;
      case "lightrail":
        return <LightRailFerryDepartures modeType="Light Rail" />;
      case "ferry":
        return <LightRailFerryDepartures modeType="Ferry" />;
      case "coach":
        return <LightRailFerryDepartures modeType="Coach" />;
      default:
        // Default view: Mode selection buttons with icons
        return (
          <div className="mode-selection-container">
            <h2>Select Your Mode of Transport</h2>
            <div className="mode-buttons">
              <button onClick={() => handleModeSelect("train")}>
                <img src={iconTrain} alt="Train Icon" />
                <span>Train</span>
              </button>
              <button onClick={() => handleModeSelect("bus")}>
                <img src={iconBus} alt="Bus Icon" />
                <span>Bus</span>
              </button>
              <button onClick={() => handleModeSelect("lightrail")}>
                <img src={iconLightrail} alt="Light Rail Icon" />
                <span>Light Rail</span>
              </button>
              <button onClick={() => handleModeSelect("ferry")}>
                <img src={iconFerry} alt="Ferry Icon" />
                <span>Ferry</span>
              </button>
              <button onClick={() => handleModeSelect("coach")}>
                <img src={iconCoach} alt="Coach Icon" />
                <span>Coach</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {renderCurrentScreen()}

      {/* Back button visible only if a mode view is active */}
      {selectedModeView && (
        <button
          className="back-button"
          onClick={() => setSelectedModeView(null)}
        >
          ← Back to Mode Selection
        </button>
      )}
    </div>
  );
}

export default App;
