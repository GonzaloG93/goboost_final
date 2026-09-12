// src/pages/Home.jsx - EFECTO 3D SUPER POP-OUT (3.5X)
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../utils/axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import SEO from '../components/SEO/SEO';
import { WebSiteSchema } from '../components/SEO/StructuredData';
import LazyImage from '../components/SEO/LazyImage';
import { GAMES, formatServiceType } from '../config/gamesConfig';

const Home = () => {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedFranchise, setSelectedFranchise] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const hasFetchedRef = useRef(false);
  const mountedRef = useRef(true);

  const homeSchema = WebSiteSchema();
  const currentLanguage = i18n.language;

  const getServiceId = (svc) => {
    const keys = Object.keys(svc);
    const idKey = keys.find(k => k === '_id');
    return idKey ? String(svc[idKey]) : null;
  };

  const getServiceSlug = (svc) => {
    const sid = getServiceId(svc);
    if (!sid) return null;
    const slug = svc.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
    return `${slug}-${sid.slice(-6)}`;
  };

  const eliteFeatures = [
    {
      icon: '👑',
      title: t('home.features.elite.title', 'Go&boost Boosters'),
      description: t('home.features.elite.description', 'We only work with the best, hand-picked boosters who have proven their skills and reliability through thousands of successful orders.')
    },
    {
      icon: '🛡️',
      title: t('home.features.privacy.title', 'Total Privacy'),
      description: t('home.features.privacy.description', 'Your connection and data are always encrypted and safe. Completely anonymous and secure process.')
    },
    {
      icon: '⚡',
      title: t('home.features.express.title', 'Express Service'),
      description: t('home.features.express.description', 'We complete your order in record time, no bots, no cheats. Only real pro players boosting your account.')
    },
    {
      icon: '💎',
      title: t('home.features.premium.title', 'Premium Experience'),
      description: t('home.features.premium.description', 'Dedicated support and real-time updates. Not satisfied? We offer a full refund, no questions asked.')
    }
  ];

  const franchises = {
    'diablo': {
      name: t('home.franchises.diablo', 'Diablo Universe'),
      color: 'bg-gradient-to-r from-red-600 to-orange-600',
      borderColor: 'border-red-500',
      hoverColor: 'hover:bg-red-500/20',
      games: ['Diablo 2 Resurrected', 'Diablo 3', 'Diablo 4', 'Diablo Immortal']
    },
    'warcraft': {
      name: t('home.franchises.warcraft', 'Warcraft Universe'),
      color: 'bg-gradient-to-r from-blue-600 to-cyan-600',
      borderColor: 'border-blue-500',
      hoverColor: 'hover:bg-blue-500/20',
      games: ['World of Warcraft', 'World of Warcraft Classic', 'World of Warcraft Retail']
    },
    'standalone': {
      name: t('home.franchises.premium', 'Premium Titles'),
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      borderColor: 'border-purple-500',
      hoverColor: 'hover:bg-purple-500/20',
      games: ['Path of Exile', 'Path of Exile 2', 'Dune Awakening', 'Last Epoch']
    }
  };

  const allGames = GAMES;

  const gameImages = {
    'Diablo 2 Resurrected': '/images/games/diablo-2-resurrected.png',
    'Diablo 3': '/images/games/diablo-3.png',
    'Diablo 4': '/images/games/diablo-4.png',
    'Diablo Immortal': '/images/games/diablo-immortal.png',
    'World of Warcraft': '/images/games/world-of-warcraft.png',
    'World of Warcraft Retail': '/images/games/world-of-warcraft.png',
    'World of Warcraft Classic': '/images/games/wow-classic.png',
    'Path of Exile': '/images/games/path-of-exile.png',
    'Path of Exile 2': '/images/games/path-of-exile-2.png',
    'Dune Awakening': '/images/games/dune-awakening.png',
    'Last Epoch': '/images/games/last-epoch.png'
  };

  const getGameFontClass = (gameName) => {
    const fontClasses = {
      'Diablo 2 Resurrected': 'font-diablo tracking-wider',
      'Diablo 3': 'font-diablo tracking-wider',
      'Diablo 4': 'font-diablo tracking-wider',
      'Diablo Immortal': 'font-diablo tracking-wider',
      'World of Warcraft': 'font-warcraft tracking-wide',
      'World of Warcraft Retail': 'font-warcraft tracking-wide',
      'World of Warcraft Classic': 'font-warcraft tracking-wide',
      'Path of Exile': 'font-poe tracking-wider',
      'Path of Exile 2': 'font-poe tracking-wider',
      'Dune Awakening': 'font-dune uppercase font-bold',
      'Last Epoch': 'font-last-epoch font-semibold'
    };
    return fontClasses[gameName] || 'font-bold';
  };

  const getGameFranchise = (gameName) => {
    for (const [franchiseKey, franchise] of Object.entries(franchises)) {
      if (franchise.games.includes(gameName)) {
        return franchiseKey;
      }
    }
    return 'standalone';
  };

  const handleGameClick = (gameName) => {
    const franchise = getGameFranchise(gameName);
    setSelectedFranchise(franchise);
    setSelectedGame(gameName);

    setTimeout(() => {
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleFranchiseClick = (franchiseKey) => {
    setSelectedFranchise(franchiseKey);
    setSelectedGame('');

    setTimeout(() => {
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const clearFilters = () => {
    setSelectedFranchise('');
    setSelectedGame('');
  };

  const fetchServicesData = async () => {
    if (hasFetchedRef.current) {
      setLoading(false);
      return;
    }

    try {
      hasFetchedRef.current = true;
      setError(null);
      setLoading(true);

      const response = await axios.get('/boosts');
      const servicesData = Array.isArray(response.data) ? response.data : [];
      const availableServices = servicesData.filter(service => service.available !== false && service.isActive !== false);

      setServices(availableServices);
      setFilteredServices(availableServices);
    } catch (error) {
      console.error('❌ Error loading services:', error);
      setError(t('errors.network.message'));
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchServicesData();

    return () => {
      mountedRef.current = false;
      hasFetchedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let filtered = services;

    if (selectedFranchise && selectedFranchise !== 'standalone') {
      const franchiseGames = franchises[selectedFranchise]?.games || [];
      filtered = filtered.filter(service => franchiseGames.includes(service.game));
    } else if (selectedGame) {
      filtered = filtered.filter(service => service.game === selectedGame);
    }

    setFilteredServices(filtered);
  }, [selectedGame, selectedFranchise, services]);

  const getFranchiseData = (franchiseKey) => {
    return franchises[franchiseKey] || franchises.standalone;
  };

  const seoTitle = t('seo.home.title');
  const seoDescription = t('seo.home.description');

  return (
    <>
      <SEO 
        title={seoTitle}
        description={seoDescription}
        keywords={t('seo.keywords')}
        schema={homeSchema}
      />

      <div className="scroll-smooth">
        {/* Hero Section */}
        <section 
          id="hero"
          className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pt-16"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-black opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20 animate-pulse mix-blend-screen opacity-50"></div>
            <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-gradient-to-r from-purple-600 to-pink-600 rounded-full filter blur-[120px] opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full filter blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="flex flex-col items-center justify-center mb-4 lg:mb-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 lg:mb-8">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-900 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]">
                  Go & Boost
                </span>
              </h1>

              <span className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight bg-gradient-to-r from-white via-yellow-200 to-cyan-200 bg-clip-text text-transparent">
                {t('home.hero.unlock', 'UNLOCK YOUR')}
              </span>

              <img 
                src="/images/logo-background.png" 
                alt="GonBoost Logo" 
                className="w-32 md:w-40 lg:w-48 xl:w-56 my-4 md:my-5 lg:my-6 opacity-80 filter drop-shadow-[0_0_40px_#00ffff]"
              />

              <span className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r from-white via-yellow-200 to-cyan-200 bg-clip-text text-transparent">
                {t('home.hero.potential', 'TRUE POTENTIAL')}
              </span>
            </div>

            <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-8 lg:mb-12 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed font-light px-4">
              {t('home.hero.description', 'Transform your gaming experience with our premium boosting service.')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center px-4">
              <a
                href="#games"
                className="w-full sm:w-auto group relative bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 px-6 py-3 lg:px-8 lg:py-4 xl:px-12 xl:py-5 rounded-xl lg:rounded-2xl font-bold lg:font-black text-base lg:text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-yellow-500/25"
              >
                <span className="relative z-10">{t('home.hero.cta1', 'GAMES WE SUPPORT')}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-20 rounded-xl lg:rounded-2xl group-hover:opacity-30 transition-opacity"></div>
              </a>

              <a
                href="#features"
                className="w-full sm:w-auto border-2 border-cyan-400 hover:bg-cyan-400/10 text-cyan-300 hover:text-cyan-200 px-4 py-3 lg:px-6 lg:py-4 xl:px-10 xl:py-5 rounded-xl lg:rounded-2xl font-semibold lg:font-bold text-base lg:text-lg transition-all duration-300 backdrop-blur-sm"
              >
                {t('home.hero.cta2', 'LEARN MORE')}
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 lg:py-28 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-40 left-20 w-72 h-72 bg-cyan-500 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-40 right-20 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-yellow-400 to-cyan-400 bg-clip-text text-transparent">
                  {t('home.features.title', 'WHY CHOOSE GONBOOST')}
                </span>
              </h2>
              <p className="text-gray-300 text-lg lg:text-xl font-light">
                {t('home.features.subtitle', 'Differences that define the premium experience')}
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-cyan-400 mx-auto mt-6 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {eliteFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10 hover:border-cyan-400/50 transition-all duration-500 hover:transform hover:-translate-y-2"
                >
                  <div className="text-5xl mb-5">{feature.icon}</div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 text-sm lg:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <p className="text-gray-400 text-sm max-w-2xl mx-auto italic">
                {t('home.features.quote', '"More than just a boosting service. Behind every order is a commitment to excellence, security, and customer satisfaction. We understand the passion and dedication of gamers, and we\'re committed to helping you achieve the gaming experience you deserve."')}
              </p>
            </div>
          </div>
        </section>

        {/* Games Section (SUPER POP-OUT 3.5X FUERA DE LA CARD) */}
        <section 
          id="games"
          className="py-20 lg:py-32 relative bg-gradient-to-br from-gray-900 to-blue-900 overflow-visible"
        >
          <div className="container mx-auto px-4 overflow-visible">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 lg:mb-6">
                {t('home.games.title1', 'PREMIUM')} <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{t('home.games.title2', 'GAMES')}</span>
              </h2>
              <div className="w-20 lg:w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-500 mx-auto mb-4 lg:mb-6"></div>
              <p className="text-base lg:text-lg xl:text-xl text-gray-300 max-w-xl lg:max-w-2xl mx-auto font-light px-4">
                {t('home.games.subtitle', 'Explore our exclusive franchises and titles')}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 lg:gap-4 mb-8 lg:mb-12">
              <button
                onClick={clearFilters}
                className={`px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-bold text-sm lg:text-base transition-all duration-300 transform hover:scale-105 ${
                  !selectedFranchise 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/25' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                🎮 {t('home.games.allGames', 'All Games')}
              </button>

              {Object.entries(franchises)
                .filter(([key]) => key === 'diablo' || key === 'warcraft')
                .map(([key, franchise]) => (
                  <button
                    key={key}
                    onClick={() => handleFranchiseClick(key)}
                    className={`px-4 lg:px-6 py-2 lg:py-3 rounded-xl font-bold text-sm lg:text-base transition-all duration-300 transform hover:scale-105 backdrop-blur-sm border ${
                      selectedFranchise === key
                        ? `${franchise.color} text-white shadow-2xl border-transparent`
                        : `bg-white/5 text-white/80 hover:bg-white/10 ${franchise.borderColor}`
                    }`}
                  >
                    {franchise.name}
                  </button>
                ))}
            </div>

            {/* GRILLA CON ESCALA 1.75X Y TÍTULOS VISIBLES EN HOVER */}
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-10 max-w-7xl mx-auto overflow-visible p-6">
  {allGames.map((game) => {
    const imageUrl = gameImages[game] || '/images/games/default.png';
    const fontClass = getGameFontClass(game);
    const franchiseKey = getGameFranchise(game);
    const isSelected = selectedGame === game || selectedFranchise === franchiseKey;

    return (
      <div key={game} className="relative group overflow-visible">
        <div
          className={`relative aspect-[3/4] rounded-xl lg:rounded-2xl cursor-pointer transition-all duration-300 ${
            isSelected 
              ? 'shadow-[0_20px_50px_rgba(0,255,255,0.4)] ring-2 ring-cyan-400 z-30' 
              : 'z-10'
          }`}
          onClick={() => handleGameClick(game)}
        >
          {/* Fondo base de la tarjeta */}
          <div className="absolute inset-0 bg-slate-900 rounded-xl lg:rounded-2xl border border-white/10 group-hover:border-cyan-400/80 transition-colors duration-300"></div>

          {/* Imagen ampliada a 1.75x al hacer Hover */}
          <div className="absolute inset-0 overflow-visible flex items-center justify-center">
            <div className="w-full h-full transition-all duration-300 ease-out group-hover:scale-[1.75] group-hover:-translate-y-4 group-hover:z-50 group-hover:drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] pointer-events-none">
              <LazyImage
                src={imageUrl}
                alt={`${game} ${t('home.games.boostingServices', 'boosting services')}`}
                className="w-full h-full object-cover rounded-xl lg:rounded-2xl"
                objectFit="cover"
              />
            </div>
          </div>

          {/* Badge "Selected" */}
          {isSelected && (
            <div className="absolute top-2 right-2 z-40">
              <div className="bg-gradient-to-r from-green-400 to-cyan-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                {t('home.games.selected', 'SELECTED')}
              </div>
            </div>
          )}

          {/* Título de la tarjeta (siempre visible y priorizado en z-index) */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-center z-[60] pointer-events-none transition-transform duration-300 group-hover:translate-y-2">
            <h3 className={`text-white text-sm lg:text-base ${fontClass} drop-shadow-[0_4px_12px_rgba(0,0,0,1)] bg-black/60 backdrop-blur-sm py-1 px-2 rounded-lg inline-block border border-white/10`}>
              {game}
            </h3>
          </div>
        </div>
      </div>
    );
  })}
</div>

            <div className="text-center mt-12 lg:mt-16">
              <p className="text-gray-400 text-lg lg:text-xl max-w-2xl mx-auto">
                {t('home.games.clickInstruction', 'Click on any game to explore its exclusive boosting services')}
              </p>
              <Link
                to={`/${currentLanguage === 'en' ? '' : currentLanguage + '/'}services`}
                className="inline-flex items-center mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 text-base lg:text-lg"
              >
                {t('home.games.viewAll', 'VIEW ALL GAMES & SERVICES')}
              </Link>
            </div>
          </div>
        </section>

        {/* Services Preview Section */}
        <section id="services" className="py-16 lg:py-24 relative bg-gradient-to-br from-blue-900 to-purple-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 lg:mb-6">
                {selectedFranchise || selectedGame ? (
                  <>
                    <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                      {selectedFranchise ? getFranchiseData(selectedFranchise).name : selectedGame}
                    </span>
                    {' '}{t('home.services.title', 'SERVICES')}
                  </>
                ) : (
                  <>
                    {t('home.services.featured', 'FEATURED')} <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">{t('home.services.title', 'SERVICES')}</span>
                  </>
                )}
              </h2>

              <div className="w-20 lg:w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto mb-4 lg:mb-6"></div>

              <p className="text-base lg:text-lg xl:text-xl text-gray-300 max-w-xl lg:max-w-2xl mx-auto font-light px-4">
                {selectedFranchise 
                  ? t('home.services.exploreFranchise', { franchise: getFranchiseData(selectedFranchise).name })
                  : selectedGame
                  ? t('home.services.premiumFor', { game: selectedGame })
                  : t('home.services.glimpse', 'A glimpse of our premium offerings')
                }
              </p>

              {(selectedFranchise || selectedGame) && (
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  {selectedFranchise && (
                    <div className={`${getFranchiseData(selectedFranchise).color} text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2`}>
                      🎮 {getFranchiseData(selectedFranchise).name}
                      <button onClick={() => setSelectedFranchise('')} className="hover:text-red-200 transition-colors">✕</button>
                    </div>
                  )}
                  {selectedGame && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      🕹️ {selectedGame}
                      <button onClick={() => setSelectedGame('')} className="hover:text-red-200 transition-colors">✕</button>
                    </div>
                  )}
                  <button onClick={clearFilters} className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-4 py-2 rounded-full text-sm font-bold transition-all duration-300">
                    {t('home.services.clearAll', 'Clear All')}
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-8 lg:py-12">
                <LoadingSpinner size="large" text={t('common.loading')} />
              </div>
            ) : error ? (
              <div className="text-center py-8 lg:py-12 backdrop-blur-md bg-white/5 rounded-2xl lg:rounded-3xl border border-white/10 max-w-2xl mx-auto mb-8">
                <div className="text-4xl lg:text-6xl mb-4 lg:mb-6">⚠️</div>
                <h3 className="text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-3 lg:mb-4">
                  {t('home.services.unavailable', 'SERVICES TEMPORARILY UNAVAILABLE')}
                </h3>
                <p className="text-gray-400 text-sm lg:text-base mb-6 lg:mb-8 max-w-md mx-auto px-4">
                  {t('home.services.errorMessage', 'We\'re having trouble connecting to our services. Please try again later.')}
                </p>
                <button onClick={() => { hasFetchedRef.current = false; setLoading(true); setError(null); fetchServicesData(); }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 lg:px-8 py-2 lg:py-3 rounded-lg lg:rounded-xl font-bold transition-all duration-300 transform hover:scale-105">
                  {t('home.services.tryAgain', 'TRY AGAIN')}
                </button>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-8 lg:py-12 backdrop-blur-md bg-white/5 rounded-2xl lg:rounded-3xl border border-white/10 max-w-2xl mx-auto mb-8">
                <div className="text-4xl lg:text-6xl mb-4 lg:mb-6">🔍</div>
                <h3 className="text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-3 lg:mb-4">
                  {t('home.services.noServices', 'NO SERVICES FOUND')}
                </h3>
                <p className="text-gray-400 text-sm lg:text-base mb-6 lg:mb-8 max-w-md mx-auto px-4">
                  {services.length === 0 
                    ? t('home.services.noServicesAvailable', 'No services available at the moment.')
                    : t('home.services.tryDifferentFilters', 'Try different filters to discover our exclusive offerings')}
                </p>
                <button onClick={clearFilters}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 lg:px-8 py-2 lg:py-3 rounded-lg lg:rounded-xl font-bold transition-all duration-300 transform hover:scale-105">
                  {t('home.services.viewAllServices', 'VIEW ALL SERVICES')}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
                  {filteredServices.slice(0, 9).map(service => {
                    const franchiseKey = getGameFranchise(service.game);
                    const franchiseData = getFranchiseData(franchiseKey);
                    const gameImage = gameImages[service.game] || '/images/games/default.png';

                    return (
                      <div key={service["_id"]} className="group relative bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-950/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-cyan-400/50 transition-all duration-500 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/20">
                        <div className="absolute top-3 left-3 z-20">
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-1.5 ${franchiseData.color || 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}>
                            <span className="text-base leading-none">🎮</span>
                            <span className="text-white">{service.game}</span>
                          </div>
                        </div>

                        <div className="absolute top-3 right-3 z-20">
                          <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                              {formatServiceType(service.serviceType)}
                            </span>
                          </div>
                        </div>

                        <div className="relative h-36 overflow-hidden">
                          <LazyImage src={gameImage} alt={service.game} className="w-full h-full" objectFit="cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent"></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>

                        <div className="p-5 pt-4">
                          <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300">
                            {service.name}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{service.description}</p>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-xs text-gray-400">
                              <span className="text-cyan-400 mr-2">⚡</span>
                              <span>{t('home.services.estimated', 'Estimated')}: </span>
                              <span className="text-white ml-1 font-medium">{service.estimatedTime}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500 uppercase tracking-wider">{t('common.price')}</span>
                              <div className="flex items-baseline">
                                <span className="text-xs text-gray-400 mr-0.5">$</span>
                                <span className="text-2xl lg:text-3xl font-black text-white font-mono tracking-tight">
                                  {service.price || service.basePrice}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">{t('common.usd')}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const slug = getServiceSlug(service);
                                if (slug) {
                                  const prefix = currentLanguage === 'en' ? '' : `/${currentLanguage}`;
                                  navigate(`${prefix}/service/${slug}`);
                                }
                              }}
                              className="relative z-30 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 mr-2"
                            >
                              Details
                            </button>
                            <button 
                              onClick={() => { 
                                const sid = getServiceId(service);
                                if (sid) { 
                                  const prefix = currentLanguage === 'en' ? '' : `/${currentLanguage}`;
                                  navigate(`${prefix}/order/${sid}`); 
                                }
                              }}
                              className="relative z-30 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/30 flex items-center gap-1.5 group/btn"
                            >
                              <span>{t('home.services.orderNow', 'ORDER NOW')}</span>
                              <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-cyan-400/30 pointer-events-none transition-all duration-500"></div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center">
                  <Link to={`/${currentLanguage === 'en' ? '' : currentLanguage + '/'}services`}
                    className="inline-flex items-center bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 lg:px-12 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 text-lg lg:text-xl">
                    {t('home.services.viewAllServices', 'VIEW ALL SERVICES')} →
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;