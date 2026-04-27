import React from 'react';
import { BUILD_DESCRIPTIONS, formatPrice } from '../../config/buildsConfig';

const PoE2BundleOptions = ({ 
  service, 
  currentPrice,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const bundleConfig = BUILD_DESCRIPTIONS[service.serviceType];
  if (!bundleConfig) return null;
  
  const isStarter = service.serviceType === 'poe2_starter_pack';
  const gradientColor = isStarter ? 'from-blue-500 to-cyan-500' : 'from-purple-500 to-indigo-500';
  const icon = isStarter ? '🚀' : '👑';

  return (
    <div className="space-y-5">
      <div className={`bg-gradient-to-r ${gradientColor} rounded-2xl p-4 md:p-6 text-white shadow-lg`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl md:text-4xl">{icon}</span>
          <h2 className="text-xl md:text-2xl font-bold">{bundleConfig.name}</h2>
        </div>
        <p className="text-white/90 text-sm md:text-base">{bundleConfig.description}</p>
        <div className="mt-4 text-2xl md:text-3xl font-black">${formatPrice(currentPrice)}</div>
      </div>
      
      <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-2xl">✨</span> What's Included
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {bundleConfig.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Build Preferences (Optional)</label>
        <textarea 
          value={buildSpecifications} 
          onChange={(e) => setBuildSpecifications(e.target.value)} 
          rows="4" 
          className="w-full p-3 border rounded-lg resize-none" 
          placeholder="Specify class, ascendancy, preferred playstyle, etc." 
        />
      </div>
    </div>
  );
};

export default PoE2BundleOptions;