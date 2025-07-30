import Head from 'next/head';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FloatingBubbles from '../components/FloatingBubbles';
import { FiCheck, FiX, FiMinus, FiClock, FiActivity } from 'react-icons/fi';
import { useAuth } from '../components/AuthContext';

export default function Status() {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const services = [
    {
      name: 'API',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '120ms'
    },
    {
      name: 'Transcription Service',
      status: 'operational',
      uptime: '99.97%',
      responseTime: '2.3s'
    },
    {
      name: 'AI Chat',
      status: 'operational',
      uptime: '99.95%',
      responseTime: '800ms'
    },
    {
      name: 'File Upload',
      status: 'operational',
      uptime: '99.98%',
      responseTime: '450ms'
    },
    {
      name: 'Authentication',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '95ms'
    },
    {
      name: 'Dashboard',
      status: 'operational',
      uptime: '99.96%',
      responseTime: '180ms'
    }
  ];

  const incidents = [
    {
      date: '2025-01-20',
      time: '14:30 UTC',
      title: 'Brief API slowdown resolved',
      description: 'Our API experienced elevated response times for approximately 15 minutes. The issue has been identified and resolved.',
      status: 'resolved',
      duration: '15 minutes',
      impact: 'minor'
    },
    {
      date: '2025-01-15',
      time: '09:15 UTC',
      title: 'Scheduled maintenance completed',
      description: 'Scheduled database maintenance was completed successfully with no service interruption.',
      status: 'resolved',
      duration: '2 hours',
      impact: 'none'
    },
    {
      date: '2025-01-10',
      time: '16:45 UTC',
      title: 'Transcription delays resolved',
      description: 'Some users experienced longer than usual transcription processing times. This has been resolved by scaling our infrastructure.',
      status: 'resolved',
      duration: '45 minutes',
      impact: 'minor'
    }
  ];

  const metrics = [
    {
      title: 'Overall Uptime',
      value: '99.97%',
      period: 'Last 30 days'
    },
    {
      title: 'API Uptime',
      value: '99.99%',
      period: 'Last 30 days'
    },
    {
      title: 'Average Response Time',
      value: '180ms',
      period: 'Last 24 hours'
    },
    {
      title: 'Processing Time',
      value: '2.1s',
      period: 'Average per file'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <FiCheck className="w-5 h-5 text-green-400" />;
      case 'degraded':
        return <FiMinus className="w-5 h-5 text-yellow-400" />;
      case 'outage':
        return <FiX className="w-5 h-5 text-red-400" />;
      default:
        return <FiClock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'outage':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'none':
        return 'text-green-400';
      case 'minor':
        return 'text-yellow-400';
      case 'major':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <>
      <Head>
        <title>Status - Ecouter Transcribe</title>
        <meta name="description" content="Real-time status of Ecouter Transcribe services. Check current uptime, performance metrics, and incident reports." />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        <Navbar user={user} onLogout={logout} />

        {/* Hero Section */}
        <section className="pt-24 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
                System Status
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                Real-time status and performance metrics for all Ecouter services
              </p>
              
              {/* Overall Status */}
              <div className="inline-flex items-center px-6 py-3 bg-green-600/20 border border-green-600/30 rounded-lg">
                <FiCheck className="w-6 h-6 text-green-400 mr-3" />
                <span className="text-lg font-semibold text-green-400">All Systems Operational</span>
              </div>
              
              <p className="text-gray-400 mt-4">
                Last updated: {currentTime.toLocaleString()} UTC
              </p>
            </div>
          </div>
        </section>

        {/* Service Status */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 gradient-text">Service Status</h2>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="file-card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(service.status)}
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold">{service.name}</h3>
                        <span className={`text-sm capitalize ${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8 text-sm text-gray-400">
                      <div className="text-center">
                        <div className="text-white font-medium">{service.uptime}</div>
                        <div>Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium">{service.responseTime}</div>
                        <div>Response Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="py-16 px-6 bg-gray-900/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 gradient-text">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <div key={index} className="file-card p-6 text-center">
                  <FiActivity className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
                  <div className="text-lg font-semibold mb-1">{metric.title}</div>
                  <div className="text-sm text-gray-400">{metric.period}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Incident History */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold gradient-text">Recent Incidents</h2>
              <span className="text-gray-400">Last 30 days</span>
            </div>
            
            {incidents.length === 0 ? (
              <div className="file-card p-8 text-center">
                <FiCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No incidents reported</h3>
                <p className="text-gray-400">All systems have been running smoothly</p>
              </div>
            ) : (
              <div className="space-y-6">
                {incidents.map((incident, index) => (
                  <div key={index} className="file-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold mr-4">{incident.title}</h3>
                          <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">
                            Resolved
                          </span>
                        </div>
                        <p className="text-gray-400 mb-3">{incident.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>{incident.date} at {incident.time}</span>
                          <span>Duration: {incident.duration}</span>
                          <span className={`capitalize ${getImpactColor(incident.impact)}`}>
                            {incident.impact} impact
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Subscribe to Updates */}
        <section className="py-20 px-6 bg-gray-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 gradient-text">
              Stay Updated
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Get notified about service updates and maintenance windows
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
              />
              <button className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
