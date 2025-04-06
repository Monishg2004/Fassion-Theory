#chatbot_service.py
import os
import json
import requests
import urllib.parse
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import google.generativeai as genai
from image_classes import Wardrobe, VaultEntry

# Configure Google Generative AI API
GEMINI_API_KEY = "AIzaSyAGzXMBoUxVvp4bsH9MBdi52vC4ZgDC12Y"
genai.configure(api_key=GEMINI_API_KEY)

def strip_timezone(dt):
    """Helper function to make a datetime offset-naive if it has timezone info."""
    if dt and hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

class ChatbotService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        self.chat_history = None
        self.wardrobe_data = None
        self.user_data = {
            "name": "User",
            "preferences": {
                "style": "casual",
                "favorite_colors": []
            },
            "occasions": [],
            "todos": [],
            "outfit_descriptions": []  # Added for outfit descriptions and notes
        }
        # Add a timestamp to track when data was last refreshed
        self.last_refresh = None
    
    def _safely_compare_dates(self, date1, date2):
        """Safely compare two dates, handling timezone differences."""
        date1 = strip_timezone(date1)
        date2 = strip_timezone(date2)
        return date1 > date2
    
    def _extract_outfit_descriptions(self) -> List[Dict[str, Any]]:
        """Extract outfit descriptions and improvement notes from all sources."""
        outfit_descriptions = []
        
        try:
            # Try to get data from request if available
            from flask import request, has_request_context
            
            if has_request_context():
                # Check cookies first
                metadata_cookie = request.cookies.get('outfitMetadata')
                if metadata_cookie:
                    try:
                        decoded_metadata = urllib.parse.unquote(metadata_cookie)
                        outfit_data = json.loads(decoded_metadata)
                        
                        if outfit_data and len(outfit_data) > 0:
                            print(f"Found {len(outfit_data)} outfit metadata entries in cookies")
                            return outfit_data
                    except Exception as e:
                        print(f"Error parsing outfit metadata from cookies: {str(e)}")
                
                # Check JSON payload
                if hasattr(request, 'json') and request.json:
                    client_data = request.json.get('clientData', {})
                    
                    if 'outfitMetadata' in client_data:
                        try:
                            metadata = client_data['outfitMetadata']
                            if isinstance(metadata, str):
                                metadata = json.loads(metadata)
                                
                            if metadata and len(metadata) > 0:
                                print(f"Found {len(metadata)} outfit metadata entries in request JSON")
                                return metadata
                        except Exception as e:
                            print(f"Error parsing outfit metadata from request JSON: {str(e)}")
                    
                    if 'vaultEntriesSummary' in client_data:
                        try:
                            entries = client_data['vaultEntriesSummary']
                            if isinstance(entries, str):
                                entries = json.loads(entries)
                                
                            if entries and len(entries) > 0:
                                print(f"Found {len(entries)} outfit entries in vault summary")
                                return entries
                        except Exception as e:
                            print(f"Error parsing vault entries summary from request JSON: {str(e)}")
        except Exception as e:
            print(f"Error checking request data: {str(e)}")
        
        # Try to extract from wardrobe data as a last resort
        try:
            wardrobe = Wardrobe.load_clothes()
            for entry in wardrobe.vault_entries:
                outfit_info = {
                    "uuid": entry.uuid,
                    "date": strip_timezone(entry.date).strftime("%Y-%m-%d"),
                    "occasion": entry.occasion if entry.occasion else "",
                    "description": entry.description if hasattr(entry, 'description') and entry.description else "",
                    "notes": entry.notes if entry.notes else ""
                }
                
                # Try to extract rating from weather field
                if hasattr(entry, 'weather') and entry.weather and "Rating:" in entry.weather:
                    try:
                        rating_text = entry.weather.replace("Rating:", "").replace("/10", "").strip()
                        outfit_info["rating"] = int(rating_text)
                    except:
                        outfit_info["rating"] = None
                
                outfit_descriptions.append(outfit_info)
        except Exception as e:
            print(f"Error extracting outfit data from wardrobe: {str(e)}")
        
        return outfit_descriptions
    
    def _get_wardrobe_context(self, force_refresh=False) -> str:
        """
        Generate context information about the user's wardrobe for the AI.
        
        Args:
            force_refresh (bool): If True, bypass any caching and reload all data
        """
        # Only refresh the data if it's been more than 30 seconds since the last refresh
        # or if force_refresh is True
        current_time = datetime.now()
        if (self.last_refresh is None or 
            (current_time - self.last_refresh).total_seconds() > 30 or 
            force_refresh):
            
            print("Refreshing wardrobe data...")
            self.last_refresh = current_time
            
            try:
                # Try loading wardrobe data first
                wardrobe = Wardrobe.load_clothes()
                
                # Log the wardrobe data for debugging
                print(f"Loaded wardrobe with {len(wardrobe.vault_entries)} vault entries")
                
                # Get clothing item counts by category
                tops_count = len(wardrobe.get_gear("top"))
                bottoms_count = len(wardrobe.get_gear("bottom"))
                upper_body_count = len(wardrobe.get_gear("upper_body"))
                lower_body_count = len(wardrobe.get_gear("lower_body"))
                
                # Get recent vault entries - ensure they're sorted correctly
                recent_entries = sorted(wardrobe.vault_entries, 
                                    key=lambda entry: strip_timezone(entry.date), 
                                    reverse=True)[:5]
                
                # Get upcoming occasions
                today = datetime.now().replace(tzinfo=None)  # Ensure it's offset-naive
                upcoming_occasions = []
                todos = []
                
                # Parse todolist items from all vault entries
                for entry in wardrobe.vault_entries:
                    try:
                        # Extract occasions
                        if entry.occasion and self._safely_compare_dates(entry.date, today):
                            upcoming_occasions.append({
                                "event": entry.occasion,
                                "date": strip_timezone(entry.date).strftime("%Y-%m-%d"),
                                "description": entry.description if hasattr(entry, 'description') else ""
                            })
                        
                        # Extract todos from todo_items
                        if hasattr(entry, 'todo_items') and entry.todo_items:
                            for todo in entry.todo_items:
                                due_date_str = "No due date"
                                if todo.due_date:
                                    due_date_str = strip_timezone(todo.due_date).strftime("%Y-%m-%d")
                                
                                todos.append({
                                    "text": todo.text,
                                    "complete": todo.complete,
                                    "due_date": due_date_str
                                })
                        
                        # Also check notes field for todos
                        if entry.notes:
                            lines = entry.notes.split('\n')
                            for line in lines:
                                if line.lower().startswith("todo:") or line.lower().startswith("to-do:") or "task:" in line.lower():
                                    task_text = line.split(":", 1)[1].strip()
                                    todos.append({
                                        "text": task_text,
                                        "complete": False,
                                        "due_date": "No due date"
                                    })
                    except Exception as e:
                        print(f"Error processing entry: {str(e)}")
                        continue
                
                # Format recent outfits
                recent_outfits = []
                for entry in recent_entries:
                    # Only include past events
                    if not self._safely_compare_dates(entry.date, today):
                        entry_date_str = strip_timezone(entry.date).strftime('%Y-%m-%d')
                        outfit_desc = f"Outfit worn on {entry_date_str}"
                        if entry.occasion:
                            outfit_desc += f" for {entry.occasion}"
                        outfit_desc += f". Weather: {entry.weather}" if entry.weather else ""
                        recent_outfits.append(outfit_desc)
                
                # Update user data
                self.user_data["occasions"] = upcoming_occasions
                self.user_data["todos"] = todos
                
                # Now try to add data from the Flask session if available
                try:
                    # Access Flask's request context, which might have client-side data
                    from flask import request, session, has_request_context
                    
                    if has_request_context():
                        print("Found Flask request context, checking for client-side data")
                        
                        # Process cookies
                        try:
                            # Try to get todo list from cookies first
                            todo_cookie = request.cookies.get('todoList')
                            if todo_cookie:
                                print(f"Found todo list in cookies: {todo_cookie[:50]}...")
                                try:
                                    # First URL decode the cookie value
                                    decoded_todo = urllib.parse.unquote(todo_cookie)
                                    print(f"Decoded todo cookie: {decoded_todo[:50]}...")
                                    json_todos = json.loads(decoded_todo)
                                    
                                    if json_todos and len(json_todos) > 0:
                                        # Clear previous todos to avoid duplicates
                                        new_todos = []
                                        for todo_item in json_todos:
                                            new_todos.append({
                                                "text": todo_item.get("task", ""),
                                                "complete": todo_item.get("complete", False),
                                                "due_date": todo_item.get("due_date", "No due date")
                                            })
                                        # Update user data with the newer todos
                                        if new_todos:
                                            print(f"Updating with {len(new_todos)} todos from cookie")
                                            self.user_data["todos"] = new_todos
                                except json.JSONDecodeError as e:
                                    print(f"Error parsing decoded todo cookie: {str(e)}")
                                    print(f"Content: {decoded_todo[:100]}")
                                except Exception as e:
                                    print(f"Unexpected error processing todo cookie: {str(e)}")
                            
                            # Try to get upcoming occasions from cookies
                            occasions_cookie = request.cookies.get('upcomingOccasions')
                            if occasions_cookie:
                                print(f"Found occasions in cookies: {occasions_cookie[:50]}...")
                                try:
                                    # First URL decode the cookie value
                                    decoded_occasions = urllib.parse.unquote(occasions_cookie)
                                    print(f"Decoded occasions cookie: {decoded_occasions[:50]}...")
                                    json_occasions = json.loads(decoded_occasions)
                                    
                                    if json_occasions and len(json_occasions) > 0:
                                        # Clear previous occasions to avoid duplicates
                                        new_occasions = []
                                        for occasion in json_occasions:
                                            new_occasions.append({
                                                "event": occasion.get("name", ""),
                                                "date": occasion.get("date", ""),
                                                "description": occasion.get("notes", "")
                                            })
                                        # Update user data with the newer occasions
                                        if new_occasions:
                                            print(f"Updating with {len(new_occasions)} occasions from cookie")
                                            self.user_data["occasions"] = new_occasions
                                except json.JSONDecodeError as e:
                                    print(f"Error parsing decoded occasions cookie: {str(e)}")
                                    print(f"Content: {decoded_occasions[:100]}")
                                except Exception as e:
                                    print(f"Unexpected error processing occasions cookie: {str(e)}")
                                    
                            # Try to get outfit metadata from cookies
                            outfit_cookie = request.cookies.get('outfitMetadata')
                            if outfit_cookie:
                                print(f"Found outfit metadata in cookies: {outfit_cookie[:50]}...")
                                try:
                                    # First URL decode the cookie value
                                    decoded_outfits = urllib.parse.unquote(outfit_cookie)
                                    print(f"Decoded outfit cookie: {decoded_outfits[:50]}...")
                                    json_outfits = json.loads(decoded_outfits)
                                    
                                    if json_outfits and len(json_outfits) > 0:
                                        # Update user data with outfit descriptions
                                        print(f"Updating with {len(json_outfits)} outfit descriptions from cookie")
                                        self.user_data["outfit_descriptions"] = json_outfits
                                except json.JSONDecodeError as e:
                                    print(f"Error parsing decoded outfit metadata cookie: {str(e)}")
                                    print(f"Content: {decoded_outfits[:100]}")
                                except Exception as e:
                                    print(f"Unexpected error processing outfit metadata cookie: {str(e)}")
                        except Exception as e:
                            print(f"Error processing cookies: {str(e)}")
                        
                        # Then try session as fallback
                        try:
                            if 'todoList' in session:
                                print("Found todo list in session")
                                try:
                                    # Session data might be stored as a string or directly as an object
                                    if isinstance(session['todoList'], str):
                                        json_todos = json.loads(session['todoList'])
                                    else:
                                        json_todos = session['todoList']
                                        
                                    if json_todos and len(json_todos) > 0:
                                        todos = []
                                        for todo_item in json_todos:
                                            todos.append({
                                                "text": todo_item.get("task", ""),
                                                "complete": todo_item.get("complete", False),
                                                "due_date": todo_item.get("due_date", "No due date")
                                            })
                                        self.user_data["todos"] = todos
                                except json.JSONDecodeError as e:
                                    print(f"Error parsing session todos: {str(e)}")
                                except Exception as e:
                                    print(f"Unexpected error processing session todos: {str(e)}")
                            
                            if 'upcomingOccasions' in session:
                                print("Found occasions in session")
                                try:
                                    # Session data might be stored as a string or directly as an object
                                    if isinstance(session['upcomingOccasions'], str):
                                        json_occasions = json.loads(session['upcomingOccasions'])
                                    else:
                                        json_occasions = session['upcomingOccasions']
                                        
                                    if json_occasions and len(json_occasions) > 0:
                                        upcoming_occasions = []
                                        for occasion in json_occasions:
                                            upcoming_occasions.append({
                                                "event": occasion.get("name", ""),
                                                "date": occasion.get("date", ""),
                                                "description": occasion.get("notes", "")
                                            })
                                        self.user_data["occasions"] = upcoming_occasions
                                except json.JSONDecodeError as e:
                                    print(f"Error parsing session occasions: {str(e)}")
                                except Exception as e:
                                    print(f"Unexpected error processing session occasions: {str(e)}")
                        except Exception as e:
                            print(f"Error processing session data: {str(e)}")
                    else:
                        print("No Flask request context available")
                        
                except ImportError:
                    print("Flask not available, skipping session data")
                except Exception as e:
                    print(f"Error accessing Flask session data: {str(e)}")
                
                # Check local storage data via Flask request if available
                try:
                    from flask import request, has_request_context
                    if has_request_context() and hasattr(request, 'json') and request.json:
                        client_data = request.json.get('clientData', {})
                        
                        if client_data:
                            print("Found client data in request JSON")
                            
                            # Process todo list from request
                            if 'todoList' in client_data:
                                try:
                                    todo_data = client_data['todoList']
                                    if isinstance(todo_data, str):
                                        todo_data = json.loads(todo_data)
                                    
                                    if todo_data and len(todo_data) > 0:
                                        new_todos = []
                                        for todo_item in todo_data:
                                            new_todos.append({
                                                "text": todo_item.get("task", ""),
                                                "complete": todo_item.get("complete", False),
                                                "due_date": todo_item.get("due_date", "No due date")
                                            })
                                        
                                        if new_todos:
                                            print(f"Updating with {len(new_todos)} todos from request JSON")
                                            self.user_data["todos"] = new_todos
                                except Exception as e:
                                    print(f"Error processing todo list from request JSON: {str(e)}")
                            
                            # Process occasions from request
                            if 'upcomingOccasions' in client_data:
                                try:
                                    occasions_data = client_data['upcomingOccasions']
                                    if isinstance(occasions_data, str):
                                        occasions_data = json.loads(occasions_data)
                                    
                                    if occasions_data and len(occasions_data) > 0:
                                        new_occasions = []
                                        for occasion in occasions_data:
                                            new_occasions.append({
                                                "event": occasion.get("name", ""),
                                                "date": occasion.get("date", ""),
                                                "description": occasion.get("notes", "")
                                            })
                                        
                                        if new_occasions:
                                            print(f"Updating with {len(new_occasions)} occasions from request JSON")
                                            self.user_data["occasions"] = new_occasions
                                except Exception as e:
                                    print(f"Error processing occasions from request JSON: {str(e)}")
                                    
                            # Process outfit metadata from request
                            if 'outfitMetadata' in client_data:
                                try:
                                    outfit_data = client_data['outfitMetadata']
                                    if isinstance(outfit_data, str):
                                        outfit_data = json.loads(outfit_data)
                                    
                                    if outfit_data and len(outfit_data) > 0:
                                        print(f"Updating with {len(outfit_data)} outfit descriptions from request JSON")
                                        self.user_data["outfit_descriptions"] = outfit_data
                                except Exception as e:
                                    print(f"Error processing outfit metadata from request JSON: {str(e)}")
                                    
                            # Process vault entries summary from request
                            if 'vaultEntriesSummary' in client_data:
                                try:
                                    entries_data = client_data['vaultEntriesSummary']
                                    if isinstance(entries_data, str):
                                        entries_data = json.loads(entries_data)
                                    
                                    if entries_data and len(entries_data) > 0:
                                        print(f"Updating with {len(entries_data)} vault entries from request JSON")
                                        # Only use this if we don't already have outfit descriptions
                                        if not self.user_data["outfit_descriptions"]:
                                            self.user_data["outfit_descriptions"] = entries_data
                                except Exception as e:
                                    print(f"Error processing vault entries from request JSON: {str(e)}")
                except Exception as e:
                    print(f"Error checking request JSON data: {str(e)}")
                
                # If we still don't have outfit descriptions, try to extract them from wardrobe data
                if not self.user_data.get("outfit_descriptions"):
                    self.user_data["outfit_descriptions"] = self._extract_outfit_descriptions()
                
                # Format the context with the latest data
                context = f"""
                User Wardrobe Information:
                - {tops_count} tops
                - {bottoms_count} bottoms
                - {upper_body_count} upper body items (jackets, sweaters, etc.)
                - {lower_body_count} lower body items (pants, skirts, etc.)
                
                Recent Outfits:
                {chr(10).join([f"- {outfit}" for outfit in recent_outfits]) if recent_outfits else "- No recent outfit data available"}
                """
                
                # Add Upcoming Occasions section
                if self.user_data["occasions"]:
                    context += "\nUpcoming Occasions:\n"
                    for occ in self.user_data["occasions"]:
                        context += f"- {occ['event']} on {occ['date']}"
                        if occ['description']:
                            context += f": {occ['description']}"
                        context += "\n"
                else:
                    context += "\nUpcoming Occasions:\n- No upcoming occasions found\n"
                
                # Add Todo Items section
                if self.user_data["todos"]:
                    context += "\nTodo Items:\n"
                    for todo in self.user_data["todos"]:
                        context += f"- {todo['text']} (Due: {todo['due_date']})"
                        if todo['complete']:
                            context += " [COMPLETED]"
                        context += "\n"
                else:
                    context += "\nTodo Items:\n- No todo items found\n"
                
                # Add Outfit Descriptions section
                if self.user_data["outfit_descriptions"]:
                    context += "\nOutfit Descriptions and Notes:\n"
                    # Sort by date in descending order (newest first)
                    sorted_outfits = sorted(
                        self.user_data["outfit_descriptions"],
                        key=lambda x: x.get("date", ""),
                        reverse=True
                    )
                    
                    # Only show the 5 most recent entries
                    for outfit in sorted_outfits[:5]:
                        date_str = outfit.get("date", "Unknown date")
                        occasion = outfit.get("occasion", "")
                        description = outfit.get("description", "")
                        notes = outfit.get("notes", "")
                        rating = outfit.get("rating")
                        
                        entry = f"- Outfit from {date_str}"
                        if occasion:
                            entry += f" for {occasion}"
                        if rating:
                            entry += f" (Rated: {rating}/10)"
                        entry += ":"
                        
                        if description:
                            entry += f"\n  Description: {description}"
                        if notes:
                            entry += f"\n  Improvement Notes: {notes}"
                        
                        context += f"{entry}\n"
                
                return context
                
            except Exception as e:
                print(f"Error getting wardrobe context: {str(e)}")
                
                # Fallback to dummy data
                dummy_context = """
                User Wardrobe Information:
                - 5 tops
                - 3 bottoms
                - 2 upper body items (jackets, sweaters, etc.)
                - 4 lower body items (pants, skirts, etc.)
                
                Recent Outfits:
                - No recent outfit data available
                
                Upcoming Occasions:
                - Company Party on 2025-04-15: Formal attire required
                - Friend's Wedding on 2025-05-01: Bring gift
                - Beach Day on 2025-06-10: Casual summer outfit
                
                Todo Items:
                - Organize summer wardrobe (Due: 2025-04-15)
                - Buy new dress shoes (Due: 2025-04-20)
                - Donate unused clothes (Due: 2025-03-30) [COMPLETED]
                """
                
                return dummy_context
    
    def _prepare_system_prompt(self, weather_data: Optional[Dict[str, Any]] = None) -> str:
        """Prepare the system prompt with context information."""
        # Always force a refresh of the wardrobe data when preparing a new prompt
        wardrobe_context = self._get_wardrobe_context(force_refresh=True)
        
        weather_context = ""
        if weather_data:
            current = weather_data.get("current", {})
            location = weather_data.get("location", {})
            
            temp = current.get("main", {}).get("temp")
            weather = current.get("weather", [{}])[0].get("main")
            description = current.get("weather", [{}])[0].get("description")
            location_name = location.get("name", "Unknown")
            
            weather_context = f"""
            Current Weather in {location_name}:
            - Temperature: {temp}°C
            - Conditions: {weather} ({description})
            """
            
            # Add forecast
            forecast = weather_data.get("daily_summary", [])
            if forecast:
                weather_context += "\nWeather Forecast:\n"
                for day in forecast[:3]:  # Next 3 days
                    weather_context += f"- {day['date']}: {day['main_weather']}, Min: {day['min_temp']}°C, Max: {day['max_temp']}°C\n"
        
        system_prompt = f"""
        You are StyleBot, a helpful fashion and lifestyle assistant integrated with the user's wardrobe management app. 
        
        IMPORTANT: You MUST ONLY discuss information from the user's wardrobe data, todos, occasions, and outfit descriptions provided below.
        DO NOT make up or provide any information beyond what is explicitly listed in this context.
        
        User Information:
        {wardrobe_context}
        
        {weather_context if weather_context else ""}
        
        Guidelines:
        1. ONLY provide information contained in the context above - never invent information
        2. When asked about todos or tasks, list ONLY the exact todo items shown in the 'Todo Items' section
        3. When asked about occasions or events, list ONLY the exact upcoming occasions from the 'Upcoming Occasions' section
        4. When asked about outfits or clothing, use ONLY the wardrobe information and outfit descriptions shown here
        5. When asked about outfit descriptions or notes, use the information from the 'Outfit Descriptions and Notes' section
        6. Be conversational and helpful, but NEVER provide information not listed in the context
        7. If asked about something not in the context, politely explain you only have access to the information shown here
        8. If there are no todos, occasions, or outfit descriptions to report, directly state that none are found in the system
        9. Always focus on providing the user's personal wardrobe data - never general fashion advice unless it relates to their specific items
        10. If a user asks for updates, check the data you have and inform them of the most recent information
        """
        
        return system_prompt
    
    def get_response(self, user_message: str, weather_data: Optional[Dict[str, Any]] = None, client_data: Optional[Dict[str, Any]] = None) -> str:
        """
        Get a response from the chatbot.
        
        Args:
            user_message: User's query
            weather_data: Optional weather data
            client_data: Optional client-side data (localStorage contents)
        """
        try:
            # If client data is provided, update the user data first
            if client_data:
                print("Processing client data from request")
                try:
                    # Process todo list
                    if 'todoList' in client_data:
                        todo_data = client_data['todoList']
                        if isinstance(todo_data, str):
                            todo_data = json.loads(todo_data)
                        
                        if todo_data and len(todo_data) > 0:
                            new_todos = []
                            for todo_item in todo_data:
                                new_todos.append({
                                    "text": todo_item.get("task", ""),
                                    "complete": todo_item.get("complete", False),
                                    "due_date": todo_item.get("due_date", "No due date")
                                })
                            
                            if new_todos:
                                print(f"Updating with {len(new_todos)} todos from client data")
                                self.user_data["todos"] = new_todos
                    
                    # Process occasions
                    if 'upcomingOccasions' in client_data:
                        occasions_data = client_data['upcomingOccasions']
                        if isinstance(occasions_data, str):
                            occasions_data = json.loads(occasions_data)
                        
                        if occasions_data and len(occasions_data) > 0:
                            new_occasions = []
                            for occasion in occasions_data:
                                new_occasions.append({
                                    "event": occasion.get("name", ""),
                                    "date": occasion.get("date", ""),
                                    "description": occasion.get("notes", "")
                                })
                            
                            if new_occasions:
                                print(f"Updating with {len(new_occasions)} occasions from client data")
                                self.user_data["occasions"] = new_occasions
                    
                    # Process outfit metadata (descriptions and notes)
                    if 'outfitMetadata' in client_data:
                        outfit_data = client_data['outfitMetadata']
                        if isinstance(outfit_data, str):
                            outfit_data = json.loads(outfit_data)
                        
                        if outfit_data and len(outfit_data) > 0:
                            print(f"Updating with {len(outfit_data)} outfit descriptions from client data")
                            self.user_data["outfit_descriptions"] = outfit_data
                    
                    # Process vault entries summary
                    if 'vaultEntriesSummary' in client_data:
                        entries_data = client_data['vaultEntriesSummary']
                        if isinstance(entries_data, str):
                            entries_data = json.loads(entries_data)
                        
                        if entries_data and len(entries_data) > 0:
                            print(f"Updating with {len(entries_data)} vault entries from client data")
                            # Only use this if we don't already have outfit descriptions
                            if not self.user_data.get("outfit_descriptions"):
                                self.user_data["outfit_descriptions"] = entries_data
                except Exception as e:
                    print(f"Error processing client data: {str(e)}")
            
            # Reinitialize the chat for each new message to ensure context is fresh
            self.chat_history = self.model.start_chat(history=[])
            
            system_prompt = self._prepare_system_prompt(weather_data)
            
            # Add system prompt as first message
            try:
                system_message_response = self.chat_history.send_message(system_prompt)
            except Exception as e:
                print(f"Error sending system prompt: {str(e)}")
                # Proceed anyway - the model can still function without the system prompt
            
            # Check if user is asking about specific topics to enhance the query
            todo_keywords = ["todo", "to-do", "to do", "task", "reminder", "things to do", "what do I need to do"]
            event_keywords = ["event", "occasion", "calendar", "schedule", "coming up", "upcoming"]
            update_keywords = ["update", "refresh", "latest", "current", "now", "today", "changed"]
            outfit_keywords = ["outfit", "description", "wore", "clothing", "fashion", "style", "dress", "attire", "improve", "notes"]
            
            # Always force a refresh when specific keywords are detected
            if any(keyword in user_message.lower() for keyword in update_keywords + todo_keywords + event_keywords + outfit_keywords):
                # Re-fetch the wardrobe context with force_refresh=True to ensure we have the latest data
                refreshed_context = self._get_wardrobe_context(force_refresh=True)
                refresh_message = "I've updated my information with the latest data from your wardrobe."
                self.chat_history.send_message(refresh_message)
            
            # Add a prompt to get more specific responses about todos and events
            enhanced_message = user_message
            if any(keyword in user_message.lower() for keyword in todo_keywords):
                enhanced_message += "\nIMPORTANT: List ONLY the exact todo items from the context, with their exact due dates and completion status. Do not make up any additional information."
            
            if any(keyword in user_message.lower() for keyword in event_keywords):
                enhanced_message += "\nIMPORTANT: List ONLY the exact upcoming occasions from the context, with their exact dates and descriptions. Do not make up any additional information."
            
            if any(keyword in user_message.lower() for keyword in outfit_keywords):
                enhanced_message += "\nIMPORTANT: When discussing outfits, use ONLY the information from the 'Outfit Descriptions and Notes' section. Include any descriptions and improvement notes when they are available."
                
            # Get response
            response = self.chat_history.send_message(enhanced_message)
            return response.text
        except Exception as e:
            print(f"Error getting chatbot response: {str(e)}")
            return "I'm having trouble accessing your wardrobe data right now. Here's what I know:\n\n" + self._get_wardrobe_context(force_refresh=True)