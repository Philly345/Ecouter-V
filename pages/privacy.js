import Head from 'next/head';
import Navbar from '../components/Navbar';
import FloatingBubbles from '../components/FloatingBubbles';
import { useAuth } from '../components/AuthContext';

export default function Privacy() {
  const { user, logout } = useAuth();

  return (
    <>
      <Head>
        <title>Privacy Policy - Ecouter Transcribe</title>
        <meta name="description" content="Privacy Policy for Ecouter Transcribe. Learn how we collect, use, and protect your personal information and audio data." />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        <Navbar user={user} onLogout={logout} />

        <div className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text text-center">
              Privacy Policy
            </h1>
            <p className="text-gray-400 text-center mb-12">
              Last updated: January 21, 2025
            </p>

            <div className="prose prose-lg prose-invert max-w-none">
              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">1. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Personal Information</h3>
                <p className="text-gray-300 mb-4">
                  We collect information you provide directly to us, such as when you create an account, 
                  contact us, or use our services:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Name and email address</li>
                  <li>Account credentials</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Communication preferences</li>
                  <li>Support requests and correspondence</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Audio Files and Content</h3>
                <p className="text-gray-300 mb-4">
                  When you use our transcription services, we collect:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Audio files you upload for transcription</li>
                  <li>Generated transcripts and summaries</li>
                  <li>Chat conversations with our AI</li>
                  <li>File metadata (size, format, upload time)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Usage Information</h3>
                <p className="text-gray-300 mb-4">
                  We automatically collect certain information about your use of our services:
                </p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Device information (browser, operating system)</li>
                  <li>IP address and location data</li>
                  <li>Usage patterns and feature interactions</li>
                  <li>Performance and error logs</li>
                </ul>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">2. How We Use Your Information</h2>
                
                <p className="text-gray-300 mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Provide, maintain, and improve our transcription services</li>
                  <li>Process your audio files and generate accurate transcripts</li>
                  <li>Enable AI chat functionality with your transcribed content</li>
                  <li>Manage your account and provide customer support</li>
                  <li>Send you service updates and important notifications</li>
                  <li>Analyze usage patterns to enhance user experience</li>
                  <li>Ensure security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">3. Data Security</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Encryption and Protection</h3>
                <p className="text-gray-300 mb-4">
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>All data transmissions are encrypted using TLS 1.3</li>
                  <li>Audio files are encrypted at rest using AES-256 encryption</li>
                  <li>Access controls and authentication protocols</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Secure data centers with physical access controls</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Data Retention</h3>
                <p className="text-gray-300 mb-4">
                  We retain your data only as long as necessary:
                </p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Audio files: Deleted after 30 days unless you choose to save them</li>
                  <li>Transcripts: Retained until you delete them or close your account</li>
                  <li>Account information: Retained until account deletion</li>
                  <li>Usage logs: Retained for 90 days for security and analytics</li>
                </ul>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">4. Information Sharing</h2>
                
                <p className="text-gray-300 mb-4">
                  We do not sell, trade, or rent your personal information. We may share information only in these limited circumstances:
                </p>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Service Providers</h3>
                <p className="text-gray-300 mb-4">
                  We work with trusted third-party providers who assist in delivering our services:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Cloud hosting and storage providers</li>
                  <li>Payment processors</li>
                  <li>Email and communication services</li>
                  <li>Analytics and monitoring tools</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Legal Requirements</h3>
                <p className="text-gray-300 mb-4">
                  We may disclose information if required by law or to:
                </p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Comply with legal process or government requests</li>
                  <li>Protect our rights, property, or safety</li>
                  <li>Protect the rights, property, or safety of our users</li>
                  <li>Investigate fraud or security issues</li>
                </ul>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">5. Your Rights and Choices</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Access and Control</h3>
                <p className="text-gray-300 mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Access and review your personal data</li>
                  <li>Update or correct inaccurate information</li>
                  <li>Delete your account and associated data</li>
                  <li>Export your transcripts and data</li>
                  <li>Opt out of marketing communications</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Data Portability</h3>
                <p className="text-gray-300 mb-4">
                  You can export your data at any time through your dashboard or by contacting us. 
                  We provide data in standard formats (JSON, CSV, TXT) for easy portability.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">Account Deletion</h3>
                <p className="text-gray-300">
                  When you delete your account, we permanently remove all your personal data, 
                  audio files, and transcripts within 30 days, except as required by law.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">6. Cookies and Tracking</h2>
                
                <p className="text-gray-300 mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Keep you logged in to your account</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze usage patterns and improve our services</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>

                <p className="text-gray-300">
                  You can control cookies through your browser settings. However, disabling cookies 
                  may affect the functionality of our services.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">7. International Users</h2>
                
                <p className="text-gray-300 mb-4">
                  Our services are hosted in the United States. If you are accessing our services 
                  from outside the US, please be aware that your information may be transferred to, 
                  stored, and processed in the United States.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">GDPR Compliance</h3>
                <p className="text-gray-300 mb-4">
                  For users in the European Union, we comply with the General Data Protection Regulation (GDPR):
                </p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Lawful basis for processing personal data</li>
                  <li>Data subject rights (access, rectification, erasure, portability)</li>
                  <li>Data protection by design and by default</li>
                  <li>Breach notification procedures</li>
                </ul>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">8. Children's Privacy</h2>
                
                <p className="text-gray-300">
                  Our services are not intended for children under 13 years of age. We do not 
                  knowingly collect personal information from children under 13. If you are a 
                  parent or guardian and believe your child has provided us with personal information, 
                  please contact us immediately.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">9. Changes to This Policy</h2>
                
                <p className="text-gray-300 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  material changes by:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
                  <li>Posting the updated policy on our website</li>
                  <li>Sending you an email notification</li>
                  <li>Displaying a notice in your dashboard</li>
                </ul>

                <p className="text-gray-300">
                  Your continued use of our services after the effective date of the updated 
                  policy constitutes acceptance of the changes.
                </p>
              </div>

              <div className="file-card p-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">10. Contact Us</h2>
                
                <p className="text-gray-300 mb-4">
                  If you have any questions about this Privacy Policy or our data practices, 
                  please contact us:
                </p>
                
                <div className="space-y-2 text-gray-300">
                  <p><strong>Email:</strong> privacy@ecouter.ai</p>
                  <p><strong>Address:</strong> 123 Privacy Lane, Data City, DC 12345</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                </div>
                
                <p className="text-gray-400 mt-6 text-sm">
                  For EU users, you can also contact our Data Protection Officer at dpo@ecouter.ai
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
