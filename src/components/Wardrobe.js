//wardrobe.js
import React, { useState, useEffect } from 'react';
import './Wardrobe.css';

const WardrobeItem = ({ item, onRemove }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [enlargedImage, setEnlargedImage] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch('/get_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uuid: item.uuid }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        setImageSrc(`data:image/png;base64,${result.image}`);
      } catch (error) {
        console.error('Error fetching image:', error);
      }
    };

    fetchImage();
  }, [item.uuid]);

  const handleRemove = async () => {
    try {
      const response = await fetch('/remove_clothing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuid: item.uuid }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      onRemove(item.uuid);
    } catch (error) {
      console.error('Error removing clothing:', error);
    }
  };

  const handleImageClick = () => {
    setEnlargedImage(true);
  };

  const closeEnlargedImage = () => {
    setEnlargedImage(false);
  };

  return (
    <>
      <div className="wardrobe-item">
        <div 
          className={`wardrobe-item-image ${!imageSrc ? 'loading' : ''}`} 
          onClick={handleImageClick}
        >
          {imageSrc ? (
            <>
              <img src={imageSrc} alt="Clothing item" />
              <div className="spotlight"></div>
            </>
          ) : (
            <div className="loading-placeholder">Loading...</div>
          )}
        </div>
        
        <button className="wardrobe-item-remove" onClick={handleRemove}>
          <i className="fas fa-trash"></i>
        </button>
      </div>

      {/* Enlarged image view */}
      {enlargedImage && (
        <div className="enlarged-image-overlay">
          <div className="enlarged-image-container">
            <img src={imageSrc} alt="Enlarged clothing item" />
            <button className="close-enlarged-button" onClick={closeEnlargedImage}>×</button>
          </div>
        </div>
      )}
    </>
  );
};

const Wardrobe = () => {
  const [selectedCategory, setSelectedCategory] = useState('Tops');
  const [clothes, setClothes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  const categories = [
    { name: 'Hats', icon: '/images/hats.png', value: 'top' },
    { name: 'Tops', icon: '/images/outfit.png', value: 'upper_body' },
    { name: 'Bottoms', icon: '/images/bottoms.png', value: 'lower_body' },
    { name: 'Shoes', icon: '/images/shoes.png', value: 'bottom' },
  ];

  useEffect(() => {
    const fetchClothes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/get_available_clothes');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        const clothesByCategory = {
          Hats: [],
          Tops: [],
          Bottoms: [],
          Shoes: []
        };

        // Populate the clothesByCategory dictionary with metadata
        data.forEach(item => {
          // Add description and tags to the item
          switch (item.clothes_part) {
            case 'top':
              clothesByCategory.Hats.push(item);
              break;
            case 'upper_body':
              clothesByCategory.Tops.push(item);
              break;
            case 'lower_body':
              clothesByCategory.Bottoms.push(item);
              break;
            case 'bottom':
              clothesByCategory.Shoes.push(item);
              break;
            default:
              break;
          }
        });

        setClothes(clothesByCategory);
      } catch (error) {
        console.error('Error fetching clothes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClothes();
  }, []);

  const handleRemove = (uuid) => {
    setClothes((prevClothes) => {
      const updatedClothes = { ...prevClothes };
      Object.keys(updatedClothes).forEach(category => {
        updatedClothes[category] = updatedClothes[category].filter(item => item.uuid !== uuid);
      });
      return updatedClothes;
    });
  };

  return (
    <div className="wardrobe-container">
      {/* Decorative bubbles */}
      <div className="bubble bubble-1"></div>
      <div className="bubble bubble-2"></div>
      <div className="bubble bubble-3"></div>
      <div className="bubble bubble-4"></div>
      
      <div className="wardrobe-header">
        <h1>Your Wardrobe</h1>
      </div>
      
      <div className="wardrobe-content">
        <div className="wardrobe-sidebar">
          {categories.map((category) => (
            <button
              key={category.name}
              className={`category-button ${selectedCategory === category.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.name)}
            >
              <img src={category.icon} alt={category.name} className="sidebar-icon" />
              <span>{category.name}</span>
            </button>
          ))}
        </div>
        
        <div className="wardrobe-display">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your wardrobe...</p>
            </div>
          ) : clothes[selectedCategory]?.length > 0 ? (
            <div className="wardrobe-items">
              {clothes[selectedCategory].map((item) => (
                <WardrobeItem 
                  key={item.uuid} 
                  item={item} 
                  onRemove={handleRemove} 
                />
              ))}
            </div>
          ) : (
            <div className="empty-wardrobe">
              <h3>No items found</h3>
              <p>Upload some {selectedCategory.toLowerCase()} to see them here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wardrobe;