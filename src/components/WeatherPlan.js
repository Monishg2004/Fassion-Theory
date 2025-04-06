

// // WeatherPlan.js
// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import './WeatherPlan.css';

// // Import react-icons weather icons
// import { 
//   WiDaySunny, WiNightClear, WiDayCloudy, WiNightCloudy, 
//   WiCloud, WiCloudy, WiRain, WiDayRain, WiNightRain,
//   WiThunderstorm, WiSnow, WiDayFog, WiNightFog, WiDust 
// } from 'react-icons/wi';

// // Import icons for the fabric popup
// import { FaTimes, FaTshirt, FaInfoCircle } from 'react-icons/fa';

// const WeatherPlan = () => {
//   const [weatherData, setWeatherData] = useState(null);
//   const [forecastData, setForecastData] = useState([]);
//   const [location, setLocation] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [clothingSuggestions, setClothingSuggestions] = useState(null);
//   const [fabricSuggestions, setFabricSuggestions] = useState(null);
//   const [chatMessages, setChatMessages] = useState([]);
//   const [chatInput, setChatInput] = useState('');
//   const [userLocation, setUserLocation] = useState('');
//   const [locationInput, setLocationInput] = useState('');
//   const [error, setError] = useState(null);
//   const [selectedDay, setSelectedDay] = useState(0); // 0 = today
//   const [showFabricPopup, setShowFabricPopup] = useState(false);
//   const [showOutfitPopup, setShowOutfitPopup] = useState(false);
//   const [userCoords, setUserCoords] = useState(null);
  
//   const chatContainerRef = useRef(null);
//   const navigate = useNavigate();
  
//   // Fetch user's geolocation on component mount
//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           setUserCoords({ lat: latitude, lon: longitude });
//           fetchWeatherByCoords(latitude, longitude);
//           fetchLocationName(latitude, longitude);
//         },
//         (error) => {
//           console.error("Geolocation error:", error);
//           setLoading(false);
//           setError("Couldn't get your location. Please enter it manually.");
//         }
//       );
//     } else {
//       setLoading(false);
//       setError("Geolocation is not supported by your browser. Please enter your location manually.");
//     }
//   }, []);
  
//   // Scroll to bottom of chat when messages change
//   useEffect(() => {
//     if (chatContainerRef.current) {
//       chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
//     }
//   }, [chatMessages]);
  
//   const fetchWeatherByCoords = async (lat, lon) => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`/get_weather_by_coords?lat=${lat}&lon=${lon}`);
//       setWeatherData(response.data.current);
      
//       // Process forecast data
//       const forecastList = response.data.forecast.list || [];
//       const processedForecast = processForecastData(forecastList);
//       setForecastData(processedForecast);
      
//       // Set user coordinates for later use
//       setUserCoords({ lat, lon });
      
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching weather:", error);
//       setError("Failed to fetch weather data. Please try again.");
//       setLoading(false);
//     }
//   };
  
//   const fetchLocationName = async (lat, lon) => {
//     try {
//       const response = await axios.get(
//         `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=9f27863d71796d3b766af8cda018fd8f`
//       );
      
//       if (response.data && response.data.length > 0) {
//         const locationName = response.data[0].name;
//         setUserLocation(locationName);
//         setLocation(locationName);
//       }
//     } catch (error) {
//       console.error("Error fetching location name:", error);
//     }
//   };
  
//   const fetchWeatherByLocation = async (locationName) => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`/get_weather?location=${encodeURIComponent(locationName)}`);
//       setWeatherData(response.data.current);
      
//       // Store the location
//       setLocation(locationName);
      
//       // Process forecast data
//       const dailySummary = response.data.daily_summary || [];
//       setForecastData(dailySummary);
      
//       // Use location parameter for clothing suggestions
//       fetchClothingSuggestionsByLocation(locationName);
      
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching weather:", error);
//       setError("Failed to fetch weather data. Please try again.");
//       setLoading(false);
//     }
//   };
  
//   const fetchClothingSuggestionsByLocation = async (locationName) => {
//     if (!locationName || locationName.trim() === '') {
//       console.error("Empty location name");
//       return;
//     }
    
//     try {
//       const response = await axios.get(`/get_clothing_suggestion?location=${encodeURIComponent(locationName)}`);
//       setClothingSuggestions(response.data);
//     } catch (error) {
//       console.error("Error fetching clothing suggestions by location:", error);
//     }
//   };
  
//   const fetchClothingSuggestionsByCoords = async () => {
//     if (!userCoords) {
//       console.error("No coordinates available");
//       return;
//     }
    
//     try {
//       const response = await axios.get(`/get_clothing_recommendation_by_coords?lat=${userCoords.lat}&lon=${userCoords.lon}`);
//       setClothingSuggestions(response.data);
//     } catch (error) {
//       console.error("Error fetching clothing suggestions by coordinates:", error);
//     }
//   };
  
//   const fetchFabricSuggestions = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`/get_fabric_suggestions?location=${encodeURIComponent(location || userLocation)}`);
//       setFabricSuggestions(response.data);
//       setShowFabricPopup(true);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching fabric suggestions:", error);
//       setLoading(false);
//     }
//   };
  
//   const handleLocationSearch = (e) => {
//     e.preventDefault();
//     if (locationInput.trim()) {
//       fetchWeatherByLocation(locationInput.trim());
//     }
//   };
  
//   // const handleChatSubmit = async (e) => {
//   //   e.preventDefault();
    
//   //   if (!chatInput.trim()) return;
    
//   //   // Add user message to chat
//   //   const userMessage = {
//   //     type: 'user',
//   //     text: chatInput
//   //   };
    
//   //   setChatMessages([...chatMessages, userMessage]);
//   //   setChatInput('');
    
//   //   try {
//   //     // Send message to chatbot API
//   //     const response = await axios.post('/chatbot', {
//   //       message: chatInput,
//   //       location: location || userLocation
//   //     });
      
//   //     // Add bot response to chat
//   //     const botMessage = {
//   //       type: 'bot',
//   //       text: response.data.response
//   //     };
      
//   //     setChatMessages([...chatMessages, userMessage, botMessage]);
//   //   } catch (error) {
//   //     console.error("Error getting chatbot response:", error);
      
//   //     // Add error message to chat
//   //     const errorMessage = {
//   //       type: 'bot',
//   //       text: "Sorry, I'm having trouble connecting. Please try again later."
//   //     };
      
//   //     setChatMessages([...chatMessages, userMessage, errorMessage]);
//   //   }
//   // };
//   // Update the handleChatSubmit function in WeatherPlan.js
// const handleChatSubmit = async (e) => {
//   e.preventDefault();
  
//   if (!chatInput.trim()) return;
  
//   // Add user message to chat
//   const userMessage = {
//     type: 'user',
//     text: chatInput
//   };
  
//   setChatMessages([...chatMessages, userMessage]);
//   setChatInput('');
  
//   try {
//     // Add loading message
//     const loadingMessage = {
//       type: 'bot',
//       text: "Thinking...",
//       isLoading: true
//     };
    
//     setChatMessages([...chatMessages, userMessage, loadingMessage]);
    
//     // Get any client-side data to send to the chatbot
//     let clientData = {};
    
//     // Try to get todos from localStorage
//     try {
//       const todoListStr = localStorage.getItem('todoList');
//       if (todoListStr) {
//         clientData.todoList = todoListStr;
//       }
//     } catch (err) {
//       console.log("Error reading todoList from localStorage:", err);
//     }
    
//     // Try to get occasions from localStorage
//     try {
//       const occasionsStr = localStorage.getItem('upcomingOccasions');
//       if (occasionsStr) {
//         clientData.upcomingOccasions = occasionsStr;
//       }
//     } catch (err) {
//       console.log("Error reading upcomingOccasions from localStorage:", err);
//     }
    
//     // Send message to chatbot API with client data
//     const response = await axios.post('/chatbot', {
//       message: chatInput,
//       location: location || userLocation,
//       clientData: clientData
//     }, {
//       // Set cookies to pass todoList and upcomingOccasions
//       withCredentials: true
//     });
    
//     // Remove loading message and add actual response
//     const botMessage = {
//       type: 'bot',
//       text: response.data.response
//     };
    
//     // Log debug info if present
//     if (response.data.debug_info) {
//       console.log("Chatbot debug info:", response.data.debug_info);
//     }
    
//     setChatMessages(prev => {
//       // Filter out loading message and add real response
//       const filteredMessages = prev.filter(msg => !msg.isLoading);
//       return [...filteredMessages, botMessage];
//     });
//   } catch (error) {
//     console.error("Error getting chatbot response:", error);
    
//     // Add error message to chat
//     const errorMessage = {
//       type: 'bot',
//       text: "Sorry, I'm having trouble connecting. Please try again later."
//     };
    
//     setChatMessages(prev => {
//       // Filter out loading message and add error message
//       const filteredMessages = prev.filter(msg => !msg.isLoading);
//       return [...filteredMessages, errorMessage];
//     });
//   }
// };

  
//   const processForecastData = (forecastList) => {
//     // Group forecast items by day
//     const dailyForecasts = {};
    
//     forecastList.forEach(item => {
//       const date = new Date(item.dt * 1000);
//       const dateStr = date.toISOString().split('T')[0];
      
//       if (!dailyForecasts[dateStr]) {
//         dailyForecasts[dateStr] = {
//           date: dateStr,
//           temps: [],
//           weather: [],
//           icons: []
//         };
//       }
      
//       dailyForecasts[dateStr].temps.push(item.main.temp);
//       dailyForecasts[dateStr].weather.push(item.weather[0].main);
//       dailyForecasts[dateStr].icons.push(item.weather[0].icon);
//     });
    
//     // Process daily data
//     return Object.values(dailyForecasts).map(day => {
//       // Get most common weather condition
//       const weatherCounts = {};
//       day.weather.forEach(w => {
//         weatherCounts[w] = (weatherCounts[w] || 0) + 1;
//       });
      
//       const mainWeather = Object.entries(weatherCounts)
//         .sort((a, b) => b[1] - a[1])[0][0];
      
//       return {
//         date: day.date,
//         min_temp: Math.min(...day.temps),
//         max_temp: Math.max(...day.temps),
//         avg_temp: day.temps.reduce((sum, temp) => sum + temp, 0) / day.temps.length,
//         main_weather: mainWeather,
//         icon: day.icons.find(icon => icon.includes('d')) || day.icons[0] // Prefer day icons
//       };
//     });
//   };
  
//   const getWeatherIcon = (iconCode, size = 50) => {
//     const iconMap = {
//       '01d': <WiDaySunny size={size} color="#FF9800" />,
//       '01n': <WiNightClear size={size} color="#5C5CFF" />,
//       '02d': <WiDayCloudy size={size} color="#FF9800" />,
//       '02n': <WiNightCloudy size={size} color="#5C5CFF" />,
//       '03d': <WiCloud size={size} color="#BBBBBB" />,
//       '03n': <WiCloud size={size} color="#BBBBBB" />,
//       '04d': <WiCloudy size={size} color="#BBBBBB" />,
//       '04n': <WiCloudy size={size} color="#BBBBBB" />,
//       '09d': <WiRain size={size} color="#29B6F6" />,
//       '09n': <WiRain size={size} color="#29B6F6" />,
//       '10d': <WiDayRain size={size} color="#29B6F6" />,
//       '10n': <WiNightRain size={size} color="#29B6F6" />,
//       '11d': <WiThunderstorm size={size} color="#5C5CFF" />,
//       '11n': <WiThunderstorm size={size} color="#5C5CFF" />,
//       '13d': <WiSnow size={size} color="#E1F5FE" />,
//       '13n': <WiSnow size={size} color="#E1F5FE" />,
//       '50d': <WiDayFog size={size} color="#BBBBBB" />,
//       '50n': <WiNightFog size={size} color="#BBBBBB" />,
//     };
    
//     // Default icon if code not found
//     return iconMap[iconCode] || <WiDaySunny size={size} color="#FF9800" />;
//   };
  
//   const getWeatherBackgroundClass = (weatherMain) => {
//     if (!weatherMain) return 'bg-default';
    
//     const weather = weatherMain.toLowerCase();
//     if (weather.includes('clear') || weather.includes('sun')) return 'bg-clear';
//     if (weather.includes('cloud')) return 'bg-cloudy';
//     if (weather.includes('rain') || weather.includes('drizzle')) return 'bg-rainy';
//     if (weather.includes('snow')) return 'bg-snowy';
//     if (weather.includes('thunder')) return 'bg-stormy';
//     if (weather.includes('fog') || weather.includes('mist') || weather.includes('haze')) return 'bg-foggy';
    
//     return 'bg-default';
//   };
  
//   const formatDate = (dateStr) => {
//     const date = new Date(dateStr);
//     const today = new Date();
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);
    
//     if (date.toDateString() === today.toDateString()) {
//       return 'Today';
//     } else if (date.toDateString() === tomorrow.toDateString()) {
//       return 'Tomorrow';
//     } else {
//       return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
//     }
//   };
  
//   const handleDaySelect = (index) => {
//     setSelectedDay(index);
//   };
  
//   const navigateToOutfitCreator = () => {
//     navigate('/outfit');
//   };
  
//   const navigateToWardrobe = () => {
//     navigate('/wardrobe');
//   };
  
//   const handleOpenOutfitPopup = () => {
//     // Fetch clothing suggestions by coordinates if available
//     if (userCoords) {
//       fetchClothingSuggestionsByCoords();
//     } else if (location) {
//       fetchClothingSuggestionsByLocation(location);
//     }
    
//     setShowOutfitPopup(true);
//   };
  
//   const handleCloseOutfitPopup = () => {
//     setShowOutfitPopup(false);
//   };

//   const handleCloseFabricPopup = () => {
//     setShowFabricPopup(false);
//   };
  
//   if (loading) {
//     return (
//       <div className="weather-plan-container">
//         <div className="loading-spinner">
//           <div className="spinner"></div>
//           <p>Loading weather information...</p>
//         </div>
//       </div>
//     );
//   }
  
//   if (error) {
//     return (
//       <div className="weather-plan-container">
//         <div className="error-container">
//           <h2>Oops! {error}</h2>
//           <form onSubmit={handleLocationSearch} className="location-search">
//             <input
//               type="text"
//               value={locationInput}
//               onChange={(e) => setLocationInput(e.target.value)}
//               placeholder="Enter your city"
//               className="location-input"
//             />
//             <button type="submit" className="search-button">
//               <i className="fas fa-search"></i>
//             </button>
//           </form>
//         </div>
//       </div>
//     );
//   }
  
//   return (
//     <div className={`weather-plan-container ${weatherData ? getWeatherBackgroundClass(weatherData.weather[0].main) : 'bg-default'}`}>
//       {/* Header section */}
//       <div className="weather-plan-header">
//         <form onSubmit={handleLocationSearch} className="location-search">
//           <input
//             type="text"
//             value={locationInput}
//             onChange={(e) => setLocationInput(e.target.value)}
//             placeholder={location || "Enter your city"}
//             className="location-input"
//           />
//           <button type="submit" className="search-button">
//             <i className="fas fa-search"></i>
//           </button>
//         </form>
//         <button className="header-outfit-btn" onClick={handleOpenOutfitPopup}>
//           <FaTshirt className="outfit-btn-icon" /> Suggested Outfit
//         </button>
//       </div>
      
//       {/* Weather display */}
//       {weatherData && (
//         <div className="weather-display">
//           <div className="current-weather">
//             <h2>{location}</h2>
//             <div className="weather-icon-large">
//               {getWeatherIcon(weatherData.weather[0].icon, 100)}
//             </div>
//             <div className="temperature">
//               {Math.round(weatherData.main.temp)}°C
//             </div>
//             <div className="weather-description">
//               {weatherData.weather[0].description}
//             </div>
//             <div className="weather-details">
//               <div className="detail">
//                 <i className="fas fa-tint"></i> {weatherData.main.humidity}%
//               </div>
//               <div className="detail">
//                 <i className="fas fa-wind"></i> {Math.round(weatherData.wind.speed)} m/s
//               </div>
//             </div>
//           </div>
          
//           {/* Forecast */}
//           <div className="forecast">
//             {forecastData.slice(0, 5).map((day, index) => (
//               <div 
//                 key={day.date} 
//                 className={`forecast-day ${selectedDay === index ? 'selected' : ''}`}
//                 onClick={() => handleDaySelect(index)}
//               >
//                 <div className="day-name">{formatDate(day.date)}</div>
//                 <div className="forecast-icon">
//                   {getWeatherIcon(day.icon, 40)}
//                 </div>
//                 <div className="forecast-temp">
//                   {Math.round(day.min_temp)}° - {Math.round(day.max_temp)}°
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
      
//       {/* Outfit Popup */}
//       {showOutfitPopup && clothingSuggestions && (
//         <div className="outfit-popup-overlay">
//           <div className="outfit-popup">
//             <div className="outfit-popup-header">
//               <h2><FaTshirt className="outfit-icon" /> Suggested Outfit</h2>
//               <button className="close-popup-btn" onClick={handleCloseOutfitPopup}>
//                 <FaTimes />
//               </button>
//             </div>
            
//             <div className="outfit-popup-content">
//               {clothingSuggestions.weather_summary && (
//                 <div className="weather-summary">
//                   <p><i className="fas fa-thermometer-half"></i> Current conditions: {clothingSuggestions.weather_summary}</p>
//                 </div>
//               )}
              
//               {clothingSuggestions.outfit_explanation && (
//                 <div className="outfit-explanation">
//                   <p><i className="fas fa-info-circle"></i> {clothingSuggestions.outfit_explanation}</p>
//                 </div>
//               )}
              
//               <div className="outfit-categories">
//                 {clothingSuggestions.top.length > 0 && (
//                   <div className="outfit-category">
//                     <h4>Top</h4>
//                     <ul>
//                       {clothingSuggestions.top.map((item, index) => (
//                         <li key={`top-${index}`}>{item}</li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}
                
//                 {clothingSuggestions.upper_body.length > 0 && (
//                   <div className="outfit-category">
//                     <h4>Upper Body</h4>
//                     <ul>
//                       {clothingSuggestions.upper_body.map((item, index) => (
//                         <li key={`upper-${index}`}>{item}</li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}
                
//                 {clothingSuggestions.lower_body.length > 0 && (
//                   <div className="outfit-category">
//                     <h4>Lower Body</h4>
//                     <ul>
//                       {clothingSuggestions.lower_body.map((item, index) => (
//                         <li key={`lower-${index}`}>{item}</li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}
                
//                 {clothingSuggestions.accessories.length > 0 && (
//                   <div className="outfit-category">
//                     <h4>Accessories</h4>
//                     <ul>
//                       {clothingSuggestions.accessories.map((item, index) => (
//                         <li key={`acc-${index}`}>{item}</li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}
//               </div>
              
//               {clothingSuggestions.material_recommendations && 
//                 clothingSuggestions.material_recommendations.recommended && 
//                 clothingSuggestions.material_recommendations.recommended.length > 0 && (
//                 <div className="recommended-materials">
//                   <h3>Recommended Materials</h3>
//                   <ul className="material-list">
//                     {clothingSuggestions.material_recommendations.recommended.map((material, index) => (
//                       <li key={`material-${index}`} className="material-item">
//                         <span className="material-name">{material.name}</span>
//                         <p className="material-properties">{material.properties}</p>
//                         {material.examples && (
//                           <p className="material-examples">Examples: {material.examples}</p>
//                         )}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
              
//               <div className="outfit-actions">
//                 <button className="create-outfit-btn" onClick={navigateToOutfitCreator}>
//                   CREATE OUTFIT
//                 </button>
//                 <button className="view-wardrobe-btn" onClick={navigateToWardrobe}>
//                   VIEW WARDROBE
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
      
//       {/* Fabric Suggestions Popup - Changed to only be shown when specifically requested */}
//       {showFabricPopup && fabricSuggestions && (
//         <div className="fabric-popup-overlay">
//           <div className="fabric-popup">
//             <div className="fabric-popup-header">
//               <h2><FaTshirt className="fabric-icon" /> Weather-Based Outfit Guide</h2>
//               <button className="close-popup-btn" onClick={handleCloseFabricPopup}>
//                 <FaTimes />
//               </button>
//             </div>
            
//             <div className="fabric-popup-content">
//               <div className="fabric-summary">
//                 <p><FaInfoCircle /> {fabricSuggestions.summary}</p>
//               </div>
              
//               <div className="fabric-list">
//                 <h3>Recommended Fabrics & Materials</h3>
//                 {fabricSuggestions.fabrics && fabricSuggestions.fabrics.map((fabric, index) => (
//                   <div key={`fabric-${index}`} className="fabric-item">
//                     <h4>{fabric.name}</h4>
//                     <p className="fabric-properties">{fabric.properties}</p>
//                     {fabric.suitable_for && (
//                       <p className="fabric-suitable">Best for: {fabric.suitable_for}</p>
//                     )}
//                   </div>
//                 ))}
//               </div>
              
//               {fabricSuggestions.materials_to_avoid && fabricSuggestions.materials_to_avoid.length > 0 && (
//                 <div className="materials-to-avoid">
//                   <h3>Materials to Avoid Today</h3>
//                   <ul>
//                     {fabricSuggestions.materials_to_avoid.map((material, index) => (
//                       <li key={`avoid-${index}`}>{material}</li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
              
//               {fabricSuggestions.layering_suggestion && (
//                 <div className="layering-suggestion">
//                   <h3>Styling Advice</h3>
//                   <p>{fabricSuggestions.layering_suggestion}</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
      
//       {/* Chatbot section */}
//       <div className="chatbot-container">
//         <div className="chat-header">
//           <h3>StyleBot</h3>
//           <p>Ask me about weather, outfits, or your schedule!</p>
//         </div>
        
//         <div className="chat-messages" ref={chatContainerRef}>
//           {chatMessages.length === 0 ? (
//             <div className="bot-message welcome-message">
//               <div className="bot-avatar">
//                 <i className="fas fa-robot"></i>
//               </div>
//               <div className="message-content">
//                 <p>Hi there! I'm StyleBot. I can help you with outfit suggestions, weather updates, and reminders about your upcoming events. What can I help you with today?</p>
//               </div>
//             </div>
//           ) : (
//             chatMessages.map((msg, index) => (
//               <div key={index} className={`${msg.type}-message`}>
//                 {msg.type === 'bot' && (
//                   <div className="bot-avatar">
//                     <i className="fas fa-robot"></i>
//                   </div>
//                 )}
//                 <div className="message-content">
//                   <p>{msg.text}</p>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
        
//         <form onSubmit={handleChatSubmit} className="chat-input-form">
//           <input
//             type="text"
//             value={chatInput}
//             onChange={(e) => setChatInput(e.target.value)}
//             placeholder="Ask StyleBot something..."
//             className="chat-input"
//           />
//           <button type="submit" className="send-button">
//             <i className="fas fa-paper-plane"></i>
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default WeatherPlan;

// WeatherPlan.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './WeatherPlan.css';

// Import react-icons weather icons
import { 
  WiDaySunny, WiNightClear, WiDayCloudy, WiNightCloudy, 
  WiCloud, WiCloudy, WiRain, WiDayRain, WiNightRain,
  WiThunderstorm, WiSnow, WiDayFog, WiNightFog, WiDust 
} from 'react-icons/wi';

// Import icons for the fabric popup
import { FaTimes, FaTshirt, FaInfoCircle } from 'react-icons/fa';

const WeatherPlan = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [clothingSuggestions, setClothingSuggestions] = useState(null);
  const [fabricSuggestions, setFabricSuggestions] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = today
  const [showFabricPopup, setShowFabricPopup] = useState(false);
  const [showOutfitPopup, setShowOutfitPopup] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  
  // Formatter function for chat messages
  const formatBotMessage = (text) => {
    // Check if message contains outfit rating/information
    if (text.includes('Outfit from') || text.includes('Rated:') || text.includes('Upcoming Occasions:')) {
      // Split sections where clear demarcation exists
      let sections = [];
      
      // Extract outfit sections
      const outfitSections = text.match(/Outfit from[\s\S]*?(?=Outfit from|Upcoming Occasions:|$)/g) || [];
      sections = [...sections, ...outfitSections];
      
      // Extract upcoming occasions
      const upcomingMatch = text.match(/Upcoming Occasions:[\s\S]*?(?=$)/);
      if (upcomingMatch) sections.push(upcomingMatch[0]);
      
      // If no clear sections were found, just use the original text
      if (sections.length === 0) {
        return <p>{text}</p>;
      }
      
      return (
        <div className="structured-data">
          {sections.map((section, index) => {
            if (section.trim().startsWith('Outfit from')) {
              // Format outfit information
              const dateMatch = section.match(/Outfit from ([\d-]+)/);
              const occasionMatch = section.match(/for ([^(]+)/);
              const ratingMatch = section.match(/\(Rated: (\d+)\/10\)/);
              const descriptionMatch = section.match(/Description: ([^*]+)/);
              const notesMatch = section.match(/Improvement Notes: ([^*]+)/);
              
              return (
                <div key={index} className="data-section">
                  <div className="section-title">
                    {dateMatch && <span className="date-pill">{dateMatch[1]}</span>}
                    Outfit {occasionMatch ? `for ${occasionMatch[1].trim()}` : ''}
                    {ratingMatch && <span className="rating-pill">{ratingMatch[1]}/10</span>}
                  </div>
                  
                  {descriptionMatch && (
                    <div className="data-item">
                      <strong>Description:</strong> {descriptionMatch[1].trim()}
                    </div>
                  )}
                  
                  {notesMatch && (
                    <div className="notes-box">
                      {notesMatch[1].trim()}
                    </div>
                  )}
                </div>
              );
            } else if (section.trim().startsWith('Upcoming Occasions:')) {
              // Format upcoming occasions
              const occasionItems = section.replace('Upcoming Occasions:', '').split('*').filter(item => item.trim());
              
              return (
                <div key={index} className="data-section">
                  <div className="section-title">Upcoming Occasions</div>
                  <ul className="data-list">
                    {occasionItems.map((item, i) => {
                      const dateMatch = item.match(/on ([\d-]+)/);
                      const nameMatch = item.match(/([^:]+)(?::|$)/);
                      
                      let formattedItem = item;
                      if (dateMatch && nameMatch) {
                        formattedItem = (
                          <>
                            <span className="date-pill">{dateMatch[1]}</span>
                            <span className="highlight">{nameMatch[1].replace(`on ${dateMatch[1]}`, '').trim()}</span>
                          </>
                        );
                      }
                      
                      return <li key={i} className="data-item">{formattedItem}</li>;
                    })}
                  </ul>
                </div>
              );
            } else {
              // Generic handling for other sections
              return (
                <div key={index} className="data-section">
                  {section}
                </div>
              );
            }
          })}
        </div>
      );
    }
    
    // For todos
    if (text.includes('Todo Items:') || text.includes('task') || text.includes('Due:')) {
      const todoMatch = text.match(/Todo Items:[\s\S]*?(?=$)/);
      
      if (todoMatch) {
        const todoItems = todoMatch[0].replace('Todo Items:', '').split('-').filter(item => item.trim());
        
        return (
          <div className="structured-data">
            <div className="data-section">
              <div className="section-title">Todo Items</div>
              <ul className="data-list">
                {todoItems.map((item, i) => {
                  const completedMatch = item.includes('[COMPLETED]');
                  const dueMatch = item.match(/\(Due: ([^)]+)\)/);
                  
                  return (
                    <li key={i} className="data-item" style={{ textDecoration: completedMatch ? 'line-through' : 'none' }}>
                      {item.replace('[COMPLETED]', '').replace(/\(Due: ([^)]+)\)/, '')}
                      {dueMatch && <span className="date-pill">{dueMatch[1]}</span>}
                      {completedMatch && <span className="highlight">Completed</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      }
    }
    
    // For all other messages, just return the text as is
    return <p>{text}</p>;
  };
  
  // Fetch user's geolocation on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lon: longitude });
          fetchWeatherByCoords(latitude, longitude);
          fetchLocationName(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLoading(false);
          setError("Couldn't get your location. Please enter it manually.");
        }
      );
    } else {
      setLoading(false);
      setError("Geolocation is not supported by your browser. Please enter your location manually.");
    }
  }, []);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Function to sync data to cookies for server-side access
  useEffect(() => {
    const syncDataToCookies = () => {
      try {
        // Sync todos
        const todoList = localStorage.getItem('todoList');
        if (todoList) {
          document.cookie = `todoList=${encodeURIComponent(todoList)}; path=/; max-age=86400`;
        }
        
        // Sync occasions
        const upcomingOccasions = localStorage.getItem('upcomingOccasions');
        if (upcomingOccasions) {
          document.cookie = `upcomingOccasions=${encodeURIComponent(upcomingOccasions)}; path=/; max-age=86400`;
        }
        
        // Sync outfit metadata
        const outfitMetadata = localStorage.getItem('outfitMetadata');
        if (outfitMetadata) {
          document.cookie = `outfitMetadata=${encodeURIComponent(outfitMetadata)}; path=/; max-age=86400`;
        }
        
        // Create a simplified vault entries summary for chatbot
        const vaultEntries = localStorage.getItem('vaultEntries');
        if (vaultEntries) {
          try {
            const entries = JSON.parse(vaultEntries);
            const summaryEntries = entries.map(entry => ({
              uuid: entry.uuid,
              date: entry.date,
              occasion: entry.occasion || '',
              description: entry.description || '',
              notes: entry.notes || '',
              rating: entry.weather && entry.weather.includes("Rating:") 
                ? parseInt(entry.weather.replace(/Rating:|\//g, "").trim())
                : null
            }));
            document.cookie = `vaultEntriesSummary=${encodeURIComponent(JSON.stringify(summaryEntries))}; path=/; max-age=86400`;
          } catch (err) {
            console.error("Error creating vault entries summary:", err);
          }
        }
        
        console.log("Data synchronized to cookies for server access");
      } catch (error) {
        console.error("Error syncing data to cookies:", error);
      }
    };
    
    // Initial sync
    syncDataToCookies();
    
    // Set up interval to refresh sync every 5 minutes
    const syncInterval = setInterval(syncDataToCookies, 300000);
    
    // Clean up interval on unmount
    return () => clearInterval(syncInterval);
  }, []);
  
  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      setLoading(true);
      const response = await axios.get(`/get_weather_by_coords?lat=${lat}&lon=${lon}`);
      setWeatherData(response.data.current);
      
      // Process forecast data
      const forecastList = response.data.forecast.list || [];
      const processedForecast = processForecastData(forecastList);
      setForecastData(processedForecast);
      
      // Set user coordinates for later use
      setUserCoords({ lat, lon });
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather:", error);
      setError("Failed to fetch weather data. Please try again.");
      setLoading(false);
    }
  };
  
  const fetchLocationName = async (lat, lon) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=9f27863d71796d3b766af8cda018fd8f`
      );
      
      if (response.data && response.data.length > 0) {
        const locationName = response.data[0].name;
        setUserLocation(locationName);
        setLocation(locationName);
      }
    } catch (error) {
      console.error("Error fetching location name:", error);
    }
  };
  
  const fetchWeatherByLocation = async (locationName) => {
    try {
      setLoading(true);
      const response = await axios.get(`/get_weather?location=${encodeURIComponent(locationName)}`);
      setWeatherData(response.data.current);
      
      // Store the location
      setLocation(locationName);
      
      // Process forecast data
      const dailySummary = response.data.daily_summary || [];
      setForecastData(dailySummary);
      
      // Use location parameter for clothing suggestions
      fetchClothingSuggestionsByLocation(locationName);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather:", error);
      setError("Failed to fetch weather data. Please try again.");
      setLoading(false);
    }
  };
  
  const fetchClothingSuggestionsByLocation = async (locationName) => {
    if (!locationName || locationName.trim() === '') {
      console.error("Empty location name");
      return;
    }
    
    try {
      const response = await axios.get(`/get_clothing_suggestion?location=${encodeURIComponent(locationName)}`);
      setClothingSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching clothing suggestions by location:", error);
    }
  };
  
  const fetchClothingSuggestionsByCoords = async () => {
    if (!userCoords) {
      console.error("No coordinates available");
      return;
    }
    
    try {
      const response = await axios.get(`/get_clothing_recommendation_by_coords?lat=${userCoords.lat}&lon=${userCoords.lon}`);
      setClothingSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching clothing suggestions by coordinates:", error);
    }
  };
  
  const fetchFabricSuggestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/get_fabric_suggestions?location=${encodeURIComponent(location || userLocation)}`);
      setFabricSuggestions(response.data);
      setShowFabricPopup(true);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching fabric suggestions:", error);
      setLoading(false);
    }
  };
  
  const handleLocationSearch = (e) => {
    e.preventDefault();
    if (locationInput.trim()) {
      fetchWeatherByLocation(locationInput.trim());
    }
  };
  
  // Updated chat submission handler
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    
    if (!chatInput.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      type: 'user',
      text: chatInput
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    
    try {
      // Add loading message
      const loadingMessage = {
        type: 'bot',
        text: "Thinking...",
        isLoading: true
      };
      
      setChatMessages(prev => [...prev, loadingMessage]);
      
      // Get client data from localStorage for the chatbot
      let clientData = {};
      
      // Try to get todos from localStorage
      try {
        const todoListStr = localStorage.getItem('todoList');
        if (todoListStr) {
          clientData.todoList = todoListStr;
        }
      } catch (err) {
        console.log("Error reading todoList from localStorage:", err);
      }
      
      // Try to get occasions from localStorage
      try {
        const occasionsStr = localStorage.getItem('upcomingOccasions');
        if (occasionsStr) {
          clientData.upcomingOccasions = occasionsStr;
        }
      } catch (err) {
        console.log("Error reading upcomingOccasions from localStorage:", err);
      }
      
      // Try to get outfit metadata from localStorage
      try {
        const outfitMetadataStr = localStorage.getItem('outfitMetadata');
        if (outfitMetadataStr) {
          clientData.outfitMetadata = outfitMetadataStr;
        }
      } catch (err) {
        console.log("Error reading outfitMetadata from localStorage:", err);
      }
      
      // Try to get vault entries from localStorage
      try {
        const vaultEntriesStr = localStorage.getItem('vaultEntries');
        if (vaultEntriesStr) {
          // Create a simplified version to avoid large payloads
          const entries = JSON.parse(vaultEntriesStr);
          const summaryEntries = entries.map(entry => ({
            uuid: entry.uuid,
            date: entry.date,
            occasion: entry.occasion || '',
            description: entry.description || '',
            notes: entry.notes || '',
            rating: entry.weather && entry.weather.includes("Rating:") 
              ? parseInt(entry.weather.replace(/Rating:|\//g, "").trim()) 
              : null
          }));
          clientData.vaultEntriesSummary = JSON.stringify(summaryEntries);
        }
      } catch (err) {
        console.log("Error processing vault entries from localStorage:", err);
      }
      
      // Send message to chatbot API with client data
      const response = await axios.post('/chatbot', {
        message: chatInput,
        location: location || userLocation,
        clientData: clientData
      }, {
        // Set cookies to pass data
        withCredentials: true
      });
      
      // Remove loading message and add actual response
      const botMessage = {
        type: 'bot',
        text: response.data.response
      };
      
      // Log debug info if present
      if (response.data.debug_info) {
        console.log("Chatbot debug info:", response.data.debug_info);
      }
      
      setChatMessages(prev => {
        // Filter out loading message and add real response
        const filteredMessages = prev.filter(msg => !msg.isLoading);
        return [...filteredMessages, botMessage];
      });
    } catch (error) {
      console.error("Error getting chatbot response:", error);
      
      // Add error message to chat
      const errorMessage = {
        type: 'bot',
        text: "Sorry, I'm having trouble connecting. Please try again later."
      };
      
      setChatMessages(prev => {
        // Filter out loading message and add error message
        const filteredMessages = prev.filter(msg => !msg.isLoading);
        return [...filteredMessages, errorMessage];
      });
    }
  };
  
  const processForecastData = (forecastList) => {
    // Group forecast items by day
    const dailyForecasts = {};
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!dailyForecasts[dateStr]) {
        dailyForecasts[dateStr] = {
          date: dateStr,
          temps: [],
          weather: [],
          icons: []
        };
      }
      
      dailyForecasts[dateStr].temps.push(item.main.temp);
      dailyForecasts[dateStr].weather.push(item.weather[0].main);
      dailyForecasts[dateStr].icons.push(item.weather[0].icon);
    });
    
    // Process daily data
    return Object.values(dailyForecasts).map(day => {
      // Get most common weather condition
      const weatherCounts = {};
      day.weather.forEach(w => {
        weatherCounts[w] = (weatherCounts[w] || 0) + 1;
      });
      
      const mainWeather = Object.entries(weatherCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      return {
        date: day.date,
        min_temp: Math.min(...day.temps),
        max_temp: Math.max(...day.temps),
        avg_temp: day.temps.reduce((sum, temp) => sum + temp, 0) / day.temps.length,
        main_weather: mainWeather,
        icon: day.icons.find(icon => icon.includes('d')) || day.icons[0] // Prefer day icons
      };
    });
  };
  
  const getWeatherIcon = (iconCode, size = 50) => {
    const iconMap = {
      '01d': <WiDaySunny size={size} color="#FF9800" />,
      '01n': <WiNightClear size={size} color="#5C5CFF" />,
      '02d': <WiDayCloudy size={size} color="#FF9800" />,
      '02n': <WiNightCloudy size={size} color="#5C5CFF" />,
      '03d': <WiCloud size={size} color="#BBBBBB" />,
      '03n': <WiCloud size={size} color="#BBBBBB" />,
      '04d': <WiCloudy size={size} color="#BBBBBB" />,
      '04n': <WiCloudy size={size} color="#BBBBBB" />,
      '09d': <WiRain size={size} color="#29B6F6" />,
      '09n': <WiRain size={size} color="#29B6F6" />,
      '10d': <WiDayRain size={size} color="#29B6F6" />,
      '10n': <WiNightRain size={size} color="#29B6F6" />,
      '11d': <WiThunderstorm size={size} color="#5C5CFF" />,
      '11n': <WiThunderstorm size={size} color="#5C5CFF" />,
      '13d': <WiSnow size={size} color="#E1F5FE" />,
      '13n': <WiSnow size={size} color="#E1F5FE" />,
      '50d': <WiDayFog size={size} color="#BBBBBB" />,
      '50n': <WiNightFog size={size} color="#BBBBBB" />,
    };
    
    // Default icon if code not found
    return iconMap[iconCode] || <WiDaySunny size={size} color="#FF9800" />;
  };
  
  const getWeatherBackgroundClass = (weatherMain) => {
    if (!weatherMain) return 'bg-default';
    
    const weather = weatherMain.toLowerCase();
    if (weather.includes('clear') || weather.includes('sun')) return 'bg-clear';
    if (weather.includes('cloud')) return 'bg-cloudy';
    if (weather.includes('rain') || weather.includes('drizzle')) return 'bg-rainy';
    if (weather.includes('snow')) return 'bg-snowy';
    if (weather.includes('thunder')) return 'bg-stormy';
    if (weather.includes('fog') || weather.includes('mist') || weather.includes('haze')) return 'bg-foggy';
    
    return 'bg-default';
  };
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };
  
  const handleDaySelect = (index) => {
    setSelectedDay(index);
  };
  
  const navigateToOutfitCreator = () => {
    navigate('/outfit');
  };
  
  const navigateToWardrobe = () => {
    navigate('/wardrobe');
  };
  
  const handleOpenOutfitPopup = () => {
    // Fetch clothing suggestions by coordinates if available
    if (userCoords) {
      fetchClothingSuggestionsByCoords();
    } else if (location) {
      fetchClothingSuggestionsByLocation(location);
    }
    
    setShowOutfitPopup(true);
  };
  
  const handleCloseOutfitPopup = () => {
    setShowOutfitPopup(false);
  };

  const handleCloseFabricPopup = () => {
    setShowFabricPopup(false);
  };
  // Replace your current loading return statement with this one
if (loading) {
  return (
    <div className="weather-plan-container">
      <div className="loading-spinner">
        <div className="spinner">
          {/* These empty divs are for the raindrops animation */}
          <div className="raindrops raindrop-1"></div>
          <div className="raindrops raindrop-2"></div>
          <div className="raindrops raindrop-3"></div>
          <div className="raindrops raindrop-4"></div>
          
          {/* This empty div is for the t-shirt animation */}
          <div className="tshirt"></div>
        </div>
        <p>Loading your weather outfit...</p>
      </div>
    </div>
  );
}
  if (error) {
    return (
      <div className="weather-plan-container">
        <div className="error-container">
          <h2>Oops! {error}</h2>
          <form onSubmit={handleLocationSearch} className="location-search">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter your city"
              className="location-input"
            />
            <button type="submit" className="search-button">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`weather-plan-container ${weatherData ? getWeatherBackgroundClass(weatherData.weather[0].main) : 'bg-default'}`}>
      {/* Header section */}
      <div className="weather-plan-header">
        <form onSubmit={handleLocationSearch} className="location-search">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder={location || "Enter your city"}
            className="location-input"
          />
          <button type="submit" className="search-button">
            <i className="fas fa-search"></i>
          </button>
        </form>
        <button className="header-outfit-btn" onClick={handleOpenOutfitPopup}>
          <FaTshirt className="outfit-btn-icon" /> Suggested Outfit
        </button>
      </div>
      
      {/* Weather display */}
      {weatherData && (
        <div className="weather-display">
          <div className="current-weather">
            <h2>{location}</h2>
            <div className="weather-icon-large">
              {getWeatherIcon(weatherData.weather[0].icon, 100)}
            </div>
            <div className="temperature">
              {Math.round(weatherData.main.temp)}°C
            </div>
            <div className="weather-description">
              {weatherData.weather[0].description}
            </div>
            <div className="weather-details">
              <div className="detail">
                <i className="fas fa-tint"></i> {weatherData.main.humidity}%
              </div>
              <div className="detail">
                <i className="fas fa-wind"></i> {Math.round(weatherData.wind.speed)} m/s
              </div>
            </div>
          </div>
          
          {/* Forecast */}
          <div className="forecast">
            {forecastData.slice(0, 5).map((day, index) => (
              <div 
                key={day.date} 
                className={`forecast-day ${selectedDay === index ? 'selected' : ''}`}
                onClick={() => handleDaySelect(index)}
              >
                <div className="day-name">{formatDate(day.date)}</div>
                <div className="forecast-icon">
                  {getWeatherIcon(day.icon, 40)}
                </div>
                <div className="forecast-temp">
                  {Math.round(day.min_temp)}° - {Math.round(day.max_temp)}°
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Outfit Popup */}
      {showOutfitPopup && clothingSuggestions && (
        <div className="outfit-popup-overlay">
          <div className="outfit-popup">
            <div className="outfit-popup-header">
              <h2><FaTshirt className="outfit-icon" /> Suggested Outfit</h2>
              <button className="close-popup-btn" onClick={handleCloseOutfitPopup}>
                <FaTimes />
              </button>
            </div>
            
            <div className="outfit-popup-content">
              {clothingSuggestions.weather_summary && (
                <div className="weather-summary">
                  <p><i className="fas fa-thermometer-half"></i> Current conditions: {clothingSuggestions.weather_summary}</p>
                </div>
              )}
              
              {clothingSuggestions.outfit_explanation && (
                <div className="outfit-explanation">
                  <p><i className="fas fa-info-circle"></i> {clothingSuggestions.outfit_explanation}</p>
                </div>
              )}
              
              <div className="outfit-categories">
                {clothingSuggestions.top.length > 0 && (
                  <div className="outfit-category">
                    <h4>Top</h4>
                    <ul>
                      {clothingSuggestions.top.map((item, index) => (
                        <li key={`top-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {clothingSuggestions.upper_body.length > 0 && (
                  <div className="outfit-category">
                    <h4>Upper Body</h4>
                    <ul>
                      {clothingSuggestions.upper_body.map((item, index) => (
                        <li key={`upper-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {clothingSuggestions.lower_body.length > 0 && (
                  <div className="outfit-category">
                    <h4>Lower Body</h4>
                    <ul>
                      {clothingSuggestions.lower_body.map((item, index) => (
                        <li key={`lower-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {clothingSuggestions.accessories.length > 0 && (
                  <div className="outfit-category">
                    <h4>Accessories</h4>
                    <ul>
                      {clothingSuggestions.accessories.map((item, index) => (
                        <li key={`acc-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {clothingSuggestions.material_recommendations && 
                clothingSuggestions.material_recommendations.recommended && 
                clothingSuggestions.material_recommendations.recommended.length > 0 && (
                <div className="recommended-materials">
                  <h3>Recommended Materials</h3>
                  <ul className="material-list">
                    {clothingSuggestions.material_recommendations.recommended.map((material, index) => (
                      <li key={`material-${index}`} className="material-item">
                        <span className="material-name">{material.name}</span>
                        <p className="material-properties">{material.properties}</p>
                        {material.examples && (
                          <p className="material-examples">Examples: {material.examples}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="outfit-actions">
                <button className="create-outfit-btn" onClick={navigateToOutfitCreator}>
                  CREATE OUTFIT
                </button>
                <button className="view-wardrobe-btn" onClick={navigateToWardrobe}>
                  VIEW WARDROBE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Fabric Suggestions Popup - Changed to only be shown when specifically requested */}
      {showFabricPopup && fabricSuggestions && (
        <div className="fabric-popup-overlay">
          <div className="fabric-popup">
            <div className="fabric-popup-header">
              <h2><FaTshirt className="fabric-icon" /> Weather-Based Outfit Guide</h2>
              <button className="close-popup-btn" onClick={handleCloseFabricPopup}>
                <FaTimes />
              </button>
            </div>
            
            <div className="fabric-popup-content">
              <div className="fabric-summary">
                <p><FaInfoCircle /> {fabricSuggestions.summary}</p>
              </div>
              
              <div className="fabric-list">
                <h3>Recommended Fabrics & Materials</h3>
                {fabricSuggestions.fabrics && fabricSuggestions.fabrics.map((fabric, index) => (
                  <div key={`fabric-${index}`} className="fabric-item">
                    <h4>{fabric.name}</h4>
                    <p className="fabric-properties">{fabric.properties}</p>
                    {fabric.suitable_for && (
                      <p className="fabric-suitable">Best for: {fabric.suitable_for}</p>
                    )}
                  </div>
                ))}
              </div>
              
              {fabricSuggestions.materials_to_avoid && fabricSuggestions.materials_to_avoid.length > 0 && (
                <div className="materials-to-avoid">
                  <h3>Materials to Avoid Today</h3>
                  <ul>
                    {fabricSuggestions.materials_to_avoid.map((material, index) => (
                      <li key={`avoid-${index}`}>{material}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {fabricSuggestions.layering_suggestion && (
                <div className="layering-suggestion">
                  <h3>Styling Advice</h3>
                  <p>{fabricSuggestions.layering_suggestion}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Chatbot section */}
      <div className="chatbot-container">
        <div className="chat-header">
          <h3>StyleBot</h3>
          <p>Ask me about weather, outfits, or your schedule!</p>
        </div>
        
        <div className="chat-messages" ref={chatContainerRef}>
          {chatMessages.length === 0 ? (
            <div className="bot-message welcome-message">
              <div className="bot-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div className="message-content">
                <p>Hi there! I'm StyleBot. I can help you with outfit suggestions, weather updates, and reminders about your upcoming events. What can I help you with today?</p>
              </div>
            </div>
          ) : (
            chatMessages.map((msg, index) => (
              <div key={index} className={`${msg.type}-message`}>
                {msg.type === 'bot' && (
                  <div className="bot-avatar">
                    <i className="fas fa-robot"></i>
                  </div>
                )}
                <div className="message-content">
                  {msg.isLoading ? (
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    msg.type === 'bot' ? formatBotMessage(msg.text) : <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={handleChatSubmit} className="chat-input-form">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask StyleBot something..."
            className="chat-input"
          />
          <button type="submit" className="send-button">
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default WeatherPlan;