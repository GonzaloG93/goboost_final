// src/pages/ServicesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import LocalizedLink from '../components/LocalizedLink';
import axios from '../utils/axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import ServiceCard from '../components/ServiceCard';
import SEO from '../components/SEO/SEO';
import { BreadcrumbSchema } from '../components/SEO/StructuredData';
import { toast } from 'react-toastify';
import { 
  GAMES, 
  ALL_SERVICE_TYPES, 
  SERVICE_CATEGORIES,
  formatServiceType,
  getServiceTypesForGame,
  categorizeService
} from '../config/gamesConfig';

const ServicesPage = () => {
  const { t } = useTranslation();
  const { lang } = useParams();
  
  const [services, setServices] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [displayCount, setDisplayCount] = useState(9);
  
  const navigate = useLocalizedNavigate(); 
  const [searchParams] = useSearchParams();

  const gameFromUrl = searchParams.get('game');
  const typeFromUrl = searchParams.get('type');

  const breadcrumbSchema = BreadcrumbSchema({
    items: [
      { name: 'Inicio', url: 'https://gonboost.com' },
      { name: 'Servicios', url: 'https://gonboost.com/services' }
    ]
  });

  const games = GAMES;
  const allServiceTypes = ALL_SERVICE_TYPES;
  const serviceCategories = SERVICE_CATEGORIES;

  useEffect(() => {
    if (gameFromUrl) setSelectedGame(gameFromUrl);
    if (typeFromUrl) setSelectedType(typeFromUrl);
  }, [gameFromUrl, typeFromUrl]);

  const getFilteredServiceTypes = () => {
    if (!selectedGame) return allServiceTypes;
    return getServiceTypesForGame(selectedGame);
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/boosts');
        
        const availableServices = response.data.filter(service => 
          service.available !== false && service.isActive !== false
        );
        
        setServices(availableServices);
      } catch (error) {
        console.error('❌ Error loading services:', error);
        
        let errorMessage = 'Error loading services';
        if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
          errorMessage = 'Server is not available. Please make sure the backend is running.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Services endpoint not found. Please check backend routes.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  const displayedServices = useMemo(() => {
    let filtered = services;
    
    if (selectedGame) {
      filtered = filtered.filter(service => service.game === selectedGame);
    }
    
    if (selectedType) {
      filtered = filtered.filter(service => service.serviceType === selectedType);
    }
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(service => 
        categorizeService(service.serviceType) === activeCategory
      );
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(service => 
        service.name?.toLowerCase().includes(term) ||
        service.description?.toLowerCase().includes(term) ||
        service.game?.toLowerCase().includes(term) ||
        formatServiceType(service.serviceType)?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [services, selectedGame, selectedType, activeCategory, searchTerm]);

  const visibleServices = displayedServices.slice(0, displayCount);
  const hasMore = displayedServices.length > visibleServices.length;

  useEffect(() => {
    setSelectedType('');
  }, [selectedGame]);

  useEffect(() => {
    setDisplayCount(9);
  }, [selectedGame, selectedType, activeCategory, searchTerm]);

  // Manejo centralizado de órdenes
  const handleOrderNow = (service) => {
    const rawId = service._id || service.id;
    if (!rawId) {
      toast.error('Service ID not available. Please refresh or contact support.');
      return;
    }
    
    const safeId = typeof rawId === 'object' ? rawId.toString() : String(rawId);
    
    navigate(`/order/${safeId}`, {
      state: {
        service: service,
        fixedPrice: service.basePrice || service.price
      }
    });
  };

  const clearAllFilters = () => {
    setSelectedGame('');
    setSelectedType('');
    setActiveCategory('all');
    setSearchTerm('');
  };

  const filterStats = useMemo(() => {
    return {
      total: services.length,
      filtered: displayedServices.length,
      hasActiveFilters: selectedGame || selectedType || activeCategory !== 'all' || searchTerm
    };
  }, [services, displayedServices, selectedGame, selectedType, activeCategory, searchTerm]);

  return (
    <>
      <SEO 
        title={`Boosting Services ${selectedGame ? `for ${selectedGame}` : 'for Gaming'} - GonBoost`}
        description={`Professional boosting services ${selectedGame ? `for ${selectedGame}` : 'for Diablo, PoE, WoW and more'}. Boost your character with verified boosters.`}
        canonical="/services"
        schema={breadcrumbSchema}
      />
      
      <div className="scroll-smooth min-h-screen">
        {/* Hero Section */}
        <section className="min-h-[50vh] md:min-h-[60vh] relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-16">
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="relative z-10 text-center text-white px-4 max-w-5xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {t('servicesPage.hero.line1')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                {t('servicesPage.hero.line2')}
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-8 max-w-3xl mx-auto">
              {t('servicesPage.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => document.getElementById('services-grid').scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all duration-300 transform hover:scale-105"
              >
                Browse Services
              </button>
              <LocalizedLink
                to="/support"
                className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all duration-300"
              >
                Custom Order
              </LocalizedLink>
            </div>
            
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        {error && (
          <section className="py-6 bg-red-900/20 border-b border-red-500/30">
            <div className="container mx-auto px-4 text-center">
              <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-6 max-w-2xl mx-auto">
                <div className="text-red-300 text-lg mb-2">⚠️ Service Error</div>
                <p className="text-red-200">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          </section>
        )}

        <section id="services-grid" className="py-12 lg:py-20 relative bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            
            <div className="backdrop-blur-md bg-white/5 rounded-2xl lg:rounded-3xl p-4 lg:p-6 mb-8 max-w-6xl mx-auto border border-white/10">
              
              <div className="relative mb-4">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, game, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-4 pl-12 pr-12 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button
                  onClick={() => setSelectedGame('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    !selectedGame 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/30' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <span>🎮</span> All Games
                </button>

                {games.slice(0, 5).map(game => (
                  <button
                    key={game}
                    onClick={() => setSelectedGame(selectedGame === game ? '' : game)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedGame === game
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {game}
                  </button>
                ))}
                
                {games.length > 5 && (
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="bg-gray-800 text-gray-300 text-sm rounded-full px-4 py-2 border border-gray-700 hover:border-cyan-400 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="">More games...</option>
                    {games.slice(5).map(game => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSelectedType('');
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    activeCategory === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <span>📋</span> All Types
                </button>

                {serviceCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(activeCategory === category.id ? 'all' : category.id);
                      setSelectedType('');
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                      activeCategory === category.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}

                {(selectedGame || activeCategory !== 'all') && getFilteredServiceTypes().length > 0 && (
                  <div className="relative md:ml-auto">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="appearance-none bg-gray-800 text-gray-300 text-sm rounded-full pl-4 pr-10 py-2 border border-gray-700 hover:border-cyan-400 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">
                        {selectedGame ? `All ${selectedGame} types` : 'All service types'}
                      </option>
                      {getFilteredServiceTypes().map(type => (
                        <option key={type} value={type}>
                          {formatServiceType(type)}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center text-sm border-t border-gray-700/50 pt-3">
                <span className="text-gray-400">
                  Showing <span className="text-cyan-300 font-bold">{filterStats.filtered}</span> of {filterStats.total} services
                </span>
                {filterStats.hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center gap-1"
                  >
                    <span>Clear all filters</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="text-center mb-6 lg:mb-8">
              <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-5 py-2 rounded-full border border-cyan-400/30">
                <span className="text-cyan-300 font-bold text-lg mr-2">
                  {visibleServices.length}
                </span>
                <span className="text-white text-sm">
                  {visibleServices.length === 1 ? 'SERVICE' : 'SERVICES'} AVAILABLE
                  {selectedGame && ` FOR ${selectedGame}`}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="large" text="Loading premium services..." />
              </div>
            ) : (
              <>
                {visibleServices.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {visibleServices.map(service => (
                        <ServiceCard 
                          key={service._id || service.id} 
                          service={service} 
                          onOrderNow={handleOrderNow} 
                        />
                      ))}
                    </div>

                    {hasMore && (
                      <div className="text-center mt-8 lg:mt-12">
                        <button
                          onClick={() => setDisplayCount(prev => prev + 9)}
                          className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 border border-gray-700 hover:border-cyan-400"
                        >
                          Load More Services ({displayedServices.length - visibleServices.length} remaining)
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 backdrop-blur-md bg-white/5 rounded-3xl border border-white/10 max-w-2xl mx-auto">
                    <div className="text-6xl mb-6">🔍</div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      No services found
                    </h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto px-4">
                      {services.length === 0 
                        ? 'No services available at the moment.' 
                        : 'No services match your filters. Try adjusting your search criteria.'
                      }
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="py-12 lg:py-16 relative bg-gradient-to-t from-slate-900 via-blue-900 to-slate-900">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-4 lg:mb-6">
              NEED SOMETHING{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                CUSTOM?
              </span>
            </h2>
            <p className="text-gray-300 text-base lg:text-lg mb-6 lg:mb-8 max-w-2xl mx-auto">
              Can't find exactly what you're looking for? Contact us for a personalized service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <LocalizedLink
                to="/"
                className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-6 lg:px-8 py-3 rounded-xl font-bold transition-all duration-300 border border-gray-600"
              >
                ← BACK TO HOME
              </LocalizedLink>
              <LocalizedLink
                to="/support"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 lg:px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
              >
                📞 CUSTOM SERVICE
              </LocalizedLink>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ServicesPage;