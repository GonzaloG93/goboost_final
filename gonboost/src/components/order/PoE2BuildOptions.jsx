// frontend/src/components/PoE2BuildOptions.jsx

import React from 'react';
import { POE2_BUILDS, formatPrice } from '../../config/buildsConfig';

const PoE2BuildOptions = ({ 
  service,
  currentPrice,
  selectedPoE2Builds, 
  setSelectedPoE2Builds,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const baseBuildKey = service?.serviceType || 'poe2_build_starter';
  const baseBuildConfig = POE2_BUILDS[baseBuildKey] || POE2_BUILDS['poe2_build_starter'];
  
  const buildTiers = ['poe2_build_starter', 'poe2_build_advanced', 'poe2_build_endgame'];
  const baseIndex = buildTiers.indexOf(baseBuildConfig.id);
  
  const selectedTiers = buildTiers.filter(tier => selectedPoE2Builds[tier.replace('poe2_build_', '')]);
  const finalBuildKey = selectedTiers.length > 0 ? selectedTiers[selectedTiers.length - 1] : baseBuildConfig.id;
  const finalBuildConfig = POE2_BUILDS[finalBuildKey] || baseBuildConfig;

  const handleBuildCheckbox = (buildKey, checked) => {
    const clickedIndex = buildTiers.indexOf(buildKey);
    const shortKey = buildKey.replace('poe2_build_', '');

    if (clickedIndex <= baseIndex && !checked) return;

    if (checked && clickedIndex > baseIndex) {
      for (let i = baseIndex + 1; i < clickedIndex; i++) {
        const tierKey = buildTiers[i];
        const tierShortKey = tierKey.replace('poe2_build_', '');
        if (!selectedPoE2Builds[tierShortKey]) {
          alert(`You must select ${POE2_BUILDS[tierKey]?.name || 'the previous tier'} first`);
          return;
        }
      }
    }

    setSelectedPoE2Builds(prev => {
      const newState = { ...prev, [shortKey]: checked };
      if (!checked) {
        for (let i = clickedIndex + 1; i < buildTiers.length; i++) {
          newState[buildTiers[i].replace('poe2_build_', '')] = false;
        }
      }
      return newState;
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 md:p-6 border border-emerald-200 shadow-lg">
        <h3 className="text-xl font-bold text-emerald-900 mb-5 flex items-center">
          <span className="mr-2 text-2xl">🍃</span> Path of Exile 2 - Build Configuration
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Select your desired build tier. Upgrades build sequentially upon your base selection.
        </p>

        {/* Base Tier Display */}
        <div className="p-4 md:p-5 bg-white rounded-xl border-2 border-emerald-300 shadow-md mb-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <input type="checkbox" checked={true} disabled={true} className="h-5 w-5 text-emerald-600 rounded cursor-not-allowed" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h4 className="text-xl font-bold text-emerald-900">{baseBuildConfig.name} (Base)</h4>
                <span className="text-2xl font-black text-emerald-700">${formatPrice(baseBuildConfig.price)}</span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{baseBuildConfig.description}</p>
              <div>
                <h5 className="font-semibold text-gray-700 text-sm mb-2">Includes:</h5>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {baseBuildConfig.features?.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-emerald-500 mr-2 flex-shrink-0">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Tiers */}
        {buildTiers.map((buildKey, index) => {
          if (index <= baseIndex) return null;

          const buildConfig = POE2_BUILDS[buildKey];
          const previousTier = buildTiers[index - 1];
          const upgradeAmount = POE2_BUILDS[previousTier]?.upgradePrice || (buildConfig.price - POE2_BUILDS[previousTier].price);
          const shortKey = buildKey.replace('poe2_build_', '');
          const isSelected = !!selectedPoE2Builds[shortKey];
          const isDisabled = !selectedPoE2Builds[previousTier?.replace('poe2_build_', '')];

          if (!buildConfig) return null;

          return (
            <div 
              key={buildKey} 
              className={`p-4 md:p-5 rounded-xl border-2 transition-all mb-4 ${
                isSelected 
                  ? 'border-emerald-500 bg-emerald-50/60 shadow-md' 
                  : isDisabled 
                    ? 'border-gray-200 bg-gray-50 opacity-60' 
                    : 'border-gray-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    disabled={isDisabled} 
                    onChange={(e) => handleBuildCheckbox(buildKey, e.target.checked)} 
                    className={`h-5 w-5 rounded text-emerald-600 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">{buildConfig.name}</h4>
                      <p className="text-xs text-gray-500">Upgrade from {POE2_BUILDS[previousTier]?.name}</p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xl font-bold text-emerald-700">+${formatPrice(upgradeAmount)}</span>
                      <p className="text-xs text-gray-400">Total Tier Price: ${formatPrice(buildConfig.price)}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-3 pt-2 border-t border-emerald-200">
                      <h5 className="font-semibold text-emerald-800 text-sm mb-2">Upgraded Features:</h5>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {buildConfig.features?.map((feature, i) => (
                          <li key={i} className="text-sm text-emerald-700 flex items-start">
                            <span className="text-emerald-500 mr-2 flex-shrink-0">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Selected Summary */}
        {selectedTiers.length > baseIndex + 1 && finalBuildConfig && (
          <div className="p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-300">
            <h5 className="font-semibold text-emerald-900 mb-2">Active Build Track:</h5>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTiers.map((tier, idx) => (
                <span key={tier} className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-200 text-emerald-900">
                  {idx > baseIndex ? '⬆️' : '✅'} {POE2_BUILDS[tier]?.name}
                </span>
              ))}
            </div>
            <p className="text-sm text-emerald-800 font-bold">
              Selected Configuration: {finalBuildConfig.name} (${formatPrice(currentPrice || finalBuildConfig.price)})
            </p>
          </div>
        )}

        {/* User Build Specifications */}
        <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Build Specifications (Optional)</label>
          <textarea 
            value={buildSpecifications} 
            onChange={(e) => setBuildSpecifications(e.target.value)} 
            rows="3" 
            className="w-full p-3 border rounded-lg resize-none bg-white border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 text-sm" 
            placeholder="Specify class, ascendancy, main skill preferences, or details..." 
          />
        </div>
      </div>
    </div>
  );
};

export default PoE2BuildOptions;