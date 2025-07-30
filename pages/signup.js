import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import FloatingBubbles from '../components/FloatingBubbles';
import { useAuth } from '../components/AuthContext';

export default function Signup() {
  const router = useRouter();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      const result = await signup(formData.name, formData.email, formData.password);
      
      if (result.success) {
        // Redirect to verification page with email
        router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google';
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <>
      <Head>
        <title>Sign Up - Ecouter Transcribe</title>
        <meta name="description" content="Create an account to start transcribing your audio files with AI-powered accuracy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        <FloatingBubbles />
        
        <div className="w-full max-w-xs file-card backdrop-blur-sm relative z-10">
          <div className="p-5">
            <div className="text-center mb-3">
              <h1 className="text-lg font-semibold gradient-text mb-1">Create Account</h1>
              <p className="text-gray-400 text-xs">Join thousands of users transcribing smarter</p>
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-white/80 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white/40" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input w-full pl-9 pr-3 py-2 rounded-lg text-sm"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-white/80 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white/40" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input w-full pl-9 pr-3 py-2 rounded-lg text-sm"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-white/80 mb-1">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input w-full pl-9 pr-10 py-2 rounded-lg text-sm"
                    placeholder="Create a password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-white/80 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white/40" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input w-full pl-9 pr-10 py-2 rounded-lg text-sm"
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="mt-0.5 w-3 h-3 text-white bg-transparent border border-white/30 rounded focus:ring-white/50 focus:ring-1"
                  required
                />
                <label htmlFor="agreeToTerms" className="text-xs text-white/80">
                  I agree to the{" "}
                  <Link href="/terms" className="text-white hover:underline">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-white hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="glow-button w-full py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner w-3 h-3"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-3 flex items-center">
              <div className="flex-1 border-t border-white/10"></div>
              <span className="px-2 text-white/60 text-xs">or</span>
              <div className="flex-1 border-t border-white/10"></div>
            </div>

            {/* Google Signup */}
            <button
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center space-x-2 py-1.5 border border-white/20 rounded-lg hover:border-white/40 transition-all duration-300 text-xs"
            >
              <FcGoogle className="w-3 h-3" />
              <span>Continue with Google</span>
            </button>

            {/* Login Link */}
            <div className="mt-3 text-center">
              <span className="text-white/60 text-xs">Already have an account? </span>
              <Link href="/login" className="text-white hover:text-white/80 transition-colors text-xs font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
