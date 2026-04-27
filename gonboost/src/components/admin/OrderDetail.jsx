// components/admin/OrderDetail.jsx - VERSIÓN COMPLETA PARA TODOS LOS SERVICIOS

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'react-toastify';
import { formatServiceType } from '../../config/gamesConfig';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [note, setNote] = useState('');
  
  // Estados para comprobante de pago
  const [paymentProof, setPaymentProof] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
    fetchPaymentProof();
    
    if (socket) {
      socket.emit('join_order', { orderId });
      
      socket.on('order_updated', handleOrderUpdate);
      socket.on('order_note_added', handleNoteAdded);
      
      return () => {
        socket.emit('leave_order', { orderId });
        socket.off('order_updated', handleOrderUpdate);
        socket.off('order_note_added', handleNoteAdded);
      };
    }
  }, [orderId, socket]);

  const handleOrderUpdate = (data) => {
    if (data.orderId === orderId) {
      setOrder(prev => ({ ...prev, ...data.updates }));
      toast.info(`Orden actualizada: ${data.updates.status || 'Cambios aplicados'}`);
    }
  };

  const handleNoteAdded = (data) => {
    if (data.orderId === orderId) {
      setOrder(prev => ({
        ...prev,
        notes: [data.note, ...(prev.notes || [])]
      }));
      toast.info('Nueva nota agregada');
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/orders/${orderId}`);
      
      if (response.data.success) {
        const orderData = response.data.order || response.data.data;
        setOrder(orderData);
      } else {
        throw new Error(response.data.message || 'Error cargando orden');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(errorMsg);
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentProof = async () => {
    try {
      const response = await axios.get(`/payments/proof/${orderId}`);
      if (response.data.success && response.data.data.length > 0) {
        setPaymentProof(response.data.data[0]);
      }
    } catch (error) {
      console.log('No payment proof found');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`¿Cambiar estado a "${newStatus}"?`)) return;
    
    setUpdating(true);
    try {
      const response = await axios.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        notes: note || `Estado cambiado a ${newStatus} por admin`
      });
      
      if (response.data.success) {
        setOrder(prev => ({ ...prev, status: newStatus }));
        toast.success(`✅ Estado actualizado a ${newStatus}`);
        setNote('');
        
        if (socket) {
          socket.emit('order_status_changed', { orderId, newStatus, updatedBy: user._id });
        }
      }
    } catch (error) {
      toast.error('Error actualizando estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    
    setUpdating(true);
    try {
      const response = await axios.post(`/admin/orders/${orderId}/notes`, {
        content: note,
        type: 'admin'
      });
      
      if (response.data.success) {
        setOrder(prev => ({
          ...prev,
          notes: [response.data.note, ...(prev.notes || [])]
        }));
        setNote('');
        toast.success('📝 Nota agregada');
      }
    } catch (error) {
      toast.error('Error agregando nota');
    } finally {
      setUpdating(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!paymentProof?.paymentId && !order?.paymentReference) {
      toast.error('No se encontró información de pago');
      return;
    }

    const paymentId = paymentProof?.paymentId || order?.paymentReference;
    
    if (!window.confirm('¿Confirmar que el pago es válido y aprobarlo?')) return;

    setVerifyingPayment(true);
    try {
      const response = await axios.post(`/payments/verify/${paymentId}`, {
        status: 'completed',
        notes: 'Pago verificado por admin'
      });

      if (response.data.success) {
        toast.success('✅ Pago aprobado exitosamente');
        setOrder(prev => ({ ...prev, paymentStatus: 'paid', status: 'paid' }));
        if (paymentProof) {
          setPaymentProof(prev => ({ ...prev, status: 'approved' }));
        }
        fetchOrderDetails();
      }
    } catch (error) {
      toast.error('Error aprobando pago');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!paymentProof?.paymentId && !order?.paymentReference) {
      toast.error('No se encontró información de pago');
      return;
    }

    const reason = prompt('¿Motivo del rechazo?');
    if (!reason) return;

    const paymentId = paymentProof?.paymentId || order?.paymentReference;

    setVerifyingPayment(true);
    try {
      const response = await axios.post(`/payments/verify/${paymentId}`, {
        status: 'rejected',
        notes: reason
      });

      if (response.data.success) {
        toast.success('❌ Pago rechazado');
        setOrder(prev => ({ ...prev, paymentStatus: 'failed' }));
        if (paymentProof) {
          setPaymentProof(prev => ({ ...prev, status: 'rejected' }));
        }
        fetchOrderDetails();
      }
    } catch (error) {
      toast.error('Error rechazando pago');
    } finally {
      setVerifyingPayment(false);
    }
  };

  // ============================================
  // DETECTORES DE TIPO DE SERVICIO
  // ============================================
  
  const isDuneBaseConstruction = () => {
    const serviceType = order?.gameDetails?.serviceType || order?.service?.serviceType;
    return serviceType === 'dune_base_construction';
  };

  const isLevelingService = () => {
    const serviceType = order?.gameDetails?.serviceType || order?.service?.serviceType;
    return ['powerleveling', 'leveling', 'paragon_leveling', 'variable_leveling'].includes(serviceType) ||
           serviceType?.startsWith('poe2_leveling');
  };

  const isBuild = () => {
    const serviceType = order?.gameDetails?.serviceType || order?.service?.serviceType;
    return serviceType && (
      serviceType.startsWith('builds_') ||
      serviceType.includes('poe') ||
      serviceType.includes('d2_') ||
      serviceType === 'custom_build'
    );
  };

  const isBundle = () => {
    const serviceType = order?.gameDetails?.serviceType || order?.service?.serviceType;
    return serviceType?.includes('_pack');
  };

  // ============================================
  // RENDERIZADOR DE DETALLES DEL SERVICIO (UNIVERSAL)
  // ============================================
  const renderServiceSpecificDetails = () => {
    if (!order) return null;
    
    const gameDetails = order.gameDetails || {};
    const buildSpecs = gameDetails.buildSpecifications;
    const customerNotes = gameDetails.customerNotes || gameDetails.notes;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📋</span>
          Service Configuration
        </h2>
        
        <div className="space-y-4">
          {/* DUNE: BASE CONSTRUCTION */}
          {isDuneBaseConstruction() && (
            <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
              <h3 className="font-semibold text-emerald-900 mb-3 flex items-center">
                <span className="mr-2">🏗️</span>
                Base Construction Details
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <span className="text-gray-600">Base Size:</span>
                <span className="font-medium text-gray-800">{gameDetails.baseSize || gameDetails.baseName || 'N/A'}</span>
                
                <span className="text-gray-600">Base Price:</span>
                <span className="font-medium text-gray-800">${gameDetails.basePrice || 0}</span>
                
                {gameDetails.addDefenses && (
                  <>
                    <span className="text-gray-600">🛡️ Defenses:</span>
                    <span className="font-medium text-amber-600">+$35</span>
                  </>
                )}
                
                {gameDetails.addAutomation && (
                  <>
                    <span className="text-gray-600">🤖 Automation:</span>
                    <span className="font-medium text-amber-600">+$45</span>
                  </>
                )}
                
                {gameDetails.addResources && (
                  <>
                    <span className="text-gray-600">💰 Resource Pack:</span>
                    <span className="font-medium text-amber-600">+$20</span>
                  </>
                )}
                
                {gameDetails.addClassUnlock && (
                  <>
                    <span className="text-gray-600">🎮 Class Unlock:</span>
                    <span className="font-medium text-amber-600">+$35</span>
                  </>
                )}
                
                {gameDetails.selectedClass && (
                  <>
                    <span className="text-gray-600">Selected Class:</span>
                    <span className="font-medium text-gray-800">{gameDetails.selectedClass}</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* LEVELING SERVICE */}
          {isLevelingService() && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">📈</span>
                Leveling Details
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <span className="text-gray-600">Current Level:</span>
                <span className="font-medium text-gray-800">{gameDetails.currentLevel || 'N/A'}</span>
                
                <span className="text-gray-600">Desired Level:</span>
                <span className="font-medium text-gray-800">{gameDetails.desiredLevel || 'N/A'}</span>
                
                <span className="text-gray-600">Levels to Gain:</span>
                <span className="font-medium text-blue-700">
                  {(gameDetails.desiredLevel || 0) - (gameDetails.currentLevel || 0)} levels
                </span>
                
                {gameDetails.buildAddon && (
                  <>
                    <span className="text-gray-600">Build Add-on:</span>
                    <span className="font-medium text-purple-600 capitalize">{gameDetails.buildTier}</span>
                  </>
                )}
                
                {gameDetails.addClassUnlock && (
                  <>
                    <span className="text-gray-600">Class Unlock:</span>
                    <span className="font-medium text-amber-600">+$35</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* BUILD DETAILS */}
          {isBuild() && (
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                <span className="mr-2">⚙️</span>
                Build Details
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Build Type:</span>
                  <span className="text-sm font-medium text-purple-800 bg-purple-100 px-2 py-1 rounded-full">
                    {gameDetails.buildName || gameDetails.finalBuild || formatServiceType(gameDetails.serviceType)}
                  </span>
                </div>
                
                {gameDetails.includeTormented && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Upgrade:</span>
                    <span className="text-sm font-medium text-amber-800 bg-amber-100 px-2 py-1 rounded-full">
                      ✨ Tormented Included
                    </span>
                  </div>
                )}
                
                {gameDetails.selectedUpgrades && gameDetails.selectedUpgrades.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Selected Upgrades:</p>
                    <div className="flex flex-wrap gap-1">
                      {gameDetails.selectedUpgrades.map((upgrade, idx) => (
                        <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {upgrade}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* BUNDLE DETAILS */}
          {isBundle() && (
            <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4">
              <h3 className="font-semibold text-indigo-900 mb-3 flex items-center">
                <span className="mr-2">📦</span>
                Bundle Details
              </h3>
              <p className="text-sm text-gray-700">
                Complete package with all included services.
              </p>
            </div>
          )}
          
          {/* SPECIAL INSTRUCTIONS (REQUIRED) */}
          {buildSpecs && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <span className="mr-2">📝</span>
                Special Instructions
                <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Required</span>
              </h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border border-blue-100">
                {buildSpecs}
              </p>
            </div>
          )}
          
          {/* ADDITIONAL NOTES */}
          {customerNotes && customerNotes !== buildSpecs && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">📋</span>
                Additional Notes
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-gray-100">
                {customerNotes}
              </p>
            </div>
          )}
          
          {/* WARNING SI FALTA SPECS EN DUNE BASE */}
          {isDuneBaseConstruction() && !buildSpecs && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-4">
              <p className="text-sm text-red-700 flex items-center">
                <span className="mr-2">⚠️</span>
                Missing required specifications (class, location, preferences)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // BADGES Y FORMATEADORES
  // ============================================

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', label: 'Pendiente' },
      paid: { color: 'bg-blue-100 text-blue-800', icon: '💰', label: 'Pagado' },
      in_progress: { color: 'bg-indigo-100 text-indigo-800', icon: '🔄', label: 'En Progreso' },
      completed: { color: 'bg-green-100 text-green-800', icon: '✅', label: 'Completado' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Cancelado' },
      awaiting_payment_confirmation: { color: 'bg-orange-100 text-orange-800', icon: '⏰', label: 'Esperando Confirmación' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const paymentConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', label: 'Pendiente' },
      pending_verification: { color: 'bg-orange-100 text-orange-800', icon: '🔍', label: 'Por Verificar' },
      paid: { color: 'bg-green-100 text-green-800', icon: '✅', label: 'Pagado' },
      completed: { color: 'bg-green-100 text-green-800', icon: '💰', label: 'Confirmado' },
      failed: { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Fallido' },
      no_payment: { color: 'bg-gray-100 text-gray-600', icon: '📝', label: 'Sin Pago' }
    };
    const config = paymentConfig[status] || paymentConfig.no_payment;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    const methodMap = {
      'paypal': 'PayPal', 'binance': 'Binance Pay', 'stripe': 'Stripe',
      'manual': 'Manual', 'nowpayments': 'NOWPayments', 'credit_card': 'Tarjeta de Crédito',
      'wallet': 'Monedero', 'transfer': 'Transferencia', 'cash': 'Efectivo'
    };
    return methodMap[method.toLowerCase()] || method.toUpperCase();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles de la orden...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error || 'Orden no encontrada'}</p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Volver a Órdenes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Orden #{order.orderNumber || order._id?.slice(-8)}
          </h1>
          {getStatusBadge(order.status)}
          {getPaymentBadge(order.paymentStatus)}
        </div>
        <button
          onClick={fetchOrderDetails}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          title="Actualizar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Servicio */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">🎮</span>
              Detalles del Servicio
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Servicio</p>
                <p className="font-medium">{order.service?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Juego</p>
                <p className="font-medium">{order.service?.game || order.gameDetails?.game || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-medium capitalize">{formatServiceType(order.service?.serviceType) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Servidor/Región</p>
                <p className="font-medium">{order.gameDetails?.server || order.gameDetails?.region || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* DETALLES ESPECÍFICOS DEL SERVICIO */}
          {renderServiceSpecificDetails()}

          {/* Datos de la cuenta */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">🔐</span>
              Datos de Acceso
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Usuario del Juego</p>
                <p className="font-mono bg-gray-50 p-2 rounded mt-1">{order.gameDetails?.gameUsername || order.gameDetails?.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contraseña</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-50 p-2 rounded flex-1 font-mono">
                    {showPassword ? order.gameDetails?.password : '••••••••'}
                  </code>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nombre de cuenta</p>
                <p className="font-mono bg-gray-50 p-2 rounded mt-1">{order.gameDetails?.accountName || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Notas internas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">📝</span>
              Notas Internas
            </h2>
            
            <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
              {(order.notes || []).map((note, index) => (
                <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span className="font-medium">{note.author || 'Admin'}</span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                  <p className="text-gray-800">{note.content}</p>
                </div>
              ))}
              {(order.notes || []).length === 0 && (
                <p className="text-gray-500 text-center py-4">No hay notas internas</p>
              )}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Agregar nota interna..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                disabled={!note.trim() || updating}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Gestión de Estado */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Gestión de Estado</h2>
            <select
              onChange={(e) => handleStatusChange(e.target.value)}
              value={order.status}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={updating}
            >
              <option value="pending">⏳ Pendiente</option>
              <option value="paid">💰 Pagado</option>
              <option value="in_progress">🔄 En Progreso</option>
              <option value="completed">✅ Completado</option>
              <option value="cancelled">❌ Cancelado</option>
              <option value="awaiting_payment_confirmation">⏰ Esperando Confirmación</option>
            </select>
          </div>

          {/* Cliente */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">👤 Cliente</h2>
            <div className="space-y-2">
              <p><span className="text-gray-500">Usuario:</span> {order.user?.username || 'N/A'}</p>
              <p><span className="text-gray-500">Email:</span> {order.user?.email || 'N/A'}</p>
              <p><span className="text-gray-500">ID:</span> <code className="text-xs">{order.user?._id || 'N/A'}</code></p>
            </div>
          </div>

          {/* Pago */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">💳 Información de Pago</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Monto:</span>
                <span className="font-bold text-green-600 text-xl">${order.totalPrice || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Método:</span>
                <span className="font-medium">{formatPaymentMethod(order.paymentMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                {getPaymentBadge(order.paymentStatus)}
              </div>
              
              {order.paymentReference && (
                <div>
                  <span className="text-gray-500">Referencia:</span>
                  <code className="block bg-gray-50 p-2 rounded mt-1 text-xs">{order.paymentReference}</code>
                </div>
              )}
              
              {order.paidAt && (
                <div className="text-sm text-gray-500">
                  Pagado: {formatDate(order.paidAt)}
                </div>
              )}

              {/* Comprobante de pago */}
              {paymentProof && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <span className="mr-1">📸</span>
                    Comprobante de Pago:
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <img 
                      src={paymentProof.imageUrl} 
                      alt="Comprobante de pago" 
                      className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                      onClick={() => setShowProofModal(true)}
                    />
                    
                    {paymentProof.transactionHash && (
                      <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                        TX: {paymentProof.transactionHash}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-2">
                      Subido: {formatDate(paymentProof.createdAt)}
                    </p>
                    
                    <p className="text-xs mt-2">
                      Estado: 
                      <span className={`ml-1 font-medium ${
                        paymentProof.status === 'approved' ? 'text-green-600' :
                        paymentProof.status === 'rejected' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {paymentProof.status === 'approved' ? '✅ Aprobado' :
                         paymentProof.status === 'rejected' ? '❌ Rechazado' :
                         '⏳ Pendiente'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Botones de aprobar/rechazar pago */}
              {order.paymentStatus === 'pending_verification' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Acciones de Pago:</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleApprovePayment}
                      disabled={verifyingPayment}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium"
                    >
                      {verifyingPayment ? 'Procesando...' : '✅ Aprobar'}
                    </button>
                    <button
                      onClick={handleRejectPayment}
                      disabled={verifyingPayment}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium"
                    >
                      {verifyingPayment ? 'Procesando...' : '❌ Rechazar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Metadata</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Creada:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.startedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Iniciada:</span>
                  <span>{formatDate(order.startedAt)}</span>
                </div>
              )}
              {order.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completada:</span>
                  <span>{formatDate(order.completedAt)}</span>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-gray-500">ID: <code className="text-xs">{order._id}</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para ver comprobante en grande */}
      {showProofModal && paymentProof && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProofModal(false)}
        >
          <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img 
              src={paymentProof.imageUrl} 
              alt="Comprobante de pago" 
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <button
              onClick={() => setShowProofModal(false)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;