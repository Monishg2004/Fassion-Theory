// components/HowItWorks.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HowItWorks = () => {
  const navigate = useNavigate();

  const goToHome = () => {
    navigate('/');
  };

  const features = [
    {
      title: "Snap Clothing Photos",
      description: "Take photos of your clothes to build a digital inventory of everything you own.",
      icon: "📸"
    },
    {
      title: "Create Outfits",
      description: "Mix and match items to create perfect outfit combinations for any occasion.",
      icon: "👔"
    },
    {
      title: "Plan Your Week",
      description: "Schedule outfits ahead of time to eliminate daily decision fatigue.",
      icon: "📅"
    },
    {
      title: "Find Your Style",
      description: "Discover your personal style preferences and make smarter shopping decisions.",
      icon: "✨"
    }
  ];

  return (
    <div className="how-it-works-container">
      <motion.div 
        className="how-it-works-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1 
          className="hiw-heading"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          How Fashion Theory Works
        </motion.h1>
        
        <motion.p 
          className="hiw-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Fashion Theory helps you manage your wardrobe, create outfits, and plan your style more efficiently.
        </motion.p>
        
        <div className="feature-grid">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.2, duration: 0.6 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          className="app-screenshot"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
        >
          {/* <img src="/api/placeholder/800/400" alt="Fashion Theory App Interface" /> */}
        </motion.div>
        
        <motion.div 
          className="action-buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <button className="app-btn primary" onClick={goToHome}>
            Back to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HowItWorks;