import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../lib/auth';
import Navbar from '../components/Navbar';
import FloatingBubbles from '../components/FloatingBubbles';
import SEO from '../components/SEO';
import { FiUpload, FiMic, FiClock, FiUsers, FiFileText, FiHeart, FiStar, FiPlay, FiCheck } from 'react-icons/fi';

export default function TranscribeAudio() {
  const { user, logout } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleFiles = async (files) => {
    if (files && files.length > 0) {
      setUploading(true);
      // Redirect to upload page with the file
      router.push('/upload');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const audioFormats = [
    'MP3', 'WAV', 'M4A', 'FLAC', 'AAC', 'OGG', 'WMA', 'AIFF'
  ];

  const benefits = [
    {
      icon: FiMic,
      title: 'Free Audio Transcription',
      description: 'Transcribe audio files completely free with our advanced AI technology. No limits, no subscriptions.'
    },
    {
      icon: FiUsers,
      title: 'Speaker Identification',
      description: 'Automatically identify and label different speakers in your audio files with 98% accuracy.'
    },
    {
      icon: FiClock,
      title: 'Fast Processing',
      description: 'Transcribe audio files in minutes, not hours. Our AI processes audio up to 10x faster than human transcription.'
    },
    {
      icon: FiFileText,
      title: 'Multiple Export Formats',
      description: 'Export your transcribed audio as TXT, PDF, Word, or SRT subtitle files for maximum compatibility.'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Upload Audio File',
      description: 'Drag and drop or click to upload your audio file. We support MP3, WAV, M4A, FLAC, AAC and more.'
    },
    {
      number: '2',
      title: 'AI Transcribes Audio',
      description: 'Our advanced AI technology transcribes your audio with speaker identification and timestamps.'
    },
    {
      number: '3',
      title: 'Download Transcript',
      description: 'Get your transcribed audio as text, PDF, Word, or subtitle file. Edit and share as needed.'
    }
  ];

  const faqs = [
    {
      question: 'How do I transcribe audio files for free?',
      answer: 'Simply upload your audio file using the upload area above. Our AI will transcribe your audio completely free with speaker identification and timestamps included.'
    },
    {
      question: 'What audio formats can I transcribe?',
      answer: 'You can transcribe audio in MP3, WAV, M4A, FLAC, AAC, OGG, WMA, AIFF, and many other popular audio formats. Our system automatically detects the format.'
    },
    {
      question: 'How accurate is audio transcription with AI?',
      answer: 'Our AI achieves 98% accuracy for clear audio recordings. Accuracy improves with high-quality audio files and minimal background noise.'
    },
    {
      question: 'Can I transcribe audio with multiple speakers?',
      answer: 'Yes! Our AI automatically identifies and labels up to 10 different speakers in your audio file. Each speaker is clearly marked in the transcript.'
    },
    {
      question: 'How long does it take to transcribe audio?',
      answer: 'Audio transcription typically takes 2-5 minutes for a 1-hour file, depending on audio quality and length. Much faster than manual transcription.'
    },
    {
      question: 'Is my audio data secure during transcription?',
      answer: 'Yes, all audio files are encrypted during upload and processing. We automatically delete files after transcription and never share your content.'
    }
  ];

  return (
    <>
      <SEO 
        title="Transcribe Audio Free with AI | Upload Audio Files for Instant Transcription"
        description="Transcribe audio files for free with our AI technology. Upload MP3, WAV, M4A, FLAC, AAC files and get accurate transcripts with speaker identification in minutes. 120+ languages supported."
        url="https://ecoutertranscribe.tech/transcribe-audio"
        faqData={faqs}
        breadcrumbs={[
          { position: 1, name: "Home", item: "https://ecoutertranscribe.tech" },
          { position: 2, name: "Transcribe Audio", item: "https://ecoutertranscribe.tech/transcribe-audio" }
        ]}
      />

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        <Navbar user={user} onLogout={logout} />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Transcribe Audio Files Free with AI
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
              Upload your audio files and get accurate transcription with speaker identification in minutes. 
              Supports MP3, WAV, M4A, FLAC, AAC and 120+ languages. Completely free, no signup required.
            </p>

            {/* Upload Area */}
            <div className="max-w-2xl mx-auto mb-16">
              <div
                className={`border-2 border-dashed rounded-lg p-12 transition-all duration-300 cursor-pointer ${
                  dragActive 
                    ? 'border-white bg-white/5' 
                    : 'border-gray-700 hover:border-gray-600 hover:bg-gray-900/20'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                <FiUpload className="mx-auto mb-4 text-4xl text-gray-400" />
                <p className="text-lg mb-2">
                  <span className="font-semibold">Click to upload</span> or drag and drop audio files
                </p>
                <p className="text-gray-400">
                  Supports: {audioFormats.join(', ')}
                </p>
              </div>

              <Link 
                href="/upload"
                className="inline-flex items-center space-x-2 bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <FiPlay className="w-5 h-5" />
                <span>Start Transcribing Audio</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4 gradient-text">
              Why Choose Our Audio Transcription?
            </h2>
            <p className="text-gray-400 text-center mb-16 max-w-3xl mx-auto">
              Experience the most accurate and fastest way to transcribe audio files with AI technology.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="file-card p-6 text-center">
                  <benefit.icon className="w-12 h-12 mx-auto mb-4 text-white" />
                  <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-6 bg-gray-900/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4 gradient-text">
              How to Transcribe Audio in 3 Steps
            </h2>
            <p className="text-gray-400 text-center mb-16 max-w-3xl mx-auto">
              Get your audio transcribed in minutes with our simple process.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-white to-gray-400 rounded-full flex items-center justify-center text-black font-bold text-xl mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supported Formats */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8 gradient-text">
              Supported Audio Formats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {audioFormats.map((format, index) => (
                <div key={index} className="file-card p-4">
                  <span className="font-semibold">{format}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 gradient-text">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="file-card p-6">
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    {faq.question}
                  </h3>
                  <p className="text-gray-300">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              Ready to Transcribe Your Audio?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands of users who trust our AI to transcribe their audio files accurately and quickly.
            </p>
            
            <div className="flex justify-center space-x-6 mb-8">
              <div className="flex items-center space-x-2">
                <FiCheck className="text-green-400" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCheck className="text-green-400" />
                <span>No Signup Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCheck className="text-green-400" />
                <span>98% Accuracy</span>
              </div>
            </div>

            <Link 
              href="/upload"
              className="inline-flex items-center space-x-2 bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              <FiUpload className="w-5 h-5" />
              <span>Upload Audio File Now</span>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}