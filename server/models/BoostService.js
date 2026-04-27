// backend/models/BoostService.js - VERSIÓN COMPLETA CON CALL OF DUTY Y MOP RAIDS

import mongoose from 'mongoose';

const boostServiceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres']
  },
  description: { 
    type: String, 
    required: [true, 'La descripción es requerida'],
    trim: true,
    minlength: [10, 'La descripción debe tener al menos 10 caracteres']
  },
  basePrice: { 
    type: Number, 
    required: false,
    min: [0, 'El precio no puede ser negativo'],
    default: 0
  },
  available: { type: Boolean, default: true },
  game: { type: String, required: [true, 'El juego es requerido'], trim: true },
  serviceType: { type: String, required: [true, 'El tipo de servicio es requerido'], trim: true },

  levelingConfig: {
    minLevel: { type: Number, default: 1 },
    maxLevel: { type: Number, default: 1000 },
    pricePerLevel: { type: Number, default: 0.12 },
    basePrice: { type: Number, default: 20 },
    volumeDiscounts: [{ threshold: { type: Number }, discount: { type: Number } }],
    predefinedRanges: [{ from: { type: Number }, to: { type: Number }, price: { type: Number }, label: { type: String } }]
  },

  buildConfig: {
    tier: { type: String, enum: ['starter', 'ancestral', 'mythic', 'tormented', 'endgame', 'standard', 'custom', 'silver', 'platinum', 'advanced'] },
    includesTormented: { type: Boolean, default: false },
    features: [{ name: { type: String }, description: { type: String }, included: { type: Boolean, default: true } }],
    requirements: [{ type: String }],
    estimatedCompletion: { type: String },
    class: { type: String },
    buildType: { type: String }
  },

  bundleConfig: {
    services: [{
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'BoostService' },
      serviceType: { type: String },
      name: { type: String },
      quantity: { type: Number, default: 1 },
      basePrice: { type: Number }
    }],
    discountPercent: { type: Number, default: 20 },
    originalTotal: { type: Number },
    finalPrice: { type: Number },
    features: [{ type: String }],
    estimatedTotalTime: { type: String },
    availableFactions: [{ type: String }],
    availableProfessions: [{ type: String }],
    professionCount: { type: Number, default: 1 }
  },

  // Dune Awakening - Base Construction Config
  baseConfig: {
    availableSizes: [{
      key: { type: String },
      name: { type: String },
      price: { type: Number },
      description: { type: String },
      icon: { type: String },
      features: [{ type: String }]
    }],
    availableAddons: [{
      key: { type: String },
      name: { type: String },
      price: { type: Number },
      description: { type: String },
      icon: { type: String }
    }]
  },

  // Dune Awakening - Craft Vehicle Config
  vehicleConfig: {
    availableVehicles: [{
      key: { type: String },
      name: { type: String },
      icon: { type: String },
      description: { type: String },
      mkOptions: [{
        key: { type: String },
        name: { type: String },
        price: { type: Number },
        note: { type: String }
      }]
    }],
    deliverySpeeds: [{
      key: { type: String },
      name: { type: String },
      multiplier: { type: Number }
    }],
    rewards: [{ type: String }],
    requirements: [{ type: String }]
  },

  franchise: {
    type: String,
    enum: ['Diablo', 'Path of Exile', 'World of Warcraft', 'Call of Duty', 'Dune', 'Last Epoch', 'Battlefield', 'Other'],
    default: 'Other'
  },

  category: {
    type: String,
    enum: ['leveling', 'builds', 'bundles', 'content', 'pvp', 'farming', 'coaching', 'competitive', 'other'],
    default: 'other'
  },

  // ===== CAMPOS PARA SERVICIOS CUSTOM =====
  priceType: {
    type: String,
    enum: ['fixed', 'variable', 'range', 'negotiable'],
    default: 'fixed'
  },
  priceOptions: [{
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String }
  }],
  // =========================================

  estimatedTime: { type: String, required: false, default: '2-3 días', trim: true },

  features: {
    type: [String],
    default: ['Booster profesional', 'Soporte 24/7', 'Pago seguro', 'Seguimiento en vivo']
  },

  requirements: { type: [String], default: [] },

  variables: {
    hasHours: { type: Boolean, default: false },
    hasWins: { type: Boolean, default: false },
    hasMatches: { type: Boolean, default: false },
    hasLevels: { type: Boolean, default: false },
    hasFocusAreas: { type: Boolean, default: false },
    hasBuildSelection: { type: Boolean, default: false },
    hasBundleSelection: { type: Boolean, default: false },
    hasFactionSelection: { type: Boolean, default: false },
    hasProfessionSelection: { type: Boolean, default: false },
    availableModifiers: [{
      type: String,
      enum: ['priority', 'streaming', 'duo_queue', 'specific_build', 'hardcore', 'offpeak']
    }]
  },

  popularity: { type: Number, default: 0, min: 0 },
  completionRate: { type: Number, default: 95, min: 0, max: 100 },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true,
  collection: 'boostservices'
});

// Índices
boostServiceSchema.index({ game: 1, serviceType: 1 });
boostServiceSchema.index({ available: 1, isActive: 1 });
boostServiceSchema.index({ category: 1 });
boostServiceSchema.index({ franchise: 1 });
boostServiceSchema.index({ priceType: 1 });

// Métodos de instancia
boostServiceSchema.methods.getFormattedPrice = function() {
  if (this.priceType === 'variable' || this.priceType === 'negotiable') {
    return `Desde $${this.basePrice?.toFixed(2) || '0.00'}`;
  }
  if (this.priceOptions && this.priceOptions.length > 0) {
    const minPrice = Math.min(...this.priceOptions.map(o => o.price));
    return `Desde $${minPrice.toFixed(2)}`;
  }
  if (this.serviceType === 'powerleveling' || this.serviceType === 'leveling') {
    return `$${this.basePrice?.toFixed(2) || '1.20'}/nivel`;
  }
  if (this.serviceType === 'dune_base_construction') {
    return `Desde $${this.basePrice || 20}`;
  }
  if (this.serviceType === 'dune_craft_vehicle') {
    return `Desde $${this.basePrice || 10}`;
  }
  if (this.serviceType?.startsWith('bundle_') || this.serviceType?.includes('_pack')) {
    if (this.bundleConfig?.finalPrice) {
      return `$${this.bundleConfig.finalPrice} (${this.bundleConfig.discountPercent}% off)`;
    }
    return `$${this.basePrice || 60}`;
  }
  if (this.serviceType === 'variable_leveling') {
    return `Desde $${this.levelingConfig?.basePrice || 20}`;
  }
  if (this.serviceType?.includes('build') || this.serviceType === 'custom_build') {
    return `$${this.basePrice} - Build Completo`;
  }
  if (this.serviceType?.startsWith('poe2_leveling')) {
    return `$${this.basePrice} - Leveling Completo`;
  }
  // MoP Raids
  if (this.serviceType?.startsWith('mop_')) {
    return `Desde $${this.basePrice || 180}`;
  }
  return `$${this.basePrice || 0}`;
};

boostServiceSchema.methods.isAvailable = function() {
  return this.available && this.isActive;
};

// Middleware pre-validate
boostServiceSchema.pre('validate', function(next) {
  if (!this.estimatedTime || this.estimatedTime.trim() === '') {
    this.estimatedTime = '2-3 días';
  }

  if (this.isNew && (this.basePrice === undefined || this.basePrice === null || this.basePrice < 0)) {
    const defaultPrices = {
      // PoE 2
      'poe2_build_starter': 40, 'poe2_build_advanced': 65, 'poe2_build_endgame': 85,
      'poe2_leveling_40': 25, 'poe2_leveling_70': 55, 'poe2_leveling_90': 95,
      'poe2_starter_pack': 105, 'poe2_endgame_pack': 225,

      // Diablo 4
      'builds_starter': 30, 'builds_ancestral': 50, 'builds_mythic': 150, 'builds_tormented': 200,
      'd4_starter_pack': 60, 'd4_endgame_pack': 300, 'custom_build': 80,
      'powerleveling_d4': 0.17, 'paragon_leveling': 0,

      // Dune Awakening
      'dune_base_construction': 20,
      'dune_craft_vehicle': 10,
      'dune_starter_pack': 45, 'dune_advanced_pack': 99, 'dune_endgame_pack': 199,
      'powerleveling': 1.20, 'leveling': 1.20,
      'resource_farming': 35, 'currency_farming': 30,

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
      'mythic_plus': 75, 'raiding': 90, 'currency_farming': 30, 'gold_farming': 25,
      'item_farming': 28, 'pvp_boost': 55, 'arena': 50, 'placement': 45, 'wins': 40,
      'variable_leveling': 0,

      // Call of Duty
      'rank_boost': 50, 'camo_unlock': 40, 'battle_pass': 35, 'weapon_leveling': 30,
      'operator_unlock': 25, 'calling_card': 20, 'prestige': 45, 'resurgence_wins': 35,
      'duo_wins': 30, 'squad_wins': 40, 'nuke_contract': 100, 'interrogation': 25,
      'zombies_rounds': 35, 'easter_egg': 50, 'dark_ops': 45, 'custom_service': 50,

      // ========== MOP CLASSIC RAIDS ==========
      'mop_mogushan_vaults': 180,
      'mop_heart_of_fear': 240,
      'mop_terrace_endless_spring': 190,
      'mop_throne_of_thunder': 190
    };

    if (defaultPrices[this.serviceType] !== undefined) {
      this.basePrice = defaultPrices[this.serviceType];
      console.log(`💰 Precio por defecto asignado para ${this.serviceType}: $${this.basePrice}`);
    }
  }

  if (!this.name || this.name.trim().length < 3) {
    this.invalidate('name', 'El nombre debe tener al menos 3 caracteres');
  }

  if (!this.description || this.description.trim().length < 10) {
    this.invalidate('description', 'La descripción debe tener al menos 10 caracteres');
  }

  // ========== VALIDACIÓN DE JUEGOS - ACTUALIZADA CON CALL OF DUTY ==========
  const validGames = [
    'Diablo 2 Resurrected', 'Diablo 3', 'Diablo 4', 'Diablo Immortal',
    'World of Warcraft Retail', 'World of Warcraft Classic',
    'Path of Exile', 'Path of Exile 2', 'Dune Awakening', 'Last Epoch',
    // ========== CALL OF DUTY ==========
    'Call of Duty: Modern Warfare III',
    'Call of Duty: Warzone',
    'Call of Duty: Black Ops 7'
  ];

  if (this.game && !validGames.includes(this.game)) {
    const gameMap = {
      'Diablo 2': 'Diablo 2 Resurrected', 'D2': 'Diablo 2 Resurrected',
      'D3': 'Diablo 3', 'D4': 'Diablo 4', 'Immortal': 'Diablo Immortal',
      'WoW': 'World of Warcraft Retail', 'World of Warcraft': 'World of Warcraft Retail',
      'Retail': 'World of Warcraft Retail', 'WoW Classic': 'World of Warcraft Classic',
      'Classic': 'World of Warcraft Classic', 'PoE': 'Path of Exile',
      'PoE 2': 'Path of Exile 2', 'PoE2': 'Path of Exile 2',
      'Dune': 'Dune Awakening', 'LE': 'Last Epoch',
      // Call of Duty mappings
      'MW3': 'Call of Duty: Modern Warfare III', 'MWIII': 'Call of Duty: Modern Warfare III',
      'Warzone': 'Call of Duty: Warzone', 'WZ': 'Call of Duty: Warzone',
      'BO7': 'Call of Duty: Black Ops 7', 'Black Ops 7': 'Call of Duty: Black Ops 7',
      'Call of Duty': 'Call of Duty: Modern Warfare III'
    };
    if (gameMap[this.game]) this.game = gameMap[this.game];
  }

  // Validar priceOptions si existe
  if (this.priceOptions && this.priceOptions.length > 0) {
    for (const option of this.priceOptions) {
      if (!option.name || option.name.trim() === '') {
        this.invalidate('priceOptions', 'Todas las opciones de precio deben tener un nombre');
        break;
      }
      if (option.price === undefined || option.price === null || option.price < 0) {
        this.invalidate('priceOptions', 'Todas las opciones de precio deben tener un precio válido');
        break;
      }
    }
  }

  next();
});

// Middleware pre-save
boostServiceSchema.pre('save', function(next) {
  if (this.isModified('serviceType') || !this.category) {
    const categoryMap = {
      'powerleveling': 'leveling', 'paragon_leveling': 'leveling', 'leveling': 'leveling',
      'variable_leveling': 'leveling', 'achievements': 'leveling', 'powerleveling_d4': 'leveling',
      'poe2_leveling_40': 'leveling', 'poe2_leveling_70': 'leveling', 'poe2_leveling_90': 'leveling',

      'builds': 'builds', 'builds_starter': 'builds', 'builds_ancestral': 'builds',
      'builds_mythic': 'builds', 'builds_tormented': 'builds',
      'poe_starter_build': 'builds', 'poe_endgame_build': 'builds',
      'poe2_build_starter': 'builds', 'poe2_build_advanced': 'builds', 'poe2_build_endgame': 'builds',
      'build_services': 'builds', 'runewords': 'builds', 'custom_build': 'builds',
      'dune_base_construction': 'builds',
      'dune_craft_vehicle': 'builds',

      'd2_starter_pack': 'bundles', 'd2_endgame_pack': 'bundles',
      'd3_starter_pack': 'bundles', 'd3_endgame_pack': 'bundles',
      'd4_starter_pack': 'bundles', 'd4_endgame_pack': 'bundles',
      'immortal_starter_pack': 'bundles', 'immortal_endgame_pack': 'bundles',
      'wow_starter_pack': 'bundles', 'wow_endgame_pack': 'bundles',
      'classic_starter_pack': 'bundles', 'classic_endgame_pack': 'bundles',
      'tbc_starter_pack': 'bundles', 'tbc_endgame_pack': 'bundles',
      'poe_starter_pack': 'bundles', 'poe_endgame_pack': 'bundles',
      'poe2_starter_pack': 'bundles', 'poe2_endgame_pack': 'bundles',
      'dune_starter_pack': 'bundles', 'dune_advanced_pack': 'bundles', 'dune_endgame_pack': 'bundles',
      'last_epoch_starter_pack': 'bundles', 'last_epoch_endgame_pack': 'bundles',

      'boss_killing': 'content', 'dungeon_clearing': 'content', 'nightmare_dungeons': 'content',
      'uber_services': 'content', 'mythic_plus': 'content', 'raiding': 'content',
      'greater_rift': 'content', 'monolith_farming': 'content',

      'pvp_boost': 'pvp', 'placement': 'competitive', 'wins': 'competitive', 'arena': 'competitive',

      'currency_farming': 'farming', 'gold_farming': 'farming', 'item_farming': 'farming',
      'resource_farming': 'farming',

      'coaching': 'coaching',

      // Call of Duty
      'rank_boost': 'competitive', 'camo_unlock': 'content', 'battle_pass': 'content',
      'weapon_leveling': 'leveling', 'operator_unlock': 'content', 'calling_card': 'content',
      'prestige': 'leveling', 'resurgence_wins': 'competitive', 'duo_wins': 'competitive',
      'squad_wins': 'competitive', 'nuke_contract': 'competitive', 'interrogation': 'content',
      'zombies_rounds': 'content', 'easter_egg': 'content', 'dark_ops': 'content',
      'custom_service': 'other',

      // ========== MOP CLASSIC RAIDS ==========
      'mop_mogushan_vaults': 'content',
      'mop_heart_of_fear': 'content',
      'mop_terrace_endless_spring': 'content',
      'mop_throne_of_thunder': 'content'
    };
    this.category = categoryMap[this.serviceType] || 'other';
  }

  // Configurar variables para packs TBC
  if (this.serviceType === 'tbc_starter_pack' || this.serviceType === 'tbc_endgame_pack') {
    if (!this.variables) this.variables = {};
    this.variables.hasBundleSelection = true;
    this.variables.hasFactionSelection = true;
    this.variables.hasProfessionSelection = true;

    if (!this.bundleConfig) this.bundleConfig = {};
    this.bundleConfig.availableFactions = ['Aldor', 'Scryers'];
    this.bundleConfig.availableProfessions = [
      'Alchemy', 'Blacksmithing', 'Leatherworking', 
      'Tailoring', 'Enchanting', 'Engineering', 'Jewelcrafting'
    ];
    this.bundleConfig.professionCount = this.serviceType === 'tbc_starter_pack' ? 1 : 2;
  }

  if (this.serviceType === 'variable_leveling' && !this.levelingConfig) {
    this.levelingConfig = {
      minLevel: 1, maxLevel: 1000, pricePerLevel: 0.12, basePrice: 20,
      volumeDiscounts: [
        { threshold: 100, discount: 0.95 }, { threshold: 250, discount: 0.90 },
        { threshold: 500, discount: 0.85 }, { threshold: 750, discount: 0.80 }
      ]
    };
  }

  if (this.serviceType?.includes('build') || this.serviceType === 'custom_build') {
    if (!this.variables) this.variables = {};
    this.variables.hasBuildSelection = true;
  }

  if (this.serviceType?.includes('_pack')) {
    if (!this.variables) this.variables = {};
    this.variables.hasBundleSelection = true;
    this.category = 'bundles';
  }

  if (this.serviceType?.startsWith('poe2_leveling')) {
    if (!this.variables) this.variables = {};
    this.variables.hasLevels = true;
    this.category = 'leveling';
  }

  if (this.serviceType?.startsWith('poe2_build')) {
    if (!this.variables) this.variables = {};
    this.variables.hasBuildSelection = true;
    this.category = 'builds';
  }

  // ===== DUNE AWAKENING - BASE CONSTRUCTION =====
  if (this.serviceType === 'dune_base_construction') {
    if (!this.variables) this.variables = {};
    this.variables.hasBuildSelection = true;
    this.category = 'builds';

    if (!this.baseConfig) this.baseConfig = {};

    const basePrice = this.basePrice || 20;

    this.baseConfig.availableSizes = [
      { key: 'small_outpost', name: 'Small Outpost', price: basePrice, icon: '🏕️',
        description: 'Basic structure for survival and early game progression',
        features: ['Limited storage & crafting stations', 'One-player ownership', 'Basic efficiency', 'Suitable for survival play', 'Good for early-mid game'] },
      { key: 'medium_sietch', name: 'Medium Sietch', price: 35, icon: '🏘️',
        description: 'Expanded base for small clans and trading operations',
        features: ['Basic storage, crafting, and refinery', 'For small clans/shared access', 'Medium-tier efficiency', 'Great for extended expeditions & trading', 'Strong mid-late game bases'] },
      { key: 'large_fortress', name: 'Large Fortress', price: 52, icon: '🏰',
        description: 'Expansive facility with all utilities and vehicle support',
        features: ['Expansive facility with all utilities', 'Fabricators and refineries included', 'Ground vehicle garage', 'Ornithopter helipad', 'Full crafting capabilities (using your resources)', 'Designed for endgame operations'] },
      { key: 'stronghold', name: 'Stronghold', price: 349, icon: '🏛️',
        description: 'Complete fortress with full fabrication and refining capabilities',
        features: ['Normal storage containers', 'Medium water cistern', 'Improved blood purifiers', 'Medium ore refinery', 'Small chemical refinery', 'Small refinery', 'Wind turbine directional', 'Wind trap', 'Medium spice refinery', 'Fremen deathstill', 'Garment fabricator', 'Survival fabricator', 'Weapons fabricator', 'Vehicles fabricator', 'Decoration, furniture & lightning included', 'Max efficiency'] },
      { key: 'sanctuary', name: 'Sanctuary', price: 692, icon: '🌆',
        description: 'Ultimate base designed for absolute dominance',
        features: ['Medium storage containers', 'Large water cistern', 'Improved blood purifiers', 'Medium ore refinery', 'Medium chemical refinery', 'Large ore refinery', 'Spice-powered generator', 'Large spice refinery', 'Advanced Fremen deathstill', 'Advanced garment fabricator', 'Advanced survival fabricator', 'Advanced weapons fabricator', 'Advanced vehicles fabricator', 'Recycler', 'Repair station', 'Large windtrap', 'Decoration, furniture & lightning included', 'Designed for absolute dominance', 'Ultimate efficiency'] }
    ];

    this.baseConfig.availableAddons = [
      { key: 'defenses', name: 'Advanced Defense Systems', price: 35, icon: '🛡️', description: 'Automated turrets, shields, and perimeter traps' },
      { key: 'automation', name: 'Full Automation', price: 45, icon: '🤖', description: 'Automated resource collection and management' },
      { key: 'resources', name: 'Starter Resource Pack', price: 20, icon: '💰', description: '20,000 Solari + Construction materials' },
      { key: 'class_unlock', name: 'Class Unlock', price: 35, icon: '🎮', description: 'Unlock any class for your character' }
    ];
  }

  // ===== DUNE AWAKENING - CRAFT VEHICLE =====
  if (this.serviceType === 'dune_craft_vehicle') {
    if (!this.variables) this.variables = {};
    this.variables.hasBuildSelection = true;
    this.category = 'builds';

    if (!this.vehicleConfig) this.vehicleConfig = {};

    this.vehicleConfig.availableVehicles = [
      {
        key: 'sandbike', name: 'Sandbike', icon: '🏍️', description: 'Entry-level transportation',
        mkOptions: [
          { key: 'mk1', name: 'MK1', price: 10 },
          { key: 'mk2', name: 'MK2', price: 15 },
          { key: 'mk3', name: 'MK3', price: 20 },
          { key: 'mk4', name: 'MK4', price: 25 },
          { key: 'mk5', name: 'MK5', price: 35, note: 'Requiere Plastanio - Riesgo PvP' },
          { key: 'mk6', name: 'MK6', price: 50, note: 'Requiere Plastanio - Riesgo PvP' }
        ]
      },
      {
        key: 'buggy', name: 'Buggy', icon: '🚙', description: 'Carries multiple passengers, ideal for gathering',
        mkOptions: [
          { key: 'mk3', name: 'MK3', price: 40, note: 'Base Acero' },
          { key: 'mk4', name: 'MK4', price: 65, note: 'Base Aluminio' },
          { key: 'mk5', name: 'MK5', price: 95, note: 'Base Duraluminio - Riesgo PvP Medio' },
          { key: 'mk6', name: 'MK6', price: 140, note: 'Base Plastanio - Riesgo PvP Alto' }
        ]
      },
      {
        key: 'scout_ornithopter', name: 'Scout Ornithopter', icon: '🚁', description: 'Small, fast, agile & modular',
        mkOptions: [
          { key: 'mk4', name: 'MK4', price: 80, note: 'Base Aluminio' },
          { key: 'mk5', name: 'MK5', price: 120, note: 'Base Duraluminio - Incluye farmeo de Intel' },
          { key: 'mk6', name: 'MK6', price: 170, note: 'Base Plastanio' }
        ]
      },
      {
        key: 'assault_ornithopter', name: 'Assault Ornithopter', icon: '🛩️', description: 'Enhanced air transport with greater capacity',
        mkOptions: [
          { key: 'mk5', name: 'MK5', price: 130, note: 'Base Duraluminio - Vehículo de Combate' },
          { key: 'mk6', name: 'MK6', price: 190, note: 'Base Plastanio' }
        ]
      },
      {
        key: 'carrier_ornithopter', name: 'Carrier Ornithopter', icon: '🛫', description: 'Heavy transport that can carry vehicles',
        mkOptions: [
          { key: 'mk6', name: 'MK6', price: 240, note: 'Vehículo más grande del juego - Farmeo masivo de Plastanio' }
        ]
      },
      {
        key: 'sandcrawler', name: 'Sandcrawler', icon: '🏭', description: 'Spice harvesting effectively',
        mkOptions: [
          { key: 'mk6', name: 'MK6', price: 180, note: 'Vehículo de nicho para farmeo de especia' }
        ]
      }
    ];

    this.vehicleConfig.deliverySpeeds = [
      { key: 'normal', name: 'Normal', multiplier: 1.0 },
      { key: 'express', name: 'Express', multiplier: 1.3 },
      { key: 'super_express', name: 'Super Express', multiplier: 1.5 }
    ];

    this.vehicleConfig.rewards = [
      'We will craft your desired vehicle',
      'Chances to get any amount of Solari',
      'Opportunities for base upgrades during the process',
      'Chances to get Spice Sand & Spice Melange during the process',
      'You might get campaign progression during the service',
      'Chances to get new armors and weapons during the process',
      'Chances to acquire intel points',
      'You will get valuable crafting materials and unlock schematics',
      'You might get faction reputation during the service',
      'Chances to complete contracts, shipwrecks, testing station camps and much more',
      'Opportunities to complete side quests during the process',
      'Opportunities to complete achievements during the process',
      'Opportunities to unlock technologies during the service',
      'Chances to acquire any amount of water during the service',
      'Opportunities to get area completion',
      'Chances to unlock one or more classes during the service',
      'All the valuable loot that drops during the service will be saved on your account'
    ];

    this.vehicleConfig.requirements = [
      'You must own a Dune: Awakening account to be suitable for this service',
      'You need a base equipped to process the materials required for the selected vehicle tier (e.g., MK1 – Bronze, MK2 – Iron, MK3 – Steel, MK4 – Aluminum, MK5 – Duraluminium, MK6 – Plastianium/Spice Melange). If your base doesn\'t meet these requirements, please consider our base building service.'
    ];
  }

  // ===== MOP CLASSIC RAIDS =====
  if (this.serviceType?.startsWith('mop_')) {
    if (!this.variables) this.variables = {};
    this.variables.hasBuildSelection = true;
    this.category = 'content';

    const raidTimeMap = {
      'mop_mogushan_vaults': '1-2 horas',
      'mop_heart_of_fear': '1-2 horas',
      'mop_terrace_endless_spring': '1-2 horas',
      'mop_throne_of_thunder': '1-2 días'
    };

    this.estimatedTime = raidTimeMap[this.serviceType] || '1-2 horas';

    if (!this.features) this.features = [];
    if (!this.features.includes('🔒 Método Piloted con VPN')) {
      this.features.push('🔒 Método Piloted con VPN');
    }
    if (!this.features.includes('🏆 Todo el loot para ti')) {
      this.features.push('🏆 Todo el loot para ti');
    }
    if (!this.features.includes('⚡ Clear completo garantizado')) {
      this.features.push('⚡ Clear completo garantizado');
    }
  }

  if ((this.serviceType === 'powerleveling' || this.serviceType === 'leveling') && this.game === 'Dune Awakening') {
    if (!this.variables) this.variables = {};
    this.variables.hasLevels = true;
    this.category = 'leveling';
  }

  if (this.isModified('game') && this.game) {
    const franchiseMap = {
      'Diablo 4': 'Diablo', 'Diablo 3': 'Diablo', 'Diablo 2 Resurrected': 'Diablo', 'Diablo Immortal': 'Diablo',
      'Path of Exile': 'Path of Exile', 'Path of Exile 2': 'Path of Exile',
      'World of Warcraft Retail': 'World of Warcraft', 'World of Warcraft Classic': 'World of Warcraft',
      'Last Epoch': 'Last Epoch', 'Dune Awakening': 'Dune',
      // Call of Duty
      'Call of Duty: Modern Warfare III': 'Call of Duty',
      'Call of Duty: Warzone': 'Call of Duty',
      'Call of Duty: Black Ops 7': 'Call of Duty'
    };
    this.franchise = franchiseMap[this.game] || 'Other';
  }

  if (!this.features || this.features.length === 0) {
    this.features = ['Booster profesional', 'Soporte 24/7', 'Pago seguro', 'Seguimiento en vivo'];
  }

  if (!this.priceType) {
    this.priceType = 'fixed';
  }

  next();
});

// Middleware pre-findOneAndUpdate
boostServiceSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.estimatedTime === '' || update.estimatedTime === null || update.estimatedTime === undefined) {
    update.estimatedTime = '2-3 días';
  }
  if (update.status !== undefined) {
    update.available = update.status === 'active';
    update.isActive = update.status === 'active';
    delete update.status;
  }
  if (update.price !== undefined) {
    update.basePrice = Number(update.price);
    delete update.price;
  }
  if (update.features && !Array.isArray(update.features)) {
    update.features = [update.features];
  }
  this.setUpdate(update);
  next();
});

const BoostService = mongoose.model('BoostService', boostServiceSchema);
export default BoostService;