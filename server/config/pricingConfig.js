// backend/config/pricingConfig.js
// ÚNICA FUENTE DE VERDAD PARA TODOS LOS PRECIOS DEL SITIO.
//
// Para cambiar un precio: editá este archivo y redeployá SOLO el backend.
// El frontend lee estos mismos valores en tiempo de ejecución vía
// GET /api/boosts/pricing-config (ver routes/boosts.js) — no hace falta
// tocar ni redeployar el frontend.

export const MAX_LEVELS = {
  'Diablo 4': { 'leveling': 60, 'powerleveling': 60, 'paragon_leveling': 300, 'default': 100 },
  'Diablo 3': { 'leveling': 70, 'powerleveling': 70, 'paragon_leveling': 20000, 'default': 70 },
  'Diablo 2 Resurrected': { 'leveling': 99, 'powerleveling': 99, 'default': 99 },
  'Diablo Immortal': { 'leveling': 60, 'powerleveling': 60, 'paragon_leveling': 999, 'default': 60 },
  'World of Warcraft Retail': { 'leveling': 80, 'powerleveling': 80, 'default': 80 },
  'World of Warcraft Classic': { 'leveling': 85, 'powerleveling': 85, 'default': 85 },
  'Path of Exile': { 'leveling': 100, 'powerleveling': 100, 'default': 100 },
  'Path of Exile 2': { 'leveling': 100, 'powerleveling': 100, 'poe2_leveling_40': 40, 'poe2_leveling_70': 70, 'poe2_leveling_90': 90, 'default': 100 },
  'Dune Awakening': { 'leveling': 200, 'powerleveling': 200, 'default': 200 },
  'Last Epoch': { 'leveling': 100, 'powerleveling': 100, 'default': 100 }
};

export const PRICE_PER_LEVEL = {
  'Diablo 4': { 'leveling': 0.17, 'powerleveling': 0.17, 'default': 0.17 },
  'Diablo 3': { 'leveling': 0.8, 'powerleveling': 0.8, 'paragon_leveling': 0.05, 'default': 0.8 },
  'Diablo 2 Resurrected': { 'leveling': 2.0, 'powerleveling': 2.0, 'default': 2.0 },
  'Diablo Immortal': { 'leveling': 1.2, 'powerleveling': 1.2, 'paragon_leveling': 0.08, 'default': 1.2 },
  'World of Warcraft Retail': { 'leveling': 3.5, 'powerleveling': 3.5, 'default': 3.5 },
  'World of Warcraft Classic': { 'leveling': 4.0, 'powerleveling': 4.0, 'default': 4.0 },
  'Path of Exile': { 'leveling': 1.2, 'powerleveling': 1.2, 'default': 1.2 },
  'Path of Exile 2': { 'leveling': 1.5, 'powerleveling': 1.5, 'poe2_leveling_40': 0.6, 'poe2_leveling_70': 0.8, 'poe2_leveling_90': 1.0, 'default': 1.5 },
  'Dune Awakening': { 'leveling': 1.80, 'powerleveling': 1.80, 'default': 1.80 },
  'Last Epoch': { 'leveling': 1.0, 'powerleveling': 1.0, 'default': 1.0 }
};

export const PARAGON_TIERS_D4 = [
  { min: 1, max: 100, pricePerLevel: 0.10 },
  { min: 101, max: 200, pricePerLevel: 0.50 },
  { min: 201, max: 300, pricePerLevel: 2.60 }
];

export const PARAGON_TIERS_D3 = [
  { min: 1, max: 1000, pricePerLevel: 0.05 },
  { min: 1001, max: 5000, pricePerLevel: 0.03 },
  { min: 5001, max: 20000, pricePerLevel: 0.02 }
];

export const DUNE_LEVELING_TIERS = [
  { min: 1, max: 100, pricePerLevel: 1.20 },
  { min: 101, max: 150, pricePerLevel: 1.80 },
  { min: 151, max: 200, pricePerLevel: 3.00 }
];

// Path of Exile 2 - Custom Build (categoría + leveling + Divine Orbs + addons)
export const CUSTOM_BUILD_CONFIG = {
  basePrices: {
    'Early-game': 142.5,
    'Mid-game': 285,
    'End-game': 380,
    'Uber': 760
  },
  levelingOptions: [
    { id: 'none', label: 'Do not include Leveling (Gear/Build only)', price: 0 },
    { id: 'lvl_70', label: 'Leveling to 70', price: 60 },
    { id: 'lvl_80', label: 'Leveling to 80', price: 70 },
    { id: 'lvl_90', label: 'Leveling to 90', price: 120 }
  ],
  divineOrbPriceUnit: 0.65,
  divineOrbOptions: [
    { count: 0 },
    { count: 5 },
    { count: 10 },
    { count: 20 },
    { count: 30 },
    { count: 40 },
    { count: 50 },
    { count: 60 },
    { count: 70 },
    { count: 80 },
    { count: 90 },
    { count: 100 },
    { count: 120 },
    { count: 150 },
    { count: 200 },
    { count: 300 },
    { count: 400 },
    { count: 500 }
  ],
  addons: [
    { id: 'ascendancy_all', name: 'Get All 8 Ascendancy Points', price: 9.5 }
  ]
};

// Diablo 4 - The Pit Artificer
export const THE_PIT_RUN_OPTIONS = {
  min: 1,
  max: 100,
  default: 10,
  discounts: [
    { min: 1, max: 9, discount: 0 },
    { min: 10, max: 24, discount: 5 },
    { min: 25, max: 49, discount: 10 },
    { min: 50, max: 99, discount: 12 },
    { min: 100, max: 100, discount: 15 }
  ]
};

export const THE_PIT_TIER_OPTIONS = [
  { value: 'tier1', label: 'Tier 1-20', basePricePerRun: 0.89, description: 'Easy tiers, quick runs' },
  { value: 'tier2', label: 'Tier 21-40', basePricePerRun: 1.49, description: 'Moderate difficulty' },
  { value: 'tier3', label: 'Tier 41-60', basePricePerRun: 1.89, description: 'Challenging' },
  { value: 'tier4', label: 'Tier 61-80', basePricePerRun: 2, description: 'Hard' },
  { value: 'tier5', label: 'Tier 81-100', basePricePerRun: 2.49, description: 'Very hard, high loot' },
  { value: 'tier6', label: 'Tier 101-120', basePricePerRun: 3.99, description: 'Elite difficulty' },
  { value: 'tier7', label: 'Tier 121-150', basePricePerRun: 5.99, description: 'Endgame pushing' }
];

export const THE_PIT_SERVICE_MODES = [
  { value: 'self', label: 'Self-Play (You play - we carry)', priceMultiplier: 1.0 },
  { value: 'piloted', label: 'Piloted (Account sharing)', priceMultiplier: 1.0 }
];

// Diablo 4 - Boss Killing
export const D4_BOSS_OPTIONS = [
  { value: 'andariel', label: 'Andariel', tier: 'ladder', basePrice: 1.49, materialName: 'Sandscorched Shackles', materialPrice: 0.50 },
  { value: 'duriel', label: 'Duriel', tier: 'ladder', basePrice: 1.49, materialName: 'Mucus-Slick Egg', materialPrice: 0.50 },
  { value: 'grigoire', label: 'Grigoire', tier: 'ladder', basePrice: 1.49, materialName: 'Living Steel', materialPrice: 0.50 },
  { value: 'beast_in_ice', label: 'Beast in Ice', tier: 'ladder', basePrice: 1.49, materialName: 'Distilled Fear', materialPrice: 0.50 },
  { value: 'lord_zir', label: 'Lord Zir', tier: 'ladder', basePrice: 1.49, materialName: 'Exquisite Blood', materialPrice: 0.50 },
  { value: 'varshan', label: 'Varshan', tier: 'ladder', basePrice: 1.49, materialName: 'Malignant Heart', materialPrice: 0.50 },
  { value: 'uber_andariel', label: 'Uber Andariel', tier: 'uber', basePrice: 2.49, materialName: 'Sandscorched Shackles', materialPrice: 0.50 },
  { value: 'uber_duriel', label: 'Uber Duriel', tier: 'uber', basePrice: 2.49, materialName: 'Mucus-Slick Egg', materialPrice: 0.50 },
  { value: 'uber_lilith', label: 'Uber Lilith', tier: 'uber', basePrice: 3.99, materialName: null, materialPrice: 0 }
];

export const D4_RUN_QUANTITY_OPTIONS = [
  { value: 10, label: '10 Runs', discount: 0 },
  { value: 25, label: '25 Runs', discount: 5 },
  { value: 50, label: '50 Runs', discount: 10 },
  { value: 100, label: '100 Runs', discount: 12 },
  { value: 150, label: '150 Runs', discount: 15 }
];

// World of Warcraft: Mists of Pandaria Classic - Raids
export const MOP_RAID_CONFIG = {
  'mop_mogushan_vaults': {
    options: {
      '3h_3n': { label: '3 Heroic + 3 Normal', price: 180 },
      'full_heroic': { label: 'Full Heroic (6/6)', price: 275 }
    },
    extras: {
      priority: { label: 'Priority Loot', price: 75 },
      items3: { label: '+3 Guaranteed Items', price: 35 }
    }
  },
  'mop_heart_of_fear': {
    options: {
      '3h_3n': { label: '3 Heroic + 3 Normal', price: 240 },
      'full_heroic': { label: 'Full Heroic (6/6)', price: 300 }
    },
    extras: {
      priority: { label: 'Priority Loot', price: 100 },
      items3: { label: '+3 Guaranteed Items', price: 40 }
    }
  },
  'mop_terrace_endless_spring': {
    options: {
      '2h_2n': { label: '2 Heroic + 2 Normal', price: 190 },
      'full_heroic': { label: 'Full Heroic (4/4)', price: 270 }
    },
    extras: {
      priority: { label: 'Priority Loot', price: 90 },
      items2: { label: '+2 Guaranteed Items', price: 35 }
    }
  },
  'mop_throne_of_thunder': {
    options: {
      'normal': { label: 'Normal (12/12)', price: 190 },
      'heroic_no_raden': { label: 'Heroic (No Ra-den) 11/13', price: 600 },
      'heroic_raden': { label: 'Heroic + Ra-den (13/13)', price: 850 }
    },
    extras: {
      priority: { label: 'Priority Loot', price: 150 },
      items5: { label: '+5 Guaranteed Items', price: 100 }
    }
  }
};

// Diablo 4 - Builds (Starter → Ancestral → Mythic → Tormented)
export const DIABLO_4_BUILD_PRICES = {
  builds_starter: 40,
  builds_ancestral: 130,
  builds_mythic: 180,
  builds_tormented: 250
};

// Path of Exile 2 - Builds (Starter → Advanced → Endgame)
export const POE2_BUILD_PRICES = {
  poe2_build_starter: 120,
  poe2_build_advanced: 245,
  poe2_build_endgame: 370
};

export const BASE_PRICES = {
  // PoE 2
  'poe2_build_starter': 120, 'poe2_build_advanced': 245, 'poe2_build_endgame': 370,
  'poe2_leveling_40': 25, 'poe2_leveling_70': 55, 'poe2_leveling_90': 95,
  'poe2_starter_pack': 105, 'poe2_endgame_pack': 225,

  // Diablo 4
  'builds_starter': 40, 'builds_ancestral': 130, 'builds_mythic': 180, 'builds_tormented': 250,
  'd4_starter_pack': 60, 'd4_endgame_pack': 300, 'custom_build': 80,

  // Dune Awakening
  'dune_base_construction': 20,
  'dune_craft_vehicle': 10,
  'dune_starter_pack': 45, 'dune_advanced_pack': 99, 'dune_endgame_pack': 199,
  'powerleveling': 1.20, 'leveling': 1.20, 'resource_farming': 35, 'currency_farming': 30,

  // Diablo 3
  'd3_starter_pack': 45, 'd3_endgame_pack': 95,

  // Diablo 2
  'd2_starter_pack': 40, 'd2_endgame_pack': 90,

  // Diablo Immortal
  'immortal_starter_pack': 60, 'immortal_endgame_pack': 300,

  // WoW
  'wow_starter_pack': 50, 'wow_endgame_pack': 110,
  'classic_starter_pack': 45, 'classic_endgame_pack': 100,
  'tbc_starter_pack': 349, 'tbc_endgame_pack': 849,

  // PoE
  'poe_starter_pack': 60, 'poe_endgame_pack': 300,
  'poe_starter_build': 45, 'poe_endgame_build': 120,

  // Last Epoch
  'last_epoch_starter_pack': 45, 'last_epoch_endgame_pack': 100,

  // Generales
  'builds': 60, 'coaching': 40, 'boss_killing': 45, 'uber_services': 65,
  'mythic_plus': 75, 'raiding': 90, 'gold_farming': 25, 'item_farming': 28,
  'pvp_boost': 55, 'arena': 50, 'placement': 45, 'wins': 40,
  'dungeon_clearing': 35, 'nightmare_dungeons': 45, 'greater_rift': 50,
  'the_pit_artificer': 55, 'runewords': 40, 'bounty_services': 30,
  'monolith_farming': 40, 'legendary_crafting': 50, 'achievements': 30,
  'variable_leveling': 0, 'powerleveling_d4': 0.17, 'paragon_leveling': 0
};

const pricingConfig = {
  MAX_LEVELS,
  PRICE_PER_LEVEL,
  PARAGON_TIERS_D4,
  PARAGON_TIERS_D3,
  DUNE_LEVELING_TIERS,
  CUSTOM_BUILD_CONFIG,
  DIABLO_4_BUILD_PRICES,
  POE2_BUILD_PRICES,
  THE_PIT_RUN_OPTIONS,
  THE_PIT_TIER_OPTIONS,
  THE_PIT_SERVICE_MODES,
  D4_BOSS_OPTIONS,
  D4_RUN_QUANTITY_OPTIONS,
  MOP_RAID_CONFIG,
  BASE_PRICES
};

export default pricingConfig;