import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import marketplaceService from '../../services/marketplace';
import authService from '../../services/auth';
import './ProductForm.css';

const ProductForm = () => {
  const { id } = useParams(); // Product ID if editing
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '1',
    materials: '',
    handcrafted: false,
    tags: '',
    // Sustainability fields
    eco_friendly_materials: '3',
    ethical_labor: '3',
    carbon_footprint: '3',
    waste_reduction: '3',
    // Cultural significance fields
    cultural_origin: '',
    cultural_tradition: '',
    cultural_story: '',
    preservation_impact: ''
  });
  
  // UI states
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');
  
  // References
  const fileInputRef = useRef(null);
  
  // Check if it's edit mode
  const isEditMode = id !== undefined;
  
  useEffect(() => {
    // Check if user is a trader
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    if (!authService.isTrader()) {
      navigate('/');
      return;
    }
    
    // If editing, fetch product data
    if (isEditMode) {
      fetchProductData();
    }
  }, [navigate, isEditMode, id]);
  
  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const product = await marketplaceService.getProduct(id);
      
      // Ensure this trader owns the product
      const currentUser = authService.getCurrentUser();
      if (product.trader_id !== currentUser.uuid) {
        navigate('/trader/dashboard');
        return;
      }
      
      // Set form data from product
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price.toString() || '',
        category: product.category || '',
        stock: product.stock.toString() || '1',
        materials: product.materials ? product.materials.join(', ') : '',
        handcrafted: product.handcrafted || false,
        tags: product.tags ? product.tags.join(', ') : '',
        // Sustainability fields
        eco_friendly_materials: product.sustainability ? product.sustainability.eco_friendly_materials.toString() : '3',
        ethical_labor: product.sustainability ? product.sustainability.ethical_labor.toString() : '3',
        carbon_footprint: product.sustainability ? product.sustainability.carbon_footprint.toString() : '3',
        waste_reduction: product.sustainability ? product.sustainability.waste_reduction.toString() : '3',
        // Cultural significance fields
        cultural_origin: product.cultural_significance ? product.cultural_significance.origin : '',
        cultural_tradition: product.cultural_significance ? product.cultural_significance.tradition : '',
        cultural_story: product.cultural_significance ? product.cultural_significance.story : '',
        preservation_impact: product.cultural_significance ? product.cultural_significance.preservation_impact : ''
      });
      
      // Set preview image
      if (product.image) {
        setPreviewImage(`data:image/png;base64,${product.image}`);
      }
      
    } catch (error) {
      console.error('Error fetching product data:', error);
      setError('Failed to load product data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);
      
      // Validate form
      if (!formData.name || !formData.description || !formData.price || !formData.category) {
        setError('Please fill in all required fields');
        setIsLoading(false);
        return;
      }
      
      if (!isEditMode && !selectedFile) {
        setError('Please select a product image');
        setIsLoading(false);
        return;
      }
      
      // Create FormData object
      const formDataObj = new FormData();
      
      // Add basic info
      formDataObj.append('name', formData.name);
      formDataObj.append('description', formData.description);
      formDataObj.append('price', formData.price);
      formDataObj.append('category', formData.category);
      formDataObj.append('stock', formData.stock);
      formDataObj.append('handcrafted', formData.handcrafted);
      
      // Add materials and tags
      if (formData.materials) {
        formDataObj.append('materials', formData.materials);
      }
      
      if (formData.tags) {
        formDataObj.append('tags', formData.tags);
      }
      
      // Add sustainability ratings
      formDataObj.append('eco_friendly_materials', formData.eco_friendly_materials);
      formDataObj.append('ethical_labor', formData.ethical_labor);
      formDataObj.append('carbon_footprint', formData.carbon_footprint);
      formDataObj.append('waste_reduction', formData.waste_reduction);
      
      // Add cultural significance
      if (formData.cultural_origin) {
        formDataObj.append('cultural_origin', formData.cultural_origin);
      }
      
      if (formData.cultural_tradition) {
        formDataObj.append('cultural_tradition', formData.cultural_tradition);
      }
      
      if (formData.cultural_story) {
        formDataObj.append('cultural_story', formData.cultural_story);
      }
      
      if (formData.preservation_impact) {
        formDataObj.append('preservation_impact', formData.preservation_impact);
      }
      
      // Add file if available
      if (selectedFile) {
        formDataObj.append('file', selectedFile);
      }
      
      let result;
      
      if (isEditMode) {
        // Update existing product
        if (selectedFile) {
          // If there's a new image, use the upload endpoint
          result = await marketplaceService.updateProductWithImage(id, formDataObj);
        } else {
          // Otherwise, use the update endpoint
          const updateData = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.category,
            stock: parseInt(formData.stock),
            handcrafted: formData.handcrafted,
            materials: formData.materials ? formData.materials.split(',').map(m => m.trim()) : [],
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
            sustainability: {
              eco_friendly_materials: parseInt(formData.eco_friendly_materials),
              ethical_labor: parseInt(formData.ethical_labor),
              carbon_footprint: parseInt(formData.carbon_footprint),
              waste_reduction: parseInt(formData.waste_reduction)
            },
            cultural_significance: formData.cultural_origin ? {
              origin: formData.cultural_origin,
              tradition: formData.cultural_tradition,
              story: formData.cultural_story,
              preservation_impact: formData.preservation_impact
            } : null
          };
          
          result = await marketplaceService.updateProduct(id, updateData);
        }
        
        setMessage('Product updated successfully!');
      } else {
        // Create new product
        result = await marketplaceService.addProduct(formDataObj);
        setMessage('Product created successfully!');
        
        // Clear form
        setFormData({
          name: '',
          description: '',
          price: '',
          category: '',
          stock: '1',
          materials: '',
          handcrafted: false,
          tags: '',
          eco_friendly_materials: '3',
          ethical_labor: '3',
          carbon_footprint: '3',
          waste_reduction: '3',
          cultural_origin: '',
          cultural_tradition: '',
          cultural_story: '',
          preservation_impact: ''
        });
        setSelectedFile(null);
        setPreviewImage(null);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/trader/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Failed to save product. Please try again.');
    } finally {
      setIsLoading(false);
      
      // Scroll to top to show message
      window.scrollTo(0, 0);
    }
  };
  
  return (
    <div className="product-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/trader/dashboard')}
        >
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
      </div>
      
      {/* Status messages */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      )}
      
      {message && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          <p>{message}</p>
        </div>
      )}
      
      {/* Form sections navigation */}
      <div className="form-sections">
        <button 
          className={`section-button ${activeSection === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveSection('basic')}
        >
          <i className="fas fa-info-circle"></i>
          <span>Basic Info</span>
        </button>
        
        <button 
          className={`section-button ${activeSection === 'sustainability' ? 'active' : ''}`}
          onClick={() => setActiveSection('sustainability')}
        >
          <i className="fas fa-leaf"></i>
          <span>Sustainability</span>
        </button>
        
        <button 
          className={`section-button ${activeSection === 'cultural' ? 'active' : ''}`}
          onClick={() => setActiveSection('cultural')}
        >
          <i className="fas fa-globe-americas"></i>
          <span>Cultural Heritage</span>
        </button>
      </div>
      
      <form className="product-form" onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <div className={`form-section ${activeSection === 'basic' ? 'active' : ''}`}>
          <h2>Basic Information</h2>
          
          {/* Product Image */}
          <div className="form-group image-upload">
            <label>Product Image</label>
            <div className="image-upload-container">
              {previewImage ? (
                <div className="image-preview">
                  <img src={previewImage} alt="Product preview" />
                  <button 
                    type="button"
                    className="change-image-button"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder" onClick={() => fileInputRef.current.click()}>
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>Click to upload image</span>
                </div>
              )}
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="file-input"
              />
            </div>
          </div>
          
          {/* Product Name */}
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
            />
          </div>
          
          {/* Product Description */}
          <div className="form-group">
          <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your product in detail"
              rows="4"
              required
            ></textarea>
          </div>
          
          {/* Price and Stock Row */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (USD) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="stock">Stock Quantity *</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="1"
                min="1"
                required
              />
            </div>
          </div>
          
          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="top">Hats & Headwear</option>
              <option value="upper_body">Tops & Shirts</option>
              <option value="lower_body">Pants & Skirts</option>
              <option value="bottom">Footwear</option>
              <option value="accessory">Accessories</option>
            </select>
          </div>
          
          {/* Materials */}
          <div className="form-group">
            <label htmlFor="materials">Materials (comma separated)</label>
            <input
              type="text"
              id="materials"
              name="materials"
              value={formData.materials}
              onChange={handleChange}
              placeholder="Cotton, Linen, Wool, etc."
            />
          </div>
          
          {/* Tags */}
          <div className="form-group">
            <label htmlFor="tags">Tags (comma separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="summer, traditional, handmade, etc."
            />
          </div>
          
          {/* Handcrafted Checkbox */}
          <div className="form-group checkbox-group">
            <label htmlFor="handcrafted" className="checkbox-label">
              <input
                type="checkbox"
                id="handcrafted"
                name="handcrafted"
                checked={formData.handcrafted}
                onChange={handleChange}
              />
              <span>This product is handcrafted</span>
            </label>
          </div>
          
          <div className="section-nav">
            <button 
              type="button" 
              className="next-button"
              onClick={() => setActiveSection('sustainability')}
            >
              Next: Sustainability <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
        
        {/* Sustainability Section */}
        <div className={`form-section ${activeSection === 'sustainability' ? 'active' : ''}`}>
          <h2>Sustainability Information</h2>
          <p className="section-description">
            Rate your product's sustainability in the following areas on a scale of 1-5,
            where 5 is the most sustainable.
          </p>
          
          {/* Eco-Friendly Materials */}
          <div className="form-group rating-group">
            <label htmlFor="eco_friendly_materials">Eco-Friendly Materials</label>
            <div className="rating-container">
              <input
                type="range"
                id="eco_friendly_materials"
                name="eco_friendly_materials"
                min="1"
                max="5"
                value={formData.eco_friendly_materials}
                onChange={handleChange}
              />
              <div className="rating-value">{formData.eco_friendly_materials}</div>
            </div>
            <div className="rating-scale">
              <span>Minimal</span>
              <span>Excellent</span>
            </div>
          </div>
          
          {/* Ethical Labor */}
          <div className="form-group rating-group">
            <label htmlFor="ethical_labor">Ethical Labor Practices</label>
            <div className="rating-container">
              <input
                type="range"
                id="ethical_labor"
                name="ethical_labor"
                min="1"
                max="5"
                value={formData.ethical_labor}
                onChange={handleChange}
              />
              <div className="rating-value">{formData.ethical_labor}</div>
            </div>
            <div className="rating-scale">
              <span>Minimal</span>
              <span>Excellent</span>
            </div>
          </div>
          
          {/* Carbon Footprint */}
          <div className="form-group rating-group">
            <label htmlFor="carbon_footprint">Carbon Footprint Reduction</label>
            <div className="rating-container">
              <input
                type="range"
                id="carbon_footprint"
                name="carbon_footprint"
                min="1"
                max="5"
                value={formData.carbon_footprint}
                onChange={handleChange}
              />
              <div className="rating-value">{formData.carbon_footprint}</div>
            </div>
            <div className="rating-scale">
              <span>Minimal</span>
              <span>Excellent</span>
            </div>
          </div>
          
          {/* Waste Reduction */}
          <div className="form-group rating-group">
            <label htmlFor="waste_reduction">Waste Reduction</label>
            <div className="rating-container">
              <input
                type="range"
                id="waste_reduction"
                name="waste_reduction"
                min="1"
                max="5"
                value={formData.waste_reduction}
                onChange={handleChange}
              />
              <div className="rating-value">{formData.waste_reduction}</div>
            </div>
            <div className="rating-scale">
              <span>Minimal</span>
              <span>Excellent</span>
            </div>
          </div>
          
          <div className="sustainability-preview">
            <h3>Overall Sustainability Score</h3>
            <div className="sustainability-score">
              {Math.round((
                parseInt(formData.eco_friendly_materials) +
                parseInt(formData.ethical_labor) +
                parseInt(formData.carbon_footprint) +
                parseInt(formData.waste_reduction)
              ) / 4)}
              <span>/5</span>
            </div>
            <div className="sustainability-visual">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={
                    i < Math.round((
                      parseInt(formData.eco_friendly_materials) +
                      parseInt(formData.ethical_labor) +
                      parseInt(formData.carbon_footprint) +
                      parseInt(formData.waste_reduction)
                    ) / 4)
                      ? 'fas fa-leaf filled'
                      : 'far fa-leaf'
                  }
                ></i>
              ))}
            </div>
          </div>
          
          <div className="section-nav">
            <button 
              type="button" 
              className="back-section-button"
              onClick={() => setActiveSection('basic')}
            >
              <i className="fas fa-arrow-left"></i> Back: Basic Info
            </button>
            
            <button 
              type="button" 
              className="next-button"
              onClick={() => setActiveSection('cultural')}
            >
              Next: Cultural Heritage <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
        
        {/* Cultural Heritage Section */}
        <div className={`form-section ${activeSection === 'cultural' ? 'active' : ''}`}>
          <h2>Cultural Heritage Information</h2>
          <p className="section-description">
            Share the cultural significance of your product to help buyers understand
            its heritage and importance.
          </p>
          
          {/* Cultural Origin */}
          <div className="form-group">
            <label htmlFor="cultural_origin">Cultural Origin</label>
            <input
              type="text"
              id="cultural_origin"
              name="cultural_origin"
              value={formData.cultural_origin}
              onChange={handleChange}
              placeholder="e.g., Guatemalan, Navajo, West African"
            />
          </div>
          
          {/* Cultural Tradition */}
          <div className="form-group">
            <label htmlFor="cultural_tradition">Cultural Tradition</label>
            <input
              type="text"
              id="cultural_tradition"
              name="cultural_tradition"
              value={formData.cultural_tradition}
              onChange={handleChange}
              placeholder="e.g., Weaving technique, Embroidery style"
            />
          </div>
          
          {/* Cultural Story */}
          <div className="form-group">
            <label htmlFor="cultural_story">Story Behind the Product</label>
            <textarea
              id="cultural_story"
              name="cultural_story"
              value={formData.cultural_story}
              onChange={handleChange}
              placeholder="Share the history, meaning, and story behind this product..."
              rows="4"
            ></textarea>
          </div>
          
          {/* Preservation Impact */}
          <div className="form-group">
            <label htmlFor="preservation_impact">Cultural Preservation Impact</label>
            <textarea
              id="preservation_impact"
              name="preservation_impact"
              value={formData.preservation_impact}
              onChange={handleChange}
              placeholder="How does purchasing this product help preserve cultural heritage?"
              rows="4"
            ></textarea>
          </div>
          
          <div className="section-nav">
            <button 
              type="button" 
              className="back-section-button"
              onClick={() => setActiveSection('sustainability')}
            >
              <i className="fas fa-arrow-left"></i> Back: Sustainability
            </button>
          </div>
          
          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  <span>{isEditMode ? 'Update Product' : 'Create Product'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;