import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import FloatingBubbles from '../components/FloatingBubbles';
import { 
  FiSearch, 
  FiMessageCircle, 
  FiMail, 
  FiBook, 
  FiVideo, 
  FiFileText, 
  FiArrowLeft,
  FiChevronDown 
} from 'react-icons/fi';
import { useAuth } from '../components/AuthContext';

export default function Help() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I upload a file for transcription?",
          answer:
            "Simply drag and drop your audio or video file onto the upload area, or click to browse and select your file. We support all major formats including MP3, WAV, MP4, and more.",
        },
        {
          question: "What file formats are supported?",
          answer:
            "We support all major audio formats (MP3, WAV, M4A, FLAC, AAC) and video formats (MP4, MOV, AVI, MKV, WMV). Maximum file size is 500MB.",
        },
        {
          question: "How long does transcription take?",
          answer:
            "Processing time is typically 2-5 minutes per hour of audio, depending on file size and current system load. You'll receive real-time progress updates.",
        },
      ],
    },
    {
      category: "Features & Functionality",
      questions: [
        {
          question: "How accurate is the transcription?",
          answer:
            "Our AI models achieve 99%+ accuracy for clear audio with minimal background noise. Accuracy may vary based on audio quality, accents, and technical terminology.",
        },
        {
          question: "Can you identify different speakers?",
          answer:
            "Yes! Our speaker identification feature can automatically detect and separate up to 10 different speakers in your audio, with timestamps for each speaker segment.",
        },
        {
          question: "Do you support multiple languages?",
          answer:
            "Yes, we support over 100 languages including English, Spanish, French, German, Chinese, Japanese, Arabic, Hindi, and many more with high accuracy.",
        },
        {
          question: "What is the AI summary feature?",
          answer:
            "Our AI automatically generates concise summaries, extracts key topics, identifies main insights, and can even detect sentiment and action items from your transcriptions.",
        },
      ],
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          question: "Is my data secure?",
          answer:
            "Absolutely. All files are encrypted during upload and processing using industry-standard encryption. We're GDPR compliant and follow strict security protocols.",
        },
        {
          question: "How long do you keep my files?",
          answer:
            "We automatically delete your files after 30 days. You can also delete them immediately after download if you prefer. We don't retain any data longer than necessary.",
        },
        {
          question: "Who has access to my transcriptions?",
          answer:
            "Only you have access to your transcriptions. Our staff cannot view your content, and we never share or sell your data to third parties.",
        },
      ],
    },
    {
      category: "Billing & Plans",
      questions: [
        {
          question: "Do you offer a free trial?",
          answer:
            "Yes! You can try our service to transcribe up to 15 minutes of audio to experience our quality and features.",
        },
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers.",
        },
        {
          question: "Can I cancel my subscription anytime?",
          answer:
            "Yes, you can cancel your subscription at any time. There are no cancellation fees, and you'll retain access until the end of your billing period.",
        },
      ],
    },
    {
      category: "Technical Support",
      questions: [
        {
          question: "My transcription failed. What should I do?",
          answer:
            "First, check that your file is in a supported format and under 500MB. If the issue persists, try uploading again or contact our support team with the error details.",
        },
        {
          question: "Do you offer bulk processing?",
          answer:
            "Yes, our Pro and Enterprise plans support batch processing, allowing you to upload and process multiple files simultaneously.",
        },
      ],
    },
  ];

  const filteredFaqs = faqs
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <>
      <Head>
        <title>Help Center - Ecouter Transcribe</title>
        <meta name="description" content="Find answers to common questions and get the help you need with Ecouter Transcribe." />
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
              <Link href="/contact" className="px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg font-semibold">
                Contact Support
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-12 relative z-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">Help Center</h1>
            <p className="text-xl text-gray-300">Find answers to common questions and get the help you need</p>
          </div>

          {/* Search */}
          <div className="file-card p-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-white/20"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="file-card p-6 hover:scale-105 transition-all duration-300 text-center">
              <FiBook className="h-8 w-8 mx-auto mb-4 text-blue-400" />
              <h3 className="text-lg font-semibold mb-2">Documentation</h3>
              <p className="text-gray-400 text-sm mb-4">Comprehensive guides and tutorials</p>
              <button className="px-4 py-2 border border-white/20 text-white hover:bg-white/10 bg-transparent transition-colors rounded-lg text-sm">
                View Docs
              </button>
            </div>

            <div className="file-card p-6 hover:scale-105 transition-all duration-300 text-center">
              <FiVideo className="h-8 w-8 mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-semibold mb-2">Video Tutorials</h3>
              <p className="text-gray-400 text-sm mb-4">Step-by-step video guides</p>
              <button className="px-4 py-2 border border-white/20 text-white hover:bg-white/10 bg-transparent transition-colors rounded-lg text-sm">
                Watch Videos
              </button>
            </div>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>

            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((category, categoryIndex) => (
                <div key={categoryIndex} className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-400">{category.category}</h3>
                  <div className="space-y-2">
                    {category.questions.map((faq, faqIndex) => {
                      const faqId = `${categoryIndex}-${faqIndex}`;
                      return (
                        <div key={faqIndex} className="file-card overflow-hidden">
                          <button
                            onClick={() => setOpenFaq(openFaq === faqId ? null : faqId)}
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                          >
                            <span className="font-medium text-white">{faq.question}</span>
                            <FiChevronDown className={`w-5 h-5 text-white/60 transition-transform ${
                              openFaq === faqId ? 'transform rotate-180' : ''
                            }`} />
                          </button>
                          {openFaq === faqId && (
                            <div className="px-4 pb-4">
                              <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No results found for "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>

          {/* Contact Support */}
          <div className="file-card p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Still need help?</h3>
            <p className="text-gray-300 mb-6">Can't find what you're looking for? Our support team is here to help.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center px-6 py-3 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg font-semibold">
                <FiMail className="h-4 w-4 mr-2" />
                Contact Support
              </Link>
              <button className="inline-flex items-center px-6 py-3 border border-white/20 text-white hover:bg-white/10 bg-transparent transition-colors rounded-lg font-semibold">
                <FiMessageCircle className="h-4 w-4 mr-2" />
                Live Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
