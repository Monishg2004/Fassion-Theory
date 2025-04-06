import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product, onClick }) => {
  // Helper function to format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  // Helper function to get category label
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'top':
        return 'Hat/Headwear';
      case 'upper_body':
        return 'Top/Shirt';
      case 'lower_body':
        return 'Pants/Skirt';
      case 'bottom':
        return 'Footwear';
      case 'accessory':
        return 'Accessory';
      default:
        return category;
    }
  };
  
  // Helper function to get sustainability rating display
  const getSustainabilityStars = (rating) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-leaf"></i>);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-leaf-heart"></i>);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-leaf"></i>);
    }
    
    return stars;
  };

  return (
    <div className="product-card" onClick={onClick}>
      {/* Product image */}
      <div className="product-image">
        {product.image ? (
          <img src={`data:image/png;base64,${product.image}`} alt={product.name} />
        ) : (
          <div className="placeholder-image">
            <i className="fas fa-tshirt"></i>
          </div>
        )}
        
        {/* Sustainable badge */}
        {product.sustainability && product.sustainability.overall >= 4 && (
          <div className="sustainable-badge" title="Sustainable Product">
            <i className="fas fa-leaf"></i>
          </div>
        )}
        
        {/* Handcrafted badge */}
        {product.handcrafted && (
          <div className="handcrafted-badge" title="Handcrafted Item">
            <i className="fas fa-hands"></i>
          </div>
        )}
        
        {/* Low stock indicator */}
        {product.stock && product.stock <= 3 && (
          <div className="low-stock-badge">
            {product.stock === 1 ? 'Last item!' : `Only ${product.stock} left`}
          </div>
        )}
      </div>
      
      {/* Product info */}
      <div className="product-info">
        <div className="product-category">{getCategoryLabel(product.category)}</div>
        <h3 className="product-name">{product.name}</h3>
        
        {/* Cultural heritage tag if available */}
        {product.cultural_significance && (
          <div className="cultural-tag" title="Cultural Heritage Item">
            <i className="fas fa-globe-americas"></i>
            <span>{product.cultural_significance.origin}</span>
          </div>
        )}
        
        {/* Price and rating area */}
        <div className="product-footer">
          <div className="product-price">{formatPrice(product.price)}</div>
          
          {/* Sustainability rating */}
          {product.sustainability && (
            <div className="sustainability-rating" title={`Sustainability: ${product.sustainability.overall}/5`}>
              {getSustainabilityStars(product.sustainability.overall)}
            </div>
          )}
        </div>
        
        {/* View product button */}
        <button className="view-product-button">
          <i className="fas fa-eye"></i> View Details
        </button>
      </div>
    </div>
  );
};

export default ProductCard;