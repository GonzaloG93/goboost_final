// src/components/CustomerSocketHandler.jsx
import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const CustomerSocketHandler = () => {
  const { user } = useAuth();
  const { socket, isConnected, subscribeOrders } = useSocket();

  useEffect(() => {
    if (!socket || !user || !isConnected) return;

    console.log('🔔 Inicializando listeners para customer:', user._id);
    
    // Suscribirse a las órdenes del usuario
    subscribeOrders();

    const handleOrderStatusUpdate = (data) => {
      console.log('🔄 Actualización de orden recibida:', data);
      
      // Emitir evento personalizado para que otros componentes lo capturen
      const event = new CustomEvent('customerOrderUpdated', {
        detail: data
      });
      window.dispatchEvent(event);
    };

    const handleNewOrder = (data) => {
      console.log('🆕 Nueva orden creada:', data);
      
      const event = new CustomEvent('customerNewOrder', {
        detail: data
      });
      window.dispatchEvent(event);
    };

    socket.on('order_updated', handleOrderStatusUpdate);
    socket.on('order_created', handleNewOrder);

    return () => {
      socket.off('order_updated', handleOrderStatusUpdate);
      socket.off('order_created', handleNewOrder);
    };
  }, [socket, user, isConnected, subscribeOrders]);

  return null; // Componente invisible
};

export default CustomerSocketHandler;