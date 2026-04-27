// frontend/src/pages/Order/components/DuneLevelingOptions.jsx
import React from 'react';

const DuneLevelingOptions = ({ 
  service,
  currentPrice,
  formData, 
  handleChange, 
  addClassUnlock, 
  setAddClassUnlock, 
  maxLevel,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 md:p-6 border border-amber-200 shadow-lg">
        <h3 className="text-xl font-bold text-amber-900 mb-5 flex items-center gap-2">
          <span className="text-2xl">📈</span> Dune: Awakening - Power Leveling
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Current Level</label>
            <input 
              type="number" 
              name="currentLevel" 
              value={formData.currentLevel} 
              onChange={handleChange}
              min="1" 
              max={maxLevel - 1} 
              className="w-full p-4 border rounded-xl bg-white text-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Desired Level</label>
            <input 
              type="number" 
              name="desiredLevel" 
              value={formData.desiredLevel} 
              onChange={handleChange}
              min="2" 
              max={maxLevel} 
              className="w-full p-4 border rounded-xl bg-white text-lg" 
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">➕</span> Optional Add-ons
        </h4>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer">
            <input 
              type="checkbox" 
              checked={addClassUnlock} 
              onChange={(e) => setAddClassUnlock(e.target.checked)}
              className="h-5 w-5 text-amber-600 rounded" 
            />
            <div className="flex-1">
              <span className="font-semibold text-gray-800">🎮 Class Unlock</span>
              <p className="text-xs text-gray-500">Unlock any class during leveling</p>
            </div>
            <span className="font-bold text-amber-700">+$35.00</span>
          </label>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 border border-amber-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <span className="text-gray-800 font-bold">Total Price:</span>
          <span className="text-2xl font-black text-amber-700">${currentPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Class & Build Preferences <span className="text-red-500">*</span>
        </label>
        <textarea 
          value={buildSpecifications} 
          onChange={(e) => setBuildSpecifications(e.target.value)} 
          rows="3" 
          className={`w-full p-3 border rounded-lg resize-none bg-white ${!buildSpecifications.trim() ? 'border-red-300' : 'border-gray-300'}`}
          placeholder="Specify which class you want to level, preferred build, etc." 
          required 
        />
      </div>
    </div>
  );
};

export default DuneLevelingOptions;