# # auth_models.py
# import os
# import json
# import bcrypt
# from uuid import uuid4
# from datetime import datetime
# from typing import List, Dict, Optional, Union, Any
# from pydantic import BaseModel, Field

# # Path for storing user authentication data
# USERS_DATA_PATH = os.path.join(os.getcwd(), "users_data.json")

# class UserRole:
#     BUYER = "buyer"
#     TRADER = "trader"

# class UserAuth(BaseModel):
#     uuid: str
#     username: str
#     email: str
#     password_hash: str
#     role: str  # "buyer" or "trader"
#     created_at: datetime
#     last_login: Optional[datetime] = None
    
#     # Trader-specific fields
#     business_name: Optional[str] = None
#     business_description: Optional[str] = None
#     location: Optional[str] = None
#     sustainable_practices: Optional[List[str]] = Field(default_factory=list)
#     cultural_heritage: Optional[str] = None
    
#     # User preferences
#     preferences: Dict[str, Any] = Field(default_factory=dict)

# class UserDatabase:
#     def __init__(self):
#         self.users = self.load_users()
    
#     def load_users(self) -> List[UserAuth]:
#         """Load users from the JSON file."""
#         if os.path.exists(USERS_DATA_PATH):
#             try:
#                 with open(USERS_DATA_PATH, 'r') as f:
#                     users_data = json.load(f)
#                     return [UserAuth.model_validate(user) for user in users_data]
#             except Exception as e:
#                 print(f"Error loading users: {e}")
#                 return []
#         return []
    
#     def save_users(self):
#         """Save users to the JSON file."""
#         users_data = [user.model_dump() for user in self.users]
#         with open(USERS_DATA_PATH, 'w') as f:
#             json.dump(users_data, f, default=str)
    
#     def create_user(self, username: str, email: str, password: str, role: str,
#                    business_name: Optional[str] = None, 
#                    business_description: Optional[str] = None,
#                    location: Optional[str] = None,
#                    sustainable_practices: Optional[List[str]] = None,
#                    cultural_heritage: Optional[str] = None) -> UserAuth:
#         """Create a new user account."""
#         # Check if user already exists
#         for user in self.users:
#             if user.username == username or user.email == email:
#                 raise ValueError("Username or email already exists")
        
#         # Hash the password
#         password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
#         # Create new user
#         new_user = UserAuth(
#             uuid=str(uuid4()),
#             username=username,
#             email=email,
#             password_hash=password_hash,
#             role=role,
#             created_at=datetime.now(),
#             business_name=business_name,
#             business_description=business_description,
#             location=location,
#             sustainable_practices=sustainable_practices or [],
#             cultural_heritage=cultural_heritage,
#             preferences={}
#         )
        
#         self.users.append(new_user)
#         self.save_users()
#         return new_user
    
#     def authenticate_user(self, username: str, password: str) -> Optional[UserAuth]:
#         """Authenticate a user with username and password."""
#         for user in self.users:
#             if user.username == username:
#                 # Verify password
#                 try:
#                     if bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
#                         # Update last login time
#                         user.last_login = datetime.now()
#                         self.save_users()
#                         return user
#                 except Exception as e:
#                     print(f"Authentication error: {e}")
#                     pass
#         return None
    
#     def get_user_by_uuid(self, uuid: str) -> Optional[UserAuth]:
#         """Get a user by UUID."""
#         for user in self.users:
#             if user.uuid == uuid:
#                 return user
#         return None
    
#     def get_user_by_username(self, username: str) -> Optional[UserAuth]:
#         """Get a user by username."""
#         for user in self.users:
#             if user.username == username:
#                 return user
#         return None
    
#     def update_user(self, uuid: str, updated_data: Dict) -> Optional[UserAuth]:
#         """Update user data."""
#         for i, user in enumerate(self.users):
#             if user.uuid == uuid:
#                 # Update fields
#                 for key, value in updated_data.items():
#                     if hasattr(user, key) and key != 'uuid' and key != 'password_hash':
#                         setattr(user, key, value)
                
#                 self.save_users()
#                 return user
#         return None
    
#     def update_user_password(self, uuid: str, new_password: str) -> bool:
#         """Update a user's password."""
#         for user in self.users:
#             if user.uuid == uuid:
#                 # Hash the new password
#                 password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
#                 user.password_hash = password_hash
#                 self.save_users()
#                 return True
#         return False
# auth_models.py
import os
import json
import bcrypt
from uuid import uuid4
from datetime import datetime
from typing import List, Dict, Optional, Union
from pydantic import BaseModel

# Path for storing user authentication data
USERS_DATA_PATH = os.path.join(os.getcwd(), "users_data.json")

class UserRole:
    BUYER = "buyer"
    TRADER = "trader"

class UserAuth(BaseModel):
    uuid: str
    username: str
    email: str
    password_hash: str
    role: str  # "buyer" or "trader"
    created_at: datetime
    last_login: Optional[datetime] = None
    
    # Trader-specific fields
    business_name: Optional[str] = None
    business_description: Optional[str] = None
    location: Optional[str] = None
    sustainable_practices: Optional[List[str]] = None
    cultural_heritage: Optional[str] = None
    
    # User preferences
    preferences: Dict = {}

class UserDatabase:
    def __init__(self):
        self.users = self.load_users()
    
    def load_users(self) -> List[UserAuth]:
        """Load users from the JSON file."""
        if os.path.exists(USERS_DATA_PATH):
            with open(USERS_DATA_PATH, 'r') as f:
                users_data = json.load(f)
                return [UserAuth(**user) for user in users_data]
        return []
    
    def save_users(self):
        """Save users to the JSON file."""
        users_data = [user.dict() for user in self.users]
        with open(USERS_DATA_PATH, 'w') as f:
            json.dump(users_data, f, default=str)
    
    def create_user(self, username: str, email: str, password: str, role: str,
                   business_name: Optional[str] = None, 
                   business_description: Optional[str] = None,
                   location: Optional[str] = None,
                   sustainable_practices: Optional[List[str]] = None,
                   cultural_heritage: Optional[str] = None) -> UserAuth:
        """Create a new user account."""
        # Check if user already exists
        for user in self.users:
            if user.username == username or user.email == email:
                raise ValueError("Username or email already exists")
        
        # Hash the password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create new user
        new_user = UserAuth(
            uuid=str(uuid4()),
            username=username,
            email=email,
            password_hash=password_hash,
            role=role,
            created_at=datetime.now(),
            business_name=business_name,
            business_description=business_description,
            location=location,
            sustainable_practices=sustainable_practices,
            cultural_heritage=cultural_heritage,
            preferences={}
        )
        
        self.users.append(new_user)
        self.save_users()
        return new_user
    
    def authenticate_user(self, username_or_email: str, password: str) -> Optional[UserAuth]:
        """Authenticate a user with username/email and password."""
        for user in self.users:
            if user.username == username_or_email or user.email == username_or_email:
                # Verify password
                if bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
                    # Update last login time
                    user.last_login = datetime.now()
                    self.save_users()
                    return user
        return None
    
    def get_user_by_uuid(self, uuid: str) -> Optional[UserAuth]:
        """Get a user by UUID."""
        for user in self.users:
            if user.uuid == uuid:
                return user
        return None
    
    def get_user_by_username(self, username: str) -> Optional[UserAuth]:
        """Get a user by username."""
        for user in self.users:
            if user.username == username:
                return user
        return None