import '../styles/globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '../components/AuthContext';
import { TranslationProvider } from '../components/TranslationContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <TranslationProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <Component {...pageProps} />
      </TranslationProvider>
    </AuthProvider>
  );
}

export default MyApp;
