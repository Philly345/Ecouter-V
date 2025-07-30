import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import FloatingBubbles from '../components/FloatingBubbles';
import Modal from '../components/Modal';
import T from '../components/T';
import { 
  FiMic, 
  FiUpload, 
  FiClock, 
  FiUsers, 
  FiStar, 
  FiChevronDown,
  FiCheck,
  FiPlay,
  FiDownload,
  FiMessageSquare
} from 'react-icons/fi';

export default function Home({ user, onLogout }) {
  const [showSupportedFormats, setShowSupportedFormats] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    {
      icon: FiMic,
      title: 'AI-Powered Transcription',
      description: 'Accurate speech-to-text using advanced AI technology'
    },
    {
      icon: FiUpload,
      title: 'Multiple Formats',
      description: 'Support for audio and video files up to 500MB'
    },
    {
      icon: FiClock,
      title: 'Fast Processing',
      description: 'Get your transcripts in minutes, not hours'
    },
    {
      icon: FiUsers,
      title: 'Speaker Identification',
      description: 'Automatically identify and label different speakers'
    },
    {
      icon: FiMessageSquare,
      title: 'Chat with AI',
      description: 'Ask questions and get insights about your audio content using AI'
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Journalist',
      content: 'Ecouter has revolutionized my interview workflow. The accuracy is incredible!',
      rating: 5
    },
    {
      name: 'David Kumar',
      role: 'Podcaster',
      content: 'Best transcription service I\'ve used. The AI summaries save me hours.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Student',
      content: 'Perfect for transcribing lectures. The speaker identification is spot-on.',
      rating: 5
    },
  ];

  const faqs = [
    {
      question: 'What file formats are supported?',
      answer: 'We support all major audio formats (MP3, WAV, M4A, FLAC, AAC) and video formats (MP4, MOV, AVI, MKV, WMV).'
    },
    {
      question: 'How accurate is the transcription?',
      answer: 'Our AI achieves 95%+ accuracy for clear audio with minimal background noise. Results improve with high-quality recordings.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, all files are encrypted during upload and processing. We never share your content with third parties.'
    },
    {
      question: 'What\'s the maximum file size?',
      answer: 'You can upload files up to 500MB or 4 hours of audio/video content.'
    },
    {
      question: 'Do you offer speaker identification?',
      answer: 'Yes, our advanced AI can identify and label up to 10 different speakers in your audio.'
    },
  ];

  return (
    <>
      <Head>
        <title>Ecouter Transcribe - AI-Powered Transcription Service</title>
        <meta name="description" content="Transform your audio and video into accurate transcripts with our AI-powered transcription service. Fast, secure, and reliable." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        <Navbar user={user} onLogout={onLogout} />

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-6">
          <div className="max-w-5xl mx-auto text-center z-10">
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-white">
              <div className="mb-2">
                <T>Transform Audio into</T>
              </div>
              <div className="text-gray-200" style={{ minHeight: '1.2em' }}>
                <T fallback="Intelligent Insights">Intelligent Insights</T>
              </div>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
              <T>Advanced AI-powered transcription with speaker identification, sentiment analysis, and intelligent summaries. Upload your audio and get professional results in minutes.</T>
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-16">
              <Link 
                href="/signup"
                className="px-6 py-3 rounded-lg text-base font-semibold inline-flex items-center space-x-2 bg-white text-black hover:bg-gray-100 transition-all duration-300"
              >
                <span><T>Get Started</T></span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex justify-center items-center space-x-2 mb-20">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-gray-400 ml-3"><T>Trusted by 10,000+ users worldwide</T></span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
                <T>Powerful Features</T>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="file-card p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-white/20 to-white/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">
                      <T>{feature.title}</T>
                    </h3>
                    <p className="text-white/70 text-base leading-relaxed">
                      <T>{feature.description}</T>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-32 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
                <T>What Our Users Say</T>
              </h2>
              <p className="text-white/70 text-xl max-w-3xl mx-auto">
                <T>Join thousands of satisfied customers who trust Ecouter for their transcription needs.</T>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="file-card p-8 animate-float" style={{ animationDelay: `${index * 0.5}s` }}>
                  <div className="flex items-center mb-6">
                    {Array.from({ length: testimonial.rating }, (_, i) => (
                      <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-6 italic text-lg leading-relaxed">
                    "<T>{testimonial.content}</T>"
                  </p>
                  <div>
                    <div className="font-semibold text-white text-lg">{testimonial.name}</div>
                    <div className="text-white/60 text-base">
                      <T>{testimonial.role}</T>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
                <T>Frequently Asked Questions</T>
              </h2>
              <p className="text-white/70 text-xl max-w-3xl mx-auto">
                <T>Get answers to common questions about our transcription service.</T>
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="file-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <span className="font-medium text-white text-lg">
                      <T>{faq.question}</T>
                    </span>
                    <FiChevronDown className={`w-6 h-6 text-white/60 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`} />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-white/70 text-base leading-relaxed">
                        <T>{faq.answer}</T>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-6 border-t border-white/10 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-400 rounded-full"></div>
                  <span className="text-xl font-bold gradient-text">Ecouter Transcribe</span>
                </div>
                <p className="text-white/60 text-base leading-relaxed">
                  <T>AI-powered transcription service for professionals and creators.</T>
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-6 text-lg">
                  <T>Product</T>
                </h4>
                <ul className="space-y-3 text-base text-white/60">
                  <li><Link href="/features" className="hover:text-white transition-colors">
                    <T>Features</T>
                  </Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-6 text-lg">
                  <T>Support</T>
                </h4>
                <ul className="space-y-3 text-base text-white/60">
                  <li><Link href="/help" className="hover:text-white transition-colors">
                    <T>Help Center</T>
                  </Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">
                    <T>Contact</T>
                  </Link></li>
                  <li><Link href="/status" className="hover:text-white transition-colors">
                    <T>Status</T>
                  </Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-6 text-lg">
                  <T>Legal</T>
                </h4>
                <ul className="space-y-3 text-base text-white/60">
                  <li><Link href="/privacy" className="hover:text-white transition-colors">
                    <T>Privacy Policy</T>
                  </Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">
                    <T>Terms of Service</T>
                  </Link></li>
                  <li><Link href="/cookies" className="hover:text-white transition-colors">
                    <T>Cookie Policy</T>
                  </Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 mt-12 pt-8 text-center text-base text-white/60">
              <T>© 2025 Ecouter Systems. All rights reserved.</T>
            </div>
          </div>
        </footer>

        {/* Supported Formats Modal */}
        <Modal
          isOpen={showSupportedFormats}
          onClose={() => setShowSupportedFormats(false)}
          title={<T>Supported File Formats</T>}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                <FiMic className="w-4 h-4" />
                <span><T>Audio Formats</T></span>
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {['MP3', 'WAV', 'M4A', 'FLAC', 'AAC', 'OGG'].map(format => (
                  <span key={format} className="px-3 py-1 bg-white/10 rounded text-sm text-center">
                    {format}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                <FiPlay className="w-4 h-4" />
                <span><T>Video Formats</T></span>
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {['MP4', 'MOV', 'AVI', 'MKV', 'WMV', 'WEBM'].map(format => (
                  <span key={format} className="px-3 py-1 bg-white/10 rounded text-sm text-center">
                    {format}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="font-semibold text-white mb-3">
                <T>File Requirements</T>
              </h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center space-x-2">
                  <FiCheck className="w-4 h-4 text-green-400" />
                  <span><T>Maximum file size: 500MB</T></span>
                </li>
                <li className="flex items-center space-x-2">
                  <FiCheck className="w-4 h-4 text-green-400" />
                  <span><T>Maximum duration: 4 hours</T></span>
                </li>
                <li className="flex items-center space-x-2">
                  <FiCheck className="w-4 h-4 text-green-400" />
                  <span><T>Minimum sample rate: 16kHz</T></span>
                </li>
                <li className="flex items-center space-x-2">
                  <FiCheck className="w-4 h-4 text-green-400" />
                  <span><T>Support for up to 10 speakers</T></span>
                </li>
              </ul>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="font-semibold text-white mb-3">
                <T>Tips for Better Results</T>
              </h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><T>• Use clear audio with minimal background noise</T></li>
                <li><T>• Avoid overlapping speech</T></li>
                <li><T>• Keep speakers close to the microphone</T></li>
                <li><T>• Record in a quiet environment</T></li>
              </ul>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
