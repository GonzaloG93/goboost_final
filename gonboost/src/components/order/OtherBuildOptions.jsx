import React from 'react';
import { BUILD_DESCRIPTIONS, formatPrice } from '../../config/buildsConfig';
import { formatServiceType } from '../../config/gamesConfig';

const OtherBuildOptions = ({ 
  service,
  currentPrice,
  buildSpecifications, 
  setBuildSpecifications 
}) => {
  const buildConfig = BUILD_DESCRIPTIONS[service.serviceType] || { 
    name: formatServiceType(service.serviceType), 
    description: service.description || 'Build service', 
    features: service.features || [] 
  };
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-4 md:p-6 border border-purple-200 shadow-lg">
      <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
        <span className="mr-2 text-2xl">⚙️</span> {buildConfig.name} Configuration
      </h3>
      
      <div className="bg-white rounded-xl p-4 md:p-5 border border-purple-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
          <h4 className="text-xl font-bold text-purple-900">{buildConfig.name}</h4>
          <span className="text-2xl font-black text-blue-600">${formatPrice(currentPrice)}</span>
        </div>
        <p className="text-gray-600 mb-3">{buildConfig.description}</p>
        <div>
          <h5 className="font-semibold text-gray-700 mb-2">Includes:</h5>
          <ul className="space-y-1">
            {buildConfig.features.map((feature, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start">
                <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Build Specifications</label>
        <textarea 
          value={buildSpecifications} 
          onChange={(e) => setBuildSpecifications(e.target.value)} 
          rows="4" 
          className="w-full p-3 border rounded-lg resize-none" 
          placeholder="Specify class, ascendancy, main skill, budget, etc." 
        />
      </div>
    </div>
  );
};

export default OtherBuildOptions;