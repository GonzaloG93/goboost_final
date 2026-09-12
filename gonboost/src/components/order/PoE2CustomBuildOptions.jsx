import React from 'react';
import { CUSTOM_BUILD_CONFIG, formatPrice } from '../../config/buildsConfig';

const CATEGORY_LABELS = {
  'Early-game': { label: 'Early-game', icon: '🌱', desc: 'Campaign & early mapping gear' },
  'Mid-game': { label: 'Mid-game', icon: '⚔️', desc: 'T1-T10 mapping ready' },
  'End-game': { label: 'End-game', icon: '🏆', desc: 'T15+ mapping & early pinnacle bosses' },
  'Uber': { label: 'Uber', icon: '👑', desc: 'Uber pinnacle boss ready' }
};

const PoE2CustomBuildOptions = ({
  service,
  currentPrice,
  selectedCategory,
  setSelectedCategory,
  selectedLevelingOption,
  setSelectedLevelingOption,
  divineOrbCount,
  setDivineOrbCount,
  selectedAddons,
  setSelectedAddons,
  buildSpecifications,
  setBuildSpecifications
}) => {
  const categories = Object.keys(CUSTOM_BUILD_CONFIG.basePrices);

  const toggleAddon = (addonId) => {
    setSelectedAddons(prev => ({ ...prev, [addonId]: !prev[addonId] }));
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 md:p-6 border border-emerald-200 shadow-lg">
        <h3 className="text-xl font-bold text-emerald-900 mb-5 flex items-center">
          <span className="mr-2 text-2xl">🍃</span> Path of Exile 2 - Custom Build
        </h3>

        {/* Categoría */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Build Category</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const info = CATEGORY_LABELS[cat] || { label: cat, icon: '🎮', desc: '' };
              const isSelected = selectedCategory === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{info.icon}</div>
                  <div className="font-bold text-gray-800">{info.label}</div>
                  <div className="text-xs text-gray-500 mb-2">{info.desc}</div>
                  <div className="text-emerald-700 font-black">
                    ${formatPrice(CUSTOM_BUILD_CONFIG.basePrices[cat])}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Leveling */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Include Leveling</label>
          <div className="space-y-2">
            {CUSTOM_BUILD_CONFIG.levelingOptions.map((opt) => {
              const isSelected = selectedLevelingOption === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="levelingOption"
                      checked={isSelected}
                      onChange={() => setSelectedLevelingOption(opt.id)}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">
                    {opt.price > 0 ? `+$${formatPrice(opt.price)}` : 'Included'}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Divine Orbs */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Divine Orbs (${formatPrice(CUSTOM_BUILD_CONFIG.divineOrbPriceUnit)} each)
          </label>
          <div className="flex flex-wrap gap-2">
            {CUSTOM_BUILD_CONFIG.divineOrbOptions.map((opt) => {
              const isSelected = Number(divineOrbCount) === opt.count;
              return (
                <button
                  type="button"
                  key={opt.count}
                  onClick={() => setDivineOrbCount(opt.count)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
                  }`}
                >
                  {opt.count === 0 ? 'None' : `${opt.count} orbs`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Addons */}
        {CUSTOM_BUILD_CONFIG.addons.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Add-ons</label>
            <div className="space-y-2">
              {CUSTOM_BUILD_CONFIG.addons.map((addon) => (
                <label
                  key={addon.id}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedAddons[addon.id] ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!selectedAddons[addon.id]}
                      onChange={() => toggleAddon(addon.id)}
                      className="h-4 w-4 rounded text-emerald-600"
                    />
                    <span className="text-sm text-gray-700">{addon.name}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">+${formatPrice(addon.price)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl border border-emerald-300 mb-4">
          <p className="text-sm text-emerald-800 font-bold">
            Configured price: ${formatPrice(currentPrice)}
          </p>
        </div>

        {/* Build Specifications */}
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

export default PoE2CustomBuildOptions;
