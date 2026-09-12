// frontend/src/config/pricingSync.js
//
// Sincroniza los precios con la fuente única de verdad del backend
// (backend/config/pricingConfig.js, expuesto en GET /boosts/pricing-config).
//
// Llamar a syncPricingConfig() UNA VEZ al arrancar la app (ver instrucciones
// de integración). Si el fetch falla (API caída, offline, etc.) los valores
// hardcodeados en buildsConfig.js / gamesConfig.js quedan como fallback —
// el sitio sigue funcionando, solo que con los últimos precios "de build".
import axios from '../utils/axiosConfig';
import { CUSTOM_BUILD_CONFIG } from './buildsConfig';
import { THE_PIT_RUN_OPTIONS, THE_PIT_TIER_OPTIONS, THE_PIT_SERVICE_MODES, MOP_RAID_CONFIG } from './gamesConfig';

let syncPromise = null;
let synced = false;

const applyConfig = (cfg) => {
  if (!cfg) return;

  if (cfg.CUSTOM_BUILD_CONFIG) {
    CUSTOM_BUILD_CONFIG.basePrices = cfg.CUSTOM_BUILD_CONFIG.basePrices || CUSTOM_BUILD_CONFIG.basePrices;
    CUSTOM_BUILD_CONFIG.levelingOptions = cfg.CUSTOM_BUILD_CONFIG.levelingOptions || CUSTOM_BUILD_CONFIG.levelingOptions;
    CUSTOM_BUILD_CONFIG.divineOrbPriceUnit = cfg.CUSTOM_BUILD_CONFIG.divineOrbPriceUnit ?? CUSTOM_BUILD_CONFIG.divineOrbPriceUnit;
    CUSTOM_BUILD_CONFIG.divineOrbOptions = cfg.CUSTOM_BUILD_CONFIG.divineOrbOptions || CUSTOM_BUILD_CONFIG.divineOrbOptions;
    CUSTOM_BUILD_CONFIG.addons = cfg.CUSTOM_BUILD_CONFIG.addons || CUSTOM_BUILD_CONFIG.addons;
  }

  if (Array.isArray(cfg.THE_PIT_TIER_OPTIONS)) {
    THE_PIT_TIER_OPTIONS.length = 0;
    THE_PIT_TIER_OPTIONS.push(...cfg.THE_PIT_TIER_OPTIONS);
  }

  if (cfg.THE_PIT_RUN_OPTIONS) {
    Object.assign(THE_PIT_RUN_OPTIONS, cfg.THE_PIT_RUN_OPTIONS);
  }

  if (Array.isArray(cfg.THE_PIT_SERVICE_MODES)) {
    THE_PIT_SERVICE_MODES.length = 0;
    THE_PIT_SERVICE_MODES.push(...cfg.THE_PIT_SERVICE_MODES);
  }

  if (cfg.MOP_RAID_CONFIG) {
    Object.keys(MOP_RAID_CONFIG).forEach((key) => delete MOP_RAID_CONFIG[key]);
    Object.assign(MOP_RAID_CONFIG, cfg.MOP_RAID_CONFIG);
  }
};

export const syncPricingConfig = () => {
  // Evita disparar el fetch más de una vez aunque se llame desde varios componentes
  if (synced) return Promise.resolve(true);
  if (syncPromise) return syncPromise;

  syncPromise = axios
    .get('/boosts/pricing-config')
    .then(({ data }) => {
      if (data?.success && data.pricingConfig) {
        applyConfig(data.pricingConfig);
        synced = true;
        return true;
      }
      return false;
    })
    .catch((err) => {
      console.warn(
        '⚠️ No se pudo sincronizar la configuración de precios con el backend. Usando valores locales por defecto.',
        err?.message
      );
      return false;
    })
    .finally(() => {
      syncPromise = null;
    });

  return syncPromise;
};

export default syncPricingConfig;
