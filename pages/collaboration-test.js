import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CollaborationTest() {
  const router = useRouter();
  const [testEmail, setTestEmail] = useState('');
  const [testFileId, setTestFileId] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);

  const testEmailSystem = async () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: testEmail }),
      });

      const data = await response.json();
      setTestResults({
        type: 'email',
        success: response.ok,
        message: data.message,
        service: data.service,
        timestamp: data.timestamp
      });

    } catch (error) {
      setTestResults({
        type: 'email',
        success: false,
        message: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const testCollaborationInvite = async () => {
    if (!testEmail || !testFileId) {
      alert('Please enter both email and file ID');
      return;
    }

    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setTestResults({
          type: 'collaboration',
          success: false,
          message: 'Please log in first'
        });
        return;
      }

      const response = await fetch(`/api/files/${testFileId}/collaborate/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          email: testEmail,
          permission: 'edit'
        }),
      });

      const data = await response.json();
      setTestResults({
        type: 'collaboration',
        success: response.ok,
        message: data.message,
        collaborator: data.collaborator
      });

    } catch (error) {
      setTestResults({
        type: 'collaboration',
        success: false,
        message: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Head>
        <title>Collaboration System Test - Écouter</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🧪 Collaboration System Test
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Email Test */}
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  📧 Email System Test
                </h2>
                <p className="text-blue-700 mb-4">
                  Test if the email service is working with your SMTP configuration.
                </p>
                
                <div className="space-y-4">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter test email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                  <button
                    onClick={testEmailSystem}
                    disabled={testing || !testEmail}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testing ? 'Sending Test Email...' : 'Send Test Email'}
                  </button>
                </div>
              </div>
            </div>

            {/* Collaboration Test */}
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-green-900 mb-4">
                  👥 Collaboration Invite Test
                </h2>
                <p className="text-green-700 mb-4">
                  Test sending a real collaboration invitation.
                </p>
                
                <div className="space-y-4">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter collaborator email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  
                  <input
                    type="text"
                    value={testFileId}
                    onChange={(e) => setTestFileId(e.target.value)}
                    placeholder="Enter file ID (from URL)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  
                  <button
                    onClick={testCollaborationInvite}
                    disabled={testing || !testEmail || !testFileId}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testing ? 'Sending Invitation...' : 'Send Collaboration Invite'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="mt-8">
              <div className={`border rounded-lg p-6 ${
                testResults.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  testResults.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {testResults.success ? '✅ Test Successful' : '❌ Test Failed'}
                </h3>
                
                <div className={`text-sm space-y-2 ${
                  testResults.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  <p><strong>Type:</strong> {testResults.type === 'email' ? 'Email System' : 'Collaboration Invite'}</p>
                  <p><strong>Message:</strong> {testResults.message}</p>
                  
                  {testResults.service && (
                    <p><strong>Email Service:</strong> {testResults.service}</p>
                  )}
                  
                  {testResults.timestamp && (
                    <p><strong>Timestamp:</strong> {new Date(testResults.timestamp).toLocaleString()}</p>
                  )}
                  
                  {testResults.collaborator && (
                    <div>
                      <p><strong>Collaborator Added:</strong></p>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(testResults.collaborator, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documentation */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📖 How It Works
            </h3>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900">Email Test:</h4>
                <p>Sends a test email using your configured SMTP settings (Gmail or Brevo) to verify the email system is working.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900">Collaboration Invite:</h4>
                <p>Sends a real collaboration invitation email with a secure token. The recipient will get a professional email with a "Join Collaboration" button.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900">Join Process:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Recipient clicks "Join Collaboration" in email</li>
                  <li>They're taken to a verification page</li>
                  <li>If not logged in, they're prompted to sign in</li>
                  <li>Once authenticated, they're added as a collaborator</li>
                  <li>They're redirected to the edit page with collaboration enabled</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}