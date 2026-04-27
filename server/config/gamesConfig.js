// backend/config/gamesConfig.js - VERSIÓN MÁS COMPLETA CON CUSTOM_BUILD

module.exports = {
  // ============================================
  // JUEGOS DISPONIBLES
  // ============================================
  GAMES: [
    'Diablo 2 Resurrected',
    'Diablo 3',
    'Diablo 4',
    'Diablo Immortal',
    'World of Warcraft Retail',
    'World of Warcraft Classic',
    'Path of Exile',
    'Path of Exile 2',
    'Dune Awakening',
    'Last Epoch'
  ],

  // ============================================
  // SERVICIOS ESPECÍFICOS POR JUEGO
  // ============================================
  GAME_SPECIFIC_SERVICES: {
    'Diablo 2 Resurrected': [
      'powerleveling',
      'leveling',
      'builds',
      'build_services',
      'runewords',
      'd2_starter_pack',
      'd2_endgame_pack',
      'boss_killing',
      'dungeon_clearing',
      'uber_services',
      'custom_build'  // ✅ AGREGADO
    ],

    'Diablo 3': [
      'powerleveling',
      'paragon_leveling',
      'leveling',
      'builds',
      'build_services',
      'd3_starter_pack',
      'd3_endgame_pack',
      'boss_killing',
      'dungeon_clearing',
      'greater_rift',
      'uber_services',
      'bounty_services',
      'custom_build'  // ✅ AGREGADO
    ],

    'Diablo 4': [
      'powerleveling',
      'paragon_leveling',
      'leveling',
      'builds',
      'builds_starter',
      'builds_ancestral',
      'builds_mythic',
      'builds_tormented',
      'build_services',
      'd4_starter_pack',
      'd4_endgame_pack',
      'the_pit_artificer',
      'uber_services',
      'dungeon_runs',
      'nightmare_dungeons',
      'boss_killing',
      'custom_build'  // ✅ AGREGADO
    ],

    'Diablo Immortal': [
      'powerleveling',
      'paragon_leveling',
      'leveling',
      'builds',
      'build_services',
      'immortal_starter_pack',
      'immortal_endgame_pack',
      'boss_killing',
      'dungeon_clearing',
      'uber_services',
      'custom_build'  // ✅ AGREGADO
    ],

    'World of Warcraft Retail': [
      'powerleveling',
      'leveling',
      'mythic_plus',
      'raiding',
      'pvp_boost',
      'arena',
      'placement',
      'wins',
      'gold_farming',
      'builds',
      'build_services',
      'wow_starter_pack',
      'wow_endgame_pack',
      'coaching',
      'custom_build'  // ✅ AGREGADO
    ],

    'World of Warcraft Classic': [
      'powerleveling',
      'leveling',
      'gold_farming',
      'builds',
      'build_services',
      'classic_starter_pack',
      'classic_endgame_pack',
      'raiding',
      'custom_build'  // ✅ AGREGADO
    ],

    'Path of Exile': [
      'poe_starter_pack',
      'poe_endgame_pack',
      'builds',
      'poe_starter_build',
      'poe_endgame_build',
      'build_services',
      'powerleveling',
      'leveling',
      'currency_farming',
      'boss_killing',
      'uber_services',
      'coaching',
      'custom_build'  // ✅ AGREGADO
    ],

    'Path of Exile 2': [
      'poe2_starter_pack',
      'poe2_endgame_pack',
      'builds',
      'poe2_starter_build',
      'poe2_endgame_build',
      'build_services',
      'powerleveling',
      'leveling',
      'currency_farming',
      'boss_killing',
      'uber_services',
      'coaching',
      'custom_build'  // ✅ AGREGADO
    ],

    'Dune Awakening': [
      'powerleveling',
      'leveling',
      'builds',
      'build_services',
      'dune_starter_pack',
      'dune_endgame_pack',
      'resource_farming',
      'achievements',
      'coaching',
      'custom_build'  // ✅ AGREGADO
    ],

    'Last Epoch': [
      'powerleveling',
      'leveling',
      'builds',
      'build_services',
      'last_epoch_starter_pack',
      'last_epoch_endgame_pack',
      'monolith_farming',
      'legendary_crafting',
      'dungeon_clearing',
      'boss_killing',
      'coaching',
      'custom_build'  // ✅ AGREGADO
    ]
  },

  // ============================================
  // TODOS LOS TIPOS DE SERVICIOS (CATÁLOGO COMPLETO)
  // ============================================
  ALL_SERVICE_TYPES: [
    // ===== LEVELING =====
    'powerleveling',
    'paragon_leveling',
    'leveling',
    'variable_leveling',

    // ===== BUILDS =====
    'builds',
    'builds_starter',
    'builds_ancestral',
    'builds_mythic',
    'builds_tormented',
    'poe_starter_build',
    'poe_endgame_build',
    'poe2_starter_build',
    'poe2_endgame_build',
    'build_services',
    'runewords',
    'custom_build',  // ✅ AGREGADO

    // ===== BUNDLES/PACKS DIABLO 2 =====
    'd2_starter_pack',
    'd2_endgame_pack',

    // ===== BUNDLES/PACKS DIABLO 3 =====
    'd3_starter_pack',
    'd3_endgame_pack',

    // ===== BUNDLES/PACKS DIABLO 4 =====
    'd4_starter_pack',
    'd4_endgame_pack',

    // ===== BUNDLES/PACKS DIABLO IMMORTAL =====
    'immortal_starter_pack',
    'immortal_endgame_pack',

    // ===== BUNDLES/PACKS WOW =====
    'wow_starter_pack',
    'wow_endgame_pack',
    'classic_starter_pack',
    'classic_endgame_pack',

    // ===== BUNDLES/PACKS POE =====
    'poe_starter_pack',
    'poe_endgame_pack',
    'poe2_starter_pack',
    'poe2_endgame_pack',

    // ===== BUNDLES/PACKS DUNE =====
    'dune_starter_pack',
    'dune_endgame_pack',

    // ===== BUNDLES/PACKS LAST EPOCH =====
    'last_epoch_starter_pack',
    'last_epoch_endgame_pack',

    // ===== PVE CONTENT =====
    'boss_killing',
    'dungeon_clearing',
    'dungeon_runs',
    'nightmare_dungeons',
    'uber_services',
    'the_pit_artificer',
    'mythic_plus',
    'raiding',
    'greater_rift',
    'monolith_farming',
    'legendary_crafting',
    'bounty_services',

    // ===== PVP =====
    'pvp_boost',
    'placement',
    'wins',
    'arena',
    'duo',
    'battle_cup',

    // ===== FARMING =====
    'currency_farming',
    'gold_farming',
    'resource_farming',
    'item_farming',

    // ===== COACHING =====
    'coaching',

    // ===== OTROS =====
    'achievements',
    'season_journey',
    'challenge_completion'
  ],

  // ============================================
  // MAPA DE FORMATO PARA MOSTRAR TIPOS DE SERVICIO
  // ============================================
  SERVICE_TYPE_FORMAT: {
    // Leveling
    'powerleveling': 'Power Leveling',
    'paragon_leveling': 'Paragon Leveling',
    'leveling': 'Level Boost',
    'variable_leveling': 'Variable Leveling',

    // Builds
    'builds': 'Build Setup',
    'builds_starter': 'Starter Build',
    'builds_ancestral': 'Ancestral Build',
    'builds_mythic': 'Mythic Build',
    'builds_tormented': 'Tormented Build',
    'poe_starter_build': 'PoE Starter Build',
    'poe_endgame_build': 'PoE Endgame Build',
    'poe2_starter_build': 'PoE 2 Starter Build',
    'poe2_endgame_build': 'PoE 2 Endgame Build',
    'build_services': 'Build Services',
    'runewords': 'Runewords',
    'custom_build': 'Custom Build',  // ✅ AGREGADO

    // Bundles/Packs Diablo 2
    'd2_starter_pack': 'Starter Pack (D2)',
    'd2_endgame_pack': 'Endgame Pack (D2)',

    // Bundles/Packs Diablo 3
    'd3_starter_pack': 'Starter Pack (D3)',
    'd3_endgame_pack': 'Endgame Pack (D3)',

    // Bundles/Packs Diablo 4
    'd4_starter_pack': 'Starter Pack (D4)',
    'd4_endgame_pack': 'Endgame Pack (D4)',

    // Bundles/Packs Diablo Immortal
    'immortal_starter_pack': 'Starter Pack (Immortal)',
    'immortal_endgame_pack': 'Endgame Pack (Immortal)',

    // Bundles/Packs WoW
    'wow_starter_pack': 'Starter Pack (WoW)',
    'wow_endgame_pack': 'Endgame Pack (WoW)',
    'classic_starter_pack': 'Starter Pack (Classic)',
    'classic_endgame_pack': 'Endgame Pack (Classic)',

    // Bundles/Packs PoE
    'poe_starter_pack': 'Starter Pack (PoE)',
    'poe_endgame_pack': 'Endgame Pack (PoE)',
    'poe2_starter_pack': 'Starter Pack (PoE 2)',
    'poe2_endgame_pack': 'Endgame Pack (PoE 2)',

    // Bundles/Packs Dune
    'dune_starter_pack': 'Starter Pack (Dune)',
    'dune_endgame_pack': 'Endgame Pack (Dune)',

    // Bundles/Packs Last Epoch
    'last_epoch_starter_pack': 'Starter Pack (Last Epoch)',
    'last_epoch_endgame_pack': 'Endgame Pack (Last Epoch)',

    // PvE Content
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

    // PvP
    'pvp_boost': 'PvP Boost',
    'placement': 'Placement Matches',
    'wins': 'Wins Boost',
    'arena': 'Arena Boost',
    'duo': 'Duo Queue',
    'battle_cup': 'Battle Cup',

    // Farming
    'currency_farming': 'Currency Farming',
    'gold_farming': 'Gold Farming',
    'resource_farming': 'Resource Farming',
    'item_farming': 'Item Farming',

    // Coaching
    'coaching': 'Coaching Session',

    // Otros
    'achievements': 'Achievements',
    'season_journey': 'Season Journey',
    'challenge_completion': 'Challenge Completion'
  },

  // ============================================
  // CATEGORÍAS DE SERVICIOS
  // ============================================
  SERVICE_CATEGORIES: [
    { id: 'all', name: 'Todos los Servicios', icon: '🔍' },
    { id: 'leveling', name: 'Leveling', icon: '📈' },
    { id: 'builds', name: 'Builds', icon: '⚙️' },
    { id: 'bundles', name: 'Bundles/Packs', icon: '📦' },
    { id: 'content', name: 'PvE Content', icon: '🏆' },
    { id: 'farming', name: 'Farming', icon: '💰' },
    { id: 'pvp', name: 'PvP', icon: '⚔️' },
    { id: 'coaching', name: 'Coaching', icon: '👨‍🏫' },
    { id: 'competitive', name: 'Competitivo', icon: '🎮' }
  ],

  // ============================================
  // FUNCIONES UTILITARIAS
  // ============================================

  /**
   * Formatea un tipo de servicio para mostrarlo en la UI
   */
  formatServiceType(type) {
    if (!type) return '';
    return this.SERVICE_TYPE_FORMAT[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  },

  /**
   * Obtiene los tipos de servicio disponibles para un juego específico
   */
  getServiceTypesForGame(game) {
    return this.GAME_SPECIFIC_SERVICES[game] || [];
  },

  /**
   * Categoriza un tipo de servicio
   */
  categorizeService(serviceType) {
    if (!serviceType) return 'other';

    if (['powerleveling', 'paragon_leveling', 'leveling', 'variable_leveling'].includes(serviceType)) {
      return 'leveling';
    }

    if (serviceType.includes('build') || serviceType === 'runewords' || serviceType === 'build_services' || serviceType === 'custom_build') {
      return 'builds';
    }

    if (serviceType.includes('_pack') || serviceType.startsWith('bundle_')) {
      return 'bundles';
    }

    if ([
      'boss_killing', 'dungeon_clearing', 'dungeon_runs', 'nightmare_dungeons',
      'uber_services', 'the_pit_artificer', 'mythic_plus', 'raiding',
      'monolith_farming', 'legendary_crafting', 'greater_rift', 'bounty_services'
    ].includes(serviceType)) {
      return 'content';
    }

    if (['currency_farming', 'gold_farming', 'resource_farming', 'item_farming'].includes(serviceType)) {
      return 'farming';
    }

    if (serviceType === 'pvp_boost') {
      return 'pvp';
    }

    if (['placement', 'wins', 'arena', 'duo', 'battle_cup'].includes(serviceType)) {
      return 'competitive';
    }

    if (serviceType === 'coaching') {
      return 'coaching';
    }

    return 'other';
  },

  /**
   * Normaliza el nombre de un juego
   */
  normalizeGameName(game) {
    const gameMap = {
      'Diablo 2': 'Diablo 2 Resurrected',
      'Diablo 2 Resurrected': 'Diablo 2 Resurrected',
      'D2': 'Diablo 2 Resurrected',
      'Diablo 3': 'Diablo 3',
      'D3': 'Diablo 3',
      'Diablo 4': 'Diablo 4',
      'D4': 'Diablo 4',
      'Diablo Immortal': 'Diablo Immortal',
      'Immortal': 'Diablo Immortal',
      'WoW': 'World of Warcraft Retail',
      'World of Warcraft': 'World of Warcraft Retail',
      'World of Warcraft Retail': 'World of Warcraft Retail',
      'Retail': 'World of Warcraft Retail',
      'World of Warcraft Classic': 'World of Warcraft Classic',
      'WoW Classic': 'World of Warcraft Classic',
      'Classic': 'World of Warcraft Classic',
      'PoE': 'Path of Exile',
      'Path of Exile': 'Path of Exile',
      'Path of Exile 2': 'Path of Exile 2',
      'PoE 2': 'Path of Exile 2',
      'PoE2': 'Path of Exile 2',
      'Dune': 'Dune Awakening',
      'Dune Awakening': 'Dune Awakening',
      'Last Epoch': 'Last Epoch',
      'LE': 'Last Epoch'
    };

    return gameMap[game] || game;
  },

  /**
   * Valida si un tipo de servicio es válido para un juego específico
   */
  isValidServiceTypeForGame(game, serviceType) {
    if (!game || !serviceType) return false;

    const validTypes = this.GAME_SPECIFIC_SERVICES[game] || [];

    // Tipos especiales que son válidos para todos los juegos
    const universalTypes = ['variable_leveling', 'coaching'];

    return validTypes.includes(serviceType) || universalTypes.includes(serviceType);
  },

  /**
   * Obtiene el icono para un tipo de servicio
   */
  getServiceIcon(serviceType) {
    const category = this.categorizeService(serviceType);
    const iconMap = {
      'leveling': '📈',
      'builds': '⚙️',
      'bundles': '📦',
      'content': '🏆',
      'farming': '💰',
      'pvp': '⚔️',
      'coaching': '👨‍🏫',
      'competitive': '🎮',
      'other': '🔧'
    };
    return iconMap[category] || '🎮';
  }
};