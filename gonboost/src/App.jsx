// App.jsx - PRODUCCIÓN
import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SEO from './components/SEO/SEO';
import Analytics from './components/SEO/Analytics';
import ErrorBoundary from './components/ErrorBoundary';
import TawkToWidget from './components/TawkToWidget';

import './i18n';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './i18n';
import './App.css';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

const ServicesPage     = lazy(() => import('./pages/ServicesPage'));
const ServiceDetail    = lazy(() => import('./pages/ServiceDetail'));
const Order            = lazy(() => import('./pages/Order'));
const Checkout         = lazy(() => import('./pages/Checkout'));
const PaymentCancel    = lazy(() => import('./pages/PaymentCancel'));
const PayPalSuccess    = lazy(() => import('./pages/PayPalSuccess'));
const MyOrders         = lazy(() => import('./pages/MyOrders'));
const BoosterDashboard = lazy(() => import('./pages/BoosterDashboard'));
const SupportChat      = lazy(() => import('./pages/SupportChat'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const OrderDetails     = lazy(() => import('./pages/OrderDetails'));
const TermsOfService   = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy    = lazy(() => import('./pages/PrivacyPolicy'));

const AdminLayout        = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard     = lazy(() => import('./components/admin/Dashboard'));
const OrdersManagement   = lazy(() => import('./components/admin/OrdersManagement'));
const OrderDetail        = lazy(() => import('./components/admin/OrderDetail'));
const UsersManagement    = lazy(() => import('./components/admin/UsersManagement'));
const ServicesManagement = lazy(() => import('./components/admin/ServicesManagement'));
const TicketsManagement  = lazy(() => import('./components/admin/TicketsManagement'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
});

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Layout para idiomas con prefijo (/de, /es, etc.)
const LangPrefixLayout = () => {
  const { i18n } = useTranslation();
  const { lang } = useParams();

  useEffect(() => {
    if (lang && SUPPORTED_LANGUAGES.includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  return <Outlet key={lang} />;
};

// Layout para inglés sin prefijo (/)
const DefaultLangLayout = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== DEFAULT_LANGUAGE) {
      i18n.changeLanguage(DEFAULT_LANGUAGE);
    }
  }, [i18n]);

  return <Outlet />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner />;
  if (!user || user.role !== 'admin') return <Navigate to="/" state={{ from: location }} replace />;
  return children;
};

const AuthenticatedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { lang } = useParams();
  const currentLang = lang && SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  if (loading) return <LoadingSpinner />;
  const loginPath = currentLang === DEFAULT_LANGUAGE ? '/login' : `/${currentLang}/login`;
  return user ? children : <Navigate to={loginPath} replace />;
};

const CustomerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { lang } = useParams();
  const currentLang = lang && SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  if (loading) return <LoadingSpinner />;
  const homePath = currentLang === DEFAULT_LANGUAGE ? '/' : `/${currentLang}`;
  return user && user.role === 'customer' ? children : <Navigate to={homePath} replace />;
};

const BoosterRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { lang } = useParams();
  const currentLang = lang && SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  if (loading) return <LoadingSpinner />;
  const homePath = currentLang === DEFAULT_LANGUAGE ? '/' : `/${currentLang}`;
  return user && user.role === 'booster' ? children : <Navigate to={homePath} replace />;
};

// Redirige al idioma preferido del usuario si no es inglés
const RootRedirect = () => {
  const savedLang = localStorage.getItem('preferredLanguage');
  const browserLang = navigator.language?.split('-')[0];
  let targetLang = DEFAULT_LANGUAGE;
  if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) targetLang = savedLang;
  else if (browserLang && SUPPORTED_LANGUAGES.includes(browserLang)) targetLang = browserLang;
  if (targetLang === DEFAULT_LANGUAGE) return <Home />;
  return <Navigate to={`/${targetLang}`} replace />;
};

const NotFoundPage = () => {
  const { lang } = useParams();
  const navigate = useNavigate();
  const currentLang = lang && SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  const prefix = currentLang === DEFAULT_LANGUAGE ? '' : `/${currentLang}`;
  return (
    <>
      <SEO title="Page Not Found - 404" description="The page you are looking for does not exist on Gonboost." robots="noindex, follow" canonical={window.location.origin} />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 pt-20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8 text-lg">The page you are looking for does not exist or has been moved.</p>
          <div className="space-y-4">
            <button onClick={() => navigate(-1)} className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">← Go Back</button>
            <button onClick={() => navigate(prefix || '/')} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">🏠 Go Home</button>
          </div>
        </div>
      </div>
    </>
  );
};


function AppContent() {
  const location = useLocation();
  return (
    <div className="App">
      <Analytics />
      <SEO
        title="Gonboost - Professional Boosting Services"
        description="Improve your rank in Diablo, World of Warcraft and more with our elite team of professional boosters."
        robots="index, follow"
        canonical={window.location.origin}
      />
      <Navbar />
      <main className="relative min-h-[calc(100vh-4rem)]" role="main">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Rutas fuera del sistema de idiomas */}
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/paypal/success" element={<PayPalSuccess />} />

            {/* Admin */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout>
                  <Suspense key={location.pathname} fallback={<div className="p-6"><LoadingSpinner /></div>}>
                    <Outlet />
                  </Suspense>
                </AdminLayout>
              </AdminRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="orders/:orderId" element={<OrderDetail />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="services" element={<ServicesManagement />} />
              <Route path="tickets" element={<TicketsManagement />} />
              <Route path="payments" element={<div className="p-6"><h1 className="text-2xl font-bold">Payments Management</h1></div>} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            {/* Idiomas no-default: /es, /de, /fr, /nl, /pt, /ru */}
            {SUPPORTED_LANGUAGES.filter(l => l !== DEFAULT_LANGUAGE).map(lang => (
              <Route key={lang} path={`/${lang}`} element={<LangPrefixLayout />}>
                <Route index element={<Home />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="service/:serviceId" element={<ServiceDetail />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="terms" element={<TermsOfService />} />
                <Route path="terms-of-service" element={<TermsOfService />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="privacy-policy" element={<PrivacyPolicy />} />
                <Route path="order/:serviceId" element={<AuthenticatedRoute><Order /></AuthenticatedRoute>} />
                <Route path="checkout/:orderId" element={<AuthenticatedRoute><Checkout /></AuthenticatedRoute>} />
                <Route path="orders/:orderId" element={<AuthenticatedRoute><OrderDetails /></AuthenticatedRoute>} />
                <Route path="support" element={<AuthenticatedRoute><SupportChat /></AuthenticatedRoute>} />
                <Route path="my-orders" element={<AuthenticatedRoute><MyOrders /></AuthenticatedRoute>} />
                <Route path="dashboard" element={<CustomerRoute><Dashboard /></CustomerRoute>} />
                <Route path="booster/dashboard" element={<BoosterRoute><BoosterDashboard /></BoosterRoute>} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            ))}

            {/* Inglés — sin prefijo */}
            <Route path="/" element={<DefaultLangLayout />}>
              <Route index element={<RootRedirect />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="service/:serviceId" element={<ServiceDetail />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="terms" element={<TermsOfService />} />
              <Route path="terms-of-service" element={<TermsOfService />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="order/:serviceId" element={<AuthenticatedRoute><Order /></AuthenticatedRoute>} />
              <Route path="checkout/:orderId" element={<AuthenticatedRoute><Checkout /></AuthenticatedRoute>} />
              <Route path="orders/:orderId" element={<AuthenticatedRoute><OrderDetails /></AuthenticatedRoute>} />
              <Route path="support" element={<AuthenticatedRoute><SupportChat /></AuthenticatedRoute>} />
              <Route path="my-orders" element={<AuthenticatedRoute><MyOrders /></AuthenticatedRoute>} />
              <Route path="dashboard" element={<CustomerRoute><Dashboard /></CustomerRoute>} />
              <Route path="booster/dashboard" element={<BoosterRoute><BoosterDashboard /></BoosterRoute>} />
            </Route>

            {/* 404 global */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <TawkToWidget />
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              <AppContent />
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
