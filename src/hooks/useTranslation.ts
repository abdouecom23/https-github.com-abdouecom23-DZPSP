import { useState, useEffect } from 'react';
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';
import ar from '../i18n/ar.json';

export type Language = 'en' | 'fr' | 'ar';

const translations: Record<Language, typeof en> = {
  en,
  fr,
  ar: ar as unknown as typeof en // Force structure compatibility
};

export function useTranslation() {
  const [lang, setLangState] = useState<Language>(() => {
    // Determine language from URL path or local storage
    const path = window.location.pathname;
    if (path.includes('/fr')) return 'fr';
    if (path.includes('/ar')) return 'ar';
    const saved = localStorage.getItem('dinarflow_lang') as Language;
    return saved === 'fr' || saved === 'ar' || saved === 'en' ? saved : 'fr'; // Default to French as commonly used in Algerian business, or EN
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('dinarflow_lang', newLang);
    
    // Update HTML direction attribute for RTL support
    if (newLang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = newLang;
    }
  };

  useEffect(() => {
    // Set correct initial direction on mount
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let current: any = translations[lang];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback: any = translations['en'];
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return keyPath;
          }
        }
        return typeof fallback === 'string' ? fallback : keyPath;
      }
    }
    return typeof current === 'string' ? current : keyPath;
  };

  return { t, lang, setLang, isRtl: lang === 'ar' };
}
