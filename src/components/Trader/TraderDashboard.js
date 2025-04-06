// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import marketplaceService from '../../services/marketplace';
// import authService from '../../services/auth';
// import './TraderDashboard.css';

// const TraderDashboard = () => {
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState('products');
//   const [stats, setStats] = useState({
//     totalProducts: 0,
//     totalOrders: 0,
//     revenue: 0,
//     pendingOrders: 0
//   });
  
//   const navigate = useNavigate();
  
//   useEffect(() => {
//     // Check if user is a trader
//     if (!authService.isAuthenticated()) {
//       navigate('/login');
//       return;
//     }
    
//     if (!authService.isTrader()) {
//       navigate('/');
//       return;
//     }
    
//     loadDashboardData();
//   }, [navigate]);
  
//   const loadDashboardData = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
      
//       // Fetch trader products
//       const productsData = await marketplaceService.getTraderProducts();
//       setProducts(productsData);
      
//       // Fetch orders that contain the trader's products
//       const ordersData = await marketplaceService.getOrders();
//       setOrders(ordersData);
      
//       // Calculate statistics
//       const pendingOrders = ordersData.filter(order => 
//         order.status === 'pending' || order.status === 'processing'
//       ).length;
      
//       let totalRevenue = 0;
//       ordersData.forEach(order => {
//         if (order.status !== 'cancelled') {
//           totalRevenue += parseFloat(order.subtotal || 0);
//         }
//       });
      
//       setStats({
//         totalProducts: productsData.length,
//         totalOrders: ordersData.length,
//         revenue: totalRevenue,
//         pendingOrders
//       });
      
//     } catch (error) {
//       console.error('Error loading dashboard data:', error);
//       setError('Failed to load dashboard data. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   // Format currency
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     }).format(amount);
//   };
  
//   // Handle product deletion
//   const handleDeleteProduct = async (productId) => {
//     if (!window.confirm('Are you sure you want to delete this product?')) {
//       return;
//     }
    
//     try {
//       await marketplaceService.deleteProduct(productId);
      
//       // Update products list
//       setProducts(products.filter(product => product.uuid !== productId));
      
//       // Update stats
//       setStats(prevStats => ({
//         ...prevStats,
//         totalProducts: prevStats.totalProducts - 1
//       }));
      
//     } catch (error) {
//       console.error('Error deleting product:', error);
//       alert('Failed to delete product. Please try again.');
//     }
//   };
  
//   // Handle order status update
//   const handleUpdateOrderStatus = async (orderId, newStatus) => {
//     try {
//       await marketplaceService.updateOrderStatus(orderId, newStatus);
      
//       // Update orders list
//       setOrders(orders.map(order => {
//         if (order.order_uuid === orderId) {
//           return { ...order, status: newStatus };
//         }
//         return order;
//       }));
      
//       // Update stats if status changed from/to pending or processing
//       const order = orders.find(o => o.order_uuid === orderId);
//       const wasPending = order.status === 'pending' || order.status === 'processing';
//       const isPending = newStatus === 'pending' || newStatus === 'processing';
      
//       if (wasPending !== isPending) {
//         setStats(prevStats => ({
//           ...prevStats,
//           pendingOrders: wasPending ? prevStats.pendingOrders - 1 : prevStats.pendingOrders + 1
//         }));
//       }
      
//     } catch (error) {
//       console.error('Error updating order status:', error);
//       alert('Failed to update order status. Please try again.');
//     }
//   };
  
//   // Handle adding tracking number
//   const handleAddTracking = async (orderId) => {
//     const trackingNumber = prompt('Enter tracking number:');
    
//     if (!trackingNumber) return;
    
//     try {
//       await marketplaceService.addTrackingNumber(orderId, trackingNumber);
      
//       // Update orders list
//       setOrders(orders.map(order => {
//         if (order.order_uuid === orderId) {
//           return { ...order, tracking_number: trackingNumber };
//         }
//         return order;
//       }));
      
//       alert('Tracking number added successfully!');
      
//     } catch (error) {
//       console.error('Error adding tracking number:', error);
//       alert('Failed to add tracking number. Please try again.');
//     }
//   };
  
//   // Get trader profile
//   const traderProfile = authService.getCurrentUser();

//   return (
//     <div className="trader-dashboard">
//       {/* Dashboard header */}
//       <div className="dashboard-header">
//         <div className="header-content">
//           <h1>Trader Dashboard</h1>
//           <p>Manage your products and orders</p>
//         </div>
        
//         <div className="dashboard-actions">
//           <Link to="/trader/products/new" className="add-product-button">
//             <i className="fas fa-plus"></i> Add New Product
//           </Link>
//         </div>
//       </div>
      
//       {/* Stats cards */}
//       <div className="stats-cards">
//         <div className="stat-card">
//           <div className="stat-icon products-icon">
//             <i className="fas fa-box"></i>
//           </div>
//           <div className="stat-details">
//             <div className="stat-value">{stats.totalProducts}</div>
//             <div className="stat-label">Total Products</div>
//           </div>
//         </div>
        
//         <div className="stat-card">
//           <div className="stat-icon orders-icon">
//             <i className="fas fa-shopping-bag"></i>
//           </div>
//           <div className="stat-details">
//             <div className="stat-value">{stats.totalOrders}</div>
//             <div className="stat-label">Total Orders</div>
//           </div>
//         </div>
        
//         <div className="stat-card">
//           <div className="stat-icon revenue-icon">
//             <i className="fas fa-dollar-sign"></i>
//           </div>
//           <div className="stat-details">
//             <div className="stat-value">{formatCurrency(stats.revenue)}</div>
//             <div className="stat-label">Total Revenue</div>
//           </div>
//         </div>
        
//         <div className="stat-card">
//           <div className="stat-icon pending-icon">
//             <i className="fas fa-clock"></i>
//           </div>
//           <div className="stat-details">
//             <div className="stat-value">{stats.pendingOrders}</div>
//             <div className="stat-label">Pending Orders</div>
//           </div>
//         </div>
//       </div>
      
//       {/* Business profile section */}
//       <div className="business-profile">
//         <div className="profile-header">
//           <h2>Business Profile</h2>
//           <button className="edit-profile-button" onClick={() => navigate('/profile')}>
//             <i className="fas fa-edit"></i> Edit Profile
//           </button>
//         </div>
        
//         <div className="profile-content">
//           <div className="profile-item">
//             <div className="profile-label">Business Name</div>
//             <div className="profile-value">{traderProfile?.business_name || 'Not specified'}</div>
//           </div>
          
//           <div className="profile-item">
//             <div className="profile-label">Location</div>
//             <div className="profile-value">{traderProfile?.location || 'Not specified'}</div>
//           </div>
          
//           <div className="profile-item">
//             <div className="profile-label">Sustainable Practices</div>
//             <div className="profile-value">
//               {traderProfile?.sustainable_practices?.length > 0 
//                 ? traderProfile.sustainable_practices.join(', ') 
//                 : 'None specified'}
//             </div>
//           </div>
          
//           <div className="profile-item">
//             <div className="profile-label">Cultural Heritage</div>
//             <div className="profile-value">{traderProfile?.cultural_heritage || 'Not specified'}</div>
//           </div>
//         </div>
//       </div>
      
//       {/* Tabs navigation */}
//       <div className="dashboard-tabs">
//         <div className="tabs-header">
//           <button 
//             className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
//             onClick={() => setActiveTab('products')}
//           >
//             <i className="fas fa-tshirt"></i> My Products
//           </button>
          
//           <button 
//             className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
//             onClick={() => setActiveTab('orders')}
//           >
//             <i className="fas fa-shopping-cart"></i> Orders
//             {stats.pendingOrders > 0 && (
//               <span className="notification-badge">{stats.pendingOrders}</span>
//             )}
//           </button>
//         </div>
        
//         <div className="tabs-content">
//           {isLoading ? (
//             <div className="loading-indicator">
//               <div className="spinner"></div>
//               <p>Loading...</p>
//             </div>
//           ) : error ? (
//             <div className="error-message">
//               <i className="fas fa-exclamation-circle"></i>
//               <p>{error}</p>
//               <button onClick={loadDashboardData}>Try Again</button>
//             </div>
//           ) : (
//             <>
//               {/* Products tab */}
//               {activeTab === 'products' && (
//                 <div className="products-tab">
//                   {products.length === 0 ? (
//                     <div className="empty-state">
//                       <i className="fas fa-box-open"></i>
//                       <h3>No Products Yet</h3>
//                       <p>Add your first product to start selling!</p>
//                       <Link to="/trader/products/new" className="add-first-button">
//                         <i className="fas fa-plus"></i> Add a Product
//                       </Link>
//                     </div>
//                   ) : (
//                     <div className="products-list">
//                       <div className="list-header">
//                         <div className="header-item product-col">Product</div>
//                         <div className="header-item price-col">Price</div>
//                         <div className="header-item stock-col">Stock</div>
//                         <div className="header-item status-col">Sustainability</div>
//                         <div className="header-item actions-col">Actions</div>
//                       </div>
                      
//                       {products.map(product => (
//                         <div className="product-row" key={product.uuid}>
//                           <div className="product-col">
//                             <div className="product-info">
//                               <div className="product-image">
//                                 {product.image ? (
//                                   <img 
//                                     src={`data:image/png;base64,${product.image}`} 
//                                     alt={product.name} 
//                                   />
//                                 ) : (
//                                   <div className="placeholder-image">
//                                     <i className="fas fa-tshirt"></i>
//                                   </div>
//                                 )}
//                               </div>
//                               <div className="product-details">
//                                 <div className="product-name">{product.name}</div>
//                                 <div className="product-category">{product.category}</div>
//                               </div>
//                             </div>
//                           </div>
                          
//                           <div className="price-col">
//                             {formatCurrency(product.price)}
//                           </div>
                          
//                           <div className="stock-col">
//                             <span className={product.stock <= 3 ? 'low-stock' : ''}>
//                               {product.stock}
//                             </span>
//                           </div>
                          
//                           <div className="status-col">
//                             {product.sustainability ? (
//                               <div className="sustainability-label">
//                                 <i className="fas fa-leaf"></i>
//                                 <span>{product.sustainability.overall}/5</span>
//                               </div>
//                             ) : (
//                               <span className="not-rated">Not rated</span>
//                             )}
//                           </div>
                          
//                           <div className="actions-col">
//                             <button 
//                               className="view-button"
//                               onClick={() => navigate(`/marketplace/product/${product.uuid}`)}
//                             >
//                               <i className="fas fa-eye"></i>
//                             </button>
//                             <button 
//                               className="edit-button"
//                               onClick={() => navigate(`/trader/products/edit/${product.uuid}`)}
//                             >
//                               <i className="fas fa-edit"></i>
//                             </button>
//                             <button 
//                               className="delete-button"
//                               onClick={() => handleDeleteProduct(product.uuid)}
//                             >
//                               <i className="fas fa-trash"></i>
//                             </button>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}
              
//               {/* Orders tab */}
//               {activeTab === 'orders' && (
//                 <div className="orders-tab">
//                   {orders.length === 0 ? (
//                     <div className="empty-state">
//                       <i className="fas fa-shopping-cart"></i>
//                       <h3>No Orders Yet</h3>
//                       <p>When customers purchase your products, their orders will appear here.</p>
//                     </div>
//                   ) : (
//                     <div className="orders-list">
//                       <div className="list-header">
//                         <div className="header-item order-col">Order</div>
//                         <div className="header-item customer-col">Customer</div>
//                         <div className="header-item items-col">Items</div>
//                         <div className="header-item amount-col">Amount</div>
//                         <div className="header-item status-col">Status</div>
//                         <div className="header-item actions-col">Actions</div>
//                       </div>
                      
//                       {orders.map(order => (
//                         <div className="order-row" key={order.order_uuid}>
//                           <div className="order-col">
//                             <div className="order-id">{order.order_uuid.slice(0, 8)}...</div>
//                             <div className="order-date">
//                               {new Date(order.created_at).toLocaleDateString()}
//                             </div>
//                           </div>
                          
//                           <div className="customer-col">
//                             {order.user_id}
//                           </div>
                          
//                           <div className="items-col">
//                             <div className="items-count">{order.items.length} item(s)</div>
//                             <div className="items-preview">
//                               {order.items.map((item, index) => (
//                                 <div key={index} className="item-preview">
//                                   {item.product_name} x{item.quantity}
//                                 </div>
//                               ))}
//                             </div>
//                           </div>
                          
//                           <div className="amount-col">
//                             {formatCurrency(order.subtotal)}
//                           </div>
                          
//                           <div className="status-col">
//                             <span className={`status-badge ${order.status}`}>
//                               {order.status}
//                             </span>
//                           </div>
                          
//                           <div className="actions-col">
//                             <select 
//                               className="status-select"
//                               value={order.status}
//                               onChange={(e) => handleUpdateOrderStatus(order.order_uuid, e.target.value)}
//                             >
//                               <option value="pending">Pending</option>
//                               <option value="processing">Processing</option>
//                               <option value="shipped">Shipped</option>
//                               <option value="delivered">Delivered</option>
//                               <option value="cancelled">Cancelled</option>
//                             </select>
                            
//                             {(order.status === 'processing' || order.status === 'shipped') && (
//                               <button 
//                                 className="tracking-button"
//                                 onClick={() => handleAddTracking(order.order_uuid)}
//                                 title="Add tracking number"
//                               >
//                                 <i className="fas fa-truck"></i>
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TraderDashboard;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import marketplaceService from '../../services/marketplace';
import authService from '../../services/auth';
import './TraderDashboard.css';

const TraderDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    pendingOrders: 0
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is a trader
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    if (!authService.isTrader()) {
      navigate('/');
      return;
    }
    
    loadDashboardData();
  }, [navigate]);
  // TraderDashboard.js - Updated loadDashboardData function

const loadDashboardData = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Get auth token
    const token = authService.getToken();
    
    // Fetch trader products
    const productsResponse = await fetch('/api/marketplace/trader/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (!productsResponse.ok) {
      throw new Error('Failed to load products: ' + (await productsResponse.json()).error);
    }
    
    const productsData = await productsResponse.json();
    setProducts(productsData);
    
    // Fetch orders that contain the trader's products
    const ordersResponse = await fetch('/api/marketplace/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (!ordersResponse.ok) {
      throw new Error('Failed to load orders: ' + (await ordersResponse.json()).error);
    }
    
    const ordersData = await ordersResponse.json();
    setOrders(ordersData);
    
    // Calculate statistics
    const pendingOrders = ordersData.filter(order => 
      order.status === 'pending' || order.status === 'processing'
    ).length;
    
    let totalRevenue = 0;
    ordersData.forEach(order => {
      if (order.status !== 'cancelled') {
        totalRevenue += parseFloat(order.subtotal || 0);
      }
    });
    
    setStats({
      totalProducts: productsData.length,
      totalOrders: ordersData.length,
      revenue: totalRevenue,
      pendingOrders
    });
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    setError('Failed to load dashboard data. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      await marketplaceService.deleteProduct(productId);
      
      // Update products list
      setProducts(products.filter(product => product.uuid !== productId));
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        totalProducts: prevStats.totalProducts - 1
      }));
      
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  
  
  // Handle logout
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  


  // Handle order status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await marketplaceService.updateOrderStatus(orderId, newStatus);
      
      // Update orders list
      setOrders(orders.map(order => {
        if (order.order_uuid === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      }));
      
      // Update stats if status changed from/to pending or processing
      const order = orders.find(o => o.order_uuid === orderId);
      const wasPending = order.status === 'pending' || order.status === 'processing';
      const isPending = newStatus === 'pending' || newStatus === 'processing';
      
      if (wasPending !== isPending) {
        setStats(prevStats => ({
          ...prevStats,
          pendingOrders: wasPending ? prevStats.pendingOrders - 1 : prevStats.pendingOrders + 1
        }));
      }
      
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };
  // Get trader profile
  const traderProfile = authService.getCurrentUser();

  return (
    <div className="trader-dashboard">
      {/* Dashboard header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Trader Dashboard</h1>
          <p>Manage your products and orders</p>
        </div>
        
        <div className="dashboard-actions">
          <Link to="/trader/products/new" className="add-product-button">
            <i className="fas fa-plus"></i> Add New Product
          </Link>
          
          <button className="back-to-marketplace" onClick={() => navigate('/marketplace')}>
            <i className="fas fa-store"></i> Marketplace
          </button>
          
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon products-icon">
            <i className="fas fa-box"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon orders-icon">
            <i className="fas fa-shopping-bag"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon revenue-icon">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">{formatCurrency(stats.revenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-details">
            <div className="stat-value">{stats.pendingOrders}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
        </div>
      </div>
      
      {/* Business profile section */}
      <div className="business-profile">
        <div className="profile-header">
          <h2>Business Profile</h2>
          <button className="edit-profile-button" onClick={() => navigate('/profile')}>
            <i className="fas fa-edit"></i> Edit Profile
          </button>
        </div>
        
        <div className="profile-content">
          <div className="profile-item">
            <div className="profile-label">Business Name</div>
            <div className="profile-value">{traderProfile?.business_name || 'Not specified'}</div>
          </div>
          
          <div className="profile-item">
            <div className="profile-label">Location</div>
            <div className="profile-value">{traderProfile?.location || 'Not specified'}</div>
          </div>
          
          <div className="profile-item">
            <div className="profile-label">Sustainable Practices</div>
            <div className="profile-value">
              {traderProfile?.sustainable_practices?.length > 0 
                ? traderProfile.sustainable_practices.join(', ') 
                : 'None specified'}
            </div>
          </div>
          
          <div className="profile-item">
            <div className="profile-label">Cultural Heritage</div>
            <div className="profile-value">{traderProfile?.cultural_heritage || 'Not specified'}</div>
          </div>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="dashboard-tabs">
        <div className="tabs-header">
          <button 
            className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <i className="fas fa-tshirt"></i> My Products
          </button>
          
          <button 
            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <i className="fas fa-shopping-cart"></i> Orders
            {stats.pendingOrders > 0 && (
              <span className="notification-badge">{stats.pendingOrders}</span>
            )}
          </button>
        </div>
        
        <div className="tabs-content">
          {isLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
              <button onClick={loadDashboardData}>Try Again</button>
            </div>
          ) : (
            <>
              {/* Products tab */}
              {activeTab === 'products' && (
                <div className="products-tab">
                  {products.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-box-open"></i>
                      <h3>No Products Yet</h3>
                      <p>Add your first product to start selling!</p>
                      <Link to="/trader/products/new" className="add-first-button">
                        <i className="fas fa-plus"></i> Add a Product
                      </Link>
                    </div>
                  ) : (
                    <div className="products-list">
                      <div className="list-header">
                        <div className="header-item product-col">Product</div>
                        <div className="header-item price-col">Price</div>
                        <div className="header-item stock-col">Stock</div>
                        <div className="header-item status-col">Sustainability</div>
                        <div className="header-item actions-col">Actions</div>
                      </div>
                      
                      {products.map(product => (
                        <div className="product-row" key={product.uuid}>
                          <div className="product-col">
                            <div className="product-info">
                              <div className="product-image">
                                {product.image ? (
                                  <img 
                                    src={`data:image/png;base64,${product.image}`} 
                                    alt={product.name} 
                                  />
                                ) : (
                                  <div className="placeholder-image">
                                    <i className="fas fa-tshirt"></i>
                                  </div>
                                )}
                              </div>
                              <div className="product-details">
                                <div className="product-name">{product.name}</div>
                                <div className="product-category">{product.category}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="price-col">
                            {formatCurrency(product.price)}
                          </div>
                          
                          <div className="stock-col">
                            <span className={product.stock <= 3 ? 'low-stock' : ''}>
                              {product.stock}
                            </span>
                          </div>
                          
                          <div className="status-col">
                            {product.sustainability ? (
                              <div className="sustainability-label">
                                <i className="fas fa-leaf"></i>
                                <span>{product.sustainability.overall}/5</span>
                              </div>
                            ) : (
                              <span className="not-rated">Not rated</span>
                            )}
                          </div>
                          
                          <div className="actions-col">
                            <button 
                              className="view-button"
                              onClick={() => navigate(`/marketplace/product/${product.uuid}`)}
                              title="View product"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              className="edit-button"
                              onClick={() => navigate(`/trader/products/edit/${product.uuid}`)}
                              title="Edit product"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteProduct(product.uuid)}
                              title="Delete product"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Orders tab */}
              {activeTab === 'orders' && (
                <div className="orders-tab">
                  {orders.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-shopping-cart"></i>
                      <h3>No Orders Yet</h3>
                      <p>When customers purchase your products, their orders will appear here.</p>
                    </div>
                  ) : (
                    <div className="orders-list">
                      <div className="list-header">
                        <div className="header-item order-col">Order</div>
                        <div className="header-item customer-col">Customer</div>
                        <div className="header-item items-col">Items</div>
                        <div className="header-item amount-col">Amount</div>
                        <div className="header-item status-col">Status</div>
                        <div className="header-item actions-col">Actions</div>
                      </div>
                      
                      {orders.map(order => (
                        <div className="order-row" key={order.order_uuid}>
                          <div className="order-col">
                            <div className="order-id">{order.order_uuid.slice(0, 8)}...</div>
                            <div className="order-date">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="customer-col">
                            {order.user_id}
                          </div>
                          
                          <div className="items-col">
                            <div className="items-count">{order.items.length} item(s)</div>
                            <div className="items-preview">
                              {order.items.map((item, index) => (
                                <div key={index} className="item-preview">
                                  {item.product_name || item.product_id} x{item.quantity}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="amount-col">
                            {formatCurrency(order.subtotal)}
                          </div>
                          
                          <div className="status-col">
                            <span className={`status-badge ${order.status}`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="actions-col">
                            <select 
                              className="status-select"
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.order_uuid, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            
                            {(order.status === 'processing' || order.status === 'shipped') && (
                              <button 
                                className="tracking-button"
                                // onClick={() => handleAddTracking(order.order_uuid)}
                                title="Add tracking number"
                              >
                                <i className="fas fa-truck"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraderDashboard;