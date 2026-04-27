// frontend/pages/Checkout.jsx - VERSIÓN CORREGIDA (UPLOAD FUNCIONAL)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import CustomNavbar from '../components/CustomNavbar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import BinancePay image from public
const binancePayImage = "/images/BinancePay.jpg";

const Checkout = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [availableMethods, setAvailableMethods] = useState([]);
  const [error, setError] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // ✅ Estados para upload de comprobante (Binance)
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [proofDescription, setProofDescription] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [uploading, setUploading] = useState(false);

  // ✅ LOAD ORDER AND AVAILABLE PAYMENT METHODS
  useEffect(() => {
    const fetchOrderAndMethods = async () => {
      if (!orderId || !user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        // 1. Load order
        const orderResponse = await axios.get(`/orders/${orderId}`);
        let orderData;
        
        if (orderResponse.data?._id) {
          orderData = orderResponse.data;
        } else if (orderResponse.data?.data?._id) {
          orderData = orderResponse.data.data;
        } else if (orderResponse.data?.order?._id) {
          orderData = orderResponse.data.order;
        } else {
          throw new Error('Could not get order information');
        }

        // Verify order belongs to user
        if (orderData.user?._id !== user._id && orderData.user !== user._id) {
          throw new Error('You do not have permission to access this order');
        }

        setOrder(orderData);

        // 2. Load available payment methods
        try {
          const methodsResponse = await axios.get('/payments/methods');
          const methods = methodsResponse.data?.data || [];
          setAvailableMethods(methods.filter(method => 
            method.id !== 'manual' && method.enabled !== false
          ));
          
          // Select PayPal by default if available
          const paypalMethod = methods.find(m => m.id === 'paypal');
          if (paypalMethod) {
            setPaymentMethod('paypal');
          } else if (methods.length > 0) {
            setPaymentMethod(methods[0].id);
          }
        } catch (methodsError) {
          console.warn('Could not load payment methods:', methodsError);
          // Default methods
          setAvailableMethods([
            {
              id: 'paypal',
              name: 'PayPal',
              description: 'Secure payment with PayPal or card',
              icon: 'paypal',
              enabled: true,
              features: ['instant', 'secure']
            },
            {
              id: 'binance',
              name: 'Binance Pay',
              description: 'Pay with cryptocurrencies',
              icon: 'binance',
              enabled: true,
              features: ['crypto', 'secure']
            }
          ]);
        }

        setError(null);
      } catch (error) {
        console.error('Error loading checkout:', error);
        
        let errorMessage = 'Error loading order';
        if (error.response?.status === 404) {
          errorMessage = 'Order not found';
        } else if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to view this order';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndMethods();
  }, [orderId, user, navigate]);

  // ✅ CHECK PAYMENT STATUS
  const checkPaymentStatus = async () => {
    if (!order) return;

    setCheckingStatus(true);
    try {
      console.log('🔍 Checking payment status for order:', order._id);
      
      const response = await axios.get(`/payments/status/${order._id}`);
      const paymentData = response.data.data;
      
      console.log('📊 Payment status:', paymentData);

      const currentStatus = paymentData.currentStatus;
      
      if (currentStatus === 'completed' || currentStatus === 'paid') {
        toast.success('✅ Payment confirmed! Redirecting to your orders...');
        setTimeout(() => navigate('/my-orders'), 2000);
      } else if (currentStatus === 'pending_verification') {
        toast.info('⏳ Payment pending verification. Our team will review it shortly.');
      } else if (currentStatus === 'processing') {
        toast.info('🔄 Payment in process...');
      } else if (currentStatus === 'failed') {
        toast.error('❌ Payment failed. Please try another method.');
      } else {
        toast.info(`Payment status: ${currentStatus}`);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      // Fallback to order verification
      try {
        const orderResponse = await axios.get(`/orders/${order._id}`);
        const orderData = orderResponse.data;
        
        if (orderData.status === 'paid' || orderData.paymentStatus === 'paid') {
          toast.success('✅ Payment confirmed!');
          navigate('/my-orders');
        } else {
          toast.info(`Order is ${orderData.status}. If you already paid, please contact support.`);
        }
      } catch (fallbackError) {
        toast.error('Error checking payment status. Please contact support.');
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  // ✅ PAYPAL PAYMENT - SIN MODIFICACIONES
  const handlePayPalPayment = async () => {
    if (!order) {
      alert('Error: Order not available');
      return;
    }

    setProcessing(true);
    try {
      console.log('💳 Starting PayPal payment for order:', order._id);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await axios.post('/payments/paypal/create', {
        orderId: order._id
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ PayPal response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error in server response');
      }
      
      const paymentUrl = response.data.data?.approvalUrl || 
                        response.data.data?.paymentUrl || 
                        response.data?.paymentUrl ||
                        response.data?.links?.[0]?.href ||
                        response.data.data?.links?.find(link => link.rel === 'approve')?.href;
      
      if (paymentUrl) {
        console.log('🌐 Redirecting to PayPal:', paymentUrl);
        window.location.href = paymentUrl;
      } else {
        throw new Error('No payment URL received');
      }

    } catch (error) {
      console.error('❌ PayPal payment error:', error);
      
      let errorMessage = 'Error processing PayPal payment';
      
      if (error.response?.status === 404) {
        errorMessage = 'PayPal route not found on server';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // ✅ HANDLE IMAGE SELECTION FOR UPLOAD
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setProofImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ UPLOAD PAYMENT PROOF - VERSIÓN CORREGIDA (SIN DEPENDENCIA DE /upload/image)
  const handleProofUpload = async () => {
    if (!proofImage) {
      toast.warning('Please select a receipt image');
      return;
    }

    if (!order?._id) {
      toast.error('Order not found');
      return;
    }

    setUploading(true);
    try {
      console.log('📸 Uploading payment proof for order:', order._id);
      
      // ✅ Usar directamente el base64 como imageUrl
      const imageUrl = proofPreview;
      
      console.log('📦 Sending proof to backend...');
      
      // Enviar comprobante al backend
      const response = await axios.post('/payments/proof/upload', {
        orderId: order._id,
        imageUrl: imageUrl,
        description: proofDescription || `Binance payment proof for order #${order.orderNumber}`,
        transactionHash: transactionHash || ''
      });

      console.log('✅ Proof upload response:', response.data);

      if (response.data.success) {
        toast.success('✅ Payment proof uploaded! Waiting for verification.');
        setShowProofUpload(false);
        setProofImage(null);
        setProofPreview(null);
        setProofDescription('');
        setTransactionHash('');
        
        // Actualizar estado local
        setOrder(prev => ({ ...prev, paymentStatus: 'pending_verification' }));
      } else {
        throw new Error(response.data.message || 'Error uploading proof');
      }
    } catch (error) {
      console.error('❌ Error uploading proof:', error);
      console.error('Response data:', error.response?.data);
      
      let errorMessage = 'Error uploading payment proof';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // ✅ HANDLE BINANCE IMAGE ERROR
  const handleImageError = () => {
    console.error('❌ Error loading BinancePay.jpg image');
    setImageError(true);
  };

  // ✅ GET ICON FOR PAYMENT METHOD
  const getPaymentIcon = (methodId) => {
    switch (methodId) {
      case 'paypal':
        return (
          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
            <span className="text-blue-600 font-bold text-lg">P</span>
          </div>
        );
      case 'binance':
        return (
          <div className="w-10 h-10 flex items-center justify-center bg-yellow-100 rounded-lg">
            <span className="text-yellow-600 font-bold text-lg">B</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
            <span className="text-gray-600 font-bold text-lg">$</span>
          </div>
        );
    }
  };

  // ✅ GET COLORS FOR PAYMENT METHOD
  const getPaymentColors = (methodId) => {
    switch (methodId) {
      case 'paypal':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'binance':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          button: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  // ✅ LOADING RENDER
  if (loading) {
    return (
      <>
        <CustomNavbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading checkout...</p>
            <p className="text-gray-400 text-sm mt-2">Order: {orderId}</p>
          </div>
        </div>
      </>
    );
  }

  // ✅ ERROR RENDER
  if (error || !order) {
    return (
      <>
        <CustomNavbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
          <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 mb-2">{error || 'Order not found'}</p>
              <p className="text-red-600 text-sm">
                ID: <code className="bg-red-100 px-2 py-1 rounded">{orderId}</code>
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/my-orders')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate('/services')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Create New Order
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomNavbar />
      <ToastContainer position="top-right" autoClose={5000} theme="colored" />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 pt-24">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SECURE CHECKOUT
            </h1>
            <p className="text-xl text-gray-600">Order #{order.orderNumber}</p>
            <div className="mt-2 flex justify-center items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                order.status === 'paid' ? 'bg-green-100 text-green-800' :
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.status === 'paid' ? '✅ Paid' :
                 order.status === 'pending' ? '⏳ Pending' :
                 order.status === 'in_progress' ? '🔄 In Progress' :
                 order.status}
              </span>
              {order.paymentStatus && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Payment: {order.paymentStatus}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left column: Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                  Order Summary
                </h2>
                
                <div className="space-y-6">
                  {/* Service information */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-gray-900 mb-3">Service Purchased</h3>
                    <p className="text-gray-800 font-medium mb-1">{order.service?.name || 'Premium Service'}</p>
                    <p className="text-gray-600 text-sm mb-3">{order.gameDetails?.game || 'Game'}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {order.gameDetails?.serviceType || 'Service'}
                      </span>
                      {order.gameDetails?.server && (
                        <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                          {order.gameDetails.server}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order details */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Order Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-medium text-gray-900 text-sm">{order.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimated time:</span>
                        <span className="font-medium text-gray-900">{order.service?.estimatedTime || '24-48h'}</span>
                      </div>
                      {order.gameDetails?.quantity && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium text-gray-900">{order.gameDetails.quantity}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-600 mb-2">TOTAL TO PAY</p>
                      <div className="text-4xl font-black text-green-600 mb-2">${order.totalPrice}</div>
                      <p className="text-sm text-green-600 font-medium">
                        100% secure payment guaranteed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Payment methods */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Select Payment Method</h2>
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-sm flex items-center">
                    <span className="mr-2">🔒</span> Secure
                  </div>
                </div>

                {/* ✅ UPLOAD PROOF MODAL - SOLO PARA BINANCE */}
                {showProofUpload && (
                  <div className="mb-8 p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                    <h3 className="text-lg font-bold text-yellow-900 mb-4">📸 Upload Payment Receipt</h3>
                    
                    <div className="space-y-4">
                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Screenshot/Receipt *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                        {proofPreview && (
                          <div className="mt-3">
                            <img 
                              src={proofPreview} 
                              alt="Preview" 
                              className="max-h-40 rounded-lg border"
                            />
                          </div>
                        )}
                      </div>

                      {/* Transaction Hash */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transaction Hash / TXID (Optional)
                        </label>
                        <input
                          type="text"
                          value={transactionHash}
                          onChange={(e) => setTransactionHash(e.target.value)}
                          placeholder="0x... or TXID from Binance"
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={proofDescription}
                          onChange={(e) => setProofDescription(e.target.value)}
                          placeholder="Additional information about your payment..."
                          rows={2}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <button
                          onClick={handleProofUpload}
                          disabled={!proofImage || uploading}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-all"
                        >
                          {uploading ? (
                            <span className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Uploading...
                            </span>
                          ) : (
                            '📤 Submit Receipt'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowProofUpload(false);
                            setProofImage(null);
                            setProofPreview(null);
                            setProofDescription('');
                            setTransactionHash('');
                          }}
                          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Available payment methods */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Methods</h3>
                  
                  {availableMethods.length > 0 ? (
                    <div className="space-y-4">
                      {availableMethods.map((method) => {
                        const colors = getPaymentColors(method.id);
                        const isSelected = paymentMethod === method.id;
                        
                        return (
                          <div
                            key={method.id}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              isSelected 
                                ? `${colors.border} ${colors.bg} transform scale-[1.02]`
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => setPaymentMethod(method.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected
                                    ? `border-blue-500 bg-blue-500`
                                    : 'border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  )}
                                </div>
                                
                                {getPaymentIcon(method.id)}
                                
                                <div>
                                  <h4 className="font-bold text-gray-900">{method.name}</h4>
                                  <p className="text-sm text-gray-600">{method.description}</p>
                                  {method.fees && (
                                    <p className="text-xs text-green-600 font-medium mt-1">
                                      Fee: {method.fees.percentage}% + ${method.fees.fixed}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                {method.features?.includes('instant') && (
                                  <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded mb-1">
                                    ⚡ Instant
                                  </span>
                                )}
                                {method.features?.includes('secure') && (
                                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                    🔒 Secure
                                  </span>
                                )}
                                {method.features?.includes('crypto') && (
                                  <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">
                                    💱 Crypto
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Specific content for Binance Pay */}
                            {isSelected && method.id === 'binance' && (
                              <div className="mt-4">
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                                  <h4 className="font-semibold text-yellow-900 mb-2">💰 How to pay with Binance:</h4>
                                  <ol className="text-sm text-gray-700 list-decimal pl-5 space-y-1">
                                    <li>Open the Binance app on your phone</li>
                                    <li>Go to "Binance Pay" section</li>
                                    <li>Scan the QR code from the image</li>
                                    <li>Confirm payment of <strong>${order.totalPrice}</strong></li>
                                    <li>After paying, click on "Upload Receipt" below</li>
                                  </ol>
                                </div>
                                
                                {/* Binance Pay QR Image */}
                                <div className="text-center">
                                  <div className="bg-white p-4 rounded-xl border-2 border-yellow-300 inline-block max-w-sm">
                                    <div className="text-center mb-3">
                                      <h5 className="text-lg font-bold text-gray-800">Binance Pay</h5>
                                      <p className="text-gray-600 text-sm">
                                        Amount: <span className="font-bold text-green-600">${order.totalPrice}</span>
                                      </p>
                                      <p className="text-gray-500 text-xs mt-1">Scan to pay</p>
                                    </div>
                                    
                                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                                      {imageError ? (
                                        <div className="py-8 text-center">
                                          <div className="text-4xl mb-2">📷</div>
                                          <p className="text-red-600 font-semibold">Image not found</p>
                                          <p className="text-gray-500 text-xs mt-2">
                                            Make sure <code>BinancePay.jpg</code> is in /public/images/
                                          </p>
                                        </div>
                                      ) : (
                                        <img 
                                          src={binancePayImage} 
                                          alt="Binance Pay QR Code" 
                                          className="w-full h-auto max-h-[280px] object-contain"
                                          onError={handleImageError}
                                          loading="lazy"
                                        />
                                      )}
                                    </div>
                                    
                                    <div className="mt-3">
                                      <p className="text-gray-500 text-xs mt-1">Scan with Binance App</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Specific content for PayPal */}
                            {isSelected && method.id === 'paypal' && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-700">
                                  You will be redirected to PayPal to complete the payment securely.
                                  You can pay with your PayPal account or credit/debit card.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">💳</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No payment methods available</h3>
                      <p className="text-gray-600">
                        Please contact support to complete your payment.
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment button */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="text-center">
                    <button
                      onClick={paymentMethod === 'paypal' ? handlePayPalPayment : checkPaymentStatus}
                      disabled={!paymentMethod || processing || order.status !== 'pending'}
                      className={`w-full ${
                        paymentMethod === 'paypal' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                          : 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
                      } text-white py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl`}
                    >
                      {processing ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Processing Payment...
                        </div>
                      ) : paymentMethod === 'paypal' ? (
                        `PAY WITH PAYPAL - $${order.totalPrice}`
                      ) : paymentMethod === 'binance' ? (
                        `I ALREADY PAID - CHECK STATUS`
                      ) : (
                        `PAY $${order.totalPrice}`
                      )}
                    </button>
                    
                    <p className="text-sm text-gray-600 mt-4 text-center">
                      {order.status !== 'pending' 
                        ? `This order is already ${order.status}.`
                        : paymentMethod === 'binance' 
                          ? 'After paying with Binance, upload your receipt below'
                          : 'Click to proceed with payment'
                      }
                    </p>
                    
                    <div className="mt-6 flex justify-center space-x-4">
                      {/* ✅ BOTÓN PARA SUBIR COMPROBANTE (SOLO BINANCE) */}
                      {paymentMethod === 'binance' && (
                        <button
                          onClick={() => setShowProofUpload(true)}
                          className="px-6 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg font-medium transition-all border border-yellow-300"
                        >
                          📸 Upload Receipt
                        </button>
                      )}
                      
                      <button
                        onClick={() => navigate('/my-orders')}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                      >
                        Back to My Orders
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security information */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Your security is our priority</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl mb-2">🔒</div>
                      <p className="text-xs font-semibold text-gray-700">256-bit SSL Encryption</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl mb-2">🛡️</div>
                      <p className="text-xs font-semibold text-gray-700">Data Protection</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl mb-2">💯</div>
                      <p className="text-xs font-semibold text-gray-700">Money-back Guarantee</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl mb-2">📞</div>
                      <p className="text-xs font-semibold text-gray-700">24/7 Support</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional information */}
          <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Need help with payment?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📧 Contact Support</h4>
                <p className="text-sm text-gray-600">
                  Write to support@gonboost.com for immediate assistance.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">💬 Binance Help</h4>
                <p className="text-sm text-gray-600">
                  For Binance Pay issues, contact our specialized support.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">📋 FAQs</h4>
                <p className="text-sm text-gray-600">
                  Visit our FAQ section for quick answers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;