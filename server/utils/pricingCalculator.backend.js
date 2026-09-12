// backend/utils/pricingCalculator.js
// Toda la DATA de precios vive en config/pricingConfig.js (fuente única).
// Este archivo solo tiene la LÓGICA de cálculo.
import {
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
  MOP_RAID_CONFIG,
  BASE_PRICES
} from '../config/pricingConfig.js';

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
    'dune_craft_vehicle': 'Craft Vehicle', 'the_pit_artificer': 'The Pit Artificer'
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

// Path of Exile 2 - Custom Build
const calculateCustomBuildPrice = (serviceDetails, options = {}) => {
  const categories = CUSTOM_BUILD_CONFIG.basePrices;
  const category = categories[options.category] !== undefined ? options.category : 'Early-game';
  const basePrice = categories[category];

  const levelingOpt = CUSTOM_BUILD_CONFIG.levelingOptions.find(o => o.id === options.levelingOptionId)
    || CUSTOM_BUILD_CONFIG.levelingOptions.find(o => o.id === 'none');
  const levelingPrice = levelingOpt?.price || 0;

  const divineOrbCount = Math.max(0, Number(options.divineOrbCount) || 0);
  const divineOrbPrice = divineOrbCount * CUSTOM_BUILD_CONFIG.divineOrbPriceUnit;

  const selectedAddonIds = Array.isArray(options.selectedAddonIds) ? options.selectedAddonIds : [];
  let addonsPrice = 0;
  const addonsBreakdown = [];
  selectedAddonIds.forEach((id) => {
    const addon = CUSTOM_BUILD_CONFIG.addons.find(a => a.id === id);
    if (addon) {
      addonsPrice += addon.price;
      addonsBreakdown.push({ item: addon.name, amount: addon.price });
    }
  });

  const totalPrice = basePrice + levelingPrice + divineOrbPrice + addonsPrice;

  const breakdown = [{ item: `Custom Build - ${category}`, amount: basePrice }];
  if (levelingPrice > 0) {
    breakdown.push({ item: levelingOpt.label, amount: levelingPrice });
  }
  if (divineOrbCount > 0) {
    breakdown.push({ item: `${divineOrbCount} Divine Orbs (×$${CUSTOM_BUILD_CONFIG.divineOrbPriceUnit.toFixed(2)})`, amount: divineOrbPrice });
  }
  breakdown.push(...addonsBreakdown);

  return { totalPrice, breakdown };
};

const calculateBossKillingPriceD4 = (serviceDetails, options = {}) => {
  const selectedBoss = options.selectedBoss || 'andariel';
  const runs = Number(serviceDetails.quantity) || 50;
  const bossKey = `boss_${selectedBoss}`;
  const basePricePerRun = BASE_PRICES[bossKey] || 1.49;

  let priceMultiplier = 1.0;
  if (runs <= 25) priceMultiplier = 1.00;
  else if (runs <= 50) priceMultiplier = 0.95;
  else if (runs <= 100) priceMultiplier = 0.90;
  else priceMultiplier = 0.85;

  const adjustedPricePerRun = basePricePerRun * priceMultiplier;
  let total = adjustedPricePerRun * runs;

  if (options.includeMaterials) {
    const bossConfig = options.bossConfig || {};
    const matPrice = bossConfig.materialPrice || 0.50;
    const matSets = Number(options.materialSets) || runs;
    total += matPrice * matSets;
  }

  return Math.round(total * 100) / 100;
};

// Diablo 4 - The Pit Artificer
const calculatePitPrice = (runs, mode, tierValue) => {
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

// World of Warcraft: MoP Classic - Raids
const calculateMopRaidPrice = (serviceType, gameDetails = {}) => {
  const raidConfig = MOP_RAID_CONFIG[serviceType];
  if (!raidConfig) return 0;

  const optionKeys = Object.keys(raidConfig.options);
  const selectedKey = raidConfig.options[gameDetails.difficultyKey] ? gameDetails.difficultyKey : optionKeys[0];
  const selectedOption = raidConfig.options[selectedKey];

  let total = selectedOption?.price || 0;
  if (gameDetails.priorityLoot && raidConfig.extras.priority) total += raidConfig.extras.priority.price;
  if (gameDetails.extraItems) {
    const itemsExtra = raidConfig.extras.items5 || raidConfig.extras.items3 || raidConfig.extras.items2;
    if (itemsExtra) total += itemsExtra.price;
  }
  return Math.round(total * 100) / 100;
};

const calculatePrice = (serviceType, serviceDetails, game, options = {}) => {
  const currentLevel = Number(serviceDetails.currentLevel) || 1;
  const desiredLevel = Number(serviceDetails.desiredLevel) || 10;
  const basePrice = Number(serviceDetails.basePrice) || 0;

  // D4 Boss Killing
  if (serviceType === 'boss_killing' && game === 'Diablo 4') {
    return calculateBossKillingPriceD4(serviceDetails, options);
  }

  // The Pit Artificer
  if (serviceType === 'the_pit_artificer') {
    const runs = Number(serviceDetails.runs) || 10;
    return calculatePitPrice(runs, options.mode || 'self', options.pitTier || 'tier3');
  }

  // MoP Classic Raids
  if (serviceType?.startsWith('mop_')) {
    return calculateMopRaidPrice(serviceType, options);
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

  if (serviceType === 'poe2_custom_build') {
    return calculateCustomBuildPrice(serviceDetails, options).totalPrice;
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

    if (runs <= 25) { priceMultiplier = 1.00; discountText = ''; }
    else if (runs <= 50) { priceMultiplier = 0.95; discountText = ' (5% bulk discount)'; }
    else if (runs <= 100) { priceMultiplier = 0.90; discountText = ' (10% bulk discount)'; }
    else { priceMultiplier = 0.85; discountText = ' (15% bulk discount)'; }

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

    breakdown.push({ item: options.mode === 'piloted' ? 'Mode: Piloted (Account Sharing)' : 'Mode: Self-Play (You Play)', amount: 0 });

    const grandTotal = breakdown.reduce((sum, item) => sum + item.amount, 0);
    breakdown.push({ item: 'TOTAL', amount: grandTotal, isTotal: true });

    return breakdown;
  }

  // The Pit Artificer Breakdown
  if (serviceType === 'the_pit_artificer') {
    const runs = Number(serviceDetails.runs) || 10;
    const tierValue = options.pitTier || 'tier3';
    const tier = THE_PIT_TIER_OPTIONS.find(t => t.value === tierValue) || THE_PIT_TIER_OPTIONS[2];
    const total = calculatePitPrice(runs, options.mode || 'self', tierValue);
    return [
      { item: `${tier.label} × ${runs} runs`, amount: total, detail: `$${tier.basePricePerRun.toFixed(2)} per run` },
      { item: 'TOTAL', amount: total, isTotal: true }
    ];
  }

  // MoP Raid Breakdown
  if (serviceType?.startsWith('mop_')) {
    const raidConfig = MOP_RAID_CONFIG[serviceType];
    if (!raidConfig) return [{ item: 'TOTAL', amount: 0, isTotal: true }];
    const optionKeys = Object.keys(raidConfig.options);
    const selectedKey = raidConfig.options[options.difficultyKey] ? options.difficultyKey : optionKeys[0];
    const selectedOption = raidConfig.options[selectedKey];
    const breakdown = [{ item: selectedOption?.label || 'Raid Clear', amount: selectedOption?.price || 0 }];
    if (options.priorityLoot && raidConfig.extras.priority) {
      breakdown.push({ item: raidConfig.extras.priority.label, amount: raidConfig.extras.priority.price });
    }
    if (options.extraItems) {
      const itemsExtra = raidConfig.extras.items5 || raidConfig.extras.items3 || raidConfig.extras.items2;
      if (itemsExtra) breakdown.push({ item: itemsExtra.label, amount: itemsExtra.price });
    }
    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
    breakdown.push({ item: 'TOTAL', amount: total, isTotal: true });
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

  if (serviceType === 'poe2_custom_build') {
    const result = calculateCustomBuildPrice(serviceDetails, options);
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
  calculateCustomBuildPrice,
  calculatePitPrice,
  calculateMopRaidPrice,
  DIABLO_4_BUILD_PRICES,
  POE2_BUILD_PRICES,
  BASE_PRICES,
  PARAGON_TIERS_D4,
  PARAGON_TIERS_D3,
  DUNE_LEVELING_TIERS
};

export default pricingCalculator;
