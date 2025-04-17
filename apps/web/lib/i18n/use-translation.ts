import { dictionary } from './dictionary';
import { TranslationDictionary, NestedKeyOf } from './types';

type Dictionary = typeof dictionary;
type DictionaryKeys = NestedKeyOf<Dictionary>;

/**
 * Function to get a nested value from an object using a path string
 */
function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : null;
  }, obj);
}

/**
 * Hook that provides translation capabilities based on the current locale
 * @param locale Current language ('en' or 'vi')
 * @returns A translation function that takes a key and returns the corresponding text
 */
export function useTranslation(locale: string) {
  /**
   * Translates a key to a text string in the selected language
   * @param key Key in the dictionary
   * @param params Parameters to replace in the text string
   * @returns Translated text string
   */
  const t = (key: string, params?: Record<string, string | number>) => {
    // Get value from dictionary
    const value = getNestedValue(dictionary, key);
    
    // If value not found, return the key
    if (!value) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    // Get text string by locale
    const actualLocale = locale as 'en' | 'vi';
    let text = value[actualLocale] || value['en'];
    
    // Replace parameters in the text string
    if (params && text) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{{${paramKey}}}`, String(paramValue));
      });
    }
    
    return text;
  };
  
  return { t };
} 