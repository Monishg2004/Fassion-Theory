//upload.js
import React, { useState, useRef, useEffect } from 'react';
import './Upload.css';
import authService from '../services/auth';
const Upload = () => {
  // State for files
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  
  // State for options
  const [clothingCategory, setClothingCategory] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('normal');
  
  // UI states
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // Crop states
  const [showCropper, setShowCropper] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const dropContainerRef = useRef(null);
  const imageRef = useRef(null);
  const previewRef = useRef(null);

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Process file
  const handleFile = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgSrc = e.target.result;
        setPreviewSrc(imgSrc);
        setOriginalImage(imgSrc); // Store original for undo
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
      
      setMessage('');
      setIsError(false);
      setShowCropper(false);
    }
  };

  // Handle file input change
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFile(event.target.files[0]);
    }
  };
  
  // Reset photo
  const resetPhoto = () => {
    setSelectedFile(null);
    setPreviewSrc(null);
    setOriginalImage(null);
    setMessage('');
    setIsError(false);
    setShowCropper(false);
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
      const previewRect = previewRef.current.getBoundingClientRect();
      
      // Calculate scaling factors
      const scaleX = naturalWidth / previewRect.width;
      const scaleY = naturalHeight / previewRect.height;
      
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
      setPreviewSrc(croppedImage);
      
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
    setPreviewSrc(originalImage);
    setShowCropper(false);
  };

  // Crop mouse events
  const handleMouseDown = (e) => {
    if (!showCropper) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropStart({ x, y });
    setCropEnd({ x, y });
    setIsDraggingCrop(true);
  };
  
  const handleMouseMove = (e) => {
    if (!showCropper || !isDraggingCrop) return;
    
    const rect = previewRef.current.getBoundingClientRect();
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

  // Generate filter styles
  const getFilterStyle = () => {
    return `filter-${selectedFilter}`;
  };

  // // Handle form submission
  // const handleSubmit = async (event) => {
  //   event.preventDefault();
    
  //   if (!selectedFile) {
  //     setMessage('Please select a photo to upload!');
  //     setIsError(true);
  //     return;
  //   }

  //   if (!clothingCategory) {
  //     setMessage('Please choose a category before submitting');
  //     setIsError(true);
  //     return;
  //   }

  //   setIsLoading(true);
  //   setUploadProgress(0);
    
  //   try {
  //     // Create a form data object
  //     const formData = new FormData();
      
  //     // If we have a cropped image, convert it to a file
  //     if (previewSrc !== originalImage) {
  //       // Convert data URL to Blob
  //       const response = await fetch(previewSrc);
  //       const blob = await response.blob();
  //       const croppedFile = new File([blob], selectedFile.name, { type: 'image/jpeg' });
  //       formData.append('file', croppedFile);
  //     } else {
  //       formData.append('file', selectedFile);
  //     }
      
  //     formData.append('category', clothingCategory);
  //     formData.append('filter', selectedFilter);
      
  //     // Simulate upload progress
  //     const progressInterval = setInterval(() => {
  //       setUploadProgress(prev => {
  //         if (prev >= 98) {
  //           clearInterval(progressInterval);
  //           return 98;
  //         }
  //         return prev + 5;
  //       });
  //     }, 100);
      
  //     const response = await fetch('/upload', {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     clearInterval(progressInterval);
  //     setUploadProgress(100);

  //     const result = await response.json();

  //     if (response.ok) {
  //       setMessage('Successfully uploaded!');
  //       setIsError(false);
  //       setShowSuccessPopup(true);
        
  //       // Reset form after successful upload
  //       setTimeout(() => {
  //         resetPhoto();
  //         setClothingCategory('');
  //         setSelectedFilter('normal');
  //       }, 2000);
  //     } else {
  //       setMessage('Failed to upload: ' + (result.error || 'Unknown error'));
  //       setIsError(true);
  //     }
  //   } catch (error) {
  //     setMessage('Failed to upload: ' + error.message);
  //     setIsError(true);
  //   }

  //   setIsLoading(false);
  // };

  // // Close success popup
// Upload.js - Updated handleSubmit function

const handleSubmit = async (event) => {
  event.preventDefault();
  
  if (!selectedFile) {
    setMessage('Please select a photo to upload!');
    setIsError(true);
    return;
  }

  if (!clothingCategory) {
    setMessage('Please choose a category before submitting');
    setIsError(true);
    return;
  }

  setIsLoading(true);
  setUploadProgress(0);
  
  try {
    // Create a form data object
    const formData = new FormData();
    
    // If we have a cropped image, convert it to a file
    if (previewSrc !== originalImage) {
      // Convert data URL to Blob
      const response = await fetch(previewSrc);
      const blob = await response.blob();
      const croppedFile = new File([blob], selectedFile.name, { type: 'image/jpeg' });
      formData.append('file', croppedFile);
    } else {
      formData.append('file', selectedFile);
    }
    
    formData.append('category', clothingCategory);
    formData.append('filter', selectedFilter);
    
    // Get auth token
    const token = authService.getToken();
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 98) {
          clearInterval(progressInterval);
          return 98;
        }
        return prev + 5;
      });
    }, 100);
    
    const response = await fetch('/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    clearInterval(progressInterval);
    setUploadProgress(100);

    const result = await response.json();

    if (response.ok) {
      setMessage('Successfully uploaded!');
      setIsError(false);
      setShowSuccessPopup(true);
      
      // Reset form after successful upload
      setTimeout(() => {
        resetPhoto();
        setClothingCategory('');
        setSelectedFilter('normal');
      }, 2000);
    } else {
      setMessage('Failed to upload: ' + (result.error || 'Unknown error'));
      setIsError(true);
    }
  } catch (error) {
    setMessage('Failed to upload: ' + error.message);
    setIsError(true);
  }

  setIsLoading(false);
};

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  useEffect(() => {
    // Add global mouse event listeners for cropping
    if (showCropper) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [showCropper, isDraggingCrop]);

  return (
    <div className="upload-container">
      {/* Decorative elements */}
      <div className="upload-bubble"></div>
      <div className="upload-bubble"></div>
      <div className="upload-bubble"></div>
      
      <div className="upload-content">
        <h1 className="upload-title">Upload Clothing Item</h1>
        
        {/* Drag and drop area */}
        <div 
          ref={dropContainerRef}
          className={`drop-container ${isDragging ? 'drag-active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <i className="fas fa-cloud-upload-alt icon"></i>
          <div className="text">
            <span className="highlight">Drag & Drop</span> your image here or <span className="highlight">click</span> to browse
          </div>
          
          <div className="file-input-container">
            <button className="file-input-button">
              <i className="fas fa-folder-open"></i> Browse Files
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              className="file-input"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </div>
        
        {/* File preview */}
        {previewSrc && (
          <div className="preview-container">
            <div className="preview-header">
              <div className="preview-title">
                <i className="fas fa-image"></i> Image Preview
              </div>
              <div className="preview-actions">
                {!showCropper ? (
                  <button 
                    className="preview-action-button"
                    onClick={startCrop}
                  >
                    <i className="fas fa-crop"></i> Crop
                  </button>
                ) : (
                  <>
                    <button 
                      className="preview-action-button"
                      onClick={applyCrop}
                    >
                      <i className="fas fa-check"></i> Apply
                    </button>
                    <button 
                      className="preview-action-button"
                      onClick={undoCrop}
                    >
                      <i className="fas fa-undo"></i> Undo
                    </button>
                  </>
                )}
                <button 
                  className="preview-action-button delete"
                  onClick={resetPhoto}
                >
                  <i className="fas fa-trash-alt"></i> Remove
                </button>
              </div>
            </div>
            
            <div 
              className={`image-preview ${showCropper ? 'cropping' : ''}`}
              ref={previewRef}
              onMouseDown={showCropper ? handleMouseDown : undefined}
            >
              <img 
                src={previewSrc} 
                alt="Preview" 
                className={getFilterStyle()}
                ref={imageRef}
              />
              
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
            </div>
            
            {/* Filter options */}
            <div className="filter-controls">
              {['normal', 'grayscale', 'sepia', 'vintage', 'bright', 'cool', 'warm'].map((filter) => (
                <div 
                  key={filter} 
                  className={`filter-option ${selectedFilter === filter ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(filter)}
                >
                  <div 
                    className={`filter-preview filter-${filter}`} 
                    style={{backgroundImage: `url(${previewSrc})`}}
                  ></div>
                  <div className="filter-name">{filter.charAt(0).toUpperCase() + filter.slice(1)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Category selection */}
        {previewSrc && (
          <>
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
            
            {/* Upload progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <>
                <div className="upload-progress-container">
                  <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <div className="upload-progress-text">Uploading... {uploadProgress.toFixed(0)}%</div>
              </>
            )}
            
            {/* Submit button */}
            <div className="upload-button-container">
              <button className="upload-button" onClick={handleSubmit} disabled={isLoading}>
                <i className="fas fa-cloud-upload-alt"></i> 
                {isLoading ? 'Uploading...' : 'Upload Item'}
              </button>
            </div>
          </>
        )}
        
        {/* Messages */}
        {message && !isLoading && !showSuccessPopup && (
          <div className={`message ${isError ? 'error' : 'success'}`}>{message}</div>
        )}
      </div>
      
      {/* Loading spinner */}
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
            <p>Your clothing item has been added to your wardrobe.</p>
            <button className="success-button" onClick={closeSuccessPopup}>
              <i className="fas fa-check"></i> Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;