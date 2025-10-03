import { useContext } from 'react';
import { TranslationContext } from '../i18n/TranslationContext';

export function useTranslation() {
  const context = useContext(TranslationContext);

  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }

  return context;
}
