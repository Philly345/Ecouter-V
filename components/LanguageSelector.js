import React, { useState, useRef, useEffect } from 'react';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';
import { useTranslation } from './TranslationContext';

const LanguageSelector = ({ isCollapsed = false }) => {
  const { currentLanguage, changeLanguage, getAvailableLanguages, getCurrentLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const availableLanguages = getAvailableLanguages();
  const currentLang = getCurrentLanguage();

  // Filter languages based on search term
  const filteredLanguages = availableLanguages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = async (languageCode) => {
    await changeLanguage(languageCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center text-sm font-medium text-gray-300 
          rounded-lg hover:text-white transition-colors duration-200
          ${isCollapsed ? 'px-2 py-1' : 'px-3 py-2 justify-between'}
        `}
        title={`Language: ${currentLang.name}`}
      >
        <div className="flex items-center space-x-1">
          <FiGlobe className="w-4 h-4" />
          <span className="text-lg">{currentLang.flag}</span>
          {!isCollapsed && (
            <span className="truncate max-w-[80px]">{currentLang.name}</span>
          )}
        </div>
        {!isCollapsed && <FiChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {isOpen && (
        <div 
          className={`
            absolute z-50 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg
            ${isCollapsed ? 'left-full ml-2 top-0' : 'left-0 right-0'}
            max-h-64 overflow-hidden
          `}
          style={{ minWidth: isCollapsed ? '280px' : 'auto' }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Language List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`
                    flex items-center w-full px-3 py-2 text-sm text-left
                    hover:bg-gray-700 transition-colors duration-150
                    ${language.code === currentLanguage ? 'bg-blue-600 text-white' : 'text-gray-300'}
                  `}
                >
                  <span className="text-lg mr-2">{language.flag}</span>
                  <span className="flex-1">{language.name}</span>
                  {language.code === currentLanguage && (
                    <span className="text-xs text-blue-200">✓</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400">
                No languages found
              </div>
            )}
          </div>

          {/* Popular Languages Quick Access */}
          {!searchTerm && (
            <div className="border-t border-gray-700 p-2">
              <div className="text-xs text-gray-400 mb-1">Popular:</div>
              <div className="flex flex-wrap gap-1">
                {['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru', 'ar'].map(code => {
                  const lang = availableLanguages.find(l => l.code === code);
                  if (!lang) return null;
                  return (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`
                        px-2 py-1 text-xs rounded border transition-colors
                        ${code === currentLanguage 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        }
                      `}
                      title={lang.name}
                    >
                      {lang.flag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
