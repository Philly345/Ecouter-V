// Integrations Management Component
import { useState, useEffect } from 'react';
import { FiCalendar, FiSlack, FiShare2, FiSettings, FiCheck, FiX, FiExternalLink, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

const IntegrationsManager = ({ user }) => {
  const [integrations, setIntegrations] = useState({
    calendar: null,
    slack: null,
    teams: null
  });
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      
      // Fetch calendar integration
      const calendarResponse = await fetch('/api/integrations/calendar', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Fetch bot integrations
      const botResponse = await fetch('/api/integrations/slack', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        setIntegrations(prev => ({ ...prev, calendar: calendarData.integration }));
      }

      if (botResponse.ok) {
        const botData = await botResponse.json();
        setIntegrations(prev => ({ 
          ...prev, 
          slack: botData.integrations.slack,
          teams: botData.integrations.teams
        }));
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarConnect = async () => {
    try {
      // In a real implementation, this would redirect to OAuth flow
      const { calendarType, accessToken, refreshToken } = formData;
      
      const response = await fetch('/api/integrations/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          calendarType,
          accessToken,
          refreshToken,
          settings: {
            autoUpload: formData.autoUpload || false,
            meetingKeywords: formData.meetingKeywords?.split(',').map(k => k.trim()) || ['meeting', 'call'],
            uploadDelay: parseInt(formData.uploadDelay) || 5
          }
        })
      });

      if (response.ok) {
        toast.success('Calendar integration connected successfully!');
        setActiveModal(null);
        fetchIntegrations();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to connect calendar');
      }
    } catch (error) {
      toast.error('Failed to connect calendar');
    }
  };

  const handleBotConnect = async (platform) => {
    try {
      const response = await fetch('/api/integrations/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'configure',
          platform,
          botToken: formData.botToken,
          webhookUrl: formData.webhookUrl,
          settings: {
            autoShare: formData.autoShare || false,
            defaultChannel: formData.defaultChannel,
            includeAnalyticsByDefault: formData.includeAnalyticsByDefault || false,
            notifyOnComplete: formData.notifyOnComplete || false
          }
        })
      });

      if (response.ok) {
        toast.success(`${platform} integration connected successfully!`);
        setActiveModal(null);
        fetchIntegrations();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to connect ${platform}`);
      }
    } catch (error) {
      toast.error(`Failed to connect ${platform}`);
    }
  };

  const handleDisconnect = async (integrationType) => {
    try {
      let endpoint = '/api/integrations/calendar';
      let method = 'DELETE';

      if (integrationType === 'slack' || integrationType === 'teams') {
        endpoint = '/api/integrations/slack';
        method = 'POST';
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        ...(method === 'POST' && {
          body: JSON.stringify({
            action: 'disconnect',
            platform: integrationType
          })
        })
      });

      if (response.ok) {
        toast.success(`${integrationType} integration disconnected`);
        fetchIntegrations();
      }
    } catch (error) {
      toast.error(`Failed to disconnect ${integrationType}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <FiSettings className="w-5 h-5" />
          <span>Integrations</span>
        </h2>
      </div>

      {/* Calendar Integration */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FiCalendar className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-lg font-medium text-white">Calendar Integration</h3>
              <p className="text-white/60 text-sm">Auto-upload meeting recordings from your calendar</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {integrations.calendar?.isActive ? (
              <>
                <div className="flex items-center space-x-1 text-green-400 text-sm">
                  <FiCheck className="w-4 h-4" />
                  <span>Connected</span>
                </div>
                <button
                  onClick={() => handleDisconnect('calendar')}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveModal('calendar')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center space-x-2"
              >
                <FiPlus className="w-4 h-4" />
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>

        {integrations.calendar?.isActive && (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Type:</span>
                <span className="ml-2 text-white capitalize">{integrations.calendar.type}</span>
              </div>
              <div>
                <span className="text-white/60">Connected:</span>
                <span className="ml-2 text-white">
                  {new Date(integrations.calendar.connectedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slack Integration */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FiSlack className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-lg font-medium text-white">Slack Integration</h3>
              <p className="text-white/60 text-sm">Share transcripts and analytics to Slack channels</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {integrations.slack?.isActive ? (
              <>
                <div className="flex items-center space-x-1 text-green-400 text-sm">
                  <FiCheck className="w-4 h-4" />
                  <span>Connected</span>
                </div>
                <button
                  onClick={() => handleDisconnect('slack')}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveModal('slack')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center space-x-2"
              >
                <FiPlus className="w-4 h-4" />
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>

        {integrations.slack?.isActive && (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm">
              <span className="text-white/60">Connected:</span>
              <span className="ml-2 text-white">
                {new Date(integrations.slack.connectedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Teams Integration */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FiShare2 className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="text-lg font-medium text-white">Microsoft Teams Integration</h3>
              <p className="text-white/60 text-sm">Share transcripts and analytics to Teams channels</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {integrations.teams?.isActive ? (
              <>
                <div className="flex items-center space-x-1 text-green-400 text-sm">
                  <FiCheck className="w-4 h-4" />
                  <span>Connected</span>
                </div>
                <button
                  onClick={() => handleDisconnect('teams')}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveModal('teams')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center space-x-2"
              >
                <FiPlus className="w-4 h-4" />
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>

        {integrations.teams?.isActive && (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm">
              <span className="text-white/60">Connected:</span>
              <span className="ml-2 text-white">
                {new Date(integrations.teams.connectedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* API Access */}
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FiExternalLink className="w-6 h-6 text-orange-400" />
          <div>
            <h3 className="text-lg font-medium text-white">API Access</h3>
            <p className="text-white/60 text-sm">Integrate with third-party applications using webhooks</p>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-white/60">Webhook Endpoint:</span>
              <code className="ml-2 text-white bg-black/50 px-2 py-1 rounded text-xs">
                POST /api/integrations/webhook
              </code>
            </div>
            <div>
              <span className="text-white/60">Authentication:</span>
              <span className="ml-2 text-white">Bearer Token (your login token)</span>
            </div>
            <div>
              <span className="text-white/60">Events:</span>
              <span className="ml-2 text-white">transcription_complete, analytics_generated</span>
            </div>
          </div>
          
          <button
            onClick={() => window.open('/docs/api', '_blank')}
            className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm flex items-center space-x-2"
          >
            <FiExternalLink className="w-4 h-4" />
            <span>View API Documentation</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'calendar' && (
        <CalendarConnectionModal
          onClose={() => setActiveModal(null)}
          onConnect={handleCalendarConnect}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {activeModal === 'slack' && (
        <SlackConnectionModal
          onClose={() => setActiveModal(null)}
          onConnect={() => handleBotConnect('slack')}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {activeModal === 'teams' && (
        <TeamsConnectionModal
          onClose={() => setActiveModal(null)}
          onConnect={() => handleBotConnect('teams')}
          formData={formData}
          setFormData={setFormData}
        />
      )}
    </div>
  );
};

// Calendar Connection Modal
const CalendarConnectionModal = ({ onClose, onConnect, formData, setFormData }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-black border border-white/20 rounded-xl p-6 w-full max-w-md mx-4">
      <h3 className="text-lg font-semibold mb-4 text-white">Connect Calendar</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Calendar Type</label>
          <select
            value={formData.calendarType || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, calendarType: e.target.value }))}
            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
          >
            <option value="">Select calendar type</option>
            <option value="google">Google Calendar</option>
            <option value="outlook">Outlook Calendar</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Meeting Keywords</label>
          <input
            type="text"
            placeholder="meeting, call, standup, sync"
            value={formData.meetingKeywords || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, meetingKeywords: e.target.value }))}
            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
          />
          <p className="text-xs text-white/50 mt-1">Comma-separated keywords to identify meetings</p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoUpload"
            checked={formData.autoUpload || false}
            onChange={(e) => setFormData(prev => ({ ...prev, autoUpload: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="autoUpload" className="text-sm text-white/80">
            Auto-upload recordings after meetings end
          </label>
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 border border-white/20 rounded-lg text-sm hover:bg-white/5 text-white"
        >
          Cancel
        </button>
        <button
          onClick={onConnect}
          className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
        >
          Connect
        </button>
      </div>
    </div>
  </div>
);

// Slack Connection Modal
const SlackConnectionModal = ({ onClose, onConnect, formData, setFormData }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-black border border-white/20 rounded-xl p-6 w-full max-w-md mx-4">
      <h3 className="text-lg font-semibold mb-4 text-white">Connect Slack</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Bot Token</label>
          <input
            type="password"
            placeholder="xoxb-your-bot-token"
            value={formData.botToken || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, botToken: e.target.value }))}
            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
          />
          <p className="text-xs text-white/50 mt-1">Get this from your Slack app settings</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Default Channel</label>
          <input
            type="text"
            placeholder="#general"
            value={formData.defaultChannel || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultChannel: e.target.value }))}
            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="includeAnalyticsByDefault"
            checked={formData.includeAnalyticsByDefault || false}
            onChange={(e) => setFormData(prev => ({ ...prev, includeAnalyticsByDefault: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="includeAnalyticsByDefault" className="text-sm text-white/80">
            Include analytics by default when sharing
          </label>
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 border border-white/20 rounded-lg text-sm hover:bg-white/5 text-white"
        >
          Cancel
        </button>
        <button
          onClick={onConnect}
          className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-sm text-white"
        >
          Connect
        </button>
      </div>
    </div>
  </div>
);

// Teams Connection Modal
const TeamsConnectionModal = ({ onClose, onConnect, formData, setFormData }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-black border border-white/20 rounded-xl p-6 w-full max-w-md mx-4">
      <h3 className="text-lg font-semibold mb-4 text-white">Connect Microsoft Teams</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Webhook URL</label>
          <input
            type="url"
            placeholder="https://your-team.webhook.office.com/..."
            value={formData.webhookUrl || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
            className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
          />
          <p className="text-xs text-white/50 mt-1">Get this from your Teams channel connector settings</p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="teamsIncludeAnalytics"
            checked={formData.includeAnalyticsByDefault || false}
            onChange={(e) => setFormData(prev => ({ ...prev, includeAnalyticsByDefault: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="teamsIncludeAnalytics" className="text-sm text-white/80">
            Include analytics by default when sharing
          </label>
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 border border-white/20 rounded-lg text-sm hover:bg-white/5 text-white"
        >
          Cancel
        </button>
        <button
          onClick={onConnect}
          className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white"
        >
          Connect
        </button>
      </div>
    </div>
  </div>
);

export default IntegrationsManager;
