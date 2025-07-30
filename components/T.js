import React, { useState, useEffect } from 'react';
import { useTranslation } from './TranslationContext';

const T = ({ children, fallback = null, className = '', style = {}, ...props }) => {
  const { translate, currentLanguage, isTranslating } = useTranslation();
  const [translatedText, setTranslatedText] = useState(children);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!children || typeof children !== 'string') {
      setTranslatedText(children);
      return;
    }

    if (currentLanguage === 'en') {
      setTranslatedText(children);
      return;
    }

    setLoading(true);
    translate(children)
      .then(translated => {
        setTranslatedText(translated);
        setLoading(false);
      })
      .catch(error => {
        console.error('Translation error:', error);
        setTranslatedText(children);
        setLoading(false);
      });
  }, [children, currentLanguage, translate]);

  // Stabilized style to prevent layout shifts
  const stabilizedStyle = {
    minHeight: '1.2em',
    display: 'inline-block',
    verticalAlign: 'top',
    boxSizing: 'border-box',
    transition: isTranslating ? 'none' : 'opacity 0.15s ease-out',
    // Only apply opacity if not using gradient text (which has its own transparency)
    opacity: (loading || isTranslating) && !className.includes('gradient') ? 0.8 : 1,
    ...style
  };

  return (
    <span 
      className={`translation-stable ${className}`} 
      style={stabilizedStyle}
      {...props}
    >
      {translatedText}
    </span>
  );
};

// Hook for programmatic translation
export const useT = () => {
  const { translate, currentLanguage } = useTranslation();
  
  return (text) => {
    if (!text || typeof text !== 'string') return text;
    if (currentLanguage === 'en') return text;
    return translate(text);
  };
};

// Higher-order component for translating component props
export const withTranslation = (WrappedComponent) => {
  return function TranslatedComponent(props) {
    const { translate, currentLanguage } = useTranslation();

    const translateProps = async (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const translated = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.length > 0) {
          translated[key] = currentLanguage === 'en' ? value : await translate(value);
        } else {
          translated[key] = value;
        }
      }
      return translated;
    };

    return <WrappedComponent {...props} translateProps={translateProps} />;
  };
};

export default T;
