import React, { useState, memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from './AuthContext';

// Lazy load sidebar for better performance
const Sidebar = dynamic(() => import('./Sidebar'), {
  loading: () => <div className="w-16 lg:w-64 bg-gray-800"></div>,
  ssr: false
});

const Layout = memo(({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const handleSidebarToggle = useMemo(() => (collapsed) => {
    setSidebarCollapsed(collapsed);
  }, []);

  const handleLogout = useMemo(() => async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout]);

  const mainContentClasses = useMemo(() => 
    `flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-16 lg:ml-64'}`,
    [sidebarCollapsed]
  );

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar 
        user={user}
        onSidebarToggle={handleSidebarToggle} 
        onLogout={handleLogout}
        isCollapsed={false} 
      />
      
      <div className={mainContentClasses}>
        <main className="px-4 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
