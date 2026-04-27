// frontend/src/pages/ServiceDetail.jsx - VERSIÓN MULTILINGÜE CON NAVEGACIÓN LOCALIZADA
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO/SEO';
import { ServiceSchema, BreadcrumbSchema, FAQSchema, ProductSchema } from '../components/SEO/StructuredData';
import { formatServiceType } from '../config/gamesConfig';
import { extractIdFromSlug, generateServiceSlug } from '../utils/urlHelpers';
import LazyImage from '../components/SEO/LazyImage';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import LocalizedLink from '../components/LocalizedLink';
import { 
  FaCheck, FaClock, FaShieldAlt, FaHeadset, FaArrowLeft, 
  FaShoppingCart, FaStar, FaUndo, FaChevronRight, FaQuestionCircle, 
  FaGamepad, FaRocket, FaUsers, FaCheckCircle, FaCrown, FaBolt
} from 'react-icons/fa';

// ✅ Colores por juego
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

const getGameIcon = (game) => {
  const icons = {
    'Diablo 4': '😈',
    'Diablo 3': '👹',
    'Diablo 2 Resurrected': '💀',
    'World of Warcraft Retail': '🐉',
    'World of Warcraft Classic': '⚔️',
    'Path of Exile': '🍂',
    'Path of Exile 2': '🌑',
    'Last Epoch': '⏳',
  };
  return icons[game] || '🎮';
};

const getGameBgClass = (game) => {
  const bgColors = {
    'Diablo 4': 'from-red-950/50 via-gray-900 to-gray-900',
    'World of Warcraft Classic': 'from-amber-950/50 via-gray-900 to-gray-900',
    'World of Warcraft Retail': 'from-blue-950/50 via-gray-900 to-gray-900',
  };
  return bgColors[game] || 'from-gray-900 via-gray-900 to-gray-900';
};

const ServiceDetail = () => {
  const { t, i18n } = useTranslation();
  const { serviceId } = useParams();
  const navigate = useLocalizedNavigate(); // ✅ Navegación localizada
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedServices, setRelatedServices] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);
  const [error, setError] = useState(null);

  const actualId = extractIdFromSlug(serviceId);
  const serviceSlug = service ? generateServiceSlug(service) : '';
  const gameColor = service ? getGameColor(service.game) : 'from-blue-600 to-indigo-600';
  const bgGradient = service ? getGameBgClass(service.game) : 'from-gray-900 to-gray-900';
  const currentLanguage = i18n.language;

  useEffect(() => {
    if (actualId) fetchService();
    window.scrollTo(0, 0);
  }, [serviceId, actualId]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/boosts/${actualId}`);
      const serviceData = response.data;
      
      if (response.data.success === false) {
        throw new Error(response.data.message || t('common.error'));
      }
      
      setService(serviceData);
      
      if (serviceData?.game) {
        try {
          const relatedResponse = await axios.get(`/boosts?game=${encodeURIComponent(serviceData.game)}&limit=4`);
          setRelatedServices(relatedResponse.data || []);
        } catch (error) {
          console.log('No related services found');
        }
      }
    } catch (error) {
      console.error('Error loading service:', error);
      setError(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOrderNow = useCallback(() => {
    if (!service?._id) return;
    navigate(`/order/${service._id}`, { 
      state: { fixedPrice: service?.basePrice || service?.price } 
    });
  }, [navigate, service]);

  // ✅ SEO optimizado
  const getSeoData = () => {
    if (!service) return null;
    
    const gameName = service.game;
    const serviceName = service.name;
    const price = service.basePrice || service.price;
    
    const title = t('seo.serviceDetail.title', { 
      serviceName, 
      game: gameName 
    });
    
    const description = t('seo.serviceDetail.description', { 
      serviceName, 
      game: gameName 
    }) + ` ${t('seo.serviceDetail.priceFrom')} $${price}. ${t('seo.serviceDetail.fastDelivery')}`;
    
    const keywords = [
      gameName.toLowerCase(),
      'boosting',
      'boost',
      service.serviceType?.toLowerCase(),
      `${gameName.toLowerCase()} boost`,
      `${gameName.toLowerCase()} boosting`,
      'buy boost',
      'professional boosting',
      'safe boost',
      'fast delivery',
      'gonboost'
    ].filter(Boolean).join(', ');
    
    // La canonical se construye con el idioma actual
    const canonicalPath = `/${currentLanguage === 'en' ? '' : currentLanguage + '/'}service/${serviceSlug}`;
    
    return {
      title,
      description,
      keywords,
      canonical: canonicalPath,
      ogImage: `/images/og-${gameName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      ogType: 'product',
      twitterCard: 'summary_large_image'
    };
  };

  const seoData = getSeoData();

  // ✅ Schemas para SEO
  const serviceSchema = service ? ServiceSchema({ service, slug: serviceSlug }) : null;
  const productSchema = service ? ProductSchema({ service, slug: serviceSlug }) : null;
  
  const breadcrumbSchema = service ? BreadcrumbSchema({
    items: [
      { name: t('navigation.home'), url: 'https://gonboost.com' },
      { name: t('navigation.services'), url: 'https://gonboost.com/services' },
      { name: service.game, url: `https://gonboost.com/services?game=${encodeURIComponent(service.game)}` },
      { name: service.name, url: `https://gonboost.com/service/${serviceSlug}` }
    ]
  }) : null;
  
  const faqQuestions = service ? [
    { 
      question: t('serviceDetail.faq.howLong', { serviceName: service.name }), 
      answer: t('serviceDetail.faq.howLongAnswer', { time: service.estimatedTime || '24-48 hours' })
    },
    { 
      question: t('serviceDetail.faq.isSafe'), 
      answer: t('serviceDetail.faq.isSafeAnswer')
    },
    { 
      question: t('serviceDetail.faq.canPlay'), 
      answer: t('serviceDetail.faq.canPlayAnswer')
    },
    { 
      question: t('serviceDetail.faq.guarantee'), 
      answer: t('serviceDetail.faq.guaranteeAnswer')
    },
    { 
      question: t('serviceDetail.faq.payment'), 
      answer: t('serviceDetail.faq.paymentAnswer')
    }
  ] : [];
  
  const faqSchema = service ? FAQSchema({ questions: faqQuestions }) : null;

  const combinedSchema = { 
    ...(serviceSchema || {}), 
    ...(productSchema || {}),
    ...(faqSchema || {}), 
    ...(breadcrumbSchema || {}) 
  };

  const guarantees = service ? [
    { 
      icon: FaShieldAlt, 
      title: t('serviceDetail.guarantees.secure.title'), 
      desc: t('serviceDetail.guarantees.secure.desc'), 
      color: 'from-blue-600 to-cyan-600' 
    },
    { 
      icon: FaHeadset, 
      title: t('serviceDetail.guarantees.support.title'), 
      desc: t('serviceDetail.guarantees.support.desc'), 
      color: 'from-green-600 to-emerald-600' 
    },
    { 
      icon: FaClock, 
      title: t('serviceDetail.guarantees.fast.title'), 
      desc: t('serviceDetail.guarantees.fast.desc', { time: service.estimatedTime || '2-5 days' }), 
      color: 'from-orange-600 to-amber-600' 
    },
    { 
      icon: FaUndo, 
      title: t('serviceDetail.guarantees.refund.title'), 
      desc: t('serviceDetail.guarantees.refund.desc'), 
      color: 'from-purple-600 to-pink-600' 
    },
  ] : [];

  const stats = service ? [
    { icon: FaCheckCircle, value: '99.9%', label: t('serviceDetail.completionRate'), color: 'text-green-400' },
    { icon: FaUsers, value: '52K+', label: t('serviceDetail.ordersCompleted'), color: 'text-blue-400' },
    { icon: FaCrown, value: '4.9/5', label: t('serviceDetail.customerRating'), color: 'text-yellow-400' },
    { icon: FaBolt, value: '24/7', label: t('serviceDetail.supportAvailable'), color: 'text-cyan-400' },
  ] : [];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">{t('common.loading')}</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !service) {
    return (
      <>
        <Navbar />
        <SEO 
          title={t('errors.404.title')} 
          description={t('errors.404.message')} 
          noIndex 
        />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-4">{t('serviceDetail.notFound')}</h2>
            <button 
              onClick={() => navigate('/services')} 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
            >
              {t('serviceDetail.browseAllServices')}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {seoData && (
        <SEO 
          title={seoData.title}
          description={seoData.description}
          canonical={seoData.canonical}
          ogType={seoData.ogType}
          ogImage={seoData.ogImage}
          twitterCard={seoData.twitterCard}
          schema={combinedSchema}
          keywords={seoData.keywords}
        />
      )}
      
      <Navbar />
      <div className={`min-h-screen bg-gradient-to-br ${bgGradient} pt-20 pb-12`}>
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Breadcrumb */}
          <div className="mb-6">
            <button 
              onClick={() => navigate('/services')} 
              className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors group"
            >
              <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform" />
              {t('serviceDetail.backToServices')}
            </button>
          </div>

          {/* Hero Section */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 border border-gray-700">
            <div className={`h-2 bg-gradient-to-r ${gameColor}`}></div>
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 p-8 md:p-12">
              
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 backdrop-blur-sm text-cyan-300 rounded-full text-sm font-medium border border-gray-600">
                  <FaGamepad className="text-cyan-400" />
                  {service.game}
                </span>
                <span className="px-3 py-1.5 bg-gray-700/50 backdrop-blur-sm text-gray-300 rounded-full text-sm font-medium border border-gray-600">
                  {formatServiceType(service.serviceType)}
                </span>
                <span className="flex items-center gap-1 px-3 py-1.5 bg-yellow-400/10 backdrop-blur-sm text-yellow-300 rounded-full text-sm border border-yellow-500/30">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="text-yellow-400 text-xs" />
                  ))}
                  <span className="ml-1">{t('serviceDetail.reviewsCount', { count: '52K+' })}</span>
                </span>
              </div>
              
              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight text-white">
                {service.name}
              </h1>
              
              {/* Description */}
              <p className="text-xl text-gray-300 mb-6 max-w-3xl">
                {service.description}
              </p>
              
              {/* Price & CTA */}
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">
                    {t('serviceDetail.startingAt')}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                      ${service.basePrice || service.price}
                    </span>
                    <span className="text-gray-400">{t('common.usd')}</span>
                  </div>
                </div>
                <button 
                  onClick={handleOrderNow} 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:scale-105 flex items-center gap-3"
                >
                  <FaShoppingCart className="text-xl" />
                  {t('serviceDetail.orderNow')}
                  <FaChevronRight className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 flex items-center gap-3 hover:border-cyan-500/50 transition-all">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                  <stat.icon className={stat.color} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Features */}
              {service.features && service.features.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 md:p-8 hover:border-cyan-500/50 transition-all">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className={`w-10 h-10 bg-gradient-to-r ${gameColor} rounded-xl flex items-center justify-center`}>
                      <FaRocket className="text-white" />
                    </span>
                    {t('serviceDetail.whatsIncluded')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {service.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-700 hover:border-cyan-500/30 transition-all">
                        <FaCheck className="text-green-400 mt-1 flex-shrink-0" />
                        <span className="text-gray-300">
                          {typeof feature === 'string' ? feature : feature.name || feature.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {service.requirements && service.requirements.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 md:p-8 hover:border-amber-500/50 transition-all">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <FaCheck className="text-white" />
                    </span>
                    {t('serviceDetail.requirements')}
                  </h2>
                  <ul className="space-y-3">
                    {service.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-700">
                        <span className="text-amber-400 font-bold">•</span>
                        <span className="text-gray-300">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQ Section */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 md:p-8 hover:border-purple-500/50 transition-all">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <FaQuestionCircle className="text-white" />
                  </span>
                  {t('serviceDetail.faq.title')}
                </h2>
                <div className="space-y-3">
                  {faqQuestions.map((faq, i) => (
                    <div key={i} className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900/30">
                      <button 
                        onClick={() => setActiveFaq(activeFaq === i ? null : i)} 
                        className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-800 transition-colors"
                      >
                        <span className="font-medium text-white">{faq.question}</span>
                        <FaChevronRight className={`text-gray-400 transition-transform ${activeFaq === i ? 'rotate-90' : ''}`} />
                      </button>
                      {activeFaq === i && (
                        <div className="p-4 bg-gray-800/50 border-t border-gray-700">
                          <p className="text-gray-300">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Info Cards */}
            <div className="space-y-6">
              
              {/* Guarantees */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 lg:sticky lg:top-24 hover:border-cyan-500/50 transition-all">
                <h3 className="text-xl font-bold text-white mb-4">{t('serviceDetail.whyChoose')}</h3>
                <div className="space-y-4">
                  {guarantees.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-700 hover:border-cyan-500/30 transition-all">
                      <div className={`w-10 h-10 bg-gradient-to-r ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Order Card */}
                <div className={`mt-6 bg-gradient-to-br ${gameColor} rounded-xl p-5 text-white`}>
                  <h4 className="text-lg font-bold mb-2">{t('serviceDetail.readyToStart')}</h4>
                  <p className="text-white/80 text-sm mb-4">{t('serviceDetail.readyDesc')}</p>
                  <button 
                    onClick={handleOrderNow} 
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 py-3 rounded-xl font-bold transition-all"
                  >
                    {t('serviceDetail.orderNow')} • ${service.basePrice || service.price}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Services */}
          {relatedServices.length > 1 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                {t('serviceDetail.moreFrom')} {service.game}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedServices.filter(s => s._id !== service._id).slice(0, 3).map(rs => {
                  const slug = generateServiceSlug(rs);
                  const rsColor = getGameColor(rs.game);
                  return (
                    <LocalizedLink 
                      key={rs._id} 
                      to={`/service/${slug}`}
                      className="group relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-cyan-400 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className={`h-1.5 bg-gradient-to-r ${rsColor}`}></div>
                      <div className="p-6">
                        <p className="font-bold text-white group-hover:text-cyan-300 transition-colors">{rs.name}</p>
                        <p className="text-sm text-gray-400 mt-1">{formatServiceType(rs.serviceType)}</p>
                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mt-3">
                          ${rs.basePrice || rs.price}
                        </p>
                        <div className="flex items-center text-cyan-400 mt-3 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          {t('serviceDetail.viewDetails')} <FaChevronRight className="ml-1 text-xs" />
                        </div>
                      </div>
                    </LocalizedLink>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ServiceDetail;