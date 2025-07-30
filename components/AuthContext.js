import { createContext, useState, useContext, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('🔍 Starting auth check...');
    try {
      const token = localStorage.getItem('token');
      console.log('📝 Token found:', !!token);
      
      if (!token) {
        console.log('❌ No token, setting loading false');
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      console.log('🌐 Making verify request...');
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Verify response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Auth check successful, user:', data.user);
        setUser(data.user);
      } else {
        console.log('❌ Auth check failed, removing token');
        const errorText = await response.text();
        console.log('Error response:', errorText);
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('💥 Auth check failed with error:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      console.log('🏁 Auth check complete, setting states');
      setLoading(false);
      setAuthChecked(true);
    }
  };

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
      localStorage.setItem('token', data.token);
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
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      router.push('/home');
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };

  const value = {
    user,
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
