import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import FloatingBubbles from '../components/FloatingBubbles';
import { 
  FiArrowLeft, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiClock, 
  FiSend, 
  FiMessageCircle 
} from 'react-icons/fi';
import { useAuth } from '../components/AuthContext';

export default function Contact() {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "",
        message: "",
      });
    }, 3000);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
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
            <Link href="/help" className="px-4 py-2 border border-white/20 text-white hover:bg-white/10 bg-transparent transition-colors rounded-lg font-semibold">
              Help Center
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">Contact Us</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Have questions or need support? We're here to help. Reach out to our team and we'll get back to you as soon
            as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <FiMail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email Support</h3>
                    <p className="text-gray-400 text-sm mb-2">Get help with your account or technical issues</p>
                    <a href="mailto:support@ecouter.com" className="text-blue-400 hover:text-blue-300">
                      support@ecouter.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <FiPhone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone Support</h3>
                    <p className="text-gray-400 text-sm mb-2">Speak directly with our support team</p>
                    <a href="tel:+1-561-555-7689" className="text-blue-400 hover:text-blue-300">
                      +1 (561) 555-7689
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <FiMessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Live Chat</h3>
                    <p className="text-gray-400 text-sm mb-2">Chat with us in real-time</p>
                    <button className="px-4 py-2 border border-white/20 text-white hover:bg-white/10 bg-transparent transition-colors rounded-lg text-sm font-semibold">
                      Start Chat
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <FiClock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Business Hours</h3>
                    <p className="text-gray-400 text-sm">
                      Monday - Friday: 9:00 AM - 6:00 PM PST
                      <br />
                      Saturday - Sunday: 10:00 AM - 4:00 PM PST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Office Location */}
            <div className="file-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FiMapPin className="h-5 w-5 mr-2" />
                Our Office
              </h3>
              <address className="text-gray-300 not-italic">
                Ecouter Transcribe Inc.
                <br />
                123 Innovation Drive
                <br />
                San Francisco, CA 94105
                <br />
                United States
              </address>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="file-card p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">Send us a Message</h2>
                <p className="text-gray-400">Fill out the form below and we'll get back to you within 24 hours.</p>
              </div>
              
              {submitted ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-green-500/20 rounded-lg mb-4">
                    <h3 className="text-green-400 font-semibold mb-2">Message Sent!</h3>
                    <p className="text-green-300">Thank you for contacting us. We'll get back to you soon.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Full Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium mb-2">
                        Category
                      </label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
                      >
                        <option value="">Select a category</option>
                        <option value="general">General Inquiry</option>
                        <option value="technical">Technical Support</option>
                        <option value="feature">Feature Request</option>
                        <option value="partnership">Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2">
                        Subject *
                      </label>
                      <input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20 min-h-32 resize-none"
                      placeholder="Please describe your inquiry in detail..."
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg font-semibold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FiSend className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
