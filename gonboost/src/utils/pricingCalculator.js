// frontend/src/utils/pricingCalculator.js - VERSIÓN COMPLETA CON DUNE AWAKENING Y BOSS KILLING D4

const MAX_LEVELS = {
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

const PRICE_PER_LEVEL = {
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

const PARAGON_TIERS_D4 = [
  { min: 1, max: 100, pricePerLevel: 0.10 },
  { min: 101, max: 200, pricePerLevel: 0.50 },
  { min: 201, max: 300, pricePerLevel: 2.60 }
];

const PARAGON_TIERS_D3 = [
  { min: 1, max: 1000, pricePerLevel: 0.05 },
  { min: 1001, max: 5000, pricePerLevel: 0.03 },
  { min: 5001, max: 20000, pricePerLevel: 0.02 }
];

const DUNE_LEVELING_TIERS = [
  { min: 1, max: 100, pricePerLevel: 1.20 },
  { min: 101, max: 150, pricePerLevel: 1.80 },
  { min: 151, max: 200, pricePerLevel: 3.00 }
];

const BASE_PRICES = {
  // PoE 2
  'poe2_build_starter': 40, 'poe2_build_advanced': 65, 'poe2_build_endgame': 85,
  'poe2_leveling_40': 25, 'poe2_leveling_70': 55, 'poe2_leveling_90': 95,
  'poe2_starter_pack': 105, 'poe2_endgame_pack': 225,
  
  // Diablo 4
  'builds_starter': 30, 'builds_ancestral': 50, 'builds_mythic': 150, 'builds_tormented': 200,
  'd4_starter_pack': 60, 'd4_endgame_pack': 300, 'custom_build': 80,
  
  // D4 Bosses
  'boss_andariel': 1.49,
  'boss_duriel': 1.49,
  'boss_belial': 1.49,
  'boss_harbinger': 1.49,
  'boss_urivar': 1.49,
  'boss_zir': 1.49,
  'boss_varshan': 1.49,
  'boss_grigoire': 1.49,
  'boss_beast': 1.49,
  'boss_butcher': 1.49,
  'boss_bartuc': 2.54,
  
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

// Helper functions
const formatBossName = (bossKey) => {
  const names = {
    'andariel': 'Andariel', 'duriel': 'Duriel', 'belial': 'Belial',
    'harbinger': 'Harbinger of Hatred', 'urivar': 'Urivar', 'zir': 'Lord Zir',
    'varshan': 'Varshan', 'grigoire': 'Grigoire', 'beast': 'Beast in the Ice',
    'butcher': 'The Butcher', 'bartuc': 'Bartuc'
  };
  return names[bossKey] || bossKey;
};

const getMaxLevel = (game, serviceType) => {
  const gameConfig = MAX_LEVELS[game];
  if (!gameConfig) return 100;
  return gameConfig[serviceType] || gameConfig.default || 100;
};

const getPricePerLevel = (game, serviceType) => {
  const gameConfig = PRICE_PER_LEVEL[game];
  if (!gameConfig) return 1.5;
  return gameConfig[serviceType] || gameConfig.default || 1.5;
};

const isLevelingService = (serviceType) => {
  const levelingTypes = [
    'leveling', 'powerleveling', 'paragon_leveling', 'variable_leveling',
    'poe2_leveling_40', 'poe2_leveling_70', 'poe2_leveling_90'
  ];
  return levelingTypes.includes(serviceType);
};

const supportsQuantity = (serviceType) => {
  const quantityTypes = [
    'boss_killing', 'mythic_plus', 'wins', 'coaching', 'dungeon_clearing',
    'currency_farming', 'uber_services', 'nightmare_dungeons', 'greater_rift',
    'the_pit_artificer', 'arena', 'placement', 'resource_farming'
  ];
  return quantityTypes.includes(serviceType);
};

const formatServiceName = (serviceType) => {
  const names = {
    'powerleveling': 'Power Leveling', 'leveling': 'Leveling', 'paragon_leveling': 'Paragon Leveling',
    'poe2_leveling_40': 'Leveling 1-40', 'poe2_leveling_70': 'Leveling 1-70', 'poe2_leveling_90': 'Leveling 1-90',
    'builds_starter': 'Starter Build', 'builds_ancestral': 'Ancestral Build',
    'builds_mythic': 'Mythic Build', 'builds_tormented': 'Tormented Build',
    'poe2_build_starter': 'PoE 2 Starter Build', 'poe2_build_advanced': 'PoE 2 Advanced Build',
    'poe2_build_endgame': 'PoE 2 Endgame Build', 'custom_build': 'Custom Build',
    'coaching': 'Coaching Session', 'boss_killing': 'Boss Killing', 'uber_services': 'Uber Boss Service',
    'mythic_plus': 'Mythic+ Dungeon', 'raiding': 'Raid Completion',
    'currency_farming': 'Currency Farming', 'gold_farming': 'Gold Farming', 'resource_farming': 'Resource Farming',
    'pvp_boost': 'PvP Boost', 'arena': 'Arena Matches', 'placement': 'Placement Matches', 'wins': 'Ranked Wins',
    'dune_starter_pack': 'Starter Bundle', 'dune_advanced_pack': 'Advanced Bundle',
    'dune_endgame_pack': 'Endgame Bundle', 'dune_base_construction': 'Base Construction',
    'dune_craft_vehicle': 'Craft Vehicle'
  };
  return names[serviceType] || serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Pricing calculation functions
const calculatePowerlevelingPriceD4 = (currentLevel, desiredLevel) => {
  if (currentLevel >= desiredLevel) return { totalPrice: 0, breakdown: [] };
  const pricePerLevel = 0.17;
  const levels = desiredLevel - currentLevel;
  const totalPrice = levels * pricePerLevel;
  return { totalPrice, breakdown: [{ item: `Levels ${currentLevel}-${desiredLevel} (${levels} levels × $${pricePerLevel.toFixed(2)})`, amount: totalPrice }] };
};

const calculateParagonPriceD4 = (currentLevel, desiredLevel) => {
  if (currentLevel >= desiredLevel) return { totalPrice: 0, breakdown: [] };
  const breakdown = [];
  let totalPrice = 0;
  let remainingStart = currentLevel;
  for (const tier of PARAGON_TIERS_D4) {
    if (remainingStart >= desiredLevel) break;
    const tierStart = Math.max(remainingStart, tier.min);
    const tierEnd = Math.min(desiredLevel, tier.max);
    if (tierStart < tierEnd) {
      const levelsInTier = tierEnd - tierStart;
      const tierPrice = levelsInTier * tier.pricePerLevel;
      if (levelsInTier > 0) {
        totalPrice += tierPrice;
        breakdown.push({ item: `Paragon ${tierStart}-${tierEnd} (${levelsInTier} levels × $${tier.pricePerLevel.toFixed(2)})`, amount: tierPrice });
      }
      remainingStart = tierEnd;
    }
  }
  return { totalPrice, breakdown };
};

const calculateParagonPriceD3 = (currentLevel, desiredLevel) => {
  if (currentLevel >= desiredLevel) return { totalPrice: 0, breakdown: [] };
  const breakdown = [];
  let totalPrice = 0;
  let remainingStart = currentLevel;
  for (const tier of PARAGON_TIERS_D3) {
    if (remainingStart >= desiredLevel) break;
    const tierStart = Math.max(remainingStart, tier.min);
    const tierEnd = Math.min(desiredLevel, tier.max);
    if (tierStart < tierEnd) {
      const levelsInTier = tierEnd - tierStart;
      const tierPrice = levelsInTier * tier.pricePerLevel;
      totalPrice += tierPrice;
      breakdown.push({ item: `Paragon ${tierStart}-${tierEnd} (${levelsInTier} levels × $${tier.pricePerLevel})`, amount: tierPrice });
      remainingStart = tierEnd;
    }
  }
  return { totalPrice, breakdown };
};

const calculateParagonPriceImmortal = (currentLevel, desiredLevel) => {
  if (currentLevel >= desiredLevel) return { totalPrice: 0, breakdown: [] };
  const pricePerLevel = PRICE_PER_LEVEL['Diablo Immortal']?.paragon_leveling || 0.08;
  const levels = desiredLevel - currentLevel;
  const totalPrice = levels * pricePerLevel;
  return { totalPrice, breakdown: [{ item: `${levels} Paragon levels × $${pricePerLevel}`, amount: totalPrice }] };
};

const calculateDuneLevelingPrice = (currentLevel, desiredLevel) => {
  if (currentLevel >= desiredLevel) return { totalPrice: 0, breakdown: [] };
  const breakdown = [];
  let totalPrice = 0;
  let remainingStart = currentLevel;
  for (const tier of DUNE_LEVELING_TIERS) {
    if (remainingStart >= desiredLevel) break;
    const tierStart = Math.max(remainingStart, tier.min);
    const tierEnd = Math.min(desiredLevel, tier.max);
    if (tierStart < tierEnd) {
      const levelsInTier = tierEnd - tierStart;
      const tierPrice = levelsInTier * tier.pricePerLevel;
      if (levelsInTier > 0) {
        totalPrice += tierPrice;
        breakdown.push({ item: `Levels ${tierStart}-${tierEnd} (${levelsInTier} levels × $${tier.pricePerLevel.toFixed(2)})`, amount: tierPrice });
      }
      remainingStart = tierEnd;
    }
  }
  return { totalPrice, breakdown };
};

const calculateSimpleLevelingPrice = (game, serviceType, currentLevel, desiredLevel, basePriceOverride) => {
  if (currentLevel >= desiredLevel) return { totalPrice: 0, breakdown: [] };
  const isDiablo4Leveling = game === 'Diablo 4' && (serviceType === 'powerleveling' || serviceType === 'leveling');
  let basePrice = 0;
  if (!isDiablo4Leveling) basePrice = basePriceOverride || BASE_PRICES[serviceType] || 35;
  const pricePerLevel = getPricePerLevel(game, serviceType);
  const levels = desiredLevel - currentLevel;
  let totalPrice = basePrice + (levels * pricePerLevel);
  const gameModifiers = {
    'World of Warcraft Classic': 1.3, 'World of Warcraft Retail': 1.4, 'Diablo 4': 1.0,
    'Diablo 3': 0.9, 'Path of Exile': 0.9, 'Path of Exile 2': 1.0, 'Dune Awakening': 1.0
  };
  const modifier = gameModifiers[game] || 1.0;
  totalPrice = totalPrice * modifier;
  const breakdown = [];
  if (basePrice > 0) breakdown.push({ item: `Base Service (${formatServiceName(serviceType)})`, amount: basePrice });
  breakdown.push({ item: `${levels} levels × $${pricePerLevel}`, amount: levels * pricePerLevel });
  return { totalPrice, breakdown };
};

const calculatePoE2LevelingPrice = (serviceType) => {
  const prices = { 'poe2_leveling_40': 25, 'poe2_leveling_70': 55, 'poe2_leveling_90': 95 };
  const names = { 'poe2_leveling_40': 'Leveling 1-40', 'poe2_leveling_70': 'Leveling 1-70', 'poe2_leveling_90': 'Leveling 1-90' };
  const price = prices[serviceType] || 55;
  return { totalPrice: price, breakdown: [{ item: names[serviceType] || formatServiceName(serviceType), amount: price }] };
};

const calculateBossKillingPriceD4 = (serviceDetails, options = {}) => {
  const selectedBoss = options.selectedBoss || 'andariel';
  const runs = Number(serviceDetails.quantity) || 50;
  const bossKey = `boss_${selectedBoss}`;
  const basePricePerRun = BASE_PRICES[bossKey] || 1.49;
  
  // Price scaling by quantity - UPDATED DISCOUNTS
  let priceMultiplier = 1.0;
  
  if (runs <= 25) {
    priceMultiplier = 1.00;
  } else if (runs <= 50) {
    priceMultiplier = 0.95;  // 5% discount
  } else if (runs <= 100) {
    priceMultiplier = 0.90;  // 10% discount
  } else {
    priceMultiplier = 0.85;  // 15% discount
  }
  
  const adjustedPricePerRun = basePricePerRun * priceMultiplier;
  let total = adjustedPricePerRun * runs;
  
  // Add materials if selected
  if (options.includeMaterials) {
    const bossConfig = options.bossConfig || {};
    const matPrice = bossConfig.materialPrice || 0.50;
    const matSets = Number(options.materialSets) || runs;
    total += matPrice * matSets;
  }
  
  return total;
};

const calculatePrice = (serviceType, serviceDetails, game, options = {}) => {
  const currentLevel = Number(serviceDetails.currentLevel) || 1;
  const desiredLevel = Number(serviceDetails.desiredLevel) || 10;
  const basePrice = Number(serviceDetails.basePrice) || 0;

  // D4 Boss Killing
  if (serviceType === 'boss_killing' && game === 'Diablo 4') {
    return calculateBossKillingPriceD4(serviceDetails, options);
  }

  if ((serviceType === 'powerleveling' || serviceType === 'leveling') && game === 'Dune Awakening') {
    const result = calculateDuneLevelingPrice(currentLevel, desiredLevel);
    let total = result.totalPrice;
    if (options.buildAddon && options.buildPrice) total += Number(options.buildPrice) || 0;
    return total;
  }

  if ((serviceType === 'powerleveling' || serviceType === 'leveling') && game === 'Diablo 4') {
    const result = calculatePowerlevelingPriceD4(currentLevel, desiredLevel);
    let total = result.totalPrice;
    if (options.buildAddon && options.buildPrice) total += Number(options.buildPrice) || 0;
    return total;
  }

  if (serviceType === 'paragon_leveling' && game === 'Diablo 4') {
    const result = calculateParagonPriceD4(currentLevel, desiredLevel);
    let total = result.totalPrice;
    if (options.buildAddon && options.buildPrice) total += Number(options.buildPrice) || 0;
    return total;
  }

  if (serviceType === 'paragon_leveling' && game === 'Diablo 3') {
    const result = calculateParagonPriceD3(currentLevel, desiredLevel);
    let total = result.totalPrice;
    if (options.buildAddon && options.buildPrice) total += Number(options.buildPrice) || 0;
    return total;
  }

  if (serviceType === 'paragon_leveling' && game === 'Diablo Immortal') {
    const result = calculateParagonPriceImmortal(currentLevel, desiredLevel);
    let total = result.totalPrice;
    if (options.buildAddon && options.buildPrice) total += Number(options.buildPrice) || 0;
    return total;
  }

  if (serviceType.startsWith('poe2_leveling_')) {
    return calculatePoE2LevelingPrice(serviceType).totalPrice;
  }

  if (isLevelingService(serviceType)) {
    const result = calculateSimpleLevelingPrice(game, serviceType, currentLevel, desiredLevel, basePrice);
    let total = result.totalPrice;
    if (options.buildAddon && options.buildPrice) total += Number(options.buildPrice) || 0;
    return total;
  }

  if (supportsQuantity(serviceType) && serviceDetails.quantity) {
    const unitPrice = basePrice || BASE_PRICES[serviceType] || 35;
    return unitPrice * Number(serviceDetails.quantity);
  }

  return basePrice || BASE_PRICES[serviceType] || 35;
};

const getPriceBreakdown = (serviceType, serviceDetails, game, options = {}) => {
  const currentLevel = Number(serviceDetails.currentLevel) || 1;
  const desiredLevel = Number(serviceDetails.desiredLevel) || 10;
  const basePrice = Number(serviceDetails.basePrice) || 0;

  // D4 Boss Killing Breakdown
  if (serviceType === 'boss_killing' && game === 'Diablo 4') {
    const selectedBoss = options.selectedBoss || 'andariel';
    const bossConfig = options.bossConfig || {};
    const bossName = bossConfig.label || formatBossName(selectedBoss);
    const runs = Number(serviceDetails.quantity) || 50;
    const bossKey = `boss_${selectedBoss}`;
    const basePricePerRun = BASE_PRICES[bossKey] || 1.49;
    
    let priceMultiplier = 1.0;
    let discountText = '';
    let discountPercent = 0;
    
    if (runs <= 25) {
      priceMultiplier = 1.00;
      discountText = '';
      discountPercent = 0;
    } else if (runs <= 50) {
      priceMultiplier = 0.95;
      discountText = ' (5% bulk discount)';
      discountPercent = 5;
    } else if (runs <= 100) {
      priceMultiplier = 0.90;
      discountText = ' (10% bulk discount)';
      discountPercent = 10;
    } else {
      priceMultiplier = 0.85;
      discountText = ' (15% bulk discount)';
      discountPercent = 15;
    }
    
    const adjustedPricePerRun = basePricePerRun * priceMultiplier;
    const runsTotal = adjustedPricePerRun * runs;
    
    const breakdown = [
      { 
        item: `${bossName} × ${runs} runs${discountText}`, 
        amount: runsTotal,
        detail: `$${adjustedPricePerRun.toFixed(2)} per run (was $${basePricePerRun.toFixed(2)})`
      }
    ];
    
    if (options.includeMaterials) {
      const materialName = bossConfig.materialName || 'Summoning Materials';
      const matPrice = bossConfig.materialPrice || 0.50;
      const matSets = Number(options.materialSets) || runs;
      const matTotal = matPrice * matSets;
      breakdown.push({
        item: `${materialName} (${matSets} sets)`,
        amount: matTotal,
        detail: `$${matPrice.toFixed(2)} per set`
      });
    }
    
    if (options.mode === 'piloted') {
      breakdown.push({ item: 'Mode: Piloted (Account Sharing)', amount: 0 });
    } else {
      breakdown.push({ item: 'Mode: Self-Play (You Play)', amount: 0 });
    }
    
    const grandTotal = breakdown.reduce((sum, item) => sum + item.amount, 0);
    breakdown.push({ item: 'TOTAL', amount: grandTotal, isTotal: true });
    
    return breakdown;
  }

  if ((serviceType === 'powerleveling' || serviceType === 'leveling') && game === 'Dune Awakening') {
    const result = calculateDuneLevelingPrice(currentLevel, desiredLevel);
    const breakdown = [...result.breakdown];
    if (options.buildAddon && options.buildPrice) {
      breakdown.push({ item: `Add-on: ${options.buildName || 'Class Unlock'}`, amount: Number(options.buildPrice) || 0 });
    }
    const total = result.totalPrice + (options.buildAddon ? (Number(options.buildPrice) || 0) : 0);
    breakdown.push({ item: 'TOTAL', amount: total, isTotal: true });
    return breakdown;
  }

  if ((serviceType === 'powerleveling' || serviceType === 'leveling') && game === 'Diablo 4') {
    const result = calculatePowerlevelingPriceD4(currentLevel, desiredLevel);
    const breakdown = [...result.breakdown];
    if (options.buildAddon && options.buildPrice) {
      breakdown.push({ item: `Add-on: ${options.buildName || 'Starter Build'}`, amount: Number(options.buildPrice) || 0 });
    }
    const total = result.totalPrice + (options.buildPrice || 0);
    breakdown.push({ item: 'TOTAL', amount: total, isTotal: true });
    return breakdown;
  }

  if (serviceType === 'paragon_leveling' && game === 'Diablo 4') {
    const result = calculateParagonPriceD4(currentLevel, desiredLevel);
    const breakdown = [...result.breakdown];
    if (options.buildAddon && options.buildPrice) {
      breakdown.push({ item: `Add-on: ${options.buildName || 'Build'}`, amount: Number(options.buildPrice) || 0 });
    }
    const total = result.totalPrice + (options.buildPrice || 0);
    breakdown.push({ item: 'TOTAL', amount: total, isTotal: true });
    return breakdown;
  }

  if (serviceType === 'paragon_leveling' && game === 'Diablo 3') {
    const result = calculateParagonPriceD3(currentLevel, desiredLevel);
    const breakdown = [...result.breakdown];
    if (options.buildAddon && options.buildPrice) {
      breakdown.push({ item: `Add-on: ${options.buildName || 'Build'}`, amount: Number(options.buildPrice) || 0 });
    }
    const total = result.totalPrice + (options.buildPrice || 0);
    breakdown.push({ item: 'TOTAL', amount: total, isTotal: true });
    return breakdown;
  }

  if (serviceType === 'paragon_leveling' && game === 'Diablo Immortal') {
    const result = calculateParagonPriceImmortal(currentLevel, desiredLevel);
    const breakdown = [...result.breakdown];
    if (options.buildAddon && options.buildPrice) {
      breakdown.push({ item: `Add-on: ${options.buildName || 'Build'}`, amount: Number(options.buildPrice) || 0 });
    }
    const total = result.totalPrice + (options.buildPrice || 0);
    breakdown.push({ item: 'TOTAL', amount: total, isTotal: true });
    return breakdown;
  }

  if (serviceType.startsWith('poe2_leveling_')) {
    const result = calculatePoE2LevelingPrice(serviceType);
    return [...result.breakdown, { item: 'TOTAL', amount: result.totalPrice, isTotal: true }];
  }

  if (isLevelingService(serviceType)) {
    const result = calculateSimpleLevelingPrice(game, serviceType, currentLevel, desiredLevel, basePrice);
    const breakdown = [...result.breakdown];
    if (options.buildAddon && options.buildPrice) {
      breakdown.push({ item: `Add-on: ${options.buildName || 'Build'}`, amount: Number(options.buildPrice) || 0 });
    }
    const total = result.totalPrice + (options.buildPrice || 0);
    breakdown.push({ item: 'TOTAL', amount: total, isTotal: true });
    return breakdown;
  }

  if (supportsQuantity(serviceType) && serviceDetails.quantity) {
    const unitPrice = basePrice || BASE_PRICES[serviceType] || 35;
    const total = unitPrice * Number(serviceDetails.quantity);
    return [
      { item: `${formatServiceName(serviceType)} × ${serviceDetails.quantity}`, amount: total },
      { item: 'TOTAL', amount: total, isTotal: true }
    ];
  }

  const fixedPrice = basePrice || BASE_PRICES[serviceType] || 35;
  return [
    { item: formatServiceName(serviceType), amount: fixedPrice },
    { item: 'TOTAL', amount: fixedPrice, isTotal: true }
  ];
};

const getPriceRanges = (game, serviceType) => {
  if (game === 'Diablo 4' && (serviceType === 'powerleveling' || serviceType === 'leveling')) {
    return [{ label: 'Level 1-60', from: 1, to: 60, price: 10.20 }];
  }
  if (serviceType === 'paragon_leveling' && game === 'Diablo 4') {
    return [
      { label: '1-100 Paragon', from: 1, to: 100, price: 10 },
      { label: '1-200 Paragon', from: 1, to: 200, price: 60 },
      { label: '1-300 Paragon', from: 1, to: 300, price: 320 }
    ];
  }
  if (serviceType === 'paragon_leveling' && game === 'Diablo 3') {
    return [
      { label: '1-1000 Paragon', from: 1, to: 1000, price: 50 },
      { label: '1-5000 Paragon', from: 1, to: 5000, price: 170 }
    ];
  }
  if (game === 'Path of Exile 2' && serviceType.startsWith('poe2_leveling')) {
    return [
      { label: 'Level 1-40', from: 1, to: 40, price: 25 },
      { label: 'Level 1-70', from: 1, to: 70, price: 55 },
      { label: 'Level 1-90', from: 1, to: 90, price: 95 }
    ];
  }
  if (game === 'Dune Awakening' && (serviceType === 'powerleveling' || serviceType === 'leveling')) {
    return [
      { label: 'Level 1-100', from: 1, to: 100, price: 120 },
      { label: 'Level 1-150', from: 1, to: 150, price: 210 },
      { label: 'Level 1-200', from: 1, to: 200, price: 360 }
    ];
  }
  if (game === 'Diablo 3' && (serviceType === 'powerleveling' || serviceType === 'leveling')) {
    return [{ label: 'Level 1-70', from: 1, to: 70, price: 90 }];
  }
  if (game === 'World of Warcraft Classic' && (serviceType === 'powerleveling' || serviceType === 'leveling')) {
    return [
      { label: 'Level 1-60', from: 1, to: 60, price: 280 },
      { label: 'Level 1-85', from: 1, to: 85, price: 420 }
    ];
  }
  return [];
};

const pricingCalculator = {
  calculatePrice,
  getPriceBreakdown,
  getPriceRanges,
  getMaxLevel,
  getPricePerLevel,
  isLevelingService,
  supportsQuantity,
  formatServiceName,
  BASE_PRICES,
  PARAGON_TIERS_D4,
  PARAGON_TIERS_D3,
  DUNE_LEVELING_TIERS
};

export default pricingCalculator;