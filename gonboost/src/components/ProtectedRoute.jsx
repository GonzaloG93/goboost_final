// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requireAdmin = false, allowGuest = false }) => {
  const { user, loading, isAuthenticated, isGuest } = useAuth();
  const location = useLocation();
  const { lang } = useParams();

  const currentLang = lang || 'en';
  const loginPath = currentLang === 'en' ? '/login' : `/${currentLang}/login`;

  // 1. Evitar redirección mientras el estado de autenticación se está inicializando
  if (loading) {
    return <LoadingSpinner text="Verificando autenticación..." />;
  }

  // 2. Si la ruta permite invitados y hay una sesión de invitado activa
  if (allowGuest && (isAuthenticated || isGuest)) {
    return children;
  }

  // 3. Redirigir al login si no está autenticado
  if (!isAuthenticated && !allowGuest) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 4. Verificación de permisos de administrador
  if (requireAdmin && user?.role !== 'admin') {
    const homePath = currentLang === 'en' ? '/' : `/${currentLang}`;
    return <Navigate to={homePath} replace />;
  }

  return children;
};

export default ProtectedRoute;