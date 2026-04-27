// frontend/src/components/SEO/LazyImage.jsx
// VERSIÓN CORREGIDA - fetchpriority en minúsculas
import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * Componente para lazy loading de imágenes optimizado para SEO y Core Web Vitals
 * @param {string} src - URL de la imagen
 * @param {string} alt - Texto alternativo (IMPORTANTE para SEO)
 * @param {number} width - Ancho de la imagen
 * @param {number} height - Alto de la imagen
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} priority - Si es true, carga la imagen con prioridad (para LCP)
 * @param {string} objectFit - 'cover' o 'contain'
 * @param {string} sizes - Atributo sizes para responsive images
 * @param {string} srcSet - Atributo srcset para responsive images
 */
const LazyImage = ({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  placeholder = null,
  objectFit = 'cover',
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  srcSet,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(priority);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Placeholder SVG inline para evitar peticiones extra
  const svgPlaceholder = useMemo(() => {
    const svgString = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle" dy=".3em">Loading...</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
  }, [width, height]);

  // Observer para lazy loading
  useEffect(() => {
    const currentRef = imgRef.current;
    if (!currentRef || priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(currentRef);
        }
      },
      { 
        rootMargin: '200px',
        threshold: 0.01 
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error(`Error loading image: ${src}`);
    setHasError(true);
    setIsLoaded(true);
  };

  // Determinar la fuente de la imagen
  const imageSource = hasError 
    ? svgPlaceholder 
    : (isInView ? src : svgPlaceholder);

  // ✅ Props condicionales para evitar warnings
  const imgProps = {
    src: imageSource,
    alt: alt,
    width: width,
    height: height,
    sizes: sizes,
    className: `w-full h-full transition-all duration-500 ${
      isLoaded && !hasError ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
    } ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`,
    onLoad: handleLoad,
    onError: handleError,
    loading: priority ? 'eager' : 'lazy',
    decoding: 'async',
    ...props
  };

  // ✅ Añadir fetchpriority solo si es priority (en minúsculas)
  if (priority) {
    imgProps.fetchpriority = 'high';
  }

  // ✅ Añadir srcSet solo si está disponible
  if (isInView && !hasError && srcSet) {
    imgProps.srcSet = srcSet;
  }

  return (
    <div 
      ref={imgRef} 
      className={`lazy-image-container ${className} relative overflow-hidden bg-slate-800`}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      <img {...imgProps} />

      {/* Loading Spinner */}
      {!isLoaded && !priority && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Fallback para placeholder personalizado */}
      {placeholder && !isLoaded && (
        <div className="absolute inset-0">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default LazyImage;