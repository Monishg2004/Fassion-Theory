// utils/api.js
import authService from '../services/auth';

/**
 * Creates a fetch function that automatically includes authentication
 * @returns {Function} - Authenticated fetch function
 */
export const createAuthFetch = () => {
  /**
   * Authenticated fetch function
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise} - Fetch promise
   */
  return async (url, options = {}) => {
    // Get token
    const token = authService.getToken();
    
    // Create headers if not present
    const headers = options.headers || {};
    
    // Add authentication header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Create new options with headers
    const newOptions = {
      ...options,
      headers,
      // Include credentials for CORS
      credentials: 'include'
    };
    
    return fetch(url, newOptions);
  };
};

// Create authenticated fetch function
export const authFetch = createAuthFetch();

// Fetch and parse JSON with authentication
export const fetchJSON = async (url, options = {}) => {
  const response = await authFetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }
  
  return response.json();
};

// Submit form data with authentication
export const submitFormData = async (url, formData, method = 'POST') => {
  const options = {
    method,
    body: formData
  };
  
  return fetchJSON(url, options);
};