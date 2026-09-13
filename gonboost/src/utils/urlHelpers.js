// frontend/src/utils/urlHelpers.js
// ✅ Utilidades para generar slugs amigables para SEO

/**
 * Genera un slug amigable para SEO a partir del nombre del servicio
 * Ejemplo: "TBC Starter Pack - Silver" → "tbc-starter-pack-silver-69dd1f4a1565fa0e839b17e5"
 *
 * ⚠️ Importante: guardamos el _id COMPLETO (24 caracteres hex), no un
 * pedazo — si se recorta, después no hay forma de reconstruirlo para
 * buscar el servicio real en la base de datos.
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

  const rawId = service._id || service.id;
  const id = rawId ? (typeof rawId === 'object' ? rawId.toString() : String(rawId)) : '';

  return id ? `${slug}-${id}` : slug;
};

/**
 * Extrae el ID del servicio desde un slug.
 * Busca los últimos 24 caracteres hexadecimales del string (el formato de
 * un ObjectId de Mongo), sin importar qué tan largo o raro sea el resto
 * del slug generado a partir del nombre.
 *
 * Ejemplo: "tbc-starter-pack-silver-69dd1f4a1565fa0e839b17e5"
 *          → "69dd1f4a1565fa0e839b17e5"
 */
export const extractIdFromSlug = (slug) => {
  if (!slug) return null;

  // Si ya es un ID de Mongo completo, devolverlo tal cual
  if (/^[0-9a-fA-F]{24}$/.test(slug)) {
    return slug;
  }

  // Buscar 24 caracteres hex al final del slug (el _id completo)
  const match = slug.match(/[0-9a-fA-F]{24}$/);
  if (match) {
    return match[0];
  }

  // Fallback: si no se encontró un ID válido, devolver el slug tal cual
  // (mejor que devolver null y romper todo silenciosamente)
  return slug;
};