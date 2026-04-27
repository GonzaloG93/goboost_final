// src/context/AuthContext.jsx - CON INTEGRACIÓN reCAPTCHA
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from '../utils/axiosConfig';

const AuthContext = createContext();

// Variables globales para control
let fetchUserPromise = null;
let isInitialized = false;
let cachedUserData = null;

const isDev = import.meta.env.DEV;

const devLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const savedUser = localStorage.getItem('user');
      cachedUserData = savedUser ? JSON.parse(savedUser) : null;
      return cachedUserData;
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  });
  
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const fetchUser = useCallback(async (force = false) => {
    if (fetchUserPromise && !force) {
      return fetchUserPromise;
    }

    const currentToken = localStorage.getItem('token');
    
    if (!currentToken) {
      localStorage.removeItem('user');
      cachedUserData = null;
      
      if (mountedRef.current) {
        setToken(null);
        setUser(null);
        setLoading(false);
      }
      return null;
    }

    if (!force && cachedUserData) {
      if (mountedRef.current) {
        setUser(cachedUserData);
        setToken(currentToken);
        setLoading(false);
      }
      return cachedUserData;
    }

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      fetchUserPromise = axios.get('/auth/me', {
        signal: abortControllerRef.current.signal,
        timeout: 10000
      }).then(response => {
        if (response.data.success && response.data.user) {
          const userData = response.data.user;
          
          cachedUserData = userData;
          localStorage.setItem('user', JSON.stringify(userData));
          
          if (mountedRef.current) {
            setUser(userData);
            setToken(currentToken);
          }
          
          return userData;
        }
        throw new Error('Invalid user data received');
      }).catch(error => {
        if (error.name === 'CanceledError' || error.name === 'AbortError') {
          return null;
        }
        
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          cachedUserData = null;
          
          if (mountedRef.current) {
            setUser(null);
            setToken(null);
            setError('Session expired. Please login again.');
          }
        }
        return null;
      }).finally(() => {
        fetchUserPromise = null;
        abortControllerRef.current = null;
      });

      return fetchUserPromise;
    } catch (error) {
      return null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    if (isInitialized) {
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      isInitialized = true;
      
      const currentToken = localStorage.getItem('token');
      
      if (!currentToken) {
        if (mountedRef.current) {
          setLoading(false);
        }
        return;
      }
      
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          cachedUserData = userData;
          
          if (mountedRef.current) {
            setUser(userData);
            setToken(currentToken);
            setLoading(false);
          }
          
          setTimeout(() => {
            if (mountedRef.current) {
              fetchUser(true).catch(() => {});
            }
          }, 100);
          
        } catch (e) {
          await fetchUser();
        }
      } else {
        await fetchUser();
      }
    };
    
    initializeAuth();
    
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!isDev) return;
    
    devLog('🔐 AuthContext - Estado:', {
      user: user?.username,
      loading,
      hasToken: !!token,
      isInitialized
    });
  }, [user, loading, token]);

  // Login con reCAPTCHA
  const login = async (email, password, captchaToken) => {
    try {
      setError(null);
      
      devLog('📤 Enviando solicitud de login con reCAPTCHA...');
      
      const response = await axios.post('/auth/login', { 
        email, 
        password,
        captchaToken // Enviar token de reCAPTCHA
      });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        cachedUserData = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        if (mountedRef.current) {
          setUser(user);
          setToken(token);
          setError(null);
          setLoading(false);
        }
        
        devLog('✅ Login exitoso');
        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Error en el inicio de sesión. Verifica tus credenciales.';
      
      if (mountedRef.current) {
        setError(message);
      }
      
      devLog('❌ Login fallido:', message);
      return { success: false, error: message };
    }
  };

  // Register con reCAPTCHA
  const register = async (userData) => {
    try {
      setError(null);
      
      devLog('📤 Enviando registro con reCAPTCHA...');
      
      const response = await axios.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        cachedUserData = user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        if (mountedRef.current) {
          setUser(user);
          setToken(token);
          setError(null);
          setLoading(false);
        }
        
        devLog('✅ Registro exitoso');
        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Error en el registro';
      
      if (mountedRef.current) {
        setError(message);
      }
      
      devLog('❌ Registro fallido:', message);
      return { success: false, error: message };
    }
  };

  const logout = useCallback(() => {
    cachedUserData = null;
    isInitialized = false;
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    if (mountedRef.current) {
      setUser(null);
      setToken(null);
      setError(null);
      setLoading(false);
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  const clearError = useCallback(() => {
    if (mountedRef.current) {
      setError(null);
    }
  }, []);

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    error,
    clearError,
    isAuthenticated: !!user && !!token,
    refetchUser: () => fetchUser(true)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};