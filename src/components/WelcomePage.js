// // components/WelcomePage.js
// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { useAuth0 } from '@auth0/auth0-react';

// const WelcomePage = () => {
//   const navigate = useNavigate();
//   const { loginWithRedirect } = useAuth0();

//   const handleHowItWorks = () => {
//     navigate('/how-it-works');
//   };

//   return (
//     <div className="welcome-container">
//       <div className="welcome-content">
//         <motion.div 
//           className="welcome-text"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//         >
//           <motion.h2 
//             className="welcome-subheading"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.3, duration: 0.8 }}
//           >
//             Fashion Theory
//           </motion.h2>
//           <motion.h1 
//             className="welcome-heading"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.6, duration: 0.8 }}
//           >
//             Smaller Wardrobe.<br />Bigger Life.
//           </motion.h1>
//           <motion.p 
//             className="welcome-description"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.9, duration: 0.8 }}
//           >
//             Build your closet by snapping pictures of your clothes and store your digital wardrobe, 
//             create looks and plan what to wear. Use planner to schedule what you are going to wear and when.
//           </motion.p>
//           <motion.div 
//             className="welcome-buttons"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 1.2, duration: 0.8 }}
//           >
//             <button className="app-btn primary" onClick={() => loginWithRedirect()}>
//               Get started now
//             </button>
//             <button className="app-btn secondary" onClick={handleHowItWorks}>
//               How it works
//             </button>
//           </motion.div>
//         </motion.div>
//         <motion.div 
//           className="welcome-image"
//           initial={{ opacity: 0, x: 50 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ delay: 0.6, duration: 0.8 }}
//         >
//          <img src="/closet.webp" alt="Fashion Theory App Preview" className="app-preview" />
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default WelcomePage;
import React from 'react';
import { Link } from 'react-router-dom';
import './WelcomePage.css';

const WelcomePage = () => {
  return (
    <div className="welcome-container">
      {/* Hero section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Fashion Theory</h1>
          <h2>Building an Equitable Fashion Future</h2>
          <p>
            Connect with local artisans, preserve cultural heritage, and build a sustainable 
            wardrobe with our innovative fashion platform.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="primary-button">
              Get Started
            </Link>
            <Link to="/how-it-works" className="secondary-button">
              How It Works
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/images/hero-image.jpg" alt="Fashion showcase" />
        </div>
      </div>
      
      {/* Features section */}
      <div className="features-section">
        <h2>Why Choose Fashion Theory?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <i className="fas fa-globe-americas"></i>
            <h3>Cultural Preservation</h3>
            <p>
              Support artisans who maintain traditional crafting techniques and celebrate
              cultural heritage through their work.
            </p>
          </div>
          
          <div className="feature-card">
            <i className="fas fa-leaf"></i>
            <h3>Sustainability Focus</h3>
            <p>
              Make informed purchases with our sustainability ratings that highlight
              eco-friendly materials and ethical production practices.
            </p>
          </div>
          
          <div className="feature-card">
            <i className="fas fa-tshirt"></i>
            <h3>Smart Styling</h3>
            <p>
              Get personalized wardrobe recommendations based on your style preferences,
              weather conditions, and upcoming events.
            </p>
          </div>
          
          <div className="feature-card">
            <i className="fas fa-hands-helping"></i>
            <h3>Direct Support</h3>
            <p>
              Connect directly with artisans around the world, ensuring fair wages and
              supporting sustainable livelihoods.
            </p>
          </div>
        </div>
      </div>
      
      {/* User types section */}
      <div className="user-types-section">
        <h2>Join Our Community</h2>
        <div className="user-types-grid">
          <div className="user-type-card buyer">
            <div className="user-type-icon">
              <i className="fas fa-shopping-bag"></i>
            </div>
            <h3>For Buyers</h3>
            <ul>
              <li>Discover unique, handcrafted clothing</li>
              <li>Support sustainable fashion practices</li>
              <li>Organize your wardrobe effortlessly</li>
              <li>Create stunning outfits with AI assistance</li>
            </ul>
            <Link to="/register" className="user-type-button">
              Join as Buyer
            </Link>
          </div>
          
          <div className="user-type-card trader">
            <div className="user-type-icon">
              <i className="fas fa-store"></i>
            </div>
            <h3>For Artisans & Traders</h3>
            <ul>
              <li>Showcase your handcrafted products</li>
              <li>Share your cultural heritage</li>
              <li>Reach a global customer base</li>
              <li>Build sustainable business opportunities</li>
            </ul>
            <Link to="/register" className="user-type-button">
              Join as Trader
            </Link>
          </div>
        </div>
      </div>
      
      {/* Testimonials section */}
      <div className="testimonials-section">
        <h2>What Our Community Says</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-quote">
              <i className="fas fa-quote-left"></i>
              <p>
                "Fashion Theory has transformed how I shop for clothes. I love knowing the story
                behind each piece and the cultural significance it carries."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">
                <img src="/images/avatar1.jpg" alt="Sarah J." />
              </div>
              <div className="author-info">
                <h4>Sarah J.</h4>
                <p>Buyer</p>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-quote">
              <i className="fas fa-quote-left"></i>
              <p>
                "As an artisan, I've finally found a platform that values my traditional
                crafting techniques and helps me connect with customers worldwide."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">
                <img src="/images/avatar2.jpg" alt="Miguel R." />
              </div>
              <div className="author-info">
                <h4>Miguel R.</h4>
                <p>Trader</p>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-quote">
              <i className="fas fa-quote-left"></i>
              <p>
                "The wardrobe management features are incredible! I can plan outfits, track what
                I wear, and make more sustainable purchasing decisions."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">
                <img src="/images/avatar3.jpg" alt="Aisha T." />
              </div>
              <div className="author-info">
                <h4>Aisha T.</h4>
                <p>Buyer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Call to action */}
      <div className="cta-section">
        <h2>Ready to transform your fashion experience?</h2>
        <p>
          Join Fashion Theory today and be part of the movement towards a more
          equitable and sustainable fashion future.
        </p>
        <div className="cta-buttons">
          <Link to="/login" className="secondary-button">
            Log In
          </Link>
          <Link to="/register" className="primary-button">
            Sign Up Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;