import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANGUAGE } from '../i18n';
import { generateServiceSlug } from '../utils/urlHelpers';
import { FaClock, FaStar, FaEye, FaShoppingCart, FaCheck, FaGamepad } from 'react-icons/fa';
import axios from '../utils/axiosConfig';

const ServiceCard = ({ service }) => {
  const serviceSlug = generateServiceSlug(service);
  
  // Conversión segura: aseguramos que el _id sea un string plano aunque venga como objeto de Mongoose
  const rawId = service._id || service.id;
  const serviceId = rawId ? (typeof rawId === 'object' ? rawId.toString() : String(rawId)) : serviceSlug;
  
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const prefix = currentLang === DEFAULT_LANGUAGE ? '' : `/${currentLang}`;
  
  const price = service.basePrice || service.price || 0;
  
  const [reviewStats, setReviewStats] = useState({ rating: 0, count: 0, loaded: false });

  useEffect(() => {
    const fetchReviewStats = async () => {
      // Validamos estrictamente que sea un ID de MongoDB válido (24 caracteres hexadecimales)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(serviceId);
      if (!isMongoId) return; 
      
      try {
        const response = await axios.get(`/reviews/service/${serviceId}/stats`);
        if (response.data) {
          setReviewStats({
            rating: response.data.averageRating || 0,
            count: response.data.totalReviews || 0,
            loaded: true
          });
        }
      } catch (error) {
        // Silenciar errores si el servicio no tiene reviews aún
      }
    };

    fetchReviewStats();
  }, [serviceId]);

  const getGameColor = (game) => {
    const colors = {
      'Diablo 4': 'from-red-600 to-orange-600',
      'Diablo 3': 'from-orange-600 to-amber-600',
      'Diablo 2 Resurrected': 'from-red-700 to-red-500',
      'Diablo Immortal': 'from-purple-600 to-pink-600',
      'World of Warcraft Retail': 'from-blue-600 to-cyan-600',
      'World of Warcraft Classic': 'from-amber-600 to-yellow-600',
      'Path of Exile': 'from-stone-600 to-neutral-600',
      'Path of Exile 2': 'from-emerald-600 to-teal-600',
      'Last Epoch': 'from-indigo-600 to-purple-600',
    };
    return colors[game] || 'from-blue-600 to-indigo-600';
  };

  return (
    <div className="group relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-cyan-400 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2">
      
      <div className={`h-2 bg-gradient-to-r ${getGameColor(service.game)}`}></div>
      
      <div className="p-5 md:p-6">
        
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 backdrop-blur-sm text-cyan-300 rounded-full text-xs font-medium border border-gray-600">
            <FaGamepad className="text-cyan-400" />
            {service.game}
          </span>
          
          {reviewStats.count > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={`text-xs ${i < Math.floor(reviewStats.rating) ? 'text-yellow-400' : 'text-gray-600'}`} 
                  />
                ))}
              </div>
              <span className="text-gray-400 text-xs ml-1">({reviewStats.count})</span>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300">
          {service.name}
        </h3>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
          {service.description || 'Professional boosting service'}
        </p>

        {service.features && service.features.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {service.features.slice(0, 2).map((feature, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-gray-300">
                <FaCheck className="text-green-400 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{feature}</span>
              </div>
            ))}
            {service.features.length > 2 && (
              <p className="text-xs text-cyan-400 ml-5">+{service.features.length - 2} more features</p>
            )}
          </div>
        )}

        <div className="flex items-end justify-between mb-5 pt-2 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Starting at</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                ${price}
              </span>
              <span className="text-gray-500 text-sm">USD</span>
            </div>
          </div>
          
          {service.estimatedTime && (
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <FaClock className="text-cyan-400" />
              <span>{service.estimatedTime}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            to={`${prefix}/service/${serviceSlug}`}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group/view border border-gray-600 hover:border-cyan-400"
          >
            <FaEye className="text-gray-400 group-hover/view:text-cyan-300 transition-colors" />
            <span className="text-sm">Details</span>
          </Link>
          
          <Link
             to={`${prefix}/order/${serviceId}`}
             state={{ service, fixedPrice: price }}
             className="flex-1 py-2.5 px-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white hover:shadow-cyan-500/30"
          >
            <FaShoppingCart className="text-sm" />
            <span className="text-sm">Order</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;