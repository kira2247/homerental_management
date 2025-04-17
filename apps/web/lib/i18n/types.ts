export type TranslationValue = {
  en: string;
  vi: string;
};

export type TranslationDictionary = {
  [key: string]: TranslationValue | TranslationDictionary;
};

export type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : K
      : never
    }[keyof T]
  : never; 