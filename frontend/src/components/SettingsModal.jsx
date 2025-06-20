import React from "react";
import "./SettingsModal.css"; // New CSS file for the modal

function SettingsModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {" "}
        {/* Prevent clicks inside from closing */}
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        {children} {/* This is where your station selection controls will go */}
      </div>
    </div>
  );
}

export default SettingsModal;
