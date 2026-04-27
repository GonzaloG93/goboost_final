// src/pages/PrivacyPolicy.jsx - CORREGIDO PARA PRODUCCIÓN
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO/SEO';
import CustomNavbar from '../components/CustomNavbar';

const PrivacyPolicy = () => {
  const [privacyData, setPrivacyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('introduction');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        setError(null);
        
        console.log('📄 Fetching privacy policy from backend...');
        const response = await axiosInstance.get('/privacy-policy', { 
          timeout: 10000 
        });
        
        console.log('✅ Privacy policy fetched successfully');
        setPrivacyData(response.data);
        
      } catch (error) {
        console.error('❌ Error fetching privacy policy:', error.message);
        setError(error.message);
        
        // Fallback data if API fails
        setPrivacyData({
          title: "Privacy Policy - GonBoost",
          lastUpdated: "February 1, 2026",
          effectiveDate: "February 1, 2026",
          content: {
            sections: [
              {
                id: "introduction",
                title: "PRIVACY POLICY",
                content: `
                  <p><strong>Effective Date:</strong> February 1, 2026</p>
                  <p><strong>Last Updated:</strong> February 1, 2026</p>
                  
                  <p>Welcome to GonBoost. We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website www.gonboost.com and use our services.</p>
                  
                  <h3>1. Information We Collect</h3>
                  <p>We collect information that you provide directly to us, including:</p>
                  <ul>
                    <li>Name and contact information</li>
                    <li>Account credentials</li>
                    <li>Payment information</li>
                    <li>Game account information (for boosting services)</li>
                    <li>Communication preferences</li>
                  </ul>
                  
                  <h3>2. How We Use Your Information</h3>
                  <p>We use the information we collect to:</p>
                  <ul>
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process transactions and send related information</li>
                    <li>Send technical notices, updates, and support messages</li>
                    <li>Respond to your comments and questions</li>
                    <li>Protect against fraudulent or illegal activity</li>
                  </ul>
                  
                  <h3>3. Information Sharing</h3>
                  <p>We do not sell, trade, or rent your personal information to third parties. We may share information only:</p>
                  <ul>
                    <li>With your consent</li>
                    <li>To comply with legal obligations</li>
                    <li>To protect rights and safety</li>
                    <li>With service providers who assist in our operations</li>
                  </ul>
                  
                  <h3>4. Data Security</h3>
                  <p>We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>
                  
                  <h3>5. Your Rights</h3>
                  <p>You have the right to:</p>
                  <ul>
                    <li>Access your personal information</li>
                    <li>Correct inaccurate information</li>
                    <li>Request deletion of your information</li>
                    <li>Object to processing of your information</li>
                    <li>Data portability</li>
                  </ul>
                  
                  <h3>6. Contact Us</h3>
                  <p>If you have questions about this Privacy Policy, please contact us at:</p>
                  <p>Email: privacy@gonboost.com<br/>
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

    fetchPrivacy();
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
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto mb-4"></div>
              </div>
              <p className="text-gray-500 mt-4">Loading privacy policy...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Privacy Policy - GonBoost"
        description="Read our Privacy Policy to understand how we collect, use, and protect your personal information when using GonBoost services."
        robots="index, follow"
        canonical="https://www.gonboost.com/privacy-policy"
      />
      
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
              <li className="text-gray-900 font-medium">Privacy Policy</li>
            </ol>
          </nav>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Table of Contents */}
            <div className="lg:w-1/4">
              <div className="sticky top-32 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
                <nav className="space-y-2">
                  {privacyData.content.sections.map((section) => (
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
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Last Updated:</span> {privacyData.lastUpdated}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">Effective Date:</span> {privacyData.effectiveDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-green-900 px-8 py-6">
                  <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
                  <p className="text-green-200">
                    How we protect and use your personal information
                  </p>
                </div>

                <div className="p-8">
                  <div className="prose prose-lg max-w-none">
                    {privacyData.content.sections.map((section) => (
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
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      </div>
                    ))}

                    <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
                      <p className="text-gray-700 mb-4">
                        If you have any questions about this Privacy Policy, please contact us:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium">Email:</p>
                          <p className="text-blue-600">privacy@gonboost.com</p>
                        </div>
                        <div>
                          <p className="font-medium">Website:</p>
                          <p className="text-blue-600">www.gonboost.com</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">GonBoost Services</h3>
                      <p className="text-sm text-gray-600">Your privacy is important to us</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>© {new Date().getFullYear()} GonBoost. All rights reserved.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                <Link
                  to="/terms"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ← Terms of Service
                </Link>
                <Link
                  to="/support"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Questions? Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;