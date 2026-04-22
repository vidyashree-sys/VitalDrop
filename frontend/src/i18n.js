import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { "dashboard": "Dashboard", "logout": "Logout", "emergency_sos": "Emergency SOS" } },
    hi: { translation: { "dashboard": "डैशबोर्ड", "logout": "लॉगआउट", "emergency_sos": "आपातकालीन SOS" } },
    kn: { translation: { "dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "logout": "ಲಾಗ್ ಔಟ್", "emergency_sos": "ತುರ್ತು SOS" } }
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;