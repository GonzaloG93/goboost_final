import { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';

export const useOrders = (filters = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/orders/my-orders');
      setOrders(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status });
      await fetchOrders(); // Refresh orders
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const rateOrder = async (orderId, rating, review) => {
    try {
      await axios.patch(`/api/orders/${orderId}/rate`, { rating, review });
      await fetchOrders(); // Refresh orders
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return {
    orders,
    loading,
    error,
    updateOrderStatus,
    rateOrder,
    refetch: fetchOrders
  };
};