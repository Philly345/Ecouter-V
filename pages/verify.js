import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FloatingBubbles from '../components/FloatingBubbles';

export default function Verify() {
  const router = useRouter();
  const { email } = router.query;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');


  // Auto-focus first input on mount
  useEffect(() => {
    const firstInput = document.getElementById('code-0');
    if (firstInput) firstInput.focus();
  }, []);

  const handleCodeChange = (index, value) => {
    // Only allow numeric
    if (!/^[0-9]?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace to focus previous input
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
    // Left/right arrow navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Paste support for full code
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('Text').replace(/\D/g, '');
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      // Focus last input
      setTimeout(() => {
        const lastInput = document.getElementById('code-5');
        if (lastInput) lastInput.focus();
      }, 0);
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/login?verified=true');
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendMessage('New verification code sent to your email');
        setCode(['', '', '', '', '', '']);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Verify Email - Ecouter Transcribe</title>
        <meta name="description" content="Verify your email address to complete registration." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        <FloatingBubbles />
        <div className="w-full max-w-xs file-card backdrop-blur-sm relative z-10">
          <div className="p-5">
            <div className="text-center mb-3">
              <h1 className="text-lg font-semibold gradient-text mb-1">Verify Email</h1>
              <p className="text-gray-400 text-xs">
                {email ? (
                  <>We've sent a 6-digit code to {email}</>
                ) : (
                  <>No email provided. Please return to sign up.</>
                )}
              </p>
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-xs">
                {error}
              </div>
            )}

            {resendMessage && (
              <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300 text-xs">
                {resendMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 6-Digit Code Input */}
              <div>
                <label className="block text-xs font-medium text-white/80 mb-2 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center space-x-2 mb-3" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-8 h-8 text-center bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 text-sm"
                      maxLength={1}
                      pattern="[0-9]"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || !email}
                className="glow-button w-full py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner w-3 h-3"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>
            </form>

            {/* Resend Code */}
            <div className="mt-3 text-center">
              <span className="text-white/60 text-xs">Didn't receive the code? </span>
              <button
                onClick={handleResendCode}
                disabled={resendLoading || !email}
                className="text-white hover:text-white/80 transition-colors text-xs font-medium disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </button>
            </div>

            {/* Back to Signup */}
            <div className="mt-3 text-center">
              <Link href="/signup" className="text-white/60 hover:text-white transition-colors text-xs">
                ← Back to Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
