import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import FloatingBubbles from '../components/FloatingBubbles';
import { FiCheck, FiX, FiSettings } from 'react-icons/fi';
import { useAuth } from '../components/AuthContext';

export default function Cookies() {
  const { user, logout } = useAuth();
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false,
    personalization: true
  });

  const handlePreferenceChange = (type) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    setCookiePreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const savePreferences = () => {
    // Here you would typically save preferences to localStorage or send to server
    console.log('Saving cookie preferences:', cookiePreferences);
    alert('Cookie preferences saved successfully!');
  };

  return (
    <>
      <Head>
        <title>Cookie Policy - Ecouter Transcribe</title>
        <meta name="description" content="Cookie Policy for Ecouter Transcribe. Learn about how we use cookies and similar technologies on our website and services." />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        <Navbar user={user} onLogout={logout} />

        <div className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text text-center">
              Cookie Policy
            </h1>
            <p className="text-gray-400 text-center mb-12">
              Last updated: January 21, 2025
            </p>

            {/* Cookie Preferences Panel */}
            <div className="file-card p-8 mb-8 border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <FiSettings className="w-6 h-6 text-blue-400 mr-3" />
                <h2 className="text-2xl font-bold gradient-text">Cookie Preferences</h2>
              </div>
              
              <p className="text-gray-300 mb-6">
                Manage your cookie preferences below. Essential cookies cannot be disabled as they are 
                necessary for the website to function properly.
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Essential Cookies</h3>
                    <p className="text-gray-400 text-sm">Required for basic website functionality</p>
                  </div>
                  <div className="text-green-400">
                    <FiCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Analytics Cookies</h3>
                    <p className="text-gray-400 text-sm">Help us understand how you use our website</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('analytics')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      cookiePreferences.analytics ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      cookiePreferences.analytics ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Marketing Cookies</h3>
                    <p className="text-gray-400 text-sm">Used to show you relevant advertisements</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('marketing')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      cookiePreferences.marketing ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      cookiePreferences.marketing ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Personalization Cookies</h3>
                    <p className="text-gray-400 text-sm">Remember your preferences and settings</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('personalization')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      cookiePreferences.personalization ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      cookiePreferences.personalization ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              <button
                onClick={savePreferences}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Save Preferences
              </button>
            </div>

            <div className="prose prose-lg prose-invert max-w-none">
              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">1. What Are Cookies?</h2>
                
                <p className="text-gray-300 mb-4">
                  Cookies are small text files that are placed on your computer or mobile device when you 
                  visit our website. They are widely used to make websites work more efficiently and to 
                  provide information to the owners of the site.
                </p>

                <p className="text-gray-300 mb-4">
                  Cookies contain information that is transferred to your computer's hard drive. They help us:
                </p>
                <ul className="list-disc pl-6 text-gray-300 space-y-2">
                  <li>Remember your login status and preferences</li>
                  <li>Understand how you use our website</li>
                  <li>Improve your browsing experience</li>
                  <li>Provide personalized content and features</li>
                  <li>Analyze website traffic and usage patterns</li>
                </ul>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">2. Types of Cookies We Use</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Essential Cookies</h3>
                <p className="text-gray-300 mb-4">
                  These cookies are necessary for the website to function properly. They enable basic functions 
                  like page navigation, access to secure areas, and form submissions. The website cannot function 
                  properly without these cookies.
                </p>
                
                <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-white mb-2">Examples:</h4>
                  <ul className="list-disc pl-6 text-gray-300 space-y-1">
                    <li>Session management cookies</li>
                    <li>Authentication tokens</li>
                    <li>Security cookies</li>
                    <li>Load balancing cookies</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-white">Analytics Cookies</h3>
                <p className="text-gray-300 mb-4">
                  These cookies help us understand how visitors interact with our website by collecting and 
                  reporting information anonymously. This helps us improve our website's performance and user experience.
                </p>
                
                <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-white mb-2">Examples:</h4>
                  <ul className="list-disc pl-6 text-gray-300 space-y-1">
                    <li>Google Analytics cookies</li>
                    <li>Page view tracking</li>
                    <li>User journey analysis</li>
                    <li>Performance monitoring</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-white">Personalization Cookies</h3>
                <p className="text-gray-300 mb-4">
                  These cookies allow the website to remember choices you make and provide enhanced, 
                  more personal features. They may be set by us or by third-party providers whose 
                  services we have added to our pages.
                </p>
                
                <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-white mb-2">Examples:</h4>
                  <ul className="list-disc pl-6 text-gray-300 space-y-1">
                    <li>Language preferences</li>
                    <li>Theme settings</li>
                    <li>Dashboard layout preferences</li>
                    <li>Recently used features</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-white">Marketing Cookies</h3>
                <p className="text-gray-300 mb-4">
                  These cookies track your online activity to help advertisers deliver more relevant 
                  advertising or to limit how many times you see an ad. They may be used to build a 
                  profile of your interests and show you relevant adverts on other sites.
                </p>
                
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Examples:</h4>
                  <ul className="list-disc pl-6 text-gray-300 space-y-1">
                    <li>Advertising targeting cookies</li>
                    <li>Social media tracking pixels</li>
                    <li>Retargeting cookies</li>
                    <li>Conversion tracking</li>
                  </ul>
                </div>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">3. Third-Party Cookies</h2>
                
                <p className="text-gray-300 mb-4">
                  We may use third-party services that set cookies on your device. These services help us 
                  provide better functionality and analyze how our website is used.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">Third-Party Services We Use:</h3>
                <div className="space-y-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Google Analytics</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      Helps us understand website usage and improve user experience.
                    </p>
                    <p className="text-gray-400 text-xs">
                      Privacy Policy: <a href="https://policies.google.com/privacy" className="text-blue-400 hover:underline">https://policies.google.com/privacy</a>
                    </p>
                  </div>

                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Stripe</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      Processes payments securely and prevents fraud.
                    </p>
                    <p className="text-gray-400 text-xs">
                      Privacy Policy: <a href="https://stripe.com/privacy" className="text-blue-400 hover:underline">https://stripe.com/privacy</a>
                    </p>
                  </div>

                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Intercom</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      Provides customer support chat functionality.
                    </p>
                    <p className="text-gray-400 text-xs">
                      Privacy Policy: <a href="https://www.intercom.com/privacy" className="text-blue-400 hover:underline">https://www.intercom.com/privacy</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">4. Cookie Duration</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Session Cookies</h3>
                <p className="text-gray-300 mb-4">
                  These are temporary cookies that are deleted when you close your browser. 
                  They help maintain your session and keep you logged in while browsing our website.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">Persistent Cookies</h3>
                <p className="text-gray-300 mb-4">
                  These cookies remain on your device for a set period or until you delete them. 
                  They remember your preferences and settings for future visits.
                </p>

                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Typical Duration:</h4>
                  <ul className="list-disc pl-6 text-gray-300 space-y-1">
                    <li>Session cookies: Until browser is closed</li>
                    <li>Authentication cookies: 30 days</li>
                    <li>Preference cookies: 1 year</li>
                    <li>Analytics cookies: 2 years</li>
                    <li>Marketing cookies: 30-90 days</li>
                  </ul>
                </div>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">5. Managing Your Cookies</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">Browser Settings</h3>
                <p className="text-gray-300 mb-4">
                  You can control and manage cookies through your browser settings. Most browsers 
                  allow you to refuse or delete cookies, but this may impact your experience on our website.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Chrome</h4>
                    <p className="text-gray-300 text-sm">
                      Settings → Advanced → Privacy and security → Cookies and other site data
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Firefox</h4>
                    <p className="text-gray-300 text-sm">
                      Options → Privacy & Security → Cookies and Site Data
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Safari</h4>
                    <p className="text-gray-300 text-sm">
                      Preferences → Privacy → Cookies and website data
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Edge</h4>
                    <p className="text-gray-300 text-sm">
                      Settings → Cookies and site permissions → Cookies and site data
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-white">Do Not Track</h3>
                <p className="text-gray-300 mb-4">
                  Some browsers have a "Do Not Track" feature that sends a signal to websites you visit 
                  indicating that you do not want to be tracked. We respect these signals and will not 
                  track users who have enabled this feature.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">Opt-Out Tools</h3>
                <p className="text-gray-300">
                  You can opt out of certain tracking cookies through industry opt-out tools:
                </p>
                <ul className="list-disc pl-6 text-gray-300 mt-2 space-y-1">
                  <li>Network Advertising Initiative: <a href="http://www.networkadvertising.org/managing/opt_out.asp" className="text-blue-400 hover:underline">opt-out page</a></li>
                  <li>Digital Advertising Alliance: <a href="http://www.aboutads.info/choices/" className="text-blue-400 hover:underline">consumer choice page</a></li>
                  <li>Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-400 hover:underline">browser add-on</a></li>
                </ul>
              </div>

              <div className="file-card p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">6. Updates to This Policy</h2>
                
                <p className="text-gray-300 mb-4">
                  We may update this Cookie Policy from time to time to reflect changes in our practices 
                  or for other operational, legal, or regulatory reasons.
                </p>

                <p className="text-gray-300">
                  When we make changes, we will update the "Last updated" date at the top of this policy 
                  and notify you through our website or by email if the changes are significant.
                </p>
              </div>

              <div className="file-card p-8">
                <h2 className="text-2xl font-bold mb-4 gradient-text">7. Contact Us</h2>
                
                <p className="text-gray-300 mb-4">
                  If you have any questions about our use of cookies or this Cookie Policy, please contact us:
                </p>
                
                <div className="space-y-2 text-gray-300">
                  <p><strong>Email:</strong> privacy@ecouter.ai</p>
                  <p><strong>Support:</strong> support@ecouter.ai</p>
                  <p><strong>Address:</strong> 123 Cookie Lane, Data City, DC 12345</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
