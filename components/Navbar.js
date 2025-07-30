import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import T from './T';
import LanguageSelector from './LanguageSelector';

const Navbar = ({ user, onLogout }) => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (onLogout) onLogout();
      router.push('/home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 navbar-container">
          {/* Logo */}
          <Link href="/home" className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-white to-gray-400 rounded-full"></div>
            <span className="text-lg font-bold gradient-text">Ecouter Transcribe</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 translation-stable">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/80 hover:text-white transition-colors">
                  <T>Dashboard</T>
                </Link>
                <Link href="/upload" className="text-sm text-white/80 hover:text-white transition-colors">
                  <T>Upload</T>
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">{user.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <span className="text-sm text-white/80">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <T>Logout</T>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Language Selector */}
                <div className="flex items-center translation-stable">
                  <LanguageSelector isCollapsed={true} />
                </div>
                <Link href="/features" className="text-sm text-white/80 hover:text-white transition-colors">
                  <T>Features</T>
                </Link>
                <Link href="/help" className="text-sm text-white/80 hover:text-white transition-colors">
                  <T>Help Center</T>
                </Link>
                <Link href="/contact" className="text-sm text-white/80 hover:text-white transition-colors">
                  <T>Contact</T>
                </Link>
                <Link href="/login" className="text-sm text-white/80 hover:text-white transition-colors">
                  <T>Login</T>
                </Link>
                <Link href="/signup" className="glow-button px-4 py-1.5 rounded-lg text-sm font-medium">
                  <T>Sign Up</T>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-white/80 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
