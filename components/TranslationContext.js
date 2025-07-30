import React, { createContext, useContext, useState, useEffect } from 'react';
import { translateText, SUPPORTED_LANGUAGES, getLanguageName } from '../utils/languages';

const TranslationContext = createContext();

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState(new Map());
  const [translationQueue, setTranslationQueue] = useState(new Set());

  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('kilo-language');
    if (savedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage
  const changeLanguage = async (languageCode) => {
    if (languageCode === currentLanguage) return;
    
    setIsTranslating(true);
    
    // Use RAF to prevent layout thrashing
    requestAnimationFrame(() => {
      setCurrentLanguage(languageCode);
      localStorage.setItem('kilo-language', languageCode);
      
      // Clear cache when language changes
      setTranslationCache(new Map());
      setTranslationQueue(new Set());
      
      // Reduce delay to minimize layout shift
      setTimeout(() => setIsTranslating(false), 150);
    });
  };

  // Translation function with caching
  const t = async (text, options = {}) => {
    if (!text || typeof text !== 'string') return text;
    
    // Return original text if current language is English
    if (currentLanguage === 'en') return text;

    // Check cache first
    const cacheKey = `${text}_${currentLanguage}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    try {
      const translated = await translateText(text, currentLanguage, 'en');
      
      // Update cache
      setTranslationCache(prev => new Map(prev.set(cacheKey, translated)));
      
      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text on error
    }
  };

  // Sync translation function (returns promise)
  const translate = (text) => {
    if (!text || typeof text !== 'string') return Promise.resolve(text);
    if (currentLanguage === 'en') return Promise.resolve(text);

    const cacheKey = `${text}_${currentLanguage}`;
    if (translationCache.has(cacheKey)) {
      return Promise.resolve(translationCache.get(cacheKey));
    }

    return translateText(text, currentLanguage, 'en').then(translated => {
      setTranslationCache(prev => new Map(prev.set(cacheKey, translated)));
      return translated;
    }).catch(error => {
      console.error('Translation failed:', error);
      return text;
    });
  };

  // Get list of available languages
  const getAvailableLanguages = () => {
    return SUPPORTED_LANGUAGES.map(lang => ({
      code: lang.code,
      name: lang.name,
      flag: lang.flag,
      needsTranslation: lang.needsTranslation
    }));
  };

  // Get current language info
  const getCurrentLanguage = () => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    translate,
    isTranslating,
    getAvailableLanguages,
    getCurrentLanguage,
    getLanguageName
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationContext;
