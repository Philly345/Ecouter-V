// Integrations Management Page
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import IntegrationsManager from '../components/IntegrationsManager';

export default function Integrations() {
  const { user, logout, authChecked, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
    }
  }, [authChecked, user, router]);

  if (!authChecked || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (authChecked && !user) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Integrations - Ecouter Transcribe</title>
        <meta name="description" content="Connect your favorite tools and automate your workflow" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Integrations</h1>
            <p className="text-white/60">
              Connect your favorite tools and automate your transcription workflow
            </p>
          </div>

          {/* Integrations Manager */}
          <IntegrationsManager user={user} />

          {/* Features Overview */}
          <div className="mt-12 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">What You Can Do</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">📅 Calendar Auto-Upload</h3>
                <p className="text-white/60 text-sm">
                  Automatically detect and upload meeting recordings from your calendar events
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">💬 Slack Sharing</h3>
                <p className="text-white/60 text-sm">
                  Share transcripts and AI insights directly to your Slack channels with rich formatting
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">🔗 Teams Integration</h3>
                <p className="text-white/60 text-sm">
                  Post meeting summaries and analytics to Microsoft Teams channels
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">🔌 Webhook API</h3>
                <p className="text-white/60 text-sm">
                  Trigger custom workflows when transcriptions complete using webhooks
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">📊 Analytics Sharing</h3>
                <p className="text-white/60 text-sm">
                  Include AI-powered meeting insights and effectiveness scores in your shares
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">⚡ Real-time Notifications</h3>
                <p className="text-white/60 text-sm">
                  Get notified instantly when your transcriptions and analytics are ready
                </p>
              </div>
            </div>
          </div>

          {/* API Documentation Link */}
          <div className="mt-8 text-center">
            <p className="text-white/60 mb-4">
              Need more advanced integrations? Check out our API documentation.
            </p>
            <button
              onClick={() => window.open('/docs/api', '_blank')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              View API Documentation
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
