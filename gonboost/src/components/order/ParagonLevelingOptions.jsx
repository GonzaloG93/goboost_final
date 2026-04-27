import React from 'react';
import { DIABLO_4_BUILDS, POE2_BUILDS, formatPrice } from '../../config/buildsConfig';

const ParagonLevelingOptions = ({ 
  service,
  currentPrice,
  formData, 
  handleChange, 
  setFormData, 
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
  
  if (!availableBuilds) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 md:p-6 border border-purple-200 shadow-lg">
        <h3 className="text-xl font-bold text-purple-900 mb-5 flex items-center">
          <span className="mr-2 text-2xl">📊</span> Paragon Leveling Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Current Paragon Level</label>
            <input 
              type="number" 
              name="currentLevel" 
              value={formData.currentLevel} 
              onChange={handleChange}
              onBlur={() => { if (formData.currentLevel === '' || isNaN(formData.currentLevel)) setFormData(prev => ({ ...prev, currentLevel: 1 })); }}
              onFocus={(e) => e.target.select()} 
              inputMode="numeric" 
              pattern="[0-9]*" 
              min="1" 
              max={maxLevel - 1} 
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-purple-500 bg-white text-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Desired Paragon Level</label>
            <input 
              type="number" 
              name="desiredLevel" 
              value={formData.desiredLevel} 
              onChange={handleChange}
              onBlur={() => { if (formData.desiredLevel === '' || isNaN(formData.desiredLevel)) { const defaultDesired = Math.min(maxLevel, (Number(formData.currentLevel) || 1) + 49); setFormData(prev => ({ ...prev, desiredLevel: defaultDesired })); } }}
              onFocus={(e) => e.target.select()} 
              inputMode="numeric" 
              pattern="[0-9]*" 
              min={(Number(formData.currentLevel) || 1) + 1} 
              max={maxLevel} 
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-purple-500 bg-white text-lg" 
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border border-purple-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <span className="text-gray-800 font-bold">Total Price:</span>
              <span className="text-2xl font-black text-purple-700">${formatPrice(currentPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const builds = availableBuilds.builds;
  const isBuildAvailableForLevel = (buildKey) => {
    if (!service) return true;
    const game = service.game;
    const desiredLevel = Number(formData.desiredLevel) || 1;

    if (game === 'Diablo 4') {
      const build = DIABLO_4_BUILDS[buildKey];
      if (build?.requiresLevel && desiredLevel < build.requiresLevel) return false;
    }
    if (game === 'Path of Exile 2') {
      const build = POE2_BUILDS[buildKey];
      if (build?.requiresLevel && desiredLevel < build.requiresLevel) return false;
    }
    return true;
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 md:p-6 border border-purple-200 shadow-lg">
      <h3 className="text-xl font-bold text-purple-900 mb-5 flex items-center">
        <span className="mr-2 text-2xl">📊</span> Paragon Leveling Configuration
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Current Paragon Level</label>
          <input 
            type="number" 
            name="currentLevel" 
            value={formData.currentLevel} 
            onChange={handleChange}
            onBlur={() => { if (formData.currentLevel === '' || isNaN(formData.currentLevel)) setFormData(prev => ({ ...prev, currentLevel: 1 })); }}
            onFocus={(e) => e.target.select()} 
            inputMode="numeric" 
            pattern="[0-9]*" 
            min="1" 
            max={maxLevel - 1} 
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-purple-500 bg-white text-lg" 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Desired Paragon Level</label>
          <input 
            type="number" 
            name="desiredLevel" 
            value={formData.desiredLevel} 
            onChange={handleChange}
            onBlur={() => { if (formData.desiredLevel === '' || isNaN(formData.desiredLevel)) { const defaultDesired = Math.min(maxLevel, (Number(formData.currentLevel) || 1) + 49); setFormData(prev => ({ ...prev, desiredLevel: defaultDesired })); } }}
            onFocus={(e) => e.target.select()} 
            inputMode="numeric" 
            pattern="[0-9]*" 
            min={(Number(formData.currentLevel) || 1) + 1} 
            max={maxLevel} 
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-purple-500 bg-white text-lg" 
          />
        </div>
      </div>

      <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <input 
              type="checkbox" 
              checked={addBuildToLeveling} 
              onChange={(e) => setAddBuildToLeveling(e.target.checked)}
              className="h-5 w-5 text-purple-600 rounded cursor-pointer" 
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h4 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                <span>⚙️</span> Add Optimized Build (Optional)
              </h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Select a build tier to complement your paragon leveling service.</p>

            {addBuildToLeveling && (
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Select Build Tier:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(availableBuilds.prices).map(([tier, price]) => {
                    const buildKey = service.game === 'Diablo 4' ? `builds_${tier}` : `poe2_build_${tier}`;
                    const buildConfig = builds[buildKey];
                    const isAvailable = isBuildAvailableForLevel(buildKey);
                    const requiresLevel = buildConfig?.requiresLevel;
                    const desiredLevel = Number(formData.desiredLevel) || 1;

                    return (
                      <button 
                        key={tier} 
                        type="button" 
                        disabled={!isAvailable} 
                        onClick={() => setSelectedLevelingBuildTier(tier)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          !isAvailable 
                            ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed' 
                            : selectedLevelingBuildTier === tier 
                              ? 'border-purple-500 bg-purple-50 shadow-md' 
                              : 'border-gray-200 bg-white hover:border-purple-300'
                        }`}
                      >
                        <div className="font-bold text-gray-800 capitalize">{tier}</div>
                        <div className="text-xl font-bold text-blue-600">+${formatPrice(price)}</div>
                        {!isAvailable && requiresLevel && (
                          <p className="text-xs text-amber-600 mt-2">
                            ⚠️ Requires Level {requiresLevel}+
                            <br />(Current desired: {desiredLevel})
                          </p>
                        )}
                        {isAvailable && <p className="text-xs text-green-600 mt-1">✓ Available</p>}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Build Specifications (Optional)</label>
                  <textarea 
                    value={buildSpecifications} 
                    onChange={(e) => setBuildSpecifications(e.target.value)} 
                    rows="3"
                    className="w-full p-3 border rounded-lg resize-none" 
                    placeholder="Specify class, preferred playstyle, etc." 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {addBuildToLeveling && (
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Build Add-on:</span>
              <span className="text-lg font-semibold text-purple-700">
                +${formatPrice(availableBuilds.prices[selectedLevelingBuildTier] || 0)} ({selectedLevelingBuildTier})
              </span>
            </div>
          </div>
        )}

        <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border border-purple-300">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-gray-800 font-bold">Total Price:</span>
            <span className="text-2xl font-black text-purple-700">${formatPrice(currentPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParagonLevelingOptions;