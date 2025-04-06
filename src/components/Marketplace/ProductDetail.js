import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import marketplaceService from '../../services/marketplace';
import authService from '../../services/auth';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [trader, setTrader] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  
  // Is the current user the trader who posted this product?
  const [isProductOwner, setIsProductOwner] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);
  
  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch product details
      const productData = await marketplaceService.getProduct(id);
      setProduct(productData);
      
      // Check if current user is the product owner
      const currentUser = authService.getCurrentUser();
      if (currentUser && productData.trader_id === currentUser.uuid) {
        setIsProductOwner(true);
      }
      
      // TODO: Fetch trader info if needed
      // const traderInfo = await authService.getUserInfo(productData.trader_id);
      // setTrader(traderInfo);
      
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Failed to load product details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  // Handle quantity change
  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };
  
  // Increase quantity
  const increaseQuantity = () => {
    if (quantity < (product?.stock || 1)) {
      setQuantity(quantity + 1);
    }
  };
  
  // Decrease quantity
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  // Handle review form changes
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({
      ...reviewForm,
      [name]: name === 'rating' ? parseInt(value) : value
    });
  };
  
  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        // Redirect to login page
        navigate('/login', { state: { from: `/marketplace/product/${id}` } });
        return;
      }
      
      // Check if user is a buyer
      if (!authService.isBuyer()) {
        setError('Only buyers can submit reviews');
        return;
      }
      
      // Submit review
      await marketplaceService.addReview(id, reviewForm);
      
      // Refresh product data to show new review
      await fetchProductDetails();
      
      // Close review form
      setIsReviewFormOpen(false);
      setReviewForm({ rating: 5, comment: '' });
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    }
  };
  
  // Handle order form changes
  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setOrderForm({
      ...orderForm,
      [name]: value
    });
  };
  
  // Handle order submission
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        // Redirect to login page
        navigate('/login', { state: { from: `/marketplace/product/${id}` } });
        return;
      }
      
      // Check if user is a buyer
      if (!authService.isBuyer()) {
        setError('Only buyers can purchase items');
        return;
      }
      
      // Prepare order data
      const orderData = {
        items: [
          {
            product_id: id,
            quantity: quantity
          }
        ],
        shipping_address: {
          name: orderForm.name,
          address: orderForm.address,
          city: orderForm.city,
          state: orderForm.state,
          zip_code: orderForm.zipCode,
          country: orderForm.country
        }
      };
      
      // Submit order
      const result = await marketplaceService.createOrder(orderData);
      
      // Navigate to order confirmation page
      navigate('/orders/confirmation', { state: { order: result } });
      
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place order. Please try again.');
    }
  };
  
  // Add to wardrobe action
  const addToWardrobe = async () => {
    try {
      // Submit order (simplified version)
      const orderData = {
        items: [
          {
            product_id: id,
            quantity: 1
          }
        ],
        shipping_address: {
          name: "Added to Wardrobe",
          address: "Direct Add",
          city: "N/A",
          state: "N/A",
          zip_code: "N/A",
          country: "N/A"
        }
      };
      
      await marketplaceService.createOrder(orderData);
      
      // Show success message
      // TODO: Show success message or notification
      
      // Navigate to wardrobe
      navigate('/wardrobe');
      
    } catch (error) {
      console.error('Error adding to wardrobe:', error);
      setError('Failed to add to wardrobe. Please try again.');
    }
  };
  
  // Render sustainability rating
  const renderSustainabilityRating = (rating) => {
    if (!rating) return null;
    
    const fullLeaves = Math.floor(rating);
    const hasHalfLeaf = rating % 1 >= 0.5;
    const emptyLeaves = 5 - fullLeaves - (hasHalfLeaf ? 1 : 0);
    
    return (
      <div className="sustainability-rating">
        {[...Array(fullLeaves)].map((_, i) => (
          <i key={`full-${i}`} className="fas fa-leaf"></i>
        ))}
        {hasHalfLeaf && <i className="fas fa-leaf-heart"></i>}
        {[...Array(emptyLeaves)].map((_, i) => (
          <i key={`empty-${i}`} className="far fa-leaf"></i>
        ))}
      </div>
    );
  };
  
  // Edit product (for traders)
  const handleEditProduct = () => {
    navigate(`/trader/products/edit/${id}`);
  };
  
  // Delete product (for traders)
  const handleDeleteProduct = async () => {
    // TODO: Add confirmation dialog
    
    try {
      await marketplaceService.deleteProduct(id);
      navigate('/trader/dashboard');
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product. Please try again.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="product-detail-error">
        <i className="fas fa-exclamation-circle"></i>
        <h3>Error Loading Product</h3>
        <p>{error}</p>
        <button onClick={fetchProductDetails}>Try Again</button>
        <button onClick={() => navigate('/marketplace')}>Back to Marketplace</button>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="product-detail-error">
        <i className="fas fa-search"></i>
        <h3>Product Not Found</h3>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/marketplace')}>Back to Marketplace</button>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-content">
        {/* Product image and gallery */}
        <div className="product-gallery">
          <div className="main-image">
            {product.image ? (
              <img 
                src={`data:image/png;base64,${product.image}`} 
                alt={product.name} 
              />
            ) : (
              <div className="placeholder-image">
                <i className="fas fa-tshirt"></i>
              </div>
            )}
            
            {/* Sustainability badge */}
            {product.sustainability && product.sustainability.overall >= 4 && (
              <div className="detail-badge sustainable-badge">
                <i className="fas fa-leaf"></i>
                <span>Sustainable</span>
              </div>
            )}
            
            {/* Handcrafted badge */}
            {product.handcrafted && (
              <div className="detail-badge handcrafted-badge">
                <i className="fas fa-hands"></i>
                <span>Handcrafted</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Product info and purchase options */}
        <div className="product-info">
          <div className="product-header">
            <h1 className="product-name">{product.name}</h1>
            
            {/* Back button */}
            <button 
              className="back-button"
              onClick={() => navigate('/marketplace')}
            >
              <i className="fas fa-arrow-left"></i> Back to Marketplace
            </button>
          </div>
          
          {/* Price and ratings */}
          <div className="price-rating">
            <div className="product-price">{formatPrice(product.price)}</div>
            
            {product.sustainability && (
              <div className="sustainability-score">
                <span>Sustainability:</span>
                {renderSustainabilityRating(product.sustainability.overall)}
              </div>
            )}
          </div>
          
          {/* Stock status */}
          <div className="stock-status">
            {product.stock > 0 ? (
              <span className={product.stock <= 3 ? 'low-stock' : 'in-stock'}>
                <i className="fas fa-check-circle"></i>
                {product.stock === 1 
                  ? 'Last item in stock!' 
                  : product.stock <= 3 
                    ? `Only ${product.stock} left in stock` 
                    : 'In Stock'}
              </span>
            ) : (
              <span className="out-of-stock">
                <i className="fas fa-times-circle"></i>
                Out of Stock
              </span>
            )}
          </div>
          
          {/* Quantity selector (for buyers) */}
          {!isProductOwner && product.stock > 0 && (
            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-control">
                <button 
                  className="quantity-button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <i className="fas fa-minus"></i>
                </button>
                
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={handleQuantityChange}
                />
                
                <button 
                  className="quantity-button"
                  onClick={increaseQuantity}
                  disabled={quantity >= product.stock}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="product-actions">
            {isProductOwner ? (
              // Trader actions
              <>
                <button 
                  className="edit-product-button"
                  onClick={handleEditProduct}
                >
                  <i className="fas fa-edit"></i> Edit Product
                </button>
                
                <button 
                  className="delete-product-button"
                  onClick={handleDeleteProduct}
                >
                  <i className="fas fa-trash"></i> Delete Product
                </button>
              </>
            ) : (
              // Buyer actions
              <>
                <button 
                  className="buy-now-button"
                  onClick={() => setIsOrderModalOpen(true)}
                  disabled={product.stock <= 0}
                >
                  <i className="fas fa-shopping-cart"></i> Buy Now
                </button>
                
                <button 
                  className="add-to-wardrobe-button"
                  onClick={addToWardrobe}
                  disabled={product.stock <= 0}
                >
                  <i className="fas fa-tshirt"></i> Add to Wardrobe
                </button>
              </>
            )}
          </div>
          
          {/* Cultural heritage info if available */}
          {product.cultural_significance && (
            <div className="cultural-significance-badge">
              <div className="badge-header">
                <i className="fas fa-globe-americas"></i>
                <h3>Cultural Heritage</h3>
              </div>
              <div className="badge-content">
                <p><strong>Origin:</strong> {product.cultural_significance.origin}</p>
                <p><strong>Tradition:</strong> {product.cultural_significance.tradition}</p>
                <p>{product.cultural_significance.story}</p>
              </div>
            </div>
          )}
          
          {/* Materials */}
          {product.materials && product.materials.length > 0 && (
            <div className="product-materials">
              <h3>Materials:</h3>
              <div className="materials-list">
                {product.materials.map((material, index) => (
                  <span key={index} className="material-tag">{material}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs for description, sustainability, and reviews */}
      <div className="product-tabs">
        <div className="tabs-header">
          <button 
            className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          
          {product.sustainability && (
            <button 
              className={`tab-button ${activeTab === 'sustainability' ? 'active' : ''}`}
              onClick={() => setActiveTab('sustainability')}
            >
              Sustainability
            </button>
          )}
          
          <button 
            className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
        </div>
        
        <div className="tabs-content">
          {/* Description tab */}
          {activeTab === 'description' && (
            <div className="tab-panel">
              <p className="product-description">{product.description}</p>
            </div>
          )}
          
          {/* Sustainability tab */}
          {activeTab === 'sustainability' && product.sustainability && (
            <div className="tab-panel">
              <div className="sustainability-details">
                <h3>Sustainability Information</h3>
                
                <div className="sustainability-metrics">
                  <div className="metric">
                    <div className="metric-label">Eco-Friendly Materials</div>
                    <div className="metric-rating">
                      {renderSustainabilityRating(product.sustainability.eco_friendly_materials)}
                    </div>
                  </div>
                  
                  <div className="metric">
                    <div className="metric-label">Ethical Labor</div>
                    <div className="metric-rating">
                      {renderSustainabilityRating(product.sustainability.ethical_labor)}
                    </div>
                  </div>
                  
                  <div className="metric">
                    <div className="metric-label">Carbon Footprint</div>
                    <div className="metric-rating">
                      {renderSustainabilityRating(product.sustainability.carbon_footprint)}
                    </div>
                  </div>
                  
                  <div className="metric">
                    <div className="metric-label">Waste Reduction</div>
                    <div className="metric-rating">
                      {renderSustainabilityRating(product.sustainability.waste_reduction)}
                    </div>
                  </div>
                </div>
                
                <div className="sustainability-impact">
                  <h4>Environmental Impact</h4>
                  <p>
                    By choosing sustainable products, you're supporting environmentally 
                    responsible practices and helping preserve traditional craftsmanship.
                  </p>
                  
                  <h4>Social Impact</h4>
                  <p>
                    Your purchase directly supports artisans and helps maintain traditional 
                    skills, providing economic opportunities in their communities.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div className="tab-panel">
              <div className="reviews-header">
                <h3>Customer Reviews</h3>
                
                {/* Add review button (for buyers) */}
                {!isProductOwner && !isReviewFormOpen && (
                  <button 
                    className="add-review-button"
                    onClick={() => setIsReviewFormOpen(true)}
                  >
                    <i className="fas fa-star"></i> Write a Review
                  </button>
                )}
              </div>
              
              {/* Review form */}
              {isReviewFormOpen && (
                <div className="review-form-container">
                  <form className="review-form" onSubmit={handleReviewSubmit}>
                    <h4>Write Your Review</h4>
                    
                    <div className="form-group">
                      <label>Rating:</label>
                      <div className="rating-selector">
                        {[5, 4, 3, 2, 1].map(star => (
                          <label key={star} className={reviewForm.rating >= star ? 'active' : ''}>
                            <input
                              type="radio"
                              name="rating"
                              value={star}
                              checked={reviewForm.rating === star}
                              onChange={handleReviewChange}
                            />
                            <i className="fas fa-star"></i>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="comment">Your Review:</label>
                      <textarea
                        id="comment"
                        name="comment"
                        value={reviewForm.comment}
                        onChange={handleReviewChange}
                        placeholder="Share your thoughts about this product..."
                        required
                      ></textarea>
                    </div>
                    
                    <div className="form-buttons">
                      <button 
                        type="button" 
                        className="cancel-button"
                        onClick={() => setIsReviewFormOpen(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="submit-button">
                        Submit Review
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Reviews list */}
              {product.reviews && product.reviews.length > 0 ? (
                <div className="reviews-list">
                  {product.reviews.map(review => (
                    <div key={review.uuid} className="review-item">
                      <div className="review-header">
                        <div className="review-stars">
                          {[...Array(5)].map((_, i) => (
                            <i 
                              key={i} 
                              className={`fas fa-star ${i < review.rating ? 'filled' : ''}`}
                            ></i>
                          ))}
                        </div>
                        <div className="review-date">
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="review-comment">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-reviews">
                  <i className="fas fa-star"></i>
                  <p>No reviews yet. Be the first to review this product!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Order modal */}
      {isOrderModalOpen && (
        <div className="modal-overlay">
          <div className="order-modal">
            <button 
              className="close-modal"
              onClick={() => setIsOrderModalOpen(false)}
            >
              &times;
            </button>
            
            <h2>Complete Your Purchase</h2>
            
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="order-product">
                <div className="product-thumbnail">
                  {product.image ? (
                    <img src={`data:image/png;base64,${product.image}`} alt={product.name} />
                  ) : (
                    <div className="placeholder-thumbnail">
                      <i className="fas fa-tshirt"></i>
                    </div>
                  )}
                </div>
                <div className="product-details">
                  <div className="product-name">{product.name}</div>
                  <div className="product-quantity">Quantity: {quantity}</div>
                </div>
                <div className="product-price">{formatPrice(product.price * quantity)}</div>
              </div>
              
              <div className="order-total">
                <div className="total-label">Total:</div>
                <div className="total-amount">{formatPrice(product.price * quantity)}</div>
              </div>
            </div>
            
            <form className="shipping-form" onSubmit={handleOrderSubmit}>
              <h3>Shipping Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={orderForm.name}
                  onChange={handleOrderChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Street Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={orderForm.address}
                  onChange={handleOrderChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={orderForm.city}
                    onChange={handleOrderChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="state">State/Province</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={orderForm.state}
                    onChange={handleOrderChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="zipCode">Zip/Postal Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={orderForm.zipCode}
                    onChange={handleOrderChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={orderForm.country}
                  onChange={handleOrderChange}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setIsOrderModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="place-order-button">
                  <i className="fas fa-check"></i> Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;