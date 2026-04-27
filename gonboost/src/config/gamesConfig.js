// frontend/src/config/gamesConfig.js - VERSIÓN SIN CALL OF DUTY

// ============================================
// JUEGOS DISPONIBLES
// ============================================
export const GAMES = [
  'Diablo 2 Resurrected',
  'Diablo 3',
  'Diablo 4',
  'Diablo Immortal',
  'World of Warcraft Retail',
  'World of Warcraft Classic',
  'Dune Awakening'
];

// ============================================
// SERVICIOS ESPECÍFICOS POR JUEGO
// ============================================
export const GAME_SPECIFIC_SERVICES = {
  'Diablo 2 Resurrected': [
    'powerleveling', 'leveling', 'builds', 'build_services', 'runewords',
    'd2_starter_pack', 'd2_endgame_pack', 'boss_killing', 'dungeon_clearing',
    'uber_services', 'custom_build'
  ],
  'Diablo 3': [
    'powerleveling', 'paragon_leveling', 'leveling', 'builds', 'build_services',
    'd3_starter_pack', 'd3_endgame_pack', 'boss_killing', 'dungeon_clearing',
    'greater_rift', 'uber_services', 'bounty_services', 'custom_build'
  ],
  'Diablo 4': [
    'powerleveling', 'paragon_leveling', 'leveling', 'builds', 'builds_starter',
    'builds_ancestral', 'builds_mythic', 'builds_tormented', 'build_services',
    'd4_starter_pack', 'd4_endgame_pack', 'the_pit_artificer', 'uber_services',
    'dungeon_runs', 'nightmare_dungeons', 'boss_killing', 'custom_build'
  ],
  'Diablo Immortal': [
    'powerleveling', 'paragon_leveling', 'leveling', 'builds', 'build_services',
    'immortal_starter_pack', 'immortal_endgame_pack', 'boss_killing',
    'dungeon_clearing', 'uber_services', 'custom_build'
  ],
  'World of Warcraft Retail': [
    'powerleveling', 'leveling', 'mythic_plus', 'raiding', 'pvp_boost',
    'arena', 'placement', 'wins', 'gold_farming', 'builds', 'build_services',
    'wow_starter_pack', 'wow_endgame_pack', 'coaching', 'custom_build'
  ],
  'World of Warcraft Classic': [
    'powerleveling', 'leveling', 'gold_farming', 'builds', 'build_services',
    'classic_starter_pack', 'classic_endgame_pack', 'tbc_starter_pack',
    'tbc_endgame_pack', 'raiding',
    // ========== NUEVOS SERVICIOS MOP CLASSIC ==========
    'mop_mogushan_vaults',
    'mop_heart_of_fear',
    'mop_terrace_endless_spring',
    'mop_throne_of_thunder'
  ],
  'Dune Awakening': [
    'powerleveling', 'leveling', 'dune_base_construction', 'dune_craft_vehicle',
    'builds', 'build_services', 'dune_starter_pack', 'dune_advanced_pack',
    'dune_endgame_pack', 'resource_farming', 'currency_farming',
    'achievements', 'coaching', 'custom_build'
  ]
};

// ============================================
// TODOS LOS TIPOS DE SERVICIOS
// ============================================
export const ALL_SERVICE_TYPES = [
  'powerleveling', 'paragon_leveling', 'leveling', 'variable_leveling',
  'builds', 'builds_starter', 'builds_ancestral', 'builds_mythic', 'builds_tormented',
  'build_services', 'runewords', 'custom_build',
  'dune_base_construction', 'dune_craft_vehicle',
  'dune_starter_pack', 'dune_advanced_pack', 'dune_endgame_pack',
  'd2_starter_pack', 'd2_endgame_pack', 'd3_starter_pack', 'd3_endgame_pack',
  'd4_starter_pack', 'd4_endgame_pack', 'immortal_starter_pack', 'immortal_endgame_pack',
  'wow_starter_pack', 'wow_endgame_pack', 'classic_starter_pack', 'classic_endgame_pack',
  'tbc_starter_pack', 'tbc_endgame_pack',
  // ========== NUEVOS MOP RAIDS ==========
  'mop_mogushan_vaults', 'mop_heart_of_fear', 'mop_terrace_endless_spring', 'mop_throne_of_thunder',
  'boss_killing', 'dungeon_clearing', 'dungeon_runs', 'nightmare_dungeons',
  'uber_services', 'the_pit_artificer', 'mythic_plus', 'raiding', 'greater_rift',
  'monolith_farming', 'legendary_crafting', 'bounty_services',
  'pvp_boost', 'placement', 'wins', 'arena', 'duo', 'battle_cup',
  'currency_farming', 'gold_farming', 'resource_farming', 'item_farming',
  'coaching', 'achievements', 'season_journey', 'challenge_completion', 'custom_service'
];

// ============================================
// FORMATO DE NOMBRES DE SERVICIOS
// ============================================
export const SERVICE_TYPE_FORMAT = {
  'powerleveling': 'Power Leveling',
  'paragon_leveling': 'Paragon Leveling',
  'leveling': 'Level Boost',
  'variable_leveling': 'Variable Leveling',
  'builds': 'Build Setup',
  'builds_starter': 'Starter Build',
  'builds_ancestral': 'Ancestral Build',
  'builds_mythic': 'Mythic Build',
  'builds_tormented': 'Tormented Build',
  'build_services': 'Build Services',
  'runewords': 'Runewords',
  'custom_build': 'Custom Build',
  'dune_base_construction': 'Base Construction',
  'dune_craft_vehicle': 'Craft Vehicle',
  'dune_starter_pack': 'Starter Bundle - Dune',
  'dune_advanced_pack': 'Advanced Bundle - Dune',
  'dune_endgame_pack': 'Endgame Bundle - Dune',
  'd2_starter_pack': 'Starter Pack (D2)',
  'd2_endgame_pack': 'Endgame Pack (D2)',
  'd3_starter_pack': 'Starter Pack (D3)',
  'd3_endgame_pack': 'Endgame Pack (D3)',
  'd4_starter_pack': 'Starter Pack (D4)',
  'd4_endgame_pack': 'Endgame Pack (D4)',
  'immortal_starter_pack': 'Starter Pack (Immortal)',
  'immortal_endgame_pack': 'Endgame Pack (Immortal)',
  'wow_starter_pack': 'Starter Pack (WoW)',
  'wow_endgame_pack': 'Endgame Pack (WoW)',
  'classic_starter_pack': 'Starter Pack (Classic)',
  'classic_endgame_pack': 'Endgame Pack (Classic)',
  'tbc_starter_pack': 'TBC Starter Pack - Silver',
  'tbc_endgame_pack': 'TBC End Game Pack - Platinum',
  // ========== NUEVOS MOP RAIDS ==========
  'mop_mogushan_vaults': 'Mogu\'shan Vaults Boost',
  'mop_heart_of_fear': 'Heart of Fear Boost',
  'mop_terrace_endless_spring': 'Terrace of Endless Spring Boost',
  'mop_throne_of_thunder': 'Throne of Thunder Boost',
  'boss_killing': 'Boss Killing',
  'dungeon_clearing': 'Dungeon Clearing',
  'dungeon_runs': 'Dungeon Runs',
  'nightmare_dungeons': 'Nightmare Dungeons',
  'uber_services': 'Uber Services',
  'the_pit_artificer': 'The Pit Artificer',
  'mythic_plus': 'Mythic+',
  'raiding': 'Raiding',
  'greater_rift': 'Greater Rift',
  'monolith_farming': 'Monolith Farming',
  'legendary_crafting': 'Legendary Crafting',
  'bounty_services': 'Bounty Services',
  'pvp_boost': 'PvP Boost',
  'placement': 'Placement Matches',
  'wins': 'Wins Boost',
  'arena': 'Arena Boost',
  'duo': 'Duo Queue',
  'battle_cup': 'Battle Cup',
  'currency_farming': 'Currency Farming',
  'gold_farming': 'Gold Farming',
  'resource_farming': 'Resource Farming',
  'item_farming': 'Item Farming',
  'coaching': 'Coaching Session',
  'achievements': 'Achievements',
  'season_journey': 'Season Journey',
  'challenge_completion': 'Challenge Completion',
  'custom_service': 'Custom Service'
};

// ============================================
// D4 BOSS KILLING OPTIONS
// ============================================
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

export const D4_SERVICE_MODES = [
  { value: 'self', label: 'Self-Play (You play - we carry)', description: 'You join our group, we kill bosses together, you loot' },
  { value: 'piloted', label: 'Piloted (Account sharing)', description: 'Professional booster logs into your account via secure VPN' }
];

// ============================================
// THE PIT ARTIFICER - CONFIGURACIÓN COMPLETA
// ============================================
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
  { value: 'self', label: 'Self-Play (You play - we carry)', description: 'You join our group, we run The Pit together, you loot rewards', priceMultiplier: 1.0 },
  { value: 'piloted', label: 'Piloted (Account sharing)', description: 'Professional booster logs into your account via secure VPN and completes the runs', priceMultiplier: 1.0 }
];

export const calculatePitPrice = (runs, mode, tierValue) => {
  const tier = THE_PIT_TIER_OPTIONS.find(t => t.value === tierValue) || THE_PIT_TIER_OPTIONS[2];
  let discount = 0;
  for (const tierDiscount of THE_PIT_RUN_OPTIONS.discounts) {
    if (runs >= tierDiscount.min && runs <= tierDiscount.max) {
      discount = tierDiscount.discount;
      break;
    }
  }
  const baseTotal = runs * tier.basePricePerRun;
  const discountedTotal = baseTotal * (1 - discount / 100);
  const modeMultiplier = THE_PIT_SERVICE_MODES.find(m => m.value === mode)?.priceMultiplier || 1.0;
  return Math.round(discountedTotal * modeMultiplier * 100) / 100;
};

// ============================================
// MOP CLASSIC RAID CONFIGURATION (NUEVO)
// ============================================
export const MOP_RAID_CONFIG = {
  'mop_mogushan_vaults': {
    name: 'Mogu\'shan Vaults',
    bosses: 6,
    icon: '🏛️',
    description: 'The ancient titan vault beneath Kun-Lai Summit. Face the Stone Guard, Feng the Accursed, Gara\'jal, Spirit Kings, Elegon, and Will of the Emperor.',
    estimatedTime: '1-2 hours',
    options: [
      { value: '3h_3n', label: '3 Heroic + 3 Normal', price: 180, description: 'Mixed difficulty run' },
      { value: 'full_heroic', label: 'Full Heroic (6/6)', price: 275, description: 'All bosses on Heroic difficulty' }
    ],
    extras: {
      priority: { label: 'Priority Loot', price: 75, description: 'All loot that drops goes to your character' },
      items3: { label: '+3 Guaranteed Items', price: 35, description: 'Guaranteed 3 additional item drops' }
    },
    notableLoot: [
      'Elegon Mount (Reins of the Astral Cloud Serpent)',
      'Starshatter (2H Weapon)',
      'Baradins Ward (Shield)'
    ]
  },
  'mop_heart_of_fear': {
    name: 'Heart of Fear',
    bosses: 6,
    icon: '🦗',
    description: 'The mantid empress\'s palace in Dread Wastes. Defeat Imperial Vizier Zor\'lok, Blade Lord Ta\'yak, Garalon, Wind Lord Mel\'jarak, Amber-Shaper Un\'sok, and Grand Empress Shek\'zeer.',
    estimatedTime: '1-2 hours',
    options: [
      { value: '3h_3n', label: '3 Heroic + 3 Normal', price: 240, description: 'Mixed difficulty run' },
      { value: 'full_heroic', label: 'Full Heroic (6/6)', price: 300, description: 'All bosses on Heroic difficulty' }
    ],
    extras: {
      priority: { label: 'Priority Loot', price: 100, description: 'All loot that drops goes to your character' },
      items3: { label: '+3 Guaranteed Items', price: 40, description: 'Guaranteed 3 additional item drops' }
    },
    notableLoot: [
      'Claws of Shek\'zeer (Weapon set)',
      'Chest of the Corrupted Protector',
      'Leggings of the Shadowy Moth'
    ]
  },
  'mop_terrace_endless_spring': {
    name: 'Terrace of Endless Spring',
    bosses: 4,
    icon: '🌊',
    description: 'The sacred waters where the Sha of Fear corrupts all. Defeat Protectors of the Endless, Tsulong, Lei Shi, and Sha of Fear.',
    estimatedTime: '1-2 hours',
    options: [
      { value: '2h_2n', label: '2 Heroic + 2 Normal', price: 190, description: 'Mixed difficulty run' },
      { value: 'full_heroic', label: 'Full Heroic (4/4)', price: 270, description: 'All bosses on Heroic difficulty' }
    ],
    extras: {
      priority: { label: 'Priority Loot', price: 90, description: 'All loot that drops goes to your character' },
      items2: { label: '+2 Guaranteed Items', price: 35, description: 'Guaranteed 2 additional item drops' }
    },
    notableLoot: [
      'Sha-touched Weapons',
      'Tier 14 Shoulders',
      'Darkmist Girdle'
    ]
  },
  'mop_throne_of_thunder': {
    name: 'Throne of Thunder',
    bosses: 13,
    icon: '⚡',
    description: 'The legendary palace of Lei Shen, the Thunder King. Includes all 12 bosses plus the secret Ra-den encounter.',
    estimatedTime: '1-2 days',
    options: [
      { value: 'normal', label: 'Normal (12/12)', price: 190, description: 'Full normal clear' },
      { value: 'heroic_no_raden', label: 'Heroic (No Ra-den) 11/13', price: 600, description: 'Heroic bosses excluding Ra-den' },
      { value: 'heroic_raden', label: 'Heroic + Ra-den (13/13)', price: 850, description: 'Complete Heroic including Ra-den' }
    ],
    extras: {
      priority: { label: 'Priority Loot', price: 150, description: 'All loot that drops goes to your character' },
      items5: { label: '+5 Guaranteed Items', price: 100, description: 'Guaranteed 5 additional item drops' }
    },
    notableLoot: [
      'Clutch of Ji-Kun (Mount)',
      'Spawn of Horridon (Mount)',
      'Thunderforged Weapons',
      'Tier 15 Armor Sets'
    ]
  }
};

// ============================================
// CATEGORÍAS DE SERVICIOS
// ============================================
export const SERVICE_CATEGORIES = [
  { id: 'all', name: 'Todos los Servicios', icon: '🔍' },
  { id: 'leveling', name: 'Leveling', icon: '📈' },
  { id: 'builds', name: 'Builds', icon: '⚙️' },
  { id: 'bundles', name: 'Bundles/Packs', icon: '📦' },
  { id: 'content', name: 'PvE Content', icon: '🏆' },
  { id: 'farming', name: 'Farming', icon: '💰' },
  { id: 'pvp', name: 'PvP', icon: '⚔️' },
  { id: 'coaching', name: 'Coaching', icon: '👨‍🏫' },
  { id: 'competitive', name: 'Competitivo', icon: '🎮' }
];

// ============================================
// FUNCIONES UTILITARIAS
// ============================================
export const formatServiceType = (type) => {
  if (!type) return '';
  return SERVICE_TYPE_FORMAT[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getServiceTypesForGame = (game) => GAME_SPECIFIC_SERVICES[game] || [];

export const categorizeService = (serviceType) => {
  if (!serviceType) return 'other';
  if (['powerleveling', 'paragon_leveling', 'leveling', 'variable_leveling'].includes(serviceType)) return 'leveling';
  if (serviceType.includes('build') || serviceType === 'runewords' || serviceType === 'build_services' || serviceType === 'custom_build' || serviceType === 'dune_base_construction' || serviceType === 'dune_craft_vehicle') return 'builds';
  if (serviceType.includes('_pack') || serviceType.startsWith('bundle_')) return 'bundles';
  if (['boss_killing', 'dungeon_clearing', 'dungeon_runs', 'nightmare_dungeons', 'uber_services', 'the_pit_artificer', 'mythic_plus', 'raiding', 'monolith_farming', 'legendary_crafting', 'greater_rift', 'bounty_services', 'mop_mogushan_vaults', 'mop_heart_of_fear', 'mop_terrace_endless_spring', 'mop_throne_of_thunder'].includes(serviceType)) return 'content';
  if (['currency_farming', 'gold_farming', 'resource_farming', 'item_farming'].includes(serviceType)) return 'farming';
  if (serviceType === 'pvp_boost') return 'pvp';
  if (['placement', 'wins', 'arena', 'duo', 'battle_cup'].includes(serviceType)) return 'competitive';
  if (serviceType === 'coaching') return 'coaching';
  return 'other';
};

export const normalizeGameName = (game) => {
  const map = {
    'Diablo 2': 'Diablo 2 Resurrected', 'D2': 'Diablo 2 Resurrected',
    'D3': 'Diablo 3', 'D4': 'Diablo 4', 'Immortal': 'Diablo Immortal',
    'WoW': 'World of Warcraft Retail', 'World of Warcraft': 'World of Warcraft Retail',
    'Retail': 'World of Warcraft Retail', 'WoW Classic': 'World of Warcraft Classic',
    'Classic': 'World of Warcraft Classic',
    'Dune': 'Dune Awakening'
  };
  return map[game] || game;
};

export const isValidServiceTypeForGame = (game, serviceType) => {
  if (!game || !serviceType) return false;
  const validTypes = GAME_SPECIFIC_SERVICES[game] || [];
  const universal = ['variable_leveling', 'coaching', 'custom_service'];
  return validTypes.includes(serviceType) || universal.includes(serviceType);
};

export const getServiceIcon = (serviceType) => {
  const category = categorizeService(serviceType);
  const icons = { leveling: '📈', builds: '⚙️', bundles: '📦', content: '🏆', farming: '💰', pvp: '⚔️', coaching: '👨‍🏫', competitive: '🎮', other: '🔧' };
  return icons[category] || '🎮';
};

export default {
  GAMES, GAME_SPECIFIC_SERVICES, ALL_SERVICE_TYPES, SERVICE_TYPE_FORMAT,
  SERVICE_CATEGORIES, D4_BOSS_OPTIONS, D4_RUN_QUANTITY_OPTIONS,
  D4_SERVICE_MODES, THE_PIT_RUN_OPTIONS, THE_PIT_TIER_OPTIONS,
  THE_PIT_SERVICE_MODES, calculatePitPrice, MOP_RAID_CONFIG,
  formatServiceType, getServiceTypesForGame, categorizeService,
  normalizeGameName, isValidServiceTypeForGame, getServiceIcon
};