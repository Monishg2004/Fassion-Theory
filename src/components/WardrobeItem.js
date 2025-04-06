import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './WeatherPlan.css';

const WeatherPlan = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth0();
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: `Hello${user?.name ? ' ' + user.name : ''}! I'm your Fashion Assistant. I can help you with weather information and your fashion vault data. What would you like to know today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'weather'
  const messagesEndRef = useRef(null);
  const OPEN_WEATHER_API_KEY = '9f27863d71796d3b766af8cda018fd8f'; // OpenWeatherMap API key
  const GEMINI_API_KEY = 'AIzaSyAGzXMBoUxVvp4bsH9MBdi52vC4ZgDC12Y'; // Gemini API key
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Fetch user data from API
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch vault entries
        const vaultResponse = await fetch('/get_vault_entries');
        if (!vaultResponse.ok) {
          throw new Error('Failed to fetch vault entries');
        }
        const vaultData = await vaultResponse.json();
        
        // Fetch statistics
        const statsResponse = await fetch('/get_vault_statistics');
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const statsData = await statsResponse.json();
        
        // Set user data
        setUserData({
          vaultEntries: vaultData,
          statistics: statsData,
          occasions: calculateMostWornOccasions(vaultData)
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data. Some features may be limited.');
        
        // Set default user data if fetch fails
        setUserData({
          vaultEntries: [],
          statistics: {
            most_worn_items: [],
            least_worn_items: [],
            clothing_by_category: {},
            occasions: {}
          },
          occasions: {}
        });
      }
    };
    
    fetchUserData();
    
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
          fetchForecastData(latitude, longitude);
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to a location if geolocation fails
          setLocation('New York');
          fetchWeatherByCity('New York');
          fetchForecastByCity('New York');
        }
      );
    } else {
      // Geolocation not supported
      setLocation('New York');
      fetchWeatherByCity('New York');
      fetchForecastByCity('New York');
    }
  }, [isAuthenticated, navigate]);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Calculate most worn occasions
  const calculateMostWornOccasions = (entries) => {
    const occasions = {};
    entries.forEach(entry => {
      if (entry.occasion) {
        if (!occasions[entry.occasion]) {
          occasions[entry.occasion] = 1;
        } else {
          occasions[entry.occasion]++;
        }
      }
    });
    
    return Object.entries(occasions)
      .sort((a, b) => b[1] - a[1])
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
  };
  
  // Reverse geocode to get location name
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${OPEN_WEATHER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get location name');
      }
      
      const data = await response.json();
      if (data && data.length > 0) {
        setLocation(data[0].name);
      }
    } catch (error) {
      console.error('Error getting location name:', error);
    }
  };
  
  // Fetch weather data using coordinates
  const fetchWeatherData = async (latitude, longitude) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const weatherData = await response.json();
      setWeather(weatherData);
      
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Failed to fetch weather data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch forecast data using coordinates
  const fetchForecastData = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast data');
      }
      
      const forecastData = await response.json();
      
      // Process forecast data to get daily forecasts
      const dailyForecasts = processForecastData(forecastData);
      setForecast(dailyForecasts);
      
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    }
  };
  
  // Process 5-day forecast data to get daily forecasts
  const processForecastData = (forecastData) => {
    const dailyForecasts = {};
    
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date: new Date(item.dt * 1000),
          temp_min: item.main.temp_min,
          temp_max: item.main.temp_max,
          weather: item.weather[0],
          wind: item.wind,
          humidity: item.main.humidity,
          forecasts: []
        };
      }
      
      // Update min/max temperatures
      if (item.main.temp_min < dailyForecasts[date].temp_min) {
        dailyForecasts[date].temp_min = item.main.temp_min;
      }
      if (item.main.temp_max > dailyForecasts[date].temp_max) {
        dailyForecasts[date].temp_max = item.main.temp_max;
      }
      
      // Add hourly forecast
      dailyForecasts[date].forecasts.push({
        time: new Date(item.dt * 1000),
        temp: item.main.temp,
        weather: item.weather[0],
        wind: item.wind,
        humidity: item.main.humidity
      });
    });
    
    return Object.values(dailyForecasts);
  };
  
  // Fetch weather data by city name
  const fetchWeatherByCity = async (city) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const weatherData = await response.json();
      setWeather(weatherData);
      setLocation(city);
      
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Failed to fetch weather data. Please check the city name and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch forecast data by city name
  const fetchForecastByCity = async (city) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast data');
      }
      
      const forecastData = await response.json();
      
      // Process forecast data to get daily forecasts
      const dailyForecasts = processForecastData(forecastData);
      setForecast(dailyForecasts);
      
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    }
  };
  
  // Handle location search form submission
  const handleLocationSearch = (e) => {
    e.preventDefault();
    if (location.trim()) {
      fetchWeatherByCity(location);
      fetchForecastByCity(location);
    }
  };
  
  // Handle sending a message to the chat
  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isSendingMessage) return;
    
    // Add user message to chat
    const newUserMessage = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsSendingMessage(true);
    
    // Process message with Gemini API
    try {
      // Prepare context for the API
      let context = "You are a fashion assistant who helps with weather and fashion advice. ";
      
      // Add user data as context if available
      if (userData) {
        if (userData.vaultEntries && userData.vaultEntries.length > 0) {
          context += `The user has ${userData.vaultEntries.length} outfit entries in their fashion vault. `;
          
          // Add information about recent outfits
          const recentEntries = userData.vaultEntries.slice(0, 3);
          if (recentEntries.length > 0) {
            context += "Most recent outfits: ";
            recentEntries.forEach(entry => {
              context += `${new Date(entry.date).toLocaleDateString()}: ${entry.description || 'No description'} (${entry.occasion || 'No occasion'}). `;
            });
          }
        }
        
        // Add information about common occasions
        if (Object.keys(userData.occasions).length > 0) {
          context += "Common occasions: ";
          Object.entries(userData.occasions).slice(0, 3).forEach(([occasion, count]) => {
            context += `${occasion} (${count} times), `;
          });
        }
        
        // Add information about clothing categories
        if (userData.statistics && userData.statistics.clothing_by_category) {
          context += "Clothing categories: ";
          Object.entries(userData.statistics.clothing_by_category).forEach(([category, count]) => {
            context += `${category} (${count} items), `;
          });
        }
      }
      
      // Add weather information if available
      if (weather) {
        context += `Current weather in ${weather.name}: ${weather.weather[0].description}, ${Math.round(weather.main.temp)}°C. `;
      }
      
      // Prepare the request for Gemini API
      const requestData = {
        contents: [
          {
            parts: [
              { text: context },
              { text: "User message: " + inputMessage }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
          topP: 0.95
        }
      };
      
      // Call the Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const data = await response.json();
      
      // Extract the response text
      let botResponse = '';
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        botResponse = data.candidates[0].content.parts[0].text;
      } else {
        botResponse = "I'm sorry, I couldn't process your request. Please try again.";
      }
      
      // Add bot response to chat
      setMessages(prev => [
        ...prev, 
        { 
          type: 'bot', 
          text: botResponse,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message to chat
      setMessages(prev => [
        ...prev, 
        { 
          type: 'bot', 
          text: "I'm sorry, I encountered an error while processing your message. Please try again later.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };
  
  // Function to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get weather icon based on weather condition
  const getWeatherIcon = (condition) => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
      return <i className="fas fa-sun weather-icon sun-icon"></i>;
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <i className="fas fa-cloud-rain weather-icon rain-icon"></i>;
    } else if (lowerCondition.includes('cloud')) {
      return <i className="fas fa-cloud-sun weather-icon cloud-icon"></i>;
    } else if (lowerCondition.includes('snow')) {
      return <i className="fas fa-snowflake weather-icon snow-icon"></i>;
    } else if (lowerCondition.includes('wind')) {
      return <i className="fas fa-wind weather-icon wind-icon"></i>;
    } else if (lowerCondition.includes('thunder')) {
      return <i className="fas fa-bolt weather-icon thunder-icon"></i>;
    } else {
      return <i className="fas fa-cloud-sun weather-icon default-icon"></i>;
    }
  };
  
  // Select a different forecast date
  const handleDateSelection = (date) => {
    setSelectedDate(date);
  };
  
  // Get selected forecast data
  const getSelectedForecast = () => {
    if (!forecast) return null;
    
    const selectedDateString = selectedDate.toLocaleDateString();
    return forecast.find(f => f.date.toLocaleDateString() === selectedDateString);
  };

  return (
    <div className="weather-plan-container">
      <div className="weather-plan-header">
        <h1>Weather & Plan</h1>
        <p>Your personalized fashion and weather assistant</p>
      </div>
      
      <div className="weather-plan-tabs">
        <button 
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <i className="fas fa-comment-alt"></i> Chat Assistant
        </button>
        <button 
          className={`tab-button ${activeTab === 'weather' ? 'active' : ''}`}
          onClick={() => setActiveTab('weather')}
        >
          <i className="fas fa-cloud-sun"></i> Weather Forecast
        </button>
      </div>
      
      <div className="weather-plan-content">
        {/* Chat Assistant Tab */}
        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className="message-content">
                    {message.text.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                  <div className="message-timestamp">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {isSendingMessage && (
                <div className="bot-message typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about weather, your outfits, occasions..."
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isSendingMessage}
              />
              <button onClick={handleSendMessage} disabled={isSendingMessage}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
            
            <div className="quick-prompts">
              <button onClick={() => setInputMessage("What's the weather today?")}>
                Weather Today
              </button>
              <button onClick={() => setInputMessage("What are my most common occasions?")}>
                My Occasions
              </button>
              <button onClick={() => setInputMessage("What outfits have I worn recently?")}>
                Recent Outfits
              </button>
              <button onClick={() => setInputMessage("What items do I have in my wardrobe?")}>
                My Wardrobe
              </button>
            </div>
          </div>
        )}
        
        {/* Weather Tab */}
        {activeTab === 'weather' && (
          <div className="weather-container">
            <form className="location-search" onSubmit={handleLocationSearch}>
              <div className="location-input">
                <i className="fas fa-map-marker-alt location-icon"></i>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter city name"
                />
              </div>
              <button type="submit">Search</button>
            </form>
            
            {loading && (
              <div className="weather-loading">
                <div className="weather-spinner"></div>
                <p>Fetching weather data...</p>
              </div>
            )}
            
            {error && (
              <div className="weather-error">
                <p>{error}</p>
              </div>
            )}
            
            {weather && forecast && !loading && (
              <>
                <div className="weather-current">
                  <div className="current-temp">
                    <div className="temp-value">{Math.round(weather.main.temp)}°C</div>
                    <div className="temp-condition">
                      {getWeatherIcon(weather.weather[0].main)}
                      <span>{weather.weather[0].description}</span>
                    </div>
                  </div>
                  
                  <div className="current-details">
                    <div className="current-location">
                      <i className="fas fa-map-marker-alt"></i>
                      <h2>{weather.name}, {weather.sys.country}</h2>
                    </div>
                    
                    <div className="current-stats">
                      <div className="stat">
                        <i className="fas fa-temperature-high"></i>
                        <div>
                          <span className="stat-label">High</span>
                          <span className="stat-value">{Math.round(weather.main.temp_max)}°C</span>
                        </div>
                      </div>
                      
                      <div className="stat">
                        <i className="fas fa-temperature-low"></i>
                        <div>
                          <span className="stat-label">Low</span>
                          <span className="stat-value">{Math.round(weather.main.temp_min)}°C</span>
                        </div>
                      </div>
                      
                      <div className="stat">
                        <i className="fas fa-wind"></i>
                        <div>
                          <span className="stat-label">Wind</span>
                          <span className="stat-value">{Math.round(weather.wind.speed)} m/s</span>
                        </div>
                      </div>
                      
                      <div className="stat">
                        <i className="fas fa-tint"></i>
                        <div>
                          <span className="stat-label">Humidity</span>
                          <span className="stat-value">{weather.main.humidity}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="forecast-days">
                  <h3>5-Day Forecast</h3>
                  <div className="days-container">
                    {forecast.map((day, index) => (
                      <div 
                        key={index} 
                        className={`forecast-day ${selectedDate.toLocaleDateString() === day.date.toLocaleDateString() ? 'selected' : ''}`}
                        onClick={() => handleDateSelection(day.date)}
                      >
                        <div className="day-name">{formatDate(day.date)}</div>
                        <div className="day-icon">{getWeatherIcon(day.weather.main)}</div>
                        <div className="day-temp">
                          <span className="temp-max">{Math.round(day.temp_max)}°</span>
                          <span className="temp-min">{Math.round(day.temp_min)}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {getSelectedForecast() && (
                  <div className="forecast-details">
                    <h3>Hourly Forecast for {formatDate(selectedDate)}</h3>
                    <div className="hourly-forecast">
                      {getSelectedForecast().forecasts.map((hourForecast, index) => (
                        <div key={index} className="hour-forecast">
                          <div className="hour-time">
                            {hourForecast.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="hour-icon">
                            {getWeatherIcon(hourForecast.weather.main)}
                          </div>
                          <div className="hour-temp">{Math.round(hourForecast.temp)}°C</div>
                          <div className="hour-condition">{hourForecast.weather.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="weather-summary">
                  <h3>Fashion Weather Advisory</h3>
                  <p>
                    {weather.weather[0].main === 'Rain' ? 
                      "Don't forget your umbrella and waterproof shoes today! The rainy conditions call for water-resistant outerwear." :
                    weather.weather[0].main === 'Snow' ?
                      "Bundle up with layers, a warm coat, and waterproof boots. Snow conditions require proper cold-weather gear." :
                    weather.weather[0].main === 'Clear' && weather.main.temp > 25 ?
                      "It's hot and sunny! Opt for light, breathable fabrics, a hat, and don't forget your sunglasses and sunscreen." :
                    weather.weather[0].main === 'Clear' && weather.main.temp < 15 ?
                      "It's cool and clear. A light jacket or sweater would be appropriate for today's weather." :
                    weather.weather[0].main === 'Clouds' ?
                      "Cloudy conditions today. Consider layers that can be adjusted as needed throughout the day." :
                    weather.main.temp < 5 ?
                      "It's very cold! Bundle up with a heavy coat, scarf, gloves, and warm layers." :
                    weather.main.temp > 30 ?
                      "Extreme heat today! Wear very light clothing, stay hydrated, and limit time outdoors if possible." :
                      "Moderate weather conditions today. Dress comfortably and check for changes in the forecast."}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherPlan;