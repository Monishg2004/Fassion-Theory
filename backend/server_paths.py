
#server_paths.py
import os
import io
import shutil
import base64
import itertools
from datetime import datetime
import json
from uuid import uuid4

from flask import Flask, request, jsonify
from pydantic import BaseModel

from consts import CLOTHING_STORAGE_DIR, CLOTHING_METADATA_PATH, generate_random_path
from image_classes import Wardrobe, ClothingInfo, ClothesPart, Fit, VaultEntry, TodoItem
from image_processing import remove_background, get_dominant_colors_with_percentage, calculate_complementarity_score
from weather_api import get_weather_for_location, get_current_weather, get_forecast, get_clothing_suggestion, process_forecast_to_daily, get_clothing_recommendation_by_coords
from chatbot_service import ChatbotService
from PIL import Image


from local_storage_mirror import setup_local_storage_mirror
app = Flask(__name__)
# app.config["UPLOAD_FOLDER"] = CLOTHING_STORAGE_DIR
setup_local_storage_mirror(app)
if not os.path.exists(CLOTHING_STORAGE_DIR):
    os.makedirs(CLOTHING_STORAGE_DIR)

# Initialize chatbot service
chatbot = ChatbotService()

def strip_timezone(dt):
    """Helper function to make a datetime offset-naive if it has timezone info."""
    if dt and hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

def pydantic_list_to_json(pydantic_objects: list[BaseModel]) -> list[dict]:
    return list(map(lambda obj: obj.dict(), pydantic_objects))


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not file:
        return jsonify({"error": f"File appears as None: {file}"}), 400

    if "category" not in request.form:
        return jsonify({"error": "No category part"}), 400

    category = request.form["category"]

    file_binary = file.read()
    output_image_bytes = remove_background(file_binary)

    # Create an image object from the byte data
    output_image = Image.open(io.BytesIO(output_image_bytes))

    # Save the result to a file path
    file_path = generate_random_path()
    output_image.save(file_path)

    rgbs_with_percent = get_dominant_colors_with_percentage(file_path)

    # TODO get clothes part from drop down menu
    clothing = ClothingInfo(path=file_path, rgbs=rgbs_with_percent, clothes_part=category)

    with Wardrobe.metadata_lock:
        wardrobe = Wardrobe.load_clothes()
        wardrobe.available_clothes.append(clothing)
        wardrobe.save_clothes()

    return jsonify({"message": "File successfully uploaded"}), 200


@app.route("/get_available_clothes")
def get_available_clothes():
    wardrobe = Wardrobe.load_clothes()
    return pydantic_list_to_json(wardrobe.available_clothes), 200


@app.route("/get_favourite_fits")
def get_favourite_fits():
    wardrobe = Wardrobe.load_clothes()
    return pydantic_list_to_json(wardrobe.favourite_fits), 200


@app.route("/clear_wardrobe")
def clear_wardrobe():
    with Wardrobe.metadata_lock:
        Wardrobe(available_clothes=[]).save_clothes()
        shutil.rmtree(CLOTHING_STORAGE_DIR)
    return "Successfully cleared wardrobe", 200


@app.route("/remove_clothing", methods=["POST"])
def remove_clothing():
    request_data = request.get_json()
    if "uuid" not in request_data:
        return jsonify({"error": "uuid identifier not found (required to remove clothing)"}), 400

    with Wardrobe.metadata_lock:
        wardrobe = Wardrobe.load_clothes()
        clothing_to_remove = wardrobe.get_clothing_by_uuid(request_data["uuid"])
        wardrobe.remove_clothing_from_wardrobe(clothing_to_remove.uuid)
        wardrobe.save_clothes()

        # Delete the file from the filesystem
        if os.path.exists(clothing_to_remove.path):
            os.remove(clothing_to_remove.path)

    return f"Successfully removed {request_data['uuid']} from wardrobe", 200


@app.route("/save_fav_fit", methods=["POST"])
def save_fav_fit():
    request_data = request.get_json()
    if "uuids" not in request_data:
        return jsonify({"error": "list of uuids not found (param required to save fit)"}), 400

    print(f"uuids: {request_data['uuids']}")

    with Wardrobe.metadata_lock:
        wardrobe = Wardrobe.load_clothes()
        print(f"wardrobe: {wardrobe}")
        print(f"available_clothes: {wardrobe.available_clothes}")
        clothes = list(map(lambda uuid: wardrobe.get_clothing_by_uuid(uuid), request_data["uuids"]))
        fit = Fit(clothes=clothes)
        wardrobe.favourite_fits.append(fit)
        wardrobe.save_clothes()
    return f"Successfully added fit {fit} to the list of favourite fits", 200


@app.route("/remove_fav_fit", methods=["POST"])
def remove_fav_fit():
    request_data = request.get_json()
    if "uuid" not in request_data:
        return jsonify({"error": "uuid identifier not found (required to remove favourite fit)"}), 400

    with Wardrobe.metadata_lock:
        wardrobe = Wardrobe.load_clothes()
        wardrobe.remove_fit_from_favourites(request_data["uuid"])
        wardrobe.save_clothes()
    return f"Successfully removed favourite fit {request_data['uuid']} from wardrobe", 200


@app.route("/get_rating", methods=["POST"])
def get_rating():
    request_data = request.get_json()
    if "uuids" not in request_data:
        return jsonify({"error": "uuids identifier not found (required to get clothes for rating)"}), 400

    if len(request_data["uuids"]) == 0:
        return

    wardrobe = Wardrobe.load_clothes()

    print(request_data["uuids"])

    fit_clothing = []
    for name in request_data["uuids"]:
        fit_clothing.append(wardrobe.get_clothing_by_uuid(name))

    percent = calculate_complementarity_score(Fit(clothes=fit_clothing))

    return jsonify({"rating": percent}), 200


@app.route("/get_image", methods=["POST"])
def get_image():
    request_data = request.get_json()
    if "uuid" not in request_data:
        return jsonify({"error": f"uuid identifier not found (required to get image - got {request_data})"}), 400

    wardrobe = Wardrobe.load_clothes()
    try:
        clothing = wardrobe.get_clothing_by_uuid(request_data["uuid"])
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

    # Load the image and return it as a base64 encoded string
    with open(clothing.path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    return jsonify({"image": image_data}), 200


@app.route("/get_optimal_fit")
def get_optimal_fit():
    wardrobe = Wardrobe.load_clothes()

    optimal_fits: list[tuple[Fit, float]] = []

    # Get a list of all possible permutations of 3 or 4 clothes where no two clothes can be for the same body part
    tops = wardrobe.get_gear(ClothesPart.top)
    bottoms = wardrobe.get_gear(ClothesPart.bottom)
    upper_bodies = wardrobe.get_gear(ClothesPart.upper_body)
    lower_bodies = wardrobe.get_gear(ClothesPart.lower_body)

    clothing_combos4 = itertools.product(tops, bottoms, upper_bodies, lower_bodies)
    clothing_combos3 = itertools.product(bottoms, upper_bodies, lower_bodies)
    for combo in itertools.chain(clothing_combos4, clothing_combos3):
        fit = Fit(clothes=list(combo))
        score = calculate_complementarity_score(fit)
        if score > 0.5:
            optimal_fits.append((fit, score))

    optimal_fits.sort(key=lambda x: x[1], reverse=True)
    optimal_fits_ = list(map(lambda x: x[0], optimal_fits))
    
    if not optimal_fits_:
        return jsonify({"error": "No optimal fits found"}), 404
    
    optimal_clothes = optimal_fits_[0]
    uuids = list(map(lambda clothing: clothing.uuid, optimal_clothes.clothes))

    indices = [None] * 4
    if len(optimal_clothes.clothes) != 4:
        indices[0] = 0

    for clothing in optimal_clothes.clothes:
        if clothing.clothes_part == ClothesPart.top:
            indices[0] = tops.index(clothing)
        if clothing.clothes_part == ClothesPart.upper_body:
            indices[1] = upper_bodies.index(clothing)
        if clothing.clothes_part == ClothesPart.lower_body:
            indices[2] = lower_bodies.index(clothing)
        if clothing.clothes_part == ClothesPart.bottom:
            indices[3] = bottoms.index(clothing)

    return jsonify({"optimal_index_groups": indices, "uuids": uuids}), 200


@app.route("/add_vault_entry", methods=["POST"])
def add_vault_entry():
    request_data = request.get_json()
    
    required_fields = ["date"]
    for field in required_fields:
        if field not in request_data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    try:
        entry_date = datetime.fromisoformat(request_data["date"])
    except ValueError:
        return jsonify({"error": "Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}), 400
    
    with Wardrobe.metadata_lock:
        wardrobe = Wardrobe.load_clothes()
        
        # Get clothing items for the outfit if provided
        outfit_items = []
        if "outfit_uuids" in request_data and request_data["outfit_uuids"]:
            try:
                outfit_items = [wardrobe.get_clothing_by_uuid(uuid) for uuid in request_data["outfit_uuids"]]
            except ValueError as e:
                # Continue without outfit items if there's an error
                pass
        
        outfit = Fit(clothes=outfit_items)
        
        # Create vault entry
        vault_entry = VaultEntry(
            date=entry_date,
            outfit=outfit,
            notes=request_data.get("notes", ""),
            description=request_data.get("description", ""),
            occasion=request_data.get("occasion", ""),
            weather=request_data.get("weather", "")
        )
        
        # Initialize todo_items if provided
        if "todo_items" in request_data and request_data["todo_items"]:
            todo_items = []
            for todo_data in request_data["todo_items"]:
                due_date = None
                if "due_date" in todo_data and todo_data["due_date"]:
                    try:
                        due_date = datetime.fromisoformat(todo_data["due_date"])
                    except ValueError:
                        pass
                
                todo = TodoItem(
                    id=str(uuid4()),
                    text=todo_data.get("text", ""),
                    complete=todo_data.get("complete", False),
                    due_date=due_date
                )
                todo_items.append(todo)
            
            vault_entry.todo_items = todo_items
        
        # Add to wardrobe and save
        wardrobe.add_vault_entry(vault_entry)
        wardrobe.save_clothes()
        
        return jsonify({"uuid": vault_entry.uuid, "message": "Vault entry added successfully"}), 200


@app.route("/add_vault_entry_with_image", methods=["POST"])
def add_vault_entry_with_image():
    # Check if file is present
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Process the image
    try:
        file_binary = file.read()
        # Use your existing image processing function or create a similar one
        # that preserves more of the original image (without removing background)
        # You can modify this to use the existing remove_background function if desired
        
        # Simple image processing to save as-is
        output_image = Image.open(io.BytesIO(file_binary))
        
        # Save the image to a file
        file_path = generate_random_path()
        output_image.save(file_path)
        
        # Convert image to base64 for storing in the entry
        with open(file_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")
        
        # Get other form data
        date_str = request.form.get("date", "")
        notes = request.form.get("notes", "")
        description = request.form.get("description", "")
        occasion = request.form.get("occasion", "")
        weather = request.form.get("weather", "")
        outfit_uuids_str = request.form.get("outfit_uuids", "[]")
        
        try:
            entry_date = datetime.fromisoformat(date_str)
        except ValueError:
            return jsonify({"error": "Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}), 400
        
        with Wardrobe.metadata_lock:
            wardrobe = Wardrobe.load_clothes()
            
            # Parse outfit_uuids JSON string if present
            outfit_items = []
            try:
                if outfit_uuids_str:
                    outfit_uuids = json.loads(outfit_uuids_str)
                    if outfit_uuids:
                        outfit_items = [wardrobe.get_clothing_by_uuid(uuid) for uuid in outfit_uuids]
            except (ValueError, json.JSONDecodeError) as e:
                # Continue without outfit items if there's an error
                pass
            
            outfit = Fit(clothes=outfit_items)
            
            # Create vault entry with image
            vault_entry = VaultEntry(
                date=entry_date,
                outfit=outfit,
                notes=notes,
                description=description,
                occasion=occasion,
                weather=weather,
                image=image_data
            )
            
            # Add to wardrobe and save
            wardrobe.add_vault_entry(vault_entry)
            wardrobe.save_clothes()
            
            return jsonify({"uuid": vault_entry.uuid, "message": "Vault entry with image added successfully"}), 200
            
    except Exception as e:
        print(f"Error in add_vault_entry_with_image: {str(e)}")
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500
    

@app.route("/get_vault_entries", methods=["GET"])
def get_vault_entries():
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")
    
    # If dates provided, convert to datetime objects
    start_date = None
    end_date = None
    
    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str)
        except ValueError:
            return jsonify({"error": "Invalid start_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}), 400
    
    if end_date_str:
        try:
            end_date = datetime.fromisoformat(end_date_str)
        except ValueError:
            return jsonify({"error": "Invalid end_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}), 400
    
    wardrobe = Wardrobe.load_clothes()
    
    # Filter entries by date range if provided
    if start_date and end_date:
        entries = wardrobe.get_vault_entries_by_date_range(start_date, end_date)
    else:
        entries = wardrobe.vault_entries
    
    # Convert to JSON-serializable format
    entries_json = []
    for entry in entries:
        entry_dict = entry.dict()
        # Convert datetime to string for JSON serialization
        entry_dict["date"] = entry_dict["date"].isoformat()
        entries_json.append(entry_dict)
    
    return jsonify(entries_json), 200


@app.route("/update_vault_entry", methods=["PUT"])
def update_vault_entry():
    request_data = request.get_json()
    
    if "uuid" not in request_data:
        return jsonify({"error": "Missing required field: uuid"}), 400
    
    with Wardrobe.metadata_lock:
        wardrobe = Wardrobe.load_clothes()
        
        try:
            entry = wardrobe.get_vault_entry_by_uuid(request_data["uuid"])
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        
        # Update fields if provided
        if "notes" in request_data:
            entry.notes = request_data["notes"]
        
        if "description" in request_data:
            entry.description = request_data["description"]
        
        if "occasion" in request_data:
            entry.occasion = request_data["occasion"]
        
        if "weather" in request_data:
            entry.weather = request_data["weather"]
        
        if "date" in request_data:
            try:
                entry.date = datetime.fromisoformat(request_data["date"])
            except ValueError:
                return jsonify({"error": "Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}), 400
        
        if "outfit_uuids" in request_data:
            try:
                outfit_items = [wardrobe.get_clothing_by_uuid(uuid) for uuid in request_data["outfit_uuids"]]
                entry.outfit = Fit(clothes=outfit_items)
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
        
        # Update todo items if provided
        if "todo_items" in request_data:
            todo_items = []
            for todo_data in request_data["todo_items"]:
                # Handle existing todo items
                if "id" in todo_data and todo_data["id"]:
                    # Try to find existing todo
                    existing_todo = next((todo for todo in entry.todo_items if todo.id == todo_data["id"]), None)
                    if existing_todo:
                        # Update existing todo fields
                        if "text" in todo_data:
                            existing_todo.text = todo_data["text"]
                        if "complete" in todo_data:
                            existing_todo.complete = todo_data["complete"]
                        if "due_date" in todo_data:
                            try:
                                existing_todo.due_date = datetime.fromisoformat(todo_data["due_date"]) if todo_data["due_date"] else None
                            except ValueError:
                                pass
                        todo_items.append(existing_todo)
                        continue
                
                # Add new todo item
                due_date = None
                if "due_date" in todo_data and todo_data["due_date"]:
                    try:
                        due_date = datetime.fromisoformat(todo_data["due_date"])
                    except ValueError:
                        pass
                
                todo = TodoItem(
                    id=todo_data.get("id", str(uuid4())),
                    text=todo_data.get("text", ""),
                    complete=todo_data.get("complete", False),
                    due_date=due_date
                )
                todo_items.append(todo)
            
            entry.todo_items = todo_items
        
        wardrobe.save_clothes()
        
        return jsonify({"message": "Vault entry updated successfully"}), 200


@app.route("/delete_vault_entry", methods=["DELETE"])
def delete_vault_entry():
    uuid = request.args.get("uuid")
    
    if not uuid:
        return jsonify({"error": "Missing required parameter: uuid"}), 400
    
    with Wardrobe.metadata_lock:
        wardrobe = Wardrobe.load_clothes()
        
        try:
            # Check if entry exists
            wardrobe.get_vault_entry_by_uuid(uuid)
            # Remove entry
            wardrobe.remove_vault_entry(uuid)
            wardrobe.save_clothes()
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        
        return jsonify({"message": "Vault entry deleted successfully"}), 200


@app.route("/get_vault_statistics", methods=["GET"])
def get_vault_statistics():
    """Get statistics about clothing usage from vault entries."""
    wardrobe = Wardrobe.load_clothes()
    
    # Initialize statistics
    stats = {
        "most_worn_items": [],
        "least_worn_items": [],
        "favorite_combinations": [],
        "clothing_by_category": {},
        "occasions": {}
    }
    
    # Count clothing item frequency
    item_frequency = {}
    for entry in wardrobe.vault_entries:
        for clothing in entry.outfit.clothes:
            if clothing.uuid in item_frequency:
                item_frequency[clothing.uuid] += 1
            else:
                item_frequency[clothing.uuid] = 1
        
        # Count occasions
        if entry.occasion:
            if entry.occasion in stats["occasions"]:
                stats["occasions"][entry.occasion] += 1
            else:
                stats["occasions"][entry.occasion] = 1
    
    # Get most/least worn items
    if item_frequency:
        # Sort by frequency
        sorted_items = sorted(item_frequency.items(), key=lambda x: x[1], reverse=True)
        
        # Get most worn items (top 5)
        for uuid, count in sorted_items[:5]:
            try:
                clothing = wardrobe.get_clothing_by_uuid(uuid)
                stats["most_worn_items"].append({
                    "uuid": uuid,
                    "count": count,
                    "clothes_part": clothing.clothes_part
                })
            except ValueError:
                continue
        
        # Get least worn items (bottom 5)
        for uuid, count in sorted_items[-5:]:
            try:
                clothing = wardrobe.get_clothing_by_uuid(uuid)
                stats["least_worn_items"].append({
                    "uuid": uuid,
                    "count": count,
                    "clothes_part": clothing.clothes_part
                })
            except ValueError:
                continue
    
    # Count items by category
    for part in ClothesPart:
        stats["clothing_by_category"][part] = len(wardrobe.get_gear(part))
    
    return jsonify(stats), 200


@app.route("/get_weather", methods=["GET"])
def get_weather():
    """Get weather data for a location."""
    location = request.args.get("location")
    if not location:
        return jsonify({"error": "Location parameter is required"}), 400
    
    try:
        weather_data = get_weather_for_location(location)
        return jsonify(weather_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/get_weather_by_coords", methods=["GET"])
def get_weather_by_coords():
    """Get weather data for coordinates."""
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    
    if not lat or not lon:
        return jsonify({"error": "lat and lon parameters are required"}), 400
    
    try:
        lat, lon = float(lat), float(lon)
        current_weather = get_current_weather(lat, lon)
        forecast_data = get_forecast(lat, lon)
        
        result = {
            "current": current_weather,
            "forecast": forecast_data,
            "daily_summary": process_forecast_to_daily(forecast_data)
        }
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/get_clothing_suggestion", methods=["GET"])
def get_clothing_suggestion_route():
    """Get clothing suggestions based on weather."""
    location = request.args.get("location")
    
    if not location:
        return jsonify({"error": "Location parameter is required"}), 400
    
    try:
        weather_data = get_weather_for_location(location)
        suggestions = get_clothing_suggestion(weather_data)
        
        # Add personalized suggestions from wardrobe
        wardrobe = Wardrobe.load_clothes()
        
        # Filter available clothes based on temperature range
        personalized = {
            "top": [],
            "bottom": [],
            "upper_body": [],
            "lower_body": []
        }
        
        # Get items for each clothing part
        for part in personalized.keys():
            available_items = wardrobe.get_gear(part)
            if available_items:
                # Just suggest up to 3 random items per category
                import random
                items_to_suggest = min(3, len(available_items))
                selected_items = random.sample(available_items, items_to_suggest)
                personalized[part] = [item.uuid for item in selected_items]
        
        suggestions["personalized"] = personalized
        
        return jsonify(suggestions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# @app.route("/chatbot", methods=["POST"])
# def chatbot_message():
#     """Get a response from the chatbot."""
#     data = request.get_json()
    
#     if not data or "message" not in data:
#         return jsonify({"error": "message field is required"}), 400
    
#     try:
#         weather_data = None
#         if "location" in data:
#             # Get weather data if location provided
#             weather_data = get_weather_for_location(data["location"])
        
#         response = chatbot.get_response(data["message"], weather_data)
        
#         return jsonify({
#             "response": response,
#             "weather": weather_data
#         }), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route("/chatbot", methods=["POST"])
# def chatbot_message():
#     """Get a response from the chatbot."""
#     data = request.get_json()
    
#     if not data or "message" not in data:
#         return jsonify({"error": "message field is required"}), 400
    
#     try:
#         # Debug logging
#         print(f"Chatbot request received: {data['message']}")
        
#         # Check for any client-side state in cookies/headers that might be relevant
#         print("Looking for any client-side state in request:")
#         for key, value in request.cookies.items():
#             if key in ['todoList', 'upcomingOccasions']:
#                 print(f"Found cookie: {key} = {value[:50]}...")
        
#         weather_data = None
#         if "location" in data:
#             # Get weather data if location provided
#             print(f"Getting weather data for location: {data['location']}")
#             weather_data = get_weather_for_location(data['location'])
            
#         # Generate the response
#         response = chatbot.get_response(data["message"], weather_data)
#         print(f"Chatbot response generated: {response[:100]}...")
        
#         # Include todos and occasions in the response to help troubleshoot
#         try:
#             wardrobe = Wardrobe.load_clothes()
            
#             # Get todos (limit to 5 for brevity)
#             todos = []
#             for entry in wardrobe.vault_entries:
#                 if hasattr(entry, 'todo_items') and entry.todo_items:
#                     for todo in entry.todo_items[:5]:  # Limit to 5 per entry
#                         todos.append({
#                             "text": todo.text,
#                             "complete": todo.complete,
#                             "due_date": todo.due_date.isoformat() if todo.due_date else None
#                         })
            
#             # Get upcoming occasions (limit to 5)
#             occasions = []
#             today = datetime.now().replace(tzinfo=None)
#             for entry in sorted(
#                 wardrobe.vault_entries, 
#                 key=lambda e: strip_timezone(e.date) if e.date else today
#             )[:5]:
#                 if entry.occasion:
#                     occasions.append({
#                         "event": entry.occasion,
#                         "date": strip_timezone(entry.date).isoformat() if entry.date else None,
#                         "description": entry.description if hasattr(entry, 'description') else ""
#                     })
                    
#             debug_info = {
#                 "todos_count": len(todos),
#                 "occasions_count": len(occasions),
#                 "todos_sample": todos[:3] if todos else [],
#                 "occasions_sample": occasions[:3] if occasions else []
#             }
            
#         except Exception as e:
#             debug_info = {"error": str(e)}
        
#         return jsonify({
#             "response": response,
#             "weather": weather_data,
#             "debug_info": debug_info  # Include for debugging, remove in production
#         }), 200
#     except Exception as e:
#         print(f"Error in chatbot route: {str(e)}")
#         return jsonify({"error": str(e)}), 500
    
@app.route("/chatbot", methods=["POST"])
def chatbot_message():
    """Get a response from the chatbot."""
    data = request.get_json()
    
    if not data or "message" not in data:
        return jsonify({"error": "message field is required"}), 400
    
    try:
        # Debug logging
        print(f"Chatbot request received: {data['message']}")
        
        # Check for any client-side state in cookies/headers that might be relevant
        print("Looking for any client-side state in request:")
        client_data = {}
        
        # Process cookies
        for key, value in request.cookies.items():
            if key in ['todoList', 'upcomingOccasions', 'outfitMetadata', 'vaultEntriesSummary']:
                print(f"Found cookie: {key} = {value[:50]}...")
                # Store cookie values for processing
                client_data[key] = value
        
        # Also check if clientData was provided in the JSON payload
        if 'clientData' in data:
            print("Client data provided in request payload")
            client_data.update(data['clientData'])
        
        weather_data = None
        if "location" in data:
            # Get weather data if location provided
            print(f"Getting weather data for location: {data['location']}")
            weather_data = get_weather_for_location(data['location'])
        
        # Generate the response with client data
        response = chatbot.get_response(
            data["message"], 
            weather_data=weather_data,
            client_data=client_data
        )
        
        print(f"Chatbot response generated: {response[:100]}...")
        
        # Include debug info in the response
        debug_info = {
            "cookies_found": list(request.cookies.keys()),
            "client_data_keys": list(client_data.keys()) if client_data else []
        }
        
        # If outfit metadata is available, include a sample in debug info
        if 'outfitMetadata' in client_data or 'vaultEntriesSummary' in client_data:
            try:
                if 'outfitMetadata' in client_data:
                    metadata = client_data['outfitMetadata']
                    if isinstance(metadata, str):
                        import urllib.parse
                        decoded_metadata = urllib.parse.unquote(metadata)
                        outfit_data = json.loads(decoded_metadata)
                        debug_info["outfit_metadata_count"] = len(outfit_data)
                        debug_info["outfit_metadata_sample"] = outfit_data[:2] if outfit_data else []
                
                if 'vaultEntriesSummary' in client_data:
                    entries = client_data['vaultEntriesSummary']
                    if isinstance(entries, str):
                        import urllib.parse
                        decoded_entries = urllib.parse.unquote(entries)
                        entries_data = json.loads(decoded_entries)
                        debug_info["vault_entries_count"] = len(entries_data)
                        debug_info["vault_entries_sample"] = entries_data[:2] if entries_data else []
            except Exception as e:
                debug_info["outfit_metadata_error"] = str(e)
        
        return jsonify({
            "response": response,
            "weather": weather_data,
            "debug_info": debug_info  # Include for debugging, remove in production
        }), 200
    except Exception as e:
        print(f"Error in chatbot route: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route("/get_todos", methods=["GET"])
def get_todos():
    """Get todo items from all vault entries."""
    try:
        wardrobe = Wardrobe.load_clothes()
        
        # Get todos from all vault entries
        todos = []
        for entry in wardrobe.vault_entries:
            if hasattr(entry, 'todo_items') and entry.todo_items:
                for todo in entry.todo_items:
                    todo_dict = todo.dict()
                    
                    # Ensure due_date is serializable
                    if todo.due_date:
                        # Make due_date offset-naive if it's offset-aware
                        if hasattr(todo.due_date, 'tzinfo') and todo.due_date.tzinfo is not None:
                            todo_dict["due_date"] = todo.due_date.replace(tzinfo=None).isoformat()
                        else:
                            todo_dict["due_date"] = todo.due_date.isoformat()
                    
                    # Add entry info for context
                    todo_dict["entry_uuid"] = entry.uuid
                    
                    # Make entry date offset-naive if it's offset-aware
                    if hasattr(entry.date, 'tzinfo') and entry.date.tzinfo is not None:
                        todo_dict["entry_date"] = entry.date.replace(tzinfo=None).isoformat()
                    else:
                        todo_dict["entry_date"] = entry.date.isoformat()
                        
                    todo_dict["entry_occasion"] = entry.occasion
                    todos.append(todo_dict)
            
            # Also extract todos from notes field for backward compatibility
            if entry.notes:
                lines = entry.notes.split('\n')
                for line in lines:
                    if line.lower().startswith("todo:") or line.lower().startswith("to-do:") or "task:" in line.lower():
                        task_text = line.split(":", 1)[1].strip()
                        todos.append({
                            "id": str(uuid4()),
                            "text": task_text,
                            "complete": False,
                            "due_date": None,
                            "entry_uuid": entry.uuid,
                            "entry_date": entry.date.isoformat() if not hasattr(entry.date, 'tzinfo') or entry.date.tzinfo is None else entry.date.replace(tzinfo=None).isoformat(),
                            "entry_occasion": entry.occasion
                        })
        
        return jsonify(todos), 200
    except Exception as e:
        print(f"Error in get_todos: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route("/add_todo", methods=["POST"])
def add_todo():
    """Add a todo item to a vault entry."""
    data = request.get_json()
    
    if not data or "entry_uuid" not in data or "text" not in data:
        return jsonify({"error": "entry_uuid and text fields are required"}), 400
    
    try:
        wardrobe = Wardrobe.load_clothes()
        
        # Find the specified entry
        entry = None
        for e in wardrobe.vault_entries:
            if e.uuid == data["entry_uuid"]:
                entry = e
                break
        
        if not entry:
            return jsonify({"error": f"Vault entry with UUID {data['entry_uuid']} not found"}), 404
        
        # Parse due date if provided
        due_date = None
        if "due_date" in data and data["due_date"]:
            due_date = datetime.fromisoformat(data["due_date"])
        
        # Create a new todo item
        with Wardrobe.metadata_lock:
            # Initialize todo_items list if it doesn't exist
            if not hasattr(entry, 'todo_items'):
                entry.todo_items = []
            
            todo = TodoItem(
                id=str(uuid4()),
                text=data["text"],
                complete=data.get("complete", False),
                due_date=due_date
            )
            
            entry.todo_items.append(todo)
            wardrobe.save_clothes()
        
        return jsonify({"message": "Todo added successfully", "todo": todo.dict()}), 200
    except Exception as e:
        print(f"Error in add_todo: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/update_todo", methods=["PUT"])
def update_todo():
    """Update a todo item's status."""
    data = request.get_json()
    
    if not data or "todo_id" not in data:
        return jsonify({"error": "todo_id field is required"}), 400
    
    try:
        wardrobe = Wardrobe.load_clothes()
        todo_id = data["todo_id"]
        
        # Find the todo item
        with Wardrobe.metadata_lock:
            found = False
            for entry in wardrobe.vault_entries:
                if hasattr(entry, 'todo_items'):
                    for todo in entry.todo_items:
                        if todo.id == todo_id:
                            # Update todo properties
                            if "complete" in data:
                                todo.complete = data["complete"]
                            if "text" in data:
                                todo.text = data["text"]
                            if "due_date" in data and data["due_date"]:
                                todo.due_date = datetime.fromisoformat(data["due_date"])
                            
                            wardrobe.save_clothes()
                            found = True
                            break
                if found:
                    break
            
            if not found:
                return jsonify({"error": f"Todo with ID {todo_id} not found"}), 404
                
        return jsonify({"message": "Todo updated successfully"}), 200
    except Exception as e:
        print(f"Error in update_todo: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/delete_todo", methods=["DELETE"])
def delete_todo():
    """Delete a todo item."""
    todo_id = request.args.get("todo_id")
    if not todo_id and request.get_json():
        todo_id = request.get_json().get("todo_id")
    
    if not todo_id:
        return jsonify({"error": "todo_id parameter is required"}), 400
    
    try:
        wardrobe = Wardrobe.load_clothes()
        
        # Find and delete the todo item
        with Wardrobe.metadata_lock:
            found = False
            for entry in wardrobe.vault_entries:
                if hasattr(entry, 'todo_items'):
                    original_length = len(entry.todo_items)
                    entry.todo_items = [todo for todo in entry.todo_items if todo.id != todo_id]
                    if len(entry.todo_items) < original_length:
                        found = True
                        wardrobe.save_clothes()
                        break
            
            if not found:
                return jsonify({"error": f"Todo with ID {todo_id} not found"}), 404
                
        return jsonify({"message": "Todo deleted successfully"}), 200
    except Exception as e:
        print(f"Error in delete_todo: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/get_upcoming_occasions", methods=["GET"])
def get_upcoming_occasions():
    """Get upcoming occasions from vault entries."""
    days_str = request.args.get("days", "90")  # Default to 90 days for better user experience
    
    try:
        days = int(days_str)
        wardrobe = Wardrobe.load_clothes()
        
        # Get upcoming occasions - entries with future dates and occasion field filled
        now = datetime.now().replace(tzinfo=None)  # Ensure it's offset-naive
        upcoming = []
        
        for entry in wardrobe.vault_entries:
            # Make sure entry date is offset-naive for comparison
            entry_date = entry.date
            if hasattr(entry_date, 'tzinfo') and entry_date.tzinfo is not None:
                entry_date = entry_date.replace(tzinfo=None)
                
            # Only include entries with future dates and specified occasions
            if entry_date > now and entry.occasion:
                occasion_data = {
                    "uuid": entry.uuid,
                    "date": entry_date.isoformat(),
                    "occasion": entry.occasion,
                    "description": entry.description if hasattr(entry, 'description') else "",
                    "weather": entry.weather if entry.weather else "",
                    "notes": entry.notes if entry.notes else ""
                }
                
                # Check if within requested days range
                days_until = (entry_date - now).days
                if days_until <= days:
                    upcoming.append(occasion_data)
        
        # Sort by date (closest first)
        upcoming.sort(key=lambda x: x["date"])
        
        return jsonify(upcoming), 200
    except Exception as e:
        print(f"Error in get_upcoming_occasions: {str(e)}")
        return jsonify({"error": str(e)}), 500
@app.route("/test")
def test():
    return {"test": "test"}


@app.route('/get_clothing_recommendation_by_coords')
def get_clothing_recommendation_by_coords_route():
    """
    Get clothing recommendation for provided coordinates.
    """
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        
        # Get weather data for coordinates
        weather_data = {
            "current": get_current_weather(lat, lon),
            "forecast": get_forecast(lat, lon)
        }
        
        # Get clothing suggestion based on weather data
        clothing_recommendation = get_clothing_suggestion(weather_data)
        return jsonify(clothing_recommendation)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    
if __name__ == "__main__":
    app.run(port=5353, debug=True)