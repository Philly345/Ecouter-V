import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { FiMenu } from 'react-icons/fi';
import { useAuth } from './AuthContext';

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar 
        user={user}
        onSidebarToggle={handleSidebarToggle} 
        onLogout={handleLogout}
        isCollapsed={false} 
      />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-16 lg:ml-64'}`}>
        <header className="flex items-center h-16 px-4 lg:hidden">
          <button 
            onClick={() => handleSidebarToggle(false)} 
            className="p-2 text-white"
          >
            <FiMenu size={24} />
          </button>
        </header>
        
        <main className="px-4 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
