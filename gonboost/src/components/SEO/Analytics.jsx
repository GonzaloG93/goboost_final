// frontend/src/components/SEO/Analytics.jsx
// VERSIÓN COMPLETA CON GA4, GTM, YANDEX METRICA Y CLARITY
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente para Analytics (GA4, GTM, Yandex Metrica, Microsoft Clarity)
 * Soporta tracking de pageviews y eventos personalizados
 */
const Analytics = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // IDs desde variables de entorno
  const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_ID || '';
  const GTM_ID = import.meta.env.VITE_GTM_ID || '';
  const YANDEX_METRICA_ID = import.meta.env.VITE_YANDEX_METRICA_ID || '';
  const CLARITY_ID = import.meta.env.VITE_CLARITY_ID || '';
  
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;

  // ✅ Pageview tracking en GA4, GTM y Yandex
  useEffect(() => {
    if (!isProduction) {
      console.log('📊 [Analytics] Pageview (dev):', location.pathname);
      return;
    }

    const pageData = {
      page_title: document.title,
      page_location: window.location.href,
      page_path: location.pathname + location.search,
      page_referrer: document.referrer,
      user_id: user?.id || undefined,
      language: document.documentElement.lang || 'en'
    };

    // Google Analytics 4
    if (window.gtag && GA_MEASUREMENT_ID) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        ...pageData,
        send_page_view: true
      });
    }
    
    // Google Tag Manager
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'virtual_pageview',
        page: {
          title: document.title,
          url: window.location.href,
          path: location.pathname
        },
        user: user ? {
          id: user.id,
          role: user.role
        } : null
      });
    }

    // Yandex Metrica
    if (window.ym && YANDEX_METRICA_ID) {
      window.ym(YANDEX_METRICA_ID, 'hit', location.pathname + location.search, {
        title: document.title,
        referer: document.referrer
      });
    }

    // Microsoft Clarity
    if (window.clarity && CLARITY_ID) {
      window.clarity('set', 'page', location.pathname);
      if (user) {
        window.clarity('set', 'user_id', user.id);
        window.clarity('set', 'user_role', user.role);
      }
    }
  }, [location, GA_MEASUREMENT_ID, YANDEX_METRICA_ID, CLARITY_ID, user, isProduction]);

  // ✅ Inicialización de Yandex Metrica
  const yandexMetricaScript = YANDEX_METRICA_ID ? `
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    ym(${YANDEX_METRICA_ID}, "init", {
      clickmap:true,
      trackLinks:true,
      accurateTrackBounce:true,
      webvisor:true,
      trackHash:true,
      ecommerce:true
    });
  ` : '';

  // ✅ Inicialización de Microsoft Clarity
  const clarityScript = CLARITY_ID ? `
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${CLARITY_ID}");
  ` : '';

  // ✅ GA4 Script
  const ga4Script = GA_MEASUREMENT_ID ? `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure',
      cookie_domain: 'auto',
      cookie_expires: 63072000
    });
  ` : '';

  // ✅ GTM Script
  const gtmScript = GTM_ID ? `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${GTM_ID}');
  ` : '';

  // Si estamos en desarrollo, solo mostrar un placeholder
  if (isDevelopment) {
    return (
      <>
        {/* Desarrollo: No se cargan scripts de analytics */}
        <script dangerouslySetInnerHTML={{
          __html: `console.log('📊 Analytics en modo desarrollo - No se envian datos reales');`
        }} />
      </>
    );
  }

  // Si no hay IDs configurados en producción, no renderizar nada
  if (isProduction && !GA_MEASUREMENT_ID && !GTM_ID && !YANDEX_METRICA_ID && !CLARITY_ID) {
    console.warn('⚠️ No analytics IDs configured');
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 */}
      {GA_MEASUREMENT_ID && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
          <script dangerouslySetInnerHTML={{ __html: ga4Script }} />
        </>
      )}
      
      {/* Google Tag Manager */}
      {GTM_ID && (
        <>
          <script dangerouslySetInnerHTML={{ __html: gtmScript }} />
          <noscript>
            <iframe 
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0" 
              width="0" 
              style={{ display: 'none', visibility: 'hidden' }}
              title="GTM"
            />
          </noscript>
        </>
      )}

      {/* Yandex Metrica */}
      {YANDEX_METRICA_ID && (
        <>
          <script dangerouslySetInnerHTML={{ __html: yandexMetricaScript }} />
          <noscript>
            <div>
              <img 
                src={`https://mc.yandex.ru/watch/${YANDEX_METRICA_ID}`} 
                style={{ position: 'absolute', left: '-9999px' }} 
                alt=""
              />
            </div>
          </noscript>
        </>
      )}

      {/* Microsoft Clarity */}
      {CLARITY_ID && (
        <script dangerouslySetInnerHTML={{ __html: clarityScript }} />
      )}
    </>
  );
};

// ✅ Exportar funciones helper para eventos personalizados
export const analyticsEvents = {
  // Evento de compra iniciada
  beginCheckout: (orderData) => {
    if (!import.meta.env.PROD) {
      console.log('📊 [Analytics] begin_checkout:', orderData);
      return;
    }
    
    // GA4
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: orderData.total,
        items: orderData.items,
        coupon: orderData.coupon || undefined
      });
    }
    
    // GTM
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'begin_checkout',
        ecommerce: {
          currency: 'USD',
          value: orderData.total,
          items: orderData.items
        }
      });
    }
    
    // Yandex Metrica
    if (window.ym) {
      window.ym(import.meta.env.VITE_YANDEX_METRICA_ID, 'reachGoal', 'begin_checkout', {
        order_price: orderData.total,
        currency: 'USD'
      });
    }
  },

  // Evento de compra completada
  purchase: (orderData) => {
    if (!import.meta.env.PROD) {
      console.log('📊 [Analytics] purchase:', orderData);
      return;
    }
    
    // GA4
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: orderData.orderId,
        value: orderData.total,
        currency: 'USD',
        items: orderData.items,
        coupon: orderData.coupon || undefined
      });
    }
    
    // GTM
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'purchase',
        ecommerce: {
          transaction_id: orderData.orderId,
          value: orderData.total,
          currency: 'USD',
          items: orderData.items
        }
      });
    }
    
    // Yandex Metrica
    if (window.ym) {
      window.ym(import.meta.env.VITE_YANDEX_METRICA_ID, 'reachGoal', 'purchase', {
        order_id: orderData.orderId,
        order_price: orderData.total,
        currency: 'USD'
      });
    }
  },

  // Evento de añadir al carrito
  addToCart: (serviceData) => {
    if (!import.meta.env.PROD) {
      console.log('📊 [Analytics] add_to_cart:', serviceData);
      return;
    }
    
    // GA4
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: serviceData.price,
        items: [{
          item_id: serviceData.id,
          item_name: serviceData.name,
          price: serviceData.price,
          item_category: serviceData.game
        }]
      });
    }
    
    // Yandex Metrica
    if (window.ym) {
      window.ym(import.meta.env.VITE_YANDEX_METRICA_ID, 'reachGoal', 'add_to_cart', {
        product_id: serviceData.id,
        product_name: serviceData.name,
        price: serviceData.price
      });
    }
  },

  // Evento de registro
  signUp: (method = 'email') => {
    if (!import.meta.env.PROD) {
      console.log('📊 [Analytics] sign_up:', method);
      return;
    }
    
    if (window.gtag) {
      window.gtag('event', 'sign_up', { method });
    }
    
    if (window.ym) {
      window.ym(import.meta.env.VITE_YANDEX_METRICA_ID, 'reachGoal', 'sign_up');
    }
  },

  // Evento de login
  login: (method = 'email') => {
    if (!import.meta.env.PROD) {
      console.log('📊 [Analytics] login:', method);
      return;
    }
    
    if (window.gtag) {
      window.gtag('event', 'login', { method });
    }
  },

  // Evento de búsqueda
  search: (searchTerm) => {
    if (!import.meta.env.PROD) {
      console.log('📊 [Analytics] search:', searchTerm);
      return;
    }
    
    if (window.gtag) {
      window.gtag('event', 'search', { search_term: searchTerm });
    }
  },

  // Evento de cambio de idioma
  languageChange: (language) => {
    if (!import.meta.env.PROD) {
      console.log('📊 [Analytics] language_change:', language);
      return;
    }
    
    if (window.gtag) {
      window.gtag('event', 'language_change', { language });
    }
  }
};

export default Analytics;