import React from 'react';
import { THE_PIT_TIER_OPTIONS, THE_PIT_SERVICE_MODES } from '../../config/gamesConfig';

const ThePitArtificerOptions = ({ 
  service,
  currentPrice,
  pitTier, 
  setPitTier, 
  pitRuns, 
  setPitRuns, 
  pitMode, 
  setPitMode,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const selectedTierConfig = THE_PIT_TIER_OPTIONS.find(t => t.value === pitTier);

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-purple-200 shadow-lg">
        <h3 className="text-xl font-bold text-purple-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">🔮</span> The Pit Artificer Runs
        </h3>
        <p className="text-gray-700">
          Select your desired tier and adjust the number of runs using the slider.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Select Tier Difficulty</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THE_PIT_TIER_OPTIONS.map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => setPitTier(tier.value)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                pitTier === tier.value
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="font-bold text-gray-800">{tier.label}</div>
              <div className="text-xs text-gray-500 mt-1">{tier.description}</div>
              <div className="text-sm font-bold text-purple-600 mt-2">
                ${tier.basePricePerRun}/run
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex justify-between">
          <span>Number of Runs</span>
          <span className="text-purple-600">{pitRuns} Runs</span>
        </h4>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={pitRuns} 
            onChange={(e) => setPitRuns(Number(e.target.value))}
            className="w-full h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <input 
            type="number" 
            min="1" 
            max="100" 
            value={pitRuns}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= 1 && val <= 100) setPitRuns(val);
            }}
            className="w-20 p-2 text-center border-2 border-purple-200 rounded-lg font-bold"
          />
        </div>
        {pitRuns >= 10 && (
          <div className="p-2 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 text-center">
            Bulk discount applied!
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Service Mode</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THE_PIT_SERVICE_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setPitMode(mode.value)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                pitMode === mode.value
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-indigo-300'
              }`}
            >
              <div className="font-bold text-gray-800">{mode.label}</div>
              <div className="text-xs text-gray-500">{mode.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl border border-purple-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <span className="text-gray-800 font-bold text-lg">Total Price:</span>
          <span className="text-3xl font-black text-purple-700">${currentPrice.toFixed(2)}</span>
        </div>
      </div>

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

export default ThePitArtificerOptions;