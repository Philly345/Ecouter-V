import { useState, useRef, useEffect } from 'react';
import { 
  FiMessageCircle, 
  FiX, 
  FiSend, 
  FiUser, 
  FiCpu,
  FiThumbsUp,
  FiThumbsDown,
  FiMail,
  FiLoader
} from 'react-icons/fi';

const CustomerSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hi! I\'m your AI assistant. How can I help you with Ecouter today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingFeedback, setAwaitingFeedback] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGeminiResponse = async (userMessage) => {
    try {
      // In a real implementation, you would call the Gemini API here
      // For now, I'll simulate intelligent responses based on common Ecouter questions
      
      const response = await generateGeminiResponse(userMessage);
      
      const botMessage = {
        id: Date.now(),
        type: 'bot',
        content: response,
        timestamp: new Date(),
        needsFeedback: true
      };

      setMessages(prev => [...prev, botMessage]);
      setAwaitingFeedback(botMessage.id);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: 'I apologize, but I\'m having trouble processing your request right now. Would you like me to connect you with human support?',
        timestamp: new Date(),
        needsFeedback: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setAwaitingFeedback(errorMessage.id);
    }
  };

  const generateGeminiResponse = async (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Simulate Gemini AI responses based on keywords
    if (message.includes('transcription') || message.includes('transcribe')) {
      return `I can help you with transcription! Ecouter offers several transcription features:

📝 **Live Transcription**: Real-time speech-to-text with automatic speaker detection
🌍 **Translation**: Translate transcriptions to 60+ languages using MyMemory API
🎤 **Speaker Detection**: Automatically identify and label different speakers
💾 **Export Options**: Save transcripts in various formats

What specific transcription feature would you like help with?`;
    }
    
    if (message.includes('upload') || message.includes('file')) {
      return `For file uploads and processing:

📁 **Supported Formats**: MP3, MP4, WAV, M4A, and more
⚡ **Processing**: Advanced AI transcription with speaker identification
🔄 **Batch Upload**: Process multiple files simultaneously
💾 **Storage**: Secure cloud storage with easy access

Are you having trouble uploading a specific file type or experiencing upload errors?`;
    }
    
    if (message.includes('speaker') || message.includes('detection')) {
      return `Our automatic speaker detection system:

🎤 **Auto-Detection**: Identifies when speakers change automatically
🏷️ **Smart Labeling**: Labels speakers as Speaker 1, Speaker 2, etc.
📊 **Real-time**: Works during live recording sessions
🎯 **Accuracy**: 80%+ confidence in speaker identification

You can enable/disable this feature in the live transcription settings. Is there a specific issue with speaker detection you're experiencing?`;
    }
    
    if (message.includes('translation') || message.includes('language')) {
      return `Translation features in Ecouter:

🌍 **60+ Languages**: Support for major world languages
🔄 **Real-time**: Live translation during transcription
🤖 **Auto-detect**: Automatically detect source language
📝 **Bilingual View**: See both original and translated text

Which languages are you working with? I can help you set up the translation properly.`;
    }
    
    if (message.includes('account') || message.includes('login') || message.includes('signup')) {
      return `For account-related issues:

👤 **Account Creation**: Sign up with email verification
🔐 **Password Reset**: Use the "Forgot Password" link on login page
✉️ **Email Verification**: Check spam folder for verification emails
🔄 **Login Issues**: Clear browser cache and cookies

What specific account issue are you experiencing?`;
    }
    
    if (message.includes('export') || message.includes('download') || message.includes('save')) {
      return `Export and download options:

📄 **Formats**: TXT, DOCX, PDF, JSON
👥 **Speaker Labels**: Includes speaker identification in exports
🕐 **Timestamps**: Optional timestamp inclusion
🌍 **Bilingual**: Export both original and translated text

Which format would you like to export to? I can guide you through the process.`;
    }
    
    if (message.includes('pricing') || message.includes('cost') || message.includes('free')) {
      return `Ecouter pricing information:

🆓 **Free Features**: Live transcription, basic exports, speaker detection
💎 **Premium**: Advanced AI features, bulk processing, priority support
💰 **No Hidden Costs**: We've switched to free open-source TTS (MaryTTS)
🔄 **Flexible**: Pay only for what you use

Would you like details about specific premium features or have questions about billing?`;
    }
    
    if (message.includes('error') || message.includes('problem') || message.includes('issue') || message.includes('bug')) {
      return `I'm here to help troubleshoot! Common solutions:

🔄 **Refresh**: Try refreshing the page
🧹 **Clear Cache**: Clear browser cache and cookies
🎤 **Microphone**: Check microphone permissions in browser settings
🌐 **Browser**: Try a different browser (Chrome, Firefox, Safari)
📡 **Connection**: Check your internet connection

Can you describe the specific error you're seeing? Include any error messages if possible.`;
    }
    
    if (message.includes('hello') || message.includes('hi') || message.includes('help')) {
      return `Hello! I'm here to help you with Ecouter. I can assist with:

🎤 **Live Transcription**: Real-time speech-to-text
📁 **File Processing**: Upload and transcribe audio/video files
👥 **Speaker Detection**: Automatic speaker identification
🌍 **Translation**: Multi-language support
⚙️ **Settings**: Account and feature configuration
🐛 **Troubleshooting**: Fix common issues

What would you like help with today?`;
    }
    
    // Default response for unrecognized queries
    return `I understand you're asking about "${userMessage}". Let me help you with that!

Here are some things I can assist with:
• Transcription features and settings
• File upload and processing
• Speaker detection and labeling
• Translation and language settings
• Account and login issues
• Export and download options
• Troubleshooting technical problems

Could you provide a bit more detail about what you're trying to do? The more specific you are, the better I can help you!`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate thinking time
    setTimeout(async () => {
      await handleGeminiResponse(userMessage.content);
      setIsLoading(false);
    }, 1000);
  };

  const handleFeedback = async (messageId, isHelpful) => {
    if (isHelpful) {
      // User found the response helpful
      const thankYouMessage = {
        id: Date.now(),
        type: 'bot',
        content: 'Great! I\'m glad I could help. Is there anything else you\'d like to know about Ecouter?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, thankYouMessage]);
      setAwaitingFeedback(null);
    } else {
      // User needs human assistance
      setShowEmailForm(true);
      const escalationMessage = {
        id: Date.now(),
        type: 'bot',
        content: 'I understand you need more personalized help. Let me connect you with our human support team. Please provide your contact details below:',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, escalationMessage]);
      setAwaitingFeedback(null);
    }
  };

  const handleEscalateToHuman = async () => {
    if (!userEmail.trim() || !userName.trim()) {
      alert('Please provide both your name and email address.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare conversation history for email
      const conversationHistory = messages.map(msg => 
        `[${msg.timestamp.toLocaleTimeString()}] ${msg.type === 'user' ? 'User' : 'AI Assistant'}: ${msg.content}`
      ).join('\n\n');

      // Send email to support
      const emailData = {
        to: 'ecouter.transcribe@gmail.com',
        subject: `Customer Support Request from ${userName}`,
        customerName: userName,
        customerEmail: userEmail,
        conversationHistory: conversationHistory,
        timestamp: new Date().toISOString()
      };

      await sendSupportEmail(emailData);

      const confirmationMessage = {
        id: Date.now(),
        type: 'bot',
        content: `Thank you ${userName}! I've sent your request to our human support team. They'll review our conversation and get back to you as soon as possible. You can expect a response within 24 hours.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, confirmationMessage]);
      setShowEmailForm(false);
      setUserEmail('');
      setUserName('');
      
    } catch (error) {
      console.error('Error sending support email:', error);
      
      // Check if it's a development mode response
      if (error.developmentMode) {
        const devMessage = {
          id: Date.now(),
          type: 'bot',
          content: `Thank you ${userName}! Your support request has been logged successfully. In development mode, the request details have been logged to the console. In production, this would be sent to ecouter.transcribe@gmail.com.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, devMessage]);
        setShowEmailForm(false);
        setUserEmail('');
        setUserName('');
      } else {
        const errorMessage = {
          id: Date.now(),
          type: 'bot',
          content: `I apologize, but there was an error sending your request. However, I've logged your details:\n\nName: ${userName}\nEmail: ${userEmail}\n\nPlease contact us directly at ecouter.transcribe@gmail.com and reference this conversation.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }

    setIsLoading(false);
  };

  const sendSupportEmail = async (emailData) => {
    try {
      const response = await fetch('/api/support/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send support email');
      }

      // Check if we're in development mode
      if (result.developmentMode) {
        const devError = new Error('Development mode - request logged to console');
        devError.developmentMode = true;
        throw devError;
      }

      return result;
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Support Widget Button */}
      {!isOpen && (
        <div 
          className="fixed bottom-6 right-6 z-50 cursor-pointer group"
          onClick={() => setIsOpen(true)}
        >
          <div className="relative">
            <div className="bg-black border-2 border-gray-300 p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
              <FiMessageCircle className="w-6 h-6 text-white" />
            </div>
            {/* Pulse animation */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 bg-black text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              Get AI Support
              <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
            </div>
          </div>
        </div>
      )}

      {/* Support Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-[500px] bg-white border-2 border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-black p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <FiCpu className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Support</h3>
                <p className="text-gray-300 text-xs">Always here to help</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white transition-colors p-1"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                  message.type === 'user' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    {message.type === 'bot' && <FiCpu className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />}
                    {message.type === 'user' && <FiUser className="w-4 h-4 text-white mt-1 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className={`text-sm leading-relaxed whitespace-pre-line ${
                        message.type === 'user' ? 'text-white' : 'text-gray-800'
                      }`}>{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-gray-300' : 'text-gray-500'
                      }`}>{formatTime(message.timestamp)}</p>
                    </div>
                  </div>
                  
                  {/* Feedback buttons */}
                  {message.needsFeedback && awaitingFeedback === message.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-gray-600 text-xs mb-3 font-medium">Was this helpful?</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFeedback(message.id, true)}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium shadow-sm"
                        >
                          <FiThumbsUp className="w-3 h-3" />
                          <span>Yes</span>
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, false)}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                        >
                          <FiThumbsDown className="w-3 h-3" />
                          <span>Need Help</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Email Form */}
            {showEmailForm && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mx-4 mb-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <FiMail className="w-4 h-4 text-gray-600" />
                  <h4 className="text-gray-800 font-semibold text-sm">Contact Information</h4>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-sm placeholder-gray-500 focus:border-black focus:outline-none focus:bg-white transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-sm placeholder-gray-500 focus:border-black focus:outline-none focus:bg-white transition-colors"
                  />
                  <button
                    onClick={handleEscalateToHuman}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-400 rounded-lg text-white text-sm font-semibold transition-colors flex items-center justify-center space-x-2 shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <FiMail className="w-4 h-4" />
                        <span>Contact Human Support</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {isLoading && !showEmailForm && (
              <div className="flex justify-start px-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-3 max-w-[75%] shadow-sm">
                  <div className="flex items-center space-x-3">
                    <FiCpu className="w-4 h-4 text-gray-500" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 text-sm placeholder-gray-500 focus:border-black focus:outline-none focus:bg-white transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-4 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-300 rounded-xl text-white transition-colors flex items-center justify-center shadow-sm"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerSupport;