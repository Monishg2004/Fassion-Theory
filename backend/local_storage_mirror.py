#local_storage_mirror.py
from flask import request, jsonify
import json

def setup_local_storage_mirror(app):
    """
    Set up a middleware to mirror local storage data from frontend to backend.
    Add this to your Flask app initialization.
    """
    
    @app.route('/mirror_local_storage', methods=['POST'])
    def mirror_local_storage():
        """
        Endpoint to receive local storage data from the frontend.
        This allows the chatbot to access the user's todos and occasions.
        """
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
                
            # Save the local storage data to a file
            with open('localStorage_mirror.json', 'w') as f:
                json.dump(data, f)
                
            return jsonify({"message": "Local storage mirrored successfully"}), 200
        except Exception as e:
            print(f"Error mirroring local storage: {str(e)}")
            return jsonify({"error": str(e)}), 500

# Add this to your main app.py file:
# from local_storage_mirror import setup_local_storage_mirror
# setup_local_storage_mirror(app)