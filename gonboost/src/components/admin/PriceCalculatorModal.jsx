// components/admin/PriceCalculatorModal.jsx - VERSIÓN MEJORADA
import React, { useState, useEffect } from 'react';

const PriceCalculatorModal = ({ serviceType, game, onClose, onApply }) => {
  // Detectar tipo de servicio
  const isParagon = serviceType === 'powerleveling_paragon';
  const isVariable = serviceType === 'variable_leveling';
  const isDiablo4 = game === 'Diablo 4';
  const isDiablo3 = game === 'Diablo 3';
  const isDiablo2 = game === 'Diablo 2 Resurrected';
  const isLastEpoch = game === 'Last Epoch';
  const isPathOfExile = game === 'Path of Exile' || game === 'Path of Exile 2';
  const isWoW = game?.includes('World of Warcraft');
  
  // Configuración específica por juego y tipo
  const getConfig = () => {
    // ============================================
    // VARIABLE LEVELING
    // ============================================
    if (isVariable) {
      if (isDiablo4) {
        return {
          min: 1,
          max: 1000,
          label: 'Variable Leveling',
          description: 'Niveles (1-1000) - Precio por nivel',
          priceRanges: [
            { from: 1, to: 200, price: 30, label: '1-200' },
            { from: 201, to: 400, price: 55, label: '201-400' },
            { from: 401, to: 600, price: 80, label: '401-600' },
            { from: 601, to: 800, price: 105, label: '601-800' },
            { from: 801, to: 1000, price: 130, label: '801-1000' }
          ]
        };
      } else if (isDiablo3) {
        return {
          min: 1,
          max: 1200,
          label: 'Variable Leveling',
          description: 'Niveles (1-1200) - Precio por nivel',
          priceRanges: [
            { from: 1, to: 300, price: 40, label: '1-300' },
            { from: 301, to: 600, price: 75, label: '301-600' },
            { from: 601, to: 900, price: 110, label: '601-900' },
            { from: 901, to: 1200, price: 145, label: '901-1200' }
          ]
        };
      } else if (isDiablo2) {
        return {
          min: 1,
          max: 99,
          label: 'Variable Leveling',
          description: 'Niveles (1-99) - Precio por nivel',
          priceRanges: [
            { from: 1, to: 33, price: 20, label: '1-33' },
            { from: 34, to: 66, price: 45, label: '34-66' },
            { from: 67, to: 99, price: 70, label: '67-99' }
          ]
        };
      } else if (isLastEpoch) {
        return {
          min: 1,
          max: 100,
          label: 'Variable Leveling',
          description: 'Niveles (1-100) - Precio por nivel',
          priceRanges: [
            { from: 1, to: 33, price: 18, label: '1-33' },
            { from: 34, to: 66, price: 36, label: '34-66' },
            { from: 67, to: 100, price: 54, label: '67-100' }
          ]
        };
      } else if (isPathOfExile) {
        return {
          min: 1,
          max: 100,
          label: 'Variable Leveling',
          description: 'Niveles (1-100) - Precio por nivel',
          priceRanges: [
            { from: 1, to: 33, price: 25, label: '1-33' },
            { from: 34, to: 66, price: 55, label: '34-66' },
            { from: 67, to: 100, price: 85, label: '67-100' }
          ]
        };
      } else if (isWoW) {
        const isClassic = game === 'World of Warcraft Classic';
        return {
          min: 1,
          max: isClassic ? 60 : 70,
          label: 'Variable Leveling',
          description: `Niveles (1-${isClassic ? 60 : 70}) - Precio por nivel`,
          priceRanges: isClassic ? [
            { from: 1, to: 20, price: 20, label: '1-20' },
            { from: 21, to: 40, price: 40, label: '21-40' },
            { from: 41, to: 60, price: 60, label: '41-60' }
          ] : [
            { from: 1, to: 23, price: 25, label: '1-23' },
            { from: 24, to: 46, price: 50, label: '24-46' },
            { from: 47, to: 70, price: 75, label: '47-70' }
          ]
        };
      }
    }
    
    // ============================================
    // DIABLO 4
    // ============================================
    if (isDiablo4) {
      if (isParagon) {
        return {
          min: 1,
          max: 300,
          label: 'Paragon',
          description: 'Niveles de Paragon (1-300)',
          priceRanges: [
            { from: 1, to: 50, price: 15, label: '1-50' },
            { from: 51, to: 100, price: 30, label: '51-100' },
            { from: 101, to: 150, price: 50, label: '101-150' },
            { from: 151, to: 200, price: 75, label: '151-200' },
            { from: 201, to: 250, price: 105, label: '201-250' },
            { from: 251, to: 300, price: 140, label: '251-300' }
          ]
        };
      } else {
        // Power Leveling normal Diablo 4 (1-60)
        return {
          min: 1,
          max: 60,
          label: 'Power Leveling',
          description: 'Niveles normales (1-60)',
          priceRanges: [
            { from: 1, to: 20, price: 12, label: '1-20' },
            { from: 21, to: 40, price: 22, label: '21-40' },
            { from: 41, to: 60, price: 32, label: '41-60' }
          ]
        };
      }
    }
    
    // ============================================
    // DIABLO 3
    // ============================================
    if (isDiablo3) {
      if (isParagon) {
        return {
          min: 1,
          max: 1200,
          label: 'Paragon',
          description: 'Niveles de Paragon (1-1200)',
          priceRanges: [
            { from: 1, to: 200, price: 20, label: '1-200' },
            { from: 201, to: 400, price: 45, label: '201-400' },
            { from: 401, to: 600, price: 75, label: '401-600' },
            { from: 601, to: 800, price: 110, label: '601-800' },
            { from: 801, to: 1000, price: 150, label: '801-1000' },
            { from: 1001, to: 1200, price: 195, label: '1001-1200' }
          ]
        };
      } else {
        // Power Leveling normal Diablo 3 (1-60)
        return {
          min: 1,
          max: 60,
          label: 'Power Leveling',
          description: 'Niveles normales (1-60)',
          priceRanges: [
            { from: 1, to: 20, price: 10, label: '1-20' },
            { from: 21, to: 40, price: 18, label: '21-40' },
            { from: 41, to: 60, price: 25, label: '41-60' }
          ]
        };
      }
    }
    
    // ============================================
    // DIABLO 2 RESURRECTED
    // ============================================
    if (isDiablo2) {
      return {
        min: 1,
        max: 99,
        label: 'Power Leveling',
        description: 'Niveles (1-99)',
        priceRanges: [
          { from: 1, to: 30, price: 15, label: '1-30' },
          { from: 31, to: 60, price: 35, label: '31-60' },
          { from: 61, to: 80, price: 60, label: '61-80' },
          { from: 81, to: 90, price: 90, label: '81-90' },
          { from: 91, to: 95, price: 120, label: '91-95' },
          { from: 96, to: 99, price: 150, label: '96-99' }
        ]
      };
    }
    
    // ============================================
    // LAST EPOCH
    // ============================================
    if (isLastEpoch) {
      return {
        min: 1,
        max: 100,
        label: 'Power Leveling',
        description: 'Niveles (1-100)',
        priceRanges: [
          { from: 1, to: 25, price: 12, label: '1-25' },
          { from: 26, to: 50, price: 22, label: '26-50' },
          { from: 51, to: 75, price: 32, label: '51-75' },
          { from: 76, to: 100, price: 42, label: '76-100' }
        ]
      };
    }
    
    // ============================================
    // PATH OF EXILE
    // ============================================
    if (isPathOfExile) {
      return {
        min: 1,
        max: 100,
        label: 'Power Leveling',
        description: 'Niveles (1-100)',
        priceRanges: [
          { from: 1, to: 30, price: 20, label: '1-30' },
          { from: 31, to: 60, price: 40, label: '31-60' },
          { from: 61, to: 80, price: 65, label: '61-80' },
          { from: 81, to: 90, price: 95, label: '81-90' },
          { from: 91, to: 95, price: 125, label: '91-95' },
          { from: 96, to: 100, price: 160, label: '96-100' }
        ]
      };
    }
    
    // ============================================
    // WORLD OF WARCRAFT
    // ============================================
    if (isWoW) {
      const isClassic = game === 'World of Warcraft Classic';
      return {
        min: 1,
        max: isClassic ? 60 : 70,
        label: 'Power Leveling',
        description: `Niveles (1-${isClassic ? 60 : 70})`,
        priceRanges: isClassic ? [
          { from: 1, to: 20, price: 18, label: '1-20' },
          { from: 21, to: 40, price: 35, label: '21-40' },
          { from: 41, to: 60, price: 52, label: '41-60' }
        ] : [
          { from: 1, to: 20, price: 20, label: '1-20' },
          { from: 21, to: 40, price: 40, label: '21-40' },
          { from: 41, to: 60, price: 60, label: '41-60' },
          { from: 61, to: 70, price: 80, label: '61-70' }
        ]
      };
    }
    
    // ============================================
    // CONFIGURACIÓN POR DEFECTO
    // ============================================
    return {
      min: 1,
      max: 100,
      label: 'Power Leveling',
      description: 'Niveles',
      priceRanges: [
        { from: 1, to: 30, price: 15, label: '1-30' },
        { from: 31, to: 60, price: 30, label: '31-60' },
        { from: 61, to: 100, price: 45, label: '61-100' }
      ]
    };
  };

  const config = getConfig();
  
  const [fromLevel, setFromLevel] = useState(config.min);
  const [toLevel, setToLevel] = useState(config.max);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [selectedRange, setSelectedRange] = useState(null);

  // Función para calcular precio basado en rangos
  const calculatePriceForRange = (from, to) => {
    if (from >= to) return 0;
    
    let totalPrice = 0;
    let currentFrom = from;
    
    // Ordenar rangos por 'from'
    const sortedRanges = [...config.priceRanges].sort((a, b) => a.from - b.from);
    
    while (currentFrom < to) {
      // Encontrar el rango que contiene currentFrom
      const currentRange = sortedRanges.find(range => 
        currentFrom >= range.from && currentFrom <= range.to
      );
      
      if (!currentRange) {
        // Si no encuentra rango, buscar el siguiente rango
        const nextRange = sortedRanges.find(range => range.from > currentFrom);
        if (nextRange) {
          currentFrom = nextRange.from;
          continue;
        } else {
          break;
        }
      }
      
      // Calcular hasta dónde llega en este rango
      const rangeEnd = Math.min(to, currentRange.to);
      const levelsInRange = rangeEnd - currentFrom + 1;
      const rangeTotalLevels = currentRange.to - currentRange.from + 1;
      const rangePrice = currentRange.price;
      
      // Precio proporcional dentro del rango
      const priceForThisPortion = (levelsInRange / rangeTotalLevels) * rangePrice;
      totalPrice += priceForThisPortion;
      
      currentFrom = rangeEnd + 1;
    }
    
    // Redondear a 2 decimales
    return Math.round(totalPrice * 100) / 100;
  };

  // Calcular precio total para 1-max
  const getTotalPrice = () => {
    return calculatePriceForRange(config.min, config.max);
  };

  // Actualizar precio cuando cambian los niveles
  useEffect(() => {
    const price = calculatePriceForRange(fromLevel, toLevel);
    setCalculatedPrice(price);
  }, [fromLevel, toLevel]);

  // Seleccionar rango predefinido
  const handleRangeSelect = (range) => {
    setFromLevel(range.from);
    setToLevel(range.to);
    setSelectedRange(`${range.from}-${range.to}`);
  };

  const handleApply = () => {
    onApply({
      fromLevel,
      toLevel,
      calculatedPrice,
      description: `${config.label} de nivel ${fromLevel} a ${toLevel}`
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                Calculadora de Precios
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {game} - {config.label}
                {isParagon && (
                  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    Paragon
                  </span>
                )}
                {isVariable && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Precio Dinámico
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {config.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
            >
              ×
            </button>
          </div>

          {isVariable && (
            <div className="mb-6 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800 flex items-start">
                <span className="mr-2 text-lg">📊</span>
                <span>
                  <strong>Servicio Variable Leveling:</strong> El precio se calcula automáticamente según los niveles seleccionados. Los clientes podrán elegir exactamente cuántos niveles quieren subir.
                </span>
              </p>
            </div>
          )}

          {/* Tabla de precios por rangos */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Precios por rangos:</h4>
            <div className="space-y-2">
              {config.priceRanges.map((range, index) => {
                // Calcular precio acumulado hasta este rango
                const accumulatedPrice = config.priceRanges
                  .slice(0, index + 1)
                  .reduce((sum, r) => sum + r.price, 0);
                
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Niveles {range.label}:
                    </span>
                    <div className="text-right">
                      <span className="font-medium text-blue-600">${range.price}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        (Acum: ${accumulatedPrice})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm font-bold">
                <span>Total {config.min}-{config.max}:</span>
                <span className="text-green-600">${getTotalPrice()}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              * Los precios son acumulativos. Rangos personalizados se calculan proporcionalmente.
            </p>
          </div>

          {/* Rangos rápidos */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ⚡ Rangos Rápidos
            </label>
            <div className="grid grid-cols-2 gap-2">
              {config.priceRanges.map((range, index) => {
                const isSelected = selectedRange === `${range.from}-${range.to}`;
                return (
                  <button
                    key={index}
                    onClick={() => handleRangeSelect(range)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800">{range.label}</div>
                    <div className="text-lg font-bold text-blue-600">${range.price}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector personalizado */}
          <div className="space-y-4 mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              🎯 Rango Personalizado
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desde nivel: {fromLevel}
              </label>
              <input
                type="range"
                min={config.min}
                max={config.max}
                value={fromLevel}
                onChange={(e) => {
                  const newFrom = parseInt(e.target.value);
                  setFromLevel(newFrom);
                  setSelectedRange(null);
                  if (newFrom >= toLevel) {
                    setToLevel(Math.min(newFrom + 10, config.max));
                  }
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{config.min}</span>
                <span>{config.max}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasta nivel: {toLevel}
              </label>
              <input
                type="range"
                min={fromLevel + 1}
                max={config.max}
                value={toLevel}
                onChange={(e) => {
                  setToLevel(parseInt(e.target.value));
                  setSelectedRange(null);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{fromLevel + 1}</span>
                <span>{config.max}</span>
              </div>
            </div>

            {/* Resultado */}
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Niveles a subir:</p>
                  <p className="text-2xl font-bold text-gray-800">{toLevel - fromLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Precio calculado:</p>
                  <p className="text-3xl font-bold text-blue-600">${calculatedPrice}</p>
                </div>
              </div>
              {selectedRange && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Rango predefinido seleccionado
                </p>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-yellow-50 p-3 rounded-lg mb-6">
            <p className="text-xs text-yellow-700 flex items-center">
              <span className="mr-2">ℹ️</span>
              El precio se calcula de forma progresiva: rangos más altos tienen mayor costo por nivel.
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">💰</span>
              Ver Precio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCalculatorModal;