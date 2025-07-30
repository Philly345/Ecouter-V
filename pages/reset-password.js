import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import FloatingBubbles from '../components/FloatingBubbles';
import { FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <Head>
        <title>Reset Password - Ecouter Transcribe</title>
        <meta name="description" content="Create a new password for your account." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            {/* Back to Login */}
            <div className="mb-8">
              <Link href="/login" className="text-white/60 hover:text-white transition-colors text-sm">
                ← Back to Login
              </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-white to-gray-400 rounded-full mx-auto mb-4"></div>
              <h1 className="text-3xl font-bold gradient-text mb-2">Reset Password</h1>
              <p className="text-white/70">
                {success 
                  ? "Password reset successful!" 
                  : "Enter your new password below"
                }
              </p>
            </div>

            {/* Form */}
            <div className="file-card p-8">
              {success ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <FiCheck className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Password Reset Complete!</h3>
                  <p className="text-white/70 text-sm">
                    Your password has been successfully updated. You'll be redirected to the login page in a few seconds.
                  </p>
                  <div className="pt-4">
                    <Link 
                      href="/login"
                      className="glow-button inline-block px-6 py-2 rounded-lg text-sm font-medium"
                    >
                      Go to Login
                    </Link>
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
                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="form-input w-full pl-10 pr-12 py-3 rounded-lg"
                          placeholder="Enter new password"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                        >
                          {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="form-input w-full pl-10 pr-12 py-3 rounded-lg"
                          placeholder="Confirm new password"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                        >
                          {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-white/60 mb-2">Password requirements:</p>
                      <ul className="text-xs text-white/60 space-y-1">
                        <li className={`flex items-center space-x-2 ${formData.password.length >= 6 ? 'text-green-400' : ''}`}>
                          <FiCheck className="w-3 h-3" />
                          <span>At least 6 characters</span>
                        </li>
                        <li className={`flex items-center space-x-2 ${formData.password === formData.confirmPassword && formData.password ? 'text-green-400' : ''}`}>
                          <FiCheck className="w-3 h-3" />
                          <span>Passwords match</span>
                        </li>
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || !token}
                      className="glow-button w-full py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="spinner w-4 h-4"></div>
                          <span>Updating Password...</span>
                        </div>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
