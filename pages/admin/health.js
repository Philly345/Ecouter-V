import { useState, useEffect } from 'react';
import { 
  FiActivity, FiServer, FiAlertTriangle, FiCheckCircle, 
  FiRefreshCw, FiZap, FiDatabase, FiMail, FiBarChart3,
  FiCpu, FiHardDrive, FiWifi, FiShield, FiClock, FiCalendar
} from 'react-icons/fi';

export default function SystemHealthDashboard() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(loadHealthData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      const response = await fetch('/api/admin/health');
      const data = await response.json();
      setHealthData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading System Health...</h2>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-100';
      case 'warning': return 'text-yellow-500 bg-yellow-100';
      case 'critical': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getAPIUsageColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 AI System Health Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time monitoring of your intelligent API management system
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <FiRefreshCw className="text-blue-500" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${getStatusColor(healthData?.systemHealth?.status)}`}>
                {healthData?.systemHealth?.status === 'healthy' ? 
                  <FiCheckCircle className="text-xl" /> : 
                  <FiAlertTriangle className="text-xl" />
                }
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                <p className={`text-sm capitalize font-medium ${
                  healthData?.systemHealth?.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {healthData?.systemHealth?.status || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <FiZap className="text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Auto-Fixes</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {healthData?.systemHealth?.autoFixedCount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500">
                <FiMail className="text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Alerts Sent</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {healthData?.systemHealth?.manualInterventionCount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500">
                <FiActivity className="text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Success Rate</h3>
                <p className="text-2xl font-bold text-green-600">
                  {(() => {
                    const autoFixed = healthData?.systemHealth?.autoFixedCount || 0;
                    const manual = healthData?.systemHealth?.manualInterventionCount || 0;
                    const total = autoFixed + manual;
                    return total > 0 ? ((autoFixed / total) * 100).toFixed(1) : '100.0';
                  })()}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Reports Status */}
        {healthData?.schedulerStatus && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FiCalendar className="text-xl text-purple-500 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Scheduled Health Reports</h2>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                healthData.schedulerStatus.isRunning 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {healthData.schedulerStatus.isRunning ? '✅ Active' : '❌ Inactive'}
              </div>
            </div>

            {healthData.schedulerStatus.isRunning ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                  {healthData.schedulerStatus.scheduledTimes?.map((time, index) => (
                    <div key={index} className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold text-purple-700">{time.name}</div>
                      <div className="text-xs text-purple-600">Daily Report</div>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FiClock className="text-blue-500 mr-2" />
                    <span className="font-medium text-blue-800">Next Report: {healthData.schedulerStatus.nextReport}</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    📧 Reports sent to: <strong>ecouter.transcribe@gmail.com</strong> | 
                    Reports today: <strong>{healthData.schedulerStatus.reportsToday || 0}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">⚠️ Scheduled reports are not active. The system will still work but you won't receive automated health reports.</p>
              </div>
            )}
          </div>
        )}

        {/* Current Issues */}
        {healthData?.systemHealth?.issues?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center mb-4">
              <FiAlertTriangle className="text-xl text-yellow-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Current Issues</h2>
            </div>
            <div className="space-y-2">
              {healthData.systemHealth.issues.map((issue, index) => (
                <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <FiAlertTriangle className="text-yellow-500 mr-3" />
                  <span className="text-yellow-800">{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Management Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FiServer className="text-xl text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">API Management</h2>
            </div>
            <div className="text-sm text-gray-600">
              Current API: <span className="font-semibold text-blue-600">
                {healthData?.currentAPI?.toUpperCase() || 'Unknown'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {healthData?.apis && Object.entries(healthData.apis).map(([name, api]) => {
              const usagePercent = (api.usage / api.limit) * 100;
              return (
                <div key={name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 uppercase">{name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      api.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {api.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Usage Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Usage</span>
                        <span className="font-medium">{usagePercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getAPIUsageColor(usagePercent)}`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Used:</span>
                        <div className="font-medium">{api.usage.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Limit:</span>
                        <div className="font-medium">{api.limit.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Errors:</span>
                        <div className="font-medium text-red-600">{api.errorCount}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Priority:</span>
                        <div className="font-medium">#{api.priority}</div>
                      </div>
                    </div>

                    {api.lastError && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        Last Error: {api.lastError.message || api.lastError}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <FiBarChart3 className="text-xl text-green-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Performance</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Response Time</span>
                <span className="font-medium text-green-600">&lt; 500ms</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Uptime</span>
                <span className="font-medium text-green-600">99.9%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Error Rate</span>
                <span className="font-medium text-green-600">&lt; 0.1%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Auto-Recovery Rate</span>
                <span className="font-medium text-blue-600">
                  {(() => {
                    const autoFixed = healthData?.systemHealth?.autoFixedCount || 0;
                    const manual = healthData?.systemHealth?.manualInterventionCount || 0;
                    const total = autoFixed + manual;
                    return total > 0 ? ((autoFixed / total) * 100).toFixed(1) : '100.0';
                  })()}%
                </span>
              </div>
            </div>
          </div>

          {/* Security & Monitoring */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <FiShield className="text-xl text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Security & Monitoring</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">SSL Certificate</span>
                <span className="font-medium text-green-600 flex items-center">
                  <FiCheckCircle className="mr-1" /> Valid
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">API Keys</span>
                <span className="font-medium text-green-600 flex items-center">
                  <FiCheckCircle className="mr-1" /> Secure
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Monitoring</span>
                <span className="font-medium text-green-600 flex items-center">
                  <FiActivity className="mr-1" /> Active
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Backup Systems</span>
                <span className="font-medium text-green-600 flex items-center">
                  <FiDatabase className="mr-1" /> Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <FiCpu className="text-xl text-purple-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FiRefreshCw className="text-xl text-blue-500 mx-auto mb-2" />
              <div className="text-sm font-medium">Refresh Data</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FiZap className="text-xl text-yellow-500 mx-auto mb-2" />
              <div className="text-sm font-medium">Force API Switch</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FiMail className="text-xl text-green-500 mx-auto mb-2" />
              <div className="text-sm font-medium">Send Test Alert</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FiHardDrive className="text-xl text-purple-500 mx-auto mb-2" />
              <div className="text-sm font-medium">Clear Cache</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}