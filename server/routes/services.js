import express from 'express';
import BoostService from '../models/BoostService.js';
import { adminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// 1. ENDPOINTS AUXILIARES ESPERADOS POR LA UI
// ============================================

router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { _id: 'cat-valorant-rank', name: 'Rank Boost', game: 'VALORANT' },
      { _id: 'cat-lol-rank', name: 'Rank Boost', game: 'LOL' },
      { _id: 'cat-cod-rank', name: 'Rank Boost', game: 'Call of Duty' },
      { _id: 'cat-general', name: 'General Boosting', game: 'General' }
    ];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/ranks', async (req, res) => {
  try {
    const ranks = [
      { _id: 'r1', name: 'Hierro / Iron', game: 'VALORANT' },
      { _id: 'r2', name: 'Bronce / Bronze', game: 'VALORANT' },
      { _id: 'r3', name: 'Plata / Silver', game: 'VALORANT' },
      { _id: 'r4', name: 'Oro / Gold', game: 'VALORANT' },
      { _id: 'r5', name: 'Platino / Platinum', game: 'VALORANT' },
      { _id: 'r6', name: 'Diamante / Diamond', game: 'VALORANT' }
    ];
    res.json(ranks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/agents', async (req, res) => {
  try {
    const agents = [
      { _id: 'a1', name: 'Jett', game: 'VALORANT' },
      { _id: 'a2', name: 'Reyna', game: 'VALORANT' },
      { _id: 'a3', name: 'Ahri', game: 'LOL' }
    ];
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// 2. CRUD ADAPTADOR PARA SERVICES MANAGEMENT
// ============================================

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const services = await BoostService.find({}).sort({ createdAt: -1 });

    // Transforma el esquema del modelo original al formato que espera ServicesManagement.jsx
    const formattedServices = services.map(s => {
      const obj = s.toObject();
      return {
        _id: obj._id,
        name: obj.name,
        slug: obj.slug || obj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        game: obj.game,
        category: obj.category || 'cat-general',
        calculatorType: (obj.serviceType || 'RANK_BOOST').toUpperCase(),
        description: obj.description || '',
        basePrice: obj.basePrice !== undefined ? obj.basePrice : (obj.price || 0),
        pricePerUnit: obj.variables?.pricePerUnit || 0,
        isActive: obj.isActive !== undefined ? obj.isActive : true
      };
    });

    res.json(formattedServices);
  } catch (error) {
    console.error('❌ Error en GET /api/services:', error);
    res.status(500).json({ message: 'Error al obtener los servicios' });
  }
});

// POST /api/services
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, game, basePrice, pricePerUnit, category, calculatorType, slug } = req.body;

    // Validar mínimo 10 caracteres en la descripción requeridos por la UI
    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        message: 'La descripción debe tener al menos 10 caracteres.'
      });
    }

    if (!name || !game) {
      return res.status(400).json({ message: 'El nombre y el juego son requeridos.' });
    }

    const serviceData = {
      name: name.trim(),
      description: description.trim(),
      game: game,
      serviceType: (calculatorType || 'rank_boost').toLowerCase(),
      category: category || 'other',
      basePrice: Number(basePrice) || 0,
      estimatedTime: '1-3 días',
      isActive: true,
      available: true,
      variables: {
        pricePerUnit: Number(pricePerUnit) || 0,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-')
      }
    };

    const newService = new BoostService(serviceData);
    await newService.save();

    const responseObj = {
      _id: newService._id,
      name: newService.name,
      slug: slug || newService.name.toLowerCase().replace(/\s+/g, '-'),
      game: newService.game,
      category: newService.category,
      calculatorType: calculatorType || 'RANK_BOOST',
      description: newService.description,
      basePrice: newService.basePrice,
      pricePerUnit: Number(pricePerUnit) || 0,
      isActive: newService.isActive
    };

    if (req.io) req.io.emit('service_created_broadcast', responseObj);

    res.status(201).json(responseObj);
  } catch (error) {
    console.error('❌ Error en POST /api/services:', error);
    res.status(400).json({ message: error.message || 'Error al crear el servicio' });
  }
});

// PUT /api/services/:id
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, game, basePrice, pricePerUnit, category, calculatorType, isActive, slug } = req.body;

    if (description !== undefined && description.trim().length < 10) {
      return res.status(400).json({
        message: 'La descripción debe tener al menos 10 caracteres.'
      });
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (description) updateFields.description = description.trim();
    if (game) updateFields.game = game;
    if (category) updateFields.category = category;
    if (calculatorType) updateFields.serviceType = calculatorType.toLowerCase();
    if (basePrice !== undefined) updateFields.basePrice = Number(basePrice);
    if (isActive !== undefined) {
      updateFields.isActive = isActive;
      updateFields.available = isActive;
    }

    if (pricePerUnit !== undefined || slug) {
      updateFields['variables.pricePerUnit'] = Number(pricePerUnit) || 0;
      if (slug) updateFields['variables.slug'] = slug;
    }

    const updatedService = await BoostService.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    const responseObj = {
      _id: updatedService._id,
      name: updatedService.name,
      slug: slug || updatedService.name.toLowerCase().replace(/\s+/g, '-'),
      game: updatedService.game,
      category: updatedService.category,
      calculatorType: (updatedService.serviceType || 'RANK_BOOST').toUpperCase(),
      description: updatedService.description,
      basePrice: updatedService.basePrice,
      pricePerUnit: updatedService.variables?.pricePerUnit || 0,
      isActive: updatedService.isActive
    };

    if (req.io) req.io.emit('service_updated_broadcast', responseObj);

    res.json(responseObj);
  } catch (error) {
    console.error('❌ Error en PUT /api/services/:id:', error);
    res.status(400).json({ message: error.message || 'Error al actualizar el servicio' });
  }
});

// DELETE /api/services/:id
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const service = await BoostService.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    if (req.io) req.io.emit('service_deleted_broadcast', { serviceId: req.params.id });

    res.json({ message: 'Servicio eliminado correctamente', id: req.params.id });
  } catch (error) {
    console.error('❌ Error en DELETE /api/services/:id:', error);
    res.status(400).json({ message: error.message || 'Error al eliminar el servicio' });
  }
});

export default router;