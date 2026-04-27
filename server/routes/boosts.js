// backend/routes/boosts.js - VERSIÓN COMPLETA CON MOP RAIDS Y CALL OF DUTY

import express from 'express';
import BoostService from '../models/BoostService.js';
import { adminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// CONFIGURACIÓN DE JUEGOS - ACTUALIZADA
// ============================================
const GAMES = [
  'Diablo 2 Resurrected',
  'Diablo 3',
  'Diablo 4',
  'Diablo Immortal',
  'World of Warcraft Retail',
  'World of Warcraft Classic',
  'Path of Exile',
  'Path of Exile 2',
  'Dune Awakening',
  'Last Epoch',
  // ========== CALL OF DUTY ==========
  'Call of Duty: Modern Warfare III',
  'Call of Duty: Warzone',
  'Call of Duty: Black Ops 7'
];

const GAME_SPECIFIC_SERVICES = {
  'Diablo 2 Resurrected': [
    'powerleveling', 'leveling', 'builds', 'build_services', 'runewords',
    'd2_starter_pack', 'd2_endgame_pack', 'boss_killing', 'dungeon_clearing', 'uber_services',
    'custom_build'
  ],
  'Diablo 3': [
    'powerleveling', 'paragon_leveling', 'leveling', 'builds', 'build_services',
    'd3_starter_pack', 'd3_endgame_pack', 'boss_killing', 'dungeon_clearing',
    'greater_rift', 'uber_services', 'bounty_services',
    'custom_build'
  ],
  'Diablo 4': [
    'powerleveling', 'paragon_leveling', 'leveling', 'builds', 'builds_starter',
    'builds_ancestral', 'builds_mythic', 'builds_tormented', 'build_services',
    'd4_starter_pack', 'd4_endgame_pack', 'the_pit_artificer', 'uber_services',
    'dungeon_runs', 'nightmare_dungeons', 'boss_killing',
    'custom_build'
  ],
  'Diablo Immortal': [
    'powerleveling', 'paragon_leveling', 'leveling', 'builds', 'build_services',
    'immortal_starter_pack', 'immortal_endgame_pack', 'boss_killing', 'dungeon_clearing', 'uber_services',
    'custom_build'
  ],
  'World of Warcraft Retail': [
    'powerleveling', 'leveling', 'mythic_plus', 'raiding', 'pvp_boost', 'arena',
    'placement', 'wins', 'gold_farming', 'builds', 'build_services',
    'wow_starter_pack', 'wow_endgame_pack', 'coaching',
    'custom_build'
  ],
  'World of Warcraft Classic': [
    'powerleveling', 'leveling', 'gold_farming', 'builds', 'build_services',
    'classic_starter_pack', 'classic_endgame_pack', 'raiding',
    'custom_build', 'tbc_starter_pack', 'tbc_endgame_pack',
    // ========== MOP CLASSIC RAIDS ==========
    'mop_mogushan_vaults',
    'mop_heart_of_fear',
    'mop_terrace_endless_spring',
    'mop_throne_of_thunder'
  ],
  'Path of Exile': [
    'poe_starter_pack', 'poe_endgame_pack', 'builds', 'poe_starter_build',
    'poe_endgame_build', 'build_services', 'powerleveling', 'leveling',
    'currency_farming', 'boss_killing', 'uber_services', 'coaching',
    'custom_build'
  ],
  'Path of Exile 2': [
    'poe2_build_starter', 'poe2_build_advanced', 'poe2_build_endgame',
    'poe2_leveling_40', 'poe2_leveling_70', 'poe2_leveling_90',
    'poe2_starter_pack', 'poe2_endgame_pack', 'builds', 'poe2_starter_build',
    'poe2_endgame_build', 'build_services', 'powerleveling', 'leveling',
    'currency_farming', 'boss_killing', 'uber_services', 'coaching', 'custom_build'
  ],
  'Dune Awakening': [
    'powerleveling',
    'leveling',
    'dune_base_construction',
    'dune_craft_vehicle',
    'builds',
    'build_services',
    'dune_starter_pack',
    'dune_advanced_pack',
    'dune_endgame_pack',
    'resource_farming',
    'currency_farming',
    'achievements',
    'coaching',
    'custom_build'
  ],
  'Last Epoch': [
    'powerleveling', 'leveling', 'builds', 'build_services', 'last_epoch_starter_pack',
    'last_epoch_endgame_pack', 'monolith_farming', 'legendary_crafting',
    'dungeon_clearing', 'boss_killing', 'coaching',
    'custom_build'
  ],
  // ========== CALL OF DUTY ==========
  'Call of Duty: Modern Warfare III': [
    'rank_boost', 'camo_unlock', 'battle_pass', 'weapon_leveling',
    'operator_unlock', 'calling_card', 'prestige', 'resurgence_wins',
    'duo_wins', 'squad_wins', 'nuke_contract', 'interrogation',
    'coaching', 'custom_service'
  ],
  'Call of Duty: Warzone': [
    'rank_boost', 'camo_unlock', 'battle_pass', 'weapon_leveling',
    'operator_unlock', 'calling_card', 'prestige', 'resurgence_wins',
    'duo_wins', 'squad_wins', 'nuke_contract', 'interrogation',
    'coaching', 'custom_service'
  ],
  'Call of Duty: Black Ops 7': [
    'rank_boost', 'camo_unlock', 'battle_pass', 'weapon_leveling',
    'operator_unlock', 'calling_card', 'prestige', 'resurgence_wins',
    'duo_wins', 'squad_wins', 'nuke_contract', 'interrogation',
    'zombies_rounds', 'easter_egg', 'dark_ops', 'coaching', 'custom_service'
  ]
};

const UNIVERSAL_SERVICE_TYPES = ['variable_leveling', 'coaching'];

// ============================================
// ENDPOINTS PÚBLICOS
// ============================================

router.get('/games', async (req, res) => {
  try {
    res.json({ success: true, games: GAMES, gameSpecificServices: GAME_SPECIFIC_SERVICES });
  } catch (error) {
    console.error('❌ Error en /games:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { game, serviceType, category, available, limit } = req.query;
    let filter = { available: true, isActive: true };

    if (game) filter.game = game;
    if (serviceType) filter.serviceType = serviceType;
    if (category) filter.category = category;
    if (available !== undefined) filter.available = available === 'true';

    let query = BoostService.find(filter).sort({ createdAt: -1 });
    if (limit) query = query.limit(parseInt(limit));

    const services = await query;
    const servicesWithPrice = services.map(service => {
      const serviceObj = service.toObject();
      if (service.basePrice !== undefined) serviceObj.price = service.basePrice;
      serviceObj.id = serviceObj._id.toString(); // ✅ id explícito para el frontend
      return serviceObj;
    });

    res.json(servicesWithPrice);
  } catch (error) {
    console.error('❌ ERROR en GET /api/boosts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching services',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let service = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      try { service = await BoostService.findById(id); } catch (err) {}
    }

    if (!service) {
      const parts = id.split('-');
      const searchId = parts[parts.length - 1];
      if (searchId.length >= 6) {
        try {
          const allServices = await BoostService.find({});
          service = allServices.find(s => s._id.toString().endsWith(searchId));
        } catch (err) {}
      }
    }

    if (!service) {
      const searchName = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      try {
        const nameParts = searchName.split(' ').slice(0, 4).join(' ');
        service = await BoostService.findOne({ name: { $regex: nameParts, $options: 'i' } });
      } catch (err) {}
    }

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const serviceObj = service.toObject();
    if (service.basePrice !== undefined) serviceObj.price = service.basePrice;
    serviceObj.id = serviceObj._id.toString(); // ✅ id explícito

    res.json({ success: true, ...serviceObj });
  } catch (error) {
    console.error('❌ ERROR en GET /boosts/:id:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching service',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// ENDPOINTS DEBUG
// ============================================

router.get('/debug/all', async (req, res) => {
  try {
    const allServices = await BoostService.find({}).sort({ createdAt: -1 });
    const availableServices = await BoostService.find({ available: true });

    const servicesWithPrice = allServices.map(service => {
      const serviceObj = service.toObject();
      if (service.basePrice !== undefined) serviceObj.price = service.basePrice;
      serviceObj.id = serviceObj._id.toString(); // ✅ id explícito
      return serviceObj;
    });

    res.json({
      success: true,
      totalInDatabase: allServices.length,
      availableCount: availableServices.length,
      allServices: servicesWithPrice,
      availableServices: availableServices.map(s => {
        const obj = s.toObject();
        if (s.basePrice !== undefined) obj.price = s.basePrice;
        obj.id = obj._id.toString(); // ✅ id explícito
        return obj;
      })
    });
  } catch (error) {
    console.error('❌ ERROR en debug endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ENDPOINTS ADMIN
// ============================================

router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const services = await BoostService.find({}).sort({ createdAt: -1 });
    const servicesWithPrice = services.map(service => {
      const serviceObj = service.toObject();
      if (service.basePrice !== undefined) serviceObj.price = service.basePrice;
      serviceObj.id = serviceObj._id.toString(); // ✅ id explícito
      return serviceObj;
    });
    res.json({ success: true, allServices: servicesWithPrice, total: services.length });
  } catch (error) {
    console.error('❌ ERROR en admin endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    console.log('🆕 ADMIN: POST / - Creando servicio');
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));

    const { game, serviceType, name, description, estimatedTime, price, basePrice, available, isActive, features, variables, category } = req.body;

    // Validar juego
    if (!GAMES.includes(game)) {
      return res.status(400).json({
        success: false,
        message: `Invalid game "${game}". Must be one of: ${GAMES.join(', ')}`
      });
    }

    // Validar tipo de servicio para el juego
    const validServiceTypes = GAME_SPECIFIC_SERVICES[game] || [];
    const isValidType = validServiceTypes.includes(serviceType) || UNIVERSAL_SERVICE_TYPES.includes(serviceType);

    if (!isValidType) {
      return res.status(400).json({
        success: false,
        message: `Invalid service type "${serviceType}" for ${game}.`,
        validTypes: validServiceTypes
      });
    }

    const serviceData = {
      name: name?.trim() || `${game} - ${serviceType}`,
      description: description?.trim() || 'Professional boosting service',
      game: game,
      serviceType: serviceType,
      category: category || 'other',
      estimatedTime: estimatedTime?.trim() || '2-3 días',
      available: available !== undefined ? available : true,
      isActive: isActive !== undefined ? isActive : true,
      features: features || ['Booster profesional', 'Soporte 24/7', 'Pago seguro', 'Seguimiento en vivo'],
      variables: variables || {}
    };

    // Manejo de precio
    const isVariableLeveling = serviceType === 'variable_leveling';
    const noPriceRequired = isVariableLeveling;

    if (!noPriceRequired) {
      const priceValue = price || basePrice;
      if (!priceValue || priceValue <= 0) {
        return res.status(400).json({ success: false, message: 'Price is required for this service type' });
      }
      serviceData.basePrice = Number(priceValue);
    } else if (price || basePrice) {
      serviceData.basePrice = Number(price || basePrice);
    }

    const service = new BoostService(serviceData);
    await service.save();

    console.log('✅ Servicio creado:', service._id, '-', service.name);

    const responseObj = service.toObject();
    if (service.basePrice !== undefined) responseObj.price = service.basePrice;
    responseObj.id = responseObj._id.toString(); // ✅ id explícito

    if (req.io) req.io.emit('service_created_broadcast', responseObj);

    res.status(201).json({ success: true, ...responseObj });
  } catch (error) {
    console.error('❌ ERROR creando servicio:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({ field: err.path, message: err.message }));
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }

    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate key error', field: Object.keys(error.keyPattern)[0] });
    }

    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    console.log('✏️ ADMIN: PUT /:id - ID:', req.params.id);
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));

    const updateData = { ...req.body };

    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (updateData.price !== undefined) {
      updateData.basePrice = Number(updateData.price);
      delete updateData.price;
    }

    if (updateData.status !== undefined) {
      updateData.available = updateData.status === 'active';
      updateData.isActive = updateData.status === 'active';
      delete updateData.status;
    }

    console.log('📦 Datos limpios para actualizar:', JSON.stringify(updateData, null, 2));

    const service = await BoostService.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, context: 'query' }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    console.log('✅ Servicio actualizado:', service._id, '-', service.name);
    console.log('✅ Nuevo precio:', service.basePrice);
    console.log('✅ Nuevo estimatedTime:', service.estimatedTime);

    const responseObj = service.toObject();
    if (service.basePrice !== undefined) responseObj.price = service.basePrice;
    responseObj.id = responseObj._id.toString(); // ✅ id explícito

    if (req.io) req.io.emit('service_updated_broadcast', responseObj);

    res.json({ success: true, ...responseObj });
  } catch (error) {
    console.error('❌ ERROR actualizando servicio:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({ field: err.path, message: err.message }));
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid service ID' });
    }

    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const service = await BoostService.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    console.log('✅ Servicio eliminado:', service._id, '-', service.name);

    if (req.io) req.io.emit('service_deleted_broadcast', { serviceId: req.params.id });

    res.json({ success: true, message: 'Service deleted successfully', deletedId: req.params.id });
  } catch (error) {
    console.error('❌ ERROR eliminando servicio:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid service ID' });
    }

    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;