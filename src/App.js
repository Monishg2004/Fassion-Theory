

// // //  App.js 
// // import React, { useState } from 'react';
// // import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
// // import Sidebar from './components/Sidebar';
// // import Camera from './components/Camera';
// // import Wardrobe from './components/Wardrobe';
// // import Outfit from './components/Outfit';
// // import Favourites from './components/Favourites';
// // import Upload from './components/Upload';
// // import MyVault from './components/MyVault';
// // import WeatherPlan from './components/WeatherPlan'; // Import the new component
// // import TopBanner from './components/TopBanner';
// // import HowItWorks from './components/HowItWorks';
// // import WelcomePage from './components/WelcomePage';
// // import './App.css';
// // import { useAuth0 } from '@auth0/auth0-react';
// // import '@fortawesome/fontawesome-free/css/all.min.css';

// // const App = () => {
// //   const [isSidebarVisible, setSidebarVisible] = useState(false);
// //   const { isAuthenticated, isLoading } = useAuth0();
  
// //   // Add state for storing outfit selection mode (for MyVault)
// //   const [outfitSelectionMode, setOutfitSelectionMode] = useState({
// //     active: false,
// //     returnTo: null,
// //     callback: null
// //   });

// //   const toggleSidebar = () => {
// //     setSidebarVisible(!isSidebarVisible);
// //   };
  
// //   // Function to handle outfit selection for MyVault
// //   const handleOutfitSelection = (selectedOutfitUuids) => {
// //     if (outfitSelectionMode.callback) {
// //       outfitSelectionMode.callback(selectedOutfitUuids);
// //     }
// //     setOutfitSelectionMode({
// //       active: false,
// //       returnTo: null,
// //       callback: null
// //     });
// //   };

// //   // Function to initiate outfit selection mode
// //   const startOutfitSelectionMode = (callback, returnTo) => {
// //     setOutfitSelectionMode({
// //       active: true,
// //       returnTo,
// //       callback
// //     });
// //   };

// //   return (
// //     <Router>
// //       <div className="app">
// //         <TopBanner onMenuClick={isAuthenticated ? toggleSidebar : null} isAuthenticated={isAuthenticated} />
// //         {isAuthenticated && <Sidebar isVisible={isSidebarVisible} />}
// //         <div className={`main-content ${isSidebarVisible && isAuthenticated ? 'with-sidebar' : ''}`}>
// //           {isLoading ? (
// //             <div className="loading">
// //               <div className="spinner"></div>
// //             </div>
// //           ) : (
// //             <Routes>
// //               <Route path="/" element={!isAuthenticated ? <WelcomePage /> : <Outfit />} />
// //               <Route path="/how-it-works" element={<HowItWorks />} />
// //               <Route path="/favourites" element={isAuthenticated ? <Favourites /> : <WelcomePage />} />
// //               <Route path="/wardrobe" element={isAuthenticated ? <Wardrobe /> : <WelcomePage />} />
// //               <Route path="/camera" element={isAuthenticated ? <Camera /> : <WelcomePage />} />
// //               <Route path="/upload" element={isAuthenticated ? <Upload /> : <WelcomePage />} />
// //               <Route path="/myvault" element={isAuthenticated ? <MyVault /> : <WelcomePage />} />
// //               {/* Add new route for WeatherPlan */}
// //               <Route 
// //                 path="/weatherplan" 
// //                 element={isAuthenticated ? <WeatherPlan /> : <WelcomePage />} 
// //               />
// //               <Route 
// //                 path="/outfit" 
// //                 element={
// //                   isAuthenticated 
// //                     ? <Outfit 
// //                         selectionMode={outfitSelectionMode.active} 
// //                         onOutfitSelected={handleOutfitSelection} 
// //                       /> 
// //                     : <WelcomePage />
// //                 } 
// //               />
// //             </Routes>
// //           )}
// //         </div>
// //       </div>
// //     </Router>
// //   );
// // };

// // export default App;

// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// import Sidebar from './components/Sidebar';
// import Camera from './components/Camera';
// import Wardrobe from './components/Wardrobe';
// import Outfit from './components/Outfit';
// import Favourites from './components/Favourites';
// import Upload from './components/Upload';
// import MyVault from './components/MyVault';
// import WeatherPlan from './components/WeatherPlan';
// import TopBanner from './components/TopBanner';
// import HowItWorks from './components/HowItWorks';
// import WelcomePage from './components/WelcomePage';

// // New components
// import Login from './components/Auth/Login';
// import Register from './components/Auth/Register';
// import Marketplace from './components/Marketplace/Marketplace';
// import ProductDetail from './components/Marketplace/ProductDetail';
// import TraderDashboard from './components/Trader/TraderDashboard';
// import ProductForm from './components/Trader/ProductForm';

// // Services
// import authService from './services/auth';

// import './App.css';
// import '@fortawesome/fontawesome-free/css/all.min.css';

// const App = () => {
//   const [isSidebarVisible, setSidebarVisible] = useState(false);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [userRole, setUserRole] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
  
//   useEffect(() => {
//     // Check authentication status
//     const checkAuth = () => {
//       const authenticated = authService.isAuthenticated();
//       setIsAuthenticated(authenticated);
      
//       if (authenticated) {
//         const user = authService.getCurrentUser();
//         setUserRole(user?.role || null);
//       } else {
//         setUserRole(null);
//       }
      
//       setIsLoading(false);
//     };
    
//     checkAuth();
    
//     // Listen for auth changes
//     window.addEventListener('auth-change', checkAuth);
    
//     return () => {
//       window.removeEventListener('auth-change', checkAuth);
//     };
//   }, []);
  
//   // Add state for storing outfit selection mode (for MyVault)
//   const [outfitSelectionMode, setOutfitSelectionMode] = useState({
//     active: false,
//     returnTo: null,
//     callback: null
//   });

//   const toggleSidebar = () => {
//     setSidebarVisible(!isSidebarVisible);
//   };
  
//   // Function to handle outfit selection for MyVault
//   const handleOutfitSelection = (selectedOutfitUuids) => {
//     if (outfitSelectionMode.callback) {
//       outfitSelectionMode.callback(selectedOutfitUuids);
//     }
//     setOutfitSelectionMode({
//       active: false,
//       returnTo: null,
//       callback: null
//     });
//   };

//   // Function to initiate outfit selection mode
//   const startOutfitSelectionMode = (callback, returnTo) => {
//     setOutfitSelectionMode({
//       active: true,
//       returnTo,
//       callback
//     });
//   };
  
//   // Protected route component
//   const ProtectedRoute = ({ element, allowedRoles = [] }) => {
//     if (!isAuthenticated) {
//       return <Navigate to="/login" />;
//     }
    
//     if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
//       return <Navigate to="/" />;
//     }
    
//     return element;
//   };

//   return (
//     <Router>
//       <div className="app">
//         <TopBanner 
//           onMenuClick={isAuthenticated ? toggleSidebar : null} 
//           isAuthenticated={isAuthenticated}
//         />
        
//         {isAuthenticated && <Sidebar isVisible={isSidebarVisible} userRole={userRole} />}
        
//         <div className={`main-content ${isSidebarVisible && isAuthenticated ? 'with-sidebar' : ''}`}>
//           {isLoading ? (
//             <div className="loading">
//               <div className="spinner"></div>
//             </div>
//           ) : (
//             <Routes>
//               {/* Public routes */}
//               <Route path="/" element={!isAuthenticated ? <WelcomePage /> : 
//                 userRole === 'trader' ? <Navigate to="/trader/dashboard" /> : <Outfit />} 
//               />
//               <Route path="/how-it-works" element={<HowItWorks />} />
//               <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
//               <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
              
//               {/* Marketplace routes - accessible to both buyers and traders */}
//               <Route 
//                 path="/marketplace" 
//                 element={<ProtectedRoute element={<Marketplace />} />} 
//               />
//               <Route 
//                 path="/marketplace/product/:id" 
//                 element={<ProtectedRoute element={<ProductDetail />} />} 
//               />
              
//               {/* Buyer-specific routes */}
//               <Route 
//                 path="/favourites" 
//                 element={<ProtectedRoute element={<Favourites />} allowedRoles={['buyer']} />} 
//               />
//               <Route 
//                 path="/wardrobe" 
//                 element={<ProtectedRoute element={<Wardrobe />} allowedRoles={['buyer']} />} 
//               />
//               <Route 
//                 path="/outfit" 
//                 element={
//                   <ProtectedRoute 
//                     element={
//                       <Outfit 
//                         selectionMode={outfitSelectionMode.active} 
//                         onOutfitSelected={handleOutfitSelection} 
//                       />
//                     } 
//                     allowedRoles={['buyer']} 
//                   />
//                 } 
//               />
//               <Route 
//                 path="/myvault" 
//                 element={<ProtectedRoute element={<MyVault />} allowedRoles={['buyer']} />} 
//               />
//               <Route 
//                 path="/weatherplan" 
//                 element={<ProtectedRoute element={<WeatherPlan />} allowedRoles={['buyer']} />} 
//               />
              
//               {/* Trader-specific routes */}
//               <Route 
//                 path="/trader/dashboard" 
//                 element={<ProtectedRoute element={<TraderDashboard />} allowedRoles={['trader']} />} 
//               />
//               <Route 
//                 path="/trader/products/new" 
//                 element={<ProtectedRoute element={<ProductForm />} allowedRoles={['trader']} />} 
//               />
//               <Route 
//                 path="/trader/products/edit/:id" 
//                 element={<ProtectedRoute element={<ProductForm />} allowedRoles={['trader']} />} 
//               />
              
//               {/* Shared routes - but with role-based content */}
//               <Route 
//                 path="/camera" 
//                 element={<ProtectedRoute element={<Camera />} />} 
//               />
//               <Route 
//                 path="/upload" 
//                 element={<ProtectedRoute element={<Upload />} />} 
//               />
              
//               {/* Catch-all route */}
//               <Route path="*" element={<Navigate to="/" />} />
//             </Routes>
//           )}
//         </div>
//       </div>
//     </Router>
//   );
// };

// export default App;
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Camera from './components/Camera';
import Wardrobe from './components/Wardrobe';
import Outfit from './components/Outfit';
import Favourites from './components/Favourites';
import Upload from './components/Upload';
import MyVault from './components/MyVault';
import WeatherPlan from './components/WeatherPlan';
import TopBanner from './components/TopBanner';
import HowItWorks from './components/HowItWorks';
import WelcomePage from './components/WelcomePage';

// Auth components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Marketplace components
import Marketplace from './components/Marketplace/Marketplace';
import ProductDetail from './components/Marketplace/ProductDetail';

// Trader components
import TraderDashboard from './components/Trader/TraderDashboard';
import ProductForm from './components/Trader/ProductForm';

// Services
import authService from './services/auth';

import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const App = () => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const user = authService.getCurrentUser();
        setUserRole(user?.role || null);
      } else {
        setUserRole(null);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
    
    // Listen for auth changes
    window.addEventListener('auth-change', checkAuth);
    
    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);
  
  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };
  
  // Protected route component
  const ProtectedRoute = ({ element, allowedRoles = [] }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
    
    return element;
  };

  return (
    <Router>
      <div className="app">
        <TopBanner 
          onMenuClick={isAuthenticated ? toggleSidebar : null} 
          isAuthenticated={isAuthenticated}
          onLogout={() => authService.logout()}
        />
        
        {isAuthenticated && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
        
        <div className={`main-content ${isSidebarVisible && isAuthenticated ? 'with-sidebar' : ''}`}>
          {isLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <Routes>
              {/* Public routes */}
              <Route path="/" element={!isAuthenticated ? <WelcomePage /> : 
                userRole === 'trader' ? <Navigate to="/trader/dashboard" replace /> : <Outfit />} 
              />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
              <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
              
              {/* Marketplace routes - accessible to both roles */}
              <Route 
                path="/marketplace" 
                element={<ProtectedRoute element={<Marketplace />} />} 
              />
              <Route 
                path="/marketplace/product/:id" 
                element={<ProtectedRoute element={<ProductDetail />} />} 
              />
              
              {/* Buyer-specific routes */}
              <Route 
                path="/favourites" 
                element={<ProtectedRoute element={<Favourites />} allowedRoles={['buyer']} />} 
              />
              <Route 
                path="/wardrobe" 
                element={<ProtectedRoute element={<Wardrobe />} allowedRoles={['buyer']} />} 
              />
              <Route 
                path="/outfit" 
                element={<ProtectedRoute element={<Outfit />} allowedRoles={['buyer']} />} 
              />
              <Route 
                path="/myvault" 
                element={<ProtectedRoute element={<MyVault />} allowedRoles={['buyer']} />} 
              />
              <Route 
                path="/weatherplan" 
                element={<ProtectedRoute element={<WeatherPlan />} allowedRoles={['buyer']} />} 
              />
              
              {/* Trader-specific routes */}
              <Route 
                path="/trader/dashboard" 
                element={<ProtectedRoute element={<TraderDashboard />} allowedRoles={['trader']} />} 
              />
              <Route 
                path="/trader/products/new" 
                element={<ProtectedRoute element={<ProductForm />} allowedRoles={['trader']} />} 
              />
              <Route 
                path="/trader/products/edit/:id" 
                element={<ProtectedRoute element={<ProductForm />} allowedRoles={['trader']} />} 
              />
              
              {/* Shared routes */}
              <Route 
                path="/camera" 
                element={<ProtectedRoute element={<Camera />} />} 
              />
              <Route 
                path="/upload" 
                element={<ProtectedRoute element={<Upload />} />} 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </div>
    </Router>
  );
};

export default App;