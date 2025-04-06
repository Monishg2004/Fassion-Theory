// File: Camera.js
import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import './Camera.css';

const Camera = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [file, setFile] = useState(null);
  const canvasRef = useRef(null);
  const [clothingCategory, setClothingCategory] = useState('');
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [facingMode, setFacingMode] = useState("user");
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // Crop states
  const [showCropper, setShowCropper] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  
  // Refs
  const imageRef = useRef(null);
  const cameraDisplayRef = useRef(null);

  // Function to flip camera
  const flipCamera = () => {
    setFacingMode(prevMode => 
      prevMode === "user" ? "environment" : "user"
    );
  };

  const capturePhoto = () => {
    // Trigger flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 100);

    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setOriginalImage(imageSrc); // Store original for undo

    // Draw the captured image to a canvas
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured_image.png', { type: 'image/png' });
        setFile(file);
      }, 'image/png');
    };
    img.src = imageSrc;
    
    // Reset states
    setShowFilters(false);
    setShowAdjustments(false);
    setShowCropper(false);
  };

  const resetPhoto = () => {
    setCapturedImage(null);
    setOriginalImage(null);
    setFile(null);
    setMessage('');
    setIsError(false);
    setShowCropper(false);
  };

  // Function to reset image adjustments
  const resetAdjustments = () => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100
    });
  };

  // Function to handle adjustment change
  const handleAdjustmentChange = (adjustment, value) => {
    setAdjustments(prev => ({
      ...prev,
      [adjustment]: value
    }));
  };

  // Apply filter style to video/image
  const getFilterStyle = () => {
    return {
      filter: `${selectedFilter !== 'normal' ? `${getFilterCss(selectedFilter)} ` : ''}brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`
    };
  };
  
  // Get CSS for filter
  const getFilterCss = (filter) => {
    switch (filter) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(80%)';
      case 'vintage': return 'sepia(30%) contrast(1.1) brightness(1.1) saturate(1.1)';
      case 'bright': return 'brightness(1.3)';
      case 'cool': return 'hue-rotate(180deg)';
      case 'warm': return 'sepia(40%) saturate(1.4) hue-rotate(-30deg)';
      default: return '';
    }
  };
  
  // Get preview style for filter options
  const getPreviewStyle = (filter) => {
    return {
      filter: getFilterCss(filter)
    };
  };
  
  // Crop functions
  const startCrop = () => {
    setShowCropper(true);
    setCropStart({ x: 0, y: 0 });
    setCropEnd({ x: 0, y: 0 });
  };
  
  const applyCrop = () => {
    if (!showCropper || !imageRef.current) return;
    
    try {
      // Get the preview image dimensions
      const img = imageRef.current;
      const { naturalWidth, naturalHeight } = img;
      const displayRect = cameraDisplayRef.current.getBoundingClientRect();
      
      // Calculate scaling factors
      const scaleX = naturalWidth / displayRect.width;
      const scaleY = naturalHeight / displayRect.height;
      
      // Calculate crop dimensions in original image coordinates
      const startX = Math.min(cropStart.x, cropEnd.x) * scaleX;
      const startY = Math.min(cropStart.y, cropEnd.y) * scaleY;
      const width = Math.abs(cropEnd.x - cropStart.x) * scaleX;
      const height = Math.abs(cropEnd.y - cropStart.y) * scaleY;
      
      // Create a canvas for cropping
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to crop size
      canvas.width = width;
      canvas.height = height;
      
      // Draw the cropped portion
      ctx.drawImage(
        img,
        startX, startY, width, height,
        0, 0, width, height
      );
      
      // Get data URL and update preview
      const croppedImage = canvas.toDataURL('image/jpeg');
      setCapturedImage(croppedImage);
      
      // Update file object with cropped image
      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured_image.png', { type: 'image/png' });
        setFile(file);
      }, 'image/png');
      
      // Exit crop mode
      setShowCropper(false);
    } catch (error) {
      console.error('Error applying crop:', error);
      setMessage('Failed to crop image. Please try again.');
      setIsError(true);
      setShowCropper(false);
    }
  };

  // Undo crop
  const undoCrop = () => {
    setCapturedImage(originalImage);
    
    // Recreate file from original image
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured_image.png', { type: 'image/png' });
        setFile(file);
      }, 'image/png');
    };
    img.src = originalImage;
    
    setShowCropper(false);
  };

  // Crop mouse events
  const handleMouseDown = (e) => {
    if (!showCropper) return;
    
    const rect = cameraDisplayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropStart({ x, y });
    setCropEnd({ x, y });
    setIsDraggingCrop(true);
  };
  
  const handleMouseMove = (e) => {
    if (!showCropper || !isDraggingCrop) return;
    
    const rect = cameraDisplayRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // Constrain to image boundaries
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    
    setCropEnd({ x, y });
  };
  
  const handleMouseUp = () => {
    setIsDraggingCrop(false);
  };

  // const handleSubmit = async (event) => {
  //   event.preventDefault();
  //   if (!file) {
  //     setMessage('Please capture a photo first!');
  //     setIsError(true);
  //     return;
  //   }

  //   if (!clothingCategory) {
  //     setMessage('Please choose a category before submitting');
  //     setIsError(true);
  //     return;
  //   }

  //   // Set loading state
  //   setIsLoading(true);

  //   const formData = new FormData();
  //   formData.append('file', file);
  //   formData.append('category', clothingCategory);
    
  //   // Add filter and adjustments info
  //   formData.append('filter', selectedFilter);
  //   formData.append('adjustments', JSON.stringify(adjustments));

  //   try {
  //     const response = await fetch('/upload', {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     const result = await response.json();

  //     if (response.ok) {
  //       setMessage('Successfully uploaded!');
  //       setIsError(false);
  //       setShowSuccessPopup(true);
  //     } else {
  //       setMessage('Failed to upload: ' + (result.error || 'Unknown error'));
  //       setIsError(true);
  //     }
  //   } catch (error) {
  //     setMessage('Failed to upload: ' + error.message);
  //     setIsError(true);
  //   }

  //   // Reset loading state
  //   setIsLoading(false);
  // };
  
  // Camera.js - Updated handleSubmit function

const handleSubmit = async (event) => {
  event.preventDefault();
  if (!file) {
    setMessage('Please capture a photo first!');
    setIsError(true);
    return;
  }

  if (!clothingCategory) {
    setMessage('Please choose a category before submitting');
    setIsError(true);
    return;
  }

  // Set loading state
  setIsLoading(true);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', clothingCategory);
  
  // Add filter and adjustments info
  formData.append('filter', selectedFilter);
  formData.append('adjustments', JSON.stringify(adjustments));

  try {
    // Get authentication token
    const token = localStorage.getItem('token');
    
    const response = await fetch('/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      setMessage('Successfully uploaded!');
      setIsError(false);
      setShowSuccessPopup(true);
    } else {
      setMessage('Failed to upload: ' + (result.error || 'Unknown error'));
      setIsError(true);
    }
  } catch (error) {
    setMessage('Failed to upload: ' + error.message);
    setIsError(true);
  }

  // Reset loading state
  setIsLoading(false);
};

  // Close success popup
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    
    // Reset form after closing popup
    resetPhoto();
    setClothingCategory('');
    setSelectedFilter('normal');
    resetAdjustments();
  };
  
  // Add global mouse events for cropping
  useEffect(() => {
    if (showCropper) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [showCropper, isDraggingCrop]);
  
  // Toggle filter/adjustments panels
  const toggleFilters = () => {
    setShowFilters(!showFilters);
    setShowAdjustments(false);
  };
  
  const toggleAdjustments = () => {
    setShowAdjustments(!showAdjustments);
    setShowFilters(false);
  };

  return (
    <div className="camera-container">
      {/* Decorative elements */}
      <div className="camera-bubble"></div>
      <div className="camera-bubble"></div>
      <div className="camera-bubble"></div>
      
      <div className="camera-content">
        <h1 className="camera-title">Take a Photo</h1>
        
        <div className={`flash ${flash ? 'active' : ''}`}></div>
        
        <div 
          className={`camera-display ${showCropper ? 'cropping' : ''}`}
          ref={cameraDisplayRef}
          onMouseDown={showCropper ? handleMouseDown : undefined}
        >
          {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured" 
              style={getFilterStyle()}
              ref={imageRef}
            />
          ) : (
            <>
              <Webcam 
                audio={false} 
                ref={webcamRef} 
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: facingMode
                }}
                style={getFilterStyle()}
              />
              <div className="camera-grid">
                <div className="camera-grid-line horizontal"></div>
                <div className="camera-grid-line horizontal"></div>
                <div className="camera-grid-line vertical"></div>
                <div className="camera-grid-line vertical"></div>
              </div>
            </>
          )}
          
          {showCropper && cropStart.x !== cropEnd.x && cropStart.y !== cropEnd.y && (
            <div 
              className="crop-overlay"
              style={{
                left: `${Math.min(cropStart.x, cropEnd.x)}px`,
                top: `${Math.min(cropStart.y, cropEnd.y)}px`,
                width: `${Math.abs(cropEnd.x - cropStart.x)}px`,
                height: `${Math.abs(cropEnd.y - cropStart.y)}px`
              }}
            ></div>
          )}
          
          {!capturedImage && (
            <div className="shutter-button" onClick={capturePhoto}>
              <div className="shutter-button-inner"></div>
            </div>
          )}
        </div>
        
        {/* Camera controls */}
        <div className="camera-controls">
          {!capturedImage ? (
            <>
              <button className="capture" onClick={capturePhoto}>
                <i className="fas fa-camera camera-icon"></i>
                Take photo
              </button>
              
              <button className={`filter ${showFilters ? 'active' : ''}`} onClick={toggleFilters}>
                <i className="fas fa-magic button-icon"></i>
                Filters
              </button>
              
              <button className={`adjust ${showAdjustments ? 'active' : ''}`} onClick={toggleAdjustments}>
                <i className="fas fa-sliders-h button-icon"></i>
                Adjust
              </button>
              
              <button className="flip" onClick={flipCamera}>
                <i className="fas fa-sync-alt button-icon"></i>
              </button>
            </>
          ) : (
            <>
              {!showCropper ? (
                <button className="filter" onClick={startCrop}>
                  <i className="fas fa-crop button-icon"></i>
                  Crop
                </button>
              ) : (
                <>
                  <button className="submit" onClick={applyCrop}>
                    <i className="fas fa-check button-icon"></i>
                    Apply Crop
                  </button>
                  <button className="filter" onClick={undoCrop}>
                    <i className="fas fa-undo button-icon"></i>
                    Undo
                  </button>
                </>
              )}
              
              <button className="discard" onClick={resetPhoto}>
                <i className="fas fa-times button-icon"></i>
                Discard
              </button>
              
              <button className="submit" onClick={handleSubmit}>
                <i className="fas fa-check button-icon"></i>
                Submit
              </button>
            </>
          )}
        </div>
        
        {capturedImage && (
          <div className="category-selection">
            <h3 className="section-title">Select Category</h3>
            <div className="category-chips">
              <div 
                className={`category-chip hats ${clothingCategory === 'top' ? 'active' : ''}`}
                onClick={() => setClothingCategory('top')}
              >
                <i className="fas fa-hat-wizard"></i> Hats
              </div>
              <div 
                className={`category-chip tops ${clothingCategory === 'upper_body' ? 'active' : ''}`}
                onClick={() => setClothingCategory('upper_body')}
              >
                <i className="fas fa-tshirt"></i> Tops
              </div>
              <div 
                className={`category-chip bottoms ${clothingCategory === 'lower_body' ? 'active' : ''}`}
                onClick={() => setClothingCategory('lower_body')}
              >
                <i className="fas fa-socks"></i> Bottoms
              </div>
              <div 
                className={`category-chip shoes ${clothingCategory === 'bottom' ? 'active' : ''}`}
                onClick={() => setClothingCategory('bottom')}
              >
                <i className="fas fa-shoe-prints"></i> Shoes
              </div>
            </div>
          </div>
        )}
        
        {showFilters && !capturedImage && (
          <div className="filter-options">
            {['normal', 'grayscale', 'sepia', 'vintage', 'bright', 'cool', 'warm'].map((filter) => (
              <div 
                key={filter} 
                className={`filter-option ${selectedFilter === filter ? 'active' : ''}`}
                onClick={() => setSelectedFilter(filter)}
              >
                <div 
                  className="filter-preview" 
                  style={getPreviewStyle(filter)}
                >
                  {webcamRef.current && (
                    <img 
                      src={webcamRef.current.getScreenshot()} 
                      alt={filter} 
                    />
                  )}
                </div>
                <div className="filter-name">{filter.charAt(0).toUpperCase() + filter.slice(1)}</div>
              </div>
            ))}
          </div>
        )}
        
        {showAdjustments && (
          <div className="image-adjustments">
            <div className="adjustment-control">
              <div className="adjustment-label">Brightness</div>
              <input 
                type="range" 
                min="50" 
                max="150" 
                value={adjustments.brightness} 
                className="adjustment-slider"
                onChange={(e) => handleAdjustmentChange('brightness', parseInt(e.target.value))}
              />
              <div className="adjustment-value">{adjustments.brightness}%</div>
            </div>
            
            <div className="adjustment-control">
              <div className="adjustment-label">Contrast</div>
              <input 
                type="range" 
                min="50" 
                max="150" 
                value={adjustments.contrast} 
                className="adjustment-slider"
                onChange={(e) => handleAdjustmentChange('contrast', parseInt(e.target.value))}
              />
              <div className="adjustment-value">{adjustments.contrast}%</div>
            </div>
            
            <div className="adjustment-control">
              <div className="adjustment-label">Saturation</div>
              <input 
                type="range" 
                min="50" 
                max="150" 
                value={adjustments.saturation} 
                className="adjustment-slider"
                onChange={(e) => handleAdjustmentChange('saturation', parseInt(e.target.value))}
              />
              <div className="adjustment-value">{adjustments.saturation}%</div>
            </div>
            
            <button className="reset-adjustments" onClick={resetAdjustments}>
              Reset to Default
            </button>
          </div>
        )}
        
        {message && !isLoading && !showSuccessPopup && (
          <div className={`message ${isError ? 'error' : 'success'}`}>{message}</div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      
      {isLoading && (
        <div className="loading-spinner-parent">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {/* Success popup */}
      {showSuccessPopup && (
        <div className="success-popup-overlay" onClick={closeSuccessPopup}>
          <div className="success-popup" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>Upload Complete!</h3>
            <p>Your photo has been added to your wardrobe.</p>
            <button className="success-button" onClick={closeSuccessPopup}>
              <i className="fas fa-check"></i> Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Camera;