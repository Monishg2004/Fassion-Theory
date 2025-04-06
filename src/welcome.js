// Welcome.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/outfit'); // Redirect to the desired page, e.g., outfit page
  };

  return (
    <div className="welcome-page">
      <h1>Welcome to Fashion Theory</h1>
      <button onClick={handleStart}>Start</button>
    </div>
  );
};

export default Welcome;
