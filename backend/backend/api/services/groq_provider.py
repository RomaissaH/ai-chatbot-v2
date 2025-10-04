"""
Groq AI Provider
"""
from typing import List, Dict, Any
from django.conf import settings
import logging
import requests

from .ai_service import AIProvider

logger = logging.getLogger(__name__)


class GroqProvider(AIProvider):
    """Groq API Provider (OpenAI-compatible API)"""
    
    def __init__(self, api_key: str, model_name: str = "llama-3.3-70b-versatile"):
        super().__init__(api_key, model_name)
        self.base_url = "https://api.groq.com/openai/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    @classmethod
    def create_instance(cls, model_name: str = "groq"):
        """Create provider instance with API key from settings"""
        api_key = settings.GROQ_API_KEY
        # Use the free tier model
        actual_model = "llama-3.3-70b-versatile"
        logger.info(f"Creating Groq provider with model: {actual_model}")
        return cls(api_key, actual_model)
    
    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """
        Generate response using Groq API
        
        Args:
            messages: List of message dictionaries
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            Dictionary with response content and metadata
        """
        try:
            logger.info(f"Sending request to Groq model: {self.model_name}")
            logger.info(f"Message count: {len(messages)}")
            
            # Prepare the request payload
            payload = {
                "model": self.model_name,
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.7),
                "max_tokens": kwargs.get("max_tokens", 1000),
                "stream": False
            }
            
            # Make API request
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                choice = data['choices'][0]
                content = choice['message']['content']
                
                # Extract token usage
                usage = data.get('usage', {})
                tokens_used = usage.get('total_tokens', 0)
                
                logger.info(f"Successfully received response from Groq, length: {len(content)} chars")
                
                return {
                    'content': content,
                    'tokens_used': tokens_used,
                    'model_used': self.model_name,
                    'provider': self.provider_name
                }
            else:
                logger.error(f"Groq API request failed: {response.status_code} - {response.text}")
                return {
                    'content': "I'm having trouble connecting to the AI service. Please try again.",
                    'tokens_used': 0,
                    'model_used': self.model_name,
                    'provider': self.provider_name,
                    'error': f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"Groq API error: {e}")
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
    
    def validate_api_key(self) -> bool:
        """Validate Groq API key"""
        try:
            test_messages = [{"role": "user", "content": "Hello"}]
            response = self.generate_response(test_messages)
            return 'error' not in response
        except Exception:
            return False
    
    @property
    def provider_name(self) -> str:
        return "Groq"
    
    @property
    def supported_models(self) -> List[str]:
        return [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768"
        ]
