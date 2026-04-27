import mongoose from 'mongoose';
import BoostService from '../models/BoostService.js';

// ⚠️ USA LA MISMA URI QUE USASTE PARA createAdminUser.js
const MONGODB_URI = 'mongodb+srv://gonzalo_db_admin:zjzyPlrchnG6JaCi@cluster0.etrf7vr.mongodb.net/boost-services?retryWrites=true&w=majority&appName=Cluster0';

const services = [
  // ==================== DIABLO 4 SERVICES ====================
  {
    game: 'Diablo 4',
    serviceType: 'uber_services',
    name: 'Duriel, King of Maggots',
    description: 'Servicio de derrota al jefe Duriel, Rey de los Gusanos',
    basePrice: 7,
    estimatedTime: '1-2 hours',
    available: true,
    features: [
      'Professional players',
      'Guaranteed kill',
      'Loot included',
      'Fast service'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'dungeon_clearing',
    name: 'Nightmare Dungeons',
    description: 'Servicio de runs en Mazmorras de Pesadilla',
    basePrice: 6.6,
    estimatedTime: '30 minutes per run',
    available: true,
    features: [
      'Multiple runs available',
      'Expert dungeon clearing',
      'Glyph experience',
      'Legendary drops'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'item_farming',
    name: 'Unique Items Farm',
    description: 'Servicio para conseguir Objetos Únicos específicos',
    basePrice: 89,
    estimatedTime: '1-7 days',
    available: true,
    features: [
      'Target farming',
      'Specific unique items',
      'High efficiency',
      'Daily progress reports'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'build_services',
    name: 'Barbarian Build Service',
    description: 'Servicio de configuración de build completa para Bárbaro',
    basePrice: 124,
    estimatedTime: '1-7 days',
    available: true,
    features: [
      'Complete build setup',
      'Optimal skill tree',
      'Paragon board optimization',
      'Gear and aspects'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'build_services',
    name: 'Sorcerer Build Service',
    description: 'Servicio de configuración de build completa para Hechicera',
    basePrice: 124,
    estimatedTime: '1-7 days',
    available: true,
    features: [
      'Complete build setup',
      'Optimal skill tree',
      'Paragon board optimization',
      'Gear and aspects'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'boss_killing',
    name: 'Harbinger of Hatred',
    description: 'Servicio de derrota al jefe Harbinger of Hatred',
    basePrice: 2,
    estimatedTime: '2-4 hours',
    available: true,
    features: [
      'Boss kill service',
      'Loot included',
      'Fast completion',
      'Expert players'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'boss_killing',
    name: 'Urivar the Proviler',
    description: 'Servicio de derrota al jefe Urivar the Proviler',
    basePrice: 2,
    estimatedTime: '2-4 hours',
    available: true,
    features: [
      'Boss kill service',
      'Loot included',
      'Fast completion',
      'Expert players'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'build_services',
    name: 'Build for Any Class',
    description: 'Servicio de configuración de build para cualquier clase',
    basePrice: 124,
    estimatedTime: '1-7 days',
    available: true,
    features: [
      'Any class available',
      'Complete build setup',
      'Custom optimization',
      'Flexible timeline'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'currency_farming',
    name: 'Diablo 4 Gold Farming',
    description: 'Servicio de farmeo de oro para Diablo 4',
    basePrice: 10,
    estimatedTime: 'From 5 minutes',
    available: true,
    features: [
      'Fast gold delivery',
      'Safe farming methods',
      'Bulk quantities available',
      'Instant delivery'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'powerleveling',
    name: 'Diablo 4 Starter Pack',
    description: 'Buy Diablo 4 Starter Pack now and jump straight into the heart of Sanctuary with the character level 60. Starter Pack offers a great solution if you can\'t wait to get into the thick of the action. We\'ll take care of everything from Leveling to Optimized Skill Tree and Paragon Board. Get your Starter pack now and enhance your in-game experience with more fun and less grind!',
    basePrice: 149,
    estimatedTime: '2-3 days',
    available: true,
    features: [
      'Character Level 60',
      'Paragon Level 75',
      'Legendary items 750 Item Power',
      'All Items Tempered',
      'Masterworking 8/8',
      'Basic Aspects',
      'Flawless Gems',
      'x2 Runewords',
      'x1 Glyph Level 25',
      'Optimized Skill Tree and Paragon Board',
      'The Pit Tier 10+ Ready'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'powerleveling',
    name: 'Power Leveling 1-100',
    description: 'Fast power leveling service from level 1 to 100',
    basePrice: 79,
    estimatedTime: '3-5 days',
    available: true,
    features: [
      'Level 1-100 service',
      'Safe and efficient',
      'Regular updates',
      'Complete campaign skip'
    ]
  },
  {
    game: 'Diablo 4',
    serviceType: 'greater_rift',
    name: 'Greater Rift Clearing',
    description: 'High-level Greater Rift completion service',
    basePrice: 15,
    estimatedTime: '1-2 hours',
    available: true,
    features: [
      'High-tier rifts',
      'Fast completion',
      'Legendary gems',
      'Expert players'
    ]
  },

  // ==================== CALL OF DUTY SERVICES ====================
  {
    game: 'Call of Duty',
    serviceType: 'placement',
    name: 'Ranked Placement Matches',
    description: 'Professional placement matches service for Call of Duty Ranked',
    basePrice: 25,
    estimatedTime: '1-2 days',
    available: true,
    features: [
      'Professional players',
      'Optimal placement',
      'Secure service',
      '24/7 support'
    ]
  },
  {
    game: 'Call of Duty: Warzone',
    serviceType: 'wins',
    name: 'Warzone Victory Boosting',
    description: 'Get those hard-earned Warzone victories with our professional team',
    basePrice: 35,
    estimatedTime: '2-3 hours per win',
    available: true,
    features: [
      'Professional squad',
      'High win rate',
      'Safe gameplay',
      'Communication included'
    ]
  },
  {
    game: 'Call of Duty: Modern Warfare',
    serviceType: 'coaching',
    name: 'Coaching Sessions',
    description: 'Improve your skills with professional Call of Duty coaching',
    basePrice: 20,
    estimatedTime: '1 hour sessions',
    available: true,
    features: [
      'Professional coaches',
      'Personalized training',
      'VOD reviews',
      'Skill improvement'
    ]
  },

  // ==================== PATH OF EXILE SERVICES ====================
  {
    game: 'Path of Exile',
    serviceType: 'boss_killing',
    name: 'Uber Boss Killing Service',
    description: 'Professional Uber boss killing service for all endgame content',
    basePrice: 45,
    estimatedTime: '2-3 hours',
    available: true,
    features: [
      'All uber bosses',
      'Guaranteed kills',
      'Loot included',
      'Expert players'
    ]
  },
  {
    game: 'Path of Exile',
    serviceType: 'currency_farming',
    name: 'Currency Farming Service',
    description: 'Efficient currency farming for all your crafting needs',
    basePrice: 12,
    estimatedTime: '4-6 hours',
    available: true,
    features: [
      'High efficiency',
      'Multiple strategies',
      'Bulk currency',
      'Safe methods'
    ]
  },

  // ==================== WORLD OF WARCRAFT SERVICES ====================
  {
    game: 'World of Warcraft Retail',
    serviceType: 'mythic_plus',
    name: 'Mythic+ Dungeon Boost',
    description: 'Complete Mythic+ dungeons with our professional team',
    basePrice: 29,
    estimatedTime: '1-2 hours per run',
    available: true,
    features: [
      'All dungeons available',
      'High rating',
      'Loot protection',
      'Expert players'
    ]
  },
  {
    game: 'World of Warcraft Retail',
    serviceType: 'raiding',
    name: 'Raid Clear Service',
    description: 'Complete current raid content with our raid team',
    basePrice: 49,
    estimatedTime: '3-4 hours',
    available: true,
    features: [
      'Full raid clear',
      'All difficulties',
      'Loot distribution',
      'Experienced raiders'
    ]
  },

  // ==================== LAST EPOCH SERVICES ====================
  {
    game: 'Last Epoch',
    serviceType: 'monolith_farming',
    name: 'Monolith of Fate Farming',
    description: 'Efficient Monolith of Fate farming for all your endgame needs',
    basePrice: 18,
    estimatedTime: '3-4 hours',
    available: true,
    features: [
      'Target farming',
      'Legendary potential',
      'Blessings included',
      'Expert farmers'
    ]
  },
  {
    game: 'Last Epoch',
    serviceType: 'legendary_crafting',
    name: 'Legendary Crafting Service',
    description: 'Professional legendary item crafting service',
    basePrice: 35,
    estimatedTime: '1-2 days',
    available: true,
    features: [
      'Expert crafting',
      'Material farming',
      'Optimal results',
      'Guaranteed service'
    ]
  },

  // ==================== DUNE AWAKENING SERVICES ====================
  {
    game: 'Dune Awakening',
    serviceType: 'leveling',
    name: 'Level Boost Service',
    description: 'Fast leveling service for Dune Awakening',
    basePrice: 42,
    estimatedTime: '2-3 days',
    available: true,
    features: [
      'Fast leveling',
      'Safe methods',
      'Regular updates',
      'Complete progression'
    ]
  },
  {
    game: 'Dune Awakening',
    serviceType: 'achievements',
    name: 'Achievement Completion',
    description: 'Complete all achievements in Dune Awakening',
    basePrice: 65,
    estimatedTime: '3-5 days',
    available: true,
    features: [
      'All achievements',
      'Rare achievements',
      'Fast completion',
      'Expert players'
    ]
  },

  // ==================== BATTLEFIELD 6 SERVICES ====================
  {
    game: 'Battlefield 6',
    serviceType: 'placement',
    name: 'Competitive Placement',
    description: 'Professional placement service for Battlefield 6 competitive',
    basePrice: 28,
    estimatedTime: '1-2 days',
    available: true,
    features: [
      'High placement',
      'Professional players',
      'Secure service',
      'Fast completion'
    ]
  },
  {
    game: 'Battlefield 6',
    serviceType: 'wins',
    name: 'Victory Boosting',
    description: 'Get consistent victories in Battlefield 6 matches',
    basePrice: 22,
    estimatedTime: '1-2 hours per win',
    available: true,
    features: [
      'High win rate',
      'Team coordination',
      'Objective focused',
      'Fast service'
    ]
  }
];

const seedServices = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Conectado a MongoDB');
    
    // Limpiar servicios existentes
    await BoostService.deleteMany({});
    console.log('🗑️ Servicios anteriores eliminados');
    
    // Insertar nuevos servicios
    await BoostService.insertMany(services);
    console.log('✅ Servicios de prueba insertados:', services.length);
    
    // Mostrar resumen por juego
    const createdServices = await BoostService.find();
    console.log('\n📊 RESUMEN POR JUEGO:');
    
    const gamesSummary = createdServices.reduce((acc, service) => {
      if (!acc[service.game]) {
        acc[service.game] = 0;
      }
      acc[service.game]++;
      return acc;
    }, {});
    
    Object.entries(gamesSummary).forEach(([game, count]) => {
      console.log(`   🎮 ${game}: ${count} servicios`);
    });
    
    console.log('\n📋 SERVICIOS DESTACADOS:');
    const featuredServices = createdServices.slice(0, 5);
    featuredServices.forEach(service => {
      console.log(`   🎯 ${service.name}`);
      console.log(`      💰 $${service.basePrice} | ⏱️ ${service.estimatedTime} | ${service.game}`);
      console.log(`      📝 ${service.description.substring(0, 60)}...\n`);
    });
    
    console.log('🎉 Base de datos poblada exitosamente!');
    console.log(`📈 Total de servicios creados: ${createdServices.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding services:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedServices();