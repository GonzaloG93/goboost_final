// src/pages/OrderDetails.jsx - VERSIÓN MEJORADA (SEGURA Y OPTIMIZADA)

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { toast } from "react-toastify";
import { formatServiceType } from "../config/gamesConfig";

const OrderDetails = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [passwordTimer, setPasswordTimer] = useState(null);
  
  // ✅ Ref para evitar llamadas duplicadas
  const fetchingRef = useRef(false);
  // ✅ Ref para almacenar contraseña temporalmente (más seguro que useState)
  const passwordRef = useRef(null);

  // ✅ Helper para verificar propiedad de la orden
  const isOrderOwner = useCallback((order, user) => {
    if (!order || !user) return false;
    const orderUserId = order.user?._id || order.user;
    const currentUserId = user._id || user;
    return orderUserId === currentUserId;
  }, []);

  // ✅ Normalizar datos de orden para estructura consistente
  const normalizeOrderData = useCallback((rawOrder) => {
    if (!rawOrder) return null;
    
    return {
      ...rawOrder,
      displayData: {
        game: rawOrder.service?.game || rawOrder.gameDetails?.game || "N/A",
        serviceName: rawOrder.service?.name || rawOrder.gameDetails?.buildName || 
                     formatServiceType(rawOrder.gameDetails?.serviceType) || "Servicio",
        serviceType: rawOrder.service?.serviceType || rawOrder.gameDetails?.serviceType,
        server: rawOrder.gameDetails?.server || rawOrder.gameDetails?.region || "N/A",
        username: rawOrder.gameDetails?.gameUsername || rawOrder.gameDetails?.username || "N/A",
        // ⚠️ La contraseña NO se incluye aquí por seguridad
      }
    };
  }, []);

  // ✅ Función para obtener la contraseña de forma segura (solo cuando el usuario la solicita)
  const fetchPasswordSecurely = useCallback(async () => {
    try {
      const response = await axios.post(`/orders/${orderId}/request-password`, {}, {
        headers: { 'X-Temporary-Access': 'true' }
      });
      
      if (response.data.success && response.data.password) {
        // Almacenar temporalmente en ref (no en state)
        passwordRef.current = response.data.password;
        setShowPassword(true);
        
        // Auto-ocultar después de 30 segundos
        const timer = setTimeout(() => {
          passwordRef.current = null;
          setShowPassword(false);
          toast.info("🔒 La contraseña se ha ocultado automáticamente por seguridad");
        }, 30000);
        
        setPasswordTimer(timer);
        
        toast.success("🔐 Contraseña revelada temporalmente (se ocultará en 30 segundos)");
      } else {
        throw new Error("No se pudo obtener la contraseña");
      }
    } catch (error) {
      console.error("Error fetching password:", error);
      toast.error("No se pudo obtener la contraseña. Por favor, contacta a soporte.");
    }
  }, [orderId]);

  // ✅ Limpiar timer de contraseña
  useEffect(() => {
    return () => {
      if (passwordTimer) clearTimeout(passwordTimer);
      passwordRef.current = null;
    };
  }, [passwordTimer]);

  // ✅ Función para obtener detalles de la orden
  const fetchOrderDetails = useCallback(async () => {
    // Evitar fetching duplicado
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      const endpoint = `/orders/${orderId}`;
      const response = await axios.get(endpoint);

      if (response.data.success) {
        const orderData = response.data.order || response.data.data;
        const isAdmin = user?.role === "admin";

        // ✅ Verificar permisos mejorada
        if (!isAdmin && !isOrderOwner(orderData, user)) {
          setError("No tienes permiso para ver esta orden");
          toast.error("No tienes permiso para ver esta orden");
          return;
        }

        // ✅ Normalizar datos
        const normalizedOrder = normalizeOrderData(orderData);
        setOrder(normalizedOrder);
      } else {
        throw new Error(response.data.message || "Error cargando orden");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      const errorMsg = error.response?.data?.message || error.message;
      setError(errorMsg);

      if (error.response?.status === 403) {
        toast.error("No tienes permisos para ver esta orden");
      } else if (error.response?.status === 404) {
        toast.error("Orden no encontrada");
      } else {
        toast.error(`Error: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [orderId, user, isOrderOwner, normalizeOrderData]);

  // ✅ Efecto principal (optimizado)
  useEffect(() => {
    fetchOrderDetails();

    if (socket && orderId) {
      socket.emit("join_order", { orderId });

      const handleOrderUpdate = (data) => {
        if (!data) return;

        const incomingOrderId = data.orderId || data.order?._id || data._id;
        
        // ✅ Usar normalized order para comparación
        if (order?._id && incomingOrderId !== order._id) return;

        // Formato: { orderId, newStatus }
        if (data.newStatus) {
          setOrder((prev) => prev ? { ...prev, status: data.newStatus } : prev);
          toast.info(`📋 Tu orden ha sido actualizada a: ${getStatusLabel(data.newStatus)}`);
          return;
        }

        // Formato: { orderId, updates: {...} }
        if (data.updates) {
          const updatedOrder = normalizeOrderData({ ...order, ...data.updates });
          setOrder((prev) => prev ? updatedOrder : prev);
          toast.info(`📋 Tu orden ha sido actualizada`);
          return;
        }

        // Formato: { orderId, status }
        if (data.status) {
          setOrder((prev) => prev ? { ...prev, status: data.status } : prev);
          toast.info(`📋 Tu orden ha sido actualizada a: ${getStatusLabel(data.status)}`);
        }
      };

      socket.on("order_updated", handleOrderUpdate);

      return () => {
        socket.emit("leave_order", { orderId });
        socket.off("order_updated", handleOrderUpdate);
      };
    }
  }, [orderId, socket, fetchOrderDetails, normalizeOrderData, order?._id]);

  // ✅ Cancelar orden (sin llamada redundante)
  const handleCancelOrder = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer.")) {
      return;
    }

    setCancelLoading(true);
    try {
      const response = await axios.put(`/orders/${orderId}/cancel`);

      if (response.data.success) {
        toast.success("✅ Orden cancelada exitosamente");
        // ✅ Solo actualizar estado local, no recargar toda la orden
        setOrder((prev) => ({ ...prev, status: "cancelled" }));
      } else {
        throw new Error(response.data.message || "Error cancelando orden");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(error.response?.data?.message || "Error cancelando orden");
    } finally {
      setCancelLoading(false);
    }
  };

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      paid: "Pagado",
      in_progress: "En Progreso",
      completed: "Completado",
      cancelled: "Cancelado",
      awaiting_payment_confirmation: "Esperando Confirmación de Pago",
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "⏳", label: "Pendiente" },
      paid: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: "💰", label: "Pagado" },
      in_progress: { color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: "🔄", label: "En Progreso" },
      completed: { color: "bg-green-100 text-green-800 border-green-200", icon: "✅", label: "Completado" },
      cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: "❌", label: "Cancelado" },
      awaiting_payment_confirmation: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: "⏰",
        label: "Esperando Confirmación",
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const paymentConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳", label: "Pendiente" },
      pending_verification: { color: "bg-orange-100 text-orange-800", icon: "🔍", label: "Por Verificar" },
      paid: { color: "bg-green-100 text-green-800", icon: "✅", label: "Pagado" },
      completed: { color: "bg-green-100 text-green-800", icon: "💰", label: "Confirmado" },
      failed: { color: "bg-red-100 text-red-800", icon: "❌", label: "Fallido" },
      refunded: { color: "bg-purple-100 text-purple-800", icon: "↩️", label: "Reembolsado" },
      no_payment: { color: "bg-gray-100 text-gray-600", icon: "📝", label: "Sin Pago" },
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
    if (!method) return "N/A";
    const methodMap = {
      paypal: "PayPal",
      binance: "Binance Pay",
      stripe: "Stripe",
      manual: "Manual",
      nowpayments: "NOWPayments",
      credit_card: "Tarjeta de Crédito",
      wallet: "Monedero",
      transfer: "Transferencia",
      cash: "Efectivo",
    };
    return methodMap[method.toLowerCase()] || method.toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canCancel = () => {
    return order?.status === "pending" || order?.status === "awaiting_payment_confirmation";
  };

  const getProgressSteps = () => {
    const steps = [
      { status: "pending", label: "Orden Creada", icon: "📝" },
      { status: "paid", label: "Pago Confirmado", icon: "💰" },
      { status: "in_progress", label: "En Progreso", icon: "🔄" },
      { status: "completed", label: "Completado", icon: "✅" },
    ];

    const currentStatus = order?.status;
    const statusOrder = ["pending", "paid", "in_progress", "completed"];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex && currentStatus !== "cancelled",
      active: index === currentIndex,
      cancelled: currentStatus === "cancelled",
    }));
  };

  // ============================================
  // RENDERIZADO
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando detalles de tu orden...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || "Orden no encontrada"}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              <span className="mr-2">←</span>
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <span className="mr-2">←</span>
            Volver al Dashboard
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Orden #{order.orderNumber || order._id?.slice(-8)}
                </h1>
                {getStatusBadge(order.status)}
              </div>

              {canCancel() && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelLoading}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {cancelLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">❌</span>
                      Cancelar Orden
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {order.status !== "cancelled" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Progreso de tu Orden</h2>
            <div className="flex flex-wrap justify-between">
              {getProgressSteps().map((step, index) => (
                <div key={index} className="flex-1 min-w-[120px] mb-4">
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                        ${step.completed ? "bg-green-500 text-white" : ""}
                        ${step.active ? "bg-blue-500 text-white" : ""}
                        ${!step.completed && !step.active ? "bg-gray-200 text-gray-500" : ""}
                      `}
                    >
                      {step.completed ? "✓" : step.icon}
                    </div>
                    {index < getProgressSteps().length - 1 && (
                      <div className={`flex-1 h-1 mx-2 ${step.completed ? "bg-green-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <p className={`text-sm mt-2 font-medium ${step.active ? "text-blue-600" : "text-gray-600"}`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>

            {order.status === "cancelled" && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 flex items-center">
                  <span className="mr-2">❌</span>
                  Esta orden ha sido cancelada
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Detalles del servicio */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información del Servicio */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🎮</span>
                Detalles del Servicio
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Servicio</p>
                  <p className="font-medium text-gray-900">{order.displayData?.serviceName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Juego</p>
                  <p className="font-medium text-gray-900">{order.displayData?.game || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {formatServiceType(order.displayData?.serviceType) || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Servidor/Región</p>
                  <p className="font-medium text-gray-900">{order.displayData?.server || "N/A"}</p>
                </div>
              </div>

              {/* Detalles específicos del servicio */}
              {order.gameDetails?.buildSpecifications && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-2">📝 Especificaciones:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.gameDetails.buildSpecifications}</p>
                </div>
              )}

              {order.gameDetails?.customerNotes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">📋 Notas adicionales:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.gameDetails.customerNotes}</p>
                </div>
              )}
            </div>

            {/* Datos de la cuenta - VERSIÓN MEJORADA Y SEGURA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">🔐</span>
                Datos de Acceso
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Usuario del Juego</p>
                  <p className="font-mono bg-gray-50 p-3 rounded-lg mt-1 text-gray-900">
                    {order.displayData?.username || "N/A"}
                  </p>
                </div>
                
                {/* ✅ Sección de contraseña segura */}
                <div>
                  <p className="text-sm text-gray-500">Contraseña</p>
                  <div className="mt-1">
                    {!showPassword ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-600">••••••••</span>
                        </div>
                        <button
                          onClick={fetchPasswordSecurely}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                          title="Revelar contraseña por 30 segundos"
                        >
                          <span>🔓</span>
                          <span>Revelar</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                          <code className="font-mono text-gray-900">{passwordRef.current || "Cargando..."}</code>
                        </div>
                        <button
                          onClick={() => {
                            passwordRef.current = null;
                            setShowPassword(false);
                            if (passwordTimer) clearTimeout(passwordTimer);
                            toast.info("🔒 Contraseña oculta");
                          }}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        >
                          🔒 Ocultar
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      ⚠️ Por seguridad, la contraseña solo se muestra temporalmente y se oculta automáticamente después de 30 segundos.
                    </p>
                  </div>
                </div>

                {order.gameDetails?.accountName && (
                  <div>
                    <p className="text-sm text-gray-500">Nombre de cuenta</p>
                    <p className="font-mono bg-gray-50 p-3 rounded-lg mt-1 text-gray-900">
                      {order.gameDetails.accountName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Línea de tiempo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📅</span>
                Línea de Tiempo
              </h2>

              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                    📝
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Orden Creada</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                {order.paidAt && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                      💰
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Pago Confirmado</p>
                      <p className="text-xs text-gray-500">{formatDate(order.paidAt)}</p>
                    </div>
                  </div>
                )}

                {order.startedAt && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3">
                      🔄
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Servicio Iniciado</p>
                      <p className="text-xs text-gray-500">{formatDate(order.startedAt)}</p>
                    </div>
                  </div>
                )}

                {order.completedAt && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                      ✅
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Servicio Completado</p>
                      <p className="text-xs text-gray-500">{formatDate(order.completedAt)}</p>
                    </div>
                  </div>
                )}

                {order.status === "cancelled" && order.cancelledAt && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 mr-3">
                      ❌
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Orden Cancelada</p>
                      <p className="text-xs text-gray-500">{formatDate(order.cancelledAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha - Información de pago */}
          <div className="space-y-6">
            {/* Resumen de Pago */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">💳</span>
                Resumen de Pago
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">${order.totalPrice || order.totalAmount || 0}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-800">Total</span>
                  <span className="text-xl font-bold text-green-600">${order.totalPrice || order.totalAmount || 0}</span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600">Método de Pago</span>
                    <span className="font-medium text-gray-900">{formatPaymentMethod(order.paymentMethod)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600">Estado del Pago</span>
                    {getPaymentBadge(order.paymentStatus)}
                  </div>
                </div>

                {order.paymentReference && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Referencia de Pago</p>
                    <code className="block bg-gray-50 p-2 rounded-lg text-xs break-all">{order.paymentReference}</code>
                  </div>
                )}

                {/* Mensaje si falta pago */}
                {order.paymentStatus === "pending" && order.status === "pending" && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 flex items-center">
                      <span className="mr-2">⏳</span>
                      Esperando confirmación de pago. Te notificaremos cuando se verifique.
                    </p>
                  </div>
                )}

                {order.paymentStatus === "pending_verification" && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800 flex items-center">
                      <span className="mr-2">🔍</span>
                      Tu pago está siendo verificado. Esto puede tomar unos minutos.
                    </p>
                  </div>
                )}

                {order.paymentStatus === "paid" && order.status === "paid" && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center">
                      <span className="mr-2">✅</span>
                      ¡Pago confirmado! Pronto comenzaremos con tu servicio.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📞</span>
                ¿Necesitas ayuda?
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                Si tienes alguna pregunta sobre tu orden, no dudes en contactarnos.
              </p>

              <Link
                to="/support"
                className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Contactar Soporte
              </Link>

              <p className="text-xs text-gray-500 text-center mt-4">
                Orden ID: <code className="text-xs">{order._id}</code>
              </p>
            </div>

            {/* Estado actual */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Estado Actual</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estado de Orden</span>
                  {getStatusBadge(order.status)}
                </div>

                {order.booster && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-gray-600">Booster Asignado</span>
                    <span className="font-medium text-gray-900">
                      {order.booster.username || order.booster.name || order.booster}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;