// services/fetchService.js
import authService from './auth';

/**
 * Enhanced fetch with authentication
 * @param {string} url - Fetch URL
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
const fetchWithAuth = async (url, options = {}) => {
  // Add authentication headers
  const enhancedOptions = authService.addAuthHeaders(options);
  
  try {
    const response = await fetch(url, enhancedOptions);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.warn('Authentication token expired or invalid');
      // Optional: Handle token refresh or logout
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export default fetchWithAuth;