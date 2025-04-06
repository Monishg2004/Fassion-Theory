// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import reportWebVitals from './reportWebVitals';
// import { Auth0Provider } from '@auth0/auth0-react';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <Auth0Provider
//     domain="dev-4atl8ylw2vyly7py.us.auth0.com"
//     clientId="79elfYrGW4kOIdwAAj3Y9rxqfgo9lyRe"
//     authorizationParams={{
//       redirect_uri: window.location.origin,
//     }}
//     >
//       <App />
//     </Auth0Provider>
//   </React.StrictMode>
// );

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
// index.js - Updated with fetch interceptor
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import authService from './services/auth';

// Create a fetch interceptor to add authentication headers
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
  // Skip for certain requests
  if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
    return originalFetch(url, options);
  }
  
  // Add auth token to headers
  const token = authService.getToken();
  
  if (token) {
    // Create headers if not present
    options.headers = options.headers || {};
    
    // Add authorization header
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Call original fetch
  return originalFetch(url, options);
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);