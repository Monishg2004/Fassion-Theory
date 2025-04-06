

// services/auth.js
const API_URL = '';  // Base URL for API requests (empty for same domain)

/**
 * Auth service for handling login, registration, and token management
 */
const authService = {
  /**
   * Register a new user (buyer or trader)
   * @param {Object} userData - User registration data
   * @returns {Promise} - Promise with registration result
   */
  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set cookie for token as well (backup method)
      document.cookie = `token=${data.token}; path=/; max-age=86400`;
      
      // Dispatch an event to notify authentication change
      window.dispatchEvent(new Event('auth-change'));
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  /**
   * Login an existing user
   * @param {string} usernameOrEmail - Username or email
   * @param {string} password - Password
   * @returns {Promise} - Promise with login result
   */
  login: async (usernameOrEmail, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: usernameOrEmail, 
          password: password 
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set cookie for token as well (backup method)
      document.cookie = `token=${data.token}; path=/; max-age=86400`;
      
      // Dispatch an event to notify authentication change
      window.dispatchEvent(new Event('auth-change'));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Logout the current user
   */
  logout: () => {
    // Remove auth data from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove cookie
    document.cookie = 'token=; path=/; max-age=0';
    
    // Call the logout API endpoint
    fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
      },
      credentials: 'include'
    }).catch(error => {
      console.error('Logout error:', error);
    });
    
    // Dispatch an event to notify authentication change
    window.dispatchEvent(new Event('auth-change'));
  },
  
  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated: () => {
    return !!authService.getToken();
  },
  
  /**
   * Get authentication token
   * @returns {string|null} - Authentication token
   */
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  /**
   * Get current user data
   * @returns {Object|null} - User data
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  },
  
  /**
   * Check if current user is a trader
   * @returns {boolean} - True if user is a trader
   */
  isTrader: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'trader';
  },
  
  /**
   * Check if current user is a buyer
   * @returns {boolean} - True if user is a buyer
   */
  isBuyer: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'buyer';
  },
  
  /**
   * Add auth headers to fetch options
   * @param {Object} options - Fetch options
   * @returns {Object} - Updated fetch options
   */
  addAuthHeaders: (options = {}) => {
    const token = authService.getToken();
    if (!token) return options;
    
    // Create headers if not present
    if (!options.headers) {
      options.headers = {};
    }
    
    // Add auth header
    options.headers['Authorization'] = `Bearer ${token}`;
    
    // Also add token as a direct header (backup method)
    options.headers['token'] = token;
    
    return options;
  }
};

export default authService;