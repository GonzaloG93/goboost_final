// frontend/pages/PayPalSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import CustomNavbar from '../components/CustomNavbar';

const PayPalSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState(null);

  const getAllParams = () => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  };

  const capturePayment = async (paymentId) => {
    try {
      console.log('💰 Attempting to capture payment with ID:', paymentId);

      if (!paymentId) {
        throw new Error('Payment ID not provided');
      }

      const response = await axios.post('/payments/paypal/capture', {
        orderID: paymentId
      });

      console.log('✅ Payment captured successfully:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Error in capturePayment:', error);
      
      if (error.response?.status === 404) {
        throw new Error(`Payment not found with ID: ${paymentId}`);
      }
      
      throw error;
    }
  };

  const handleCapturePayment = async () => {
    try {
      setLoading(true);
      
      const allParams = getAllParams();
      console.log('🔍 All PayPal parameters:', allParams);
      setDebugInfo(allParams);

      const token = allParams.token || allParams.TOKEN;
      const orderID = allParams.orderID || allParams.orderId || allParams.order_id;
      const paymentId = allParams.paymentId || allParams.paymentID;
      const payerID = allParams.PayerID || allParams.payer_id;
      const paymentToken = allParams.paymentToken || allParams.payment_token;
      
      const paypalToken = token || paymentToken;
      const paypalOrderId = orderID || paymentId;

      console.log('🔑 Extracted parameters:', {
        paypalToken,
        paypalOrderId,
        payerID,
        allParams
      });

      // Strategy 1: Use PayPal token (most common)
      if (paypalToken) {
        try {
          console.log('🔄 Attempt 1: Using PayPal token:', paypalToken);
          const result = await capturePayment(paypalToken);
          handleSuccess(result);
          return;
        } catch (err) {
          console.log('⚠️ Attempt 1 failed:', err.message);
        }
      }

      // Strategy 2: Use orderID if exists
      if (paypalOrderId) {
        try {
          console.log('🔄 Attempt 2: Using orderID:', paypalOrderId);
          const result = await capturePayment(paypalOrderId);
          handleSuccess(result);
          return;
        } catch (err) {
          console.log('⚠️ Attempt 2 failed:', err.message);
        }
      }

      // Strategy 3: Find pending orders for user
      if (user && user._id) {
        try {
          console.log('🔄 Attempt 3: Finding pending orders for user');
          const response = await axios.get(`/orders/user/${user._id}?status=pending&paymentMethod=paypal`);
          const pendingOrders = response.data.orders || response.data.data || [];
          
          console.log('📋 Pending orders found:', pendingOrders.length);
          
          if (pendingOrders.length > 0) {
            pendingOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const latestOrder = pendingOrders[0];
            
            console.log('🎯 Latest pending order:', latestOrder._id);
            
            if (latestOrder.paymentReference) {
              const paymentResponse = await axios.get(`/payments/${latestOrder.paymentReference}`);
              const paymentData = paymentResponse.data.payment || paymentResponse.data.data;
              
              if (paymentData && paymentData.providerPaymentId) {
                console.log('💰 Attempting with providerPaymentId:', paymentData.providerPaymentId);
                const result = await capturePayment(paymentData.providerPaymentId);
                handleSuccess(result);
                return;
              }
            }
          }
        } catch (err) {
          console.log('⚠️ Attempt 3 failed:', err.message);
        }
      }

      throw new Error('Could not identify payment. Parameters received: ' + JSON.stringify(allParams));

    } catch (error) {
      console.error('❌ Final error capturing payment:', error);
      
      let errorMessage = 'Error processing PayPal payment';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (retryCount < 2 && (
        error.message.includes('network') || 
        error.message.includes('timeout') ||
        error.response?.status >= 500
      )) {
        console.log(`🔄 Retrying (${retryCount + 1}/2)...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => handleCapturePayment(), 3000);
        return;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (result) => {
    console.log('🎉 Payment successful:', result);
    setSuccess(true);
    setOrderData(result.data || result);
    setLoading(false);
  };

  useEffect(() => {
    handleCapturePayment();
  }, []);

  // Loading State
  if (loading) {
    return (
      <>
        <CustomNavbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center pt-20">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-blue-100">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto">
                <div className="animate-spin rounded-full h-full w-full border-[6px] border-blue-100 border-t-blue-600"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-5xl animate-pulse">💳</div>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Processing Payment</h2>
            <p className="text-gray-600 mb-6">Confirming your transaction with PayPal...</p>
            
            <div className="space-y-4">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" 
                  style={{ width: `${70 + (retryCount * 15)}%` }}
                ></div>
              </div>
              
              <div className="text-sm text-gray-500 space-y-1">
                {retryCount > 0 ? (
                  <p className="text-yellow-600 font-medium">
                    ⚠️ Retrying connection... ({retryCount}/2)
                  </p>
                ) : (
                  <p>This may take a few seconds</p>
                )}
                <p>Please do not close this page</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error State
  if (error) {
    return (
      <>
        <CustomNavbar />
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center pt-20">
          <div className="text-center max-w-lg mx-auto p-8 bg-white rounded-2xl shadow-xl border border-red-100">
            <div className="text-7xl mb-6 animate-bounce">❌</div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Error</h2>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 text-left">
              <p className="text-red-700 font-medium mb-3 text-lg">{error}</p>
              <div className="space-y-2 text-red-600 text-sm">
                <p>🔍 Possible causes:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Transaction was cancelled or expired</li>
                  <li>Connection issues with PayPal</li>
                  <li>Order was already processed</li>
                  <li>Invalid or expired payment token</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                to="/my-orders"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-center"
              >
                📋 View My Orders
              </Link>
              
              <Link
                to="/support"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-semibold transition-all text-center"
              >
                🆘 Contact Support
              </Link>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-4 rounded-xl font-semibold transition-all"
              >
                🔄 Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Success State
  if (success) {
    return (
      <>
        <CustomNavbar />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center pt-20">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            
            <p className="text-gray-600 mb-2">
              Your payment has been processed successfully.
            </p>
            <p className="text-gray-600 mb-6">
              We have received your order and our elite team will begin working on your service soon.
            </p>

            {orderData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                {orderData.id && (
                  <p className="text-sm text-green-800 mb-1">
                    Transaction ID: {orderData.id.slice(0, 20)}...
                  </p>
                )}
                {orderData.amount && (
                  <p className="text-lg font-bold text-green-700">
                    Amount: ${typeof orderData.amount === 'object' ? orderData.amount.value : orderData.amount}
                  </p>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                📧 You will receive a confirmation email with your order details.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                to="/my-orders"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 block text-center"
              >
                View My Orders
              </Link>
              
              <Link
                to="/services"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 block text-center"
              >
                Hire Another Service
              </Link>
              
              <Link
                to="/"
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 block text-center"
              >
                Back to Home
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Have questions? <Link to="/support" className="text-blue-600 hover:text-blue-700 font-medium">Contact Support</Link>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default PayPalSuccess;