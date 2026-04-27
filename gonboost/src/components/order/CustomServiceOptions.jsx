import React from 'react';
import { formatPrice } from '../../config/buildsConfig';

const CustomServiceOptions = ({ 
  service,
  currentPrice,
  formData, 
  handleChange, 
  isVariablePriceService, 
  hasPriceOptions,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const isVariablePrice = isVariablePriceService();
  const hasOptions = hasPriceOptions();
  const suggestedPrice = service.basePrice || 0;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-purple-200 shadow-lg">
        <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🛠️</span> {service.name || 'Custom Service'}
        </h3>
        
        <div className="bg-white rounded-xl p-5 mb-4">
          {service.description && (
            <p className="text-gray-700 mb-4">{service.description}</p>
          )}
          
          {service.features && service.features.length > 0 && (
            <>
              <h4 className="font-semibold text-gray-800 mb-3">What's Included:</h4>
              <ul className="space-y-2 mb-4">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                    <span>{typeof feature === 'string' ? feature : feature.name || feature.description}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          
          {hasOptions && (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Option
              </label>
              <div className="space-y-2">
                {service.priceOptions.map((option, i) => (
                  <label 
                    key={i} 
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      formData.selectedOption === option.name 
                        ? 'border-purple-500 bg-purple-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priceOption"
                      value={option.name}
                      checked={formData.selectedOption === option.name}
                      onChange={() => {
                        setFormData(prev => ({ 
                          ...prev, 
                          customPrice: option.price,
                          selectedOption: option.name 
                        }));
                      }}
                      className="h-4 w-4 text-purple-600"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{option.name}</span>
                      {option.description && (
                        <p className="text-xs text-gray-500">{option.description}</p>
                      )}
                    </div>
                    <span className="font-bold text-blue-600">${formatPrice(option.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          {isVariablePrice && !hasOptions && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Offer Price ($)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">$</span>
                <input
                  type="number"
                  name="customPrice"
                  value={formData.customPrice || suggestedPrice || 0}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg text-lg"
                  min="0"
                  step="0.01"
                  placeholder="Enter your offer"
                />
              </div>
              {suggestedPrice > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Suggested price: ${formatPrice(suggestedPrice)}
                </p>
              )}
            </div>
          )}

          {!isVariablePrice && !hasOptions && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Fixed Price:</span>
                <span className="text-2xl font-black text-blue-600">${formatPrice(suggestedPrice)}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Special Requirements / Notes
          </label>
          <textarea 
            value={buildSpecifications} 
            onChange={(e) => setBuildSpecifications(e.target.value)} 
            rows="4" 
            className="w-full p-3 border rounded-lg resize-none bg-white"
            placeholder="Please describe your specific requirements, timeline, budget, etc."
          />
        </div>
      </div>
    </div>
  );
};

export default CustomServiceOptions;