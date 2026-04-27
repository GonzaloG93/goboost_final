import React from 'react';
import { formatServiceType } from '../../config/gamesConfig';
import { formatPrice } from '../../config/buildsConfig'; 

const ServiceSummary = ({ 
  service,
  currentPrice,
  currentBreakdown,
  formData,
  handleChange,
  handleSubmit,
  submitting,
  isMopRaid,
  isBossKillingD4,
  isThePitArtificer,
  isWowTbcPack,
  isLeveling,
  isPowerleveling,
  isParagonLeveling,
  isDuneLeveling,
  isDuneBaseConstruction,
  isDuneCraftVehicle,
  isCustomService,
  isVariablePriceService,
  supportsQuantity,
  mopRaidOption,
  mopPriorityLoot,
  mopExtraItems,
  selectedBossConfig,
  runQuantity,
  serviceMode,
  includeMaterials,
  materialSets,
  materialName,
  selectedQuantityConfig,
  pitTier,
  pitRuns,
  pitMode,
  packConfig,
  addBuildToLeveling,
  selectedLevelingBuildTier,
  addClassUnlock,
  selectedBaseConfig,
  addDefenses,
  addAutomation,
  addResources,
  selectedVehicleConfig,
  selectedMK,
  THE_PIT_TIER_OPTIONS
}) => {
  
  const renderConfigurationSummary = () => {
    if (isMopRaid()) {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Raid:</span>
            <span className="font-medium text-amber-600">
              {service?.name || formatServiceType(service?.serviceType)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Difficulty:</span>
            <span className="font-medium">
              {mopRaidOption || 'Select option'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Method:</span>
            <span className="font-medium text-purple-600">Piloted</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Est. Time:</span>
            <span className="font-medium text-gray-700">
              {service?.estimatedTime || '1-2 hours'}
            </span>
          </div>
          {mopPriorityLoot && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Priority Loot:</span>
              <span className="font-medium text-green-600">✓ Included</span>
            </div>
          )}
          {mopExtraItems && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Extra Items:</span>
              <span className="font-medium text-green-600">✓ Included</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-gray-600">VPN Protection:</span>
            <span className="font-medium text-blue-600">🔒 Active</span>
          </div>
        </div>
      );
    }

    if (isBossKillingD4()) {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Boss:</span>
            <span className="font-medium text-red-600">{selectedBossConfig?.label}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Runs:</span>
            <span className="font-medium">
              {runQuantity} runs
              {selectedQuantityConfig?.discount > 0 && (
                <span className="text-green-600 text-xs ml-1">
                  (-{selectedQuantityConfig.discount}%)
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Mode:</span>
            <span className="font-medium text-purple-600">
              {serviceMode === 'piloted' ? 'Piloted' : 'Self-Play'}
            </span>
          </div>
          {includeMaterials && (
            <div className="flex justify-between py-2 border-t border-gray-100 mt-2 pt-2">
              <span className="text-gray-600">Materials:</span>
              <span className="font-medium text-amber-600">
                {materialSets} {materialName}
              </span>
            </div>
          )}
        </div>
      );
    }

    if (isThePitArtificer()) {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Tier:</span>
            <span className="font-medium text-purple-600">
              {THE_PIT_TIER_OPTIONS.find(t => t.value === pitTier)?.label}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Runs:</span>
            <span className="font-medium">{pitRuns} runs</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Mode:</span>
            <span className="font-medium text-indigo-600">
              {pitMode === 'piloted' ? 'Piloted' : 'Self-Play'}
            </span>
          </div>
        </div>
      );
    }

    if (isWowTbcPack()) {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Faction:</span>
            <span className="font-medium text-amber-600">{formData.faction}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Primary Profession:</span>
            <span className="font-medium text-blue-600">{formData.profession}</span>
          </div>
          {packConfig?.professionCount > 1 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Secondary Profession:</span>
              <span className="font-medium text-blue-600">{formData.secondProfession}</span>
            </div>
          )}
        </div>
      );
    }

    if (isLeveling() || isPowerleveling() || isParagonLeveling() || isDuneLeveling()) {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Current Level:</span>
            <span className="font-medium">{formData.currentLevel}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Desired Level:</span>
            <span className="font-medium">{formData.desiredLevel}</span>
          </div>
          {(isPowerleveling() || isParagonLeveling()) && addBuildToLeveling && (
            <div className="flex justify-between py-2 border-t border-gray-100 mt-2 pt-2">
              <span className="text-gray-600">Build Add-on:</span>
              <span className="font-medium text-purple-600 capitalize">{selectedLevelingBuildTier}</span>
            </div>
          )}
          {isDuneLeveling() && addClassUnlock && (
            <div className="flex justify-between py-2 border-t border-gray-100 mt-2 pt-2">
              <span className="text-gray-600">Class Unlock:</span>
              <span className="font-medium text-amber-600">Included</span>
            </div>
          )}
        </div>
      );
    }

    if (isDuneBaseConstruction()) {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Base Size:</span>
            <span className="font-medium text-emerald-600">{selectedBaseConfig?.name}</span>
          </div>
          {addDefenses && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Defenses:</span>
              <span className="font-medium text-amber-600">Included</span>
            </div>
          )}
          {addAutomation && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Automation:</span>
              <span className="font-medium text-amber-600">Included</span>
            </div>
          )}
          {addResources && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Resource Pack:</span>
              <span className="font-medium text-amber-600">Included</span>
            </div>
          )}
          {addClassUnlock && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Class Unlock:</span>
              <span className="font-medium text-amber-600">Included</span>
            </div>
          )}
        </div>
      );
    }

    if (isDuneCraftVehicle()) {
      return (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Vehicle:</span>
            <span className="font-medium text-blue-600">{selectedVehicleConfig?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">MK Version:</span>
            <span className="font-medium text-blue-600">{selectedMK?.name}</span>
          </div>
          {selectedMK?.note && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Note:</span>
              <span className="font-medium text-amber-600 text-xs">{selectedMK.note}</span>
            </div>
          )}
        </div>
      );
    }

    if (isCustomService()) {
      return (
        <div className="space-y-2 text-sm">
          {formData.selectedOption && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Selected Option:</span>
              <span className="font-medium text-purple-600">{formData.selectedOption}</span>
            </div>
          )}
          {isVariablePriceService() && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Your Offer:</span>
              <span className="font-medium text-blue-600">
                ${formatPrice(formData.customPrice || service?.basePrice || 0)}
              </span>
            </div>
          )}
        </div>
      );
    }

    if (supportsQuantity() && !isLeveling() && !isPowerleveling() && !isParagonLeveling() && !isDuneLeveling()) {
      return (
        <div className="flex justify-between py-2 text-sm">
          <span className="text-gray-600">Quantity:</span>
          <span className="font-medium">{formData.quantity} units</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden lg:sticky lg:top-24">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
        <p className="text-sm font-medium text-white/80 mb-1">Total Amount</p>
        <div className="text-4xl font-black">${formatPrice(currentPrice)}</div>
      </div>

      <div className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>📋</span> Your Configuration
        </h3>

        {renderConfigurationSummary()}

        {currentBreakdown && currentBreakdown.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Price Breakdown</h4>
            <div className="space-y-1 text-sm">
              {currentBreakdown.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex justify-between ${item.isTotal ? 'font-bold text-base pt-2 border-t border-gray-200 mt-2' : ''}`}
                >
                  <span className={item.isTotal ? 'text-gray-900' : 'text-gray-600'}>
                    {item.item}
                    {item.note && <span className="text-xs text-gray-400 ml-1">({item.note})</span>}
                  </span>
                  <span className={item.isTotal ? 'text-blue-600' : 'text-gray-700'}>
                    {item.amount < 0 ? '-' : ''}${Math.abs(item.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="accountName" 
                value={formData.accountName} 
                onChange={handleChange} 
                required 
                className="w-full p-3 border rounded-lg bg-white" 
                placeholder="Your account name" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (Optional)
              </label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                className="w-full p-3 border rounded-lg bg-white" 
                placeholder="Only if required" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Username
              </label>
              <input 
                type="text" 
                name="gameUsername" 
                value={formData.gameUsername} 
                onChange={handleChange} 
                className="w-full p-3 border rounded-lg bg-white" 
                placeholder="In-game name" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server/Region
              </label>
              <input 
                type="text" 
                name="server" 
                value={formData.server} 
                onChange={handleChange} 
                className="w-full p-3 border rounded-lg bg-white" 
                placeholder="Server or region" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange} 
                rows="3" 
                className="w-full p-3 border rounded-lg resize-none bg-white" 
                placeholder="Any special requirements..." 
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceSummary;