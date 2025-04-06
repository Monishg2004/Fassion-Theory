// // TopBanner.js
// import React, { useState, useEffect } from 'react';
// import './TopBanner.css';
// import { useAuth0 } from '@auth0/auth0-react';

// function LogoutButton() {
//   const { logout } = useAuth0();

//   return (
//     <button 
//       className="logout-button" 
//       onClick={() => logout({ returnTo: window.location.origin })}
//     >
//       Log out
//     </button>
//   );
// }

// const TopBanner = ({ onMenuClick }) => {
//   const { user, isAuthenticated } = useAuth0();
//   const [animate, setAnimate] = useState(false);
  
//   useEffect(() => {
//     // Trigger animation when component mounts
//     setAnimate(true);
    
//     // Optional: Create a periodic animation effect
//     const interval = setInterval(() => {
//       setAnimate(false);
//       setTimeout(() => setAnimate(true), 100);
//     }, 10000); // Every 10 seconds
    
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className={`top-banner ${animate ? 'animate' : ''}`}>
//       <div className="left-section">
//         {isAuthenticated && (
//           <button className="menu-icon" onClick={onMenuClick}>
//             ☰
//           </button>
//         )}
//       </div>
      
//       <div className="center-section">
//         <div className="bubble"></div>
//         <div className="bubble"></div>
//         <div className="bubble"></div>
//         <h2>Fashion Theory</h2>
//       </div>
      
//       <div className="right-section">
//         {isAuthenticated && (
//           <>
//             <LogoutButton />
//             <div className="profile-icon">
//               <img src={user.picture} alt={user.name} />
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TopBanner;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import './TopBanner.css';

const TopBanner = ({ onMenuClick, isAuthenticated }) => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="top-banner">
      <div className="left-section">
        {isAuthenticated && (
          <button className="menu-icon" onClick={onMenuClick}>
            ☰
          </button>
        )}
      </div>
      
      <div className="center-section" onClick={() => navigate('/')}>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <h2>Fashion Theory</h2>
      </div>
      
      <div className="right-section">
        {isAuthenticated ? (
          <>
            <div className="user-info">
              <span className="username">{user?.username}</span>
              <span className="role-badge">{user?.role === 'trader' ? 'Trader' : 'Buyer'}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </>
        ) : (
          <button className="login-btn" onClick={() => navigate('/login')}>
            <i className="fas fa-sign-in-alt"></i>
            <span>Login</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBanner;