import Head from 'next/head';
import { useState } from 'react';
import { useAuth } from '../components/AuthContext';

export default function DebugUpload() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const testPresignedUrl = async () => {
    setTesting(true);
    setLogs([]);
    addLog('🧪 Testing presigned URL endpoint...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addLog('❌ No auth token found', 'error');
        return;
      }
      addLog('✅ Auth token found');

      addLog('📡 Making request to /api/upload/presigned-url...');
      
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: 'test-large-file.mp4',
          fileType: 'video/mp4',
          fileSize: 5 * 1024 * 1024, // 5MB
        }),
      });

      addLog(`📊 Response status: ${response.status}`);
      
      const responseText = await response.text();
      addLog(`📄 Raw response: ${responseText.substring(0, 500)}...`);
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          addLog('✅ Presigned URL generated successfully!', 'success');
          addLog(`🔗 Presigned URL: ${data.presignedUrl?.substring(0, 100)}...`);
          addLog(`📂 File name: ${data.fileName}`);
          addLog(`🌍 Public URL: ${data.publicUrl}`);
        } catch (parseError) {
          addLog(`❌ Failed to parse JSON response: ${parseError.message}`, 'error');
        }
      } else {
        addLog(`❌ API Error (${response.status}): ${responseText}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Network Error: ${error.message}`, 'error');
      console.error('Full error:', error);
    } finally {
      setTesting(false);
    }
  };

  const testDirectUpload = async () => {
    setTesting(true);
    setLogs([]);
    addLog('🧪 Testing complete direct upload flow...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addLog('❌ No auth token found', 'error');
        return;
      }

      // Step 1: Get presigned URL
      addLog('1️⃣ Getting presigned URL...');
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: 'test-upload.mp4',
          fileType: 'video/mp4',
          fileSize: 5 * 1024 * 1024, // 5MB
        }),
      });

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        addLog(`❌ Presigned URL failed: ${errorText}`, 'error');
        return;
      }

      const { presignedUrl, fileName, publicUrl } = await presignedResponse.json();
      addLog('✅ Presigned URL obtained');

      // Step 2: Test upload to R2 (with dummy data)
      addLog('2️⃣ Testing upload to R2...');
      const dummyData = new Blob(['test video data'], { type: 'video/mp4' });
      
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: dummyData,
        headers: {
          'Content-Type': 'video/mp4',
        },
      });

      if (!uploadResponse.ok) {
        addLog(`❌ R2 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`, 'error');
        return;
      }
      addLog('✅ Upload to R2 successful');

      // Step 3: Confirm upload
      addLog('3️⃣ Confirming upload...');
      const confirmResponse = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: 'test-upload.mp4',
          fileSize: dummyData.size,
          fileType: 'video/mp4',
          fileUrl: publicUrl,
          fileKey: fileName,
          language: 'en',
          quality: 'standard',
          speakerIdentification: false,
          includeTimestamps: true,
          filterProfanity: false,
          autoPunctuation: true,
        }),
      });

      if (!confirmResponse.ok) {
        const errorText = await confirmResponse.text();
        addLog(`❌ Confirm upload failed: ${errorText}`, 'error');
        return;
      }

      const confirmData = await confirmResponse.json();
      addLog('✅ Upload confirmed and transcription started!', 'success');
      addLog(`📄 File ID: ${confirmData.fileId}`);

    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to debug uploads</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Debug Large File Upload | Ecouter</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🔍 Debug Large File Upload</h1>
          
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Tests</h2>
              <div className="space-x-4">
                <button
                  onClick={testPresignedUrl}
                  disabled={testing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-4 py-2 rounded-lg"
                >
                  {testing ? 'Testing...' : 'Test Presigned URL'}
                </button>
                
                <button
                  onClick={testDirectUpload}
                  disabled={testing}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-4 py-2 rounded-lg"
                >
                  {testing ? 'Testing...' : 'Test Full Upload Flow'}
                </button>
                
                <button
                  onClick={() => setLogs([])}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">📋 Debug Logs</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-400">No logs yet. Run a test to see debug information.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`text-sm p-2 rounded ${
                      log.type === 'error' ? 'bg-red-900/30 text-red-300' :
                      log.type === 'success' ? 'bg-green-900/30 text-green-300' :
                      'bg-blue-900/30 text-blue-300'
                    }`}>
                      <span className="text-gray-400 text-xs mr-2">{log.timestamp}</span>
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
