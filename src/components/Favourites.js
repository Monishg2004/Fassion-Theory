//file: Favourites.js
import React, { useEffect, useState } from 'react';
import './Favourites.css';
import authService from '../services/auth';
const DisplayClothing = ({ uuid }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch the image data for each item
    const fetchImage = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/get_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uuid }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        setImageSrc(`data:image/png;base64,${result.image}`);
      } catch (error) {
        console.error('Error fetching image:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (uuid) {
      fetchImage();
    }
  }, [uuid]);

  return (
    <div className="display-clothing">
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <img src={imageSrc} alt={`Clothing item`} />
      )}
    </div>
  );
};

const Favourites = () => {
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
  //   const fetchOutfits = async () => {
  //     try {
  //       setIsLoading(true);
  //       const response = await fetch('/get_favourite_fits');
        
  //       if (!response.ok) {
  //         throw new Error('Network response was not ok - could not get saved outfits');
  //       }
        
  //       const data = await response.json();
        
  //       // Add formatted date to each outfit
  //       const outfitsWithDates = data.map(outfit => ({
  //         ...outfit,
  //         formattedDate: new Date(outfit.date_created || Date.now()).toLocaleDateString('en-US', {
  //           month: 'short',
  //           day: 'numeric'
  //         })
  //       }));
        
  //       setSavedOutfits(outfitsWithDates);
  //     } catch (error) {
  //       console.error('Error fetching saved outfits:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  // Favourites.js - Updated fetchOutfits function

const fetchOutfits = async () => {
  try {
    setIsLoading(true);
    
    // Get auth token
    const token = authService.getToken();
    
    const response = await fetch('/get_favourite_fits', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch favourite outfits');
    }
    
    const data = await response.json();
    
    // Add formatted date to each outfit
    const outfitsWithDates = data.map(outfit => ({
      ...outfit,
      formattedDate: new Date(outfit.date_created || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
    
    setSavedOutfits(outfitsWithDates);
  } catch (error) {
    console.error('Error fetching saved outfits:', error);
  } finally {
    setIsLoading(false);
  }
};

  fetchOutfits();
  }, []);

  const handleRemove = async (uuid) => {
    try {
      setRemovingId(uuid);
      
      // Animate before actual removal
      setTimeout(async () => {
        const response = await fetch('/remove_fav_fit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uuid }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        // Update state to remove the outfit
        setSavedOutfits((prevFits) => {
          return prevFits.filter(outfit => outfit.uuid !== uuid);
        });
        
        setRemovingId(null);
      }, 500);
    } catch (error) {
      console.error('Error removing clothing:', error);
      setRemovingId(null);
    }
  };

  // Get a display rating for an outfit (mock data for now)
  const getOutfitRating = (outfit) => {
    // This would ideally come from your backend
    // For now, generate a random rating between 70-100
    return Math.floor(Math.random() * 31) + 70;
  };

  if (isLoading) {
    return (
      <div className="favourites-container">
        <div className="empty-favourites">
          <div className="heart-icon">❤</div>
          <h3>Loading your favourite outfits...</h3>
        </div>
      </div>
    );
  }

  if (savedOutfits.length === 0) {
    return (
      <div className="favourites-container">
        <div className="empty-favourites">
          <div className="heart-icon">❤</div>
          <h3>No favourites yet</h3>
          <p>When you find outfits you love, save them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favourites-container">
      <div className="favourites-header">
        <h1>Your Favourite Outfits</h1>
      </div>
      
      <div className="favourites-grid">
        {savedOutfits.map((outfit) => (
          <div 
            className={`favourites-item ${removingId === outfit.uuid ? 'removing' : ''}`} 
            key={outfit.uuid}
          >
            <button 
              className="remove-button" 
              onClick={() => handleRemove(outfit.uuid)}
              aria-label="Remove outfit"
            >
              ✖
            </button>
            
            <div className="outfit-rating">
              {getOutfitRating(outfit)}% Match
            </div>
            
            <div className="clothing-items">
              {outfit.clothes.map((clothing) => (
                <DisplayClothing key={clothing.uuid} uuid={clothing.uuid} />
              ))}
            </div>
            
            <div className="date-added">
              Added: {outfit.formattedDate}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favourites;