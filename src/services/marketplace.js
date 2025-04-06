// services/marketplace.js
import authService from './auth';

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Service for marketplace functionality
 */
const marketplaceService = {
  /**
   * Get all products with optional filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} - Products list
   */
  getAllProducts: async (filters = {}) => {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      if (filters.query) queryParams.append('query', filters.query);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.minPrice) queryParams.append('min_price', filters.minPrice);
      if (filters.maxPrice) queryParams.append('max_price', filters.maxPrice);
      if (filters.sustainableOnly) queryParams.append('sustainable_only', filters.sustainableOnly);
      if (filters.handcraftedOnly) queryParams.append('handcrafted_only', filters.handcraftedOnly);
      
      const queryString = queryParams.toString();
      
      const response = await fetch(`${API_URL}/api/marketplace/products${queryString ? `?${queryString}` : ''}`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  /**
   * Get a single product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} - Product data
   */
  getProduct: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/products/${id}`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get trader's products (for seller dashboard)
   * @returns {Promise<Array>} - Trader's products
   */
  getTraderProducts: async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/trader/products`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trader products');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching trader products:', error);
      throw error;
    }
  },
  
  /**
   * Add a new product (trader only)
   * @param {FormData} formData - Product data including image
   * @returns {Promise<Object>} - Created product
   */
  addProduct: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/trader/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: formData, // FormData already has the correct Content-Type
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },
  
  /**
   * Update a product (trader only)
   * @param {string} id - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} - Updated product
   */
  updateProduct: async (id, productData) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/trader/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a product (trader only)
   * @param {string} id - Product ID
   * @returns {Promise<Object>} - Deletion result
   */
  deleteProduct: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/trader/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Add a review to a product (buyer only)
   * @param {string} productId - Product ID
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} - Created review
   */
  addReview: async (productId, reviewData) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify(reviewData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add review');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error adding review for product ${productId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new order (buyer only)
   * @param {Object} orderData - Order data including items and shipping address
   * @returns {Promise<Object>} - Created order
   */
  createOrder: async (orderData) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },
  
  /**
   * Get user's orders (buyer or trader)
   * @returns {Promise<Array>} - User's orders
   */
  getOrders: async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/orders`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },
  
  /**
   * Update order status (trader only)
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Updated order
   */
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating order ${orderId} status:`, error);
      throw error;
    }
  },
  
  /**
   * Add tracking number to order (trader only)
   * @param {string} orderId - Order ID
   * @param {string} trackingNumber - Tracking number
   * @returns {Promise<Object>} - Updated order
   */
  addTrackingNumber: async (orderId, trackingNumber) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/orders/${orderId}/tracking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({ tracking_number: trackingNumber }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add tracking number');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error adding tracking number to order ${orderId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get sustainability information for clothing items
   * @returns {Promise<Array>} - Sustainability information
   */
  getSustainabilityInfo: async () => {
    try {
      const response = await fetch(`${API_URL}/get_sustainability_info`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sustainability information');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching sustainability info:', error);
      throw error;
    }
  },
  
  /**
   * Get cultural heritage information for clothing items
   * @returns {Promise<Array>} - Cultural heritage information
   */
  getCulturalHeritage: async () => {
    try {
      const response = await fetch(`${API_URL}/get_cultural_heritage`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cultural heritage information');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching cultural heritage info:', error);
      throw error;
    }
  }
};

export default marketplaceService;