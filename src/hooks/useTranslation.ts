import { useLanguage } from '../store/useLanguage';
import { th } from '../i18n/th';
import { en } from '../i18n/en';

type Dictionary = typeof th;

export function useTranslation() {
  const { language, toggleLanguage } = useLanguage();
  const dict: Dictionary = language === 'th' ? th : en;

  const t = (path: string, params?: Record<string, string | number>) => {
    const keys = path.split('.');
    let value: any = dict;

    for (const key of keys) {
      if (value[key] === undefined) {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
      value = value[key];
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key does not resolve to string: ${path}`);
      return path;
    }

    let result = value;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, String(v));
      });
    }

    return result;
  };

  return { t, language, toggleLanguage };
}
