import Head from 'next/head';
import { useState } from 'react';
import { useAuth } from '../components/AuthContext';

export default function TestUpload() {
  const { user } = useAuth();
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testPresignedUrl = async () => {
    setLoading(true);
    setResult('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: 'test-audio.mp3',
          fileType: 'audio/mpeg',
          fileSize: 10 * 1024 * 1024, // 10MB
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Success!\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Error: ${data.error}\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSmallUpload = async () => {
    setLoading(true);
    setResult('Testing original upload endpoint...');

    try {
      const token = localStorage.getItem('token');
      
      // Create a dummy small file
      const dummyContent = 'test audio content';
      const file = new File([dummyContent], 'test-small.mp3', { type: 'audio/mpeg' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', 'en');
      formData.append('quality', 'standard');
      formData.append('speakerIdentification', 'false');
      formData.append('includeTimestamps', 'true');
      formData.append('filterProfanity', 'false');
      formData.append('autoPunctuation', 'true');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Small upload success!\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Small upload error: ${data.error}\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`❌ Small upload network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Please log in to test uploads</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Test Upload System | Ecouter</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Upload System Test</h1>
          
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Presigned URL (Large Files)</h2>
              <p className="text-white/60 mb-4">
                This tests the new direct upload system for files larger than 4MB
              </p>
              <button
                onClick={testPresignedUrl}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-4 py-2 rounded-lg"
              >
                {loading ? 'Testing...' : 'Test Presigned URL'}
              </button>
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Original Upload (Small Files)</h2>
              <p className="text-white/60 mb-4">
                This tests the original upload system for files smaller than 4MB
              </p>
              <button
                onClick={testSmallUpload}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-4 py-2 rounded-lg"
              >
                {loading ? 'Testing...' : 'Test Small Upload'}
              </button>
            </div>

            {result && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Result:</h3>
                <pre className="text-sm text-white/80 whitespace-pre-wrap overflow-auto">
                  {result}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
