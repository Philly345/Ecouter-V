import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FloatingBubbles from '../components/FloatingBubbles';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../components/AuthContext';
import { DeviceFingerprinter } from '../utils/deviceFingerprint';

export default function Login() {
  const router = useRouter();
  const { login, user, authChecked, authLoading } = useAuth();
  const { verified, error: urlError, email: urlEmail, count, limit } = router.query;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [accountLimitError, setAccountLimitError] = useState(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);

  // Generate device fingerprint on component mount
  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        const fingerprint = await DeviceFingerprinter.generateFingerprint();
        setDeviceFingerprint(fingerprint);
        console.log('Device fingerprint generated for login');
      } catch (error) {
        console.error('Failed to generate device fingerprint:', error);
      }
    };
    
    generateFingerprint();
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (authChecked && user) {
      setRedirecting(true);
      setSuccessMessage(`You are already signed in as ${user.email}. Redirecting to dashboard...`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  }, [authChecked, user, router]);

  // Show success message if coming from verification
  useEffect(() => {
    if (verified === 'true' && !user) {
      setSuccessMessage('Email verified successfully! You can now log in.');
      // Clear the query parameter
      router.replace('/login', undefined, { shallow: true });
    }
  }, [verified, router, user]);

  // Handle account limit errors from URL parameters
  useEffect(() => {
    if (urlError === 'account_limit_reached' && urlEmail && count && limit) {
      setAccountLimitError({
        email: decodeURIComponent(urlEmail),
        accountCount: parseInt(count),
        accountLimit: parseInt(limit)
      });
      // Clear URL parameters
      router.replace('/login', undefined, { shallow: true });
    } else if (urlError === 'already_logged_in' && urlEmail) {
      setError(`You are already signed in as ${decodeURIComponent(urlEmail)}. Please sign out first to use a different account.`);
      router.replace('/login', undefined, { shallow: true });
    }
  }, [urlError, urlEmail, count, limit, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent login if user is already signed in
    if (user) {
      setError(`You are already signed in as ${user.email}. Please sign out first if you want to use a different account.`);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Include device fingerprint in login data
      const loginData = {
        email,
        password,
        deviceFingerprint: deviceFingerprint
      };

      const result = await login(loginData);
      
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
    // Prevent Google login if user is already signed in
    if (user) {
      setError(`You are already signed in as ${user.email}. Please sign out first if you want to use a different account.`);
      return;
    }
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
              <h1 className="text-lg font-semibold gradient-text mb-1">
                {redirecting ? 'Already Signed In' : 'Welcome Back'}
              </h1>
              <p className="text-gray-400 text-xs">
                {redirecting ? 'Redirecting to your dashboard...' : 'Sign in to your account to continue'}
              </p>
            </div>

            {successMessage && (
              <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300 text-xs">
                {successMessage}
              </div>
            )}

            {/* Show loading state during auth check */}
            {authLoading && !authChecked ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : redirecting ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm text-gray-400">Redirecting...</p>
              </div>
            ) : (
            <div className="space-y-3">
              {/* Google Login Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading || !!user}
                className="w-full flex items-center justify-center space-x-2 py-1.5 border border-white/20 rounded-lg hover:border-white/40 transition-all duration-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/20 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-3 h-3" />
                      ) : (
                        <FiEye className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-white">
                    Forgot password?
                  </Link>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                {accountLimitError && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <FiAlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className="text-orange-300 font-medium mb-1">
                          Account Creation Limit Reached
                        </p>
                        <p className="text-orange-200/80 mb-2">
                          Cannot create account for {accountLimitError.email}. 
                          You have reached the maximum limit of {accountLimitError.accountLimit} accounts per device.
                        </p>
                        <p className="text-orange-200/70">
                          Please sign in to one of your existing accounts instead.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !!user}
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
