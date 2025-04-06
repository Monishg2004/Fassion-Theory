
import os
import json
import threading
from typing import List, Optional, Union, Dict, Any, Tuple, ClassVar
from uuid import uuid4
from enum import Enum
from datetime import datetime
from pydantic import BaseModel

from consts import CLOTHING_METADATA_PATH

# Enum for clothing parts
class ClothesPart(str, Enum):
    top = "top"
    bottom = "bottom"
    upper_body = "upper_body"
    lower_body = "lower_body"
    accessory = "accessory"
    footwear = "footwear"
    headwear = "headwear"

class TodoItem(BaseModel):
    id: str
    text: str
    complete: bool = False
    due_date: Optional[datetime] = None

class ClothingInfo(BaseModel):
    uuid: str = None
    path: str
    rgbs: List[Tuple[Tuple[int, int, int], float]]  # List of (RGB, percentage) tuples
    clothes_part: Union[ClothesPart, str]
    
    # New fields for marketplace integration
    product_id: Optional[str] = None
    is_purchased: bool = False
    purchase_date: Optional[datetime] = None
    trader_id: Optional[str] = None
    price: Optional[float] = None
    sustainable_rating: Optional[int] = None
    cultural_info: Optional[str] = None
    materials: List[str] = []
    
    def __init__(self, **data):
        if 'uuid' not in data or data['uuid'] is None:
            data['uuid'] = str(uuid4())
        super().__init__(**data)

class Fit(BaseModel):
    uuid: str = None
    clothes: List[ClothingInfo]
    name: Optional[str] = None
    date_created: Optional[datetime] = None
    occasion: Optional[str] = None
    
    def __init__(self, **data):
        if 'uuid' not in data or data['uuid'] is None:
            data['uuid'] = str(uuid4())
        if 'date_created' not in data or data['date_created'] is None:
            data['date_created'] = datetime.now()
        super().__init__(**data)

class VaultEntry(BaseModel):
    uuid: str = None
    date: datetime
    outfit: Fit
    notes: str = ""
    description: str = ""
    occasion: str = ""
    weather: str = ""
    image: Optional[str] = None  # Base64 encoded image
    todo_items: List[TodoItem] = []
    
    def __init__(self, **data):
        if 'uuid' not in data or data['uuid'] is None:
            data['uuid'] = str(uuid4())
        super().__init__(**data)

class Wardrobe(BaseModel):
    available_clothes: List[ClothingInfo] = []
    favourite_fits: List[Fit] = []
    vault_entries: List[VaultEntry] = []
    
    # Track purchased items
    purchased_items: List[ClothingInfo] = []
    
    # Enable file access synchronization
    # Use ClassVar to tell Pydantic this isn't a field
    metadata_lock: ClassVar[threading.Lock] = threading.Lock()

    def remove_clothing_from_wardrobe(self, uuid: str) -> None:
        self.available_clothes = [c for c in self.available_clothes if c.uuid != uuid]

        # Update references in fits to replace the removed clothing
        for fit in self.favourite_fits:
            fit.clothes = [c for c in fit.clothes if c.uuid != uuid]

    def remove_fit_from_favourites(self, uuid: str) -> None:
        self.favourite_fits = [f for f in self.favourite_fits if f.uuid != uuid]

    def get_clothing_by_uuid(self, uuid: str) -> ClothingInfo:
        for clothing in self.available_clothes:
            if clothing.uuid == uuid:
                return clothing
        raise ValueError(f"Clothing with uuid {uuid} not found")

    def get_fit_by_uuid(self, uuid: str) -> Fit:
        for fit in self.favourite_fits:
            if fit.uuid == uuid:
                return fit
        raise ValueError(f"Fit with uuid {uuid} not found")

    def get_gear(self, part: Union[ClothesPart, str]) -> List[ClothingInfo]:
        return [clothing for clothing in self.available_clothes if clothing.clothes_part == part]

    def add_vault_entry(self, entry: VaultEntry) -> None:
        self.vault_entries.append(entry)
    
    def remove_vault_entry(self, uuid: str) -> None:
        self.vault_entries = [e for e in self.vault_entries if e.uuid != uuid]
    
    def get_vault_entry_by_uuid(self, uuid: str) -> VaultEntry:
        for entry in self.vault_entries:
            if entry.uuid == uuid:
                return entry
        raise ValueError(f"Vault entry with uuid {uuid} not found")
    
    def get_vault_entries_by_date_range(self, start_date: datetime, end_date: datetime) -> List[VaultEntry]:
        # Ensure dates are offset-naive for comparison
        if hasattr(start_date, 'tzinfo') and start_date.tzinfo is not None:
            start_date = start_date.replace(tzinfo=None)
        if hasattr(end_date, 'tzinfo') and end_date.tzinfo is not None:
            end_date = end_date.replace(tzinfo=None)
            
        filtered_entries = []
        for entry in self.vault_entries:
            entry_date = entry.date
            # Make entry date offset-naive for comparison
            if hasattr(entry_date, 'tzinfo') and entry_date.tzinfo is not None:
                entry_date = entry_date.replace(tzinfo=None)
                
            if start_date <= entry_date <= end_date:
                filtered_entries.append(entry)
                
        return filtered_entries
    
    # New method to add purchased item to wardrobe
    def add_purchased_item(self, clothing: ClothingInfo) -> None:
        # Make a copy to ensure it's properly added to the wardrobe
        clothing.is_purchased = True
        clothing.purchase_date = datetime.now()
        
        # Add to both available clothes and purchased items
        self.available_clothes.append(clothing)
        self.purchased_items.append(clothing)
    
    # Get purchased items by trader
    def get_items_by_trader(self, trader_id: str) -> List[ClothingInfo]:
        return [item for item in self.purchased_items if item.trader_id == trader_id]
    
    @classmethod
    def load_clothes(cls) -> 'Wardrobe':
        if os.path.exists(CLOTHING_METADATA_PATH):
            try:
                with open(CLOTHING_METADATA_PATH, "r") as f:
                    data = json.loads(f.read())
                return cls(**data)
            except json.JSONDecodeError:
                print("Error decoding wardrobe JSON, creating new wardrobe")
                return cls()
            except Exception as e:
                print(f"Error loading wardrobe: {e}")
                return cls()
        return cls()

    def save_clothes(self) -> None:
        with open(CLOTHING_METADATA_PATH, "w") as f:
            f.write(json.dumps(self.dict(), default=str))