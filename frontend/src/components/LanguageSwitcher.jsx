import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'HI' },
    { code: 'kn', label: 'KN' }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      backgroundColor: '#f1f5f9', 
      padding: '4px', 
      borderRadius: '10px',
      border: '1px solid #e2e8f0'
    }}>
      <Globe size={14} color="#64748b" style={{ marginLeft: '4px' }} />
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          style={{
            padding: '4px 10px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: i18n.language === lang.code ? '#3b82f6' : 'transparent',
            color: i18n.language === lang.code ? 'white' : '#64748b',
            boxShadow: i18n.language === lang.code ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;