"""
Google Gemini AI Provider
"""
import google.generativeai as genai
from typing import List, Dict, Any
from django.conf import settings
import logging

from .ai_service import AIProvider

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    """Google Gemini API Provider"""
    
    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash"):
        super().__init__(api_key, model_name)
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
    
    @classmethod
    def create_instance(cls, model_name: str = "gemini-2.5-flash"):
        """Create provider instance with API key from settings"""
        api_key = settings.GEMINI_API_KEY
        # Only use the free tier model
        actual_model = 'gemini-2.5-flash'
        logger.info(f"Creating Gemini provider with model: {actual_model}")
        return cls(api_key, actual_model)
    
    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """
        Generate response using Gemini
        
        Args:
            messages: List of message dictionaries
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            Dictionary with response content and metadata
        """
        try:
            # Convert messages to Gemini format
            context = self._format_messages_for_gemini(messages)
            
            logger.info(f"Sending request to Gemini model: {self.model_name}")
            logger.info(f"Message count: {len(messages)}, Context length: {len(context)} chars")
            
            # Generate response
            response = self.model.generate_content(context)
            
            # Extract response text
            content = response.text if response.text else "Sorry, I couldn't generate a response."
            
            logger.info(f"Successfully received response from Gemini, length: {len(content)} chars")
            
            # Calculate approximate token usage (Gemini doesn't provide exact counts)
            tokens_used = self._estimate_tokens(context + content)
            
            return {
                'content': content,
                'tokens_used': tokens_used,
                'model_used': self.model_name,
                'provider': self.provider_name
            }
            
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            logger.error(f"Model used: {self.model_name}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                'content': "I'm having trouble connecting to the AI service. Please try again.",
                'tokens_used': 0,
                'model_used': self.model_name,
                'provider': self.provider_name,
                'error': str(e)
            }
    
    def _format_messages_for_gemini(self, messages: List[Dict[str, str]]) -> str:
        """Convert message format to Gemini-compatible format"""
        formatted_messages = []
        for msg in messages:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            
            if role == 'user':
                formatted_messages.append(f"User: {content}")
            elif role == 'assistant':
                formatted_messages.append(f"Assistant: {content}")
            elif role == 'system':
                formatted_messages.append(f"System: {content}")
        
        return "\n".join(formatted_messages)
    
    def _estimate_tokens(self, text: str) -> int:
        """Rough estimation of tokens (4 characters per token on average)"""
        return len(text) // 4
    
    def validate_api_key(self) -> bool:
        """Validate Gemini API key"""
        try:
            # Try a simple generation to test the key
            test_response = self.model.generate_content("Hello")
            return bool(test_response.text)
        except Exception:
            return False
    
    @property
    def provider_name(self) -> str:
        return "Google Gemini"
    
    @property
    def supported_models(self) -> List[str]:
        return ["gemini-2.5-flash"]