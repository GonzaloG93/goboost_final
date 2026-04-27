// backend/routes/privacyRoutes.js - VERSIÓN CORREGIDA
import express from 'express';
const router = express.Router();

// Get Privacy Policy - RUTA CORREGIDA
router.get('/', (req, res) => {
  const privacyData = {
    title: "Privacy Policy - GonBoost",
    lastUpdated: "February 1, 2026",
    effectiveDate: "February 1, 2026",
    content: {
      sections: [
        {
          id: "introduction",
          title: "PRIVACY POLICY",
          content: `This Privacy Policy describes how GonBoost ("we", "us", or "our") collects, uses, discloses, and protects your personal information when you use our website and services. By accessing or using our services, you agree to the terms of this Privacy Policy.`
        },
        {
          id: "information-we-collect",
          title: "1. Information We Collect",
          content: `**1.1. Personal Information:** When you register an account, place an order, or contact our support, we may collect personal information such as:
- Name and email address
- Payment information (processed securely by third-party providers)
- Game account information (usernames, game IDs)
- Communication preferences

**1.2. Technical Information:** We automatically collect certain information when you visit our website:
- IP address and device information
- Browser type and version
- Pages visited and time spent
- Cookies and similar tracking technologies`
        },
        {
          id: "how-we-use-information",
          title: "2. How We Use Your Information",
          content: `We use the collected information for the following purposes:
- To provide and maintain our services
- To process your orders and payments
- To communicate with you about your account and services
- To improve our website and services
- To send promotional communications (with your consent)
- To comply with legal obligations
- To prevent fraud and ensure security`
        },
        {
          id: "information-sharing",
          title: "3. Information Sharing and Disclosure",
          content: `**3.1. We do not sell your personal information to third parties.**

**3.2. We may share your information with:**
- Service providers who assist in our operations (payment processors, hosting providers)
- Game boosters who need your game information to provide services
- Law enforcement or government authorities when required by law
- Third parties in connection with a business transfer or merger

**3.3. Your game account information is only shared with the specific booster assigned to your order and is protected by confidentiality agreements.**`
        },
        {
          id: "data-security",
          title: "4. Data Security",
          content: `**4.1.** We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

**4.2.** While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.

**4.3.** You are responsible for keeping your account credentials confidential and secure.`
        },
        {
          id: "your-rights",
          title: "5. Your Rights and Choices",
          content: `Depending on your location, you may have certain rights regarding your personal information:
- **Access:** Request access to your personal information
- **Correction:** Request correction of inaccurate information
- **Deletion:** Request deletion of your personal information
- **Opt-out:** Opt-out of marketing communications
- **Data Portability:** Request a copy of your data in a structured format

To exercise these rights, contact us at privacy@gonboost.com`
        },
        {
          id: "cookies",
          title: "6. Cookies and Tracking Technologies",
          content: `**6.1.** We use cookies and similar technologies to enhance your experience on our website.

**6.2. Types of cookies we use:**
- Essential cookies (required for site functionality)
- Performance cookies (help us understand how visitors use our site)
- Functional cookies (remember your preferences)
- Advertising cookies (to deliver relevant ads)

**6.3.** You can control cookies through your browser settings. However, disabling essential cookies may affect site functionality.`
        },
        {
          id: "children-privacy",
          title: "7. Children's Privacy",
          content: `**7.1.** Our services are not directed to individuals under the age of 16 ("Children").

**7.2.** We do not knowingly collect personal information from Children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.

**7.3.** If we become aware that we have collected personal information from Children without verification of parental consent, we will take steps to remove that information.`
        },
        {
          id: "international-transfers",
          title: "8. International Data Transfers",
          content: `**8.1.** Your information may be transferred to, and processed in, countries other than your country of residence.

**8.2.** These countries may have data protection laws that are different from your country.

**8.3.** We take appropriate safeguards to ensure your information remains protected in accordance with this Privacy Policy.`
        },
        {
          id: "policy-changes",
          title: "9. Changes to This Privacy Policy",
          content: `**9.1.** We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

**9.2.** We encourage you to review this Privacy Policy periodically for any changes.

**9.3.** Your continued use of our services after any changes constitutes your acceptance of the updated Privacy Policy.`
        },
        {
          id: "contact-us",
          title: "10. Contact Us",
          content: `If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact us:

**GonBoost Services**
Email: gonboosting@gmail.com
Website: https://www.gonboost.com/privacy-policy
Address: Argentina
[Registration pending]

For data protection inquiries: gonboosting@gmail.com`
        }
      ]
    }
  };
  
  res.json(privacyData);
});

// Ruta de prueba para debugging
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Privacy policy API is working!', 
    timestamp: new Date().toISOString(),
    path: '/api/privacy-policy' 
  });
});

export default router;