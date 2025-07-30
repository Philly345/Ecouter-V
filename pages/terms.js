import Head from 'next/head';
import Navbar from '../components/Navbar';
import FloatingBubbles from '../components/FloatingBubbles';
import { useAuth } from '../components/AuthContext';

export default function Terms() {
  const { user, logout } = useAuth();

  return (
    <>
      <Head>
        <title>Terms of Service - Ecouter Transcribe</title>
        <meta name="description" content="Terms of Service for Ecouter Transcribe. Read our terms and conditions for using our audio transcription and AI services." />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        <Navbar user={user} onLogout={logout} />

        <div className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text text-center">
              Terms of Service
            </h1>
            <p className="text-gray-400 text-center mb-12">
              Last updated: January 21, 2025
            </p>

            <div className="prose prose-lg prose-invert max-w-none">
              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">1. Acceptance of Terms</h2>
                
                <p className="text-gray-300 mb-4">
                  By accessing and using Ecouter Transcribe ("the Service"), you accept and agree to be bound 
                  by the terms and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>

                <p className="text-gray-300 mb-4">
                  These Terms of Service ("Terms") govern your use of our audio transcription platform, 
                  AI-powered features, and related services operated by Ecouter Transcribe ("we," "us," or "our").
                </p>

                <p className="text-gray-300">
                  We reserve the right to modify these terms at any time. We will notify users of any 
                  material changes via email or through our platform. Your continued use of the Service 
                  after such modifications constitutes acceptance of the updated terms.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">2. Description of Service</h2>
                
                <p className="text-gray-300 mb-4">
                  Ecouter Transcribe provides:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Audio-to-text transcription services</li>
                  <li>AI-powered conversation and chat capabilities</li>
                  <li>Document summarization and analysis</li>
                  <li>File management and storage</li>
                  <li>API access for developers</li>
                  <li>Integration tools and workflows</li>
                </ul>

                <p className="text-gray-300 mb-4">
                  Our service uses advanced machine learning algorithms to convert spoken audio into written text 
                  and provide intelligent insights through AI-powered conversations.
                </p>

                <p className="text-gray-300">
                  We strive to provide accurate transcriptions, but cannot guarantee 100% accuracy due to factors 
                  such as audio quality, background noise, accents, and technical limitations.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">3. User Accounts and Registration</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Account Creation</h3>
                <p className="text-gray-300 mb-4">
                  To use our services, you must:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Be at least 13 years old (or the minimum age in your jurisdiction)</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Account Security</h3>
                <p className="text-gray-300 mb-4">
                  You are responsible for:
                </p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Keeping your login credentials confidential</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                  <li>Using strong passwords and enabling two-factor authentication when available</li>
                  <li>Regularly updating your account information</li>
                </ul>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">4. Acceptable Use Policy</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Permitted Uses</h3>
                <p className="text-gray-300 mb-4">
                  You may use our service for legitimate purposes, including:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Transcribing meetings, interviews, and conversations</li>
                  <li>Creating accessible content from audio materials</li>
                  <li>Analyzing and summarizing audio content</li>
                  <li>Educational and research purposes</li>
                  <li>Business and professional documentation</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Prohibited Uses</h3>
                <p className="text-gray-300 mb-4">
                  You agree not to use our service for:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Illegal activities or content that violates laws or regulations</li>
                  <li>Uploading copyrighted material without proper authorization</li>
                  <li>Processing content that contains hate speech, harassment, or threats</li>
                  <li>Attempting to reverse engineer or interfere with our technology</li>
                  <li>Uploading malware, viruses, or malicious code</li>
                  <li>Violating privacy rights of individuals without consent</li>
                  <li>Spamming or automated abuse of our systems</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Content Responsibility</h3>
                <p className="text-gray-300">
                  You are solely responsible for the content you upload and process through our service. 
                  You must have the legal right to use and share any audio content you submit for transcription.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">5. Pricing and Payment</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Subscription Plans</h3>
                <p className="text-gray-300 mb-4">
                  We offer various subscription plans with different features and usage limits. 
                  Current pricing is available on our website and may change with notice.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">Payment Terms</h3>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Payments are processed securely through third-party providers</li>
                  <li>Subscriptions automatically renew unless cancelled</li>
                  <li>Refunds are subject to our refund policy</li>
                  <li>You are responsible for applicable taxes</li>
                  <li>Usage overages may incur additional charges</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Cancellation and Refunds</h3>
                <p className="text-gray-300 mb-4">
                  You may cancel your subscription at any time. Cancellations take effect at the end 
                  of the current billing period. We offer refunds within 30 days of purchase for 
                  unused services, subject to review.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">6. Intellectual Property</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Our Intellectual Property</h3>
                <p className="text-gray-300 mb-4">
                  The Service and its original content, features, and functionality are owned by 
                  Ecouter Transcribe and are protected by international copyright, trademark, patent, 
                  trade secret, and other intellectual property laws.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">Your Content</h3>
                <p className="text-gray-300 mb-4">
                  You retain ownership of your original audio files and content. By using our service, 
                  you grant us a limited license to:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Process your audio files to provide transcription services</li>
                  <li>Store and transmit your content as necessary for service delivery</li>
                  <li>Use anonymized data for service improvement (with your consent)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Generated Content</h3>
                <p className="text-gray-300">
                  Transcripts, summaries, and AI-generated content based on your uploaded files 
                  belong to you. We do not claim ownership of the output generated from your content.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">7. Privacy and Data Protection</h2>
                
                <p className="text-gray-300 mb-4">
                  Your privacy is important to us. Our Privacy Policy explains how we collect, use, 
                  and protect your information when you use our Service.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">Data Security</h3>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>We encrypt all data in transit and at rest</li>
                  <li>Access to your data is strictly limited and logged</li>
                  <li>We regularly audit our security practices</li>
                  <li>We do not sell or share your personal data with third parties</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Data Retention</h3>
                <p className="text-gray-300">
                  We retain your data only as long as necessary to provide our services or as 
                  required by law. You can delete your data at any time through your account settings.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">8. Service Availability and Limitations</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Service Availability</h3>
                <p className="text-gray-300 mb-4">
                  We strive to maintain high service availability but cannot guarantee uninterrupted service. 
                  We may experience downtime for maintenance, updates, or technical issues.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">Usage Limits</h3>
                <p className="text-gray-300 mb-4">
                  Your usage is subject to the limits of your chosen plan, including:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Monthly transcription minutes</li>
                  <li>File size and format restrictions</li>
                  <li>API request limits</li>
                  <li>Storage quotas</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Accuracy Disclaimer</h3>
                <p className="text-gray-300">
                  While we use advanced technology to provide accurate transcriptions, we cannot 
                  guarantee 100% accuracy. Factors such as audio quality, background noise, and 
                  speaker accents may affect transcription quality.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">9. Disclaimers and Limitations of Liability</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Disclaimer of Warranties</h3>
                <p className="text-gray-300 mb-4">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS 
                  OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS 
                  FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">Limitation of Liability</h3>
                <p className="text-gray-300 mb-4">
                  IN NO EVENT SHALL ECOUTER TRANSCRIBE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
                  WHETHER INCURRED DIRECTLY OR INDIRECTLY.
                </p>

                <p className="text-gray-300">
                  Our total liability to you for any claims arising from or related to this agreement 
                  shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">10. Termination</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Termination by You</h3>
                <p className="text-gray-300 mb-4">
                  You may terminate your account at any time by:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Cancelling your subscription through your account settings</li>
                  <li>Contacting our support team</li>
                  <li>Following the account deletion process</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Termination by Us</h3>
                <p className="text-gray-300 mb-4">
                  We may terminate or suspend your account immediately if you:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
                  <li>Violate these Terms of Service</li>
                  <li>Engage in prohibited activities</li>
                  <li>Fail to pay subscription fees</li>
                  <li>Abuse or misuse our services</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">Effects of Termination</h3>
                <p className="text-gray-300">
                  Upon termination, your access to the service will cease, and we may delete your 
                  account data after a reasonable retention period as outlined in our Privacy Policy.
                </p>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">11. Governing Law and Dispute Resolution</h2>
                
                <p className="text-gray-300 mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of the 
                  State of California, without regard to its conflict of law principles.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">Dispute Resolution</h3>
                <p className="text-gray-300 mb-4">
                  Most disputes can be resolved through our customer support. For unresolved disputes:
                </p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>We encourage informal resolution first</li>
                  <li>Binding arbitration may be required for certain disputes</li>
                  <li>Class action waivers may apply</li>
                  <li>Some disputes may be resolved in small claims court</li>
                </ul>
              </div>

              <div className="file-card p-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">12. Contact Information</h2>
                
                <p className="text-gray-300 mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                
                <div className="space-y-2 text-gray-300">
                  <p><strong>Email:</strong> legal@ecouter.ai</p>
                  <p><strong>Support:</strong> support@ecouter.ai</p>
                  <p><strong>Address:</strong> 123 Legal Lane, Terms City, TC 12345</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                </div>
                
                <p className="text-gray-400 mt-8 text-sm">
                  These terms constitute the entire agreement between you and Ecouter Transcribe 
                  regarding the use of our service and supersede all prior agreements and understandings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
