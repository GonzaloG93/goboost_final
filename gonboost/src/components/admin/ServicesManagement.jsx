// frontend/src/components/admin/ServicesManagement.jsx
// VERSIÓN CORREGIDA - estimatedTime ya no se sobreescribe para MoP Raids

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../utils/axiosConfig';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'react-toastify';
import { 
  GAMES, GAME_SPECIFIC_SERVICES, ALL_SERVICE_TYPES, 
  formatServiceType, categorizeService, SERVICE_CATEGORIES, getServiceTypesForGame 
} from '../../config/gamesConfig';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ game: '', category: '', serviceType: '' });

  const saveLock = useRef(false);
  const { socket, isConnected, isInitialized } = useSocket();

  const games = GAMES;
  const allServiceTypes = ALL_SERVICE_TYPES;

  const serviceCategories = [
    { value: 'all', label: 'Todos', icon: '🔍' },
    ...SERVICE_CATEGORIES.filter(cat => cat.id !== 'all').map(cat => ({
      value: cat.id, label: cat.name, icon: cat.icon
    }))
  ];

  const getFilteredServiceTypes = (game) => {
    if (!game) return allServiceTypes;
    return getServiceTypesForGame(game);
  };

  const getServiceTypeOptions = (game) => {
    const filteredTypes = getFilteredServiceTypes(game);
    return filteredTypes.map(type => ({ value: type, label: formatServiceType(type) }));
  };

  const getDefaultPriceForType = (serviceType) => {
    const defaults = {
      // PoE 2
      'poe2_build_starter': 40, 'poe2_build_advanced': 65, 'poe2_build_endgame': 85,
      'poe2_leveling_40': 25, 'poe2_leveling_70': 55, 'poe2_leveling_90': 95,
      'poe2_starter_pack': 105, 'poe2_endgame_pack': 225,

      // Diablo 4
      'builds_starter': 30, 'builds_ancestral': 50, 'builds_mythic': 150, 'builds_tormented': 200,
      'd4_starter_pack': 60, 'd4_endgame_pack': 300, 'powerleveling': 1.20, 'paragon_leveling': 0,

      // Dune Awakening
      'dune_base_construction': 20,
      'dune_craft_vehicle': 10,
      'dune_starter_pack': 45, 'dune_advanced_pack': 99, 'dune_endgame_pack': 199,
      'leveling': 1.20, 'resource_farming': 35, 'currency_farming': 30,

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

      // MoP Classic Raids
      'mop_mogushan_vaults': 180,
      'mop_heart_of_fear': 240,
      'mop_terrace_endless_spring': 190,
      'mop_throne_of_thunder': 190,

      // Call of Duty
      'rank_boost': 50, 'camo_unlock': 40, 'battle_pass': 35, 'weapon_leveling': 30,
      'operator_unlock': 25, 'calling_card': 20, 'prestige': 45, 'resurgence_wins': 35,
      'duo_wins': 30, 'squad_wins': 40, 'nuke_contract': 100, 'interrogation': 25,
      'zombies_rounds': 35, 'easter_egg': 50, 'dark_ops': 45, 'custom_service': 50,

      // PoE
      'poe_starter_pack': 60, 'poe_endgame_pack': 300,
      'poe_starter_build': 45, 'poe_endgame_build': 120,

      // Last Epoch
      'last_epoch_starter_pack': 45, 'last_epoch_endgame_pack': 100,

      // Generales
      'builds': 60, 'custom_build': 80, 'coaching': 40, 'boss_killing': 45,
      'uber_services': 65, 'mythic_plus': 75, 'raiding': 90, 'gold_farming': 25,
      'item_farming': 28, 'pvp_boost': 55, 'arena': 50, 'placement': 45, 'wins': 40,
      'dungeon_clearing': 35, 'nightmare_dungeons': 45, 'greater_rift': 50,
      'the_pit_artificer': 55, 'runewords': 40, 'bounty_services': 30,
      'monolith_farming': 40, 'legendary_crafting': 50, 'achievements': 30,
      'variable_leveling': 0
    };
    return defaults[serviceType] !== undefined ? defaults[serviceType] : 35;
  };

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/boosts/debug/all');
      setServices(response.data.allServices || []);
    } catch (error) {
      console.error('❌ Error fetching services:', error);
      setError('Error al cargar servicios: ' + (error.response?.data?.message || error.message));
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  useEffect(() => {
    if (!socket || !isInitialized) return;
    const handleServiceUpdated = (data) => {
      setServices(prev => prev.map(service => 
        service._id === data.serviceId || service._id === data._id ? { ...service, ...data } : service
      ));
      toast.info('Servicio actualizado');
    };
    const handleServiceCreated = (data) => {
      setServices(prev => [data, ...prev]);
      toast.success('Servicio creado');
    };
    const handleServiceDeleted = (data) => {
      setServices(prev => prev.filter(service => service._id !== data.serviceId));
      toast.warning('Servicio eliminado');
    };
    socket.on('service_updated_broadcast', handleServiceUpdated);
    socket.on('service_created_broadcast', handleServiceCreated);
    socket.on('service_deleted_broadcast', handleServiceDeleted);
    if (isConnected) socket.emit('subscribe_services');
    return () => {
      socket.off('service_updated_broadcast', handleServiceUpdated);
      socket.off('service_created_broadcast', handleServiceCreated);
      socket.off('service_deleted_broadcast', handleServiceDeleted);
      if (isConnected) socket.emit('unsubscribe_services');
    };
  }, [socket, isConnected, isInitialized]);

  const filteredServices = services.filter(service => {
    if (filters.game && service.game !== filters.game) return false;
    if (filters.category && filters.category !== 'all') {
      const serviceCategory = service.category || categorizeService(service.serviceType);
      if (serviceCategory !== filters.category) return false;
    }
    if (filters.serviceType && service.serviceType !== filters.serviceType) return false;
    return true;
  });

  const handleSaveService = async (serviceData) => {
    if (saveLock.current) {
      console.warn('⚠️ Ya hay una operación de guardado en progreso');
      return;
    }

    try {
      saveLock.current = true;
      setSaving(true);
      setError(null);

      if (!serviceData.name || serviceData.name.trim().length < 3) {
        throw new Error('El nombre debe tener al menos 3 caracteres');
      }
      if (!serviceData.description || serviceData.description.trim().length < 10) {
        throw new Error('La descripción debe tener al menos 10 caracteres');
      }
      if (!serviceData.game) {
        throw new Error('Debes seleccionar un juego');
      }
      if (!serviceData.serviceType) {
        throw new Error('Debes seleccionar un tipo de servicio');
      }

      const autoCategory = categorizeService(serviceData.serviceType);
      
      let basePriceValue = 0;
      if (serviceData.price && !isNaN(parseFloat(serviceData.price))) {
        basePriceValue = parseFloat(serviceData.price);
      } else {
        basePriceValue = getDefaultPriceForType(serviceData.serviceType);
      }

      const backendData = {
        name: serviceData.name.trim(),
        description: serviceData.description.trim(),
        game: serviceData.game,
        serviceType: serviceData.serviceType,
        basePrice: basePriceValue,
        price: basePriceValue,
        category: autoCategory,
        estimatedTime: serviceData.estimatedTime?.trim() || '2-3 días',
        available: serviceData.status === 'active',
        isActive: serviceData.status === 'active',
        features: ['Booster profesional', 'Soporte 24/7', 'Pago seguro', 'Seguimiento en vivo'],
        priceType: serviceData.priceType || 'fixed',
        variables: {
          hasHours: serviceData.serviceType === 'coaching',
          hasWins: serviceData.serviceType === 'wins',
          hasMatches: ['placement', 'arena'].includes(serviceData.serviceType),
          hasLevels: ['leveling', 'powerleveling', 'variable_leveling', 'paragon_leveling', 'poe2_leveling_40', 'poe2_leveling_70', 'poe2_leveling_90'].includes(serviceData.serviceType),
          hasFocusAreas: serviceData.serviceType === 'coaching',
          hasBuildSelection: serviceData.serviceType?.includes('build') || 
                            serviceData.serviceType?.includes('_pack') || 
                            serviceData.serviceType === 'custom_build' || 
                            serviceData.serviceType === 'dune_base_construction' ||
                            serviceData.serviceType === 'dune_craft_vehicle' ||
                            serviceData.serviceType?.startsWith('mop_'),
          hasBundleSelection: serviceData.serviceType?.startsWith('bundle_') || 
                              serviceData.serviceType?.includes('_pack')
        }
      };

      const isMopRaid = serviceData.serviceType?.startsWith('mop_');
      
      if (isMopRaid) {
        delete backendData.priceOptions;
        backendData.features = [
          '🔒 Método Piloted con VPN',
          '🏆 Todo el loot para ti',
          '⚡ Clear completo garantizado',
          'Booster profesional',
          'Soporte 24/7',
          'Pago seguro'
        ];
      }

      if (!isMopRaid && serviceData.priceOptions && serviceData.priceOptions.length > 0) {
        const validOptions = serviceData.priceOptions.filter(opt => opt.name && opt.name.trim() !== '');
        if (validOptions.length > 0) {
          backendData.priceOptions = validOptions;
        }
      }

      console.log('📤 Enviando al backend:', JSON.stringify(backendData, null, 2));

      let response;

      if (editingService) {
        const updateData = {
          name: backendData.name,
          description: backendData.description,
          price: basePriceValue,
          estimatedTime: backendData.estimatedTime,
          available: backendData.available,
          isActive: backendData.isActive,
          priceType: backendData.priceType,
          variables: backendData.variables,
          features: backendData.features
        };
        
        if (!isMopRaid && backendData.priceOptions) {
          updateData.priceOptions = backendData.priceOptions;
        }
        
        response = await axios.put(`/boosts/${editingService._id}`, updateData);
        toast.success('Servicio actualizado correctamente');
      } else {
        response = await axios.post('/boosts', backendData);
        toast.success('Servicio creado correctamente');
      }

      await fetchServices();
      setShowCreateModal(false);
      setEditingService(null);

    } catch (error) {
      console.error('❌ Error completo:', error);
      
      let errorMessage = 'Error al guardar el servicio';
      
      if (error.response) {
        console.error('📦 Response data:', error.response.data);
        console.error('📦 Status:', error.response.status);
        
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data?.errors) {
          if (typeof error.response.data.errors === 'object') {
            const validationErrors = Object.entries(error.response.data.errors)
              .map(([field, err]) => `${field}: ${err.message || JSON.stringify(err)}`)
              .join('\n');
            errorMessage = `Errores de validación:\n${validationErrors}`;
          } else {
            errorMessage = error.response.data.errors;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
      saveLock.current = false;
    }
  };

  const handleToggleStatus = async (serviceId, currentAvailable) => {
    try {
      const newAvailable = !currentAvailable;
      await axios.put(`/boosts/${serviceId}`, { available: newAvailable, isActive: newAvailable });
      setServices(prev => prev.map(service => 
        service._id === serviceId ? { ...service, available: newAvailable, isActive: newAvailable } : service
      ));
      toast.success(`Servicio ${newAvailable ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('❌ Error updating service status:', error);
      toast.error('Error al cambiar el estado del servicio');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;
    try {
      await axios.delete(`/boosts/${serviceId}`);
      setServices(prev => prev.filter(service => service._id !== serviceId));
      toast.success('Servicio eliminado');
    } catch (error) {
      console.error('❌ Error deleting service:', error);
      toast.error('Error al eliminar el servicio');
    }
  };

  const getStatusBadge = (available) => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {available ? '✅ Activo' : '⏸️ Inactivo'}
    </span>
  );

  const getCategoryBadge = (category) => {
    const categoryMap = {
      leveling: { color: 'bg-green-100 text-green-800', label: 'Leveling', icon: '📈' },
      builds: { color: 'bg-purple-100 text-purple-800', label: 'Builds', icon: '⚙️' },
      bundles: { color: 'bg-indigo-100 text-indigo-800', label: 'Bundles', icon: '📦' },
      content: { color: 'bg-blue-100 text-blue-800', label: 'PvE Content', icon: '🏆' },
      pvp: { color: 'bg-red-100 text-red-800', label: 'PvP', icon: '⚔️' },
      farming: { color: 'bg-yellow-100 text-yellow-800', label: 'Farming', icon: '💰' },
      coaching: { color: 'bg-orange-100 text-orange-800', label: 'Coaching', icon: '👨🏫' },
      competitive: { color: 'bg-amber-100 text-amber-800', label: 'Competitivo', icon: '🎮' }
    };
    const config = categoryMap[category] || { color: 'bg-gray-100 text-gray-800', label: category || 'Otro', icon: '🔧' };
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.icon} {config.label}</span>;
  };

  const getPriceTypeBadge = (priceType) => {
    const typeMap = {
      fixed: { color: 'bg-blue-100 text-blue-800', label: 'Precio Fijo' },
      variable: { color: 'bg-amber-100 text-amber-800', label: 'Precio Variable' },
      range: { color: 'bg-purple-100 text-purple-800', label: 'Rango' },
      negotiable: { color: 'bg-pink-100 text-pink-800', label: 'Negociable' }
    };
    const config = typeMap[priceType] || typeMap.fixed;
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>💰 {config.label}</span>;
  };

  const getServicePrice = (service) => service.basePrice || service.price || 0;

  const getPriceDisplay = (service) => {
    const price = getServicePrice(service);
    if (service.priceType === 'variable' || service.priceType === 'negotiable') {
      return `Desde $${price}`;
    }
    if (service.priceOptions && service.priceOptions.length > 0) {
      const minPrice = Math.min(...service.priceOptions.map(o => o.price));
      return `Desde $${minPrice}`;
    }
    if (service.serviceType === 'powerleveling' || service.serviceType === 'leveling') {
      return `$${price.toFixed(2)}/nivel`;
    }
    if (price === 0) {
      return 'Variable';
    }
    return `$${price}`;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className={`flex items-center justify-between mb-6 p-4 rounded-lg ${!isInitialized ? 'bg-blue-50' : isConnected ? 'bg-green-50' : 'bg-yellow-50'}`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${!isInitialized ? 'bg-blue-500' : isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm font-medium">{!isInitialized ? 'Conectando...' : isConnected ? '🟢 Sincronización activa' : '🟡 Modo offline'}</span>
        </div>
        <span className="text-xs bg-white px-3 py-1 rounded-full border">{services.length} servicios</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Servicios</h1>
          <p className="text-gray-600 mt-2">Administra todos los servicios de boosting</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center shadow-lg hover:shadow-xl transition-all"
        >
          <span className="text-xl mr-2">+</span> Nuevo Servicio
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium whitespace-pre-line">❌ {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border"><p className="text-sm text-gray-600">Total</p><p className="text-2xl font-bold">{services.length}</p></div>
        <div className="bg-white rounded-xl shadow-sm p-6 border"><p className="text-sm text-gray-600">Activos</p><p className="text-2xl font-bold">{services.filter(s => s.available).length}</p></div>
        <div className="bg-white rounded-xl shadow-sm p-6 border"><p className="text-sm text-gray-600">Packs</p><p className="text-2xl font-bold">{services.filter(s => s.serviceType?.includes('_pack')).length}</p></div>
        <div className="bg-white rounded-xl shadow-sm p-6 border"><p className="text-sm text-gray-600">Builds/Bases</p><p className="text-2xl font-bold">{services.filter(s => s.serviceType?.includes('build') || s.serviceType === 'custom_build' || s.serviceType === 'dune_base_construction' || s.serviceType === 'dune_craft_vehicle').length}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filtrar Servicios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={filters.game} onChange={(e) => setFilters({ ...filters, game: e.target.value, serviceType: '' })} className="border rounded-lg px-4 py-3">
            <option value="">Todos los juegos</option>
            {games.map(game => <option key={game} value={game}>{game}</option>)}
          </select>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="border rounded-lg px-4 py-3">
            {serviceCategories.map(cat => <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>)}
          </select>
          <select value={filters.serviceType} onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })} className="border rounded-lg px-4 py-3" disabled={!filters.game}>
            <option value={filters.game ? "Todos los servicios" : "Selecciona un juego"}>{filters.game ? "Todos los servicios" : "Selecciona un juego primero"}</option>
            {filters.game && getServiceTypeOptions(filters.game).map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <div key={service._id?.toString()} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold truncate">{service.name}</h3>
                <span className="text-xl font-bold text-blue-600">{getPriceDisplay(service)}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {getStatusBadge(service.available)}
                {getCategoryBadge(service.category || categorizeService(service.serviceType))}
                {getPriceTypeBadge(service.priceType || 'fixed')}
                {service.priceOptions && service.priceOptions.length > 0 && (
                  <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs">📋 {service.priceOptions.length} opciones</span>
                )}
                {service.serviceType?.includes('_pack') && <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">📦 Pack</span>}
                {service.serviceType === 'custom_build' && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">🎨 Custom</span>}
                {service.serviceType === 'dune_base_construction' && <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">🏗️ Base</span>}
                {service.serviceType === 'dune_craft_vehicle' && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">🏍️ Vehicle</span>}
                {service.serviceType?.startsWith('mop_') && <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">🐉 MoP Raid</span>}
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description || 'Sin descripción'}</p>
              <div className="space-y-2 text-sm mb-4">
                <p className="flex"><span className="text-gray-500 w-20">Juego:</span><span className="font-medium">{service.game}</span></p>
                <p className="flex"><span className="text-gray-500 w-20">Tipo:</span><span>{formatServiceType(service.serviceType)}</span></p>
              </div>
              <div className="flex justify-between pt-4 border-t">
                <button onClick={() => setEditingService(service)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">✏️ Editar</button>
                <button onClick={() => handleToggleStatus(service._id, service.available)} className={`text-sm font-medium ${service.available ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                  {service.available ? '⏸️ Desactivar' : '▶️ Activar'}
                </button>
                <button onClick={() => handleDeleteService(service._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">🗑️ Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(showCreateModal || editingService) && (
        <ServiceModal 
          service={editingService} 
          onSave={handleSaveService} 
          onClose={() => { setShowCreateModal(false); setEditingService(null); }} 
          loading={saving} 
          games={games} 
          getServiceTypeOptions={getServiceTypeOptions} 
          formatServiceType={formatServiceType}
          getDefaultPriceForType={getDefaultPriceForType}
        />
      )}
    </div>
  );
};

// ============================================
// SERVICE MODAL
// ============================================
const ServiceModal = ({ service, onSave, onClose, loading, games, getServiceTypeOptions, formatServiceType, getDefaultPriceForType }) => {
  const [formData, setFormData] = useState({
    name: service?.name || '', 
    description: service?.description || '',
    price: service?.basePrice || service?.price || '', 
    estimatedTime: service?.estimatedTime || '2-3 días',
    game: service?.game || '', 
    serviceType: service?.serviceType || '',
    status: service?.available ? 'active' : 'inactive',
    priceType: service?.priceType || 'fixed',
    priceOptions: Array.isArray(service?.priceOptions) ? service.priceOptions : []
  });
  const [errors, setErrors] = useState({});
  const [descriptionLength, setDescriptionLength] = useState(formData.description.length);

  const priceTypes = [
    { value: 'fixed', label: 'Precio Fijo', description: 'El cliente paga el precio establecido', icon: '💰', color: 'from-blue-500 to-cyan-500' },
    { value: 'variable', label: 'Precio Variable', description: 'El cliente propone un precio', icon: '💵', color: 'from-amber-500 to-orange-500' },
    { value: 'range', label: 'Rango de Precios', description: 'El cliente elige entre opciones', icon: '📊', color: 'from-purple-500 to-pink-500' },
    { value: 'negotiable', label: 'Negociable', description: 'Precio a negociar con el cliente', icon: '🤝', color: 'from-pink-500 to-rose-500' }
  ];

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        price: service.basePrice || service.price || '',
        estimatedTime: service.estimatedTime || '2-3 días',
        game: service.game || '',
        serviceType: service.serviceType || '',
        status: service.available ? 'active' : 'inactive',
        priceType: service.priceType || 'fixed',
        priceOptions: Array.isArray(service.priceOptions) ? service.priceOptions : []
      });
      setDescriptionLength(service.description?.length || 0);
    }
  }, [service]);

  useEffect(() => {
    if (formData.serviceType && !service) {
      const suggestedPrice = getDefaultPriceForType(formData.serviceType);
      if (suggestedPrice >= 0 && (!formData.price || formData.price === '')) {
        setFormData(prev => ({ ...prev, price: suggestedPrice }));
      }
    }
  }, [formData.serviceType, service, getDefaultPriceForType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = 'Nombre requerido (mínimo 3 caracteres)';
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      newErrors.description = 'Descripción mínima 10 caracteres';
    }

    const priceValue = parseFloat(formData.price);
    if (formData.price === '' || isNaN(priceValue) || priceValue < 0) {
      newErrors.price = 'Precio válido requerido';
    }

    if (!formData.estimatedTime.trim()) {
      newErrors.estimatedTime = 'Tiempo estimado requerido';
    }
    if (!formData.game) {
      newErrors.game = 'Selecciona un juego';
    }
    if (!formData.serviceType) {
      newErrors.serviceType = 'Selecciona un tipo de servicio';
    }

    const isMopRaid = formData.serviceType?.startsWith('mop_');
    if (!isMopRaid && formData.priceOptions && formData.priceOptions.length > 0) {
      for (const option of formData.priceOptions) {
        if (!option.name || option.name.trim() === '') {
          newErrors.priceOptions = 'Todas las opciones deben tener nombre';
          break;
        }
        if (option.price === undefined || option.price === null || option.price < 0) {
          newErrors.priceOptions = 'Todas las opciones deben tener un precio válido';
          break;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) { 
      setErrors(newErrors); 
      return; 
    }
    
    const dataToSave = { ...formData };
    
    if (formData.serviceType?.startsWith('mop_')) {
      dataToSave.priceOptions = [];
    } else if (formData.priceOptions && formData.priceOptions.length > 0) {
      const validOptions = formData.priceOptions.filter(opt => opt.name && opt.name.trim() !== '');
      dataToSave.priceOptions = validOptions;
    } else {
      delete dataToSave.priceOptions;
    }
    
    onSave(dataToSave);
  };

  const addPriceOption = () => {
    setFormData(prev => ({
      ...prev,
      priceOptions: [...(prev.priceOptions || []), { name: '', price: 0, description: '' }]
    }));
  };

  const removePriceOption = (index) => {
    setFormData(prev => ({
      ...prev,
      priceOptions: prev.priceOptions.filter((_, i) => i !== index)
    }));
  };

  const updatePriceOption = (index, field, value) => {
    setFormData(prev => {
      const newOptions = [...(prev.priceOptions || [])];
      newOptions[index] = { 
        ...newOptions[index], 
        [field]: field === 'price' ? parseFloat(value) || 0 : value 
      };
      return { ...prev, priceOptions: newOptions };
    });
  };

  const availableServiceTypes = formData.game ? getServiceTypeOptions(formData.game) : [];
  const suggestedPrice = getDefaultPriceForType(formData.serviceType);
  const showPriceOptions = formData.priceType === 'range' && !formData.serviceType?.startsWith('mop_');
  const isMopRaid = formData.serviceType?.startsWith('mop_');

  const getPriceHelpText = () => {
    if (isMopRaid) return '🐉 Precio base de la raid (las opciones se manejan en el frontend)';
    if (formData.priceType === 'variable') return '💰 Precio sugerido - El cliente puede ofertar';
    if (formData.priceType === 'negotiable') return '🤝 Precio base - Negociable con el cliente';
    if (formData.priceType === 'range') return '📊 Precio base sugerido - Define opciones abajo';
    if (formData.serviceType === 'variable_leveling') return '📊 El precio se calculará dinámicamente según niveles';
    if (formData.serviceType === 'dune_base_construction') return '🏗️ Precio de la base Small Outpost';
    if (formData.serviceType === 'dune_craft_vehicle') return '🏍️ Precio base Sandbike MK1';
    if (formData.serviceType === 'powerleveling' || formData.serviceType === 'leveling') return '📈 Precio POR NIVEL';
    return '💰 Precio base del servicio';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">
              {service ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl" disabled={loading}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className={`w-full border rounded-lg px-4 py-2.5 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Ej: Custom Coaching Session"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Juego <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.game} 
                  onChange={(e) => setFormData({...formData, game: e.target.value, serviceType: ''})} 
                  className={`w-full border rounded-lg px-4 py-2.5 ${errors.game ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar juego</option>
                  {games.map(game => <option key={game} value={game}>{game}</option>)}
                </select>
                {errors.game && <p className="text-red-500 text-xs mt-1">{errors.game}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={formData.description} 
                onChange={(e) => { 
                  setFormData({...formData, description: e.target.value}); 
                  setDescriptionLength(e.target.value.length); 
                }} 
                rows="4" 
                className={`w-full border rounded-lg px-4 py-2.5 resize-y ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Describe el servicio en detalle..."
              />
              <p className={`text-xs mt-1 ${descriptionLength < 10 ? 'text-red-500' : 'text-green-600'}`}>
                {descriptionLength}/500 caracteres (mínimo 10)
              </p>
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-700">
                Tipo de Precio <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {priceTypes.map(type => (
                  <label 
                    key={type.value}
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.priceType === type.value 
                        ? `border-blue-500 bg-gradient-to-br ${type.color} text-white shadow-lg` 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priceType"
                      value={type.value}
                      checked={formData.priceType === type.value}
                      onChange={(e) => setFormData({...formData, priceType: e.target.value})}
                      className="sr-only"
                    />
                    <span className={`text-2xl mb-2 ${formData.priceType === type.value ? 'text-white' : 'text-gray-600'}`}>
                      {type.icon}
                    </span>
                    <span className={`font-semibold text-sm ${formData.priceType === type.value ? 'text-white' : 'text-gray-800'}`}>
                      {type.label}
                    </span>
                    <span className={`text-xs text-center mt-1 ${formData.priceType === type.value ? 'text-white/80' : 'text-gray-500'}`}>
                      {type.description}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  {formData.priceType === 'fixed' ? 'Precio ($)' : 'Precio Sugerido ($)'} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: e.target.value})} 
                  className={`w-full border rounded-lg px-4 py-2.5 ${errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} 
                  min="0" 
                  step="0.01"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {getPriceHelpText()}
                  {suggestedPrice > 0 && !formData.price && !isMopRaid && (
                    <span className="block text-blue-600 font-medium mt-0.5">💡 Sugerido: ${suggestedPrice.toFixed(2)}</span>
                  )}
                </p>
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Tiempo Estimado <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.estimatedTime} 
                  onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})} 
                  className={`w-full border rounded-lg px-4 py-2.5 ${errors.estimatedTime ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Ej: 2-3 días"
                />
                {errors.estimatedTime && <p className="text-red-500 text-xs mt-1">{errors.estimatedTime}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Estado</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})} 
                  className="w-full border rounded-lg px-4 py-2.5 border-gray-300"
                >
                  <option value="active">✅ Activo</option>
                  <option value="inactive">⏸️ Inactivo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Tipo de Servicio <span className="text-red-500">*</span>
              </label>
              <select 
                value={formData.serviceType} 
                onChange={(e) => setFormData({...formData, serviceType: e.target.value})} 
                className={`w-full border rounded-lg px-4 py-2.5 ${errors.serviceType ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} 
                disabled={!formData.game}
              >
                <option value="">{formData.game ? 'Selecciona tipo' : 'Primero selecciona un juego'}</option>
                {availableServiceTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.serviceType && <p className="text-red-500 text-xs mt-1">{errors.serviceType}</p>}
            </div>

            {showPriceOptions && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    📋 Opciones de Precio
                  </label>
                  <button 
                    type="button" 
                    onClick={addPriceOption}
                    className="text-sm bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-1"
                  >
                    <span className="text-lg">+</span> Agregar Opción
                  </button>
                </div>

                {errors.priceOptions && (
                  <p className="text-red-500 text-xs mb-2">{errors.priceOptions}</p>
                )}

                {formData.priceOptions && formData.priceOptions.length > 0 ? (
                  <div className="space-y-3">
                    {formData.priceOptions.map((option, index) => (
                      <div key={index} className="flex gap-2 items-start p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-all">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Nombre de la opción"
                            value={option.name}
                            onChange={(e) => updatePriceOption(index, 'name', e.target.value)}
                            className="w-full p-2.5 border rounded-lg text-sm border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            placeholder="Precio"
                            value={option.price}
                            onChange={(e) => updatePriceOption(index, 'price', e.target.value)}
                            className="w-full p-2.5 border rounded-lg text-sm border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Descripción (opcional)"
                            value={option.description || ''}
                            onChange={(e) => updatePriceOption(index, 'description', e.target.value)}
                            className="w-full p-2.5 border rounded-lg text-sm border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePriceOption(index)}
                          className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm">No hay opciones de precio.</p>
                    <p className="text-gray-400 text-xs mt-1">Haz clic en "Agregar Opción" para crear.</p>
                  </div>
                )}
              </div>
            )}

            {isMopRaid && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-amber-800 text-sm flex items-center gap-2">
                  <span>🐉</span> Los MoP Raids tienen opciones de dificultad y extras configurados automáticamente en el frontend. No es necesario configurar opciones de precio aquí.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors rounded-lg hover:bg-gray-100"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading || !formData.game || !formData.serviceType || descriptionLength < 10 || formData.name.trim().length < 3} 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Guardando...
                  </span>
                ) : (service ? 'Actualizar Servicio' : 'Crear Servicio')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServicesManagement;