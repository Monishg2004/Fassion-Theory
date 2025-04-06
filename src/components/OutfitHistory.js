// OutfitHistory.js
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Tag, Edit2, Trash2, Save, X, Plus } from 'lucide-react';
import Modal from './Modal';
import './OutfitHistory.css';

const OutfitHistory = () => {
  const [outfitHistory, setOutfitHistory] = useState([]);
  const [favouriteFits, setFavouriteFits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    outfit_uuid: '',
    occasion: '',
    notes: '',
    date_worn: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Fetch outfit history
    fetchOutfitHistory();
    
    // Fetch favorite fits
    fetchFavouriteFits();
  }, []);
  
  const fetchOutfitHistory = async () => {
    try {
      const response = await fetch('/get_outfit_history');
      if (response.ok) {
        const data = await response.json();
        // Sort history by date, newest first
        const sortedData = data.sort((a, b) => new Date(b.date_worn) - new Date(a.date_worn));
        setOutfitHistory(sortedData);
      }
    } catch (error) {
      console.error('Error fetching outfit history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFavouriteFits = async () => {
    try {
      const response = await fetch('/get_favourite_fits');
      if (response.ok) {
        const data = await response.json();
        setFavouriteFits(data);
      }
    } catch (error) {
      console.error('Error fetching favourite fits:', error);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleOutfitSelect = (outfit) => {
    setSelectedOutfit(outfit);
    setFormData(prev => ({
      ...prev,
      outfit_uuid: outfit.uuid
    }));
  };
  
  const handleAddOutfitToHistory = async () => {
    if (!formData.outfit_uuid) {
      alert('Please select an outfit');
      return;
    }
    
    try {
      const response = await fetch('/add_outfit_to_history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        // Refresh history
        fetchOutfitHistory();
        setShowAddModal(false);
        
        // Reset form
        setFormData({
          outfit_uuid: '',
          occasion: '',
          notes: '',
          date_worn: new Date().toISOString().split('T')[0]
        });
        setSelectedOutfit(null);
      } else {
        console.error('Failed to add outfit to history:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding outfit to history:', error);
    }
  };
  
  const handleEditHistoryEntry = (entry) => {
    setSelectedHistoryEntry(entry);
    setShowEditModal(true);
    
    // Find the outfit by uuid
    const outfit = favouriteFits.find(fit => fit.uuid === entry.outfit.uuid);
    setSelectedOutfit(outfit);
    
    setFormData({
      outfit_uuid: entry.outfit.uuid,
      occasion: entry.occasion || '',
      notes: entry.notes || '',
      date_worn: new Date(entry.date_worn).toISOString().split('T')[0]
    });
  };
  
  const handleUpdateHistoryEntry = async () => {
    if (!selectedHistoryEntry) return;
    
    try {
      // First remove the old entry
      const removeResponse = await fetch('/remove_outfit_from_history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history_uuid: selectedHistoryEntry.uuid
        }),
      });
      
      if (removeResponse.ok) {
        // Then add the updated entry
        const addResponse = await fetch('/add_outfit_to_history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (addResponse.ok) {
          // Refresh history
          fetchOutfitHistory();
          setShowEditModal(false);
          
          // Reset form
          setFormData({
            outfit_uuid: '',
            occasion: '',
            notes: '',
            date_worn: new Date().toISOString().split('T')[0]
          });
          setSelectedOutfit(null);
          setSelectedHistoryEntry(null);
        } else {
          console.error('Failed to add updated entry:', addResponse.statusText);
        }
      } else {
        console.error('Failed to remove old entry:', removeResponse.statusText);
      }
    } catch (error) {
      console.error('Error updating history entry:', error);
    }
  };
  
  const handleDeleteHistoryEntry = async (entry) => {
    if (!window.confirm('Are you sure you want to remove this outfit from your history?')) {
      return;
    }
    
    try {
      const response = await fetch('/remove_outfit_from_history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history_uuid: entry.uuid
        }),
      });
      
      if (response.ok) {
        // Refresh history
        fetchOutfitHistory();
        
        // Close modal if open
        if (showEditModal && selectedHistoryEntry?.uuid === entry.uuid) {
          setShowEditModal(false);
          setSelectedHistoryEntry(null);
        }
      } else {
        console.error('Failed to delete history entry:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting history entry:', error);
    }
  };
  
  const renderOutfitCard = (outfit, isSelected = false, onClick = null) => {
    return (
      <div 
        className={`outfit-card ${isSelected ? 'selected' : ''}`} 
        onClick={onClick ? () => onClick(outfit) : null}
      >
        <div className="outfit-images">
          {outfit.clothes.map(clothing => (
            <div key={clothing.uuid} className="outfit-thumbnail">
              <img 
                src={`/get_image?uuid=${clothing.uuid}`} 
                alt="Clothing item" 
              />
            </div>
          ))}
        </div>
        <div className="outfit-parts">
          {Array.from(new Set(outfit.clothes.map(item => item.clothes_part))).map(part => (
            <span key={part} className="outfit-part-tag">{part}</span>
          ))}
        </div>
      </div>
    );
  };
  
  // Group history entries by month and year
  const groupHistoryByMonth = () => {
    const groups = {};
    
    outfitHistory.forEach(entry => {
      const date = new Date(entry.date_worn);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!groups[key]) {
        groups[key] = {
          title: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          entries: []
        };
      }
      
      groups[key].entries.push(entry);
    });
    
    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(a.entries[0].date_worn);
      const dateB = new Date(b.entries[0].date_worn);
      return dateB - dateA;
    });
  };
  
  const groupedHistory = groupHistoryByMonth();
  
  return (
    <div className="outfit-history-container">
      <div className="history-header">
        <h1>Outfit History</h1>
        <p>Keep track of what you've worn to avoid repetition</p>
        <button className="add-history-button" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Log Outfit
        </button>
      </div>
      
      {loading ? (
        <div className="history-loading">
          <div className="loading-spinner"></div>
          <p>Loading your outfit history...</p>
        </div>
      ) : (
        <>
          {outfitHistory.length === 0 ? (
            <div className="empty-history">
              <h3>No outfit history yet</h3>
              <p>Start logging your outfits to track your style journey</p>
              <button className="primary-button" onClick={() => setShowAddModal(true)}>Log Your First Outfit</button>
            </div>
          ) : (
            <div className="history-timeline">
              {groupedHistory.map(group => (
                <div key={group.title} className="history-month">
                  <h3 className="month-heading">{group.title}</h3>
                  
                  {group.entries.map(entry => {
                    const date = new Date(entry.date_worn);
                    return (
                      <div key={entry.uuid} className="history-entry">
                        <div className="entry-date">
                          <Calendar size={16} />
                          <span>{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                        
                        <div className="entry-content">
                          <div className="entry-outfit">
                            <div className="outfit-thumbnails">
                              {entry.outfit.clothes.map(clothing => (
                                <div key={clothing.uuid} className="history-thumbnail">
                                  <img 
                                    src={`/get_image?uuid=${clothing.uuid}`} 
                                    alt="Clothing item" 
                                  />
                                </div>
                              ))}
                            </div>
                            
                            <div className="entry-details">
                              {entry.occasion && (
                                <div className="entry-occasion">
                                  <Tag size={14} />
                                  <span>{entry.occasion}</span>
                                </div>
                              )}
                              
                              {entry.notes && (
                                <p className="entry-notes">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="entry-actions">
                            <button className="icon-action edit-action" onClick={() => handleEditHistoryEntry(entry)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="icon-action delete-action" onClick={() => handleDeleteHistoryEntry(entry)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Add History Entry Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="history-modal">
            <h2>Log Outfit to History</h2>
            
            <div className="modal-form">
              <div className="form-group">
                <label>Select an Outfit</label>
                <div className="outfit-selector">
                  {favouriteFits.length === 0 ? (
                    <p className="no-outfits-message">You don't have any saved outfits yet. Save an outfit first.</p>
                  ) : (
                    <div className="outfit-grid">
                      {favouriteFits.map(outfit => renderOutfitCard(
                        outfit, 
                        selectedOutfit?.uuid === outfit.uuid,
                        handleOutfitSelect
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Date Worn</label>
                <div className="date-input">
                  <Calendar size={16} />
                  <input 
                    type="date" 
                    name="date_worn" 
                    value={formData.date_worn} 
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Occasion (optional)</label>
                <input 
                  type="text" 
                  name="occasion" 
                  value={formData.occasion} 
                  onChange={handleInputChange} 
                  placeholder="e.g. Work, Date Night, Wedding"
                />
              </div>
              
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  placeholder="How did you feel in this outfit? Any compliments received?"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="modal-actions">
                <button className="cancel-button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button 
                  className="save-button" 
                  onClick={handleAddOutfitToHistory}
                  disabled={!formData.outfit_uuid}
                >
                  Log Outfit
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Edit History Entry Modal */}
      {showEditModal && selectedHistoryEntry && (
        <Modal onClose={() => setShowEditModal(false)}>
          <div className="history-modal">
            <h2>Edit History Entry</h2>
            
            <div className="modal-form">
              <div className="form-group">
                <label>Select an Outfit</label>
                <div className="outfit-selector">
                  {favouriteFits.length === 0 ? (
                    <p className="no-outfits-message">You don't have any saved outfits yet.</p>
                  ) : (
                    <div className="outfit-grid">
                      {favouriteFits.map(outfit => renderOutfitCard(
                        outfit, 
                        selectedOutfit?.uuid === outfit.uuid,
                        handleOutfitSelect
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-group">
                <label>Date Worn</label>
                <div className="date-input">
                  <Calendar size={16} />
                  <input 
                    type="date" 
                    name="date_worn" 
                    value={formData.date_worn} 
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Occasion (optional)</label>
                <input 
                  type="text" 
                  name="occasion" 
                  value={formData.occasion} 
                  onChange={handleInputChange} 
                  placeholder="e.g. Work, Date Night, Wedding"
                />
              </div>
              
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  placeholder="How did you feel in this outfit? Any compliments received?"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="delete-button" 
                  onClick={() => handleDeleteHistoryEntry(selectedHistoryEntry)}
                >
                  Delete
                </button>
                <div className="right-actions">
                  <button className="cancel-button" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button 
                    className="save-button" 
                    onClick={handleUpdateHistoryEntry}
                    disabled={!formData.outfit_uuid}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OutfitHistory;