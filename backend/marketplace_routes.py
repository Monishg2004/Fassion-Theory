# marketplace_routes.py
import os
import io
from uuid import uuid4
from datetime import datetime
from flask import Blueprint, request, jsonify
import base64
import json
import traceback

from auth_routes import token_required
from product_models import (
    MarketplaceDatabase, OrderDatabase, Product, ProductCategory,
    SustainabilityRating, CulturalSignificance, ProductReview,
    OrderStatus, OrderItem
)
from image_classes import ClothingInfo, Wardrobe, ClothesPart
from image_processing import remove_background, get_dominant_colors_with_percentage
from PIL import Image
from consts import CLOTHING_STORAGE_DIR, generate_random_path

# Create Blueprint
marketplace_bp = Blueprint('marketplace', __name__)

# Helper function to ensure directory exists
def ensure_dir_exists(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

@marketplace_bp.route('/products', methods=['GET'])
def get_products():
    """Get all products or filter by criteria."""
    query = request.args.get('query', '')
    category = request.args.get('category')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    sustainable_only = request.args.get('sustainable_only', 'false').lower() == 'true'
    handcrafted_only = request.args.get('handcrafted_only', 'false').lower() == 'true'
    
    # Convert string values to appropriate types
    if min_price is not None:
        try:
            min_price = float(min_price)
        except ValueError:
            min_price = None
    
    if max_price is not None:
        try:
            max_price = float(max_price)
        except ValueError:
            max_price = None
    
    # Search products
    products = MarketplaceDatabase.search_products(
        query=query,
        category=category,
        min_price=min_price,
        max_price=max_price,
        sustainable_only=sustainable_only,
        handcrafted_only=handcrafted_only
    )
    
    # Format response
    products_data = []
    for product in products:
        product_data = product.dict()
        
        # Add base64 image
        if os.path.exists(product.path):
            with open(product.path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
                product_data['image'] = image_data
        
        products_data.append(product_data)
    
    return jsonify(products_data), 200

@marketplace_bp.route('/products/<uuid>', methods=['GET'])
def get_product(uuid):
    """Get a specific product by UUID."""
    product = MarketplaceDatabase.get_product_by_uuid(uuid)
    
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # Format response
    product_data = product.dict()
    
    # Add base64 image
    if os.path.exists(product.path):
        with open(product.path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
            product_data['image'] = image_data
    
    return jsonify(product_data), 200

@marketplace_bp.route('/trader/products', methods=['GET'])
@token_required
def get_trader_products():
    """Get all products by the authenticated trader."""
    # Ensure user is a trader
    if request.user.role != 'trader':
        return jsonify({"error": "Access denied. Trader role required."}), 403
    
    # Get all products by this trader
    products = MarketplaceDatabase.get_products_by_trader(request.user.uuid)
    
    # Format response
    products_data = []
    for product in products:
        product_data = product.dict()
        
        # Add base64 image if path exists
        if os.path.exists(product.path):
            with open(product.path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
                product_data['image'] = image_data
        
        products_data.append(product_data)
    
    return jsonify(products_data), 200

# @marketplace_bp.route('/trader/products', methods=['POST'])
# @token_required
# def create_product():
#     """Create a new product (trader only)."""
#     # Log the request
#     print("Received product creation request")
#     print(f"User role: {request.user.role}")
#     print(f"Form data: {request.form}")
#     print(f"Files: {request.files.keys()}")
    
#     # Ensure user is a trader
#     if request.user.role != 'trader':
#         return jsonify({"error": "Access denied. Trader role required."}), 403
    
#     # Check if file is included
#     if 'file' not in request.files:
#         return jsonify({"error": "Image file is required"}), 400
    
#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({"error": "No selected file"}), 400
    
#     try:
#         # Process form data
#         name = request.form.get('name')
#         description = request.form.get('description')
#         price = request.form.get('price')
#         category = request.form.get('category')
#         stock = request.form.get('stock', '1')
#         materials = request.form.get('materials', '')
#         handcrafted = request.form.get('handcrafted', 'false').lower() == 'true'
#         tags = request.form.get('tags', '')
        
#         print(f"Processed form data: name={name}, category={category}, price={price}")
        
#         # Validate required fields
#         if not all([name, description, price, category]):
#             return jsonify({"error": "Name, description, price, and category are required"}), 400
        
#         # Convert price and stock to appropriate types
#         try:
#             price = float(price)
#             stock = int(stock)
#         except ValueError:
#             return jsonify({"error": "Price must be a number and stock must be an integer"}), 400
        
#         # Process sustainability rating if provided
#         sustainability = None
#         if all(f in request.form for f in ['eco_friendly_materials', 'ethical_labor', 'carbon_footprint', 'waste_reduction']):
#             try:
#                 eco_friendly = int(request.form.get('eco_friendly_materials'))
#                 ethical_labor = int(request.form.get('ethical_labor'))
#                 carbon_footprint = int(request.form.get('carbon_footprint'))
#                 waste_reduction = int(request.form.get('waste_reduction'))
                
#                 # Calculate overall rating (average)
#                 overall = round((eco_friendly + ethical_labor + carbon_footprint + waste_reduction) / 4)
                
#                 sustainability = SustainabilityRating(
#                     eco_friendly_materials=eco_friendly,
#                     ethical_labor=ethical_labor,
#                     carbon_footprint=carbon_footprint,
#                     waste_reduction=waste_reduction,
#                     overall=overall
#                 )
#                 print(f"Sustainability rating created: eco_friendly_materials={eco_friendly} ethical_labor={ethical_labor} carbon_footprint={carbon_footprint} waste_reduction={waste_reduction} overall={overall}")
#             except ValueError as e:
#                 print(f"Error creating sustainability rating: {e}")
#                 return jsonify({"error": "Sustainability ratings must be integers (1-5)"}), 400
        
#         # Process cultural significance if provided
#         cultural_significance = None
#         if all(f in request.form for f in ['cultural_origin', 'cultural_tradition', 'cultural_story', 'preservation_impact']):
#             cultural_significance = CulturalSignificance(
#                 origin=request.form.get('cultural_origin'),
#                 tradition=request.form.get('cultural_tradition'),
#                 story=request.form.get('cultural_story'),
#                 preservation_impact=request.form.get('preservation_impact')
#             )
#             print(f"Cultural significance created")
        
#         # Process the image
#         print("Processing image...")
#         file_binary = file.read()
        
#         # Use the image processing functionality from your existing code
#         try:
#             # Ensure directory exists
#             ensure_dir_exists(CLOTHING_STORAGE_DIR)
            
#             # Remove background
#             output_image_bytes = remove_background(file_binary)
            
#             # Create an image object from the byte data
#             output_image = Image.open(io.BytesIO(output_image_bytes))
            
#             # Save the result to a file path
#             file_path = generate_random_path()
#             print(f"Saving image to {file_path}")
#             output_image.save(file_path)
            
#             # Get dominant colors
#             rgbs_with_percent = get_dominant_colors_with_percentage(file_path)
#         except Exception as e:
#             print(f"Error processing image: {e}")
#             traceback.print_exc()
#             return jsonify({"error": f"Error processing image: {str(e)}"}), 500
        
#         # Create product with a unique ID
#         product_uuid = str(uuid4())
#         print(f"Creating product with UUID: {product_uuid}")
        
#         product = Product(
#             uuid=product_uuid,
#             trader_id=request.user.uuid,
#             name=name,
#             description=description,
#             price=price,
#             category=category,
#             path=file_path,
#             rgbs=rgbs_with_percent,
#             sustainability=sustainability,
#             cultural_significance=cultural_significance,
#             reviews=[],
#             created_at=datetime.now(),
#             stock=stock,
#             materials=materials.split(',') if materials else [],
#             handcrafted=handcrafted,
#             tags=tags.split(',') if tags else []
#         )
        
#         # Save product to database
#         print("Adding product to database")
#         try:
#             # Convert the product to a dictionary first to debug
#             product_dict = product.dict()
#             print(f"Product data: {json.dumps(product_dict, default=str)[:200]}...")  # Print first 200 chars
            
#             # Now add to database
#             MarketplaceDatabase.add_product(product)
#             print("Product added successfully")
            
#             return jsonify({
#                 "message": "Product created successfully",
#                 "product_id": product.uuid
#             }), 201
#         except Exception as e:
#             print(f"Database error: {str(e)}")
#             traceback.print_exc()
#             return jsonify({"error": f"Database error: {str(e)}"}), 500
        
#     except Exception as e:
#         print(f"Error creating product: {str(e)}")
#         traceback.print_exc()
#         return jsonify({"error": f"Error creating product: {str(e)}"}), 500

# Fix for marketplace_routes.py - Specifically the product creation endpoint
@marketplace_bp.route('/trader/products', methods=['POST'])
@token_required
def create_product():
    """Create a new product (trader only)."""
    # Ensure user is a trader
    if request.user.role != 'trader':
        return jsonify({"error": "Access denied. Trader role required."}), 403
    
    # Check if file is included
    if "file" not in request.files:
        return jsonify({"error": "Image file is required"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    try:
        # Process form data
        name = request.form.get('name')
        description = request.form.get('description')
        price = request.form.get('price')
        category = request.form.get('category')
        stock = request.form.get('stock', '1')
        materials = request.form.get('materials', '')
        handcrafted = request.form.get('handcrafted', 'false').lower() == 'true'
        tags = request.form.get('tags', '')
        
        # Validate required fields
        if not all([name, description, price, category]):
            return jsonify({"error": "Name, description, price, and category are required"}), 400
        
        # Convert price and stock to appropriate types
        try:
            price = float(price)
            stock = int(stock)
        except ValueError:
            return jsonify({"error": "Price must be a number and stock must be an integer"}), 400
        
        # Process the image
        file_binary = file.read()
        output_image_bytes = remove_background(file_binary)
        
        # Create an image object from the byte data
        from PIL import Image
        import io
        output_image = Image.open(io.BytesIO(output_image_bytes))
        
        # Save the result to a file path
        if not os.path.exists(CLOTHING_STORAGE_DIR):
            os.makedirs(CLOTHING_STORAGE_DIR)
        file_path = generate_random_path()
        output_image.save(file_path)
        
        # Get dominant colors
        rgbs_with_percent = get_dominant_colors_with_percentage(file_path)
        
        # Create product data structure using your existing models
        product_data = {
            "uuid": str(uuid4()),
            "trader_id": request.user.uuid,
            "name": name,
            "description": description,
            "price": price,
            "category": category,
            "path": file_path,
            "rgbs": rgbs_with_percent,
            "created_at": datetime.now(),
            "stock": stock,
            "materials": materials.split(',') if materials else [],
            "handcrafted": handcrafted,
            "tags": tags.split(',') if tags else []
        }
        
        # Process sustainability data if provided
        if all(f in request.form for f in ['eco_friendly_materials', 'ethical_labor', 'carbon_footprint', 'waste_reduction']):
            sustainability_data = {
                "eco_friendly_materials": int(request.form.get('eco_friendly_materials', 3)),
                "ethical_labor": int(request.form.get('ethical_labor', 3)),
                "carbon_footprint": int(request.form.get('carbon_footprint', 3)),
                "waste_reduction": int(request.form.get('waste_reduction', 3)),
                "overall": 0  # Will calculate below
            }
            
            # Calculate overall rating
            sustainability_data["overall"] = round(sum([
                sustainability_data["eco_friendly_materials"],
                sustainability_data["ethical_labor"],
                sustainability_data["carbon_footprint"],
                sustainability_data["waste_reduction"]
            ]) / 4)
            
            product_data["sustainability"] = sustainability_data
        
        # Process cultural data if provided
        if 'cultural_origin' in request.form and request.form.get('cultural_origin'):
            cultural_data = {
                "origin": request.form.get('cultural_origin', ''),
                "tradition": request.form.get('cultural_tradition', ''),
                "story": request.form.get('cultural_story', ''),
                "preservation_impact": request.form.get('preservation_impact', '')
            }
            product_data["cultural_significance"] = cultural_data
        
        # Create the actual product in the database
        product = Product(**product_data)
        
        # First, save to our marketplace database
        MarketplaceDatabase.add_product(product)
        
        # Also add to the wardrobe system for compatibility
        clothing = ClothingInfo(
            path=file_path,
            rgbs=rgbs_with_percent,
            clothes_part=category,
            trader_id=request.user.uuid,
            price=price,
            product_id=product.uuid
        )
        
        with Wardrobe.metadata_lock:
            wardrobe = Wardrobe.load_clothes()
            wardrobe.available_clothes.append(clothing)
            wardrobe.save_clothes()
            
        print(f"Product created successfully: {product.uuid}")
        
        return jsonify({
            "message": "Product created successfully",
            "product_id": product.uuid
        }), 201
        
    except Exception as e:
        print(f"Error creating product: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error creating product: {str(e)}"}), 500

@marketplace_bp.route('/trader/products/<uuid>', methods=['PUT'])
@token_required
def update_product(uuid):
    """Update a product (trader only)."""
    print(f"Updating product {uuid}")
    
    # Ensure user is a trader
    if request.user.role != 'trader':
        return jsonify({"error": "Access denied. Trader role required."}), 403
    
    # Get the product
    product = MarketplaceDatabase.get_product_by_uuid(uuid)
    
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # Ensure the trader owns this product
    if product.trader_id != request.user.uuid:
        return jsonify({"error": "Access denied. You can only update your own products."}), 403
    
    try:
        # Get JSON data
        data = request.get_json()
        print(f"Update data: {data}")
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate price and stock if provided
        if 'price' in data:
            try:
                data['price'] = float(data['price'])
            except ValueError:
                return jsonify({"error": "Price must be a number"}), 400
        
        if 'stock' in data:
            try:
                data['stock'] = int(data['stock'])
            except ValueError:
                return jsonify({"error": "Stock must be an integer"}), 400
        
        # Process sustainability rating if provided
        if 'sustainability' in data:
            sustainability_data = data['sustainability']
            try:
                eco_friendly = int(sustainability_data.get('eco_friendly_materials'))
                ethical_labor = int(sustainability_data.get('ethical_labor'))
                carbon_footprint = int(sustainability_data.get('carbon_footprint'))
                waste_reduction = int(sustainability_data.get('waste_reduction'))
                
                # Calculate overall rating (average)
                overall = round((eco_friendly + ethical_labor + carbon_footprint + waste_reduction) / 4)
                
                data['sustainability'] = SustainabilityRating(
                    eco_friendly_materials=eco_friendly,
                    ethical_labor=ethical_labor,
                    carbon_footprint=carbon_footprint,
                    waste_reduction=waste_reduction,
                    overall=overall
                ).dict()
            except (ValueError, KeyError):
                return jsonify({"error": "Invalid sustainability data"}), 400
        
        # Process cultural significance if provided
        if 'cultural_significance' in data:
            cultural_data = data['cultural_significance']
            try:
                data['cultural_significance'] = CulturalSignificance(
                    origin=cultural_data.get('origin', ''),
                    tradition=cultural_data.get('tradition', ''),
                    story=cultural_data.get('story', ''),
                    preservation_impact=cultural_data.get('preservation_impact', '')
                ).dict()
            except (ValueError, KeyError):
                return jsonify({"error": "Invalid cultural significance data"}), 400
        
        # Update the product
        updated_product = MarketplaceDatabase.update_product(uuid, data)
        
        if not updated_product:
            return jsonify({"error": "Failed to update product"}), 500
        
        print(f"Product {uuid} updated successfully")
        return jsonify({
            "message": "Product updated successfully",
            "product": updated_product.dict()
        }), 200
        
    except Exception as e:
        print(f"Error updating product: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error updating product: {str(e)}"}), 500

@marketplace_bp.route('/trader/products/<uuid>', methods=['DELETE'])
@token_required
def delete_product(uuid):
    """Delete a product (trader only)."""
    # Ensure user is a trader
    if request.user.role != 'trader':
        return jsonify({"error": "Access denied. Trader role required."}), 403
    
    # Get the product
    product = MarketplaceDatabase.get_product_by_uuid(uuid)
    
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # Ensure the trader owns this product
    if product.trader_id != request.user.uuid:
        return jsonify({"error": "Access denied. You can only delete your own products."}), 403
    
    # Delete the product
    deleted = MarketplaceDatabase.delete_product(uuid)
    
    if not deleted:
        return jsonify({"error": "Failed to delete product"}), 500
    
    # If image exists, delete it
    if os.path.exists(product.path):
        try:
            os.remove(product.path)
        except Exception as e:
            # Log but don't fail if image deletion fails
            print(f"Error deleting product image: {str(e)}")
    
    return jsonify({"message": "Product deleted successfully"}), 200

@marketplace_bp.route('/products/<uuid>/reviews', methods=['POST'])
@token_required
def add_product_review(uuid):
    """Add a review to a product (buyer only)."""
    # Ensure user is a buyer
    if request.user.role != 'buyer':
        return jsonify({"error": "Access denied. Buyer role required."}), 403
    
    # Get the product
    product = MarketplaceDatabase.get_product_by_uuid(uuid)
    
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # Get review data
    data = request.get_json()
    
    if not data or 'rating' not in data or 'comment' not in data:
        return jsonify({"error": "Rating and comment are required"}), 400
    
    try:
        # Validate rating
        rating = int(data['rating'])
        if rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
        
        # Create review
        review = ProductReview(
            uuid=str(uuid4()),
            user_id=request.user.uuid,
            rating=rating,
            comment=data['comment'],
            created_at=datetime.now()
        )
        
        # Add review to product
        product.reviews.append(review)
        
        # Update product in database
        updated_product = MarketplaceDatabase.update_product(uuid, {"reviews": [r.dict() for r in product.reviews]})
        
        if not updated_product:
            return jsonify({"error": "Failed to add review"}), 500
        
        return jsonify({
            "message": "Review added successfully",
            "review": review.dict()
        }), 201
        
    except ValueError:
        return jsonify({"error": "Rating must be an integer"}), 400
    except Exception as e:
        print(f"Error adding review: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error adding review: {str(e)}"}), 500

@marketplace_bp.route('/orders', methods=['POST'])
@token_required
def create_order():
    """Create a new order (buyer only)."""
    # Ensure user is a buyer
    if request.user.role != 'buyer':
        return jsonify({"error": "Access denied. Buyer role required."}), 403
    
    # Get order data
    data = request.get_json()
    
    if not data or 'items' not in data or 'shipping_address' not in data:
        return jsonify({"error": "Items and shipping address are required"}), 400
    
    if not data['items'] or len(data['items']) == 0:
        return jsonify({"error": "At least one item is required"}), 400
    
    try:
        # Process items
        order_items = []
        for item_data in data['items']:
            if 'product_id' not in item_data or 'quantity' not in item_data:
                return jsonify({"error": "Product ID and quantity are required for each item"}), 400
            
            # Get product
            product = MarketplaceDatabase.get_product_by_uuid(item_data['product_id'])
            
            if not product:
                return jsonify({"error": f"Product not found: {item_data['product_id']}"}), 404
            
            # Check stock
            quantity = int(item_data['quantity'])
            if quantity <= 0:
                return jsonify({"error": "Quantity must be greater than 0"}), 400
            
            if product.stock < quantity:
                return jsonify({"error": f"Insufficient stock for product: {product.name}"}), 400
            
            # Create order item
            order_items.append(OrderItem(
                product_id=product.uuid,
                price=product.price,
                quantity=quantity
            ))
        
        # Create order
        order = OrderDatabase.create_order(
            user_id=request.user.uuid,
            items=order_items,
            shipping_address=data['shipping_address']
        )
        
        # Add purchased items to user's wardrobe
        wardrobe = Wardrobe.load_clothes()
        
        for item in order_items:
            product = MarketplaceDatabase.get_product_by_uuid(item.product_id)
            
            if product:
                # Create clothing item
                clothing = ClothingInfo(
                    path=product.path,
                    rgbs=product.rgbs,
                    clothes_part=product.category,
                    product_id=product.uuid,
                    is_purchased=True,
                    purchase_date=datetime.now(),
                    trader_id=product.trader_id,
                    price=product.price,
                    sustainable_rating=product.sustainability.overall if product.sustainability else None,
                    cultural_info=product.cultural_significance.story if product.cultural_significance else None,
                    materials=product.materials
                )
                
                # Add to wardrobe
                wardrobe.add_purchased_item(clothing)
        
        # Save wardrobe
        wardrobe.save_clothes()
        
        return jsonify({
            "message": "Order created successfully",
            "order": order.dict()
        }), 201
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error creating order: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error creating order: {str(e)}"}), 500

@marketplace_bp.route('/orders', methods=['GET'])
@token_required
def get_orders():
    """Get user's orders."""
    try:
        if request.user.role == 'buyer':
            # Get buyer's orders
            orders = OrderDatabase.get_orders_by_user(request.user.uuid)
            orders_data = [order.dict() for order in orders]
            
            # Add product details to each order item
            for order_data in orders_data:
                for item in order_data['items']:
                    product = MarketplaceDatabase.get_product_by_uuid(item['product_id'])
                    if product:
                        item['product_name'] = product.name
                        item['product_category'] = product.category
                        
                        # Add image if exists
                        if os.path.exists(product.path):
                            with open(product.path, "rb") as f:
                                image_data = base64.b64encode(f.read()).decode('utf-8')
                                item['product_image'] = image_data
            
            return jsonify(orders_data), 200
            
        elif request.user.role == 'trader':
            # Get orders containing trader's products
            orders = OrderDatabase.get_trader_orders(request.user.uuid)
            
            # Add product details to each order item
            for order in orders:
                for item in order['items']:
                    product = MarketplaceDatabase.get_product_by_uuid(item.product_id)
                    if product:
                        item.product_name = product.name
                        item.product_category = product.category
            
            return jsonify(orders), 200
            
        else:
            return jsonify({"error": "Invalid user role"}), 403
            
    except Exception as e:
        print(f"Error fetching orders: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error fetching orders: {str(e)}"}), 500

@marketplace_bp.route('/orders/<uuid>/status', methods=['PUT'])
@token_required
def update_order_status(uuid):
    """Update order status (trader only)."""
    # Ensure user is a trader
    if request.user.role != 'trader':
        return jsonify({"error": "Access denied. Trader role required."}), 403
    
    # Get status data
    data = request.get_json()
    
    if not data or 'status' not in data:
        return jsonify({"error": "Status is required"}), 400
    
    try:
        # Validate status
        status = data['status']
        if status not in [s.value for s in OrderStatus]:
            return jsonify({"error": f"Invalid status. Must be one of: {', '.join([s.value for s in OrderStatus])}"}), 400
        
        # Get the order
        order = OrderDatabase.get_order_by_uuid(uuid)
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Check if trader has products in this order
        trader_products = MarketplaceDatabase.get_products_by_trader(request.user.uuid)
        trader_product_ids = [product.uuid for product in trader_products]
        
        has_trader_products = any(item.product_id in trader_product_ids for item in order.items)
        
        if not has_trader_products:
            return jsonify({"error": "Access denied. This order does not contain your products."}), 403
        
        # Update status
        updated_order = OrderDatabase.update_order_status(uuid, OrderStatus(status))
        
        if not updated_order:
            return jsonify({"error": "Failed to update order status"}), 500
        
        return jsonify({
            "message": "Order status updated successfully",
            "order": updated_order.dict()
        }), 200
        
    except Exception as e:
        print(f"Error updating order status: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error updating order status: {str(e)}"}), 500

@marketplace_bp.route('/orders/<uuid>/tracking', methods=['PUT'])
@token_required
def add_tracking_number(uuid):
    """Add tracking number to order (trader only)."""
    # Ensure user is a trader
    if request.user.role != 'trader':
        return jsonify({"error": "Access denied. Trader role required."}), 403
    
    # Get tracking data
    data = request.get_json()
    
    if not data or 'tracking_number' not in data:
        return jsonify({"error": "Tracking number is required"}), 400
    
    try:
        # Get the order
        order = OrderDatabase.get_order_by_uuid(uuid)
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        # Check if trader has products in this order
        trader_products = MarketplaceDatabase.get_products_by_trader(request.user.uuid)
        trader_product_ids = [product.uuid for product in trader_products]
        
        has_trader_products = any(item.product_id in trader_product_ids for item in order.items)
        
        if not has_trader_products:
            return jsonify({"error": "Access denied. This order does not contain your products."}), 403
        
        # Add tracking number
        updated_order = OrderDatabase.add_tracking_number(uuid, data['tracking_number'])
        
        if not updated_order:
            return jsonify({"error": "Failed to add tracking number"}), 500
        
        return jsonify({
            "message": "Tracking number added successfully",
            "order": updated_order.dict()
        }), 200
        
    except Exception as e:
        print(f"Error adding tracking number: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error adding tracking number: {str(e)}"}), 500