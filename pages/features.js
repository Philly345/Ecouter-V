import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import FloatingBubbles from '../components/FloatingBubbles';
import { 
  FiMic, 
  FiUsers, 
  FiClock, 
  FiShield, 
  FiStar, 
  FiGlobe, 
  FiFileText, 
  FiDownload, 
  FiSearch, 
  FiZap,
  FiArrowLeft
} from 'react-icons/fi';
import { useAuth } from '../components/AuthContext';

export default function Features() {
  const { user, logout } = useAuth();

  const features = [
    {
      icon: FiMic,
      title: "High Accuracy Transcription",
      description: "Advanced AI models ensure 99%+ accuracy for clear audio with minimal background noise.",
      badge: "Core Feature",
      details: [
        "State-of-the-art speech recognition",
        "Noise reduction algorithms",
        "Multiple audio format support",
        "Real-time processing",
      ],
    },
    {
      icon: FiUsers,
      title: "Speaker Identification",
      description: "Automatically identify and separate different speakers in your audio files.",
      badge: "AI Powered",
      details: ["Up to 10 speakers per file", "Speaker diarization", "Voice pattern recognition", "Timestamp accuracy"],
    },
    {
      icon: FiClock,
      title: "Fast Processing",
      description: "Get your transcriptions in minutes, not hours, regardless of file size.",
      badge: "Performance",
      details: [
        "2-5 minutes per hour of audio",
        "Parallel processing",
        "Cloud-based infrastructure",
        "Real-time progress tracking",
      ],
    },
    {
      icon: FiShield,
      title: "Secure & Private",
      description: "Your files are encrypted during upload and processing, then automatically deleted.",
      badge: "Security",
      details: ["End-to-end encryption", "GDPR compliant", "Auto-deletion after 30 days", "No data retention"],
    },
    {
      icon: FiStar,
      title: "AI Summaries",
      description: "Get intelligent summaries, key topics, and insights from your transcriptions.",
      badge: "AI Powered",
      details: ["Automatic summarization", "Key topic extraction", "Sentiment analysis", "Action item identification"],
    },
    {
      icon: FiGlobe,
      title: "Multi-Language Support",
      description: "Support for over 100 languages with high accuracy across different accents.",
      badge: "Global",
      details: [
        "100+ languages supported",
        "Accent recognition",
        "Regional dialect support",
        "Translation capabilities",
      ],
    },
    {
      icon: FiFileText,
      title: "Multiple Export Formats",
      description: "Export your transcriptions in various formats including TXT, SRT, VTT, and more.",
      badge: "Flexibility",
      details: [
        "TXT, SRT, VTT formats",
        "Timestamp preservation",
        "Speaker labels included",
        "Custom formatting options",
      ],
    },
    {
      icon: FiSearch,
      title: "Advanced Search",
      description: "Search through your transcriptions with powerful filtering and highlighting.",
      badge: "Productivity",
      details: ["Full-text search", "Keyword highlighting", "Time-based filtering", "Speaker-specific search"],
    },
    {
      icon: FiDownload,
      title: "Batch Processing",
      description: "Upload and process multiple files simultaneously for increased productivity.",
      badge: "Enterprise",
      details: ["Multiple file upload", "Queue management", "Progress tracking", "Bulk export options"],
    },
  ];

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'Core Feature':
        return 'bg-blue-600/20 text-blue-400 border-blue-400/30';
      case 'AI Powered':
        return 'bg-purple-600/20 text-purple-400 border-purple-400/30';
      case 'Performance':
        return 'bg-green-600/20 text-green-400 border-green-400/30';
      case 'Security':
        return 'bg-red-600/20 text-red-400 border-red-400/30';
      case 'Global':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-400/30';
      case 'Flexibility':
        return 'bg-indigo-600/20 text-indigo-400 border-indigo-400/30';
      case 'Productivity':
        return 'bg-teal-600/20 text-teal-400 border-teal-400/30';
      case 'Enterprise':
        return 'bg-orange-600/20 text-orange-400 border-orange-400/30';
      case 'Developer':
        return 'bg-pink-600/20 text-pink-400 border-pink-400/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-400/30';
    }
  };

  return (
    <>
      <Head>
        <title>Features - Ecouter Transcribe</title>
        <meta name="description" content="Discover all the advanced capabilities that make Ecouter Transcribe the most comprehensive transcription solution for professionals and businesses." />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        
        {/* Navigation */}
        <nav className="border-b border-white/10 p-6 relative z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="gradient-text text-xl font-bold">
              Ecouter Transcribe
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                <FiArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-12 relative z-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">Powerful Features</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover all the advanced capabilities that make Ecouter Transcribe the most comprehensive transcription solution
              for professionals and businesses.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="file-card p-6 hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getBadgeColor(feature.badge)}`}>
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center text-xs text-gray-400">
                      <div className="w-1 h-1 bg-white/40 rounded-full mr-2" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-6 py-12">
            <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Experience the power of AI-driven transcription with all these features and more. Start your free trial
              today and see the difference quality makes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg font-semibold inline-block">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
