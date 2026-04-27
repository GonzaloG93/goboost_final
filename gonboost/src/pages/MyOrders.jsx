// frontend/pages/MyOrders.jsx - VERSIÓN DARK MODE COMPLETA

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar'; // ✅ Mismo Navbar que Home
import axios from '../utils/axiosConfig';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  // Fetch user orders
  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Listen to socket events for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('order_paid', (data) => {
      console.log('🔔 Socket event: Order paid:', data);
      toast.success(`✅ Order #${data.orderNumber} paid successfully!`);
      updateOrderStatus(data.orderId, 'paid');
    });

    socket.on('order_updated', (data) => {
      console.log('🔔 Socket event: Order updated:', data);
      if (data.newStatus === 'paid' || data.newStatus === 'pending_verification') {
        updateOrderStatus(data.orderId, data.newStatus);
      }
    });

    return () => {
      socket.off('order_paid');
      socket.off('order_updated');
    };
  }, [socket]);

  // Fetch orders from API
  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('📦 Fetching user orders...');
      const response = await axios.get('/orders/my-orders');
      
      console.log('✅ Server response:', response.data);
      
      let ordersData = [];
      
      if (response.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && response.data.orders) {
        ordersData = response.data.orders;
      } else if (response.data && response.data.data) {
        ordersData = response.data.data;
      } else if (response.data && response.data.success) {
        ordersData = response.data.orders || response.data.data || [];
      }
      
      console.log(`✅ Found ${ordersData.length} orders`);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setError('Error loading your orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update order status locally
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId ? { ...order, status: newStatus, paymentStatus: newStatus } : order
      )
    );
  };

  // Handle payment
  const handlePayment = (order) => {
    console.log('💳 Initiating payment for order:', order._id);
    
    if (order.status !== 'pending') {
      toast.warning(`This order is already ${order.status === 'paid' ? 'paid' : order.status}`);
      return;
    }

    navigate(`/checkout/${order._id}`);
  };

  // View order details
  const handleViewDetails = async (order) => {
    console.log('🔍 Fetching order details:', order._id);
    
    try {
      const orderResponse = await axios.get(`/orders/${order._id}`);
      const orderData = orderResponse.data.order || orderResponse.data.data || orderResponse.data;
      setSelectedOrder(orderData);

      try {
        const proofResponse = await axios.get(`/payments/proof/${order._id}`);
        if (proofResponse.data.success && proofResponse.data.data.length > 0) {
          setPaymentProof(proofResponse.data.data[0]);
        } else {
          setPaymentProof(null);
        }
      } catch (proofError) {
        setPaymentProof(null);
      }

      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Error loading order details');
    }
  };

  // Format payment method
  const formatPaymentMethod = (method) => {
    if (!method) return 'Not specified';
    
    const methodMap = {
      'paypal': 'PayPal',
      'binance': 'Binance Pay',
      'stripe': 'Stripe',
      'manual': 'Manual',
      'nowpayments': 'NOWPayments',
      'credit_card': 'Credit Card',
      'wallet': 'Wallet',
      'transfer': 'Bank Transfer',
      'cash': 'Cash'
    };
    
    return methodMap[method.toLowerCase()] || method;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get status color and text - Dark mode version
  const getStatusInfo = (status, paymentStatus) => {
    const combinedStatus = paymentStatus || status;
    
    switch (combinedStatus) {
      case 'pending':
        return { text: 'Pending Payment', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '⏳' };
      case 'pending_verification':
        return { text: 'Verifying Payment', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '🔍' };
      case 'paid':
        return { text: 'Payment Confirmed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '✅' };
      case 'in_progress':
        return { text: 'In Progress', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: '🔄' };
      case 'completed':
        return { text: 'Completed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '🎯' };
      case 'cancelled':
        return { text: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '❌' };
      case 'failed':
        return { text: 'Payment Failed', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '❌' };
      default:
        return { text: combinedStatus || 'Unknown', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: '❓' };
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading your orders...</p>
          </div>
        </div>
      </>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center pt-20">
          <div className="text-center max-w-md p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
            <p className="text-slate-400 mb-6">You must be logged in to view your orders.</p>
            <div className="space-y-3">
              <Link to="/login" className="block w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 px-6 rounded-xl font-bold transition-all">
                Sign In
              </Link>
              <Link to="/register" className="block w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-6 rounded-xl font-bold transition-all border border-white/10">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-[#0f172a] py-8 pt-24">
        <ToastContainer position="top-right" autoClose={5000} theme="dark" />
        
        {/* Background Ambient Glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full filter blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase">
                MY <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">ORDERS</span>
              </h1>
              {isConnected && (
                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px] shadow-green-500/50 animate-pulse" title="Live Updates"></div>
              )}
            </div>
            <p className="text-slate-400 font-light">
              Manage and track all your boosting orders
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <div className="text-red-400 mr-3">❌</div>
                <div>
                  <p className="text-red-400 font-medium">{error}</p>
                  <button onClick={fetchOrders} className="text-red-400 hover:text-red-300 text-sm underline mt-1">
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Orders', value: orders.length, color: 'from-blue-500/10', icon: '📦' },
              { label: 'Completed/Paid', value: orders.filter(o => o.status === 'completed' || o.paymentStatus === 'paid').length, color: 'from-emerald-500/10', icon: '✅' },
              { label: 'Verifying', value: orders.filter(o => o.paymentStatus === 'pending_verification').length, color: 'from-orange-500/10', icon: '🔍' },
              { label: 'Pending Payment', value: orders.filter(o => o.status === 'pending' && o.paymentStatus === 'pending').length, color: 'from-yellow-500/10', icon: '⏳' }
            ].map((stat, i) => (
              <div key={i} className={`bg-gradient-to-br ${stat.color} to-transparent border border-white/5 backdrop-blur-md p-4 rounded-2xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                  </div>
                  <span className="text-xl opacity-50">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-12 text-center backdrop-blur-xl">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
              <p className="text-slate-400 mb-6">
                Start hiring boosting services to see your orders here.
              </p>
              <Link to="/services" className="inline-block bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 px-8 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/20">
                Explore Services
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status, order.paymentStatus);
                const isPending = order.status === 'pending' && order.paymentStatus !== 'paid' && order.paymentStatus !== 'pending_verification';
                
                return (
                  <div key={order._id} className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl hover:border-white/10 transition-all">
                    <div className="p-6">
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                        <div>
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <span className="font-mono font-bold text-white">
                              #{order.orderNumber || order._id.slice(-6)}
                            </span>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${statusInfo.color}`}>
                              {statusInfo.icon} {statusInfo.text}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Created: {formatDate(order.createdAt)}
                          </p>
                          {order.paymentMethod && order.paymentMethod !== 'none' && (
                            <p className="text-xs text-slate-500 mt-1">
                              Payment Method: <span className="text-slate-300">{formatPaymentMethod(order.paymentMethod)}</span>
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <span className="text-2xl font-black text-white">
                            {formatPrice(order.totalPrice || order.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Service</h4>
                          <p className="text-white font-medium">
                            {order.service?.name || 'Service not specified'}
                          </p>
                          {order.service?.game && (
                            <p className="text-sm text-slate-400 mt-1">
                              Game: {order.service.game}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Game Details</h4>
                          {order.gameDetails ? (
                            <div className="text-sm">
                              <p className="text-white">
                                Username: {order.gameDetails.gameUsername || order.gameDetails.username || 'N/A'}
                              </p>
                              {order.gameDetails.server && (
                                <p className="text-slate-400 mt-1">
                                  Server: {order.gameDetails.server}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-500 text-sm">Not specified</p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t border-white/5 pt-4">
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all border border-white/10 text-sm"
                          >
                            📋 View Full Details
                          </button>

                          {isPending && (
                            <button
                              onClick={() => handlePayment(order)}
                              disabled={processing[order._id]}
                              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg shadow-cyan-900/20"
                            >
                              {processing[order._id] ? 'Processing...' : `💳 Pay ${formatPrice(order.totalPrice || order.totalAmount)}`}
                            </button>
                          )}

                          {(order.status === 'paid' || order.paymentStatus === 'paid') && (
                            <span className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-medium inline-flex items-center text-sm">
                              <span className="mr-2">✅</span> Payment Confirmed
                            </span>
                          )}

                          {order.paymentStatus === 'pending_verification' && (
                            <span className="px-5 py-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-xl font-medium inline-flex items-center text-sm">
                              <span className="mr-2">🔍</span> Verifying Payment
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-2">Need help with your orders?</h3>
            <p className="text-slate-400 mb-4 text-sm">
              If you have any issues with payment or questions about your orders,
              our support team is ready to help.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/support" className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-cyan-900/20">
                Contact Support
              </Link>
              <Link to="/services" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all border border-white/10 text-sm">
                Hire Another Service
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal - Dark Mode */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  Order <span className="text-cyan-400">Details</span>
                </h2>
                <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white text-2xl transition-colors">
                  ×
                </button>
              </div>

              {/* Order Header */}
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 font-mono">#{selectedOrder.orderNumber}</span>
                  <div className="flex gap-2">
                    {(() => {
                      const info = getStatusInfo(selectedOrder.status, selectedOrder.paymentStatus);
                      return (
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${info.color}`}>
                          {info.icon} {info.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <p className="text-xs text-slate-500">Created: {formatDateTime(selectedOrder.createdAt)}</p>
              </div>

              {/* Service Details */}
              <div className="mb-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Service Information</h3>
                <div className="bg-cyan-500/5 rounded-xl p-4 border border-cyan-500/20">
                  <p className="font-medium text-white">{selectedOrder.service?.name || 'Premium Service'}</p>
                  <p className="text-sm text-slate-400">{selectedOrder.gameDetails?.game || selectedOrder.service?.game || 'Game'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-1 rounded-full border border-cyan-500/20">
                      {selectedOrder.gameDetails?.serviceType || 'Service'}
                    </span>
                    {selectedOrder.gameDetails?.server && (
                      <span className="bg-purple-500/10 text-purple-400 text-[10px] px-2 py-1 rounded-full border border-purple-500/20">
                        {selectedOrder.gameDetails.server}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="mb-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Payment Information</h3>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400">Total Amount:</span>
                    <span className="font-bold text-emerald-400">{formatPrice(selectedOrder.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400">Payment Method:</span>
                    <span className="text-white font-medium">{formatPaymentMethod(selectedOrder.paymentMethod)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Status:</span>
                    {(() => {
                      const info = getStatusInfo(selectedOrder.status, selectedOrder.paymentStatus);
                      return (
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${info.color}`}>
                          {info.text}
                        </span>
                      );
                    })()}
                  </div>
                  {selectedOrder.paidAt && (
                    <p className="text-xs text-slate-500 mt-3">
                      Paid on: {formatDateTime(selectedOrder.paidAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Proof (if exists) */}
              {paymentProof && (
                <div className="mb-6">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Payment Receipt</h3>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                    <img 
                      src={paymentProof.imageUrl} 
                      alt="Payment Proof" 
                      className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-white/10"
                      onClick={() => window.open(paymentProof.imageUrl, '_blank')}
                    />
                    {paymentProof.transactionHash && (
                      <p className="text-xs text-slate-500 mt-2 font-mono break-all">
                        TX: {paymentProof.transactionHash}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      Uploaded: {formatDateTime(paymentProof.createdAt)}
                    </p>
                    <p className="text-xs mt-2">
                      Status: 
                      <span className={`ml-1 font-medium ${
                        paymentProof.status === 'approved' ? 'text-emerald-400' :
                        paymentProof.status === 'rejected' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {paymentProof.status === 'approved' ? '✅ Approved' :
                         paymentProof.status === 'rejected' ? '❌ Rejected' :
                         '⏳ Pending Review'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="mb-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/20">📝</div>
                    <div>
                      <p className="font-medium text-white">Order Created</p>
                      <p className="text-xs text-slate-500">{formatDateTime(selectedOrder.createdAt)}</p>
                    </div>
                  </div>
                  
                  {selectedOrder.paymentStatus !== 'pending' && (
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                        selectedOrder.paymentStatus === 'pending_verification' 
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {selectedOrder.paymentStatus === 'pending_verification' ? '🔍' : '💰'}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Payment {selectedOrder.paymentStatus === 'pending_verification' ? 'Submitted for Verification' : 'Confirmed'}
                        </p>
                        <p className="text-xs text-slate-500">
                          Method: {formatPaymentMethod(selectedOrder.paymentMethod)}
                        </p>
                        {selectedOrder.paidAt && (
                          <p className="text-xs text-slate-500">{formatDateTime(selectedOrder.paidAt)}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'in_progress' && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20">🔄</div>
                      <div>
                        <p className="font-medium text-white">Order In Progress</p>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'completed' && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20">✅</div>
                      <div>
                        <p className="font-medium text-white">Order Completed</p>
                        {selectedOrder.completedAt && (
                          <p className="text-xs text-slate-500">{formatDateTime(selectedOrder.completedAt)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedOrder.status === 'pending' && selectedOrder.paymentStatus === 'pending' && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      navigate(`/checkout/${selectedOrder._id}`);
                    }}
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/20"
                  >
                    Pay Now
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-all border border-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyOrders;