// frontend/src/pages/SupportChat.jsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import axios from '../utils/axiosConfig';
import NotificationBell from '../components/NotificationBell';
import UserTickets from '../components/UserTickets';

const SupportChat = () => {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [createdTicket, setCreatedTicket] = useState(null);
  const [tawkToReady, setTawkToReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [unreadTickets, setUnreadTickets] = useState(0);

  const [formData, setFormData] = useState({
    category: 'technical',
    priority: 'medium',
    subject: '',
    message: ''
  });

  const categories = [
    { value: 'technical', label: '🔧 Technical Issue', description: 'Errors, bugs or platform problems' },
    { value: 'order_issue', label: '📦 Order Problem', description: 'Status, progress or issues with your boosting' },
    { value: 'billing', label: '💰 Billing/Payments', description: 'Payment issues, refunds or invoices' },
    { value: 'account', label: '👤 Account/Profile', description: 'Problems with your user account' },
    { value: 'other', label: '🎮 New Order/General', description: 'New service inquiries or other questions' }
  ];

  // ✅ Socket.io event listeners - CORREGIDO
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    console.log('🎯 SupportChat: Subscribing to ticket events');

    const handleAdminReply = (data) => {
      console.log('📩 Admin replied to ticket:', data);
      setUnreadTickets(prev => prev + 1);
      
      setSuccess(`📩 New reply in ticket #${data.ticket?.ticketNumber || ''}`);
      setTimeout(() => setSuccess(''), 5000);
      
      if (activeTab === 'new') {
        setActiveTab('history');
      }
    };

    const handleTicketCreated = (data) => {
      console.log('✅ Ticket created via socket:', data);
      
      // Solo mostrar si es del usuario actual
      if (data.customerId === user._id || data.userId === user._id) {
        setSuccess('🎫 Ticket created successfully!');
        setUnreadTickets(prev => prev + 1);
        setActiveTab('history');
        setTimeout(() => setSuccess(''), 5000);
      }
    };

    const handleTicketUpdated = (data) => {
      console.log('🔄 Ticket updated:', data);
      if (data.status) {
        setSuccess(`✅ Ticket status changed to ${data.status}`);
        setTimeout(() => setSuccess(''), 3000);
      }
    };

    // Unirse a sala de tickets del usuario
    socket.emit('join_user_tickets');

    // Escuchar eventos
    socket.on('admin_replied', handleAdminReply);
    socket.on('ticket_created', handleTicketCreated);
    socket.on('ticket_updated', handleTicketUpdated);
    socket.on('new_ticket_created', handleTicketCreated);

    return () => {
      socket.off('admin_replied', handleAdminReply);
      socket.off('ticket_created', handleTicketCreated);
      socket.off('ticket_updated', handleTicketUpdated);
      socket.off('new_ticket_created', handleTicketCreated);
    };
  }, [socket, isConnected, user, activeTab]);

  // ✅ Fetch unread tickets count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/support/tickets/my-tickets');
      if (response.data.success) {
        const tickets = response.data.data;
        const unread = tickets.reduce((count, ticket) => {
          return count + (ticket.unreadCount || 0);
        }, 0);
        setUnreadTickets(unread);
      }
    } catch (error) {
      console.error('Error fetching unread tickets:', error);
    }
  };

  // ✅ Check Tawk.to availability
  useEffect(() => {
    const checkTawkTo = () => {
      if (window.Tawk_API) {
        setTawkToReady(true);
      } else {
        setTimeout(checkTawkTo, 1000);
      }
    };
    checkTawkTo();
  }, []);

  // ✅ Navigation functions
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  // ✅ Open Tawk.to with ticket info
  const openTawkToWithTicket = async (ticket) => {
    if (!tawkToReady) {
      setError('Chat is still loading. Please try again in a few seconds.');
      return;
    }

    try {
      const userAttributes = {
        name: user?.username || 'User',
        email: user?.email || 'no-email@example.com',
        userId: user?._id,
        ticketNumber: ticket.ticketNumber,
        ticketCategory: getCategoryLabel(ticket.category),
        ticketPriority: ticket.priority,
        ticketSubject: ticket.subject.substring(0, 100)
      };

      if (user?.preferredGame) userAttributes.preferredGame = user.preferredGame;
      if (user?.currentRank) userAttributes.currentRank = user.currentRank;

      if (window.Tawk_API.setAttributes) {
        window.Tawk_API.setAttributes(userAttributes, (error) => {
          if (error) {
            console.error('Error setting Tawk.to attributes:', error);
          }
        });
      }

      if (window.Tawk_API.maximize) {
        window.Tawk_API.maximize();
      }

    } catch (error) {
      console.error('Error configuring Tawk.to:', error);
    }
  };

  // ✅ Handle ticket submission - CORREGIDO para evitar duplicados
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.subject.trim() || formData.subject.length < 5) {
      setError('Subject must be at least 5 characters long');
      return;
    }
    if (!formData.message.trim() || formData.message.length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setCreatedTicket(null);

    try {
      const ticketData = {
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        category: formData.category,
        priority: formData.priority
      };

      console.log('📤 Creating ticket:', ticketData);

      const response = await axios.post('/support/tickets', ticketData);

      if (response.data?.success) {
        const newTicket = response.data.data;
        console.log('✅ Ticket created successfully:', newTicket);
        
        setCreatedTicket(newTicket);
        setSuccess('Ticket created successfully! Opening chat...');
        
        // ✅ EMIT SOCKET EVENT (opcional, ya lo hace el backend)
        if (socket && isConnected && user) {
          // Solo emitir si es necesario para UI inmediata
          // El backend ya emite el evento 'ticket_created'
          socket.emit('customer_ticket_created', {
            ticket: newTicket,
            userId: user._id,
            customerName: user.username,
            timestamp: new Date()
          });
        }

        // Reset form
        setFormData({
          category: 'technical',
          priority: 'medium',
          subject: '',
          message: ''
        });

        // Switch to tickets tab
        setActiveTab('history');
        
        // Open chat after delay
        setTimeout(() => {
          openTawkToWithTicket(newTicket);
          setTimeout(() => setSuccess(''), 3000);
        }, 1000);
      } else {
        throw new Error(response.data?.message || 'Error creating ticket');
      }

    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error creating ticket';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (categoryValue) => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label.replace(/[🔧📦💰👤🎮💬]/g, '').trim() : categoryValue;
  };

  // ✅ Open simple chat without ticket
  const openSimpleChat = () => {
    if (!tawkToReady) {
      setError('Chat is still loading. Please try again in a few seconds.');
      return;
    }

    if (window.Tawk_API) {
      const userAttributes = {
        name: user?.username || 'User',
        email: user?.email || 'no-email@example.com'
      };

      if (user?._id) userAttributes.userId = user._id;
      if (user?.preferredGame) userAttributes.preferredGame = user.preferredGame;
      if (user?.currentRank) userAttributes.currentRank = user.currentRank;

      if (window.Tawk_API.setAttributes) {
        window.Tawk_API.setAttributes(userAttributes);
      }

      if (window.Tawk_API.maximize) {
        window.Tawk_API.maximize();
      }
    } else {
      setError('Chat system is not available. Please refresh the page.');
    }
  };

  const selectedCategory = categories.find(cat => cat.value === formData.category);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4">
          {/* Desktop - 3 columns */}
          <div className="hidden lg:grid grid-cols-3 items-center py-4">
            <div className="flex justify-start items-center">
              <Link to="/" className="flex items-center group" onClick={closeAllMenus}>
                <img 
                  src="./images/logo-1.png" 
                  alt="Gonboost" 
                  className="h-16 w-auto group-hover:opacity-90 transition-opacity filter brightness-75 contrast-125"
                />
              </Link>
            </div>
            
            <div className="flex justify-center items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-200 px-4 py-2 rounded-lg" onClick={closeAllMenus}>
                Home
              </Link>
              <Link to="/services" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-200 px-4 py-2 rounded-lg" onClick={closeAllMenus}>
                Services
              </Link>
              {user && user.role !== 'admin' && (
                <Link to="/my-orders" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-200 px-4 py-2 rounded-lg" onClick={closeAllMenus}>
                  My Orders
                </Link>
              )}
              <Link to="/support" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-200 px-4 py-2 rounded-lg bg-gray-100" onClick={closeAllMenus}>
                Support
              </Link>
            </div>

            <div className="flex justify-end items-center space-x-4">
              {user ? (
                <>
                  <NotificationBell theme="dark" />
                  <div className="relative">
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
                      <svg className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 z-50 py-2">
                        <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
                          Account
                        </div>
                        {user.role !== 'admin' && (
                          <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mx-2 rounded" role="menuitem" onClick={closeAllMenus}>
                            📊 Dashboard
                          </Link>
                        )}
                        {user.role === 'booster' && (
                          <Link to="/booster/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mx-2 rounded" role="menuitem" onClick={closeAllMenus}>
                            ⚡ Booster Panel
                          </Link>
                        )}
                        {user.role === 'admin' && (
                          <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors mx-2 rounded" role="menuitem" onClick={closeAllMenus}>
                            🔧 Admin Panel
                          </Link>
                        )}
                        <hr className="my-2 border-gray-200" />
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors mx-2 rounded" role="menuitem">
                          🚪 Log Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-200 px-4 py-2 rounded-lg" onClick={closeAllMenus}>
                    Log In
                  </Link>
                  <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg" onClick={closeAllMenus}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden flex justify-between items-center py-3">
            <Link to="/" className="flex items-center space-x-2" onClick={closeAllMenus}>
              <img src="./images/logo-1.png" alt="Gonboost" className="h-10 w-auto group-hover:opacity-90 transition-opacity filter brightness-75 contrast-125" />
            </Link>
            <button onClick={toggleMobileMenu} className="p-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-800 hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="lg:hidden bg-white shadow-lg border border-gray-200 rounded-lg mt-2 mb-4 py-4 relative z-50">
              <div className="space-y-2 px-4">
                <Link to="/" className="block font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100" onClick={handleMobileLinkClick}>
                  Home
                </Link>
                <Link to="/services" className="block font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100" onClick={handleMobileLinkClick}>
                  Services
                </Link>
                {user && user.role !== 'admin' && (
                  <Link to="/my-orders" className="block font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100" onClick={handleMobileLinkClick}>
                    My Orders
                  </Link>
                )}
                <Link to="/support" className="block font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-gray-700 hover:text-gray-900 hover:bg-gray-100 bg-gray-100" onClick={handleMobileLinkClick}>
                  Support
                </Link>
              </div>
              <div className="border-t border-gray-200 mt-4 pt-4 px-4">
                {user ? (
                  <>
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
                    <div className="flex justify-center mb-4">
                      <NotificationBell theme="dark" />
                    </div>
                    <div className="space-y-2">
                      {user.role !== 'admin' && (
                        <Link to="/dashboard" className="block py-2 px-4 rounded transition-colors text-gray-700 hover:text-gray-900 hover:bg-gray-100" onClick={handleMobileLinkClick}>
                          📊 Dashboard
                        </Link>
                      )}
                      {user.role === 'booster' && (
                        <Link to="/booster/dashboard" className="block py-2 px-4 rounded transition-colors text-gray-700 hover:text-gray-900 hover:bg-gray-100" onClick={handleMobileLinkClick}>
                          ⚡ Booster Panel
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link to="/admin/dashboard" className="block py-2 px-4 rounded transition-colors text-gray-700 hover:text-gray-900 hover:bg-gray-100" onClick={handleMobileLinkClick}>
                          🔧 Admin Panel
                        </Link>
                      )}
                      <hr className="my-2 border-gray-200" />
                      <button onClick={handleLogout} className="block w-full text-left py-2 px-4 rounded transition-colors text-red-600 hover:bg-red-50 hover:text-red-700">
                        🚪 Log Out
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Link to="/login" className="block text-center font-medium py-3 px-4 rounded-lg transition-colors duration-200 border text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300" onClick={handleMobileLinkClick}>
                      Log In
                    </Link>
                    <Link to="/register" className="block text-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg" onClick={handleMobileLinkClick}>
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {isMenuOpen && (
          <div className="fixed inset-0 z-40" onClick={closeAllMenus} aria-hidden="true"></div>
        )}
      </nav>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 pt-20">
        <div className="container mx-auto px-4 max-w-6xl">
          
          <div className="text-center mb-8 p-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Support Center
            </h1>
            <p className="text-lg text-gray-600">
              Create tickets and chat with our support team in real-time
            </p>
            <div className="mt-4 flex flex-col items-center">
              <div className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Real-time support active' : 'Offline mode'}
                </span>
              </div>
              {unreadTickets > 0 && (
                <span className="mt-2 bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full font-medium">
                  🔔 {unreadTickets} unread message{unreadTickets > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">×</button>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
                {createdTicket && <span className="ml-2 text-sm">(Ticket #{createdTicket.ticketNumber})</span>}
              </div>
              <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">×</button>
            </div>
          )}

          {/* Quick Action Button */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Need immediate help?</h3>
            <p className="text-gray-600 mb-4">Chat directly with our team without creating a ticket</p>
            <button
              onClick={openSimpleChat}
              disabled={!tawkToReady}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              {tawkToReady ? '💬 Direct Chat (No Form)' : '⏳ Loading Chat...'}
            </button>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('new')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'new'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Ticket
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center relative ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  My Tickets
                  {unreadTickets > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadTickets}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {activeTab === 'new' ? (
              // New Ticket Form
              <div className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create Ticket + Automatic Chat</h2>
                  <p className="text-gray-600">Complete the form and we'll automatically open the chat with your ticket information</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-600">User:</span><span className="font-medium ml-2">{user?.username}</span></div>
                      <div><span className="text-gray-600">Email:</span><span className="font-medium ml-2">{user?.email}</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Inquiry Type *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                      </select>
                      {selectedCategory && <p className="text-xs text-gray-500 mt-1">{selectedCategory.description}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Priority *</label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      >
                        <option value="low">🟢 Low - General inquiry</option>
                        <option value="medium">🟡 Medium - Non-urgent problem</option>
                        <option value="high">🟠 High - Problem affecting service</option>
                        <option value="urgent">🔴 Urgent - Service stopped</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject * <span className="text-xs text-gray-500">(min. 5 characters)</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Briefly describe your problem or inquiry..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                      maxLength={200}
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {formData.subject.length}/200 {formData.subject.length < 5 && '❌'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Detailed Description * <span className="text-xs text-gray-500">(min. 10 characters)</span>
                    </label>
                    <textarea
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Describe your problem in detail..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={loading}
                      maxLength={2000}
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {formData.message.length}/2000 {formData.message.length < 10 && '❌'}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || formData.subject.length < 5 || formData.message.length < 10 || !tawkToReady}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating Ticket...
                      </>
                    ) : (
                      `📨 Create Ticket + ${tawkToReady ? 'Open Chat' : 'Waiting for Chat'}`
                    )}
                  </button>

                  <div className="text-center text-sm text-gray-500">
                    <p>After submitting, the chat will automatically open with your ticket information</p>
                    {!tawkToReady && <p className="text-yellow-600 mt-1">⚠️ Chat system is loading, please wait...</p>}
                  </div>
                </form>
              </div>
            ) : (
              // Tickets History
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Support Tickets</h2>
                    <p className="text-gray-600">View all your tickets and continue conversations</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Ticket
                  </button>
                </div>
                
                {/* UserTickets Component */}
                <UserTickets />
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-gray-600 text-sm">Instant notifications for new replies</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-3">🎮</div>
              <h3 className="font-semibold text-gray-900 mb-2">Gaming Experts</h3>
              <p className="text-gray-600 text-sm">Specialists in boosting and elo</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Support</h3>
              <p className="text-gray-600 text-sm">We protect your account and data</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportChat;