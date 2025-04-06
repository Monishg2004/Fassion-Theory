# product_models.py
import os
import json
import threading
from uuid import uuid4
from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from enum import Enum

# Path for storing product data
PRODUCTS_DATA_PATH = os.path.join(os.getcwd(), "products_data.json")

class ProductCategory(str, Enum):
    TOP = "top"
    BOTTOM = "bottom"
    UPPER_BODY = "upper_body"
    LOWER_BODY = "lower_body"
    ACCESSORY = "accessory"
    FOOTWEAR = "footwear"
    HEADWEAR = "headwear"

class SustainabilityRating(BaseModel):
    eco_friendly_materials: int  # 1-5 scale
    ethical_labor: int  # 1-5 scale
    carbon_footprint: int  # 1-5 scale
    waste_reduction: int  # 1-5 scale
    overall: int  # Calculated from the above

class CulturalSignificance(BaseModel):
    origin: str
    tradition: str
    story: str
    preservation_impact: str

class ProductReview(BaseModel):
    uuid: str
    user_id: str
    rating: int  # 1-5 scale
    comment: str
    created_at: datetime

class Product(BaseModel):
    uuid: str
    trader_id: str
    name: str
    description: str
    price: float
    category: ProductCategory
    path: str  # Path to the product image
    rgbs: List[tuple]  # Color information
    sustainability: Optional[SustainabilityRating] = None
    cultural_significance: Optional[CulturalSignificance] = None
    reviews: List[ProductReview] = []
    created_at: datetime
    stock: int
    materials: List[str] = []
    handcrafted: bool = False
    tags: List[str] = []

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class OrderItem(BaseModel):
    product_id: str
    price: float
    quantity: int

class Order(BaseModel):
    uuid: str
    user_id: str
    items: List[OrderItem]
    total_amount: float
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    shipping_address: Dict[str, str]
    tracking_number: Optional[str] = None

class MarketplaceDatabase:
    data_lock = threading.Lock()
    
    @staticmethod
    def load_products() -> List[Product]:
        """Load products from the JSON file."""
        if os.path.exists(PRODUCTS_DATA_PATH):
            with open(PRODUCTS_DATA_PATH, 'r') as f:
                try:
                    products_data = json.load(f)
                    return [Product(**product) for product in products_data]
                except json.JSONDecodeError:
                    return []
        return []
    
    @staticmethod
    def save_products(products: List[Product]):
        """Save products to the JSON file."""
        with MarketplaceDatabase.data_lock:
            products_data = [product.dict() for product in products]
            with open(PRODUCTS_DATA_PATH, 'w') as f:
                json.dump(products_data, f, default=str)
    
    @staticmethod
    def add_product(product: Product):
        """Add a new product to the database."""
        with MarketplaceDatabase.data_lock:
            products = MarketplaceDatabase.load_products()
            products.append(product)
            MarketplaceDatabase.save_products(products)
    
    @staticmethod
    def get_product_by_uuid(uuid: str) -> Optional[Product]:
        """Get a product by UUID."""
        products = MarketplaceDatabase.load_products()
        for product in products:
            if product.uuid == uuid:
                return product
        return None
    
    @staticmethod
    def get_products_by_trader(trader_id: str) -> List[Product]:
        """Get all products by a specific trader."""
        products = MarketplaceDatabase.load_products()
        return [product for product in products if product.trader_id == trader_id]
    
    @staticmethod
    def update_product(uuid: str, updated_data: Dict) -> Optional[Product]:
        """Update product data."""
        with MarketplaceDatabase.data_lock:
            products = MarketplaceDatabase.load_products()
            for i, product in enumerate(products):
                if product.uuid == uuid:
                    # Update fields
                    for key, value in updated_data.items():
                        if hasattr(product, key) and key != 'uuid' and key != 'trader_id':
                            setattr(product, key, value)
                    
                    products[i] = product
                    MarketplaceDatabase.save_products(products)
                    return product
        return None
    
    @staticmethod
    def delete_product(uuid: str) -> bool:
        """Delete a product by UUID."""
        with MarketplaceDatabase.data_lock:
            products = MarketplaceDatabase.load_products()
            initial_count = len(products)
            products = [product for product in products if product.uuid != uuid]
            
            if len(products) < initial_count:
                MarketplaceDatabase.save_products(products)
                return True
            return False
    
    @staticmethod
    def search_products(query: str, category: Optional[str] = None, 
                       min_price: Optional[float] = None, 
                       max_price: Optional[float] = None,
                       sustainable_only: bool = False,
                       handcrafted_only: bool = False) -> List[Product]:
        """Search products based on various criteria."""
        products = MarketplaceDatabase.load_products()
        results = []
        
        for product in products:
            # Check search query
            if query and not (query.lower() in product.name.lower() or 
                             query.lower() in product.description.lower() or
                             any(query.lower() in tag.lower() for tag in product.tags)):
                continue
            
            # Check category
            if category and product.category != category:
                continue
            
            # Check price range
            if min_price is not None and product.price < min_price:
                continue
            if max_price is not None and product.price > max_price:
                continue
            
            # Check sustainability
            if sustainable_only and (not product.sustainability or product.sustainability.overall < 4):
                continue
            
            # Check handcrafted
            if handcrafted_only and not product.handcrafted:
                continue
            
            results.append(product)
        
        return results

# Order management
class OrderDatabase:
    data_lock = threading.Lock()
    ORDERS_DATA_PATH = os.path.join(os.getcwd(), "orders_data.json")
    
    @staticmethod
    def load_orders() -> List[Order]:
        """Load orders from the JSON file."""
        if os.path.exists(OrderDatabase.ORDERS_DATA_PATH):
            with open(OrderDatabase.ORDERS_DATA_PATH, 'r') as f:
                try:
                    orders_data = json.load(f)
                    return [Order(**order) for order in orders_data]
                except json.JSONDecodeError:
                    return []
        return []
    
    @staticmethod
    def save_orders(orders: List[Order]):
        """Save orders to the JSON file."""
        with OrderDatabase.data_lock:
            orders_data = [order.dict() for order in orders]
            with open(OrderDatabase.ORDERS_DATA_PATH, 'w') as f:
                json.dump(orders_data, f, default=str)
    
    @staticmethod
    def create_order(user_id: str, items: List[OrderItem], shipping_address: Dict[str, str]) -> Order:
        """Create a new order."""
        with OrderDatabase.data_lock:
            # Calculate total amount
            total_amount = sum(item.price * item.quantity for item in items)
            
            # Create new order
            new_order = Order(
                uuid=str(uuid4()),
                user_id=user_id,
                items=items,
                total_amount=total_amount,
                status=OrderStatus.PENDING,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                shipping_address=shipping_address
            )
            
            # Save to database
            orders = OrderDatabase.load_orders()
            orders.append(new_order)
            OrderDatabase.save_orders(orders)
            
            # Update product inventory
            for item in items:
                product = MarketplaceDatabase.get_product_by_uuid(item.product_id)
                if product:
                    product.stock -= item.quantity
                    MarketplaceDatabase.update_product(product.uuid, {"stock": product.stock})
            
            return new_order
    
    @staticmethod
    def get_order_by_uuid(uuid: str) -> Optional[Order]:
        """Get an order by UUID."""
        orders = OrderDatabase.load_orders()
        for order in orders:
            if order.uuid == uuid:
                return order
        return None
    
    @staticmethod
    def get_orders_by_user(user_id: str) -> List[Order]:
        """Get all orders by a specific user."""
        orders = OrderDatabase.load_orders()
        return [order for order in orders if order.user_id == user_id]
    
    @staticmethod
    def get_trader_orders(trader_id: str) -> List[Dict[str, Any]]:
        """Get all orders that contain products from a specific trader."""
        orders = OrderDatabase.load_orders()
        trader_orders = []
        
        # Get all products by this trader
        trader_products = MarketplaceDatabase.get_products_by_trader(trader_id)
        trader_product_ids = [product.uuid for product in trader_products]
        
        for order in orders:
            # Filter items to only include this trader's products
            trader_items = [item for item in order.items if item.product_id in trader_product_ids]
            
            if trader_items:
                # Calculate subtotal for just this trader's items
                subtotal = sum(item.price * item.quantity for item in trader_items)
                
                trader_order = {
                    "order_uuid": order.uuid,
                    "user_id": order.user_id,
                    "items": trader_items,
                    "subtotal": subtotal,
                    "total_order_amount": order.total_amount,
                    "status": order.status,
                    "created_at": order.created_at,
                    "updated_at": order.updated_at
                }
                trader_orders.append(trader_order)
        
        return trader_orders
    
    @staticmethod
    def update_order_status(uuid: str, status: OrderStatus) -> Optional[Order]:
        """Update an order's status."""
        with OrderDatabase.data_lock:
            orders = OrderDatabase.load_orders()
            for i, order in enumerate(orders):
                if order.uuid == uuid:
                    order.status = status
                    order.updated_at = datetime.now()
                    orders[i] = order
                    OrderDatabase.save_orders(orders)
                    return order
        return None
    
    @staticmethod
    def add_tracking_number(uuid: str, tracking_number: str) -> Optional[Order]:
        """Add a tracking number to an order."""
        with OrderDatabase.data_lock:
            orders = OrderDatabase.load_orders()
            for i, order in enumerate(orders):
                if order.uuid == uuid:
                    order.tracking_number = tracking_number
                    order.updated_at = datetime.now()
                    orders[i] = order
                    OrderDatabase.save_orders(orders)
                    return order
        return None
# In MarketplaceDatabase class in product_models.py

@staticmethod
def add_product(product):
    """Add a new product to the database."""
    try:
        print(f"Adding product {product.uuid} to database...")
        with MarketplaceDatabase.data_lock:
            products = MarketplaceDatabase.load_products()
            products.append(product)
            MarketplaceDatabase.save_products(products)
            print(f"Successfully saved product to database.")
            return product
    except Exception as e:
        print(f"Error in add_product: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e