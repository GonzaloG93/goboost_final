import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(''); // Error local para validación
  const navigate = useNavigate();
  
  const { login, error: authError, clearError } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setLocalError(''); // Limpiar error local
    if (authError) clearError(); // Limpiar error del contexto
  };

  const validateEmail = (email) => {
    // Validación simple del lado del cliente
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError('');
    
    // Validaciones del lado del cliente
    if (!formData.email || !formData.password) {
      setLocalError('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    
    if (!validateEmail(formData.email)) {
      setLocalError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('📤 Enviando login:', formData.email);
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        console.log('✅ Login exitoso, redirigiendo...');
        navigate('/dashboard');
      } else {
        console.log('❌ Login fallido:', result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLocalError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
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
                <div className="bg-gradient-to-r from-yellow-600 to-orange-500 text-white px-6 py-1 rounded-full text-sm font-semibold mt-5">
                  LOGIN
                </div>
              </div>
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                  Access Your Account
                </h2>
                <p className="text-gray-400 text-center mt-2">Continue your boosting journey</p>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit}>
                {/* Mostrar errores del contexto o locales */}
                {(authError || localError) && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{authError || localError}</span>
                    </div>
                  </div>
                )}

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
                      // ✅ type="email" es suficiente, no uses pattern
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Password *
                    </label>
                  </div>
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
                      placeholder="••••••••"
                      required
                      minLength="6"
                      title="Password must be at least 6 characters"
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
                </div>

                <div className="flex justify-between items-center mb-8">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 border rounded ${rememberMe ? 'bg-yellow-500 border-yellow-500' : 'border-gray-600'}`}>
                        {rememberMe && (
                          <span className="absolute inset-0 flex items-center justify-center text-black font-bold">✓</span>
                        )}
                      </div>
                    </div>
                    <span className="ml-2 text-gray-300">Remember Me</span>
                  </label>
                  <div className="text-sm px-4 py-2 opacity-0">Placeholder</div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] ${
                    isLoading 
                      ? 'bg-gray-700 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-700 hover:to-orange-600'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Connecting...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="text-center mt-8">
                <p className="text-gray-400">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </div>

            <div className="bg-gray-900/50 p-6 border-t border-gray-700">
              <p className="text-center text-sm text-gray-400">
                By signing in, you agree to our{' '}
                <a href="/terms" className="text-yellow-400 hover:text-yellow-300">Terms of Service</a>{' '}
                and{' '}
                <a href="/privacy" className="text-yellow-400 hover:text-yellow-300">Privacy Policy</a>
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

export default Login;