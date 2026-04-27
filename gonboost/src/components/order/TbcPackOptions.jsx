import React from 'react';
import { WOW_TBC_PACKS, formatPrice } from '../../config/buildsConfig';

const TbcPackOptions = ({ 
  service,
  currentPrice,
  formData, 
  handleChange 
}) => {
  const packConfig = WOW_TBC_PACKS[service.serviceType];
  if (!packConfig) return null;

  return (
    <div className="space-y-5">
      <div className={`bg-gradient-to-r ${packConfig.color} rounded-2xl p-4 md:p-6 text-white shadow-lg`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl md:text-4xl">{packConfig.icon}</span>
          <h2 className="text-xl md:text-2xl font-bold">{packConfig.name}</h2>
        </div>
        <p className="text-white/90 text-sm md:text-base">{packConfig.description}</p>
        <div className="mt-4 text-2xl md:text-3xl font-black">${formatPrice(packConfig.price)}</div>
      </div>
      
      <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-2xl">⚔️</span> Choose Your Faction
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {packConfig.availableFactions.map(faction => (
            <button 
              key={faction} 
              type="button" 
              onClick={() => setFormData(prev => ({ ...prev, faction }))} 
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                formData.faction === faction 
                  ? 'border-amber-500 bg-amber-50 shadow-md' 
                  : 'border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-white'
              }`}
            >
              <span className="font-semibold text-gray-800 block">{faction}</span>
              <span className="text-xs text-gray-500">
                {faction === 'Aldor' ? 'Physical DPS, Tanks' : 'Casters, Healers'}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-2xl">🔧</span> Choose Your Profession{packConfig.professionCount > 1 ? 's' : ''}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Primary Profession</label>
            <select 
              name="profession" 
              value={formData.profession} 
              onChange={handleChange} 
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
            >
              {packConfig.availableProfessions.map(prof => (
                <option key={prof} value={prof}>{prof}</option>
              ))}
            </select>
          </div>
          {packConfig.professionCount > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Secondary Profession</label>
              <select 
                name="secondProfession" 
                value={formData.secondProfession} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                {packConfig.availableProfessions
                  .filter(prof => prof !== formData.profession)
                  .map(prof => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))
                }
              </select>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-2xl">✨</span> What's Included
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {packConfig.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-blue-500 mt-1 flex-shrink-0">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TbcPackOptions;