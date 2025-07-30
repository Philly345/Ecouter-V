import Head from 'next/head';
import Link from 'next/link';
import FloatingBubbles from '../components/FloatingBubbles';
import { FiHome } from 'react-icons/fi';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found - Ecouter Transcribe</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gradient-to-r from-white to-gray-400 rounded-full mx-auto mb-6"></div>
            
            <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
            <p className="text-white/70 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            <Link 
              href="/home"
              className="glow-button inline-flex items-center space-x-2 px-6 py-3 rounded-lg"
            >
              <FiHome className="w-4 h-4" />
              <span>Go Home</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
