

// Enhanced MyVault.js 
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import './MyVault.css';
import { FaCamera, FaUpload, FaTrash, FaPlusCircle, FaCheck, FaTimes, FaCalendarAlt, FaStar, FaSync } from 'react-icons/fa';

const MyVault = () => {
  const [vaultEntries, setVaultEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState([]);
  const [currentView, setCurrentView] = useState('grid'); // 'grid' or 'calendar'
  const [statistics, setStatistics] = useState(null);
  const [occasionStats, setOccasionStats] = useState({});
  const [filterMonth, setFilterMonth] = useState('');
  const [filterOccasion, setFilterOccasion] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [newTask, setNewTask] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  
  // Use localStorage to persist todos and occasions
  const [todoList, setTodoList] = useState(() => {
    const savedTodos = localStorage.getItem('todoList');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  
  const [upcomingOccasions, setUpcomingOccasions] = useState(() => {
    const savedOccasions = localStorage.getItem('upcomingOccasions');
    return savedOccasions ? JSON.parse(savedOccasions) : [];
  });
  
  // State for wardrobe items (new)
  const [wardrobeItems, setWardrobeItems] = useState(() => {
    const savedWardrobe = localStorage.getItem('wardrobeItems');
    return savedWardrobe ? JSON.parse(savedWardrobe) : {
      tops: [],
      bottoms: [],
      upper_body: [],
      lower_body: []
    };
  });
  
  // State for outfit descriptions and notes (new)
  const [outfitMetadata, setOutfitMetadata] = useState(() => {
    const savedMetadata = localStorage.getItem('outfitMetadata');
    return savedMetadata ? JSON.parse(savedMetadata) : [];
  });
  
  const [newOccasion, setNewOccasion] = useState({ date: '', name: '', notes: '' });
  const [viewMode, setViewMode] = useState('all'); // 'all', 'recent', 'favorites'
  const [favoriteEntries, setFavoriteEntries] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Form state for adding new entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    description: '',
    occasion: '',
    rating: 5,
    improveOutput: '',
    image: null
  });

  // Save todos to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('todoList', JSON.stringify(todoList));
    // Also sync to cookies for server access
    document.cookie = `todoList=${encodeURIComponent(JSON.stringify(todoList))}; path=/; max-age=86400`;
  }, [todoList]);

  // Save occasions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('upcomingOccasions', JSON.stringify(upcomingOccasions));
    // Also sync to cookies for server access
    document.cookie = `upcomingOccasions=${encodeURIComponent(JSON.stringify(upcomingOccasions))}; path=/; max-age=86400`;
  }, [upcomingOccasions]);
  
  // Save wardrobe items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wardrobeItems', JSON.stringify(wardrobeItems));
  }, [wardrobeItems]);
  
  // Save outfit metadata to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('outfitMetadata', JSON.stringify(outfitMetadata));
    // Also sync to cookies for server access
    document.cookie = `outfitMetadata=${encodeURIComponent(JSON.stringify(outfitMetadata))}; path=/; max-age=86400`;
  }, [outfitMetadata]);

  useEffect(() => {
    fetchVaultEntries();
    fetchStatistics();
    fetchWardrobeItems();
    
    // Also save favorites to localStorage
    const savedFavorites = localStorage.getItem('favoriteEntries');
    if (savedFavorites) {
      setFavoriteEntries(JSON.parse(savedFavorites));
    }
    
    // Set up interval to refresh data every 5 minutes
    const refreshInterval = setInterval(() => {
      syncDataWithServer();
    }, 300000); // 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('favoriteEntries', JSON.stringify(favoriteEntries));
  }, [favoriteEntries]);
  
  // Function to sync data with the server
  const syncDataWithServer = async () => {
    setSyncStatus('syncing');
    try {
      // Fetch latest data
      await Promise.all([
        fetchVaultEntries(),
        fetchStatistics(),
        fetchWardrobeItems()
      ]);
      
      // Update cookies with latest localStorage data
      document.cookie = `todoList=${encodeURIComponent(localStorage.getItem('todoList') || '[]')}; path=/; max-age=86400`;
      document.cookie = `upcomingOccasions=${encodeURIComponent(localStorage.getItem('upcomingOccasions') || '[]')}; path=/; max-age=86400`;
      document.cookie = `outfitMetadata=${encodeURIComponent(localStorage.getItem('outfitMetadata') || '[]')}; path=/; max-age=86400`;
      document.cookie = `vaultEntriesSummary=${encodeURIComponent(JSON.stringify(processVaultEntries()))}; path=/; max-age=86400`;
      
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error("Error syncing data:", error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // Process vault entries to extract description and notes for chatbot
  const processVaultEntries = () => {
    try {
      // Create a simplified version of vault entries for the chatbot
      const summary = vaultEntries.map(entry => ({
        uuid: entry.uuid,
        date: entry.date,
        occasion: entry.occasion || '',
        description: entry.description || '',
        notes: entry.notes || '',
        rating: entry.weather && entry.weather.includes("Rating:") 
          ? parseInt(entry.weather.replace("Rating:", "").trim()) 
          : null
      }));
      
      // Update the outfitMetadata state with this data
      setOutfitMetadata(summary);
      
      return summary;
    } catch (error) {
      console.error("Error processing vault entries:", error);
      return [];
    }
  };

  const fetchVaultEntries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/get_vault_entries');
      if (!response.ok) {
        throw new Error('Failed to fetch vault entries');
      }
      
      const data = await response.json();
      
      // Sort entries by date (newest first)
      const sortedEntries = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setVaultEntries(sortedEntries);
      
      // Process entries for description and notes
      const processedData = processVaultEntries();
      
      // Save to localStorage for offline access and chatbot
      localStorage.setItem('vaultEntries', JSON.stringify(sortedEntries));
      localStorage.setItem('outfitMetadata', JSON.stringify(processedData));
      
      // Set entries as favorites if they're in the saved favorites list
      const savedFavorites = localStorage.getItem('favoriteEntries');
      if (!savedFavorites && sortedEntries.length > 0) {
        // If no saved favorites, set first 5 entries as favorites (for first-time users)
        const initialFavorites = sortedEntries.slice(0, Math.min(5, sortedEntries.length)).map(entry => entry.uuid);
        setFavoriteEntries(initialFavorites);
        localStorage.setItem('favoriteEntries', JSON.stringify(initialFavorites));
      }
      
      // Calculate occasion statistics
      const occasions = {};
      sortedEntries.forEach(entry => {
        if (entry.occasion) {
          if (!occasions[entry.occasion]) {
            occasions[entry.occasion] = 1;
          } else {
            occasions[entry.occasion]++;
          }
        }
      });
      
      // Sort occasions by frequency
      const sortedOccasions = Object.entries(occasions)
        .sort((a, b) => b[1] - a[1])
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});
        
      setOccasionStats(sortedOccasions);
      localStorage.setItem('occasionStats', JSON.stringify(sortedOccasions));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/get_vault_statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const data = await response.json();
      setStatistics(data);
      
      // Save to localStorage for offline access and chatbot
      localStorage.setItem('wardrobeStatistics', JSON.stringify(data));
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };
  
  const fetchWardrobeItems = async () => {
    try {
      const response = await fetch('/get_available_clothes');
      if (!response.ok) {
        throw new Error('Failed to fetch wardrobe items');
      }
      const data = await response.json();
      
      // Organize by category
      const categorized = {
        tops: data.filter(item => item.clothes_part === 'top'),
        bottoms: data.filter(item => item.clothes_part === 'bottom'),
        upper_body: data.filter(item => item.clothes_part === 'upper_body'),
        lower_body: data.filter(item => item.clothes_part === 'lower_body')
      };
      
      setWardrobeItems(categorized);
      localStorage.setItem('wardrobeItems', JSON.stringify(categorized));
    } catch (err) {
      console.error('Error fetching wardrobe items:', err);
    }
  };

  const handleAddEntry = async () => {
    try {
      // Standard request without image
      if (!capturedImage && !uploadedImage) {
        const jsonData = {
          date: newEntry.date,
          notes: newEntry.improveOutput || '',
          description: newEntry.description || '',
          occasion: newEntry.occasion || '',  // Store occasion if provided
          weather: `Rating: ${newEntry.rating}/10`,
          outfit_uuids: []
        };
        
        const response = await fetch('/add_vault_entry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to add vault entry');
        }
        
        const result = await response.json();
        console.log("Entry added successfully:", result);
        
        // Add to outfitMetadata for chatbot
        const newMetadata = {
          uuid: result.uuid,
          date: newEntry.date,
          occasion: newEntry.occasion || '',
          description: newEntry.description || '',
          notes: newEntry.improveOutput || '',
          rating: newEntry.rating
        };
        
        setOutfitMetadata(prev => [...prev, newMetadata]);
      } 
      // Request with image
      else {
        // Create form data for file upload
        const formData = new FormData();
        
        // Add image if camera was used or file was uploaded
        if (capturedImage) {
          try {
            // Convert base64 to file
            const fetchRes = await fetch(capturedImage);
            const blob = await fetchRes.blob();
            formData.append('file', blob, 'captured-image.jpg');
          } catch (error) {
            console.error("Error converting image:", error);
            throw new Error("Failed to process the image");
          }
        } else if (uploadedImage) {
          formData.append('file', uploadedImage);
        }
        
        // Add other form data
        formData.append('date', newEntry.date);
        formData.append('notes', newEntry.improveOutput || '');
        formData.append('description', newEntry.description || '');
        formData.append('occasion', newEntry.occasion || '');
        formData.append('weather', `Rating: ${newEntry.rating}/10`);
        formData.append('outfit_uuids', JSON.stringify([]));
        
        const response = await fetch('/add_vault_entry_with_image', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          // If the image endpoint fails, try the standard endpoint
          const jsonData = {
            date: newEntry.date,
            notes: newEntry.improveOutput || '',
            description: newEntry.description || '',
            occasion: newEntry.occasion || '',
            weather: `Rating: ${newEntry.rating}/10`,
            outfit_uuids: []
          };
          
          const fallbackResponse = await fetch('/add_vault_entry', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
          });
          
          if (!fallbackResponse.ok) {
            throw new Error('Failed to add vault entry via both methods');
          }
          
          const result = await fallbackResponse.json();
          
          // Add to outfitMetadata for chatbot
          const newMetadata = {
            uuid: result.uuid,
            date: newEntry.date,
            occasion: newEntry.occasion || '',
            description: newEntry.description || '',
            notes: newEntry.improveOutput || '',
            rating: newEntry.rating
          };
          
          setOutfitMetadata(prev => [...prev, newMetadata]);
        } else {
          const result = await response.json();
          
          // Add to outfitMetadata for chatbot
          const newMetadata = {
            uuid: result.uuid,
            date: newEntry.date,
            occasion: newEntry.occasion || '',
            description: newEntry.description || '',
            notes: newEntry.improveOutput || '',
            rating: newEntry.rating
          };
          
          setOutfitMetadata(prev => [...prev, newMetadata]);
        }
      }
      
      // Refresh entries and close modal
      await fetchVaultEntries();
      setShowAddModal(false);
      
      // Reset form and captured/uploaded images
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        notes: '',
        description: '',
        occasion: '',
        rating: 5,
        improveOutput: '',
        image: null
      });
      setCapturedImage(null);
      setUploadedImage(null);
      
      // Sync data with server after adding new entry
      syncDataWithServer();
    } catch (err) {
      console.error('Error adding entry:', err);
      setError(err.message || 'Failed to add entry. Please try again.');
    }
  };

  const handleDeleteEntry = async (uuid) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    try {
      const response = await fetch(`/delete_vault_entry?uuid=${uuid}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete vault entry');
      }
      
      // Remove from favorites if it's there
      if (favoriteEntries.includes(uuid)) {
        setFavoriteEntries(favoriteEntries.filter(id => id !== uuid));
      }
      
      // Remove from outfitMetadata
      setOutfitMetadata(prev => prev.filter(item => item.uuid !== uuid));

      // Refresh entries and close modal if open
      fetchVaultEntries();
      if (selectedEntry && selectedEntry.uuid === uuid) {
        setShowViewModal(false);
      }
      
      // Sync data with server after deletion
      syncDataWithServer();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleFavorite = (uuid) => {
    if (favoriteEntries.includes(uuid)) {
      setFavoriteEntries(favoriteEntries.filter(id => id !== uuid));
    } else {
      setFavoriteEntries([...favoriteEntries, uuid]);
    }
  };

  const handleUpdateEntry = async (updatedData) => {
    try {
      const response = await fetch('/update_vault_entry', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uuid: selectedEntry.uuid,
          ...updatedData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update vault entry');
      }
      
      // Update metadata for chatbot
      setOutfitMetadata(prev => prev.map(item => {
        if (item.uuid === selectedEntry.uuid) {
          return {
            ...item,
            description: updatedData.description || item.description,
            notes: updatedData.notes || item.notes,
            occasion: updatedData.occasion || item.occasion
          };
        }
        return item;
      }));
      
      // Refresh entries and view
      fetchVaultEntries();
      
      // Update the selected entry view with new data
      setSelectedEntry({
        ...selectedEntry,
        ...updatedData
      });
      
      // Sync data with server after update
      syncDataWithServer();
    } catch (err) {
      setError(err.message);
    }
  };

  const viewEntry = (entry) => {
    setSelectedEntry(entry);
    
    // Load outfit images for the entry if there are any
    if (entry.outfit && entry.outfit.clothes && entry.outfit.clothes.length > 0) {
      loadOutfitImages(entry.outfit.clothes);
    } else {
      setSelectedOutfit([]);
    }
    
    setShowViewModal(true);
  };

  const loadOutfitImages = async (clothesArray) => {
    const outfitWithImages = [];
    
    for (const item of clothesArray) {
      try {
        const response = await fetch('/get_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uuid: item.uuid })
        });
        
        if (response.ok) {
          const data = await response.json();
          outfitWithImages.push({
            ...item,
            imageData: data.image
          });
        }
      } catch (err) {
        console.error('Error loading image:', err);
      }
    }
    
    setSelectedOutfit(outfitWithImages);
  };

  // Filter entries based on current filters and view mode
  const getFilteredEntries = () => {
    let filtered = vaultEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const monthMatch = filterMonth ? 
        entryDate.getMonth() === parseInt(filterMonth) - 1 : 
        true;
      
      const occasionMatch = filterOccasion ? 
        entry.occasion && entry.occasion.toLowerCase().includes(filterOccasion.toLowerCase()) : 
        true;
      
      return monthMatch && occasionMatch;
    });

    // Apply view mode filter
    if (viewMode === 'recent') {
      filtered = filtered.slice(0, 10); // Most recent 10 entries
    } else if (viewMode === 'favorites') {
      filtered = filtered.filter(entry => favoriteEntries.includes(entry.uuid));
    }

    return filtered;
  };

  const filteredEntries = getFilteredEntries();

  // Camera functions
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please check permissions.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data as base64 string
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      
      // Stop camera
      stopCamera();
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedImage(e.target.files[0]);
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        setCapturedImage(event.target.result); // Reuse capturedImage state for preview
      };
      fileReader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleRatingChange = (rating) => {
    setNewEntry(prev => ({
      ...prev,
      rating
    }));
  };

  // Add upcoming occasion function that saves to localStorage
  const addUpcomingOccasion = () => {
    if (newOccasion.date && newOccasion.name) {
      const newOccasions = [
        ...upcomingOccasions,
        { ...newOccasion, id: Date.now() }
      ];
      setUpcomingOccasions(newOccasions);
      setNewOccasion({ date: '', name: '', notes: '' });
      
      // Save to localStorage and sync
      localStorage.setItem('upcomingOccasions', JSON.stringify(newOccasions));
      document.cookie = `upcomingOccasions=${encodeURIComponent(JSON.stringify(newOccasions))}; path=/; max-age=86400`;
    }
  };

  // Delete occasion function that updates localStorage
  const deleteUpcomingOccasion = (id) => {
    const updatedOccasions = upcomingOccasions.filter(occasion => occasion.id !== id);
    setUpcomingOccasions(updatedOccasions);
    
    // Save to localStorage and sync
    localStorage.setItem('upcomingOccasions', JSON.stringify(updatedOccasions));
    document.cookie = `upcomingOccasions=${encodeURIComponent(JSON.stringify(updatedOccasions))}; path=/; max-age=86400`;
  };

  // Todo list functions with localStorage persistence
  const toggleTodoComplete = (id) => {
    const updatedTodos = todoList.map(item => 
      item.id === id ? {...item, complete: !item.complete} : item
    );
    setTodoList(updatedTodos);
    
    // Save to localStorage and sync
    localStorage.setItem('todoList', JSON.stringify(updatedTodos));
    document.cookie = `todoList=${encodeURIComponent(JSON.stringify(updatedTodos))}; path=/; max-age=86400`;
  };

  const addTodoTask = () => {
    if (newTask.trim()) {
      const newTodo = {
        id: Date.now(),
        task: newTask,
        complete: false,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default due date 1 week from now
      };
      
      const updatedTodos = [...todoList, newTodo];
      setTodoList(updatedTodos);
      setNewTask('');
      
      // Save to localStorage and sync
      localStorage.setItem('todoList', JSON.stringify(updatedTodos));
      document.cookie = `todoList=${encodeURIComponent(JSON.stringify(updatedTodos))}; path=/; max-age=86400`;
    }
  };

  const deleteTodoTask = (id) => {
    const updatedTodos = todoList.filter(task => task.id !== id);
    setTodoList(updatedTodos);
    
    // Save to localStorage and sync
    localStorage.setItem('todoList', JSON.stringify(updatedTodos));
    document.cookie = `todoList=${encodeURIComponent(JSON.stringify(updatedTodos))}; path=/; max-age=86400`;
  };

  // Get unique occasions for filter dropdown
  const occasions = Array.from(new Set(
    vaultEntries.map(entry => entry.occasion).filter(occasion => occasion)
  ));

  // Rating stars component
  const RatingSelector = ({ value, onChange }) => {
    const [hoverValue, setHoverValue] = useState(0);
    
    return (
      <div className="rating-selector">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
          <span 
            key={star}
            className={`rating-star ${star <= (hoverValue || value) ? 'active' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
          >
            {star <= (hoverValue || value) ? <FaStar /> : <FaStar className="inactive" />}
          </span>
        ))}
        <span className="rating-value">{value}/10</span>
      </div>
    );
  };

  // Weather icons based on the season of the entry date
  const getSeasonEmoji = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth();
    
    if (month >= 2 && month <= 4) return "🌸"; // Spring
    if (month >= 5 && month <= 7) return "☀️"; // Summer
    if (month >= 8 && month <= 10) return "🍂"; // Fall
    return "❄️"; // Winter
  };

  if (isLoading) {
    return (
      <div className="my-vault-loading">
        <div className="spinner"></div>
        <p>Loading your fashion history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-vault-error">
        <h3>Error loading vault</h3>
        <p>{error}</p>
        <button onClick={() => {
          setError(null);
          fetchVaultEntries();
        }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="my-vault-container">
      <div className="vault-header">
        <h1>My Fashion Vault</h1>
        <p>Your personal outfit history and style journey</p>
        
        <div className="vault-actions">
          <button 
            className="add-entry-btn"
            onClick={() => setShowAddModal(true)}
          >
            <FaPlusCircle className="btn-icon" /> Add What I Wore Today
          </button>
          
          <div className="view-mode-selector">
            <button 
              className={`view-mode-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              All
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'recent' ? 'active' : ''}`}
              onClick={() => setViewMode('recent')}
            >
              Recent
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'favorites' ? 'active' : ''}`}
              onClick={() => setViewMode('favorites')}
            >
              Favorites
            </button>
          </div>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${currentView === 'grid' ? 'active' : ''}`}
              onClick={() => setCurrentView('grid')}
            >
              Grid View
            </button>
            <button 
              className={`view-btn ${currentView === 'calendar' ? 'active' : ''}`}
              onClick={() => setCurrentView('calendar')}
            >
              Calendar View
            </button>
          </div>
          
          <button 
            className={`sync-btn ${syncStatus}`}
            onClick={syncDataWithServer}
            disabled={syncStatus === 'syncing'}
            title="Sync data with server"
          >
            <FaSync className={syncStatus === 'syncing' ? 'spin' : ''} />
            {syncStatus === 'syncing' ? ' Syncing...' : 
             syncStatus === 'success' ? ' Synced!' : 
             syncStatus === 'error' ? ' Sync Failed' : ' Sync Data'}
          </button>
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>Month:</label>
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Occasion:</label>
            <select 
              value={filterOccasion} 
              onChange={(e) => setFilterOccasion(e.target.value)}
            >
              <option value="">All Occasions</option>
              {occasions.map(occasion => (
                <option key={occasion} value={occasion}>{occasion}</option>
              ))}
              <option value="Work">Work</option>
              <option value="Casual">Casual</option>
              <option value="Party">Party</option>
              <option value="Formal">Formal</option>
              <option value="Date">Date</option>
              <option value="Wedding">Wedding</option>
              <option value="Interview">Interview</option>
            </select>
          </div>
        </div>
      </div>
      
      {currentView === 'grid' ? (
        <div className="entries-grid">
          {filteredEntries.length === 0 ? (
            <div className="no-entries">
              <p>No outfit entries found. Start tracking your outfits by clicking "Add What I Wore Today"!</p>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div 
                key={entry.uuid} 
                className="entry-card"
              >
                <div className="entry-header-wrapper">
                  <div className="entry-date">
                    {getSeasonEmoji(entry.date)}{' '}
                    {new Date(entry.date).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="entry-actions">
                    <button 
                      className={`favorite-btn ${favoriteEntries.includes(entry.uuid) ? 'favorited' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(entry.uuid);
                      }}
                    >
                      {favoriteEntries.includes(entry.uuid) ? '★' : '☆'}
                    </button>
                  </div>
                </div>
                
                <div 
                  className="entry-outfit-preview"
                  onClick={() => viewEntry(entry)}
                >
                  {entry.image ? (
                    <img 
                      src={`data:image/jpeg;base64,${entry.image}`}
                      alt="Outfit preview"
                      className="outfit-preview-image"
                    />
                  ) : entry.outfit && entry.outfit.clothes && entry.outfit.clothes.length > 0 ? (
                    <div className="outfit-item-count">
                      {entry.outfit.clothes.length} items
                    </div>
                  ) : (
                    <div className="no-outfit">No outfit data</div>
                  )}
                </div>
                
                <div className="entry-details-preview">
                  {entry.occasion && (
                    <div className="entry-occasion">
                      <span className="occasion-label">Occasion:</span> {entry.occasion}
                    </div>
                  )}
                  
                  {/* Show rating if available (stored in weather field) */}
                  {entry.weather && entry.weather.includes("Rating:") && (
                    <div className="entry-rating">
                      <span className="rating-summary">
                        {entry.weather}
                      </span>
                    </div>
                  )}
                  
                  {entry.description && (
                    <div className="entry-description-preview">
                      {entry.description.substring(0, 50)}
                      {entry.description.length > 50 ? '...' : ''}
                    </div>
                  )}
                </div>
                
                <div className="entry-card-actions">
                  <button 
                    className="view-entry-btn"
                    onClick={() => viewEntry(entry)}
                  >
                    View Details
                  </button>
                  <button 
                    className="delete-entry-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEntry(entry.uuid);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="calendar-view">
          <div className="calendar-controls">
            <button 
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="year-control-btn"
            >
              &lt; {selectedYear - 1}
            </button>
            <h3 className="calendar-year">{selectedYear}</h3>
            <button 
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="year-control-btn"
            >
              {selectedYear + 1} &gt;
            </button>
          </div>
          <div className="calendar-months">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
              const monthName = new Date(selectedYear, month - 1, 1).toLocaleString('default', { month: 'long' });
              const entriesInMonth = filteredEntries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate.getMonth() === month - 1 && entryDate.getFullYear() === selectedYear;
              });
              
              return (
                <div key={month} className="calendar-month">
                  <h3>{monthName}</h3>
                  <div className="calendar-days">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                      const maxDays = new Date(selectedYear, month, 0).getDate();
                      if (day > maxDays) {
                        return null; // Skip days that don't exist in this month
                      }
                      
                      const entriesOnDay = entriesInMonth.filter(entry => {
                        const entryDate = new Date(entry.date);
                        return entryDate.getDate() === day;
                      });
                      
                      return (
                        <div 
                          key={day} 
                          className={`calendar-day ${entriesOnDay.length > 0 ? 'has-entries' : ''}`}
                          onClick={() => entriesOnDay.length > 0 && viewEntry(entriesOnDay[0])}
                        >
                          <span>{day}</span>
                          {entriesOnDay.length > 0 && (
                            <div className="day-indicator"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="vault-analytics-and-todo">
        <div className="vault-statistics">
          <h2>Your Style Analytics</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Popular Occasions</h3>
              {Object.keys(occasionStats).length > 0 ? (
                <ul className="stat-list">
                  {Object.entries(occasionStats).slice(0, 5).map(([occasion, count], index) => (
                    <li key={index} className="occasion-stat-item">
                      <span className="occasion-name">{occasion}</span>
                      <div className="occasion-bar-container">
                        <div 
                          className="occasion-bar"
                          style={{ width: `${Math.min(100, count * 10)}%` }}
                        ></div>
                        <span className="occasion-count">{count} times</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-stats">Add more outfits to see your most common occasions</p>
              )}
            </div>
            
            <div className="stat-card">
              <h3>Clothing By Category</h3>
              {statistics && statistics.clothing_by_category ? (
                <ul className="stat-list">
                  {Object.entries(statistics.clothing_by_category).map(([category, count]) => (
                    <li key={category}>
                      <span className="item-part">{category}</span>
                      <span className="item-count">{count} items</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-stats">No clothing categories available</p>
              )}
            </div>
          </div>
          
          {/* Todo list moved below Style Analytics */}
          <div className="todo-section">
            <h3>My Fashion To-Do List</h3>
            <ul className="todo-list">
              {todoList.map(task => (
                <li key={task.id} className="todo-item">
                  <div className="todo-content">
                    <span 
                      className={`todo-checkbox ${task.complete ? 'completed' : ''}`}
                      onClick={() => toggleTodoComplete(task.id)}
                    >
                      {task.complete ? <FaCheck /> : ''}
                    </span>
                    <span 
                      className={`todo-text ${task.complete ? 'completed' : ''}`}
                      onClick={() => toggleTodoComplete(task.id)}
                    >
                      {task.task}
                    </span>
                    {task.due_date && (
                      <span className="todo-due-date">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button 
                    className="delete-todo"
                    onClick={() => deleteTodoTask(task.id)}
                  >
                    <FaTimes />
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="add-todo-form">
              <input
                type="text"
                placeholder="Add new fashion task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTodoTask();
                  }
                }}
              />
              <button 
                className="add-todo-btn"
                onClick={addTodoTask}
                disabled={!newTask.trim()}
              >
                <FaPlusCircle />
              </button>
            </div>
          </div>
        </div>
        
        <div className="upcoming-occasions">
          <h2>Upcoming Occasions</h2>
          
          <div className="add-occasion-form">
            <div className="occasion-form-row">
              <input 
                type="date" 
                value={newOccasion.date}
                onChange={(e) => setNewOccasion({...newOccasion, date: e.target.value})}
                placeholder="Date"
              />
              <input 
                type="text" 
                value={newOccasion.name}
                onChange={(e) => setNewOccasion({...newOccasion, name: e.target.value})}
                placeholder="Occasion name"
              />
            </div>
            <div className="occasion-form-row">
              <input 
                type="text" 
                value={newOccasion.notes}
                onChange={(e) => setNewOccasion({...newOccasion, notes: e.target.value})}
                placeholder="Notes (optional)"
                className="occasion-notes-input"
              />
              <button 
                onClick={addUpcomingOccasion}
                disabled={!newOccasion.date || !newOccasion.name}
              >
                Add
              </button>
            </div>
          </div>
          
          <ul className="occasions-list">
            {upcomingOccasions.length === 0 ? (
              <li className="no-occasions">No upcoming occasions. Add one above!</li>
            ) : (
              upcomingOccasions
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(occasion => (
                  <li key={occasion.id} className="occasion-item">
                    <div className="occasion-info">
                      <div className="occasion-date">
                        <FaCalendarAlt className="occasion-icon" />
                        {new Date(occasion.date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                      <div className="occasion-name">{occasion.name}</div>
                      {occasion.notes && <div className="occasion-notes">{occasion.notes}</div>}
                    </div>
                    <div className="occasion-actions">
                      <button 
                        className="plan-outfit-btn"
                        onClick={() => navigate('/outfit')}
                      >
                        Plan Outfit
                      </button>
                      <button 
                        className="delete-occasion"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteUpcomingOccasion(occasion.id);
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </li>
                ))
            )}
          </ul>
        </div>
      </div>
      
      {/* Add Entry Modal - Redesigned for better layout */}
      {showAddModal && (
        <Modal onClose={() => {
          setShowAddModal(false);
          stopCamera();
          setCapturedImage(null);
          setUploadedImage(null);
        }}>
          <div className="add-entry-modal">
            <h2>Add What I Wore Today</h2>
            
            <div className="modal-form-container">
              <div className="modal-left-column">
                <div className="form-group">
                  <label>Date:</label>
                  <input 
                    type="date" 
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Occasion:</label>
                  <select 
                    value={newEntry.occasion}
                    onChange={(e) => setNewEntry({...newEntry, occasion: e.target.value})}
                  >
                    <option value="">Select an occasion</option>
                    <option value="Work">Work</option>
                    <option value="Casual">Casual</option>
                    <option value="Party">Party</option>
                    <option value="Formal">Formal</option>
                    <option value="Date">Date</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Interview">Interview</option>
                    <option value="Other">Other</option>
                  </select>
                  {newEntry.occasion === "Other" && (
                    <input 
                      type="text" 
                      placeholder="Specify occasion"
                      className="other-occasion-input"
                      onChange={(e) => setNewEntry({...newEntry, occasion: e.target.value})}
                    />
                  )}
                </div>
                
                <div className="form-group">
                  <label>Rate Your Outfit:</label>
                  <RatingSelector 
                    value={newEntry.rating} 
                    onChange={handleRatingChange} 
                  />
                </div>
                
                <div className="form-group">
                  <label>Upload Today's Outfit:</label>
                  <div className="image-capture-controls">
                    {!showCamera && !capturedImage && (
                      <div className="capture-buttons">
                        <button className="camera-btn" onClick={startCamera}>
                          <FaCamera /> Use Camera
                        </button>
                        <div className="upload-btn-wrapper">
                          <button className="upload-btn">
                            <FaUpload /> Upload Image
                          </button>
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                        </div>
                      </div>
                    )}
                    
                    {showCamera && (
                      <div className="camera-container">
                        <video 
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="camera-preview"
                        ></video>
                        <div className="camera-actions">
                          <button onClick={captureImage}>Capture</button>
                          <button onClick={stopCamera}>Cancel</button>
                        </div>
                      </div>
                    )}
                    
                    {capturedImage && (
                      <div className="captured-image-container">
                        <img 
                          src={capturedImage}
                          alt="Captured"
                          className="captured-image"
                        />
                        <button 
                          className="remove-image"
                          onClick={() => {
                            setCapturedImage(null);
                            setUploadedImage(null);
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                    
                    {/* Hidden canvas for image capture */}
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                  </div>
                </div>
              </div>
              
              <div className="modal-right-column">
                <div className="form-group">
                  <label>Description:</label>
                  <textarea 
                    placeholder="Describe your outfit, where you wore it, compliments received, etc."
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label>How to Improve:</label>
                  <textarea 
                    placeholder="What would make this outfit better next time?"
                    value={newEntry.improveOutput}
                    onChange={(e) => setNewEntry({...newEntry, improveOutput: e.target.value})}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setShowAddModal(false);
                  stopCamera();
                  setCapturedImage(null);
                  setUploadedImage(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleAddEntry}
              >
                Save Entry
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* View Entry Modal */}
      {showViewModal && selectedEntry && (
        <Modal onClose={() => setShowViewModal(false)}>
          <div className="view-entry-modal">
            <div className="entry-header">
              <h2>Outfit Details</h2>
              <div className="entry-date-large">
                {new Date(selectedEntry.date).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            <div className="outfit-display">
              {selectedEntry.image ? (
                <div className="entry-image-container">
                  <img 
                    src={`data:image/jpeg;base64,${selectedEntry.image}`}
                    alt="Outfit" 
                    className="entry-full-image"
                  />
                </div>
              ) : selectedOutfit.length > 0 ? (
                <div className="outfit-images">
                  {selectedOutfit.map(item => (
                    <div key={item.uuid} className="outfit-item">
                      <img 
                        src={`data:image/png;base64,${item.imageData}`} 
                        alt={`${item.clothes_part} item`} 
                      />
                      <div className="item-category">{item.clothes_part}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-outfit-preview">
                  <p>No outfit image available</p>
                </div>
              )}
            </div>
            
            <div className="entry-details-container">
              <div className="entry-metadata">
                {selectedEntry.occasion && (
                  <div className="entry-occasion-badge">
                    {selectedEntry.occasion}
                  </div>
                )}
                
                {selectedEntry.weather && selectedEntry.weather.includes("Rating:") && (
                  <div className="entry-rating-badge">
                    {selectedEntry.weather.replace("Rating: ", "")}
                  </div>
                )}
                
                <button 
                  className={`favorite-btn large ${favoriteEntries.includes(selectedEntry.uuid) ? 'favorited' : ''}`}
                  onClick={() => toggleFavorite(selectedEntry.uuid)}
                >
                  {favoriteEntries.includes(selectedEntry.uuid) ? '★ Favorited' : '☆ Add to Favorites'}
                </button>
              </div>
              
              <div className="entry-details">
                {selectedEntry.description && (
                  <div className="detail-group">
                    <h3>Description</h3>
                    <p>{selectedEntry.description}</p>
                  </div>
                )}
                
                {selectedEntry.notes && (
                  <div className="detail-group">
                    <h3>Improvement Notes</h3>
                    <p>{selectedEntry.notes}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="delete-btn" 
                onClick={() => handleDeleteEntry(selectedEntry.uuid)}
              >
                <FaTrash /> Delete Entry
              </button>
              <button 
                className="close-btn"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyVault;