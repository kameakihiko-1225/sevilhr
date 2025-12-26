import uz from './translations/uz.json';
import en from './translations/en.json';
import ru from './translations/ru.json';

export type Locale = 'uz' | 'en' | 'ru';

export const locales: Locale[] = ['uz', 'en', 'ru'];
export const defaultLocale: Locale = 'uz';

export const translations = {
  uz,
  en,
  ru,
};

export function getTranslations(locale: Locale = defaultLocale) {
  return translations[locale];
}

