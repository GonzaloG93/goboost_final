import { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';

export const useServices = (filters = {}) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, [filters]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.game) queryParams.append('game', filters.game);
      if (filters.serviceType) queryParams.append('serviceType', filters.serviceType);
      
      const response = await axios.get(`/api/boosts?${queryParams}`);
      setServices(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    services,
    loading,
    error,
    refetch: fetchServices
  };
};