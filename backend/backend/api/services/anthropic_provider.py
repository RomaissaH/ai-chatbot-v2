"""
Anthropic Claude AI Provider
"""
from typing import List, Dict, Any
from django.conf import settings
import logging
import requests
import json

from .ai_service import AIProvider

logger = logging.getLogger(__name__)


class AnthropicProvider(AIProvider):
    """Anthropic Claude AI Provider"""
    
    def __init__(self, api_key: str, model_name: str = "claude-3-sonnet-20240229"):
        super().__init__(api_key, model_name)
        self.base_url = "https://api.anthropic.com/v1"
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
    
    @classmethod
    def create_instance(cls, model_name: str = "claude"):
        """Create provider instance with API key from settings"""
        api_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not configured")
        
        # Map model names to actual Claude model names
        model_mapping = {
            'claude': 'claude-3-sonnet-20240229',
            'claude-sonnet': 'claude-3-sonnet-20240229',
            'claude-haiku': 'claude-3-haiku-20240307',
            'claude-opus': 'claude-3-opus-20240229'
        }
        actual_model = model_mapping.get(model_name, 'claude-3-sonnet-20240229')
        return cls(api_key, actual_model)
    
    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """
        Generate response using Claude API
        
        Args:
            messages: List of message dictionaries
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            Dictionary with response content and metadata
        """
        try:
            # Convert messages to Claude format
            claude_messages = self._format_messages_for_claude(messages)
            
            # Prepare the request payload
            payload = {
                "model": self.model_name,
                "max_tokens": kwargs.get("max_tokens", 1000),
                "temperature": kwargs.get("temperature", 0.7),
                "messages": claude_messages
            }
            
            # Make API request
            response = requests.post(
                f"{self.base_url}/messages",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data['content'][0]['text'] if data.get('content') else "No response generated"
                
                # Extract token usage
                usage = data.get('usage', {})
                input_tokens = usage.get('input_tokens', 0)
                output_tokens = usage.get('output_tokens', 0)
                tokens_used = input_tokens + output_tokens
                
                return {
                    'content': content,
                    'tokens_used': tokens_used,
                    'model_used': self.model_name,
                    'provider': self.provider_name
                }
            else:
                logger.error(f"Claude API request failed: {response.status_code} - {response.text}")
                return {
                    'content': "I'm having trouble connecting to the AI service. Please try again.",
                    'tokens_used': 0,
                    'model_used': self.model_name,
                    'provider': self.provider_name,
                    'error': f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return {
                'content': "I'm having trouble connecting to the AI service. Please try again.",
                'tokens_used': 0,
                'model_used': self.model_name,
                'provider': self.provider_name,
                'error': str(e)
            }
    
    def _format_messages_for_claude(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Convert messages to Claude format (excludes system messages as separate parameter)"""
        claude_messages = []
        
        for msg in messages:
            role = msg.get('role')
            content = msg.get('content', '')
            
            # Claude uses 'user' and 'assistant' roles
            if role in ['user', 'assistant']:
                claude_messages.append({
                    'role': role,
                    'content': content
                })
            elif role == 'system':
                # System messages should be handled separately in Claude
                # For now, we'll convert them to user messages with a prefix
                claude_messages.append({
                    'role': 'user',
                    'content': f"[System]: {content}"
                })
        
        return claude_messages
    
    def validate_api_key(self) -> bool:
        """Validate Claude API key"""
        try:
            test_messages = [{"role": "user", "content": "Hello"}]
            response = self.generate_response(test_messages)
            return 'error' not in response
        except Exception:
            return False
    
    @property
    def provider_name(self) -> str:
        return "Anthropic Claude"
    
    @property
    def supported_models(self) -> List[str]:
        return [
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229", 
            "claude-3-haiku-20240307"
        ]