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
        
        // Token is valid, set user from payload
        setUser({ userId: payload.userId, email: payload.email });
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
  }, []);

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

  const login = async (email, password) => {
    console.log('🔐 Starting login process...');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('📡 Login response status:', response.status);
    console.log('📊 Login response data:', data);

    if (response.ok) {
      console.log('💾 Storing token and setting user...');
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }
      setToken(data.token); // Set token in state
      setUser(data.user);
      setAuthChecked(true);
      console.log('✅ Login successful, user set:', data.user);
      return { success: true };
    } else {
      console.log('❌ Login failed:', data.error);
      return { success: false, error: data.error };
    }
  };

  const signup = async (name, email, password) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // For email verification flow, don't set user or token yet
      return { success: true, requiresVerification: data.requiresVerification, email: data.email };
    } else {
      return { success: false, error: data.error };
    }
  };

  const logout = async () => {
    try {
      // Clear token immediately to prevent any further API calls
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setToken(null);
      setUser(null);
      
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
