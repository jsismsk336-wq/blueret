import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'th' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'th',
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set((state) => ({ language: state.language === 'th' ? 'en' : 'th' })),
    }),
    {
      name: 'blueret-language',
    }
  )
);
