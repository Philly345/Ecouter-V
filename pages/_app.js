import '../styles/globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '../components/AuthContext';
import { TranslationProvider } from '../components/TranslationContext';
import SEO from '../components/SEO';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <TranslationProvider>
        <SEO />
        <ToastContainer position="top-right" autoClose={3000} />
        <Component {...pageProps} />
        <Analytics />
        <SpeedInsights />
      </TranslationProvider>
    </AuthProvider>
  );
}

export default MyApp;
