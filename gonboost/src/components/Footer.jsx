import React from 'react';
import { Link } from 'react-router-dom';
import { OrganizationSchema } from './SEO/StructuredData';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(OrganizationSchema())}
      </script>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">
              <Link to="/" className="hover:text-blue-400 transition-colors">
                Gonboost
              </Link>
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Leaders in professional boosting services for MMORPG games. We enhance your gaming experience with exceptional results, guaranteed security, and personalized attention. Although new to the market, our dedication and quality position us as the best.
            </p>

            {/* Schema Microdata */}
            <div itemScope itemType="https://schema.org/Organization" className="hidden">
              <span itemProp="name">Gonboost</span>
              <span itemProp="description">
                Professional boosting services for gamers in Diablo, World of Warcraft and other popular MMORPG games.
              </span>
              <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                <span itemProp="addressCountry">ES</span>
              </div>
              <span itemProp="email">gonboosting@gmail.com</span>
            </div>

            <div className="flex space-x-3">
              {/* Discord */}
              <a 
                href="https://discord.gg/uVSFmFtHRR" 
                aria-label="Join our Discord"
                className="text-gray-300 hover:text-purple-400 transition-colors p-2 bg-gray-800 rounded-lg"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.8 8.18 1.8 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.899 19.899 0 005.993-3.03.076.076 0 00.032-.057c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a 
                href="https://instagram.com/gonboost" 
                aria-label="Follow us on Instagram"
                className="text-gray-300 hover:text-pink-400 transition-colors p-2 bg-gray-800 rounded-lg"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a 
                href="https://www.facebook.com/profile.php?id=61585983748015" 
                aria-label="Follow us on Facebook"
                className="text-gray-300 hover:text-blue-600 transition-colors p-2 bg-gray-800 rounded-lg"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2" role="list">
              <li>
                <Link 
                  to="/services?game=Diablo%204" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Diablo 4 Boosting
                </Link>
              </li>
              <li>
                <Link 
                  to="/services?game=Diablo%202%20Resurrected" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Diablo 2 Resurrected
                </Link>
              </li>
              <li>
                <Link 
                  to="/services?game=World%20of%20Warcraft%20Classic" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  WoW Classic
                </Link>
              </li>
              <li>
                <Link 
                  to="/services?game=World%20of%20Warcraft%20Retail" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  WoW Retail
                </Link>
              </li>
              <li className="pt-2 border-t border-gray-700">
                <Link 
                  to="/services" 
                  className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  All Services →
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2" role="list">
              <li>
                <Link 
                  to="/support" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:gonboosting@gmail.com" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} Gonboost. All rights reserved.
          </p>

          {/* Payment Methods - Solo PayPal y Binance */}
          <div className="flex space-x-5 mt-4 md:mt-0 mr-16 md:mr-20" aria-label="Accepted payment methods">
            <img 
              src="/images/payment-methods/paypal.svg" 
              alt="PayPal" 
              className="h-10 md:h-12 w-auto" 
              loading="lazy"
            />
            <img 
              src="/images/payment-methods/binance.svg" 
              alt="Binance" 
              className="h-10 md:h-12 w-auto" 
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;