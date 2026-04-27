// frontend/src/pages/Order/components/DuneCraftVehicleOptions.jsx
import React from 'react';

const DuneCraftVehicleOptions = ({ 
  service,
  currentPrice,
  selectedVehicle, 
  setSelectedVehicle, 
  selectedMKKey, 
  setSelectedMKKey, 
  availableVehicles,
  selectedVehicleConfig,
  selectedMK,
  vehicleConfig,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const rewards = vehicleConfig.rewards || [];
  const requirements = vehicleConfig.requirements || [];

  const calculateTotal = () => {
    return selectedMK?.price || selectedVehicleConfig?.mkOptions?.[0]?.price || service?.basePrice || 10;
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 md:p-6 border border-blue-200 shadow-lg">
        <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">🏍️</span> Craft Vehicle Service
        </h3>
        <p className="text-gray-700">
          We will craft your desired vehicle with all the benefits listed below.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-xl">🚗</span> Vehicle Type
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableVehicles.map((vehicle) => (
            <label 
              key={vehicle.key}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedVehicle === vehicle.key 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <input 
                type="radio" 
                name="vehicle" 
                value={vehicle.key}
                checked={selectedVehicle === vehicle.key}
                onChange={() => setSelectedVehicle(vehicle.key)}
                className="mt-1 h-5 w-5 text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{vehicle.icon}</span>
                  <span className="font-bold text-gray-800">{vehicle.name}</span>
                </div>
                <p className="text-xs text-gray-500">{vehicle.description}</p>
                <p className="text-xs text-blue-600 mt-1">
                  From ${Math.min(...vehicle.mkOptions.map(m => m.price))}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {selectedVehicle && selectedVehicleConfig && (
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-200">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🔧</span> Select MK Version
          </h4>

          <select 
            value={selectedMKKey}
            onChange={(e) => setSelectedMKKey(e.target.value)}
            className="w-full md:w-80 p-4 border rounded-xl bg-white text-lg"
          >
            {selectedVehicleConfig.mkOptions.map((mk) => (
              <option key={mk.key} value={mk.key}>
                {mk.name} - ${mk.price} {mk.note ? `(${mk.note})` : ''}
              </option>
            ))}
          </select>

          {selectedMK?.note && (
            <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
              <span>⚠️</span> {selectedMK.note}
            </p>
          )}
        </div>
      )}

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
        <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
          <span className="text-xl">🎁</span> Rewards
        </h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {rewards.map((reward, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-500 mt-1">✓</span>
              <span>{reward}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
        <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
          <span className="text-xl">⚠️</span> Requirements
        </h4>
        <ul className="space-y-2">
          {requirements.map((req, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-amber-600 mt-1">•</span>
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-5 border border-blue-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <span className="text-gray-800 font-bold text-lg">Total Price:</span>
            <p className="text-xs text-gray-600 mt-1">
              Vehicle: {selectedVehicleConfig?.name} {selectedMK?.name} (${selectedMK?.price || 0})
            </p>
          </div>
          <span className="text-3xl font-black text-blue-700">
            ${calculateTotal().toFixed(2)}
          </span>
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
          placeholder="Please specify any additional requirements..."
          required
        />
        {!buildSpecifications.trim() && (
          <p className="text-red-500 text-xs mt-1">This field is required</p>
        )}
      </div>
    </div>
  );
};

export default DuneCraftVehicleOptions;