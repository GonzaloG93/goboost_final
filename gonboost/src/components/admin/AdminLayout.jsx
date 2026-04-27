// src/components/admin/AdminLayout.jsx - VERSIÓN SIN DOBLE VERIFICACIÓN
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊', description: 'Resumen general' },
    { path: '/admin/orders', label: 'Órdenes', icon: '📦', description: 'Gestión de pedidos' },
    { path: '/admin/users', label: 'Usuarios', icon: '👥', description: 'Administrar usuarios' },
    { path: '/admin/services', label: 'Servicios', icon: '🎮', description: 'Catálogo de servicios' },
    { path: '/admin/tickets', label: 'Soporte', icon: '🎫', description: 'Tickets de ayuda' },
  ];

  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  // La protección ya la hace AdminRoute, aquí solo mostramos UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del admin */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-gray-900 text-white shadow-lg h-14 md:h-16">
        <div className="flex justify-between items-center h-full px-3 md:px-6">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
            <div>
              <h1 className="text-base md:text-xl font-bold">Admin Panel</h1>
              <p className="text-gray-400 text-xs md:text-sm hidden sm:block">Gonboost Unlimited</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs md:text-sm font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-gray-400">Administrador</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-2 md:px-4 py-1.5 md:py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
            >
              <span className="mr-1 md:mr-2">🚪</span>
              <span className="hidden xs:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Overlay para mobile */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed top-14 md:top-16 left-0 h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] z-40 bg-gray-800 text-white transition-all duration-300 overflow-y-auto ${
        sidebarOpen ? 'w-64' : 'w-0 md:w-20'
      } ${isMobile && !sidebarOpen ? 'hidden' : ''}`}>
        {sidebarOpen && (
          <div className="h-full flex flex-col">
            <nav className="flex-1 py-4 px-3">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={`flex items-center p-3 rounded-lg mb-2 transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
                    title={!sidebarOpen && !isMobile ? item.label : ''}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {(sidebarOpen || isMobile) && (
                      <div className="ml-3 flex-1">
                        <span className="font-medium block">{item.label}</span>
                        <p className="text-xs text-gray-300 mt-1 hidden md:block">{item.description}</p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-700 hidden md:block">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.username}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className={`pt-14 md:pt-16 transition-all duration-300 ${
        sidebarOpen ? 'md:ml-64' : 'md:ml-20'
      } ${isMobile ? 'ml-0' : ''}`}>
        <div className="p-3 md:p-6">
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              {menuItems.find(item => item.path === location.pathname)?.description || 'Panel de administración'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 overflow-x-auto">
            {children}
          </div>

          <footer className="mt-4 md:mt-6 py-3 md:py-4 border-t border-gray-200 text-center text-gray-500 text-xs md:text-sm">
            <p>© {new Date().getFullYear()} Gonboost Unlimited - Admin Panel v1.0</p>
            <p className="mt-1 hidden sm:block">Sistema de gestión de servicios de boosting</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;