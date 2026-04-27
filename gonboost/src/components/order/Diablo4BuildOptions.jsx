// frontend/src/pages/Order/components/Diablo4BuildOptions.jsx
import React from 'react';
import { DIABLO_4_BUILDS, formatPrice } from '../../config/buildsConfig';

const Diablo4BuildOptions = ({ 
  service,
  currentPrice,
  selectedBuilds, 
  setSelectedBuilds,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const baseBuildKey = service.serviceType;
  const baseBuildConfig = DIABLO_4_BUILDS[baseBuildKey];
  const buildTiers = ['builds_starter', 'builds_ancestral', 'builds_mythic', 'builds_tormented'];
  const baseIndex = buildTiers.indexOf(baseBuildKey);
  const selectedTiers = buildTiers.filter(tier => selectedBuilds[tier]);
  const finalBuildKey = selectedTiers.length > 0 ? selectedTiers[selectedTiers.length - 1] : baseBuildKey;
  const finalBuildConfig = DIABLO_4_BUILDS[finalBuildKey];
  
  if (!baseBuildConfig) return null;

  const handleBuildCheckbox = (buildKey, checked) => {
    const clickedIndex = buildTiers.indexOf(buildKey);

    if (clickedIndex < baseIndex && !checked) return;

    if (checked && clickedIndex > baseIndex) {
      for (let i = baseIndex + 1; i < clickedIndex; i++) {
        if (!selectedBuilds[buildTiers[i]]) {
          alert(`You must select ${DIABLO_4_BUILDS[buildTiers[i]].name} first`);
          return;
        }
      }
    }

    setSelectedBuilds(prev => {
      const newState = { ...prev, [buildKey]: checked };
      if (!checked) {
        for (let i = clickedIndex + 1; i < buildTiers.length; i++) {
          newState[buildTiers[i]] = false;
        }
      }
      return newState;
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-purple-200 shadow-lg">
        <h3 className="text-xl font-bold text-purple-900 mb-5 flex items-center">
          <span className="mr-2 text-2xl">⚙️</span> Build Configuration - Select Your Upgrades
        </h3>

        <div className="p-4 md:p-5 bg-white rounded-xl border-2 border-purple-300 shadow-md mb-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <input type="checkbox" checked={true} disabled={true} className="h-5 w-5 text-purple-600 rounded" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h4 className="text-xl font-bold text-purple-900">{baseBuildConfig.name} (Base)</h4>
                <span className="text-2xl font-black text-blue-600">${formatPrice(baseBuildConfig.price)}</span>
              </div>
              <p className="text-gray-600 text-sm mb-2">{baseBuildConfig.description}</p>
              <div>
                <h5 className="font-semibold text-gray-700 text-sm mb-2">Includes:</h5>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {baseBuildConfig.features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {buildTiers.map((buildKey, index) => {
          if (index <= baseIndex) return null;
          const buildConfig = DIABLO_4_BUILDS[buildKey];
          const previousTier = buildTiers[index - 1];
          const previousPrice = DIABLO_4_BUILDS[previousTier]?.price || 0;
          const upgradeAmount = (buildConfig?.price || 0) - previousPrice;
          const isSelected = selectedBuilds[buildKey];
          const isDisabled = !selectedBuilds[previousTier];
          if (!buildConfig) return null;

          return (
            <div 
              key={buildKey} 
              className={`p-4 md:p-5 rounded-xl border-2 transition-all mb-4 ${
                isSelected 
                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                  : isDisabled 
                    ? 'border-gray-200 bg-gray-50 opacity-60' 
                    : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    disabled={isDisabled} 
                    onChange={(e) => handleBuildCheckbox(buildKey, e.target.checked)} 
                    className={`h-5 w-5 rounded text-purple-600 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">{buildConfig.name}</h4>
                      <p className="text-xs text-gray-500">Upgrade from {DIABLO_4_BUILDS[previousTier]?.name}</p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xl font-bold text-blue-600">+${formatPrice(upgradeAmount)}</span>
                      <p className="text-xs text-gray-400">Total: ${formatPrice(buildConfig.price)}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-3 pt-2 border-t border-purple-200">
                      <h5 className="font-semibold text-purple-800 text-sm mb-2">All features:</h5>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {buildConfig.features.map((feature, i) => (
                          <li key={i} className="text-sm text-purple-700 flex items-start">
                            <span className="text-purple-500 mr-2 flex-shrink-0">✓</span>
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

        {selectedTiers.length > baseIndex + 1 && finalBuildConfig && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <h5 className="font-semibold text-green-800 mb-2">Your Build Selection:</h5>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTiers.map((tier, idx) => (
                <span key={tier} className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {idx > baseIndex ? '⬆️' : '✅'} {DIABLO_4_BUILDS[tier]?.name}
                </span>
              ))}
            </div>
            <p className="text-sm text-green-700 font-semibold">
              Final Build: <strong>{finalBuildConfig.name}</strong> - ${formatPrice(finalBuildConfig.price)}
            </p>
          </div>
        )}

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Build Specifications</label>
          <textarea 
            value={buildSpecifications} 
            onChange={(e) => setBuildSpecifications(e.target.value)} 
            rows="4" 
            className="w-full p-3 border rounded-lg resize-none" 
            placeholder="Describe the specific build you want (class, skills, playstyle, etc.)..." 
          />
        </div>
      </div>
    </div>
  );
};

export default Diablo4BuildOptions;