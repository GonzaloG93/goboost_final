import React from 'react';
import { D4_BOSS_OPTIONS, D4_RUN_QUANTITY_OPTIONS, D4_SERVICE_MODES } from '../../config/gamesConfig';

const Diablo4BossOptions = ({ 
  service,
  currentPrice,
  selectedBoss, 
  setSelectedBoss, 
  runQuantity, 
  setRunQuantity, 
  serviceMode, 
  setServiceMode, 
  includeMaterials, 
  setIncludeMaterials, 
  materialSets, 
  setMaterialSets, 
  selectedBossConfig, 
  selectedQuantityConfig,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const matPricePerSet = selectedBossConfig?.materialPrice || 0.50;
  const materialName = selectedBossConfig?.materialName || 'Summoning Materials';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 md:p-6 border border-red-200 shadow-lg">
        <h3 className="text-xl font-bold text-red-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">👹</span> Diablo 4 - Boss Killing Service
        </h3>
        <p className="text-gray-700">
          Select your boss, number of runs, and preferred service mode. All loot is yours to keep!
        </p>
      </div>

      {/* Boss Selection */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">🎯</span> Select Boss
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {D4_BOSS_OPTIONS.map((boss) => (
            <button
              key={boss.value}
              type="button"
              onClick={() => setSelectedBoss(boss.value)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedBoss === boss.value
                  ? 'border-red-500 bg-red-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-red-300'
              }`}
            >
              <div className="font-bold text-gray-800">{boss.label}</div>
              <div className="text-sm text-gray-500 mt-1">
                {boss.tier === 'uber' ? '🔥 Uber Boss' : '⚔️ Ladder Boss'}
              </div>
              <div className="text-lg font-bold text-blue-600 mt-2">
                FROM ${boss.basePrice}/run
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Run Quantity Selection */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">🔢</span> Number of Runs
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {D4_RUN_QUANTITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRunQuantity(option.value)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                runQuantity === option.value
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="font-bold text-gray-800">{option.label}</div>
              {option.discount > 0 && (
                <div className="text-xs text-green-600 font-semibold mt-1">
                  🔥 {option.discount}% BULK DISCOUNT
                </div>
              )}
            </button>
          ))}
        </div>
        {selectedQuantityConfig?.discount > 0 && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              ✅ {selectedQuantityConfig.discount}% bulk discount applied!
            </p>
          </div>
        )}
      </div>

      {/* Service Mode Selection */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">🎮</span> Service Mode
        </h4>
        <div className="space-y-3">
          {D4_SERVICE_MODES.map((mode) => (
            <label
              key={mode.value}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                serviceMode === mode.value
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <input
                type="radio"
                name="serviceMode"
                value={mode.value}
                checked={serviceMode === mode.value}
                onChange={() => setServiceMode(mode.value)}
                className="mt-1 h-5 w-5 text-purple-600"
              />
              <div className="flex-1">
                <div className="font-bold text-gray-800">{mode.label}</div>
                <p className="text-sm text-gray-500 mt-1">{mode.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Materials Add-on */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
        <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
          <span className="text-xl">🧪</span> Summoning Materials (Optional)
        </h4>
        
        <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-amber-200 cursor-pointer">
          <input
            type="checkbox"
            checked={includeMaterials}
            onChange={(e) => {
              setIncludeMaterials(e.target.checked);
              if (e.target.checked) {
                setMaterialSets(runQuantity);
              }
            }}
            className="h-5 w-5 text-amber-600 rounded"
          />
          <div className="flex-1">
            <span className="font-semibold text-gray-800">
              Add {materialName}
            </span>
            <p className="text-xs text-gray-500">
              We provide the materials needed to summon {selectedBossConfig?.label}
            </p>
          </div>
          <span className="font-bold text-amber-700">
            ${matPricePerSet.toFixed(2)}/set
          </span>
        </label>

        {includeMaterials && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-amber-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of {materialName} Sets
            </label>
            <select
              value={materialSets}
              onChange={(e) => setMaterialSets(Number(e.target.value))}
              className="w-full p-3 border rounded-lg bg-white"
            >
              <option value={runQuantity}>Match runs ({runQuantity} sets)</option>
              <option value={10}>10 sets</option>
              <option value={25}>25 sets</option>
              <option value={50}>50 sets</option>
              <option value={100}>100 sets</option>
              <option value={150}>150 sets</option>
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Total materials cost: ${(matPricePerSet * materialSets).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Price Summary */}
      <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-2xl p-5 border border-red-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <span className="text-gray-800 font-bold text-lg">Total Price:</span>
            <p className="text-xs text-gray-600 mt-1">
              {selectedBossConfig?.label} × {runQuantity} runs 
              {selectedQuantityConfig?.discount > 0 && (
                <span className="text-green-600 font-semibold ml-1">
                  ({selectedQuantityConfig.discount}% bulk discount applied!)
                </span>
              )}
              <br />
              {serviceMode === 'piloted' ? '(Piloted)' : '(Self-Play)'}
              {includeMaterials && ` + ${materialSets} ${materialName} sets`}
            </p>
          </div>
          <span className="text-3xl font-black text-red-700">
            ${currentPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Build Specifications */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Special Instructions / Build Preferences
        </label>
        <textarea
          value={buildSpecifications}
          onChange={(e) => setBuildSpecifications(e.target.value)}
          rows="3"
          className="w-full p-3 border rounded-lg resize-none bg-white"
          placeholder="Specify your class, build, any special requests, preferred schedule, etc."
        />
      </div>
    </div>
  );
};

export default Diablo4BossOptions;