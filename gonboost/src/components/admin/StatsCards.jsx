// frontend/src/components/admin/StatsCards.jsx
// VERSIÓN CORREGIDA - SIN ERRORES

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { useSocket } from '../../context/SocketContext';
import {
  FaShoppingCart, FaDollarSign, FaCheckCircle, FaClock,
  FaTicketAlt, FaGamepad, FaChartLine, FaCoins, FaSpinner
} from 'react-icons/fa';

const StatsCards = () => {
  const { socket, isConnected } = useSocket();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    netProfit: 0,
    profitMargin: 0,
    averageOrderValue: 0,
    openTickets: 0,
    activeServices: 0
  });

  // ✅ FUNCIÓN DE FORMATO ANTES DE SER USADA
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const fetchRealStats = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await axios.get('/admin/stats');
      
      if (statsResponse.data.success) {
        const data = statsResponse.data;
        setStats({
          totalOrders: data.totalOrders || 0,
          pendingOrders: data.pendingOrders || 0,
          completedOrders: data.completedOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          netProfit: data.netProfit || 0,
          profitMargin: data.profitMargin || 0,
          averageOrderValue: data.averageOrderValue || 0,
          openTickets: data.openTickets || 0,
          activeServices: 0
        });
      }

      const servicesResponse = await axios.get('/boosts?available=true&limit=1000');
      setStats(prev => ({
        ...prev,
        activeServices: servicesResponse.data.length || 0
      }));

    } catch (error) {
      console.error('❌ Error fetching real stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealStats();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRefresh = () => fetchRealStats();
    
    socket.on('order_created', handleRefresh);
    socket.on('order_updated', handleRefresh);
    socket.on('stats_updated', handleRefresh);
    socket.on('payment_received', handleRefresh);

    return () => {
      socket.off('order_created', handleRefresh);
      socket.off('order_updated', handleRefresh);
      socket.off('stats_updated', handleRefresh);
      socket.off('payment_received', handleRefresh);
    };
  }, [socket, isConnected]);

  const mainStats = [
    {
      title: 'Órdenes Totales',
      value: stats.totalOrders,
      icon: FaShoppingCart,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
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
      title: 'Beneficio Neto',
      value: formatCurrency(stats.netProfit),
      icon: FaCoins,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      link: '/admin/finances'
    },
    {
      title: 'Valor Promedio',
      value: formatCurrency(stats.averageOrderValue),
      icon: FaChartLine,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      link: '/admin/orders'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse flex items-center justify-between">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="mt-4 h-4 bg-gray-200 rounded w-24"></div>
            <div className="mt-2 h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.link}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`text-xl bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              </div>
              <p className="text-xs text-gray-500">{stat.title}</p>
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default StatsCards;