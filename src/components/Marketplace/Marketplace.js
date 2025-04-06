import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import marketplaceService from '../../services/marketplace';
import authService from '../../services/auth';
import './Marketplace.css';

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Filter states
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sustainableOnly: false,
    handcraftedOnly: false
  });
  
  // UI states
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [sortOption, setSortOption] = useState('newest');

  useEffect(() => {
    // Fetch products on component mount
    fetchProducts();
  }, []);
  
  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, products, sortOption]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await marketplaceService.getAllProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };
  
  const resetFilters = () => {
    setFilters({
      query: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sustainableOnly: false,
      handcraftedOnly: false
    });
    setSortOption('newest');
  };
  
  const applyFilters = () => {
    // Start with all products
    let result = [...products];
    
    // Apply text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (filters.category) {
      result = result.filter(product => product.category === filters.category);
    }
    
    // Apply price range filters
    if (filters.minPrice) {
      result = result.filter(product => product.price >= parseFloat(filters.minPrice));
    }
    
    if (filters.maxPrice) {
      result = result.filter(product => product.price <= parseFloat(filters.maxPrice));
    }
    
    // Apply sustainability filter
    if (filters.sustainableOnly) {
      result = result.filter(product => 
        product.sustainability && product.sustainability.overall >= 4
      );
    }
    
    // Apply handcrafted filter
    if (filters.handcraftedOnly) {
      result = result.filter(product => product.handcrafted);
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'priceAsc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'sustainable':
        result.sort((a, b) => {
          const scoreA = a.sustainability ? a.sustainability.overall : 0;
          const scoreB = b.sustainability ? b.sustainability.overall : 0;
          return scoreB - scoreA;
        });
        break;
      default:
        break;
    }
    
    setFilteredProducts(result);
  };
  
  const handleViewProduct = (productId) => {
    navigate(`/marketplace/product/${productId}`);
  };

  return (
    <div className="marketplace-container">
      {/* Header section */}
      <div className="marketplace-header">
        <h1>Cultural Marketplace</h1>
        <p>Discover unique, ethically crafted items from artisans around the world</p>
      </div>
      
      {/* Main content section */}
      <div className="marketplace-content">
        {/* Filters sidebar */}
        <div className={`marketplace-filters ${isFilterExpanded ? 'expanded' : ''}`}>
          <div className="filters-header">
            <h3>Filters</h3>
            <button 
              className="toggle-filters-button"
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            >
              <i className={`fas fa-chevron-${isFilterExpanded ? 'left' : 'right'}`}></i>
            </button>
          </div>
          
          <div className="filters-body">
            {/* Search filter */}
            <div className="filter-group">
              <label>Search</label>
              <div className="search-input">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  name="query"
                  value={filters.query}
                  onChange={handleFilterChange}
                  placeholder="Search products..."
                />
              </div>
            </div>
            
            {/* Category filter */}
            <div className="filter-group">
              <label>Category</label>
              <select 
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                <option value="top">Hats & Headwear</option>
                <option value="upper_body">Tops & Shirts</option>
                <option value="lower_body">Pants & Skirts</option>
                <option value="bottom">Footwear</option>
                <option value="accessory">Accessories</option>
              </select>
            </div>
            
            {/* Price range filter */}
            <div className="filter-group">
              <label>Price Range</label>
              <div className="price-range">
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  min="0"
                />
                <span>to</span>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Max"
                  min="0"
                />
              </div>
            </div>
            
            {/* Sustainable filter */}
            <div className="filter-group checkbox-filter">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="sustainableOnly"
                  checked={filters.sustainableOnly}
                  onChange={handleFilterChange}
                />
                <span>Sustainable Only</span>
                <div className="eco-badge">
                  <i className="fas fa-leaf"></i>
                </div>
              </label>
            </div>
            
            {/* Handcrafted filter */}
            <div className="filter-group checkbox-filter">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="handcraftedOnly"
                  checked={filters.handcraftedOnly}
                  onChange={handleFilterChange}
                />
                <span>Handcrafted Only</span>
                <div className="handmade-badge">
                  <i className="fas fa-hands"></i>
                </div>
              </label>
            </div>
            
            {/* Reset filters button */}
            <button className="reset-filters-button" onClick={resetFilters}>
              <i className="fas fa-undo"></i> Reset Filters
            </button>
          </div>
        </div>
        
        {/* Products grid */}
        <div className="marketplace-products">
          {/* Sort and results info */}
          <div className="products-header">
            <div className="results-count">
              {isLoading ? 'Loading products...' : `${filteredProducts.length} products found`}
            </div>
            
            <div className="sort-options">
              <label>Sort by:</label>
              <select value={sortOption} onChange={handleSortChange}>
                <option value="newest">Newest</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="sustainable">Sustainability</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
              <button onClick={fetchProducts}>Try Again</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.uuid} 
                  product={product}
                  onClick={() => handleViewProduct(product.uuid)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile filter toggle button */}
      <button 
        className="mobile-filter-toggle"
        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
      >
        <i className="fas fa-filter"></i>
        <span>Filters</span>
      </button>
    </div>
  );
};

export default Marketplace;