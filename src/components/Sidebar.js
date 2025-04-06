

// // // Updated Sidebar.js 
// // import React, { useState, useEffect } from 'react';
// // import { Link, useLocation } from 'react-router-dom';
// // import './Sidebar.css';

// // const Sidebar = ({ isVisible }) => {
// //   const location = useLocation();
// //   const [hasNewNotification, setHasNewNotification] = useState({
// //     outfit: false,
// //     favourites: true,
// //     wardrobe: false,
// //     camera: false,
// //     upload: false,
// //     myvault: true,
// //     weatherplan: true // New notification for weather & plan
// //   });
  
// //   // Animated entrance of menu items
// //   const [loaded, setLoaded] = useState(false);
  
// //   useEffect(() => {
// //     // Trigger animation after component mounts
// //     setLoaded(true);
    
// //     // Optional: Simulate new notifications coming in
// //     const timer = setTimeout(() => {
// //       setHasNewNotification(prev => ({...prev, outfit: true}));
// //     }, 3000);
    
// //     return () => clearTimeout(timer);
// //   }, []);

// //   // Helper function to determine active state
// //   const isActive = (path) => location.pathname === path;

// //   return (
// //     <div className={`sidebar ${isVisible ? 'visible' : ''}`}>
// //       <nav>
// //         <div className="section-title">Main Navigation</div>
// //         <ul className={loaded ? 'loaded' : ''}>
// //           <li style={{animationDelay: '0.1s'}}>
// //             <Link to="/outfit">
// //               <div className={`menu-item menu-item-outfit ${isActive('/outfit') ? 'active' : ''}`}>
// //                 <div className="icon-container">
// //                   <i className="fas fa-tshirt"></i>
// //                   <div className="icon-bubble"></div>
// //                   {hasNewNotification.outfit && <div className="notification-badge"></div>}
// //                 </div>
// //                 <span>Outfit</span>
// //               </div>
// //             </Link>
// //           </li>
          
// //           <li style={{animationDelay: '0.2s'}}>
// //             <Link to="/favourites">
// //               <div className={`menu-item menu-item-favourites ${isActive('/favourites') ? 'active' : ''}`}>
// //                 <div className="icon-container">
// //                   <i className="fas fa-heart"></i>
// //                   <div className="icon-bubble"></div>
// //                   {hasNewNotification.favourites && <div className="notification-badge"></div>}
// //                 </div>
// //                 <span>Favourites</span>
// //               </div>
// //             </Link>
// //           </li>
          
// //           <li style={{animationDelay: '0.3s'}}>
// //             <Link to="/wardrobe">
// //               <div className={`menu-item menu-item-wardrobe ${isActive('/wardrobe') ? 'active' : ''}`}>
// //                 <div className="icon-container">
// //                   <i className="fas fa-door-closed"></i>
// //                 </div>
// //                 <span>Wardrobe</span>
// //               </div>
// //             </Link>
// //           </li>
          
// //           <li style={{animationDelay: '0.4s'}}>
// //             <Link to="/camera">
// //               <div className={`menu-item menu-item-camera ${isActive('/camera') ? 'active' : ''}`}>
// //                 <div className="icon-container">
// //                   <i className="fas fa-camera"></i>
// //                 </div>
// //                 <span>Camera</span>
// //               </div>
// //             </Link>
// //           </li>
          
// //           <li style={{animationDelay: '0.5s'}}>
// //             <Link to="/upload">
// //               <div className={`menu-item menu-item-upload ${isActive('/upload') ? 'active' : ''}`}>
// //                 <div className="icon-container">
// //                   <i className="fas fa-cloud-upload-alt"></i>
// //                   <div className="icon-bubble"></div>
// //                 </div>
// //                 <span>Upload</span>
// //               </div>
// //             </Link>
// //           </li>
          
// //           {/* Add Weather & Plan menu item */}
// //           <li style={{animationDelay: '0.6s'}}>
// //             <Link to="/weatherplan">
// //               <div className={`menu-item menu-item-weatherplan ${isActive('/weatherplan') ? 'active' : ''}`}>
// //                 <div className="icon-container">
// //                   <i className="fas fa-cloud-sun"></i>
// //                   <div className="icon-bubble"></div>
// //                   {hasNewNotification.weatherplan && <div className="notification-badge"></div>}
// //                 </div>
// //                 <span>Weather & Plan</span>
// //                 <span className="new-tag">New</span>
// //               </div>
// //             </Link>
// //           </li>
// //         </ul>
        
// //         <div className="section-title">Personal</div>
// //         <ul>
// //           <li style={{animationDelay: '0.7s'}}>
// //             <Link to="/myvault">
// //               <div className={`menu-item menu-item-myvault ${isActive('/myvault') ? 'active' : ''}`}>
// //                 <div className="icon-container">
// //                   <i className="fas fa-lock"></i>
// //                   <div className="icon-bubble"></div>
// //                   {hasNewNotification.myvault && <div className="notification-badge"></div>}
// //                 </div>
// //                 <span>My Vault</span>
// //               </div>
// //             </Link>
// //           </li>
// //         </ul>
// //       </nav>
// //     </div>
// //   );
// // };

// // export default Sidebar;

// import React, { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import './Sidebar.css';

// const Sidebar = ({ isVisible, userRole }) => {
//   const location = useLocation();
//   const [hasNewNotification, setHasNewNotification] = useState({
//     outfit: false,
//     favourites: true,
//     wardrobe: false,
//     camera: false,
//     upload: false,
//     myvault: true,
//     weatherplan: true, // New notification for weather & plan
//     marketplace: true, // New notification for marketplace
//     dashboard: true // New notification for trader dashboard
//   });
  
//   // Animated entrance of menu items
//   const [loaded, setLoaded] = useState(false);
  
//   useEffect(() => {
//     // Trigger animation after component mounts
//     setLoaded(true);
    
//     // Optional: Simulate new notifications coming in
//     const timer = setTimeout(() => {
//       setHasNewNotification(prev => ({...prev, outfit: true}));
//     }, 3000);
    
//     return () => clearTimeout(timer);
//   }, []);

//   // Helper function to determine active state
//   const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  
//   // Determine which menu items to show based on user role
//   const isBuyer = userRole === 'buyer';
//   const isTrader = userRole === 'trader';

//   return (
//     <div className={`sidebar ${isVisible ? 'visible' : ''}`}>
//       <nav>
//         <div className="section-title">Main Navigation</div>
//         <ul className={loaded ? 'loaded' : ''}>
//           {/* Common item for all users */}
//           <li style={{animationDelay: '0.1s'}}>
//             <Link to="/marketplace">
//               <div className={`menu-item menu-item-marketplace ${isActive('/marketplace') ? 'active' : ''}`}>
//                 <div className="icon-container">
//                   <i className="fas fa-store"></i>
//                   <div className="icon-bubble"></div>
//                   {hasNewNotification.marketplace && <div className="notification-badge"></div>}
//                 </div>
//                 <span>Marketplace</span>
//               </div>
//             </Link>
//           </li>
          
//           {/* Trader-specific items */}
//           {isTrader && (
//             <li style={{animationDelay: '0.2s'}}>
//               <Link to="/trader/dashboard">
//                 <div className={`menu-item menu-item-dashboard ${isActive('/trader/dashboard') ? 'active' : ''}`}>
//                   <div className="icon-container">
//                     <i className="fas fa-chart-line"></i>
//                     <div className="icon-bubble"></div>
//                     {hasNewNotification.dashboard && <div className="notification-badge"></div>}
//                   </div>
//                   <span>Dashboard</span>
//                 </div>
//               </Link>
//             </li>
//           )}
          
//           {/* Buyer-specific items */}
//           {isBuyer && (
//             <>
//               <li style={{animationDelay: '0.2s'}}>
//                 <Link to="/outfit">
//                   <div className={`menu-item menu-item-outfit ${isActive('/outfit') ? 'active' : ''}`}>
//                     <div className="icon-container">
//                       <i className="fas fa-tshirt"></i>
//                       <div className="icon-bubble"></div>
//                       {hasNewNotification.outfit && <div className="notification-badge"></div>}
//                     </div>
//                     <span>Outfit</span>
//                   </div>
//                 </Link>
//               </li>
              
//               <li style={{animationDelay: '0.3s'}}>
//                 <Link to="/favourites">
//                   <div className={`menu-item menu-item-favourites ${isActive('/favourites') ? 'active' : ''}`}>
//                     <div className="icon-container">
//                       <i className="fas fa-heart"></i>
//                       <div className="icon-bubble"></div>
//                       {hasNewNotification.favourites && <div className="notification-badge"></div>}
//                     </div>
//                     <span>Favourites</span>
//                   </div>
//                 </Link>
//               </li>
              
//               <li style={{animationDelay: '0.4s'}}>
//                 <Link to="/wardrobe">
//                   <div className={`menu-item menu-item-wardrobe ${isActive('/wardrobe') ? 'active' : ''}`}>
//                     <div className="icon-container">
//                       <i className="fas fa-door-closed"></i>
//                     </div>
//                     <span>Wardrobe</span>
//                   </div>
//                 </Link>
//               </li>
              
//               <li style={{animationDelay: '0.7s'}}>
//                 <Link to="/weatherplan">
//                   <div className={`menu-item menu-item-weatherplan ${isActive('/weatherplan') ? 'active' : ''}`}>
//                     <div className="icon-container">
//                       <i className="fas fa-cloud-sun"></i>
//                       <div className="icon-bubble"></div>
//                       {hasNewNotification.weatherplan && <div className="notification-badge"></div>}
//                     </div>
//                     <span>Weather & Plan</span>
//                   </div>
//                 </Link>
//               </li>
//             </>
//           )}
          
//           {/* Common items for all users */}
//           <li style={{animationDelay: '0.5s'}}>
//             <Link to="/camera">
//               <div className={`menu-item menu-item-camera ${isActive('/camera') ? 'active' : ''}`}>
//                 <div className="icon-container">
//                   <i className="fas fa-camera"></i>
//                 </div>
//                 <span>Camera</span>
//               </div>
//             </Link>
//           </li>
          
//           <li style={{animationDelay: '0.6s'}}>
//             <Link to="/upload">
//               <div className={`menu-item menu-item-upload ${isActive('/upload') ? 'active' : ''}`}>
//                 <div className="icon-container">
//                   <i className="fas fa-cloud-upload-alt"></i>
//                   <div className="icon-bubble"></div>
//                 </div>
//                 <span>Upload</span>
//               </div>
//             </Link>
//           </li>
//         </ul>
        
//         {/* Buyer-specific personal section */}
//         {isBuyer && (
//           <>
//             <div className="section-title">Personal</div>
//             <ul>
//               <li style={{animationDelay: '0.8s'}}>
//                 <Link to="/myvault">
//                   <div className={`menu-item menu-item-myvault ${isActive('/myvault') ? 'active' : ''}`}>
//                     <div className="icon-container">
//                       <i className="fas fa-lock"></i>
//                       <div className="icon-bubble"></div>
//                       {hasNewNotification.myvault && <div className="notification-badge"></div>}
//                     </div>
//                     <span>My Vault</span>
//                   </div>
//                 </Link>
//               </li>
//             </ul>
//           </>
//         )}
        
//         {/* Create a new section for the trader */}
//         {isTrader && (
//           <>
//             <div className="section-title">Manage</div>
//             <ul>
//               <li style={{animationDelay: '0.8s'}}>
//                 <Link to="/trader/products/new">
//                   <div className={`menu-item menu-item-addproduct ${isActive('/trader/products/new') ? 'active' : ''}`}>
//                     <div className="icon-container">
//                       <i className="fas fa-plus-circle"></i>
//                     </div>
//                     <span>Add Product</span>
//                   </div>
//                 </Link>
//               </li>
//             </ul>
//           </>
//         )}
        
//         {/* Profile section for all users */}
//         <div className="section-title">Account</div>
//         <ul>
//           <li style={{animationDelay: '0.9s'}}>
//             <Link to="/profile">
//               <div className={`menu-item menu-item-profile ${isActive('/profile') ? 'active' : ''}`}>
//                 <div className="icon-container">
//                   <i className="fas fa-user-circle"></i>
//                 </div>
//                 <span>My Profile</span>
//               </div>
//             </Link>
//           </li>
//         </ul>
//       </nav>
//     </div>
//   );
// };

// export default Sidebar;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../services/auth';
import './Sidebar.css';

const Sidebar = ({ isVisible }) => {
  const location = useLocation();
  const [hasNewNotification, setHasNewNotification] = useState({
    outfit: false,
    favourites: true,
    wardrobe: false,
    camera: false,
    upload: false,
    myvault: true,
    weatherplan: true,
    marketplace: true,
    dashboard: true
  });
  
  // User role state
  const [userRole, setUserRole] = useState(null);
  
  // Animated entrance of menu items
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Get current user role
    const user = authService.getCurrentUser();
    setUserRole(user?.role || null);
    
    // Trigger animation after component mounts
    setLoaded(true);
    
    // Optional: Simulate new notifications coming in
    const timer = setTimeout(() => {
      setHasNewNotification(prev => ({...prev, outfit: true}));
    }, 3000);
    
    // Listen for auth changes
    const handleAuthChange = () => {
      const user = authService.getCurrentUser();
      setUserRole(user?.role || null);
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  // Helper function to determine active state
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  
  // Determine which menu items to show based on user role
  const isBuyer = userRole === 'buyer';
  const isTrader = userRole === 'trader';

  return (
    <div className={`sidebar ${isVisible ? 'visible' : ''}`}>
      <nav>
        <div className="section-title">Main Navigation</div>
        <ul className={loaded ? 'loaded' : ''}>
          {/* Common item for all users */}
          <li style={{animationDelay: '0.1s'}}>
            <Link to="/marketplace">
              <div className={`menu-item menu-item-marketplace ${isActive('/marketplace') ? 'active' : ''}`}>
                <div className="icon-container">
                  <i className="fas fa-store"></i>
                  <div className="icon-bubble"></div>
                  {hasNewNotification.marketplace && <div className="notification-badge"></div>}
                </div>
                <span>Marketplace</span>
              </div>
            </Link>
          </li>
          
          {/* Trader-specific items */}
          {isTrader && (
            <li style={{animationDelay: '0.2s'}}>
              <Link to="/trader/dashboard">
                <div className={`menu-item menu-item-dashboard ${isActive('/trader/dashboard') ? 'active' : ''}`}>
                  <div className="icon-container">
                    <i className="fas fa-chart-line"></i>
                    <div className="icon-bubble"></div>
                    {hasNewNotification.dashboard && <div className="notification-badge"></div>}
                  </div>
                  <span>Dashboard</span>
                </div>
              </Link>
            </li>
          )}
          
          {/* Buyer-specific items */}
          {isBuyer && (
            <>
              <li style={{animationDelay: '0.2s'}}>
                <Link to="/outfit">
                  <div className={`menu-item menu-item-outfit ${isActive('/outfit') ? 'active' : ''}`}>
                    <div className="icon-container">
                      <i className="fas fa-tshirt"></i>
                      <div className="icon-bubble"></div>
                      {hasNewNotification.outfit && <div className="notification-badge"></div>}
                    </div>
                    <span>Outfit</span>
                  </div>
                </Link>
              </li>
              
              <li style={{animationDelay: '0.3s'}}>
                <Link to="/favourites">
                  <div className={`menu-item menu-item-favourites ${isActive('/favourites') ? 'active' : ''}`}>
                    <div className="icon-container">
                      <i className="fas fa-heart"></i>
                      <div className="icon-bubble"></div>
                      {hasNewNotification.favourites && <div className="notification-badge"></div>}
                    </div>
                    <span>Favourites</span>
                  </div>
                </Link>
              </li>
              
              <li style={{animationDelay: '0.4s'}}>
                <Link to="/wardrobe">
                  <div className={`menu-item menu-item-wardrobe ${isActive('/wardrobe') ? 'active' : ''}`}>
                    <div className="icon-container">
                      <i className="fas fa-door-closed"></i>
                    </div>
                    <span>Wardrobe</span>
                  </div>
                </Link>
              </li>
              
              <li style={{animationDelay: '0.7s'}}>
                <Link to="/weatherplan">
                  <div className={`menu-item menu-item-weatherplan ${isActive('/weatherplan') ? 'active' : ''}`}>
                    <div className="icon-container">
                      <i className="fas fa-cloud-sun"></i>
                      <div className="icon-bubble"></div>
                      {hasNewNotification.weatherplan && <div className="notification-badge"></div>}
                    </div>
                    <span>Weather & Plan</span>
                  </div>
                </Link>
              </li>
            </>
          )}
          
          {/* Common items for all users */}
          <li style={{animationDelay: '0.5s'}}>
            <Link to="/camera">
              <div className={`menu-item menu-item-camera ${isActive('/camera') ? 'active' : ''}`}>
                <div className="icon-container">
                  <i className="fas fa-camera"></i>
                </div>
                <span>Camera</span>
              </div>
            </Link>
          </li>
          
          <li style={{animationDelay: '0.6s'}}>
            <Link to="/upload">
              <div className={`menu-item menu-item-upload ${isActive('/upload') ? 'active' : ''}`}>
                <div className="icon-container">
                  <i className="fas fa-cloud-upload-alt"></i>
                  <div className="icon-bubble"></div>
                </div>
                <span>Upload</span>
              </div>
            </Link>
          </li>
        </ul>
        
        {/* Buyer-specific personal section */}
        {isBuyer && (
          <>
            <div className="section-title">Personal</div>
            <ul>
              <li style={{animationDelay: '0.8s'}}>
                <Link to="/myvault">
                  <div className={`menu-item menu-item-myvault ${isActive('/myvault') ? 'active' : ''}`}>
                    <div className="icon-container">
                      <i className="fas fa-lock"></i>
                      <div className="icon-bubble"></div>
                      {hasNewNotification.myvault && <div className="notification-badge"></div>}
                    </div>
                    <span>My Vault</span>
                  </div>
                </Link>
              </li>
            </ul>
          </>
        )}
        
        {/* Account section for all users */}
        <div className="section-title">Account</div>
        <ul>
          <li style={{animationDelay: '0.9s'}}>
            <Link to="/profile">
              <div className={`menu-item menu-item-profile ${isActive('/profile') ? 'active' : ''}`}>
                <div className="icon-container">
                  <i className="fas fa-user-circle"></i>
                </div>
                <span>Profile</span>
              </div>
            </Link>
          </li>
          
          <li style={{animationDelay: '1s'}}>
            <div 
              className="menu-item menu-item-logout"
              onClick={() => {
                authService.logout();
                window.location.href = '/login';
              }}
            >
              <div className="icon-container">
                <i className="fas fa-sign-out-alt"></i>
              </div>
              <span>Logout</span>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;