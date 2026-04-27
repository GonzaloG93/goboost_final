// frontend/src/config/buildsConfig.js
// Configuraciones de builds y packs para todos los juegos

export const DIABLO_4_BUILDS = {
  'builds_starter': {
    id: 'builds_starter',
    name: 'Starter Build',
    price: 30,
    nextUpgrade: 'builds_ancestral',
    upgradePrice: 20,
    description: 'Perfect for beginners starting their journey',
    tier: 'starter',
    features: [
      'Build Capability: Up to Pit Tier 10 Clear',
      '75 Paragon Level',
      'x1 Glyph Level 25',
      '750 GS Legendary Gear',
      'Basic Aspects',
      'Useful Affixes Tempered on every possible Item',
      'Masterworking 10/25',
      'Flawless Gems for Weapons and Armour',
      'x2 Runewords'
    ]
  },
  'builds_ancestral': {
    id: 'builds_ancestral',
    name: 'Ancestral Build',
    price: 50,
    nextUpgrade: 'builds_mythic',
    upgradePrice: 100,
    description: 'Advanced build for experienced players',
    tier: 'ancestral',
    features: [
      'Build Capability: Up to Pit Tier 55 Clear',
      '150 Paragon Level',
      'x5 Glyphs Level 46',
      '800 GS Legendary Gear with 1/4 Greater Affix',
      'High Roll Aspects',
      'Useful Affixes Tempered on every possible Item',
      'Unique items with 1/4 Greater Affix',
      'Masterworking 20/25',
      'Royal Gems for Weapons and Armour',
      'x2 Runewords'
    ]
  },
  'builds_mythic': {
    id: 'builds_mythic',
    name: 'Mythic Build',
    price: 150,
    nextUpgrade: 'builds_tormented',
    upgradePrice: 50,
    description: 'Elite build for end-game content',
    tier: 'mythic',
    requiresLevel: 60,
    features: [
      'Build Capability: Up to Pit Tier 90 Clear',
      '200 Paragon Level',
      'x5 Glyphs Level 80',
      '800 GS Legendary Gear with 2/4 Greater Affixes',
      'High Roll Aspects',
      'Affixes Tempered on every possible Item',
      'Unique items with 2/4 Greater Affixes',
      'Mythic items with 1/4 Greater Affix',
      'Masterworking 25/25',
      'Grand Gems for Weapons and Armour',
      'x2 Runewords'
    ]
  },
  'builds_tormented': {
    id: 'builds_tormented',
    name: 'Tormented Build',
    price: 200,
    nextUpgrade: null,
    upgradePrice: 0,
    description: 'Ultimate build for Tormented bosses',
    tier: 'tormented',
    requiresLevel: 100,
    features: [
      'Build Capability: Up to Pit Tier 100 Clear',
      '250 Paragon Level',
      'x5 Glyphs Level 100',
      '800 GS Legendary Gear with 3/4 Greater Affixes',
      'Max Roll Aspects',
      'Affixes Tempered on every possible Item',
      'Unique items with 3/4 Greater Affixes',
      'Mythic items with 2/4 Greater Affixes',
      'Masterworking 25/25',
      'Grand Gems for Weapons and Armour',
      'x2 Runewords'
    ]
  }
};

export const POE2_BUILDS = {
  'poe2_build_starter': {
    id: 'poe2_build_starter',
    name: 'Starter Build',
    price: 40,
    nextUpgrade: 'poe2_build_advanced',
    upgradePrice: 25,
    description: 'Perfect for beginners starting their journey in Wraeclast',
    tier: 'starter',
    features: [
      'Full campaign skill tree optimization',
      'Leveling gear recommendations',
      'Basic mapping capability (T1-T5)',
      'Ascendancy points allocation guide',
      'Gem setup for leveling',
      'Basic resistances cap'
    ]
  },
  'poe2_build_advanced': {
    id: 'poe2_build_advanced',
    name: 'Advanced Build',
    price: 65,
    nextUpgrade: 'poe2_build_endgame',
    upgradePrice: 20,
    description: 'Advanced build for mid-tier mapping and early bosses',
    tier: 'advanced',
    features: [
      'Optimized for T6-T12 maps',
      'Early boss killing capability',
      'Full gear recommendations with trade links',
      'Mid-tier unique items',
      'Quality gems setup',
      'Capped resistances and chaos resistance'
    ]
  },
  'poe2_build_endgame': {
    id: 'poe2_build_endgame',
    name: 'Endgame Build',
    price: 85,
    nextUpgrade: null,
    upgradePrice: 0,
    description: 'Complete end-game ready build for pinnacle content',
    tier: 'endgame',
    requiresLevel: 70,
    features: [
      'Optimized for T15+ maps',
      'Pinnacle boss killing capability',
      'Full endgame gear with trade links',
      'Atlas passive tree optimization',
      'Max quality gems with corrupted options',
      'Overcapped resistances',
      'Jewel optimization'
    ]
  }
};

export const WOW_TBC_PACKS = {
  'tbc_starter_pack': {
    name: 'TBC Starter Pack - Silver',
    price: 349,
    description: 'Level 60-70 boost with ground mount, profession, and Dual Spec.',
    features: [
      '(58)60-70 Leveling',
      '100% Ground Riding Skill and Mount',
      '1 Profession of Your Choice',
      'Dual Specialization Unlocked',
      'All Flightpaths Unlocked'
    ],
    availableProfessions: [
      'Alchemy', 'Blacksmithing', 'Leatherworking', 'Tailoring',
      'Enchanting', 'Engineering', 'Jewelcrafting'
    ],
    availableFactions: ['Aldor', 'Scryers'],
    professionCount: 1,
    color: 'from-blue-500 to-cyan-500',
    icon: '🥈'
  },
  'tbc_endgame_pack': {
    name: 'TBC End Game Pack - Platinum',
    price: 849,
    description: 'Complete raid-ready package with epic flying, max professions, and BiS gear.',
    features: [
      '(58)60-70 Leveling',
      '100% Ground Riding and 280% Epic Flying Skill + Mount',
      '2 Main Professions + First Aid + Fishing + Cooking',
      'Dual Specialization Unlocked',
      'All Flightpaths Unlocked',
      'All Heroic Dungeon Attunements',
      'Best-in-Slot Pre-Raid Gear (115+ Item Level)'
    ],
    availableProfessions: [
      'Alchemy', 'Blacksmithing', 'Leatherworking', 'Tailoring',
      'Enchanting', 'Engineering', 'Jewelcrafting'
    ],
    availableFactions: ['Aldor', 'Scryers'],
    professionCount: 2,
    color: 'from-indigo-500 to-purple-500',
    icon: '💎'
  }
};

export const BUILD_DESCRIPTIONS = {
  'poe_starter_build': {
    name: 'Starter Build (PoE)',
    description: 'Perfect for beginners in Path of Exile',
    features: [
      'Leveling build optimized for campaign',
      'Basic mapping capable',
      'All required unique items'
    ]
  },
  'poe_endgame_build': {
    name: 'Endgame Build (PoE)',
    description: 'End-game ready build for high-tier content',
    features: [
      'T16 map clearing capability',
      'Boss killing optimized',
      'High-end unique items'
    ]
  },
  'd2_starter_pack': {
    name: 'Starter Pack (D2)',
    description: 'Get started in Diablo 2',
    features: [
      'Leveling build guide',
      'Basic runewords',
      'Essential unique items'
    ]
  },
  'd4_starter_pack': {
    name: 'Starter Pack (D4)',
    description: 'Complete starter package for Diablo 4',
    features: [
      'Full leveling from 1-60',
      'Starter Build Setup',
      'Basic gear optimization'
    ]
  },
  'd4_endgame_pack': {
    name: 'Endgame Pack (D4)',
    description: 'Ultimate endgame package for Diablo 4',
    features: [
      'Tormented Build Setup',
      'Paragon 300',
      'All Glyphs level 100'
    ]
  },
  'poe2_starter_pack': {
    name: 'Bundle Starter (PoE 2)',
    description: 'Complete starter bundle: Leveling 1-70 + Starter Build + Extras',
    features: [
      'Leveling 1-70',
      'Starter Build Setup',
      '8 Ascendancy Points',
      'All Passive Points',
      'Basic Atlas Progression'
    ]
  },
  'poe2_endgame_pack': {
    name: 'Bundle Endgame (PoE 2)',
    description: 'Ultimate endgame bundle: Leveling 1-90 + Endgame Build + Atlas + Bosses',
    features: [
      'Leveling 1-90',
      'Endgame Build Setup',
      '8 Ascendancy Points',
      'All Passive Points',
      '30+ Atlas Points',
      'Pinnacle Bosses Completed'
    ]
  },
  'custom_build': {
    name: 'Custom Build',
    description: 'Fully customized build tailored to your specifications',
    features: [
      'Personalized skill tree',
      'Custom gear recommendations',
      'Playstyle optimization'
    ]
  },
  'dune_starter_pack': {
    name: 'Starter Bundle - Dune',
    description: 'Initial leveling + 1 Basic Class Unlock + Starting Resources',
    features: [
      'Power Leveling up to Level 30',
      '1 Class Unlock (Swordmaster, Mentat or Trooper)',
      '5,000 Solari Pack',
      'Basic Level 20 Gear'
    ]
  },
  'dune_advanced_pack': {
    name: 'Advanced Bundle - Dune',
    description: 'Mid-level + Advanced Class + Specialization + Resources',
    features: [
      'Power Leveling up to Level 100',
      'Bene Gesserit Unlock',
      '1 Full Specialization',
      '15,000 Solari Pack',
      'Epic Level 80 Gear'
    ]
  },
  'dune_endgame_pack': {
    name: 'Endgame Bundle - Dune',
    description: 'Max Level + Planetologist + Optimal Gear + Complete Base',
    features: [
      'Power Leveling up to Level 200',
      'Planetologist Unlock',
      'All Specializations',
      'Legendary Gear',
      '50,000 Solari Pack'
    ]
  },
  'boss_killing': {
    name: 'Boss Killing',
    description: 'Professional boss farming service',
    features: [
      'Fast boss kills',
      'All loot belongs to you',
      'Self-play or piloted options',
      'Summoning materials available'
    ]
  }
};

export const formatPrice = (price) => {
  if (price === undefined || price === null || price === '' || isNaN(price)) {
    return '0.00';
  }
  const num = Number(price);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

export const normalizeServiceType = (type) => {
  if (!type) return '';
  return String(type).toLowerCase().trim().replace(/\s+/g, '_');
};