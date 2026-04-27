// frontend/src/pages/Order/components/DuneBaseOptions.jsx
import React from 'react';

const DuneBaseOptions = ({ 
  service,
  currentPrice,
  selectedDuneBaseSize, 
  setSelectedDuneBaseSize, 
  addDefenses, 
  setAddDefenses, 
  addAutomation, 
  setAddAutomation, 
  addResources, 
  setAddResources, 
  addClassUnlock, 
  setAddClassUnlock, 
  selectedDuneClass, 
  setSelectedDuneClass,
  baseSizes,
  availableAddons,
  selectedBaseConfig,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const calculateTotal = () => {
    let total = selectedBaseConfig?.price || service?.basePrice || 20;
    if (addDefenses) total += 35;
    if (addAutomation) total += 45;
    if (addResources) total += 20;
    if (addClassUnlock) total += 35;
    return total;
  };

  const getGridCols = (features) => {
    if (!features) return 'grid-cols-1';
    if (features.length <= 5) return 'grid-cols-1';
    if (features.length <= 10) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  const getAddonState = (key) => {
    switch(key) {
      case 'defenses': return addDefenses;
      case 'automation': return addAutomation;
      case 'resources': return addResources;
      case 'class_unlock': return addClassUnlock;
      default: return false;
    }
  };

  const getAddonSetter = (key) => {
    switch(key) {
      case 'defenses': return setAddDefenses;
      case 'automation': return setAddAutomation;
      case 'resources': return setAddResources;
      case 'class_unlock': return setAddClassUnlock;
      default: return () => {};
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 md:p-6 border border-emerald-200 shadow-lg">
        <h3 className="text-xl font-bold text-emerald-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">🏗️</span> Base Construction Service
        </h3>
        <p className="text-gray-700 mb-4">
          We build and optimize your base in Arrakis. Select the size that fits your needs.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">📏</span> Choose Base Size
        </h4>

        <div className="space-y-3">
          {baseSizes.map((size) => (
            <label 
              key={size.key}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedDuneBaseSize === size.key 
                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-emerald-300'
              }`}
            >
              <input 
                type="radio" 
                name="duneBaseSize" 
                value={size.key}
                checked={selectedDuneBaseSize === size.key}
                onChange={() => setSelectedDuneBaseSize(size.key)}
                className="mt-1 h-5 w-5 text-emerald-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{size.icon}</span>
                  <span className="font-bold text-gray-800 text-lg">{size.name}</span>
                </div>
                <p className="text-sm text-gray-600">{size.description}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-emerald-700">
                  +${size.price}.00
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
        <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
          <span className="text-xl">➕</span> Additional Upgrades (Optional)
        </h4>

        <div className="space-y-3">
          {availableAddons.map((addon) => (
            <label 
              key={addon.key}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-amber-200 cursor-pointer hover:shadow-md transition-all"
            >
              <input 
                type="checkbox" 
                checked={getAddonState(addon.key)}
                onChange={(e) => getAddonSetter(addon.key)(e.target.checked)}
                className="h-5 w-5 text-amber-600 rounded"
              />
              <div className="flex-1">
                <span className="font-semibold text-gray-800">{addon.icon} {addon.name}</span>
                <p className="text-xs text-gray-500">{addon.description}</p>
              </div>
              <span className="font-bold text-amber-700">+${addon.price}.00</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">📦</span> What's Included in {selectedBaseConfig?.name || 'Base'}
        </h4>

        <div className={`grid ${getGridCols(selectedBaseConfig?.features)} gap-2`}>
          {selectedBaseConfig?.features?.map((feature, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 rounded-xl border border-emerald-100"
            >
              <span className="text-emerald-500 text-lg mt-0.5 flex-shrink-0">✓</span>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 p-5 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <span className="text-gray-800 font-bold text-lg">Total Price:</span>
              <p className="text-xs text-gray-600 mt-1">
                Base: ${selectedBaseConfig?.price || 20}.00
                {addDefenses && ' + Defenses ($35)'}
                {addAutomation && ' + Automation ($45)'}
                {addResources && ' + Resources ($20)'}
                {addClassUnlock && ' + Class ($35)'}
              </p>
            </div>
            <span className="text-3xl font-black text-emerald-700">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Special Instructions <span className="text-red-500">*</span>
        </label>
        <textarea 
          value={buildSpecifications} 
          onChange={(e) => setBuildSpecifications(e.target.value)} 
          rows="3" 
          className={`w-full p-3 border rounded-lg resize-none bg-white ${!buildSpecifications.trim() ? 'border-red-300' : 'border-gray-300'}`}
          placeholder="Please specify: Class, preferred base location, layout preferences, etc."
          required
        />
        {!buildSpecifications.trim() && (
          <p className="text-red-500 text-xs mt-1">This field is required</p>
        )}
      </div>
    </div>
  );
};

export default DuneBaseOptions;