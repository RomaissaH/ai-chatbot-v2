"""
OpenAI and OpenAI-compatible (DeepSeek) AI Provider
"""
from typing import List, Dict, Any
from django.conf import settings
import logging
import requests
import json

from .ai_service import AIProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProvider):
    """OpenAI and OpenAI-compatible API Provider (supports OpenAI, DeepSeek)"""
    
    def __init__(self, api_key: str, model_name: str, base_url: str = None):
        super().__init__(api_key, model_name)
        self.base_url = base_url or "https://api.openai.com/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    @classmethod
    def create_instance(cls, model_name: str):
        """Create provider instance based on model type"""
        if model_name == 'deepseek':
            api_key = getattr(settings, 'DEEPSEEK_API_KEY', None)
            base_url = "https://api.deepseek.com/v1"
            actual_model = "deepseek-chat"
        else:  # OpenAI models
            api_key = getattr(settings, 'OPENAI_API_KEY', None)
            base_url = "https://api.openai.com/v1"
            actual_model = "gpt-4" if model_name == 'gpt-4' else "gpt-3.5-turbo"
        
        if not api_key:
            raise ValueError(f"API key not configured for {model_name}")
        
        return cls(api_key, actual_model, base_url)
    
    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """
        Generate response using OpenAI-compatible API
        
        Args:
            messages: List of message dictionaries
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            Dictionary with response content and metadata
        """
        try:
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
                
                return {
                    'content': content,
                    'tokens_used': tokens_used,
                    'model_used': self.model_name,
                    'provider': self.provider_name
                }
            else:
                logger.error(f"API request failed: {response.status_code} - {response.text}")
                return {
                    'content': "I'm having trouble connecting to the AI service. Please try again.",
                    'tokens_used': 0,
                    'model_used': self.model_name,
                    'provider': self.provider_name,
                    'error': f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return {
                'content': "I'm having trouble connecting to the AI service. Please try again.",
                'tokens_used': 0,
                'model_used': self.model_name,
                'provider': self.provider_name,
                'error': str(e)
            }
    
    def validate_api_key(self) -> bool:
        """Validate API key by making a test request"""
        try:
            test_messages = [{"role": "user", "content": "Hello"}]
            response = self.generate_response(test_messages)
            return 'error' not in response
        except Exception:
            return False
    
    @property
    def provider_name(self) -> str:
        if "deepseek" in self.model_name.lower():
            return "DeepSeek"
        return "OpenAI"
    
    @property
    def supported_models(self) -> List[str]:
        if "deepseek" in self.base_url:
            return ["deepseek-chat", "deepseek-coder"]
        return ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]