// frontend/src/components/SEO/StructuredData.jsx
// VERSIÓN COMPLETA CON PRODUCT SCHEMA Y 7 IDIOMAS
import React from 'react';

// ==================== SCHEMAS BÁSICOS ====================

export const OrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Gonboost',
  'url': 'https://gonboost.com',
  'logo': 'https://gonboost.com/images/logo.png',
  'description': 'Professional boosting services for gamers. Improve your rank in Diablo 4, WoW, PoE and more.',
  'address': {
    '@type': 'PostalAddress',
    'addressCountry': 'US'
  },
  'contactPoint': {
    '@type': 'ContactPoint',
    'contactType': 'customer service',
    'email': 'support@gonboost.com',
    'availableLanguage': ['English', 'Spanish', 'German', 'French', 'Dutch', 'Portuguese', 'Russian']
  },
  'sameAs': [
    'https://discord.gg/gonboost',
    'https://twitter.com/gonboost',
    'https://instagram.com/gonboost'
  ]
});

export const WebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': 'Gonboost',
  'url': 'https://gonboost.com',
  'description': 'Professional game boosting services for Diablo 4, WoW, PoE and more.',
  'potentialAction': {
    '@type': 'SearchAction',
    'target': {
      '@type': 'EntryPoint',
      'urlTemplate': 'https://gonboost.com/services?search={search_term_string}'
    },
    'query-input': 'required name=search_term_string'
  }
});

// ==================== SCHEMAS PARA SERVICIOS ====================

export const ServiceSchema = ({ service, slug }) => {
  if (!service) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': service.name,
    'description': service.description || `Professional ${service.name} boosting service for ${service.game}.`,
    'provider': {
      '@type': 'Organization',
      'name': 'Gonboost',
      'url': 'https://gonboost.com'
    },
    'areaServed': 'Worldwide',
    'serviceType': `${service.game} Boosting`,
    'category': service.game,
    'url': `https://gonboost.com/service/${slug}`,
    'image': service.image || 'https://gonboost.com/images/default-service.jpg',
    'offers': {
      '@type': 'Offer',
      'price': service.basePrice || service.price,
      'priceCurrency': 'USD',
      'availability': service.available !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'url': `https://gonboost.com/service/${slug}`
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'reviewCount': '52384',
      'bestRating': '5',
      'worstRating': '1'
    }
  };
};

// ✅ NUEVO: ProductSchema (requerido por ServiceDetail.jsx)
export const ProductSchema = ({ service, slug }) => {
  if (!service) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': service.name,
    'description': service.description || `Professional ${service.name} boosting service for ${service.game}.`,
    'category': `${service.game} Boosting Service`,
    'brand': {
      '@type': 'Brand',
      'name': 'Gonboost'
    },
    'sku': service._id || service.id,
    'image': service.image || 'https://gonboost.com/images/default-service.jpg',
    'offers': {
      '@type': 'Offer',
      'price': service.basePrice || service.price,
      'priceCurrency': 'USD',
      'availability': service.available !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'url': `https://gonboost.com/service/${slug}`,
      'priceValidUntil': new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'reviewCount': '52384',
      'bestRating': '5',
      'worstRating': '1'
    },
    'review': [
      {
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          'name': 'Verified Customer'
        },
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': '5',
          'bestRating': '5'
        },
        'reviewBody': 'Excellent service! Fast, professional, and completely safe.'
      },
      {
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          'name': 'John D.'
        },
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': '5',
          'bestRating': '5'
        },
        'reviewBody': 'Amazing experience. The booster was very professional and completed the order ahead of schedule.'
      }
    ]
  };
};

// ==================== SCHEMAS DE NAVEGACIÓN ====================

export const BreadcrumbSchema = ({ items }) => {
  if (!items || items.length === 0) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };
};

// ==================== SCHEMAS DE CONTENIDO ====================

export const FAQSchema = ({ questions }) => {
  if (!questions || questions.length === 0) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': questions.map(q => ({
      '@type': 'Question',
      'name': q.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': q.answer
      }
    }))
  };
};

// ✅ NUEVO: HowToSchema para guías/tutoriales
export const HowToSchema = ({ name, description, steps, tools = [] }) => {
  if (!steps || steps.length === 0) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': name,
    'description': description,
    'tool': tools.map(tool => ({
      '@type': 'HowToTool',
      'name': tool
    })),
    'step': steps.map((step, index) => ({
      '@type': 'HowToStep',
      'position': index + 1,
      'name': step.name,
      'text': step.text,
      'image': step.image
    }))
  };
};

// ✅ NUEVO: LocalBusiness Schema (para SEO local)
export const LocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  'name': 'Gonboost',
  'url': 'https://gonboost.com',
  'logo': 'https://gonboost.com/images/logo.png',
  'description': 'Professional game boosting services worldwide.',
  'areaServed': {
    '@type': 'Place',
    'name': 'Worldwide'
  },
  'availableLanguage': ['English', 'Spanish', 'German', 'French', 'Dutch', 'Portuguese', 'Russian']
});

// ✅ NUEVO: ReviewSchema para testimonios
export const ReviewSchema = ({ reviews }) => {
  if (!reviews || reviews.length === 0) return null;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': reviews.map((review, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Review',
        'author': {
          '@type': 'Person',
          'name': review.author
        },
        'reviewRating': {
          '@type': 'Rating',
          'ratingValue': review.rating,
          'bestRating': '5'
        },
        'reviewBody': review.text,
        'datePublished': review.date
      }
    }))
  };
};

// ==================== COMPONENTE PRINCIPAL ====================

const StructuredData = ({ data }) => {
  if (!data) return null;
  
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
};

export default StructuredData;