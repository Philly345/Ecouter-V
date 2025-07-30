import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import FloatingBubbles from '../components/FloatingBubbles';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - Ecouter Transcribe</title>
        <meta name="description" content="Reset your password and regain access to your account." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            {/* Back to Login */}
            <div className="mb-8">
              <Link href="/login" className="text-white/60 hover:text-white transition-colors text-sm flex items-center space-x-2">
                <FiArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-white to-gray-400 rounded-full mx-auto mb-4"></div>
              <h1 className="text-3xl font-bold gradient-text mb-2">Forgot Password?</h1>
              <p className="text-white/70">
                {sent 
                  ? "Check your email for reset instructions" 
                  : "Enter your email to receive a password reset link"
                }
              </p>
            </div>

            {/* Form */}
            <div className="file-card p-8">
              {sent ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <FiMail className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Email Sent!</h3>
                  <p className="text-white/70 text-sm">
                    If an account with email <span className="text-white font-medium">{email}</span> exists, 
                    you'll receive a password reset link shortly.
                  </p>
                  <p className="text-white/60 text-xs">
                    Don't see the email? Check your spam folder or try again.
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setSent(false);
                        setEmail('');
                      }}
                      className="text-white/60 hover:text-white transition-colors text-sm"
                    >
                      Send another email
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="form-input w-full pl-10 pr-4 py-3 rounded-lg"
                          placeholder="Enter your email address"
                          required
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="glow-button w-full py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="spinner w-4 h-4"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* Login Link */}
              <div className="mt-6 text-center">
                <span className="text-white/60 text-sm">Remember your password? </span>
                <Link href="/login" className="text-white hover:text-white/80 transition-colors text-sm font-medium">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
