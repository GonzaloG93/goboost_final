// frontend/src/hooks/usePricing.js - VERSIÓN FINAL CORREGIDA
// ✅ Exporta getPriceBreakdown correctamente

import { useState, useCallback } from 'react';
import pricingCalculator from '../utils/pricingCalculator';

const usePricing = () => {
  const [price, setPrice] = useState(0);
  const [breakdown, setBreakdown] = useState([]);

  const calculatePrice = useCallback((serviceType, serviceDetails, game, options = {}) => {
    console.log('📊 usePricing - Calculating:', { 
      serviceType, 
      game, 
      currentLevel: serviceDetails.currentLevel, 
      desiredLevel: serviceDetails.desiredLevel, 
      basePrice: serviceDetails.basePrice,
      quantity: serviceDetails.quantity,
      options
    });

    try {
      const calculatedPrice = pricingCalculator.calculatePrice(serviceType, serviceDetails, game, options);
      const priceBreakdown = pricingCalculator.getPriceBreakdown(serviceType, serviceDetails, game, options);

      console.log('💰 usePricing - Result:', { calculatedPrice, breakdown: priceBreakdown });

      setPrice(calculatedPrice);
      setBreakdown(priceBreakdown);

      return calculatedPrice;
    } catch (error) {
      console.error('❌ usePricing - Error:', error);
      const defaultPrice = serviceDetails.basePrice || 0;
      setPrice(defaultPrice);
      setBreakdown([{ item: 'Base Service', amount: defaultPrice, isTotal: true }]);
      return defaultPrice;
    }
  }, []);

  // ✅ FUNCIÓN getPriceBreakdown
  const getPriceBreakdown = useCallback((serviceType, serviceDetails, game, options = {}) => {
    return pricingCalculator.getPriceBreakdown(serviceType, serviceDetails, game, options);
  }, []);

  const getAvailableRanges = useCallback((game, serviceType) => {
    return pricingCalculator.getPriceRanges(game, serviceType);
  }, []);

  const getMaxLevel = useCallback((game, serviceType) => {
    return pricingCalculator.getMaxLevel(game, serviceType);
  }, []);

  const getPricePerLevel = useCallback((game, serviceType) => {
    return pricingCalculator.getPricePerLevel(game, serviceType);
  }, []);

  const isLevelingService = useCallback((serviceType) => {
    return pricingCalculator.isLevelingService(serviceType);
  }, []);

  const supportsQuantity = useCallback((serviceType) => {
    return pricingCalculator.supportsQuantity(serviceType);
  }, []);

  const formatServiceName = useCallback((serviceType) => {
    return pricingCalculator.formatServiceName(serviceType);
  }, []);

  return {
    price,
    breakdown,
    calculatePrice,
    getPriceBreakdown,
    getAvailableRanges,
    getMaxLevel,
    getPricePerLevel,
    isLevelingService,
    supportsQuantity,
    formatServiceName
  };
};

export default usePricing;