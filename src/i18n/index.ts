import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

const getSystemLanguage = (): string => {
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('zh')) return 'zh';
  return 'en';
};

const getSavedLanguage = (): string | null => {
  try {
    const stored = localStorage.getItem('agentforge-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.language || null;
    }
    return null;
  } catch {
    return null;
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: getSavedLanguage() || getSystemLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
};

export default i18n;
