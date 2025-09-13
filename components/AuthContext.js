import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setUser(null);
        setToken(null);
        setAuthChecked(true);
        return;
      }

      // Quick token validation without API call for better performance
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
          // Token expired
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
          setAuthChecked(true);
          return;
        }
        
        // Token is valid, only set minimal user data if we don't already have a full user object
        if (!user || !user.name) {
          setUser({ 
            userId: payload.userId, 
            id: payload.userId, // For backward compatibility
            email: payload.email,
            name: payload.name 
          });
        }
        setToken(storedToken);
        setAuthChecked(true);
        
      } catch (tokenError) {
        // Invalid token format
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setAuthChecked(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setToken(null);
      setAuthChecked(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAuth();

    const handleStorageChange = (event) => {
      if (event.key === 'token') {
        console.log('Token changed, re-checking auth...');
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (loginData) => {
    console.log('🔐 Starting login process...');
    
    // Handle both old format (email, password) and new format (object)
    let email, password, deviceFingerprint;
    if (typeof loginData === 'object' && loginData.email) {
      ({ email, password, deviceFingerprint } = loginData);
    } else {
      // Legacy support for old format
      email = loginData;
      password = arguments[1];
      deviceFingerprint = null;
    }
    
    // Check if user is already logged in
    if (user && user.email) {
      console.log('⚠️ User already logged in:', user.email);
      if (user.email === email) {
        // Same user trying to login again - allow it
        console.log('✅ Same user logging in again, allowing...');
        return { success: true };
      } else {
        // Different user trying to login - prevent it
        console.log('🚫 Different user trying to login, blocking...');
        return { 
          success: false, 
          error: `You are already signed in as ${user.email}. Please sign out first to use a different account.` 
        };
      }
    }
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, deviceFingerprint }),
    });

    const data = await response.json();
    console.log('📡 Login response status:', response.status);
    console.log('📊 Login response data:', data);

    if (response.ok) {
      console.log('💾 Storing token and setting user...');
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
        // Store user email for session tracking
        localStorage.setItem('activeUserEmail', data.user.email);
      }
      setToken(data.token); // Set token in state
      
      // Ensure user object has both id and userId for compatibility
      const userData = {
        ...data.user,
        userId: data.user.id, // Set userId from id for JWT/API compatibility
        id: data.user.id      // Keep id as well for component compatibility
      };
      
      setUser(userData);
      setAuthChecked(true);
      console.log('✅ Login successful, user set:', userData);
      return { success: true };
    } else {
      console.log('❌ Login failed:', data.error);
      return { success: false, error: data.error };
    }
  };

  const signup = async (signupData) => {
    // Support both old format (name, email, password) and new format (object with deviceFingerprint)
    let requestBody;
    if (typeof signupData === 'string') {
      // Old format - handle backward compatibility
      requestBody = { name: signupData, email: arguments[1], password: arguments[2] };
    } else {
      // New format - object with device fingerprint
      requestBody = signupData;
    }

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok) {
      // For email verification flow, don't set user or token yet
      return { success: true, requiresVerification: data.requiresVerification, email: data.email };
    } else {
      return { success: false, error: data.error, ...data };
    }
  };

  const logout = async () => {
    try {
      // Clear token immediately to prevent any further API calls
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('activeUserEmail'); // Clear active user tracking
        // Clear all other potential cached data
        localStorage.removeItem('user');
        localStorage.removeItem('dashboard-cache');
        localStorage.removeItem('files-cache');
      }
      setToken(null);
      setUser(null);
      setAuthChecked(true);
      
      // Redirect immediately before making the API call
      router.push('/login');
      
      // Then clear the server-side cookie (this can happen in background)
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, we've already cleared local state and redirected
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    updateUser,
    loading,
    authChecked,
    authLoading: loading,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
