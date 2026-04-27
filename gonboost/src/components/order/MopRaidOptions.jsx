import React, { useEffect } from 'react';
import { MOP_RAID_CONFIG } from '../../config/gamesConfig';

const MopRaidOptions = ({ 
  service, 
  currentPrice,
  mopRaidOption, 
  setMopRaidOption, 
  mopPriorityLoot, 
  setMopPriorityLoot, 
  mopExtraItems, 
  setMopExtraItems, 
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const raidConfig = MOP_RAID_CONFIG[service.serviceType];
  
  if (!raidConfig) return null;
  
  const selectedOption = raidConfig.options.find(opt => opt.value === mopRaidOption);
  const basePrice = selectedOption?.price || raidConfig.options[0]?.price || 0;
  
  const extraItemsPrice = raidConfig.extras.items3?.price || 
                          raidConfig.extras.items5?.price || 
                          raidConfig.extras.items2?.price || 0;
  const extraItemsLabel = raidConfig.extras.items3?.label || 
                          raidConfig.extras.items5?.label || 
                          raidConfig.extras.items2?.label || 'Extra Items';

  useEffect(() => {
    if (!mopRaidOption && raidConfig.options.length > 0) {
      setMopRaidOption(raidConfig.options[0].value);
    }
  }, [mopRaidOption, raidConfig.options, setMopRaidOption]);

  const calculateTotal = () => {
    let total = basePrice;
    if (mopPriorityLoot) total += raidConfig.extras.priority?.price || 0;
    if (mopExtraItems) total += extraItemsPrice;
    return total;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 md:p-6 border border-amber-200 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{raidConfig.icon}</span>
          <h3 className="text-xl md:text-2xl font-bold text-amber-900">
            {raidConfig.name} - MoP Classic Raid Boost
          </h3>
        </div>
        <p className="text-gray-700 mb-3">
          {raidConfig.description}
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1 bg-amber-100 px-3 py-1 rounded-full text-amber-800">
            <span>👥</span> {raidConfig.bosses} Bosses
          </span>
          <span className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full text-blue-800">
            <span>⏱️</span> Estimated: {raidConfig.estimatedTime}
          </span>
          <span className="flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full text-purple-800">
            <span>🔒</span> Method: Piloted (Account Sharing)
          </span>
        </div>
      </div>

      {/* Notable Loot */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-xl">✨</span> Notable Loot Drops
        </h4>
        <div className="flex flex-wrap gap-2">
          {raidConfig.notableLoot.map((item, idx) => (
            <span key={idx} className="px-3 py-1 bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-800 rounded-full text-sm border border-amber-200">
              🎁 {item}
            </span>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">⚔️</span> Select Difficulty
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {raidConfig.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMopRaidOption(option.value)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                mopRaidOption === option.value
                  ? 'border-amber-500 bg-amber-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-amber-300'
              }`}
            >
              <div className="font-bold text-gray-800">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
              <div className="text-2xl font-black text-blue-600 mt-2">
                ${option.price}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Optional Extras */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
        <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
          <span className="text-xl">🎁</span> Optional Extras
        </h4>
        
        <div className="space-y-3">
          {raidConfig.extras.priority && (
            <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-green-200 cursor-pointer hover:shadow-md transition-all">
              <input
                type="checkbox"
                checked={mopPriorityLoot}
                onChange={(e) => setMopPriorityLoot(e.target.checked)}
                className="h-5 w-5 text-green-600 rounded"
              />
              <div className="flex-1">
                <span className="font-semibold text-gray-800">
                  🏆 {raidConfig.extras.priority.label}
                </span>
                <p className="text-xs text-gray-500">
                  {raidConfig.extras.priority.description}
                </p>
              </div>
              <span className="font-bold text-green-700">
                +${raidConfig.extras.priority.price}
              </span>
            </label>
          )}

          {(raidConfig.extras.items3 || raidConfig.extras.items5 || raidConfig.extras.items2) && (
            <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-green-200 cursor-pointer hover:shadow-md transition-all">
              <input
                type="checkbox"
                checked={mopExtraItems}
                onChange={(e) => setMopExtraItems(e.target.checked)}
                className="h-5 w-5 text-green-600 rounded"
              />
              <div className="flex-1">
                <span className="font-semibold text-gray-800">
                  📦 {extraItemsLabel}
                </span>
                <p className="text-xs text-gray-500">
                  {raidConfig.extras.items3?.description || 
                   raidConfig.extras.items5?.description || 
                   raidConfig.extras.items2?.description}
                </p>
              </div>
              <span className="font-bold text-green-700">
                +${extraItemsPrice}
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Total Price */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-5 border border-amber-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <span className="text-gray-800 font-bold text-lg">Total Price:</span>
            <p className="text-xs text-gray-600 mt-1">
              {selectedOption?.label}
              {mopPriorityLoot && ' + Priority Loot'}
              {mopExtraItems && ` + ${extraItemsLabel}`}
            </p>
          </div>
          <span className="text-3xl font-black text-amber-700">
            ${calculateTotal().toFixed(2)}
          </span>
        </div>
      </div>

      {/* VPN Security Notice */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h5 className="font-semibold text-blue-900 mb-1">Secure VPN Protection</h5>
            <p className="text-sm text-blue-700">
              We use a VPN matching your location to ensure account safety. Your account credentials are encrypted and never shared.
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Special Instructions / Loot Priorities
        </label>
        <textarea
          value={buildSpecifications}
          onChange={(e) => setBuildSpecifications(e.target.value)}
          rows="3"
          className="w-full p-3 border rounded-lg resize-none bg-white"
          placeholder="Specify your class, spec, desired items, preferred schedule, etc."
        />
      </div>
    </div>
  );
};

export default MopRaidOptions;