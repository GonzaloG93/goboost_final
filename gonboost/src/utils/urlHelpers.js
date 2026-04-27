// frontend/src/utils/urlHelpers.js
// ✅ Utilidades para generar slugs amigables para SEO

/**
 * Genera un slug amigable para SEO a partir del nombre del servicio
 * Ejemplo: "TBC Starter Pack - Silver" → "tbc-starter-pack-silver-839b17f"
 */
export const generateServiceSlug = (service) => {
  if (!service) return '';
  
  const name = service.name || '';
  
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Eliminar caracteres especiales
    .replace(/\s+/g, '-')      // Reemplazar espacios por guiones
    .replace(/-+/g, '-')       // Evitar múltiples guiones
    .trim();
  
  const idSuffix = service._id?.slice(-6) || '';
  
  return `${slug}-${idSuffix}`;
};

/**
 * Extrae el ID del servicio desde un slug
 * Ejemplo: "tbc-starter-pack-silver-839b17f" → "839b17f"
 */
export const extractIdFromSlug = (slug) => {
  if (!slug) return null;
  
  // Si es un ID de MongoDB completo (24 caracteres hexadecimales)
  if (slug.match(/^[0-9a-fA-F]{24}$/)) {
    return slug;
  }
  
  // Si es un slug con guiones, extraer el último segmento
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  return lastPart;
};