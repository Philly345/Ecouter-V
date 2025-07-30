import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FiHome, 
  FiUpload, 
  FiClock, 
  FiPlay, 
  FiCheck, 
  FiHardDrive,
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronLeft,
  FiSettings,
  FiMessageSquare
} from 'react-icons/fi';
import T from './T';

const Sidebar = ({ user, currentPage = 'dashboard', onLogout, onSidebarToggle }) => {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Changed from isSidebarHidden to isSidebarCollapsed for clarity
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Notify parent component when sidebar state changes
  const toggleSidebar = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
    if (onSidebarToggle) {
      onSidebarToggle(collapsed);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome, href: '/dashboard' },
    { id: 'upload', label: 'Upload File', icon: FiUpload, href: '/upload' },
    { id: 'recent', label: 'Recent Files', icon: FiClock, href: '/files/recent' },
    { id: 'processing', label: 'Processing', icon: FiPlay, href: '/files/processing' },
    { id: 'completed', label: 'Completed', icon: FiCheck, href: '/files/completed' },
    { id: 'audio-chat', label: 'Chat with Audio', icon: FiMessageSquare, href: '/audio-chat' },
    { id: 'storage', label: 'Storage Usage', icon: FiHardDrive, href: '/storage' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-black border-r border-white/10 z-50 transition-all duration-300 overflow-y-auto ${
        isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {!isCollapsed && !isSidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-white to-gray-400 rounded-full"></div>
                <span className="text-sm font-bold gradient-text">Ecouter</span>
              </div>
            )}
            {isCollapsed || isSidebarCollapsed ? (
              <div className="w-6 h-6 bg-gradient-to-r from-white to-gray-400 rounded-full"></div>
            ) : null}
            <div className="flex items-center">
              <button
                onClick={() => toggleSidebar(!isSidebarCollapsed)}
                className="text-white/60 hover:text-white transition-colors mr-2"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <FiChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-white/60 hover:text-white transition-colors lg:hidden"
              >
                {isCollapsed ? <FiMenu className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-white/10">
            <Link href="/profile">
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-sm text-white">{user.name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                {!isCollapsed && !isSidebarCollapsed && (
                  <div>
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-white/60 hover:text-white transition-colors">{user.email}</p>
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isDisabled = item.id === 'audio-chat'; // Disable chat with audio
            
            if (isDisabled) {
              // Render disabled chat with audio item
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg mb-1 opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-white/40" />
                    {!isCollapsed && !isSidebarCollapsed && (
                      <span className="text-sm text-white/40">
                        <T>{item.label}</T>
                      </span>
                    )}
                  </div>
                  {!isCollapsed && !isSidebarCollapsed && (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                      <T>Beta</T>
                    </span>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`sidebar-link flex items-center space-x-3 px-3 py-2 rounded-lg mb-1 transition-all duration-200 ${
                  isActive ? 'active' : ''
                }`}
              >
                <Icon className="w-4 h-4 text-white/70" />
                {!isCollapsed && !isSidebarCollapsed && (
                  <span className="text-sm text-white/80">
                    <T>{item.label}</T>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className={`absolute bottom-0 left-0 right-0 border-t border-white/10 ${isCollapsed || isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {!isCollapsed && !isSidebarCollapsed ? (
            <div className="mb-4">
              <button
                onClick={() => onLogout && onLogout()}
                className="w-full flex items-center px-3 py-2 space-x-3 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="text-sm">
                  <T>Logout</T>
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onLogout && onLogout()}
              className="w-full flex items-center justify-center p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
              title="Logout"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          )}
          {!isCollapsed && !isSidebarCollapsed && (
            <div className="text-xs text-white/50 text-center mt-2">
              <T>© 2025 Ecouter Systems</T>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed top-16 left-4 z-40 lg:hidden glow-button p-2 rounded-lg"
      >
        <FiMenu className="w-4 h-4" />
      </button>
    </>
  );
};

export default Sidebar;
