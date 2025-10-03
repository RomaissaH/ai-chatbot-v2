export type Language = 'en' | 'ar';

export type TranslationValue =
  | string
  | Record<string, string | Record<string, string>>;

export type TranslationKeys = Record<string, TranslationValue>;

export type Translations = Record<Language, TranslationKeys>;
