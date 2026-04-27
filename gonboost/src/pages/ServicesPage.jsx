// src/pages/ServicesPage.jsx - VERSIÓN OPTIMIZADA PARA RENDER (CON FILTROS ORIGINALES)
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
import { generateServiceSlug } from '../utils/urlHelpers';
import { 
  GAMES, 
  SERVICE_CATEGORIES,
  formatServiceType,
  getServiceTypesForGame,
  categorizeService
} from '../config/gamesConfig';

const ServicesPage = () => {
  const { t, i18n } = useTranslation();
  const { lang } = useParams();
  const currentLang = lang || i18n.language || 'en';

  // Estados de carga y datos
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de filtros (PRESERVADOS COMPLETAMENTE)
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [displayCount, setDisplayCount] = useState(9);

  const navigate = useLocalizedNavigate();
  const [searchParams] = useSearchParams();

  // Sincronizar filtros con URL
  useEffect(() => {
    const gameFromUrl = searchParams.get('game');
    const typeFromUrl = searchParams.get('type');
    if (gameFromUrl) setSelectedGame(gameFromUrl);
    if (typeFromUrl) setSelectedType(typeFromUrl);
  }, [searchParams]);

  // Obtener tipos de servicio para el juego seleccionado
  const getFilteredServiceTypes = () => {
    if (!selectedGame) return [];
    return getServiceTypesForGame(selectedGame);
  };

  // Fetch de servicios desde el Backend en Render (con manejo de Cold Start)
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Timeout para manejar Cold Start de Render (hasta 10 segundos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await axios.get('/boosts', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        // Filtramos solo servicios activos y disponibles
        const data = Array.isArray(response.data) ? response.data : [];
        const availableServices = data.filter(s => s.available !== false && s.isActive !== false);

        setServices(availableServices);
      } catch (err) {
        console.error("Error fetching services:", err);
        
        let errorMessage;
        if (err.name === 'AbortError') {
          errorMessage = t('servicesPage.errors.timeout', 'Server is waking up. Please refresh in a moment.');
        } else if (err.code === 'ECONNREFUSED' || err.message === 'Network Error') {
          errorMessage = t('servicesPage.errors.network', 'Server is not available. The backend on Render may be starting up (Cold Start).');
        } else if (err.response?.status === 404) {
          errorMessage = t('servicesPage.errors.notFound', 'Services endpoint not found.');
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = t('servicesPage.errors.generic', 'Error loading services. Please try again.');
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, [t]);

  // Lógica de filtrado (Memoizada para rendimiento)
  const filteredServices = useMemo(() => {
    let result = services;

    if (selectedGame) {
      result = result.filter(s => s.game === selectedGame);
    }

    if (selectedType) {
      result = result.filter(s => s.serviceType === selectedType);
    }

    if (activeCategory !== 'all') {
      result = result.filter(s => categorizeService(s.serviceType) === activeCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term) ||
        s.game?.toLowerCase().includes(term) ||
        formatServiceType(s.serviceType)?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [services, selectedGame, selectedType, activeCategory, searchTerm]);

  // Paginación
  const visibleServices = filteredServices.slice(0, displayCount);
  const hasMore = filteredServices.length > visibleServices.length;

  // Reset de displayCount cuando cambian filtros
  useEffect(() => {
    setDisplayCount(9);
  }, [selectedGame, selectedType, activeCategory, searchTerm]);
  
  // Reset selectedType cuando cambia el juego
  useEffect(() => {
    setSelectedType('');
  }, [selectedGame]);

  const handleOrderNow = (service) => {
    if (!service._id) {
      toast.error(t('servicesPage.errors.noId', 'Service not available'));
      return;
    }
    const serviceSlug = generateServiceSlug(service);
    navigate(`/service/${serviceSlug}`, {
      state: { service, fixedPrice: service.basePrice || service.price }
    });
  };

  // Reset de todos los filtros
  const clearAllFilters = () => {
    setSelectedGame('');
    setSelectedType('');
    setActiveCategory('all');
    setSearchTerm('');
  };

  // Estadísticas de filtros
  const filterStats = useMemo(() => ({
    total: services.length,
    filtered: filteredServices.length,
    hasActiveFilters: selectedGame || selectedType || activeCategory !== 'all' || searchTerm
  }), [services, filteredServices, selectedGame, selectedType, activeCategory, searchTerm]);

  const games = GAMES;
  const serviceCategories = SERVICE_CATEGORIES;

  // Breadcrumb dinámico con traducciones
  const breadcrumbSchema = BreadcrumbSchema({
    items: [
      { name: t('navigation.home'), url: 'https://gonboost.com' },
      { name: t('navigation.services'), url: 'https://gonboost.com/services' }
    ]
  });

  return (
    <>
      <SEO
        title={t('seo.services.title')}
        description={t('seo.services.description')}
        canonical="/services"
        schema={breadcrumbSchema}
      />

      <div className="scroll-smooth min-h-screen bg-slate-900">
        {/* HERO SECTION - CON NUEVAS CLAVES servicesPage */}
        <section className="min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pt-16">
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
                onClick={() => document.getElementById('services-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all duration-300 transform hover:scale-105"
              >
                {t('servicesPage.hero.browseButton')}
              </button>
              <LocalizedLink
                to="/support"
                className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all duration-300"
              >
                {t('servicesPage.hero.customButton')}
              </LocalizedLink>
            </div>
          </div>
        </section>

        {/* ERROR SECTION - MEJORADA PARA RENDER */}
        {error && (
          <section className="py-6 bg-red-900/20 border-b border-red-500/30">
            <div className="container mx-auto px-4 text-center">
              <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-6 max-w-2xl mx-auto">
                <div className="text-red-300 text-lg mb-2">⚠️ {t('servicesPage.errors.title', 'Service Error')}</div>
                <p className="text-red-200">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                >
                  {t('common.retry', 'Retry')}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* FILTROS Y GRID - FILTROS ORIGINALES PRESERVADOS */}
        <section id="services-grid" className="py-10 md:py-16 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
          <div className="container mx-auto px-2 sm:px-4 relative z-10">

            {/* FILTROS - COMPLETAMENTE ORIGINALES */}
            <div className="backdrop-blur-md bg-white/5 rounded-2xl p-4 md:p-6 mb-8 max-w-6xl mx-auto border border-white/10">
              {/* SEARCHBAR */}
              <div className="relative mb-4">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t('servicesPage.filters.searchPlaceholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full p-4 pl-12 pr-12 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
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

              {/* GAME FILTER BUTTONS - ORIGINAL */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button
                  onClick={() => setSelectedGame('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    !selectedGame 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/30' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <span>🎮</span> {t('servicesPage.filters.allGames')}
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
                    onChange={e => setSelectedGame(e.target.value)}
                    className="bg-gray-800 text-gray-300 text-sm rounded-full px-4 py-2 border border-gray-700 hover:border-cyan-400 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="">{t('servicesPage.filters.moreGames')}</option>
                    {games.slice(5).map(game => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* CATEGORY AND SERVICE TYPE FILTERS - ORIGINAL */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => { setActiveCategory('all'); setSelectedType(''); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    activeCategory === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <span>📋</span> {t('servicesPage.categories.all')}
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
                    <span>{t(`servicesPage.categories.${category.id}`, category.name)}</span>
                  </button>
                ))}
                {(selectedGame || activeCategory !== 'all') && getFilteredServiceTypes().length > 0 && (
                  <div className="relative md:ml-auto">
                    <select
                      value={selectedType}
                      onChange={e => setSelectedType(e.target.value)}
                      className="appearance-none bg-gray-800 text-gray-300 text-sm rounded-full pl-4 pr-10 py-2 border border-gray-700 hover:border-cyan-400 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                    >
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

              {/* FILTER STATS AND CLEAR BUTTON */}
              <div className="mt-4 flex flex-col md:flex-row justify-between items-center text-sm border-t border-gray-700/50 pt-3 gap-2">
                <span className="text-gray-400">
                  {t('servicesPage.filters.showing')}
                  <span className="text-cyan-300 font-bold"> {filterStats.filtered}</span> {t('servicesPage.filters.of')} {filterStats.total} {t('servicesPage.filters.services')}
                </span>
                {filterStats.hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors flex items-center gap-1 mt-2 md:mt-0"
                  >
                    <span>{t('servicesPage.filters.clearFilters')}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* GRID DE SERVICIOS */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-5 py-2 rounded-full border border-cyan-400/30">
                <span className="text-cyan-300 font-bold text-lg mr-2">{visibleServices.length}</span>
                <span className="text-white text-sm">
                  {visibleServices.length === 1 ? t('servicesPage.filters.serviceAvailable') : t('servicesPage.filters.servicesAvailable')}
                  {selectedGame && ` ${t('servicesPage.filters.for')} ${selectedGame}`}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="large" text={t('common.loading')} />
              </div>
            ) : (
              <>
                {visibleServices.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {visibleServices.map(service => (
                        <ServiceCard key={service._id} service={service} onOrderNow={handleOrderNow} />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="text-center mt-8">
                        <button
                          onClick={() => setDisplayCount(p => p + 9)}
                          className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 border border-gray-700 hover:border-cyan-400"
                        >
                          {t('servicesPage.filters.loadMore')} ({filteredServices.length - visibleServices.length} {t('servicesPage.filters.remaining')})
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 backdrop-blur-md bg-white/5 rounded-3xl border border-white/10 max-w-2xl mx-auto">
                    <div className="text-6xl mb-6">🔍</div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {services.length === 0 
                        ? t('servicesPage.noServices')
                        : t('servicesPage.noMatchFilters')
                      }
                    </h3>
                    <button
                      onClick={clearAllFilters}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300"
                    >
                      {t('servicesPage.filters.clearFilters')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default ServicesPage;