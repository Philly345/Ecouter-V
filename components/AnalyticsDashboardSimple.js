import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiUsers, FiBarChart3, FiActivity, FiRefreshCw } from 'react-icons/fi';

const AnalyticsDashboardSimple = ({ fileId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (fileId && typeof window !== 'undefined') {
      fetchAnalytics();
    }
  }, [fileId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (typeof window === 'undefined') {
        throw new Error('Analytics can only be fetched on client side');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/analytics/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ forceRegenerate: false })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center space-x-3">
          <FiActivity className="w-5 h-5 text-white animate-spin" />
          <span className="text-white/80">Generating AI insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <div className="text-red-400 mb-3">Error: {error}</div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="text-white/60">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <FiBarChart3 className="w-5 h-5" />
          <span>AI-Powered Meeting Insights</span>
        </h2>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-colors flex items-center space-x-2"
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overall Score */}
      <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-1">Overall Meeting Score</h3>
            <p className="text-white/60 text-sm">Comprehensive effectiveness rating</p>
          </div>
          <div className="text-3xl font-bold text-green-400">
            {analytics.overallScore || 85}/100
          </div>
        </div>
      </div>

      {/* Meeting Effectiveness */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
          <FiTrendingUp className="w-5 h-5" />
          <span>Meeting Effectiveness</span>
        </h3>
        
        {analytics.effectiveness && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(analytics.effectiveness.breakdown || {}).map(([key, value]) => (
              <div key={key} className="bg-white/5 rounded-lg p-3">
                <div className="text-white/60 text-xs uppercase tracking-wide mb-1">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-lg font-semibold text-green-400">
                  {value}/100
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Speaking Analysis */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
          <FiUsers className="w-5 h-5" />
          <span>Speaking Time Analysis</span>
        </h3>
        
        {analytics.speakingAnalysis && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">Total Speaking Time</div>
              <div className="text-xl font-semibold text-white">
                {Math.floor((analytics.speakingAnalysis.totalEstimatedTime || 0) / 60)}m {(analytics.speakingAnalysis.totalEstimatedTime || 0) % 60}s
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">Engagement Level</div>
              <div className="text-xl font-semibold text-blue-400">
                {Math.round(analytics.speakingAnalysis.engagementLevel || 0)}%
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-white/60 text-sm mb-1">Participants</div>
              <div className="text-xl font-semibold text-white">
                {Object.keys(analytics.speakingAnalysis.speakers || {}).length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Topics & Sentiment */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">Topics & Sentiment Analysis</h3>
        
        {analytics.topicAnalysis && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-3">Main Topics</h4>
              <div className="space-y-2">
                {(analytics.topicAnalysis.mainTopics || []).slice(0, 5).map((topic, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{topic.topic}</span>
                      <span className="text-white/60 text-xs">{topic.relevance}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        topic.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                        topic.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {topic.sentiment}
                      </span>
                      <span className="text-white/60 text-xs">{topic.mentions} mentions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-3">Sentiment Overview</h4>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="space-y-3">
                  {analytics.topicAnalysis.sentimentAnalysis && Object.entries(analytics.topicAnalysis.sentimentAnalysis).map(([sentiment, percentage]) => {
                    if (sentiment === 'overall') return null;
                    return (
                      <div key={sentiment}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`capitalize ${
                            sentiment === 'positive' ? 'text-green-400' :
                            sentiment === 'negative' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {sentiment}
                          </span>
                          <span className="text-white">{percentage}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              sentiment === 'positive' ? 'bg-green-500' :
                              sentiment === 'negative' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {analytics.recommendations && analytics.recommendations.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
            <FiTrendingUp className="w-5 h-5" />
            <span>AI Recommendations</span>
          </h3>
          <ul className="space-y-2">
            {analytics.recommendations.map((rec, index) => (
              <li key={index} className="text-white/80 text-sm flex items-start space-x-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboardSimple;
