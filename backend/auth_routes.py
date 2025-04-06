
# from flask import Blueprint, request, jsonify, session
# from auth_models import UserDatabase, UserRole
# import jwt
# import datetime
# import os
# import functools

# # Create a secret key for JWT
# JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
# JWT_EXPIRATION = datetime.timedelta(days=1)

# # Initialize user database
# user_db = UserDatabase()

# # Create Blueprint
# auth_bp = Blueprint('auth', __name__)

# @auth_bp.route('/register', methods=['POST'])
# def register():
#     """Register a new user."""
#     data = request.get_json()
    
#     if not data:
#         return jsonify({"error": "No data provided"}), 400
    
#     required_fields = ['username', 'email', 'password', 'role']
#     for field in required_fields:
#         if field not in data:
#             return jsonify({"error": f"Missing required field: {field}"}), 400
    
#     # Validate role
#     if data['role'] not in [UserRole.BUYER, UserRole.TRADER]:
#         return jsonify({"error": "Invalid role. Must be 'buyer' or 'trader'"}), 400
    
#     try:
#         # Get additional fields for traders
#         business_name = data.get('business_name')
#         business_description = data.get('business_description')
#         location = data.get('location')
#         sustainable_practices = data.get('sustainable_practices', [])
#         cultural_heritage = data.get('cultural_heritage')
        
#         # Create user
#         user = user_db.create_user(
#             username=data['username'],
#             email=data['email'],
#             password=data['password'],
#             role=data['role'],
#             business_name=business_name,
#             business_description=business_description,
#             location=location,
#             sustainable_practices=sustainable_practices,
#             cultural_heritage=cultural_heritage
#         )
        
#         # Generate token
#         token_payload = {
#             'user_id': user.uuid,
#             'username': user.username,
#             'role': user.role,
#             'exp': datetime.datetime.utcnow() + JWT_EXPIRATION
#         }
#         token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm='HS256')
        
#         return jsonify({
#             "message": "User registered successfully",
#             "token": token,
#             "user": {
#                 "uuid": user.uuid,
#                 "username": user.username,
#                 "email": user.email,
#                 "role": user.role
#             }
#         }), 201
        
#     except ValueError as e:
#         return jsonify({"error": str(e)}), 400
#     except Exception as e:
#         print(f"Registration error: {str(e)}")
#         return jsonify({"error": f"Registration failed: {str(e)}"}), 500

# @auth_bp.route('/login', methods=['POST'])
# def login():
#     """Login a user."""
#     data = request.get_json()
    
#     if not data:
#         return jsonify({"error": "No data provided"}), 400
    
#     if 'username' not in data or 'password' not in data:
#         return jsonify({"error": "Username and password are required"}), 400
    
#     try:
#         # Authenticate user
#         user = user_db.authenticate_user(data['username'], data['password'])
        
#         if not user:
#             return jsonify({"error": "Invalid credentials"}), 401
        
#         # Generate token
#         token_payload = {
#             'user_id': user.uuid,
#             'username': user.username,
#             'role': user.role,
#             'exp': datetime.datetime.utcnow() + JWT_EXPIRATION
#         }
#         token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm='HS256')
        
#         # Store in session
#         session['user_id'] = user.uuid
#         session['username'] = user.username
#         session['role'] = user.role
        
#         return jsonify({
#             "message": "Login successful",
#             "token": token,
#             "user": {
#                 "uuid": user.uuid,
#                 "username": user.username,
#                 "email": user.email,
#                 "role": user.role,
#                 "business_name": user.business_name if user.role == UserRole.TRADER else None
#             }
#         }), 200
        
#     except Exception as e:
#         print(f"Login error: {str(e)}")
#         return jsonify({"error": f"Login failed: {str(e)}"}), 500

# @auth_bp.route('/logout', methods=['POST'])
# def logout():
#     """Logout a user."""
#     # Clear session
#     session.clear()
#     return jsonify({"message": "Logout successful"}), 200

# @auth_bp.route('/profile', methods=['GET'])
# def get_profile():
#     """Get user profile."""
#     token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
#     if not token:
#         return jsonify({"error": "Authorization token required"}), 401
    
#     try:
#         # Decode token
#         payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
#         user_id = payload['user_id']
        
#         # Get user
#         user = user_db.get_user_by_uuid(user_id)
        
#         if not user:
#             return jsonify({"error": "User not found"}), 404
        
#         # Build response based on role
#         response = {
#             "uuid": user.uuid,
#             "username": user.username,
#             "email": user.email,
#             "role": user.role,
#             "created_at": user.created_at,
#             "last_login": user.last_login
#         }
        
#         # Add trader-specific fields
#         if user.role == UserRole.TRADER:
#             response.update({
#                 "business_name": user.business_name,
#                 "business_description": user.business_description,
#                 "location": user.location,
#                 "sustainable_practices": user.sustainable_practices,
#                 "cultural_heritage": user.cultural_heritage
#             })
        
#         # Add buyer-specific fields
#         if user.role == UserRole.BUYER:
#             response.update({
#                 "preferences": user.preferences
#             })
        
#         return jsonify(response), 200
        
#     except jwt.ExpiredSignatureError:
#         return jsonify({"error": "Token expired"}), 401
#     except jwt.InvalidTokenError:
#         return jsonify({"error": "Invalid token"}), 401
#     except Exception as e:
#         return jsonify({"error": f"Error fetching profile: {str(e)}"}), 500

# @auth_bp.route('/profile', methods=['PUT'])
# def update_profile():
#     """Update user profile."""
#     token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
#     if not token:
#         return jsonify({"error": "Authorization token required"}), 401
    
#     data = request.get_json()
#     if not data:
#         return jsonify({"error": "No data provided"}), 400
    
#     try:
#         # Decode token
#         payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
#         user_id = payload['user_id']
        
#         # Update user
#         updated_user = user_db.update_user(user_id, data)
        
#         if not updated_user:
#             return jsonify({"error": "User not found"}), 404
        
#         return jsonify({"message": "Profile updated successfully"}), 200
        
#     except jwt.ExpiredSignatureError:
#         return jsonify({"error": "Token expired"}), 401
#     except jwt.InvalidTokenError:
#         return jsonify({"error": "Invalid token"}), 401
#     except Exception as e:
#         return jsonify({"error": f"Error updating profile: {str(e)}"}), 500

# @auth_bp.route('/change-password', methods=['POST'])
# def change_password():
#     """Change user password."""
#     token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
#     if not token:
#         return jsonify({"error": "Authorization token required"}), 401
    
#     data = request.get_json()
#     if not data or 'current_password' not in data or 'new_password' not in data:
#         return jsonify({"error": "Current password and new password are required"}), 400
    
#     try:
#         # Decode token
#         payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
#         user_id = payload['user_id']
#         username = payload['username']
        
#         # Authenticate with current password
#         user = user_db.authenticate_user(username, data['current_password'])
        
#         if not user:
#             return jsonify({"error": "Current password is incorrect"}), 401
        
#         # Update password
#         success = user_db.update_user_password(user_id, data['new_password'])
        
#         if not success:
#             return jsonify({"error": "Failed to update password"}), 500
        
#         return jsonify({"message": "Password updated successfully"}), 200
        
#     except jwt.ExpiredSignatureError:
#         return jsonify({"error": "Token expired"}), 401
#     except jwt.InvalidTokenError:
#         return jsonify({"error": "Invalid token"}), 401
#     except Exception as e:
#         return jsonify({"error": f"Error changing password: {str(e)}"}), 500

# # Middleware for authentication
# def token_required(f):
#     @functools.wraps(f)
#     def decorated(*args, **kwargs):
#         token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
#         if not token:
#             return jsonify({"error": "Authorization token is required"}), 401
        
#         try:
#             payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
#             request.user = user_db.get_user_by_uuid(payload['user_id'])
            
#             if not request.user:
#                 return jsonify({"error": "User not found"}), 404
                
#         except jwt.ExpiredSignatureError:
#             return jsonify({"error": "Token expired"}), 401
#         except jwt.InvalidTokenError:
#             return jsonify({"error": "Invalid token"}), 401
        
#         return f(*args, **kwargs)
    
#     return decorated

# auth_routes.py
from flask import Blueprint, request, jsonify, session
from auth_models import UserDatabase, UserRole
import jwt
import datetime
import os
import functools

# Create a secret key for JWT
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
JWT_EXPIRATION = datetime.timedelta(days=1)

# Initialize user database
user_db = UserDatabase()

# Create Blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    required_fields = ['username', 'email', 'password', 'role']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Validate role
    if data['role'] not in [UserRole.BUYER, UserRole.TRADER]:
        return jsonify({"error": "Invalid role. Must be 'buyer' or 'trader'"}), 400
    
    try:
        # Get additional fields for traders
        business_name = data.get('business_name')
        business_description = data.get('business_description')
        location = data.get('location')
        sustainable_practices = data.get('sustainable_practices', [])
        cultural_heritage = data.get('cultural_heritage')
        
        # Create user
        user = user_db.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            role=data['role'],
            business_name=business_name,
            business_description=business_description,
            location=location,
            sustainable_practices=sustainable_practices,
            cultural_heritage=cultural_heritage
        )
        
        # Generate token
        token_payload = {
            'user_id': user.uuid,
            'username': user.username,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + JWT_EXPIRATION
        }
        token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": {
                "uuid": user.uuid,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "business_name": user.business_name
            }
        }), 201
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user."""
    data = request.get_json()
    
    if not data or ('username' not in data and 'email' not in data) or 'password' not in data:
        return jsonify({"error": "Username/email and password are required"}), 400
    
    try:
        # Get username or email
        username_or_email = data.get('username', data.get('email'))
        
        # Authenticate user
        user = user_db.authenticate_user(username_or_email, data['password'])
        
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401
        
        # Generate token
        token_payload = {
            'user_id': user.uuid,
            'username': user.username,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + JWT_EXPIRATION
        }
        token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm='HS256')
        
        # Store in session
        session['user_id'] = user.uuid
        session['username'] = user.username
        session['role'] = user.role
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "uuid": user.uuid,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "business_name": user.business_name if user.role == UserRole.TRADER else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout a user."""
    # Clear session
    session.clear()
    return jsonify({"message": "Logout successful"}), 200

# Middleware for authentication
def token_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({"error": "Authorization token is required"}), 401
        
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            request.user = user_db.get_user_by_uuid(payload['user_id'])
            
            if not request.user:
                return jsonify({"error": "User not found"}), 404
                
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        
        return f(*args, **kwargs)
    
    return decorated
