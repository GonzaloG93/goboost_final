// src/pages/Home.jsx - VERSIÓN OPTIMIZADA Y RESPONSIVE, PRODUCCIÓN RENDER
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../utils/axiosConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import SEO from '../components/SEO/SEO';
import { WebSiteSchema } from '../components/SEO/StructuredData';
import LazyImage from '../components/SEO/LazyImage';
import { GAMES, formatServiceType } from '../config/gamesConfig';

// ------------------ HELPERS FUERA DEL COMPONENTE -------------------
const getServiceId = svc => svc._id ? String(svc._id) : null;
const getServiceSlug = svc => {
  const sid = getServiceId(svc);
  if (!sid) return null;
  const slug = svc.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  return `${slug}-${sid.slice(-6)}`;
};
const getGameFranchise = (gameName, franchises) => {
  for (const [franchiseKey, franchise] of Object.entries(franchises)) {
    if (franchise.games.includes(gameName)) return franchiseKey;
  }
  return 'standalone';
};
const getFranchiseData = (franchiseKey, franchises) => franchises[franchiseKey] || franchises.standalone;
const getGameFontClass = (gameName) => ({
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
}[gameName] || 'font-bold');

const MAX_FEATURED_MOBILE = 3;
const MAX_FEATURED_TABLET = 6;
const MAX_FEATURED_DESKTOP = 9;

// --------------------- HOME COMPONENTE PRINCIPAL ----------------------
const Home = () => {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedFranchise, setSelectedFranchise] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredCount, setFeaturedCount] = useState(MAX_FEATURED_DESKTOP);

  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);
  const currentLanguage = i18n.language;
  const homeSchema = WebSiteSchema();

  // -------- Configs de franquicias y assets ---------
  const franchises = {
    diablo: {
      name: t('home.franchises.diablo', 'Diablo Universe'),
      color: 'bg-gradient-to-r from-red-600 to-orange-600',
      borderColor: 'border-red-500',
      hoverColor: 'hover:bg-red-500/20',
      games: ['Diablo 2 Resurrected', 'Diablo 3', 'Diablo 4', 'Diablo Immortal']
    },
    warcraft: {
      name: t('home.franchises.warcraft', 'Warcraft Universe'),
      color: 'bg-gradient-to-r from-blue-600 to-cyan-600',
      borderColor: 'border-blue-500',
      hoverColor: 'hover:bg-blue-500/20',
      games: ['World of Warcraft', 'World of Warcraft Classic', 'World of Warcraft Retail']
    },
    standalone: {
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
    'Last Epoch': '/images/games/last-epoch.png',
  };

  // ------------- Responsive featured services count ----------
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 640)
        setFeaturedCount(MAX_FEATURED_MOBILE);
      else if (window.innerWidth < 1024)
        setFeaturedCount(MAX_FEATURED_TABLET);
      else
        setFeaturedCount(MAX_FEATURED_DESKTOP);
    };
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ------------------ FETCH SERVICES -------------------
  const fetchServicesData = async () => {
    if (hasFetchedRef.current) { setLoading(false); return; }
    try {
      hasFetchedRef.current = true;
      setError(null);
      setLoading(true);
      const response = await axios.get('/boosts');
      const data = Array.isArray(response.data) ? response.data : [];
      const availableServices = data.filter(s => s.available !== false && s.isActive !== false);
      setServices(availableServices);
      setFilteredServices(availableServices);
    } catch {
      setError(t('errors.network.message'));
      setServices([]); setFilteredServices([]);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchServicesData(); }, []);

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

  // ------------ Helpers internos -------------
  const handleGameClick = (gameName) => {
    setSelectedFranchise(getGameFranchise(gameName, franchises));
    setSelectedGame(gameName);
    setTimeout(() => {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  const handleFranchiseClick = (franchiseKey) => {
    setSelectedFranchise(franchiseKey); setSelectedGame('');
    setTimeout(() => {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  const clearFilters = () => { setSelectedFranchise(''); setSelectedGame(''); };

  // ----------- Features destacados (sin iconos emoji) -----------
  const eliteFeatures = [
    { 
      title: t('home.features.elite.title', 'Go&boost Boosters'), 
      description: t('home.features.elite.description', 'We only work with the best, hand-picked boosters who have proven their skills and reliability through thousands of successful orders.') 
    },
    { 
      title: t('home.features.privacy.title', 'Total Privacy'), 
      description: t('home.features.privacy.description', 'Your connection and data are always encrypted and safe. Completely anonymous and secure process.') 
    },
    { 
      title: t('home.features.express.title', 'Express Service'), 
      description: t('home.features.express.description', 'We complete your order in record time, no bots, no cheats. Only real pro players boosting your account.') 
    },
    { 
      title: t('home.features.premium.title', 'Premium Experience'), 
      description: t('home.features.premium.description', 'Dedicated support and real-time updates. Not satisfied? We offer a full refund, no questions asked.') 
    }
  ];

  // -------------------------- RENDER ----------------------------
  return (
    <>
      <SEO title={t('seo.home.title')} description={t('seo.home.description')} keywords={t('seo.keywords')} schema={homeSchema}/>
      <div className="scroll-smooth">

        {/* HERO */}
        <section id="hero" className="min-h-[90vh] flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pt-20 pb-10 relative">
          {/* BG visuals, layers */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-black opacity-60" />
            <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-[100px] opacity-20 animate-pulse"/>
            <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur-[100px] opacity-20 animate-pulse" style={{animationDelay:"1.5s"}}/>
          </div>
          <div className="relative z-10 text-center w-full">
            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-900 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]">
                Go & Boost
              </span>
            </h1>
            <span className="block text-2xl md:text-3xl lg:text-5xl font-black bg-gradient-to-r from-white via-yellow-200 to-cyan-200 bg-clip-text text-transparent">
              {t('home.hero.unlock', 'UNLOCK YOUR')}
            </span>
            <img src="/images/logo-background.png" alt="GonBoost Logo" className="mx-auto w-28 md:w-40 xl:w-56 my-5 opacity-90"/>
            <span className="block text-2xl md:text-3xl lg:text-6xl font-black bg-gradient-to-r from-white via-yellow-200 to-cyan-200 bg-clip-text text-transparent">
              {t('home.hero.potential', 'TRUE POTENTIAL')}
            </span>
            <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed font-light px-4">
              {t('home.hero.description', 'Transform your gaming experience with our premium boosting service.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4 px-4">
              <a href="#games" className="w-full sm:w-auto group relative bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 px-6 py-3 xl:px-12 xl:py-5 rounded-xl font-bold text-base lg:text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-yellow-500/25">
                <span className="relative z-10">{t('home.hero.cta1', 'GAMES WE SUPPORT')}</span>
              </a>
              <a href="#features" className="w-full sm:w-auto border-2 border-cyan-400 hover:bg-cyan-400/10 text-cyan-300 hover:text-cyan-200 px-4 py-3 xl:px-10 xl:py-5 rounded-xl font-semibold text-base transition-all duration-300 backdrop-blur-sm">
                {t('home.hero.cta2', 'LEARN MORE')}
              </a>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-16 md:py-20 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-28 left-10 w-72 h-72 bg-cyan-500 rounded-full filter blur-3xl" />
            <div className="absolute bottom-36 right-16 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-yellow-400 to-cyan-400 bg-clip-text text-transparent">
                  {t('home.features.title', 'WHY CHOOSE GONBOOST')}
                </span>
              </h2>
              <p className="text-gray-300 text-lg md:text-xl font-light">{t('home.features.subtitle', 'Differences that define the premium experience')}</p>
              <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-cyan-400 mx-auto mt-6 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {eliteFeatures.map((feature, i) => (
                <div key={i} className="group bg-white/5 rounded-2xl p-6 md:p-8 border border-white/10 hover:border-cyan-400/50 transition duration-500 hover:-translate-y-2">
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <p className="text-gray-400 text-sm max-w-2xl mx-auto italic">
                {t('home.features.quote', '"More than just a boosting service. Behind every order is a commitment to excellence, security, and customer satisfaction. We understand the passion and dedication of gamers, and we\'re committed to helping you achieve the gaming experience you deserve."')}
              </p>
            </div>
          </div>
        </section>

        {/* GAMES */}
        <section id="games" className="py-10 md:py-18 bg-gradient-to-br from-gray-900 to-blue-900">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                {t('home.games.title1', 'PREMIUM')}{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{t('home.games.title2', 'GAMES')}</span>
              </h2>
              <div className="w-20 lg:w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-500 mx-auto mb-4" />
              <p className="text-base md:text-lg text-gray-300 max-w-xl mx-auto font-light">
                {t('home.games.subtitle', 'Explore our exclusive franchises and titles')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 lg:gap-4 mb-8">
              <button onClick={clearFilters}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base transition-transform duration-300 hover:scale-105 ${
                  !selectedFranchise 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/25' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm'
                }`}>
                🎮 {t('home.games.allGames', 'All Games')}
              </button>
              {Object.entries(franchises).filter(([k]) => k !== 'standalone').map(([key, franchise]) => (
                <button key={key} onClick={() => handleFranchiseClick(key)}
                  className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base transition-transform duration-300 hover:scale-105 border ${
                    selectedFranchise === key 
                      ? `${franchise.color} text-white shadow-2xl border-transparent`
                      : `bg-white/5 text-white/80 hover:bg-white/10 ${franchise.borderColor}`
                  }`}>
                  {franchise.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 max-w-7xl mx-auto mb-8">
              {allGames.map((game) => {
                const imageUrl = gameImages[game] || '/images/games/default.png';
                const fontClass = getGameFontClass(game);
                const franchiseKey = getGameFranchise(game, franchises);
                const franchiseData = getFranchiseData(franchiseKey, franchises);
                const isSelected = selectedGame === game || selectedFranchise === franchiseKey;
                return (
                  <div key={game}
                    className={`group relative aspect-[3/4] rounded-xl lg:rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
                      isSelected 
                        ? 'transform -translate-y-2 shadow-2xl scale-105 z-10' 
                        : 'hover:-translate-y-2 hover:shadow-2xl'
                    }`}
                    onClick={() => handleGameClick(game)}
                  >
                    <div className="absolute inset-0 w-full h-full">
                      <LazyImage src={imageUrl} alt={`${game} boosting services`} className="w-full h-full"/>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300"/>
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${franchiseData.hoverColor || 'bg-cyan-500/20'}`}/>
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-20">
                        <div className="bg-gradient-to-r from-green-400 to-cyan-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                          {t('home.games.selected', 'SELECTED')}
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 text-center z-10">
                      <h3 className={`text-white text-sm lg:text-base mb-1 ${fontClass} drop-shadow-lg`}>
                        {game}
                      </h3>
                    </div>
                    <div className={`absolute inset-0 border-2 rounded-xl lg:rounded-2xl transition-all duration-300 ${
                      isSelected ? `${franchiseData.borderColor || 'border-cyan-400'} border-2` : 'border-transparent group-hover:border-cyan-400/50'
                    }`}/>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-6">
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                {t('home.games.clickInstruction', 'Click on any game to explore its exclusive boosting services')}
              </p>
              <Link to={`/${currentLanguage === 'en' ? '' : currentLanguage + '/'}services`}
                className="inline-flex items-center mt-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 lg:px-10 py-3 lg:py-4 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105">
                {t('home.games.viewAll', 'VIEW ALL GAMES & SERVICES')}
              </Link>
            </div>
          </div>
        </section>

        {/* -------- FEATURED SERVICES -------- */}
        <section id="services" className="py-10 md:py-16 lg:py-24 bg-gradient-to-br from-blue-900 to-purple-900">
          <div className="container mx-auto px-2 sm:px-4">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
                <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  {t('home.services.featured', 'FEATURED')}
                </span>{' '}
                {t('home.services.title', 'SERVICES')}
              </h2>
              <div className="w-20 lg:w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto mb-4" />
              <p className="text-base md:text-lg xl:text-xl text-gray-300 max-w-xl lg:max-w-2xl mx-auto font-light">
                {t('home.services.glimpse', 'A glimpse of our premium offerings')}
              </p>
            </div>
            {loading
              ? <div className="flex justify-center py-10"><LoadingSpinner size="large" /></div>
              : error
                ? (<div className="text-center text-red-300">{error}</div>)
                : filteredServices.length === 0
                  ? (<div className="text-center text-white py-8">{t('home.services.noServices', 'NO SERVICES FOUND')}</div>)
                  : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                      {filteredServices.slice(0, featuredCount).map(service => {
                        const franchiseKey = getGameFranchise(service.game, franchises);
                        const franchiseData = getFranchiseData(franchiseKey, franchises);
                        const gameImage = gameImages[service.game] || '/images/games/default.png';
                        return (
                          <div key={service._id} className="group bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-950/95 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-cyan-400/50 transition duration-500 hover:-translate-y-2 hover:shadow-cyan-500/20 backdrop-blur-sm flex flex-col">
                            <div className="absolute top-3 left-3 z-20">
                              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1.5 ${franchiseData.color || 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}>
                                <span className="text-base">🎮</span>
                                <span className="text-white">{service.game}</span>
                              </div>
                            </div>
                            <div className="absolute top-3 right-3 z-20">
                              <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                                <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                                  {formatServiceType(service.serviceType)}
                                </span>
                              </div>
                            </div>
                            <div className="relative h-36 sm:h-40 overflow-hidden">
                              <LazyImage src={gameImage} alt={service.game} className="w-full h-full" objectFit="cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
                              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>
                            <div className="p-4 flex-auto flex flex-col">
                              <h3 className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300">
                                {service.name}
                              </h3>
                              <p className="text-gray-400 text-xs md:text-sm mb-3 line-clamp-2 min-h-[2.2rem]">{service.description}</p>
                              <div className="flex items-center text-xs text-gray-400 mb-3">
                                <span className="text-cyan-400 mr-2">⚡</span>
                                <span>{t('home.services.estimated', 'Estimated')}:</span>
                                <span className="text-white ml-1 font-medium">{service.estimatedTime}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-stretch justify-between mt-auto pt-2 border-t border-slate-700/50">
                                <div className="flex flex-col items-start mb-2 sm:mb-0">
                                  <span className="text-xs text-gray-500 uppercase tracking-wider">{t('common.price')}</span>
                                  <div className="flex items-baseline">
                                    <span className="text-xs text-gray-400 mr-0.5">$</span>
                                    <span className="text-xl font-black text-white font-mono tracking-tight">
                                      {service.price || service.basePrice}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-1">{t('common.usd')}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => {
                                      const slug = getServiceSlug(service);
                                      if (slug) {
                                        const prefix = currentLanguage === 'en' ? '' : `/${currentLanguage}`;
                                        navigate(`${prefix}/service/${slug}`);
                                      }
                                    }}
                                    className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-300"
                                  >
                                    {t('common.details', 'Details')}
                                  </button>
                                  <button
                                    onClick={() => { 
                                      const sid = getServiceId(service);
                                      if (sid) { 
                                        const prefix = currentLanguage === 'en' ? '' : `/${currentLanguage}`;
                                        navigate(`${prefix}/order/${sid}`); 
                                      }
                                    }}
                                    className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/30"
                                  >
                                    {t('home.services.orderNow', 'ORDER NOW')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
            <div className="text-center mt-6">
              <Link to={`/${currentLanguage === 'en' ? '' : currentLanguage + '/'}services`}
                className="inline-flex items-center bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105">
                {t('home.services.viewAllServices', 'VIEW ALL SERVICES')} →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;