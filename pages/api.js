import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import FloatingBubbles from '../components/FloatingBubbles';
import { FiCode, FiZap, FiShield, FiGlobe, FiClock, FiTool } from 'react-icons/fi';
import { useAuth } from '../components/AuthContext';

export default function API() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      icon: FiZap,
      title: 'Lightning Fast',
      description: 'Process audio files with industry-leading speed and efficiency'
    },
    {
      icon: FiShield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime SLA'
    },
    {
      icon: FiGlobe,
      title: 'Global CDN',
      description: 'Optimized performance worldwide with edge locations'
    },
    {
      icon: FiTool,
      title: 'Easy Integration',
      description: 'RESTful API with comprehensive documentation and SDKs'
    }
  ];

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/transcribe',
      description: 'Upload and transcribe audio/video files'
    },
    {
      method: 'GET',
      path: '/api/v1/transcriptions/{id}',
      description: 'Get transcription results by ID'
    },
    {
      method: 'GET',
      path: '/api/v1/transcriptions',
      description: 'List all transcriptions with pagination'
    },
    {
      method: 'DELETE',
      path: '/api/v1/transcriptions/{id}',
      description: 'Delete a transcription'
    },
    {
      method: 'POST',
      path: '/api/v1/chat',
      description: 'Chat with AI about transcription content'
    }
  ];

  const codeExamples = {
    curl: `curl -X POST "https://api.ecouter.com/v1/transcribe" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@audio.mp3" \\
  -F "language=en" \\
  -F "speaker_identification=true"`,
    
    javascript: `const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('audio.mp3'));
form.append('language', 'en');
form.append('speaker_identification', 'true');

const response = await fetch('https://api.ecouter.com/v1/transcribe', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    ...form.getHeaders()
  },
  body: form
});

const result = await response.json();
console.log(result);`,
    
    python: `import requests

url = "https://api.ecouter.com/v1/transcribe"
headers = {"Authorization": "Bearer YOUR_API_KEY"}

files = {"file": open("audio.mp3", "rb")}
data = {
    "language": "en",
    "speaker_identification": "true"
}

response = requests.post(url, headers=headers, files=files, data=data)
result = response.json()
print(result)`
  };

  return (
    <>
      <Head>
        <title>API Documentation - Ecouter Transcribe</title>
        <meta name="description" content="Integrate AI-powered transcription into your applications with our robust REST API. Complete documentation and code examples included." />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        <Navbar user={user} onLogout={logout} />

        {/* Hero Section */}
        <section className="pt-24 pb-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Developer API
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
              Integrate AI-powered transcription into your applications with our robust REST API. 
              Simple, fast, and reliable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup"
                className="px-8 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Get API Key
              </Link>
              <Link 
                href="#docs"
                className="px-8 py-3 border border-gray-600 text-white rounded-lg font-semibold hover:border-gray-500 transition-colors"
              >
                View Docs
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
                API Features
              </h2>
              <p className="text-gray-400 text-lg">
                Built for developers, designed for scale
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="file-card p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-white/20 to-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* API Documentation */}
        <section id="docs" className="py-20 px-6 bg-gray-900/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
                API Documentation
              </h2>
              <p className="text-gray-400 text-lg">
                Everything you need to get started
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap justify-center mb-8 border-b border-gray-700">
              {['overview', 'endpoints', 'examples'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="max-w-4xl mx-auto">
              {activeTab === 'overview' && (
                <div className="file-card p-8">
                  <h3 className="text-2xl font-bold mb-6">Getting Started</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Authentication</h4>
                      <p className="text-gray-400 mb-4">
                        All API requests require authentication using your API key in the Authorization header:
                      </p>
                      <div className="bg-gray-900 p-4 rounded-lg">
                        <code className="text-green-400">Authorization: Bearer YOUR_API_KEY</code>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Base URL</h4>
                      <div className="bg-gray-900 p-4 rounded-lg">
                        <code className="text-blue-400">https://api.ecouter.com/v1</code>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Rate Limits</h4>
                      <ul className="text-gray-400 space-y-2">
                        <li>• Free tier: 10 requests per hour</li>
                        <li>• Pro tier: 1,000 requests per hour</li>
                        <li>• Business tier: 10,000 requests per hour</li>
                        <li>• Enterprise: Custom limits</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'endpoints' && (
                <div className="file-card p-8">
                  <h3 className="text-2xl font-bold mb-6">API Endpoints</h3>
                  <div className="space-y-6">
                    {endpoints.map((endpoint, index) => (
                      <div key={index} className="border-b border-gray-700 pb-4 last:border-b-0">
                        <div className="flex items-center mb-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded mr-3 ${
                            endpoint.method === 'GET' ? 'bg-green-600' :
                            endpoint.method === 'POST' ? 'bg-blue-600' :
                            'bg-red-600'
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-blue-400">{endpoint.path}</code>
                        </div>
                        <p className="text-gray-400">{endpoint.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'examples' && (
                <div className="file-card p-8">
                  <h3 className="text-2xl font-bold mb-6">Code Examples</h3>
                  <div className="space-y-8">
                    {Object.entries(codeExamples).map(([language, code]) => (
                      <div key={language}>
                        <h4 className="text-lg font-semibold mb-3 capitalize">{language}</h4>
                        <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                          <pre className="text-sm text-gray-300">
                            <code>{code}</code>
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Build?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Get your API key and start integrating in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup"
                className="px-8 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Get API Key
              </Link>
              <Link 
                href="/contact"
                className="px-8 py-3 border border-gray-600 text-white rounded-lg font-semibold hover:border-gray-500 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
