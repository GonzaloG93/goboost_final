import React from 'react';
import { POE2_BUILDS } from '../config/buildsConfig';

export const BuildHeaderBanner = ({ currentBuildKey = 'poe2_build_starter' }) => {
  const currentBuild = POE2_BUILDS[currentBuildKey] || POE2_BUILDS['poe2_build_starter'];

  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 shadow-md mb-6 bg-slate-900">
      {/* Banner de Fondo con Gradiente */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={currentBuild.bannerImage || '/assets/banners/poe2-default.jpg'}
          alt={`${currentBuild.name} Banner`}
          className="h-full w-full object-cover object-center opacity-80 transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />
      </div>

      {/* Contenido Superpuesto */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
              Path of Exile 2
            </span>
            <span className="text-xs text-slate-400 font-medium">
              S Tier Build Config
            </span>
          </div>
          <h2 className="text-3xl font-black text-white drop-shadow-md">
            {currentBuild.name}
          </h2>
        </div>

        {/* Badge Informativo */}
        {currentBuild.allowDivineOrbs && (
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-950/80 px-3.5 py-2 border border-slate-800 text-xs text-emerald-300 backdrop-blur-md">
            <span className="text-base">💎</span>
            <span>Extra Divine Orbs Available</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildHeaderBanner;