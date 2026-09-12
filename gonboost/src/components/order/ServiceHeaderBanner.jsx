import React from 'react';

// Banner de imagen para CUALQUIER servicio (no solo PoE2 Builds).
// Las imágenes van en: frontend/public/assets/banners/<archivo>
// El campo service.bannerImage guarda solo el nombre de archivo (ej: "poe2-starter.jpg").
// Si el servicio no tiene bannerImage asignado, o la imagen no carga, usa el default.
const DEFAULT_BANNER = '/assets/banners/default-banner.jpg';

export const ServiceHeaderBanner = ({ service, icon, badgeLabel, extraBadge }) => {
  if (!service) return null;

  const bannerSrc = service.bannerImage
    ? (service.bannerImage.startsWith('http')
        ? service.bannerImage
        : `/assets/banners/${service.bannerImage}`)
    : DEFAULT_BANNER;

  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 shadow-md mb-6 bg-slate-900">
      {/* Imagen de fondo */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={bannerSrc}
          alt={`${service.name || 'Service'} Banner`}
          className="h-full w-full object-cover object-center opacity-80 transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            if (e.currentTarget.src.indexOf('default-banner') === -1) {
              e.currentTarget.src = DEFAULT_BANNER;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
      </div>

      {/* Contenido superpuesto */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-end justify-between gap-4 mb-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {service.game && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
                  {service.game}
                </span>
              )}
              {badgeLabel && (
                <span className="text-xs text-slate-300 font-medium">{badgeLabel}</span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-md flex items-center gap-2">
              {icon && <span>{icon}</span>}
              {service.name}
            </h2>
          </div>

          {extraBadge}
        </div>

        {service.description && (
          <p className="text-slate-200 text-sm max-w-2xl drop-shadow leading-relaxed">
            {service.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default ServiceHeaderBanner;
