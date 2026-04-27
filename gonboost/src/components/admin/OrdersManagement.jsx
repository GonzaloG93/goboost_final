// frontend/src/components/admin/OrdersManagement.jsx - VERSIÓN COMPLETA CORREGIDA

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { useSocket } from '../../context/SocketContext';
import { formatServiceType } from '../../config/gamesConfig';

const OrdersManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { socket, isConnected, subscribeOrders } = useSocket();

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    if (!socket) return;

    subscribeOrders();

    const handleOrderUpdated = (data) => {
      setOrders(prev => 
        prev.map(order => 
          order._id === data.orderId 
            ? { ...order, status: data.newStatus }
            : order
        )
      );
    };

    const handleOrderCreated = (data) => {
      fetchOrders();
    };

    socket.on('order_updated', handleOrderUpdated);
    socket.on('order_created', handleOrderCreated);

    return () => {
      socket.off('order_updated', handleOrderUpdated);
      socket.off('order_created', handleOrderCreated);
    };
  }, [socket, subscribeOrders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? '/admin/orders' 
        : `/admin/orders?status=${statusFilter}`;

      const response = await axios.get(url);
      const ordersData = response.data.orders || [];

      const processedOrders = ordersData.map(order => ({
        ...order,
        totalAmount: order.totalPrice || order.totalAmount || 0,
        booster: order.booster || order.assignedBooster,
        paymentStatus: order.paymentStatus || 'no_payment',
        paymentMethod: order.paymentMethod || 'none'
      }));

      setOrders(processedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders(getSampleOrders());
    } finally {
      setLoading(false);
    }
  };

  // ✅ OBTENER EL NOMBRE DEL SERVICIO (MÚLTIPLES FUENTES)
  const getServiceName = (order) => {
    // 1. Intentar desde order.service (populado correctamente)
    if (order.service?.name) {
      return order.service.name;
    }
    
    // 2. Intentar desde gameDetails.buildName (para builds)
    if (order.gameDetails?.buildName) {
      return order.gameDetails.buildName;
    }
    
    // 3. Intentar desde gameDetails.serviceType (formateado)
    if (order.gameDetails?.serviceType) {
      return formatServiceType(order.gameDetails.serviceType);
    }
    
    // 4. Intentar desde order.service.serviceType (si el populate trajo el tipo pero no el nombre)
    if (order.service?.serviceType) {
      return formatServiceType(order.service.serviceType);
    }
    
    // 5. Fallback
    return 'Servicio Desconocido';
  };

  // ✅ OBTENER EL JUEGO DEL SERVICIO
  const getServiceGame = (order) => {
    if (order.service?.game) {
      return order.service.game;
    }
    if (order.gameDetails?.game) {
      return order.gameDetails.game;
    }
    return 'N/A';
  };

  // ✅ OBTENER EL TIPO DE SERVICIO
  const getServiceType = (order) => {
    if (order.service?.serviceType) {
      return order.service.serviceType;
    }
    if (order.gameDetails?.serviceType) {
      return order.gameDetails.serviceType;
    }
    return null;
  };

  // ✅ VERIFICAR SI ES UN BUILD
  const isBuild = (order) => {
    const serviceType = getServiceType(order);
    return serviceType && (
      serviceType.startsWith('builds_') ||
      serviceType.includes('poe') ||
      serviceType.includes('d2_') ||
      serviceType === 'custom_build'
    );
  };

  // ✅ VERIFICAR SI ES UN SERVICIO CUSTOM (VARIABLE/NEGOCIABLE/RANGE)
  const isCustomService = (order) => {
    const priceType = order.service?.priceType || order.gameDetails?.priceType;
    return priceType && ['variable', 'range', 'negotiable'].includes(priceType);
  };

  // ✅ RENDERIZAR DETALLES DE BUILD EN LA TABLA
  const renderBuildDetails = (order) => {
    if (!isBuild(order)) return null;

    const buildName = order.gameDetails?.buildName || formatServiceType(getServiceType(order));
    const buildSpecs = order.gameDetails?.buildSpecifications;

    return (
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
            ⚙️ {buildName}
          </span>
          {order.gameDetails?.includeTormented && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              ✨ Tormented
            </span>
          )}
          {isCustomService(order) && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              💰 {order.service?.priceType === 'variable' ? 'Variable' : 
                   order.service?.priceType === 'negotiable' ? 'Negociable' : 'Opciones'}
            </span>
          )}
        </div>
        {buildSpecs && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs font-medium text-blue-800 mb-1">Specs:</p>
            <p className="text-xs text-gray-700 line-clamp-2">{buildSpecs}</p>
          </div>
        )}
      </div>
    );
  };

  // ✅ RENDERIZAR DETALLES DE SERVICIO CUSTOM
  const renderCustomServiceDetails = (order) => {
    if (!isCustomService(order)) return null;

    const customerOffer = order.gameDetails?.customPrice || order.totalAmount;
    const suggestedPrice = order.service?.basePrice || order.gameDetails?.basePrice;
    const selectedOption = order.gameDetails?.selectedOption;

    return (
      <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
        {selectedOption && (
          <p className="text-xs text-amber-800">
            <span className="font-medium">Opción:</span> {selectedOption}
          </p>
        )}
        {customerOffer && suggestedPrice && customerOffer !== suggestedPrice && (
          <p className="text-xs text-amber-800">
            <span className="font-medium">Oferta:</span> ${customerOffer} 
            <span className="text-gray-500 ml-1">(Sugerido: ${suggestedPrice})</span>
          </p>
        )}
        {order.gameDetails?.buildSpecifications && (
          <p className="text-xs text-gray-700 mt-1 line-clamp-2">
            {order.gameDetails.buildSpecifications}
          </p>
        )}
      </div>
    );
  };

  // ✅ FORMATEAR MÉTODO DE PAGO
  const formatPaymentMethod = (method) => {
    if (!method || method === 'none') return '-';

    const methodMap = {
      'paypal': 'PayPal',
      'binance': 'Binance Pay',
      'stripe': 'Stripe',
      'manual': 'Manual',
      'nowpayments': 'NOWPayments',
      'credit_card': 'Tarjeta',
      'wallet': 'Monedero',
      'transfer': 'Transferencia',
      'cash': 'Efectivo'
    };

    return methodMap[method.toLowerCase()] || method;
  };

  const getPaymentBadge = (paymentStatus) => {
    const paymentConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', 
        label: 'Pendiente',
        icon: '⏳'
      },
      pending_verification: { 
        color: 'bg-orange-100 text-orange-800 border border-orange-200', 
        label: 'Por Verificar',
        icon: '🔍'
      },
      paid: { 
        color: 'bg-green-100 text-green-800 border border-green-200', 
        label: 'Pagado',
        icon: '✅'
      },
      completed: { 
        color: 'bg-green-100 text-green-800 border border-green-200', 
        label: 'Confirmado',
        icon: '💰'
      },
      failed: { 
        color: 'bg-red-100 text-red-800 border border-red-200', 
        label: 'Fallido',
        icon: '❌'
      },
      refunded: { 
        color: 'bg-purple-100 text-purple-800 border border-purple-200', 
        label: 'Reembolsado',
        icon: '↩️'
      },
      no_payment: { 
        color: 'bg-gray-100 text-gray-600 border border-gray-300', 
        label: 'Sin Pago',
        icon: '📝'
      }
    };

    const config = paymentConfig[paymentStatus] || paymentConfig.no_payment;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1 text-xs">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', 
        label: 'Pendiente',
        icon: '⏳'
      },
      paid: { 
        color: 'bg-blue-100 text-blue-800 border border-blue-200', 
        label: 'Pagado',
        icon: '💰'
      },
      in_progress: { 
        color: 'bg-indigo-100 text-indigo-800 border border-indigo-200', 
        label: 'En Progreso',
        icon: '🔄'
      },
      completed: { 
        color: 'bg-green-100 text-green-800 border border-green-200', 
        label: 'Completado',
        icon: '✅'
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800 border border-red-200', 
        label: 'Cancelado',
        icon: '❌'
      },
      awaiting_payment_confirmation: { 
        color: 'bg-orange-100 text-orange-800 border border-orange-200', 
        label: 'Esperando Pago',
        icon: '⏰'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const handleUpdateStatus = async (orderId, newStatus, e) => {
    e.stopPropagation();

    try {
      await axios.put(`/admin/orders/${orderId}/status`, {
        status: newStatus
      });

      setOrders(prev => 
        prev.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
    } catch (error) {
      console.error('Error actualizando orden:', error);
    }
  };

  const handleRowClick = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleSelectClick = (e) => {
    e.stopPropagation();
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      order.user?.username?.toLowerCase().includes(searchLower) ||
      getServiceName(order).toLowerCase().includes(searchLower) ||
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order._id?.toLowerCase().includes(searchLower) ||
      order.gameDetails?.buildSpecifications?.toLowerCase().includes(searchLower);

    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  const paymentStats = {
    total: orders.length,
    paid: orders.filter(o => o.paymentStatus === 'paid' || o.paymentStatus === 'completed').length,
    pending: orders.filter(o => o.paymentStatus === 'pending').length,
    pendingVerification: orders.filter(o => o.paymentStatus === 'pending_verification').length,
    failed: orders.filter(o => o.paymentStatus === 'failed').length,
    noPayment: orders.filter(o => o.paymentStatus === 'no_payment').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600">Cargando órdenes...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Órdenes</h1>
          <p className="text-gray-600 mt-1">Administra todas las órdenes del sistema</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <span className="mr-2">🔄</span>
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total', value: paymentStats.total, color: 'blue', icon: '📦' },
          { label: 'Pagadas', value: paymentStats.paid, color: 'green', icon: '💰' },
          { label: 'Por Verificar', value: paymentStats.pendingVerification, color: 'orange', icon: '🔍' },
          { label: 'Pendientes', value: paymentStats.pending, color: 'yellow', icon: '⏳' },
          { label: 'Sin Pago', value: paymentStats.noPayment, color: 'gray', icon: '📝' },
          { label: 'Fallidos', value: paymentStats.failed, color: 'red', icon: '❌' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="text-2xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por orden, usuario, servicio o especificaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="paid">Pagados</option>
          <option value="awaiting_payment_confirmation">Esperando Pago</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los pagos</option>
          <option value="paid">Pagados</option>
          <option value="completed">Confirmados</option>
          <option value="pending_verification">Por Verificar</option>
          <option value="pending">Pendientes</option>
          <option value="no_payment">Sin pago</option>
          <option value="failed">Fallidos</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio / Build
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr 
                  key={order._id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(order._id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900 font-semibold">
                      #{order.orderNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {/* ✅ NOMBRE DEL SERVICIO - CORREGIDO */}
                    <div className="text-sm font-medium text-gray-900">
                      {getServiceName(order)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getServiceGame(order)}
                    </div>
                    {renderBuildDetails(order)}
                    {renderCustomServiceDetails(order)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.user?.username || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{order.user?.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${order.totalAmount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatPaymentMethod(order.paymentMethod)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentBadge(order.paymentStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={handleSelectClick}>
                    <select 
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order._id, e.target.value, e)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 cursor-pointer"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagado</option>
                      <option value="awaiting_payment_confirmation">Esperando Pago</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm ? 'No se encontraron órdenes' : 'No hay órdenes registradas'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// DATOS DE EJEMPLO
const getSampleOrders = () => {
  return [
    {
      _id: 'sample_1',
      orderNumber: 'BS000001',
      user: { username: 'usuario1', email: 'user1@example.com' },
      service: { name: 'Rank Boost', game: 'League of Legends' },
      gameDetails: { game: 'League of Legends', serviceType: 'rank_boost' },
      status: 'pending',
      paymentStatus: 'no_payment',
      paymentMethod: 'none',
      totalAmount: 45.00,
      createdAt: new Date(),
    },
    {
      _id: 'sample_2',
      orderNumber: 'BS000002',
      user: { username: 'usuario2', email: 'user2@example.com' },
      service: { name: 'Starter Build', game: 'Diablo 4', priceType: 'fixed' },
      gameDetails: {
        game: 'Diablo 4',
        serviceType: 'builds_starter',
        buildName: 'Starter Build',
        buildSpecifications: 'I want a Barbarian build focusing on Whirlwind.',
        includeTormented: true
      },
      status: 'in_progress',
      paymentStatus: 'pending_verification',
      paymentMethod: 'binance',
      totalAmount: 60.00,
      createdAt: new Date(),
    }
  ];
};

export default OrdersManagement;