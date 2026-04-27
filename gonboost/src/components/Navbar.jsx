// src/components/Navbar.jsx - VERSIÓN FINAL CORREGIDA
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import LanguageSelector from './LanguageSelector';
import { DEFAULT_LANGUAGE } from '../i18n';

const Navbar = ({ theme = 'light' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation(); // ✅ Obtenemos i18n directamente
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✅ Idioma actual desde i18n (no desde useParams)
  const currentLang = i18n.language || DEFAULT_LANGUAGE;
  const isDarkTheme = theme === 'dark';

  // ✅ Función para añadir prefijo de idioma a las rutas
  const localizePath = (path) => {
    if (!path.startsWith('/')) path = '/' + path;
    return currentLang === 'en' ? path : `/${currentLang}${path}`;
  };

  // Ocultar navbar en rutas de admin
  if (location.pathname.startsWith('/admin')) return null;

  const handleLogout = () => {
    logout();
    navigate(localizePath('/'));
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${
      isDarkTheme 
        ? 'bg-white shadow-md border-b border-gray-200' 
        : 'bg-transparent backdrop-blur-md border-b border-white/20'
    }`}>
      <div className="container mx-auto px-4">
        {/* Desktop */}
        <div className="hidden lg:grid grid-cols-3 items-center py-4">
          <div className="flex justify-start items-center">
            <Link to={localizePath('/')} className="flex items-center group" onClick={closeAllMenus}>
              <img src="/images/logo-1.png" alt="Gonboost" className="h-16 w-auto group-hover:opacity-90 transition-opacity" />
            </Link>
          </div>
          <div className="flex justify-center items-center space-x-8">
            <Link to={localizePath('/')} className={`${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-white/95 hover:text-white hover:bg-white/10'} font-medium transition-colors duration-200 px-4 py-2 rounded-lg`} onClick={closeAllMenus}>Home</Link>
            <Link to={localizePath('/services')} className={`${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-white/95 hover:text-white hover:bg-white/10'} font-medium transition-colors duration-200 px-4 py-2 rounded-lg`} onClick={closeAllMenus}>Services</Link>
            {user && user.role !== 'admin' && <Link to={localizePath('/my-orders')} className={`${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-white/95 hover:text-white hover:bg-white/10'} font-medium transition-colors duration-200 px-4 py-2 rounded-lg`} onClick={closeAllMenus}>My Orders</Link>}
            <Link to={localizePath('/support')} className={`${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-white/95 hover:text-white hover:bg-white/10'} font-medium transition-colors duration-200 px-4 py-2 rounded-lg`} onClick={closeAllMenus}>Support</Link>
          </div>
          <div className="flex justify-end items-center space-x-3">
            <LanguageSelector theme={theme} />
            {user ? (
              <>
                <NotificationBell theme={theme} />
                <div className="relative">
                  <button onClick={toggleMenu} className={`flex items-center space-x-3 ${isDarkTheme ? 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800' : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white/95'} px-4 py-2 rounded-lg transition-all duration-200`}>
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-md"><span className="text-white text-sm font-medium">{user.username.charAt(0).toUpperCase()}</span></div>
                    <span className={`font-medium ${isDarkTheme ? 'text-gray-800' : 'text-white/95'}`}>{user.username}</span>
                    <svg className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''} ${isDarkTheme ? 'text-gray-600' : 'text-white/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 z-50 py-2">
                      <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">Account</div>
                      {user.role !== 'admin' && <Link to={localizePath('/dashboard')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mx-2 rounded" onClick={closeAllMenus}>📊 Dashboard</Link>}
                      {user.role === 'booster' && <Link to={localizePath('/booster/dashboard')} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mx-2 rounded" onClick={closeAllMenus}>⚡ Booster Panel</Link>}
                      {user.role === 'admin' && <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mx-2 rounded" onClick={closeAllMenus}>🔧 Admin Panel</Link>}
                      <hr className="my-2 border-gray-200" />
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors mx-2 rounded">🚪 Sign Out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to={localizePath('/login')} className={`${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-white/95 hover:text-white hover:bg-white/10'} font-medium transition-colors duration-200 px-4 py-2 rounded-lg`} onClick={closeAllMenus}>Sign In</Link>
                <Link to={localizePath('/register')} className="relative overflow-hidden group bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 hover:from-yellow-600 hover:via-orange-600 hover:to-yellow-600 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105" onClick={closeAllMenus}>Register Now</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden flex justify-between items-center py-3">
          <Link to={localizePath('/')} className="flex items-center space-x-2" onClick={closeAllMenus}>
            <img src="/images/logo-1.png" alt="Gonboost" className="h-10 w-auto" />
          </Link>
          <button onClick={toggleMobileMenu} className={`p-2 rounded-lg ${isDarkTheme ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
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
          <div className={`lg:hidden ${isDarkTheme ? 'bg-white shadow-lg border border-gray-200' : 'bg-slate-800/95 backdrop-blur-md border border-slate-700/50'} rounded-lg mt-2 mb-4 py-4 relative z-50`}>
            <div className="space-y-2 px-4">
              <Link to={localizePath('/')} className={`block font-medium py-3 px-4 rounded-lg ${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-white/95 hover:text-white hover:bg-white/10'}`} onClick={closeAllMenus}>Home</Link>
              <Link to={localizePath('/services')} className={`block font-medium py-3 px-4 rounded-lg ${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-white/95 hover:text-white hover:bg-white/10'}`} onClick={closeAllMenus}>Services</Link>
              {user && user.role !== 'admin' && <Link to={localizePath('/my-orders')} className={`block font-medium py-3 px-4 rounded-lg ${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-white/95 hover:text-white hover:bg-white/10'}`} onClick={closeAllMenus}>My Orders</Link>}
              <Link to={localizePath('/support')} className={`block font-medium py-3 px-4 rounded-lg ${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-white/95 hover:text-white hover:bg-white/10'}`} onClick={closeAllMenus}>Support</Link>
            </div>
            <div className={`border-t ${isDarkTheme ? 'border-gray-200' : 'border-slate-700/50'} mt-4 pt-4 px-4`}>
              {user ? (
                <>
                  <div className={`flex items-center space-x-3 mb-4 p-3 rounded-lg ${isDarkTheme ? 'bg-gray-50' : 'bg-white/5'}`}>
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-medium">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className={isDarkTheme ? "text-gray-900 font-medium" : "text-white font-medium"}>{user.username}</div>
                      <div className={isDarkTheme ? "text-gray-500 text-sm" : "text-slate-400 text-sm"}>{user.role}</div>
                    </div>
                  </div>
                  <div className="flex justify-center mb-4"><LanguageSelector theme={theme} /></div>
                  <div className="flex justify-center mb-4"><NotificationBell theme={theme} /></div>
                  <div className="space-y-2">
                    {user.role !== 'admin' && <Link to={localizePath('/dashboard')} className={`block py-2 px-4 rounded ${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`} onClick={closeAllMenus}>📊 Dashboard</Link>}
                    {user.role === 'booster' && <Link to={localizePath('/booster/dashboard')} className={`block py-2 px-4 rounded ${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`} onClick={closeAllMenus}>⚡ Booster Panel</Link>}
                    {user.role === 'admin' && <Link to="/admin/dashboard" className={`block py-2 px-4 rounded ${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'}`} onClick={closeAllMenus}>🔧 Admin Panel</Link>}
                    <hr className={`my-2 ${isDarkTheme ? 'border-gray-200' : 'border-slate-700/50'}`} />
                    <button onClick={handleLogout} className={`block w-full text-left py-2 px-4 rounded ${isDarkTheme ? 'text-red-600 hover:bg-red-50 hover:text-red-700' : 'text-red-400 hover:bg-red-500/10 hover:text-red-300'}`}>🚪 Sign Out</button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center mb-2"><LanguageSelector theme={theme} /></div>
                  <Link to={localizePath('/login')} className={`block text-center font-medium py-3 px-4 rounded-lg border ${isDarkTheme ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300' : 'text-white/95 hover:text-white hover:bg-white/10 border-white/20'}`} onClick={closeAllMenus}>Sign In</Link>
                  <Link to={localizePath('/register')} className="relative overflow-hidden group block text-center bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 hover:from-yellow-600 hover:via-orange-600 hover:to-yellow-600 text-white py-3 px-4 rounded-lg font-bold transition-all duration-300 shadow-lg" onClick={closeAllMenus}>GET BOOSTED NOW</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {isMenuOpen && <div className="fixed inset-0 z-40" onClick={closeAllMenus}></div>}
    </nav>
  );
};

export default Navbar;