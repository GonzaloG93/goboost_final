// src/components/NotificationBell.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axiosConfig';

const NotificationBell = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Refs para control
  const mountedRef = useRef(true);
  const fetchTimeoutRef = useRef(null);
  const hasFetchedRef = useRef(false);

  const fetchNotifications = async () => {
    // Evitar si no hay usuario o ya se está fetching
    if (!user || !token || loading || hasFetchedRef.current) {
      return;
    }

    try {
      setLoading(true);
      hasFetchedRef.current = true;
      
      const response = await axios.get('/notifications', {
        params: {
          limit: 5,
          unreadOnly: true
        },
        timeout: 5000 // 5 segundos timeout
      });
      
      if (!mountedRef.current) return;
      
      if (response.data.success) {
        const notifs = response.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.length);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      
      // Solo mostrar error si no es cancelación
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        
        // Permitir fetch nuevamente después de 30 segundos
        setTimeout(() => {
          hasFetchedRef.current = false;
        }, 30000);
      }
    }
  };

  // CRÍTICO: useEffect con dependencias controladas
  useEffect(() => {
    mountedRef.current = true;
    
    // Solo fetch si hay usuario autenticado
    if (user && token) {
      // Usar timeout para evitar múltiples fetches inmediatos
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      fetchTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          fetchNotifications();
        }
      }, 500); // Pequeño delay para estabilizar
    } else {
      // Si no hay usuario, limpiar notificaciones
      setNotifications([]);
      setUnreadCount(0);
      hasFetchedRef.current = false;
    }
    
    return () => {
      mountedRef.current = false;
      
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Resetear flag al desmontar
      hasFetchedRef.current = false;
    };
  }, [user, token]); // Solo dependencias que realmente cambian

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/notifications/${notificationId}/read`);
      
      if (mountedRef.current) {
        // Actualizar estado local
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('/notifications/mark-all-read');
      
      if (mountedRef.current) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-700 hover:bg-gray-750 ${
                    !notification.read ? 'bg-gray-750' : ''
                  }`}
                >
                  <div className="flex justify-between">
                    <p className="text-white">{notification.message}</p>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 border-t border-gray-700">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-gray-400 hover:text-white text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;