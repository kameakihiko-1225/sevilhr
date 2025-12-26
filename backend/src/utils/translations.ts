import * as uzTranslations from '../translations/uz.json';
import * as enTranslations from '../translations/en.json';
import * as ruTranslations from '../translations/ru.json';

export type Locale = 'uz' | 'en' | 'ru';

const translations: Record<Locale, any> = {
  uz: uzTranslations,
  en: enTranslations,
  ru: ruTranslations,
};

/**
 * Get translation for a given locale and key path
 * @param locale - The locale ('uz', 'en', 'ru')
 * @param keyPath - Dot-separated path to the translation key (e.g., 'start.welcome')
 * @param params - Optional parameters to replace in the translation (e.g., {channel: 'test'})
 * @returns The translated string or the key path if not found
 */
export function t(locale: Locale, keyPath: string, params?: Record<string, string>): string {
  const localeTranslations = translations[locale] || translations.uz;
  
  const keys = keyPath.split('.');
  let value: any = localeTranslations;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      // Fallback to Uzbek if key not found
      const uzValue = getNestedValue(translations.uz, keys);
      if (uzValue) {
        value = uzValue;
        break;
      }
      // If still not found, return the key path
      return keyPath;
    }
  }
  
  if (typeof value !== 'string') {
    return keyPath;
  }
  
  // Replace parameters in the string
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] || match;
    });
  }
  
  return value;
}

/**
 * Helper function to get nested value from object
 */
function getNestedValue(obj: any, keys: string[]): any {
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }
  return value;
}

/**
 * Get user's locale from database or default to 'uz'
 */
export async function getUserLocale(userId: string): Promise<Locale> {
  const { prisma } = await import('./prisma');
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true },
    });
    
    if (user && user.locale && ['uz', 'en', 'ru'].includes(user.locale)) {
      return user.locale as Locale;
    }
  } catch (error) {
    console.error('Error getting user locale:', error);
  }
  
  return 'uz'; // Default to Uzbek
}

