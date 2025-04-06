//modal.js
import React from 'react';
import './Modal.css';

const Modal = ({ isVisible, onClose, children }) => {
  // If isVisible is provided and is false, don't render anything
  if (isVisible === false) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✖</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;