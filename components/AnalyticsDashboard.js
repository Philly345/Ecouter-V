// AI-Powered Analytics Dashboard Component
import { useState, useEffect } from 'react';
import { FiTrendingUp, FiUsers, FiClock, FiTarget, FiMessageCircle, FiBarChart3, FiPieChart, FiActivity, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const AnalyticsDashboard = ({ fileId, onAnalyticsUpdate }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    // Only fetch analytics on client side
    if (fileId && typeof window !== 'undefined') {
      fetchAnalytics();
    }
  }, [fileId]);

  const fetchAnalytics = async (forceRegenerate = false) => {
    try {
      setLoading(true);
      setError('');
      
      // Check if we're on the client side
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
        body: JSON.stringify({ forceRegenerate })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      
      if (onAnalyticsUpdate) {
        onAnalyticsUpdate(data.analytics);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    await fetchAnalytics(true);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
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
        <div className="flex items-center space-x-3">
          <FiAlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">Error: {error}</span>
        </div>
        <button
          onClick={() => fetchAnalytics()}
          className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Regenerate Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <FiBarChart3 className="w-5 h-5" />
          <span>AI-Powered Meeting Insights</span>
        </h2>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-colors flex items-center space-x-2"
        >
          <FiRefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
        </button>
      </div>

      {/* Overall Score */}
      <div className={`rounded-xl border p-6 ${getScoreBgColor(analytics.overallScore)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-1">Overall Meeting Score</h3>
            <p className="text-white/60 text-sm">Comprehensive effectiveness rating</p>
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(analytics.overallScore)}`}>
            {analytics.overallScore}/100
          </div>
        </div>
      </div>

      {/* Meeting Effectiveness Breakdown */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
          <FiTarget className="w-5 h-5" />
          <span>Meeting Effectiveness</span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(analytics.effectiveness.breakdown).map(([key, value]) => (
            <div key={key} className="bg-white/5 rounded-lg p-3">
              <div className="text-white/60 text-xs uppercase tracking-wide mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className={`text-lg font-semibold ${getScoreColor(value)}`}>
                {value}/100
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center space-x-1">
              <FiCheckCircle className="w-4 h-4 text-green-400" />
              <span>Strengths</span>
            </h4>
            <ul className="space-y-1">
              {analytics.effectiveness.strengths.map((strength, index) => (
                <li key={index} className="text-white/70 text-sm">• {strength}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center space-x-1">
              <FiTrendingUp className="w-4 h-4 text-yellow-400" />
              <span>Improvements</span>
            </h4>
            <ul className="space-y-1">
              {analytics.effectiveness.improvements.map((improvement, index) => (
                <li key={index} className="text-white/70 text-sm">• {improvement}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Speaking Time Analysis */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
          <FiUsers className="w-5 h-5" />
          <span>Speaking Time Analysis</span>
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-white/60 text-sm mb-1">Total Speaking Time</div>
            <div className="text-xl font-semibold text-white">
              {Math.floor(analytics.speakingAnalysis.totalEstimatedTime / 60)}m {analytics.speakingAnalysis.totalEstimatedTime % 60}s
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-white/60 text-sm mb-1">Engagement Level</div>
            <div className={`text-xl font-semibold ${getScoreColor(analytics.speakingAnalysis.engagementLevel)}`}>
              {Math.round(analytics.speakingAnalysis.engagementLevel)}%
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-white/60 text-sm mb-1">Dominance Index</div>
            <div className={`text-xl font-semibold ${analytics.speakingAnalysis.dominanceIndex > 3 ? 'text-red-400' : 'text-green-400'}`}>
              {analytics.speakingAnalysis.dominanceIndex.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Speaker Breakdown */}
        <div className="space-y-3">
          {Object.entries(analytics.speakingAnalysis.speakers).map(([speaker, stats]) => (
            <div key={speaker} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{speaker}</span>
                <span className="text-white/60 text-sm">{stats.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs text-white/60">
                <div>Words: {stats.wordCount}</div>
                <div>Segments: {stats.segments}</div>
                <div>Avg Length: {Math.round(stats.averageSegmentLength)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation Flow */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
          <FiMessageCircle className="w-5 h-5" />
          <span>Conversation Flow</span>
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className={`text-2xl font-bold mb-2 ${getScoreColor(analytics.conversationFlow.flowScore)}`}>
              {analytics.conversationFlow.flowScore}/100
            </div>
            <p className="text-white/60 text-sm mb-4">Flow Quality Score</p>
            
            {analytics.conversationFlow.keyMoments.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-2">Key Moments</h4>
                <div className="space-y-2">
                  {analytics.conversationFlow.keyMoments.slice(0, 3).map((moment, index) => (
                    <div key={index} className="bg-white/5 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 text-xs">{moment.time}</span>
                        <span className="text-white/60 text-xs capitalize">{moment.type}</span>
                      </div>
                      <div className="text-white text-sm">{moment.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div>
            {analytics.conversationFlow.interruptionPatterns && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Interruption Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Total Interruptions:</span>
                    <span className="text-white">{analytics.conversationFlow.interruptionPatterns.totalInterruptions}</span>
                  </div>
                  {analytics.conversationFlow.interruptionPatterns.mostInterruptive && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Most Interruptive:</span>
                      <span className="text-white">{analytics.conversationFlow.interruptionPatterns.mostInterruptive}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Topics & Sentiment */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
          <FiPieChart className="w-5 h-5" />
          <span>Topics & Sentiment Analysis</span>
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3">Main Topics</h4>
            <div className="space-y-2">
              {analytics.topicAnalysis.mainTopics.slice(0, 5).map((topic, index) => (
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
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Positive</span>
                  <span className="text-white">{analytics.topicAnalysis.sentimentAnalysis.positive}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${analytics.topicAnalysis.sentimentAnalysis.positive}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Neutral</span>
                  <span className="text-white">{analytics.topicAnalysis.sentimentAnalysis.neutral}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full"
                    style={{ width: `${analytics.topicAnalysis.sentimentAnalysis.neutral}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-red-400">Negative</span>
                  <span className="text-white">{analytics.topicAnalysis.sentimentAnalysis.negative}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${analytics.topicAnalysis.sentimentAnalysis.negative}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {analytics.topicAnalysis.actionableItems.length > 0 && (
              <div className="mt-4">
                <h4 className="text-white font-medium mb-2">Action Items</h4>
                <div className="space-y-2">
                  {analytics.topicAnalysis.actionableItems.slice(0, 3).map((item, index) => (
                    <div key={index} className="bg-white/5 rounded p-2 text-sm">
                      <div className="text-white">{item.item}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-white/60 text-xs">Assignee: {item.assignee}</span>
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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

export default AnalyticsDashboard;
