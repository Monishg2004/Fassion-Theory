// Filename: Outfit.js
import React, { useState, useEffect } from 'react';
import ReactSpeedometer from "react-d3-speedometer";
import './Outfit.css';

const Outfit = () => {
  const [outfitIndex, setOutfitIndex] = useState({
    Hats: 0,
    Tops: 0,
    Bottoms: 0,
    Shoes: 0,
  });
  const [clothes, setClothes] = useState({
    Hats: [{ image: '/images/default-image.png' }],
    Tops: [{ image: '/images/default-image.png' }],
    Bottoms: [{ image: '/images/default-image.png' }],
    Shoes: [{ image: '/images/default-image.png' }],
  });
  const [fitCheckValue, setFitCheckValue] = useState(0);
  const [hasRandomized, setHasRandomized] = useState(false);
  const [showFavoriteButton, setShowFavoriteButton] = useState(true);

  useEffect(() => {
    const fetchClothes = async () => {
      try {
        const response = await fetch('/get_available_clothes');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        const clothesByCategory = {
          Hats: [{ image: '/images/default-image.png' }],
          Tops: [{ image: '/images/default-image.png' }],
          Bottoms: [{ image: '/images/default-image.png' }],
          Shoes: [{ image: '/images/default-image.png' }],
        };

        data.forEach(item => {
          const clothingItem = { ...item, image: '/images/default-image.png' };
          switch (item.clothes_part) {
            case 'top':
              clothesByCategory.Hats.push(clothingItem);
              break;
            case 'upper_body':
              clothesByCategory.Tops.push(clothingItem);
              break;
            case 'lower_body':
              clothesByCategory.Bottoms.push(clothingItem);
              break;
            case 'bottom':
              clothesByCategory.Shoes.push(clothingItem);
              break;
            default:
              break;
          }
        });

        setClothes(clothesByCategory);
      } catch (error) {
        console.error('Error fetching clothes:', error);
      }
    };

    fetchClothes();
  }, []);

  useEffect(() => {
    if (!hasRandomized && (clothes.Hats.length > 1 || clothes.Tops.length > 1 || clothes.Bottoms.length > 1 || clothes.Shoes.length > 1)) {
      randomizeOutfit(clothes);
      setHasRandomized(true);
    }
  }, [clothes, hasRandomized]);

  const fetchImage = async (uuid, category, newIndex) => {
    if (!uuid) return;

    try {
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
      const imageUrl = `data:image/png;base64,${result.image}`;

      setClothes((prevClothes) => ({
        ...prevClothes,
        [category]: prevClothes[category].map((item, idx) => 
          idx === newIndex ? { ...item, image: imageUrl } : item
        ),
      }));
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  const fetchRating = async (currentUuids) => {
    const filteredUuids = Object.values(currentUuids).filter(uuid => uuid);

    if (filteredUuids.length > 0) {
      try {
        const response = await fetch('/get_rating', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uuids: filteredUuids }),
        });
        const result = await response.json();
        console.log(`Rating: ${result.rating}%`);
        setFitCheckValue(result.rating / 100);
      } catch (error) {
        console.error('Error fetching rating:', error);
      }
    }
  };

  const handleArrowClick = async (category, direction) => {
    const currentIndex = outfitIndex[category];
    const items = clothes[category];
    const newIndex = (currentIndex + direction + items.length) % items.length;

    const newOutfitIndex = { ...outfitIndex, [category]: newIndex };

    setOutfitIndex(newOutfitIndex);

    const currentUuids = {
      Hats: clothes.Hats[newOutfitIndex.Hats]?.uuid,
      Tops: clothes.Tops[newOutfitIndex.Tops]?.uuid,
      Bottoms: clothes.Bottoms[newOutfitIndex.Bottoms]?.uuid,
      Shoes: clothes.Shoes[newOutfitIndex.Shoes]?.uuid,
    };

    const currentItem = items[newIndex];

    if (currentItem && currentItem.image === '/images/default-image.png') {
      await fetchImage(currentItem.uuid, category, newIndex);
    }

    await fetchRating(currentUuids);
    setShowFavoriteButton(true);
  };

  const randomizeOutfit = async (clothesByCategory = clothes) => {
    if (!clothesByCategory || !Object.keys(clothesByCategory).length) return;

    const newOutfitIndex = {
      Hats: clothesByCategory.Hats.length > 1 ? Math.floor(Math.random() * clothesByCategory.Hats.length) : 0,
      Tops: clothesByCategory.Tops.length > 1 ? Math.floor(Math.random() * (clothesByCategory.Tops.length - 1)) + 1 : 0,
      Bottoms: clothesByCategory.Bottoms.length > 1 ? Math.floor(Math.random() * (clothesByCategory.Bottoms.length - 1)) + 1 : 0,
      Shoes: clothesByCategory.Shoes.length > 1 ? Math.floor(Math.random() * (clothesByCategory.Shoes.length - 1)) + 1 : 0,
    };

    setOutfitIndex(newOutfitIndex);

    Object.keys(newOutfitIndex).forEach(async (category) => {
      const newIndex = newOutfitIndex[category];
      const currentItem = clothesByCategory[category][newIndex];

      if (currentItem && currentItem.image === '/images/default-image.png') {
        await fetchImage(currentItem.uuid, category, newIndex);
      }
    });

    const currentUuids = {
      Hats: clothesByCategory.Hats[newOutfitIndex.Hats]?.uuid,
      Tops: clothesByCategory.Tops[newOutfitIndex.Tops]?.uuid,
      Bottoms: clothesByCategory.Bottoms[newOutfitIndex.Bottoms]?.uuid,
      Shoes: clothesByCategory.Shoes[newOutfitIndex.Shoes]?.uuid,
    };

    await fetchRating(currentUuids);
    setShowFavoriteButton(true);
  };

  const generateOutfitOfTheDay = async () => {
    try {
      const response = await fetch('/get_optimal_fit', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      const { uuids } = result;

      const newOutfitIndex = {
        Hats: 0,
        Tops: 0,
        Bottoms: 0,
        Shoes: 0,
      };

      // Create a map of UUIDs to their categories and indices
      const uuidMap = {};
      for (let category in clothes) {
        for (let i = 0; i < clothes[category].length; i++) {
          uuidMap[clothes[category][i].uuid] = { category, index: i };
        }
      }

      // Set the correct indices in newOutfitIndex based on the UUIDs returned from the backend
      uuids.forEach(uuid => {
        if (uuidMap[uuid]) {
          const { category, index } = uuidMap[uuid];
          newOutfitIndex[category] = index;
        }
      });

      // Update the state with the new indices
      setOutfitIndex(newOutfitIndex);

      // Fetch images for the new items and update the state
      await Promise.all(uuids.map(async (uuid) => {
        const { category, index } = uuidMap[uuid];
        await fetchImage(uuid, category, index);
      }));

      await fetchRating(uuids);
    } catch (error) {
      console.error('Error generating outfit of the day:', error);
    }
  };

  const favouriteOutfit = async () => {
    const currentUuids = {
      Hats: clothes.Hats[outfitIndex.Hats]?.uuid,
      Tops: clothes.Tops[outfitIndex.Tops]?.uuid,
      Bottoms: clothes.Bottoms[outfitIndex.Bottoms]?.uuid,
      Shoes: clothes.Shoes[outfitIndex.Shoes]?.uuid,
    };

    const filteredUuids = Object.values(currentUuids).filter(uuid => uuid);

    if (filteredUuids.length > 0) {
      try {
        const response = await fetch('/save_fav_fit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uuids: filteredUuids }),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.text();
        console.log('Favourite outfit saved:', result);
        setShowFavoriteButton(false);
      } catch (error) {
        console.error('Error saving favourite outfit:', error);
      }
    }
  };

  const resetOutfit = () => {
    setOutfitIndex({
      Hats: 0,
      Tops: 0,
      Bottoms: 0,
      Shoes: 0,
    });
    setFitCheckValue(0);
    setShowFavoriteButton(true);
  };
  
  // Get appropriate fit check text based on value
  const getFitCheckText = () => {
    if (fitCheckValue > 0.8) {
      return "Fantastic Fashion!";
    } else if (fitCheckValue > 0.6) {
      return "Superb Style!";
    } else if (fitCheckValue > 0.4) {
      return "Looking Good!";
    } else if (fitCheckValue > 0.2) {
      return "Nice Combo";
    } else {
      return "Maybe try another outfit";
    }
  };

  return (
    <div className="outfit-container">
      <div className="outfit-pane">
        <div className="outfit-carousel">
          {['Hats', 'Tops', 'Bottoms', 'Shoes'].map((category) => {
            const items = clothes[category] || [];
            const currentIndex = outfitIndex[category];

            const sizeClass = {
              Hats: 'hat-size',
              Tops: 'top-size',
              Bottoms: 'bottom-size',
              Shoes: 'shoe-size'
            }[category];

            return (
              <div className={`carousel-item ${sizeClass}`} key={category}>
                <button className="arrow-btn left-arrow" onClick={() => handleArrowClick(category, -1)}>
                  <img src="/images/left-arrow.png" alt="Previous" />
                </button>
                <img 
                  src={items[currentIndex]?.image || '/images/default-image.png'} 
                  alt={`${category} ${currentIndex + 1}`}
                  className="clothing-image"
                />
                <button className="arrow-btn right-arrow" onClick={() => handleArrowClick(category, 1)}>
                  <img src="/images/right-arrow.png" alt="Next" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="controls-pane">
        <div className="fit-check">
          <ReactSpeedometer 
            minValue={0.0} 
            maxValue={1.0} 
            value={fitCheckValue} 
            segments={5} 
            paddingVertical={20} 
            width={350} 
            segmentColors={["#FEC0C0", "#FEECA0", "#E0BBE4", "#C4E0B2", "#9B5DE5"]} 
            currentValueText='' 
            needleHeightRatio={0.7}
            ringWidth={30}
            needleTransitionDuration={2000}
            needleTransition="easeElastic"
            textColor={"#555"}
          />
          <div className="fit-check-text-container">
            <p className="fit-check-text">Fit Check: {getFitCheckText()}</p>
          </div>
        </div>
        
        <div className="outfit-controls">
          <button onClick={() => randomizeOutfit(clothes)} data-label="Randomize">
            <img src="/images/randomize.png" alt="Randomize" className="outfit-icon" />
          </button>
          <button onClick={generateOutfitOfTheDay} data-label="Outfit of the Day">
            <img src="/images/outfit-of-the-day.png" alt="Outfit of the Day" className="outfit-icon" />
          </button>
          {showFavoriteButton && (
            <button onClick={favouriteOutfit} data-label="Favorite">
              <img src="/images/favourites.png" alt="Favourite Outfit" className="outfit-icon" />
            </button>
          )}
          <button onClick={resetOutfit} data-label="Reset">
            <img src="/images/reset.png" alt="Reset Outfit" className="outfit-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Outfit;