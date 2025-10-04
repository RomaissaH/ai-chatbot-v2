"""
Error message utilities with translation support
"""
from typing import Dict, Any

class ErrorMessages:
    """Centralized error messages with language support"""
    
    MESSAGES = {
        'en': {
            'chat_id_required': 'Chat ID is required.',
            'content_required': 'Message content is required.',
            'access_denied_chat': 'You do not have permission to access this chat.',
            'model_not_supported': 'The selected AI model is not supported or available.',
            'ai_service_error': 'AI service is temporarily unavailable. Please try again.',
            'api_key_invalid': 'AI service configuration error. Please contact support.',
            'network_error': 'Network error occurred. Please check your connection and try again.',
            'rate_limit_exceeded': 'Too many requests. Please wait a moment and try again.',
            'model_fetch_failed': 'Failed to fetch available models.',
            'authentication_required': 'Authentication is required for this action.',
            'invalid_credentials': 'Invalid email or password.',
            'user_already_exists': 'A user with this email already exists.',
            'validation_error': 'Please check your input and try again.',
            'server_error': 'An unexpected server error occurred. Please try again later.',
        },
        'ar': {
            'chat_id_required': 'معرف المحادثة مطلوب.',
            'content_required': 'محتوى الرسالة مطلوب.',
            'access_denied_chat': 'ليس لديك صلاحية للوصول إلى هذه المحادثة.',
            'model_not_supported': 'نموذج الذكاء الاصطناعي المحدد غير مدعوم أو غير متاح.',
            'ai_service_error': 'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. يرجى المحاولة مرة أخرى.',
            'api_key_invalid': 'خطأ في إعداد خدمة الذكاء الاصطناعي. يرجى الاتصال بالدعم.',
            'network_error': 'حدث خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
            'rate_limit_exceeded': 'طلبات كثيرة جداً. يرجى الانتظار قليلاً والمحاولة مرة أخرى.',
            'model_fetch_failed': 'فشل في جلب النماذج المتاحة.',
            'authentication_required': 'المصادقة مطلوبة لهذا الإجراء.',
            'invalid_credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
            'user_already_exists': 'يوجد مستخدم بهذا البريد الإلكتروني بالفعل.',
            'validation_error': 'يرجى التحقق من المدخلات والمحاولة مرة أخرى.',
            'server_error': 'حدث خطأ غير متوقع في الخادم. يرجى المحاولة لاحقاً.',
        }
    }
    
    @classmethod
    def get_message(cls, key: str, language: str = 'en') -> str:
        """
        Get localized error message
        
        Args:
            key: Error message key
            language: Language code ('en' or 'ar')
            
        Returns:
            Localized error message
        """
        language = language if language in cls.MESSAGES else 'en'
        return cls.MESSAGES[language].get(key, cls.MESSAGES['en'].get(key, 'An error occurred.'))
    
    @classmethod
    def create_error_response(cls, key: str, language: str = 'en', **kwargs) -> Dict[str, Any]:
        """
        Create standardized error response
        
        Args:
            key: Error message key
            language: Language code
            **kwargs: Additional error context
            
        Returns:
            Error response dictionary
        """
        message = cls.get_message(key, language)
        error_response = {
            'error': message,
            'error_code': key,
            'language': language
        }
        error_response.update(kwargs)
        return error_response

def get_user_language(request) -> str:
    """
    Extract user's preferred language from request
    
    Args:
        request: Django request object
        
    Returns:
        Language code ('en' or 'ar')
    """
    # Try to get language from request data first
    language = getattr(request, 'data', {}).get('language')
    
    # Fall back to Accept-Language header
    if not language:
        accept_language = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
        if 'ar' in accept_language.lower():
            language = 'ar'
        else:
            language = 'en'
    
    # Validate language
    return language if language in ['en', 'ar'] else 'en'