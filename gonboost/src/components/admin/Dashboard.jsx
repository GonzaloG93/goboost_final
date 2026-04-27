// frontend/src/components/admin/Dashboard.jsx
// VERSIÓN CON SECCIÓN "A PAGAR" Y MODAL DE BOOSTERS

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'react-toastify';
import {
  FaUsers, FaShoppingCart, FaDollarSign, FaCheckCircle,
  FaClock, FaTicketAlt, FaStar, FaChartLine, FaGamepad,
  FaSpinner, FaSync, FaComment, FaMoneyBillWave, FaUserPlus,
  FaUser, FaCalendar, FaExternalLinkAlt, FaCoins, FaSave, FaTimes
} from 'react-icons/fa';

const Dashboard = () => {
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [updatingBooster, setUpdatingBooster] = useState(null);
  const [boosterNotes, setBoosterNotes] = useState({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    toPay: 0, // 50% de los ingresos
    averageOrderValue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    openTickets: 0,
    activeServices: 0,
    paidOrders: 0,
    inProgressOrders: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [error, setError] = useState(null);

  // Funciones auxiliares
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Cargar estadísticas
  const fetchStats = useCallback(async () => {
    try {
      const statsResponse = await axios.get('/admin/stats');
      
      if (statsResponse.data.success) {
        const data = statsResponse.data;
        setStats({
          totalUsers: data.totalUsers || 0,
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          toPay: (data.totalRevenue || 0) * 0.5, // 50% para pagar a boosters
          averageOrderValue: data.averageOrderValue || 0,
          pendingOrders: data.pendingOrders || 0,
          completedOrders: data.completedOrders || 0,
          openTickets: data.openTickets || 0,
          paidOrders: data.paidOrders || 0,
          inProgressOrders: data.inProgressOrders || 0,
          activeServices: 0
        });
      }

      const servicesResponse = await axios.get('/boosts?available=true&limit=1000');
      setStats(prev => ({
        ...prev,
        activeServices: servicesResponse.data.length || 0
      }));

    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Error loading dashboard data');
    }
  }, []);

  // Cargar órdenes completadas para el modal de pagos
  const fetchCompletedOrdersForPayout = useCallback(async () => {
    try {
      const response = await axios.get('/admin/orders?status=completed&limit=100');
      const orders = response.data.orders || [];
      
      // Calcular 50% de cada orden y obtener el booster asignado
      const ordersWithPayout = orders.map(order => ({
        ...order,
        boosterAmount: (order.totalPrice || 0) * 0.5,
        boosterName: order.boosterAssigned || order.boosterNotes || ''
      }));
      
      setCompletedOrders(ordersWithPayout);
      
      // Inicializar notas de booster
      const notes = {};
      ordersWithPayout.forEach(order => {
        notes[order._id] = order.boosterName || '';
      });
      setBoosterNotes(notes);
      
    } catch (error) {
      console.error('Error fetching completed orders:', error);
    }
  }, []);

  // Guardar asignación de booster para una orden
  const saveBoosterAssignment = async (orderId, boosterName) => {
    try {
      setUpdatingBooster(orderId);
      
      await axios.put(`/admin/orders/${orderId}/booster-note`, {
        boosterName: boosterName,
        note: `Booster asignado: ${boosterName}`
      });
      
      // Actualizar localmente
      setCompletedOrders(prev => 
        prev.map(order => 
          order._id === orderId 
            ? { ...order, boosterName: boosterName, boosterAssigned: boosterName }
            : order
        )
      );
      
      toast.success(`Booster "${boosterName}" asignado correctamente`);
      
      // Recargar actividad reciente
      fetchRecentActivity();
      
    } catch (error) {
      console.error('Error saving booster assignment:', error);
      toast.error('Error al guardar la asignación');
    } finally {
      setUpdatingBooster(null);
    }
  };

  // Abrir modal y cargar órdenes
  const handleOpenPayoutModal = async () => {
    setShowPayoutModal(true);
    await fetchCompletedOrdersForPayout();
  };

  // Cargar actividad reciente
  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await axios.get('/admin/recent-activity?limit=10');
      if (response.data.success && response.data.activity.length > 0) {
        setRecentActivity(response.data.activity);
      } else {
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    }
  }, []);

  // Cargar notas recientes
  const fetchRecentNotes = useCallback(async () => {
    try {
      const response = await axios.get('/admin/order-notes?limit=5');
      if (response.data.success && response.data.notes.length > 0) {
        setRecentNotes(response.data.notes);
      } else {
        setRecentNotes([]);
      }
    } catch (error) {
      console.error('Error fetching recent notes:', error);
      setRecentNotes([]);
    }
  }, []);

  // Recargar todo
  const loadAllData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentActivity(),
        fetchRecentNotes()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Error loading dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchStats, fetchRecentActivity, fetchRecentNotes]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Socket para actualizaciones
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOrderUpdate = () => {
      toast.info('Orden actualizada. Actualizando datos...');
      fetchStats();
      fetchRecentActivity();
    };

    socket.on('order_created', handleOrderUpdate);
    socket.on('order_updated', handleOrderUpdate);
    socket.on('payment_received', handleOrderUpdate);

    return () => {
      socket.off('order_created', handleOrderUpdate);
      socket.off('order_updated', handleOrderUpdate);
      socket.off('payment_received', handleOrderUpdate);
    };
  }, [socket, isConnected, fetchStats, fetchRecentActivity]);

  // Tarjetas principales
  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers,
      icon: FaUsers,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      link: '/admin/users'
    },
    {
      title: 'Órdenes Totales',
      value: stats.totalOrders,
      icon: FaShoppingCart,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      link: '/admin/orders'
    },
    {
      title: 'Ingresos Totales',
      value: formatCurrency(stats.totalRevenue),
      icon: FaDollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      link: '/admin/orders?status=completed'
    },
    {
      title: '💰 A Pagar (50%)',
      value: formatCurrency(stats.toPay),
      icon: FaMoneyBillWave,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      link: '#',
      onClick: handleOpenPayoutModal
    }
  ];

  const secondaryStats = [
    {
      title: 'Pendientes',
      value: stats.pendingOrders,
      icon: FaClock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      link: '/admin/orders?status=pending,awaiting_payment_confirmation'
    },
    {
      title: 'Pagadas',
      value: stats.paidOrders,
      icon: FaCheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/admin/orders?status=paid'
    },
    {
      title: 'En Progreso',
      value: stats.inProgressOrders,
      icon: FaStar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/admin/orders?status=in_progress'
    },
    {
      title: 'Completadas',
      value: stats.completedOrders,
      icon: FaCheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/admin/orders?status=completed'
    },
    {
      title: 'Tickets Abiertos',
      value: stats.openTickets,
      icon: FaTicketAlt,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      link: '/admin/tickets'
    },
    {
      title: 'Servicios Activos',
      value: stats.activeServices,
      icon: FaGamepad,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      link: '/admin/services'
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FaSpinner className="animate-spin text-blue-500 text-4xl mb-4" />
        <p className="text-gray-500">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen general de tu negocio</p>
        </div>
        <div className="flex items-center gap-4">
          {isConnected ? (
            <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Actualizaciones en vivo
            </span>
          ) : (
            <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Modo offline
            </span>
          )}
          <button
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 flex items-center gap-2">
            <span>⚠️</span> {error}
          </p>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const CardWrapper = stat.onClick ? 'div' : Link;
          const props = stat.onClick ? { onClick: stat.onClick, className: "cursor-pointer" } : { to: stat.link };
          
          return (
            <CardWrapper
              key={index}
              {...props}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all group block"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`text-xl bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                </div>
                <FaExternalLinkAlt className="text-gray-300 group-hover:text-blue-500 transition-colors text-xs" />
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </CardWrapper>
          );
        })}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {secondaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.link}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={stat.color} />
                </div>
                <FaExternalLinkAlt className="text-gray-300 group-hover:text-blue-500 transition-colors text-[10px] ml-auto" />
              </div>
              <p className="text-xs text-gray-500">{stat.title}</p>
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity and Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FaChartLine className="text-blue-500" />
              Actividad Reciente
            </h2>
            <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800">
              Ver todo →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 6).map((activity, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="text-lg">{activity.action?.split(' ')[0] || '📦'}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FaUser className="text-gray-400" />
                          {activity.user}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaCalendar className="text-gray-400" />
                          {formatDate(activity.timestamp)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <FaChartLine className="text-gray-300 text-3xl mx-auto mb-2" />
                No hay actividad reciente
              </div>
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FaComment className="text-green-500" />
              Notas Recientes
            </h2>
            <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800">
              Ver órdenes →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentNotes.length > 0 ? (
              recentNotes.slice(0, 5).map((note, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      note.type === 'admin' ? 'bg-blue-100' : 
                      note.type === 'customer' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <FaUser className={note.type === 'admin' ? 'text-blue-600' : 'text-gray-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          to={`/admin/orders/${note.orderId}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          #{note.orderNumber}
                        </Link>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 truncate">{note.serviceName}</span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span>{note.userName}</span>
                        <span>{formatDate(note.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <FaComment className="text-gray-300 text-3xl mx-auto mb-2" />
                No hay notas recientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
        <Link to="/admin/orders?status=pending,awaiting_payment_confirmation" className="bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg p-3 text-center transition-colors">
          <span className="text-yellow-700 text-sm font-medium">⏳ Órdenes Pendientes</span>
        </Link>
        <Link to="/admin/orders?status=paid" className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-3 text-center transition-colors">
          <span className="text-green-700 text-sm font-medium">💰 Pagadas</span>
        </Link>
        <Link to="/admin/orders?status=in_progress" className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-3 text-center transition-colors">
          <span className="text-blue-700 text-sm font-medium">🔄 En Progreso</span>
        </Link>
        <Link to="/admin/tickets?status=open" className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-3 text-center transition-colors">
          <span className="text-red-700 text-sm font-medium">🎫 Tickets Abiertos</span>
        </Link>
        <Link to="/admin/services" className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-3 text-center transition-colors">
          <span className="text-purple-700 text-sm font-medium">⚙️ Gestionar Servicios</span>
        </Link>
      </div>

      {/* MODAL DE PAGOS A BOOSTERS */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FaMoneyBillWave className="text-2xl" />
                  Pagos a Boosters (50% de cada orden)
                </h2>
                <p className="text-sm text-orange-100 mt-1">
                  Total a pagar: {formatCurrency(stats.toPay)} | 
                  Órdenes completadas: {stats.completedOrders}
                </p>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Modal Body - Tabla de órdenes */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              {completedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FaMoneyBillWave className="text-gray-300 text-5xl mx-auto mb-4" />
                  <p className="text-gray-500">No hay órdenes completadas para calcular pagos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">A Pagar (50%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booster Asignado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {completedOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-mono font-semibold text-gray-900">
                              #{order.orderNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {order.service?.name || 'Servicio'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.service?.game || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.user?.username || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(order.totalPrice || 0)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-bold text-orange-600">
                              {formatCurrency((order.totalPrice || 0) * 0.5)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={boosterNotes[order._id] || ''}
                              onChange={(e) => setBoosterNotes(prev => ({
                                ...prev,
                                [order._id]: e.target.value
                              }))}
                              placeholder="Nombre del booster"
                              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => saveBoosterAssignment(order._id, boosterNotes[order._id])}
                              disabled={updatingBooster === order._id}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {updatingBooster === order._id ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaSave />
                              )}
                              <span>Guardar</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 sticky bottom-0">
                      <tr className="border-t-2 border-gray-200">
                        <td colSpan="4" className="px-4 py-3 text-right font-bold text-gray-900">
                          Total a Pagar:
                        </td>
                        <td className="px-4 py-3 font-bold text-orange-600 text-lg">
                          {formatCurrency(completedOrders.reduce((sum, order) => sum + ((order.totalPrice || 0) * 0.5), 0))}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={fetchCompletedOrdersForPayout}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <FaSync />
                Refrescar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;