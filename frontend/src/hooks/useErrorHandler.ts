/**
 * Error handling hook with translation support
 */
import { useTranslation } from '@/hooks/useTranslation';

export interface APIError {
  error: string;
  error_code?: string;
  language?: string;
  details?: unknown;
}

interface ErrorWithResponse {
  response?: {
    data?: {
      error?: string;
      error_code?: string;
    };
    status?: number;
  };
  message?: string;
}

export const useErrorHandler = () => {
  const { t } = useTranslation();

  const getErrorMessage = (error: ErrorWithResponse | unknown): string => {
    const typedError = error as ErrorWithResponse;

    // If error is already a translated message from backend
    if (typedError?.response?.data?.error_code) {
      const errorCode = typedError.response.data.error_code;
      const translationKey = `errors.${errorCode}`;
      const translatedMessage = t(translationKey);

      // If translation exists, use it; otherwise fall back to backend message
      if (translatedMessage !== translationKey) {
        return translatedMessage;
      }

      // Fall back to backend error message
      return typedError.response.data.error || t('errors.generic_error');
    }

    // Handle different error types
    if (typedError?.response?.data?.error) {
      return typedError.response.data.error;
    }

    if (typedError?.response?.status) {
      switch (typedError.response.status) {
        case 400:
          return t('errors.validation_error');
        case 401:
          return t('errors.authentication_required');
        case 403:
          return t('errors.access_denied_chat');
        case 404:
          return t('errors.generic_error');
        case 429:
          return t('errors.rate_limit_exceeded');
        case 500:
          return t('errors.server_error');
        default:
          return t('errors.generic_error');
      }
    }

    // Network or other errors
    if (typedError?.message) {
      if (typedError.message.toLowerCase().includes('network')) {
        return t('errors.network_error');
      }
      return typedError.message;
    }

    return t('errors.generic_error');
  };

  const handleError = (error: ErrorWithResponse | unknown): string => {
    console.error('API Error:', error);
    return getErrorMessage(error);
  };

  return {
    getErrorMessage,
    handleError,
  };
};

export default useErrorHandler;
