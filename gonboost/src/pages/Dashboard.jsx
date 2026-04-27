// frontend/pages/Dashboard.jsx - VERSIÓN COMPLETA EN INGLÉS

import React, { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket, isConnected, onOrderCreated, onOrderUpdated } = useSocket();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingRealData, setUsingRealData] = useState(false);
  const [realTimeUpdate, setRealTimeUpdate] = useState(null);

  // Format payment method
  const formatPaymentMethod = (method) => {
    if (!method) return '-';
    const methods = {
      'paypal': 'PayPal',
      'binance': 'Binance Pay',
      'stripe': 'Stripe',
      'nowpayments': 'Crypto',
      'wallet': 'Wallet',
      'transfer': 'Transfer',
      'cash': 'Cash',
      'manual': 'Manual'
    };
    return methods[method.toLowerCase()] || method;
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pending',
      paid: 'Paid',
      pending_verification: 'Verifying Payment',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      awaiting_payment_confirmation: 'Awaiting Confirmation'
    };
    return statusMap[status] || status;
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      console.log('🔄 Loading dashboard data...');

      let statsData = { totalOrders: 0, completedOrders: 0, totalSpent: 0 };
      let ordersData = [];
      let hasRealData = false;

      // Try to load user stats
      try {
        const statsResponse = await axios.get('/users/stats');
        console.log('✅ Stats loaded:', statsResponse.data);
        
        if (statsResponse.data.success) {
          if (statsResponse.data.data) {
            statsData = {
              totalOrders: statsResponse.data.data.totalOrders || 0,
              completedOrders: statsResponse.data.data.completedOrders || 0,
              totalSpent: statsResponse.data.data.totalSpent || 0
            };
          } else if (statsResponse.data.stats) {
            statsData = {
              totalOrders: statsResponse.data.stats.totalOrders || 0,
              completedOrders: statsResponse.data.stats.completedOrders || 0,
              totalSpent: statsResponse.data.stats.totalAmount || 0
            };
          }
          hasRealData = true;
        }
      } catch (statsError) {
        console.log('❌ Could not load stats:', statsError.message);
      }

      // Try to load recent orders
      try {
        const ordersResponse = await axios.get('/orders/my-orders');
        console.log('✅ Orders loaded:', ordersResponse.data);
        
        if (ordersResponse.data.success && ordersResponse.data.orders) {
          ordersData = ordersResponse.data.orders;
        } else if (Array.isArray(ordersResponse.data)) {
          ordersData = ordersResponse.data;
        } else if (ordersResponse.data.orders && Array.isArray(ordersResponse.data.orders)) {
          ordersData = ordersResponse.data.orders;
        }
        
        if (ordersData.length > 0) {
          hasRealData = true;
          
          // Calculate stats from orders if not available
          if (statsData.totalOrders === 0) {
            statsData = {
              totalOrders: ordersData.length,
              completedOrders: ordersData.filter(order => order.status === 'completed').length,
              totalSpent: ordersData.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
            };
          }
        }
      } catch (ordersError) {
        console.log('❌ Could not load orders:', ordersError.message);
      }

      if (hasRealData) {
        console.log('✅ Using real data');
        setUsingRealData(true);
        setStats(statsData);
        setRecentOrders(ordersData.slice(0, 5));
      } else {
        console.log('📋 Using demo data');
        setUsingRealData(false);
        loadDemoData();
      }

    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      setUsingRealData(false);
      loadDemoData();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDemoData = () => {
    const demoOrders = [
      {
        _id: '1',
        orderNumber: 'BS000001',
        service: { name: 'Diamond Boost', game: 'Valorant' },
        totalPrice: 50,
        status: 'completed',
        paymentMethod: 'paypal',
        createdAt: new Date()
      },
      {
        _id: '2', 
        orderNumber: 'BS000002',
        service: { name: 'Personal Coaching', game: 'League of Legends' },
        totalPrice: 30,
        status: 'in_progress',
        paymentMethod: 'binance',
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        _id: '3',
        orderNumber: 'BS000003',
        service: { name: 'Rank Boosting', game: 'Overwatch 2' },
        totalPrice: 75,
        status: 'pending',
        paymentMethod: 'paypal',
        createdAt: new Date(Date.now() - 172800000)
      }
    ];

    const demoStats = {
      totalOrders: 3,
      completedOrders: 1,
      totalSpent: 155
    };
    
    setStats(demoStats);
    setRecentOrders(demoOrders);
  };

  // Socket integration - Real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('📡 Dashboard listening to WebSocket events');

    const handleOrderUpdate = (data) => {
      console.log('🔄 Real-time update received in dashboard:', data);
      
      const orderId = data.orderId || data.order?._id;
      const orderNumber = data.orderNumber || data.order?.orderNumber;
      
      setRealTimeUpdate({
        message: `Order ${orderNumber || '#' + (orderId?.slice(-8) || 'N/A')} updated: ${getStatusLabel(data.newStatus || data.status)}`,
        timestamp: new Date()
      });

      // Update stats if order was completed
      if (data.newStatus === 'completed' || data.status === 'completed') {
        setStats(prev => ({
          ...prev,
          completedOrders: prev.completedOrders + 1
        }));
      }

      // Update recent orders list
      setRecentOrders(prev => 
        prev.map(order => 
          (order._id === orderId || order.orderNumber === orderNumber)
            ? { ...order, status: data.newStatus || data.status }
            : order
        )
      );

      setTimeout(() => setRealTimeUpdate(null), 5000);
    };

    const handleNewOrder = (data) => {
      console.log('🆕 New order received in dashboard:', data);
      
      const newOrder = data.order || data;
      
      setRealTimeUpdate({
        message: `Order ${newOrder.orderNumber || 'new'} created!`,
        timestamp: new Date()
      });
      
      // Update stats
      setStats(prev => ({
        totalOrders: prev.totalOrders + 1,
        completedOrders: prev.completedOrders,
        totalSpent: prev.totalSpent + (newOrder.totalPrice || 0)
      }));
      
      // Add to recent orders
      if (newOrder) {
        setRecentOrders(prev => {
          const orderToAdd = {
            _id: newOrder._id || `temp_${Date.now()}`,
            orderNumber: newOrder.orderNumber || `BS${Date.now().toString().slice(-6)}`,
            service: newOrder.service || { name: 'New Service' },
            totalPrice: newOrder.totalPrice || 0,
            status: newOrder.status || 'pending',
            paymentMethod: newOrder.paymentMethod || 'pending',
            createdAt: new Date()
          };
          return [orderToAdd, ...prev.slice(0, 4)];
        });
      }

      setTimeout(() => setRealTimeUpdate(null), 5000);
    };

    // Subscribe to events
    const cleanupOrderUpdate = onOrderUpdated(handleOrderUpdate);
    const cleanupOrderCreated = onOrderCreated(handleNewOrder);

    socket.on('order_updated', handleOrderUpdate);
    socket.on('order_created', handleNewOrder);

    return () => {
      cleanupOrderUpdate();
      cleanupOrderCreated();
      socket.off('order_updated', handleOrderUpdate);
      socket.off('order_created', handleNewOrder);
    };
  }, [socket, isConnected, onOrderUpdated, onOrderCreated]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate, fetchDashboardData]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      paid: { label: 'Paid', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      pending_verification: { label: 'Verifying', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      in_progress: { label: 'In Progress', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
      completed: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      awaiting_payment_confirmation: { label: 'Awaiting Payment', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0f172a] text-slate-200 pt-28 pb-12">
        {/* Background Ambient Glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full filter blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          
          {/* Real-time Update Notification */}
          {realTimeUpdate && (
            <div className="mb-6 animate-pulse">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-white rounded-full animate-ping mr-3"></div>
                    </div>
                    <div>
                      <p className="font-medium">
                        {realTimeUpdate.message}
                      </p>
                      <p className="text-sm opacity-90">
                        {realTimeUpdate.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRealTimeUpdate(null)}
                    className="text-white hover:text-gray-200 text-xl"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Demo Mode Banner (only when no real data) */}
          {!usingRealData && (
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl p-4 mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      Demo Mode
                    </h3>
                    <p className="text-white text-sm opacity-90">
                      Showing example data {isConnected ? '(Socket active ✓)' : '(Connecting...)'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="bg-white hover:bg-gray-100 text-orange-600 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Try Real Connection
                </button>
              </div>
            </div>
          )}

          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase">
                CENTRAL <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">DASHBOARD</span>
              </h1>
              <p className="text-slate-400 font-light italic mt-2">
                Welcome back, <span className="text-cyan-400 font-medium">{user?.username}</span>
              </p>
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>
            
            <Link 
              to="/services" 
              className="group bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-sm font-bold shadow-lg shadow-cyan-900/20"
            >
              <span>NEW BOOST</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              { label: 'Total Orders', val: stats.totalOrders, color: 'from-blue-500/10', icon: '⚡' },
              { label: 'Completed', val: stats.completedOrders, color: 'from-emerald-500/10', icon: '🏆' },
              { label: 'Total Spent', val: formatPrice(stats.totalSpent), color: 'from-purple-500/10', icon: '💎' }
            ].map((stat, i) => (
              <div key={i} className={`bg-gradient-to-br ${stat.color} to-transparent border border-white/5 backdrop-blur-md p-7 rounded-2xl group hover:border-white/20 transition-all`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-white group-hover:text-cyan-400 transition-colors">{stat.val}</p>
                  </div>
                  <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ORDERS TABLE */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-lg text-white uppercase tracking-wider">Recent Activity</h3>
                <Link to="/my-orders" className="text-cyan-400 text-xs font-bold hover:text-cyan-300 transition-colors">VIEW ALL</Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-slate-500 text-[10px] uppercase tracking-[0.15em] font-black">
                    <tr>
                      <th className="px-8 py-4">Service</th>
                      <th className="px-8 py-4">Method</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr 
                          key={order._id} 
                          onClick={() => navigate(`/orders/${order._id}`)}
                          className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        >
                          <td className="px-8 py-5">
                            <div className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                              {order.service?.name || 'Boost Service'}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">
                              ID: {order.orderNumber || order._id?.slice(-6)} • {order.service?.game || order.gameDetails?.game}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-xs text-slate-400">
                              {formatPaymentMethod(order.paymentMethod)}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-8 py-5 text-right font-mono font-bold text-slate-200">
                            {formatPrice(order.totalPrice)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-8 py-12 text-center text-slate-500 italic">
                          No orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white relative overflow-hidden group shadow-xl shadow-blue-900/20">
                <div className="relative z-10">
                  <h4 className="text-2xl font-black mb-2 uppercase italic leading-none">Need Help?</h4>
                  <p className="text-blue-100 text-xs mb-6 opacity-80 leading-relaxed">24/7 technical assistance for your boost orders.</p>
                  <Link to="/support" className="bg-white text-blue-700 px-6 py-3 rounded-xl font-black text-xs inline-block hover:bg-cyan-50 transition-all uppercase tracking-widest shadow-lg">
                    OPEN TICKET
                  </Link>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
              </div>

              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-md">
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                  Quick Actions
                </h4>
                <div className="space-y-3">
                  <Link 
                    to="/my-orders" 
                    className="block p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-400/30 transition-colors group"
                  >
                    <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">
                      📋 View All Orders
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                      Track your boost progress
                    </p>
                  </Link>
                  <Link 
                    to="/services" 
                    className="block p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-400/30 transition-colors group"
                  >
                    <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">
                      🎮 Browse Services
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                      Explore all available boosts
                    </p>
                  </Link>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-md">
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                  News & Updates
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-400/30 transition-colors">
                    <p className="text-[10px] text-cyan-400 font-black mb-1 uppercase">Update</p>
                    <p className="text-xs text-slate-300 leading-relaxed">Delivery times for <span className="text-white">WoW Retail</span> improved. Check new rates!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
              GONBOOST © 2026 • Premium Gaming Services
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;