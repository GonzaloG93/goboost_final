import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// Variables globales para controlar la carga del script
let recaptchaScriptLoaded = false;
let recaptchaScriptLoading = false;

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [captchaValue, setCaptchaValue] = useState(null);
  const captchaRef = useRef(null);
  const widgetId = useRef(null);
  
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();

  // Función para cargar el script de reCAPTCHA
  const loadRecaptchaScript = useCallback(() => {
    return new Promise((resolve) => {
      // 1. Si el script y el método render ya están disponibles, resolvemos inmediatamente
      if (window.grecaptcha && window.grecaptcha.render) {
        resolve();
        return;
      }

      // Helper para esperar a que el método .render se inyecte en el objeto global
      const waitForRender = () => {
        const checkInterval = setInterval(() => {
          if (window.grecaptcha && window.grecaptcha.render) {
            clearInterval(checkInterval);
            recaptchaScriptLoaded = true;
            recaptchaScriptLoading = false;
            resolve();
          }
        }, 100);
      };

      // 2. Si ya se está cargando (por otro componente), simplemente esperamos
      if (recaptchaScriptLoading || recaptchaScriptLoaded) {
        waitForRender();
        return;
      }

      recaptchaScriptLoading = true;

      // 3. Verificar si el script ya existe en el DOM por navegación previa
      const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
      if (existingScript) {
        waitForRender();
        return;
      }

      // 4. Cargar el script por primera vez
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // En lugar de resolver inmediatamente, esperamos a que el método render esté completamente inicializado.
        waitForRender();
      };
      
      script.onerror = () => {
        recaptchaScriptLoading = false;
        console.error('Error loading reCAPTCHA script');
        resolve();
      };
      
      document.head.appendChild(script);
    });
  }, []);

  // Renderizar el widget de reCAPTCHA
  const renderRecaptcha = useCallback(() => {
    if (!captchaRef.current) return;
    
    // Limpiar widget anterior si existe
    if (widgetId.current !== null) {
      try {
        window.grecaptcha.reset(widgetId.current);
        return;
      } catch (e) {
        widgetId.current = null;
      }
    }

    // Verificar que el elemento no tenga ya un widget
    if (captchaRef.current.innerHTML !== '') {
      captchaRef.current.innerHTML = '';
    }

    try {
      widgetId.current = window.grecaptcha.render(captchaRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: 'dark',
        size: 'normal',
        callback: (value) => {
          setCaptchaValue(value);
        },
        'expired-callback': () => {
          setCaptchaValue(null);
        },
        'error-callback': () => {
          console.error('reCAPTCHA error occurred');
        }
      });
    } catch (error) {
      console.error('Error rendering reCAPTCHA:', error);
      setTimeout(() => {
        if (captchaRef.current) {
          captchaRef.current.innerHTML = '';
          try {
            widgetId.current = window.grecaptcha.render(captchaRef.current, {
              sitekey: RECAPTCHA_SITE_KEY,
              theme: 'dark',
              callback: (value) => {
                setCaptchaValue(value);
              },
              'expired-callback': () => {
                setCaptchaValue(null);
              }
            });
          } catch (retryError) {
            console.error('Retry rendering reCAPTCHA failed:', retryError);
          }
        }
      }, 1000);
    }
  }, []);

  // Inicializar reCAPTCHA
  useEffect(() => {
    let isMounted = true;

    const initRecaptcha = async () => {
      await loadRecaptchaScript();
      
      if (isMounted && captchaRef.current) {
        renderRecaptcha();
      }
    };

    initRecaptcha();

    return () => {
      isMounted = false;
    };
  }, [loadRecaptchaScript, renderRecaptcha]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) clearError();
  };

  const resetCaptcha = () => {
    try {
      if (widgetId.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetId.current);
        setCaptchaValue(null);
      }
    } catch (error) {
      console.error('Error resetting reCAPTCHA:', error);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('Full Name is required');
      return false;
    }
    if (!formData.username.trim()) {
      alert('Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      alert('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return false;
    }
    if (!acceptTerms) {
      alert('You must accept the Terms and Conditions');
      return false;
    }
    if (!captchaValue) {
      alert('Please complete the CAPTCHA verification');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        captchaToken: captchaValue
      });
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        resetCaptcha();
      }
    } catch (error) {
      console.error('Registration error:', error);
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const Particle = ({ index }) => (
    <div 
      key={index}
      className="absolute w-1 h-1 bg-yellow-400 rounded-full opacity-70 animate-pulse"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${1 + Math.random() * 3}s`
      }}
    ></div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-yellow-900/20 to-gray-900">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(to right, #d97706 1px, transparent 1px),
                           linear-gradient(to bottom, #d97706 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        {Array.from({ length: 25 }).map((_, i) => (
          <Particle key={i} index={i} />
        ))}
        
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto mt-10">
          <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
            <div className="relative p-8 border-b border-gray-700">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-yellow-600 to-orange-500 text-white px-8 py-1 rounded-full text-sm font-semibold mt-5">
                  JOIN US
                </div>
              </div>
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                  Create Account
                </h2>
                <p className="text-gray-400 text-center mt-2">Start your boosting journey</p>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">👤</span>
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your full name"
                      required
                      minLength="2"
                      maxLength="50"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">🎮</span>
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      placeholder="Choose a username"
                      required
                      minLength="3"
                      maxLength="20"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">✉️</span>
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      placeholder="player@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔒</span>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-12 py-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      placeholder="Minimum 6 characters"
                      required
                      minLength="6"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <span className="text-gray-400 hover:text-yellow-400">
                        {showPassword ? "🙈" : "👁️"}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔐</span>
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-12 pr-12 py-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      placeholder="Repeat your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <span className="text-gray-400 hover:text-yellow-400">
                        {showConfirmPassword ? "🙈" : "👁️"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* reCAPTCHA */}
                <div className="mb-6 flex justify-center">
                  <div ref={captchaRef}></div>
                </div>

                <div className="mb-8">
                  <label className="flex items-start cursor-pointer">
                    <div className="relative mt-1 mr-3">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={() => setAcceptTerms(!acceptTerms)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 border rounded ${acceptTerms ? 'bg-yellow-500 border-yellow-500' : 'border-gray-600'}`}>
                        {acceptTerms && (
                          <span className="absolute inset-0 flex items-center justify-center text-black font-bold">✓</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-300">
                        I accept the{' '}
                        <a href="/terms" className="text-yellow-400 hover:text-yellow-300 underline">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-yellow-400 hover:text-yellow-300 underline">
                          Privacy Policy *
                        </a>
                      </span>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] ${
                    loading 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-700 hover:to-orange-600'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="text-center mt-8">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>

            <div className="bg-gray-900/50 p-6 border-t border-gray-700">
              <p className="text-center text-sm text-gray-400">
                * Required fields
              </p>
              <p className="text-center text-sm text-gray-400 mt-2">
                By registering, you agree to our terms and acknowledge our privacy practices
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-yellow-400">24/7</div>
              <div className="text-sm text-gray-400 mt-1">Support</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-orange-400">All orders</div>
              <div className="text-sm text-gray-400 mt-1">with guaranteed success</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-green-400">Fast & secure</div>
              <div className="text-sm text-gray-400 mt-1">Video-games Services</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;