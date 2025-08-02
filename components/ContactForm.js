import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: 'sending', message: 'Sending message...' });

    try {
      const response = await fetch('/api/contact/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setStatus({ 
          type: 'success', 
          message: 'Message sent successfully! We\'ll get back to you soon.' 
        });
        setFormData({ name: '', email: '', message: '' });
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.message || 'Something went wrong. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Contact Us</h2>
      
      {status.message && (
        <div 
          className={`p-4 mb-6 rounded ${
            status.type === 'error' 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}
        >
          {status.message}
          {status.type === 'success' && status.previewUrl && (
            <div className="mt-2 text-sm">
              <a 
                href={status.previewUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                View email preview
              </a>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows="5"
            value={formData.message}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="How can we help you?"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black'
            }`}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
}
