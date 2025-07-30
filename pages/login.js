import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FloatingBubbles from '../components/FloatingBubbles';
import { FiMail, FiLock } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../components/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { verified } = router.query;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Show success message if coming from verification
  useEffect(() => {
    if (verified === 'true') {
      setSuccessMessage('Email verified successfully! You can now log in.');
      // Clear the query parameter
      router.replace('/login', undefined, { shallow: true });
    }
  }, [verified, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <>
      <Head>
        <title>Login - Ecouter Transcribe</title>
        <meta name="description" content="Sign in to your account and access your transcriptions." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        <FloatingBubbles />
        
        <div className="w-full max-w-xs file-card backdrop-blur-sm relative z-10">
          <div className="p-5">
            <div className="text-center mb-3">
              <h1 className="text-lg font-semibold gradient-text mb-1">Welcome Back</h1>
              <p className="text-gray-400 text-xs">Sign in to your account to continue</p>
            </div>

            {successMessage && (
              <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300 text-xs">
                {successMessage}
              </div>
            )}

            <div className="space-y-3">
              {/* Google Login Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-2 py-1.5 border border-white/20 rounded-lg hover:border-white/40 transition-all duration-300 text-xs"
              >
                <FcGoogle className="w-3 h-3" />
                <span>Continue with Google</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black px-2 text-gray-400">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-white">
                    Forgot password?
                  </Link>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-white text-black hover:bg-gray-200 transition-colors rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              <div className="text-center text-xs text-gray-400">
                Don't have an account?{" "}
                <Link href="/signup" className="text-white hover:underline">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
