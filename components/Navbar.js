import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import T from './T';
import LanguageSelector from './LanguageSelector';

const Navbar = ({ user, onLogout }) => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial values
    handleResize();
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
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
        <div className="flex justify-between items-center h-16 sm:h-12 navbar-container">
          {/* Logo */}
          <Link href="/home" className="flex items-center space-x-2">
            <Image 
              src="/logo-new.png" 
              alt="Ecouter Logo" 
              width={32} 
              height={32} 
              className="w-8 h-8 object-contain"
            />
            <span className="text-sm sm:text-lg md:text-xl font-medium gradient-text" style={{fontSize: '12px'}}>Ecouter</span>
          </Link>

          {/* Navigation Links - Hidden on Mobile */}
          {!isMobile && (
            <div className="flex items-center space-x-6 translation-stable">
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
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <div>
            <button
              className="text-white/80 hover:text-white focus:outline-none"
              aria-label="Open menu"
              onClick={() => setShowMobileMenu(true)}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            </div>
          )}

          {/* Mobile Slide-in Menu */}
          {showMobileMenu && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileMenu(false)} />
              {/* Menu Panel */}
              <div className="relative w-4/5 max-w-xs bg-black border-r border-white/10 h-full flex flex-col p-6 space-y-6 animate-slide-in-left">
                <button
                  className="self-end mb-4 text-white/70 hover:text-white focus:outline-none"
                  aria-label="Close menu"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Links (vertical) */}
                {user ? (
                  <>
                    <Link href="/dashboard" className="block py-2 text-base text-white/90 hover:text-white font-medium">
                      <T>Dashboard</T>
                    </Link>
                    <Link href="/upload" className="block py-2 text-base text-white/90 hover:text-white font-medium">
                      <T>Upload</T>
                    </Link>
                    <Link href="/storage" className="block py-2 text-base text-white/90 hover:text-white font-medium">
                      <T>Storage</T>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block py-2 text-base text-white/70 hover:text-white font-medium text-left w-full"
                    >
                      <T>Logout</T>
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/features" className="block py-2 text-base text-white/90 hover:text-white font-medium">
                      <T>Features</T>
                    </Link>
                    <Link href="/help" className="block py-2 text-base text-white/90 hover:text-white font-medium">
                      <T>Help Center</T>
                    </Link>
                    <Link href="/contact" className="block py-2 text-base text-white/90 hover:text-white font-medium">
                      <T>Contact</T>
                    </Link>
                    <Link href="/login" className="block py-2 text-base text-white/90 hover:text-white font-medium">
                      <T>Login</T>
                    </Link>
                    <Link href="/signup" className="block py-2 text-base font-bold text-black bg-white rounded-lg mt-2 text-center">
                      <T>Sign Up</T>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
