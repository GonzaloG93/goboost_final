// frontend/src/components/order/PowerlevelingOptions.jsx
import React from 'react';
import { formatPrice } from '../../config/buildsConfig';

const PowerlevelingOptions = ({ 
  service,
  currentPrice,
  formData, 
  handleChange, 
  setFormData,           // ✅ Recibido como prop
  maxLevel, 
  addBuildToLeveling, 
  setAddBuildToLeveling, 
  selectedLevelingBuildTier, 
  setSelectedLevelingBuildTier, 
  getAvailableBuildsForLeveling,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const availableBuilds = getAvailableBuildsForLeveling();
  const buildAddonPrice = availableBuilds?.prices?.starter || 30;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-blue-200 shadow-lg">
      <h3 className="text-xl font-bold text-blue-900 mb-5 flex items-center">
        <span className="mr-2 text-2xl">📈</span> Power Leveling Configuration
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Current Level</label>
          <input 
            type="number" 
            name="currentLevel" 
            value={formData.currentLevel} 
            onChange={handleChange}
            onBlur={() => { 
              if (formData.currentLevel === '' || isNaN(formData.currentLevel)) 
                setFormData(prev => ({ ...prev, currentLevel: 1 })); 
            }}
            onFocus={(e) => e.target.select()} 
            inputMode="numeric" 
            pattern="[0-9]*" 
            min="1" 
            max={maxLevel - 1} 
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-lg" 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Desired Level</label>
          <input 
            type="number" 
            name="desiredLevel" 
            value={formData.desiredLevel} 
            onChange={handleChange}
            onBlur={() => { 
              if (formData.desiredLevel === '' || isNaN(formData.desiredLevel)) { 
                const defaultDesired = Math.min(maxLevel, (Number(formData.currentLevel) || 1) + 9); 
                setFormData(prev => ({ ...prev, desiredLevel: defaultDesired })); 
              } 
            }}
            onFocus={(e) => e.target.select()} 
            inputMode="numeric" 
            pattern="[0-9]*" 
            min={(Number(formData.currentLevel) || 1) + 1} 
            max={maxLevel} 
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-lg" 
          />
        </div>
      </div>

      {availableBuilds && (
        <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
          <div className="flex items-start gap-4">
            <div className="mt-1">
              <input 
                type="checkbox" 
                checked={addBuildToLeveling} 
                onChange={(e) => { 
                  setAddBuildToLeveling(e.target.checked); 
                  if (e.target.checked) setSelectedLevelingBuildTier('starter'); 
                }}
                className="h-5 w-5 text-green-600 rounded cursor-pointer" 
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h4 className="text-lg font-bold text-green-900 flex items-center gap-2">
                  <span>⚙️</span> Add Starter Build
                </h4>
                <span className="text-xl font-bold text-blue-600">+${formatPrice(buildAddonPrice)}</span>
              </div>
              <p className="text-sm text-gray-600">Includes basic build optimization with starter gear and skill setup.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {addBuildToLeveling && availableBuilds && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Build Add-on:</span>
              <span className="text-lg font-semibold text-green-700">
                +${formatPrice(buildAddonPrice)} (Starter Build)
              </span>
            </div>
          </div>
        )}

        <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl border border-blue-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-gray-800 font-bold">Total Price:</span>
            <span className="text-2xl font-black text-blue-700">${formatPrice(currentPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerlevelingOptions;