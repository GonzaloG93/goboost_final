// src/pages/TermsOfService.jsx - CORREGIDO PARA RENDER
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig'; // ✅ Usar la instancia configurada
import { Link } from 'react-router-dom';
import CustomNavbar from '../components/CustomNavbar';

const TermsOfService = () => {
  const [termsData, setTermsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('introduction');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setError(null);
        
        // ✅ USAR LA INSTANCIA CONFIGURADA - URL base ya incluida
        console.log('📄 Fetching terms from backend...');
        const response = await axiosInstance.get('/terms/terms-of-service', { 
          timeout: 10000 
        });
        
        console.log('✅ Terms fetched successfully');
        setTermsData(response.data);
        
      } catch (error) {
        console.error('❌ Error fetching terms:', error.message);
        setError(error.message);
        
        // Fallback data if API fails
        setTermsData({
          title: "Terms of Service - GonBoost",
          lastUpdated: "February 1, 2026",
          effectiveDate: "February 1, 2026",
          content: {
            sections: [
              {
                id: "introduction",
                title: "TERMS OF USE OF SERVICES OF GONBOOST WEBSITE",
                content: `
                  <p><strong>Effective Date:</strong> February 1, 2026</p>
                  <p><strong>Last Updated:</strong> February 1, 2026</p>
                  
                  <p>Welcome to GonBoost. These Terms of Service govern your use of our website and services. By accessing or using GonBoost services, you agree to be bound by these terms.</p>
                  
                  <h3>1. Acceptance of Terms</h3>
                  <p>By accessing or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
                  
                  <h3>2. Description of Services</h3>
                  <p>GonBoost provides professional gaming boosting services for various online games. Our services include but are not limited to rank boosting, coaching, and account leveling.</p>
                  
                  <h3>3. User Accounts</h3>
                  <p>To use certain features, you must register an account. You are responsible for maintaining the confidentiality of your account and password.</p>
                  
                  <h3>4. Payment and Fees</h3>
                  <p>All services are subject to payment. Prices are listed on our website and may change without notice. Payments are processed through secure third-party providers.</p>
                  
                  <h3>5. Refund Policy</h3>
                  <p>Refunds are handled on a case-by-case basis. Please review our refund policy before purchasing services.</p>
                  
                  <h3>6. Prohibited Activities</h3>
                  <p>You agree not to engage in any illegal activities while using our services, including but not limited to fraud, harassment, or violating game terms of service.</p>
                  
                  <h3>7. Limitation of Liability</h3>
                  <p>GonBoost is not liable for any damages resulting from the use of our services, including but not limited to account suspensions or bans from game publishers.</p>
                  
                  <h3>8. Contact Information</h3>
                  <p>If you have questions about these Terms of Service, please contact us at:</p>
                  <p>Email: legal@gonboost.com<br/>
                  Website: www.gonboost.com</p>
                `
              }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <>
        <CustomNavbar />
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomNavbar />
      
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {error && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                <span className="font-medium">Note:</span> Using offline version. API error: {error}
              </p>
            </div>
          )}

          {/* Breadcrumb Navigation */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link to="/" className="text-gray-500 hover:text-gray-700">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Terms of Service</li>
            </ol>
          </nav>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Table of Contents - Sidebar */}
            <div className="lg:w-1/4">
              <div className="sticky top-32 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
                <nav className="space-y-2">
                  {termsData.content.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
                
                {/* Last Updated Info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Last Updated:</span> {termsData.lastUpdated}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">Effective Date:</span> {termsData.effectiveDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-blue-900 px-8 py-6">
                  <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
                  <p className="text-blue-200">
                    Please read these terms carefully before using our services
                  </p>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="prose prose-lg max-w-none">
                    <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <p className="text-yellow-800 font-medium">
                        <span className="font-bold">Important:</span> By using GonBoost services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                      </p>
                    </div>

                    {termsData.content.sections.map((section) => (
                      <div
                        key={section.id}
                        id={section.id}
                        className="mb-12 scroll-mt-24"
                      >
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                          {section.title}
                        </h2>
                        <div 
                          className="text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />') }}
                        />
                      </div>
                    ))}

                    <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Acceptance of Terms</h3>
                      <p className="text-gray-700 mb-4">
                        By accessing or using GonBoost services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                      </p>
                      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                        <div>
                          <p className="text-sm text-gray-600">
                            Need help? <Link to="/support" className="text-blue-600 hover:text-blue-800 font-medium">Contact our support team</Link>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Also review our <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800 font-medium">Privacy Policy</Link>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">GonBoost Services</h3>
                      <p className="text-sm text-gray-600">Professional gaming boosting services</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>© {new Date().getFullYear()} GonBoost. All rights reserved.</p>
                      <p className="mt-1">Version 1.0</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Link
                  to="/privacy-policy"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ← Privacy Policy
                </Link>
                <Link
                  to="/support"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Need Help? Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;