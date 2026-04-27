// frontend/components/CustomNavbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const CustomNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Funciones del Navbar
  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleMobileLinkClick = () => {
    closeAllMenus();
  };

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMenuOpen && !e.target.closest('.user-menu-container')) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Si no hay usuario, mostrar navbar simplificado
  if (!user) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo con ruta absoluta */}
            <Link to="/" className="flex items-center group" onClick={closeAllMenus}>
              <img 
                src="/images/logo-1.png" 
                alt="Gonboost" 
                className="h-16 w-auto group-hover:opacity-90 transition-opacity filter brightness-75 contrast-125"
              />
            </Link>

            {/* Botones de login/register */}
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-200 px-4 py-2 rounded-lg"
                onClick={closeAllMenus}
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg"
                onClick={closeAllMenus}
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Navbar completo para usuarios autenticados
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        {/* Desktop - 3 columnas */}
        <div className="hidden lg:grid grid-cols-3 items-center py-4">
          {/* Logo con ruta absoluta */}
          <div className="flex justify-start items-center">
            <Link to="/" className="flex items-center group" onClick={closeAllMenus}>
              <img 
                src="/images/logo-1.png" 
                alt="Gonboost" 
                className="h-16 w-auto group-hover:opacity-90 transition-opacity filter brightness-75 contrast-125"
              />
            </Link>
          </div>
          
          {/* Columna 2: Links de navegación (centro) */}
          <div className="flex justify-center items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-200 px-4 py-2 rounded-lg"
              onClick={closeAllMenus}
            >
              Inicio
            </Link>
            
            <Link 
              to="/services" 
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-200 px-4 py-2 rounded-lg"
              onClick={closeAllMenus}
            >
              Servicios
            </Link>
            
            {/* SOLO MOSTRAR "Mis Órdenes" si NO es admin */}
            {user && user.role !== 'admin' && (
              <Link 
                to="/my-orders" 
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-200 px-4 py-2 rounded-lg"
                onClick={closeAllMenus}
              >
                Mis Órdenes
              </Link>
            )}
            
            <Link 
              to="/support" 
              className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-200 px-4 py-2 rounded-lg bg-gray-100"
              onClick={closeAllMenus}
            >
              Soporte
            </Link>
          </div>

          {/* Columna 3: Notificaciones y usuario (derecha) */}
          <div className="flex justify-end items-center space-x-4">
            {/* Notifications */}
            <NotificationBell theme="dark" />
            
            {/* User Menu */}
            <div className="relative user-menu-container">
              <button 
                onClick={toggleMenu}
                className="flex items-center space-x-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-all duration-200"
                aria-haspopup="true" 
                aria-expanded={isMenuOpen}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-gray-800">
                  {user.username}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''} text-gray-600`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 z-50 py-2"
                >
                  <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
                    Cuenta
                  </div>
                  
                  {/* SOLO MOSTRAR Dashboard si NO es admin */}
                  {user.role !== 'admin' && (
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mx-2 rounded"
                      role="menuitem"
                      onClick={closeAllMenus}
                    >
                      📊 Dashboard
                    </Link>
                  )}
                  
                  {user.role === 'booster' && (
                    <Link
                      to="/booster/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mx-2 rounded"
                      role="menuitem"
                      onClick={closeAllMenus}
                    >
                      ⚡ Panel Booster
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mx-2 rounded"
                      role="menuitem"
                      onClick={closeAllMenus}
                    >
                      🔧 Panel Admin
                    </Link>
                  )}
                  
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors mx-2 rounded"
                    role="menuitem"
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile - Hamburguer menu */}
        <div className="lg:hidden flex justify-between items-center py-3">
          {/* Logo Mobile con ruta absoluta */}
          <Link to="/" className="flex items-center space-x-2" onClick={closeAllMenus}>
            <img 
              src="/images/logo-1.png" 
              alt="Gonboost" 
              className="h-10 w-auto group-hover:opacity-90 transition-opacity filter brightness-75 contrast-125"
            />
          </Link>

          {/* Hamburguer button */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white shadow-lg border border-gray-200 rounded-lg mt-2 mb-4 py-4 relative z-50">
            {/* Navigation Links */}
            <div className="space-y-2 px-4">
              <Link 
                to="/" 
                className="block font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={handleMobileLinkClick}
              >
                Inicio
              </Link>
              
              <Link 
                to="/services" 
                className="block font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={handleMobileLinkClick}
              >
                Servicios
              </Link>
              
              {/* SOLO MOSTRAR "Mis Órdenes" si NO es admin */}
              {user && user.role !== 'admin' && (
                <Link 
                  to="/my-orders" 
                  className="block font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={handleMobileLinkClick}
                >
                  Mis Órdenes
                </Link>
              )}
              
              <Link 
                to="/support" 
                className="block font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-gray-100"
                onClick={handleMobileLinkClick}
              >
                Soporte
              </Link>
            </div>

            {/* User Section */}
            <div className="border-t border-gray-200 mt-4 pt-4 px-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-4 p-3 rounded-lg bg-gray-50">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-gray-900 font-medium">
                    {user.username}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {user.role}
                  </div>
                </div>
              </div>

              {/* Notification Bell */}
              <div className="flex justify-center mb-4">
                <NotificationBell theme="dark" />
              </div>

              {/* User Menu */}
              <div className="space-y-2">
                {/* SOLO MOSTRAR Dashboard si NO es admin */}
                {user.role !== 'admin' && (
                  <Link
                    to="/dashboard"
                    className="block py-2 px-4 rounded transition-colors text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    onClick={handleMobileLinkClick}
                  >
                    📊 Dashboard
                  </Link>
                )}
                
                {user.role === 'booster' && (
                  <Link
                    to="/booster/dashboard"
                    className="block py-2 px-4 rounded transition-colors text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    onClick={handleMobileLinkClick}
                  >
                    ⚡ Panel Booster
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="block py-2 px-4 rounded transition-colors text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    onClick={handleMobileLinkClick}
                  >
                    🔧 Panel Admin
                  </Link>
                )}
                
                <hr className="my-2 border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 px-4 rounded transition-colors text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay SOLO para el dropdown de usuario */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={closeAllMenus}
            aria-hidden="true"
          ></div>
        )}
      </div>
    </nav>
  );
};

export default CustomNavbar;