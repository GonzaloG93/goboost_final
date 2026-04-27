// frontend/src/components/PriceCalculator.jsx - VERSIÓN FINAL SIN WARNINGS
import React, { useState, useEffect, useCallback, useRef } from 'react';
import pricingCalculator from '../utils/pricingCalculator';

const PriceCalculator = ({ service, onPriceUpdate }) => {
  const [formData, setFormData] = useState({
    currentLevel: 1,
    desiredLevel: 10,
    quantity: 1,
    options: {
      priority: false,
      streaming: false,
      offpeak: false
    }
  });

  const [price, setPrice] = useState(0);
  const [breakdown, setBreakdown] = useState([]);
  const [maxLevel, setMaxLevel] = useState(100);
  
  // ✅ Usar useRef para evitar llamadas durante el render
  const isFirstRender = useRef(true);

  // Inicializar nivel máximo
  useEffect(() => {
    if (service) {
      const max = pricingCalculator.getMaxLevel(service.game, service.serviceType);
      setMaxLevel(max);
      if (formData.desiredLevel > max) {
        setFormData(prev => ({ ...prev, desiredLevel: max }));
      }
    }
  }, [service]);

  // ✅ CALCULAR PRECIO - CORREGIDO (sin warnings)
  useEffect(() => {
    if (!service) return;

    const calculated = pricingCalculator.calculatePrice(
      service.serviceType,
      formData,
      service.game,
      formData.options
    );

    const priceBreakdown = pricingCalculator.getPriceBreakdown(
      service.serviceType,
      formData,
      service.game,
      formData.options
    );

    // Actualizar precio y breakdown (esto es seguro durante el render)
    setPrice(calculated);
    setBreakdown(priceBreakdown);

    // ✅ Llamar a onPriceUpdate DESPUÉS del render, no durante
    if (!isFirstRender.current && onPriceUpdate) {
      // Usar setTimeout para mover la llamada fuera del ciclo de renderizado
      setTimeout(() => {
        onPriceUpdate(calculated, priceBreakdown, formData);
      }, 0);
    }
    
    isFirstRender.current = false;

  }, [formData.currentLevel, formData.desiredLevel, formData.quantity, formData.options, service, onPriceUpdate]);

  const handleLevelChange = useCallback((field, value) => {
    const numValue = Math.max(1, Math.min(maxLevel, parseInt(value) || 1));
    
    setFormData(prev => {
      const newData = { ...prev, [field]: numValue };
      if (field === 'currentLevel' && numValue >= prev.desiredLevel) {
        newData.desiredLevel = Math.min(maxLevel, numValue + 1);
      }
      if (field === 'desiredLevel' && numValue <= prev.currentLevel) {
        newData.currentLevel = Math.max(1, numValue - 1);
      }
      return newData;
    });
  }, [maxLevel]);

  const handleQuantityChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, quantity: Math.max(1, parseInt(value) || 1) }));
  }, []);

  const handleOptionChange = useCallback((optionName, checked) => {
    setFormData(prev => ({
      ...prev,
      options: { ...prev.options, [optionName]: checked }
    }));
  }, []);

  const isLeveling = pricingCalculator.isLevelingService(service?.serviceType);
  const supportsQuantity = pricingCalculator.supportsQuantity(service?.serviceType);
  const levelsToGain = formData.desiredLevel - formData.currentLevel;

  if (!service) return null;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Configure Your Service</h3>

      {/* Leveling */}
      {isLeveling && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Level</label>
              <input
                type="number"
                value={formData.currentLevel}
                onChange={(e) => handleLevelChange('currentLevel', e.target.value)}
                min="1"
                max={maxLevel - 1}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Desired Level</label>
              <input
                type="number"
                value={formData.desiredLevel}
                onChange={(e) => handleLevelChange('desiredLevel', e.target.value)}
                min={formData.currentLevel + 1}
                max={maxLevel}
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between">
              <span>Levels to gain:</span>
              <span className="font-bold">{levelsToGain} levels</span>
            </div>
          </div>
        </div>
      )}

      {/* Quantity */}
      {supportsQuantity && !isLeveling && (
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="50"
              value={formData.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="w-full"
            />
            <span className="font-bold text-lg min-w-8">{formData.quantity}</span>
          </div>
        </div>
      )}

      {/* Options */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="font-medium mb-2">Additional Options</h4>
        <div className="space-y-2">
          {Object.entries(formData.options).map(([opt, val]) => (
            <label key={opt} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => handleOptionChange(opt, e.target.checked)}
              />
              <span className="capitalize">{opt.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Display */}
      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-bold">Total Price:</span>
          <span className="text-2xl font-black text-green-600">${price}</span>
        </div>
        {breakdown.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {breakdown.filter(b => !b.isTotal).map((b, i) => (
              <div key={i} className="flex justify-between">
                <span>{b.item}:</span>
                <span>${b.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceCalculator;