# weather_api.py
import os
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union

# Weather API configuration
OPEN_WEATHER_API_KEY = "9f27863d71796d3b766af8cda018fd8f"
GEMINI_API_KEY = "AIzaSyAGzXMBoUxVvp4bsH9MBdi52vC4ZgDC12Y"
BASE_URL = "https://api.openweathermap.org/data/2.5"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

def get_current_weather(lat: float, lon: float) -> Dict[str, Any]:
    """
    Get current weather data for the given coordinates.
    """
    url = f"{BASE_URL}/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPEN_WEATHER_API_KEY,
        "units": "metric"  # Use metric for Celsius
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Weather API Error: {response.status_code}, {response.text}")

def get_forecast(lat: float, lon: float, days: int = 5) -> Dict[str, Any]:
    """
    Get weather forecast for the given coordinates for up to 5 days.
    """
    url = f"{BASE_URL}/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPEN_WEATHER_API_KEY,
        "units": "metric",
        "cnt": min(days * 8, 40)  # Each day has 8 data points (3 hours intervals)
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Weather API Error: {response.status_code}, {response.text}")

def get_geocode(location_name: str) -> Dict[str, Any]:
    """
    Get coordinates for a given location name.
    """
    if not location_name or location_name.strip() == "":
        raise Exception("Location name cannot be empty")
        
    url = "http://api.openweathermap.org/geo/1.0/direct"
    params = {
        "q": location_name,
        "limit": 1,
        "appid": OPEN_WEATHER_API_KEY
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        if data:
            return data[0]
        else:
            raise Exception(f"Location not found: {location_name}")
    else:
        raise Exception(f"Geocoding API Error: {response.status_code}, {response.text}")

def get_weather_for_location(location: str) -> Dict[str, Any]:
    """
    Get weather data for a given location name.
    """
    if not location or location.strip() == "":
        raise Exception("Location name cannot be empty")
        
    location_data = get_geocode(location)
    lat, lon = location_data.get("lat"), location_data.get("lon")
    
    current_weather = get_current_weather(lat, lon)
    forecast_data = get_forecast(lat, lon)
    
    return {
        "location": {
            "name": location_data.get("name"),
            "country": location_data.get("country"),
            "lat": lat,
            "lon": lon
        },
        "current": current_weather,
        "forecast": forecast_data,
        "daily_summary": process_forecast_to_daily(forecast_data)
    }

def get_weather_by_coords(lat: float, lon: float) -> Dict[str, Any]:
    """
    Get weather data for given coordinates.
    """
    current_weather = get_current_weather(lat, lon)
    forecast_data = get_forecast(lat, lon)
    
    return {
        "location": {
            "lat": lat,
            "lon": lon
        },
        "current": current_weather,
        "forecast": forecast_data,
        "daily_summary": process_forecast_to_daily(forecast_data)
    }

def process_forecast_to_daily(forecast_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Process the 3-hour forecast data into daily summaries.
    """
    daily_data = {}
    
    for item in forecast_data.get("list", []):
        dt = datetime.fromtimestamp(item.get("dt"))
        date_str = dt.strftime("%Y-%m-%d")
        
        if date_str not in daily_data:
            daily_data[date_str] = {
                "date": date_str,
                "temperatures": [],
                "weather_conditions": [],
                "humidity": [],
                "wind_speed": [],
                "main_weather": None,
                "icon": None
            }
        
        daily_data[date_str]["temperatures"].append(item.get("main", {}).get("temp"))
        daily_data[date_str]["humidity"].append(item.get("main", {}).get("humidity"))
        daily_data[date_str]["wind_speed"].append(item.get("wind", {}).get("speed"))
        daily_data[date_str]["weather_conditions"].append(item.get("weather", [{}])[0].get("main"))
        
        # Use noon data for main weather representation if available
        if dt.hour >= 12 and dt.hour <= 15 and not daily_data[date_str]["main_weather"]:
            daily_data[date_str]["main_weather"] = item.get("weather", [{}])[0].get("main")
            daily_data[date_str]["icon"] = item.get("weather", [{}])[0].get("icon")
    
    # Calculate daily averages and determine most common weather condition
    result = []
    for date_str, data in daily_data.items():
        if data["temperatures"]:
            data["min_temp"] = min(data["temperatures"])
            data["max_temp"] = max(data["temperatures"])
            data["avg_temp"] = sum(data["temperatures"]) / len(data["temperatures"])
            data["avg_humidity"] = sum(data["humidity"]) / len(data["humidity"])
            data["avg_wind_speed"] = sum(data["wind_speed"]) / len(data["wind_speed"])
            
            # If no noon data, use most common weather condition
            if not data["main_weather"]:
                weather_counts = {}
                for condition in data["weather_conditions"]:
                    weather_counts[condition] = weather_counts.get(condition, 0) + 1
                
                data["main_weather"] = max(weather_counts.items(), key=lambda x: x[1])[0]
                # Find any icon for this weather condition
                for item in forecast_data.get("list", []):
                    if item.get("weather", [{}])[0].get("main") == data["main_weather"]:
                        data["icon"] = item.get("weather", [{}])[0].get("icon")
                        break
            
            # Clean up temp data
            del data["temperatures"]
            del data["weather_conditions"]
            del data["humidity"]
            del data["wind_speed"]
            
            result.append(data)
    
    return result

def get_clothing_suggestion(weather_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get clothing suggestions based on weather data with detailed fabric information.
    """
    temp = weather_data.get("current", {}).get("main", {}).get("temp")
    weather_condition = weather_data.get("current", {}).get("weather", [{}])[0].get("main")
    humidity = weather_data.get("current", {}).get("main", {}).get("humidity")
    wind_speed = weather_data.get("current", {}).get("wind", {}).get("speed")
    
    suggestions = {
        "temperature_range": "",
        "weather_summary": f"{weather_condition}, {temp}°C, {humidity}% humidity, {wind_speed} m/s wind",
        "top": [],
        "bottom": [],
        "upper_body": [],
        "lower_body": [],
        "accessories": [],
        "material_recommendations": {
            "recommended": [],
            "avoid": []
        },
        "outfit_explanation": ""
    }
    
    # Temperature based suggestions with fabric details
    if temp is not None:
        if temp < 0:
            suggestions["temperature_range"] = "very_cold"
            suggestions["top"] = ["Thermal undershirt (merino wool or synthetic blend)"]
            suggestions["upper_body"] = ["Heavy wool/cashmere sweater", "Insulated down or synthetic coat"]
            suggestions["bottom"] = ["Thermal long underwear (wool or polyester blend)"]
            suggestions["lower_body"] = ["Insulated pants (nylon with insulation)", "Wool/wool blend pants"]
            suggestions["accessories"] = ["Insulated gloves (thinsulate lining)", "Wool scarf", "Wool/fleece beanie", "Merino wool thermal socks"]
            
            suggestions["material_recommendations"]["recommended"] = [
                {"name": "Wool", "properties": "Natural insulator that retains heat even when wet", "examples": "Merino wool base layers, wool sweaters"},
                {"name": "Down", "properties": "Highest warmth-to-weight ratio", "examples": "Puffer jackets, winter coats"},
                {"name": "Synthetic insulation", "properties": "Retains warmth when wet, dries quickly", "examples": "Thinsulate gloves, synthetic-fill jackets"}
            ]
            suggestions["material_recommendations"]["avoid"] = [
                {"name": "Cotton", "properties": "Retains moisture and loses insulation when wet", "examples": "Jeans, cotton t-shirts"},
                {"name": "Silk", "properties": "Not warm enough for very cold temperatures", "examples": "Silk undergarments"},
                {"name": "Single-layer synthetics", "properties": "Not enough insulation", "examples": "Thin polyester shirts"}
            ]
            
            suggestions["outfit_explanation"] = "In very cold weather, layering is crucial. Start with moisture-wicking base layers made of merino wool or synthetic blends to keep sweat away from your skin. Add insulating middle layers of wool or fleece, and finish with a windproof and waterproof outer layer. Focus on covering extremities well with proper insulation."
            
        elif 0 <= temp < 10:
            suggestions["temperature_range"] = "cold"
            suggestions["top"] = ["Long sleeve thermal shirt (wool or polyester blend)"]
            suggestions["upper_body"] = ["Medium-weight wool/fleece sweater", "Insulated water-resistant jacket"]
            suggestions["bottom"] = ["Moisture-wicking underwear"]
            suggestions["lower_body"] = ["Wool blend pants", "Fleece-lined jeans or trousers"]
            suggestions["accessories"] = ["Lightweight insulated gloves", "Wool or cashmere scarf", "Wool beanie"]
            
            suggestions["material_recommendations"]["recommended"] = [
                {"name": "Wool", "properties": "Excellent insulation and moisture management", "examples": "Wool sweaters, wool blend pants"},
                {"name": "Fleece", "properties": "Lightweight warmth, quick-drying", "examples": "Fleece jackets, fleece-lined pants"},
                {"name": "Polyester blends", "properties": "Good insulation and moisture-wicking", "examples": "Thermal base layers"}
            ]
            suggestions["material_recommendations"]["avoid"] = [
                {"name": "Pure cotton", "properties": "Holds moisture, poor insulator when wet", "examples": "Cotton t-shirts, canvas pants"},
                {"name": "Thin synthetics", "properties": "Not enough insulation", "examples": "Thin polyester shirts"}
            ]
            
            suggestions["outfit_explanation"] = "For cold conditions, focus on layering with moisture management in mind. Wool and fleece are excellent choices as they provide warmth while managing moisture. A water-resistant outer layer protects from wind and light precipitation. Your extremities lose heat quickly, so quality accessories are important."
            
        elif 10 <= temp < 20:
            suggestions["temperature_range"] = "mild"
            suggestions["top"] = ["Cotton-blend t-shirt", "Lightweight long sleeve shirt (cotton or linen blend)"]
            suggestions["upper_body"] = ["Light wool or cotton sweater", "Lightweight cardigan"]
            suggestions["bottom"] = ["Breathable underwear"]
            suggestions["lower_body"] = ["Chinos", "Denim jeans", "Twill pants"]
            suggestions["accessories"] = ["Light scarf for mornings/evenings"]
            
            suggestions["material_recommendations"]["recommended"] = [
                {"name": "Cotton blends", "properties": "Comfortable and breathable", "examples": "T-shirts, lightweight shirts"},
                {"name": "Light wool", "properties": "Temperature-regulating, good for variable conditions", "examples": "Lightweight wool sweaters"},
                {"name": "Twill/denim", "properties": "Durable and suitable for mild temperatures", "examples": "Chinos, jeans"}
            ]
            suggestions["material_recommendations"]["avoid"] = [
                {"name": "Heavy fabrics", "properties": "May cause overheating", "examples": "Heavy wool, thick fleece"},
                {"name": "Non-breathable synthetics", "properties": "Can trap heat and moisture", "examples": "Polyester dress shirts"}
            ]
            
            suggestions["outfit_explanation"] = "Mild weather calls for versatile clothing that can adapt to temperature fluctuations. Lightweight, breathable fabrics work well, with the option to add or remove layers as needed. Cotton blends are comfortable, while light wool provides natural temperature regulation. Focus on adaptable pieces that work for changing conditions throughout the day."
            
        elif 20 <= temp < 25:
            suggestions["temperature_range"] = "warm"
            suggestions["top"] = ["Breathable cotton or linen t-shirt"]
            suggestions["upper_body"] = ["Lightweight cotton or linen shirt"]
            suggestions["bottom"] = ["Breathable underwear"]
            suggestions["lower_body"] = ["Lightweight cotton pants", "Chino shorts"]
            suggestions["accessories"] = ["Sunglasses", "Light cotton cap"]
            
            suggestions["material_recommendations"]["recommended"] = [
                {"name": "Cotton", "properties": "Breathable and comfortable in warm weather", "examples": "T-shirts, light button-ups"},
                {"name": "Linen", "properties": "Highly breathable, wicks moisture away from skin", "examples": "Linen shirts, linen-blend pants"},
                {"name": "Lightweight blends", "properties": "Comfort with added durability", "examples": "Cotton-poly blend t-shirts"}
            ]
            suggestions["material_recommendations"]["avoid"] = [
                {"name": "Heavy denim", "properties": "Retains heat and doesn't breathe well", "examples": "Heavy jeans"},
                {"name": "Synthetic tight-fitting clothes", "properties": "Can trap heat", "examples": "Polyester activewear"}
            ]
            
            suggestions["outfit_explanation"] = "Warm weather requires breathable fabrics that allow air circulation and manage moisture effectively. Natural fibers like cotton and linen excel in these conditions. Opt for loose-fitting garments that don't trap heat against the skin. Lighter colors reflect sunlight and help keep you cooler."
            
        else:  # temp >= 25
            suggestions["temperature_range"] = "hot"
            suggestions["top"] = ["Lightweight breathable cotton or linen t-shirt", "Technical moisture-wicking tank top"]
            suggestions["upper_body"] = ["Ultra-light linen or seersucker shirt"]
            suggestions["bottom"] = ["Breathable moisture-wicking underwear"]
            suggestions["lower_body"] = ["Lightweight shorts", "Linen pants", "Breathable skirt"]
            suggestions["accessories"] = ["Wide-brimmed hat", "UV-protective sunglasses", "Cooling neck wrap"]
            
            suggestions["material_recommendations"]["recommended"] = [
                {"name": "Linen", "properties": "Maximum breathability and cooling", "examples": "Linen shirts, pants, dresses"},
                {"name": "Technical fabrics", "properties": "Engineered to wick moisture and dry quickly", "examples": "Performance t-shirts, workout shorts"},
                {"name": "Seersucker", "properties": "Puckered texture allows better airflow", "examples": "Seersucker shirts, shorts"},
                {"name": "Chambray", "properties": "Lightweight and breathable alternative to denim", "examples": "Chambray shirts, lightweight pants"}
            ]
            suggestions["material_recommendations"]["avoid"] = [
                {"name": "Polyester", "properties": "Can trap heat and odor", "examples": "Polyester blouses, regular polyester t-shirts"},
                {"name": "Denim", "properties": "Heavy and retains heat", "examples": "Jeans, denim jackets"},
                {"name": "Leather", "properties": "No breathability", "examples": "Leather pants, jackets"}
            ]
            
            suggestions["outfit_explanation"] = "In hot weather, prioritize fabrics that maximize airflow and moisture management. Linen is exceptional for heat as its loose weave allows maximum air circulation. Technical fabrics designed for heat can help wick moisture away efficiently. Loose-fitting garments create airflow between fabric and skin, enhancing cooling. Protect yourself from UV exposure with appropriate accessories."
    
    # Weather condition based additions with specific fabric recommendations
    if weather_condition:
        if weather_condition.lower() in ["rain", "drizzle", "thunderstorm"]:
            suggestions["upper_body"].append("Waterproof breathable rain jacket (Gore-Tex or similar)")
            suggestions["accessories"].extend(["Umbrella", "Waterproof shoes"])
            
            # Add rain-specific fabric recommendations
            rain_fabrics = {
                "name": "Waterproof membranes", 
                "properties": "Keeps water out while allowing perspiration to escape", 
                "examples": "Gore-Tex jackets, eVent fabrics, DWR-treated clothing"
            }
            suggestions["material_recommendations"]["recommended"].append(rain_fabrics)
            
            suggestions["material_recommendations"]["avoid"].append({
                "name": "Untreated cotton", 
                "properties": "Absorbs water and stays wet for long periods", 
                "examples": "Cotton hoodies, regular canvas shoes"
            })
            
            # Enhance explanation for rainy conditions
            suggestions["outfit_explanation"] += " For rainy conditions, waterproof breathable fabrics are essential. These materials prevent water from penetrating while allowing internal moisture to escape. Look for sealed seams and water-resistant zippers for maximum protection. Waterproof footwear with proper traction helps maintain stability on wet surfaces."
            
        elif weather_condition.lower() in ["snow"]:
            suggestions["upper_body"].append("Waterproof insulated jacket with sealed seams")
            suggestions["accessories"].extend(["Waterproof insulated boots with good traction", "Water-resistant gloves"])
            
            # Add snow-specific fabric recommendations
            snow_fabrics = {
                "name": "Waterproof insulated materials", 
                "properties": "Combines water resistance with thermal insulation", 
                "examples": "Gore-Tex with insulation, DWR-treated down"
            }
            suggestions["material_recommendations"]["recommended"].append(snow_fabrics)
            
            # Enhance explanation for snowy conditions
            suggestions["outfit_explanation"] += " In snowy conditions, prioritize waterproof materials with good insulation. Footwear should be waterproof with insulation and excellent traction to prevent slipping. Layering becomes crucial - your base layer should wick moisture, middle layer should insulate, and outer layer should repel snow and wind."
            
        elif weather_condition.lower() in ["clear", "sunny"]:
            if temp > 20:
                suggestions["accessories"].extend(["Broad-spectrum sunscreen", "UV-protective sunglasses"])
                
                # Add sun-specific fabric recommendations
                sun_fabrics = {
                    "name": "UPF-rated fabrics", 
                    "properties": "Provides protection from harmful UV rays", 
                    "examples": "UPF 50+ shirts, sun protective clothing"
                }
                suggestions["material_recommendations"]["recommended"].append(sun_fabrics)
                
                # Enhance explanation for sunny conditions
                suggestions["outfit_explanation"] += " For sunny conditions, consider UPF-rated fabrics that block harmful UV rays. Lighter colors reflect sunlight rather than absorbing it, helping to keep you cooler. Loose-fitting garments allow air to circulate and help regulate body temperature."
    
    return suggestions

def get_clothing_recommendation_by_location(location: str) -> Dict[str, Any]:
    """
    Get clothing recommendation based on location.
    """
    if not location or location.strip() == "":
        raise Exception("Location name cannot be empty")
        
    # Get weather data for the location
    weather_data = get_weather_for_location(location)
    
    # Get clothing suggestion based on weather data
    return get_clothing_suggestion(weather_data)

def get_clothing_recommendation_by_coords(lat: float, lon: float) -> Dict[str, Any]:
    """
    Get clothing recommendation based on coordinates.
    """
    # Get weather data for the coordinates
    weather_data = get_weather_by_coords(lat, lon)
    
    # Get clothing suggestion based on weather data
    return get_clothing_suggestion(weather_data)


def get_clothing_recommendation_by_coords(lat: float, lon: float) -> Dict[str, Any]:
    """
    Get clothing recommendation based on coordinates.
    """
    # Get weather data for the coordinates
    weather_data = get_weather_by_coords(lat, lon)
    
    # Get clothing suggestion based on weather data
    return get_clothing_suggestion(weather_data)

def get_gemini_fabric_suggestions(weather_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get detailed fabric suggestions from Gemini API based on weather conditions.
    """
    temp = weather_data.get("current", {}).get("main", {}).get("temp")
    weather_condition = weather_data.get("current", {}).get("weather", [{}])[0].get("main")
    humidity = weather_data.get("current", {}).get("main", {}).get("humidity")
    wind_speed = weather_data.get("current", {}).get("wind", {}).get("speed")
    
    # Construct prompt for Gemini API
    prompt = f"""
    Please recommend fabrics and clothing materials suitable for the following weather conditions:
    - Temperature: {temp}°C
    - Weather: {weather_condition}
    - Humidity: {humidity}%
    - Wind speed: {wind_speed} m/s
    
    Format your response as a JSON object with the following structure:
    {{
        "summary": "A one-line summary of the overall recommendation",
        "fabrics": [
            {{
                "name": "fabric name",
                "properties": "brief description of properties",
                "suitable_for": "what clothing items this fabric works for"
            }}
        ],
        "materials_to_avoid": ["material1", "material2"],
        "layering_suggestion": "brief suggestion about layering if applicable"
    }}
    
    Keep your response focused only on fabric and material recommendations.
    """
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 1024
        }
    }
    
    # Add API key as query parameter
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            text_response = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
            
            # Try to parse the JSON response from Gemini
            try:
                json_response = json.loads(text_response)
                return json_response
            except json.JSONDecodeError:
                # If JSON parsing fails, create a structured response
                lines = text_response.split('\n')
                filtered_lines = [line for line in lines if line.strip() and not line.strip().startswith('```')]
                
                return {
                    "summary": "Fabric recommendations based on current weather",
                    "fabrics": [{"name": line.split(':')[0], "properties": line.split(':')[1] if len(line.split(':')) > 1 else ""} 
                               for line in filtered_lines if ':' in line],
                    "raw_response": text_response
                }
        else:
            return {
                "error": f"Gemini API Error: {response.status_code}",
                "summary": "Could not retrieve fabric recommendations",
                "fabrics": []
            }
    except Exception as e:
        return {
            "error": str(e),
            "summary": "Error retrieving fabric recommendations",
            "fabrics": []
        }