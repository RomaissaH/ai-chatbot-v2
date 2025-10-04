"""
Abstract AI Provider base class and service manager for handling multiple AI providers
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name
    
    @abstractmethod
    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """
        Generate a response from the AI model
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
            **kwargs: Additional provider-specific parameters
            
        Returns:
            Dictionary containing 'content', 'tokens_used', and other metadata
        """
        pass
    
    @abstractmethod
    def validate_api_key(self) -> bool:
        """Validate the API key for this provider"""
        pass
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the name of the provider"""
        pass
    
    @property
    @abstractmethod
    def supported_models(self) -> List[str]:
        """Return list of supported models for this provider"""
        pass


class AIServiceManager:
    """Manager class for handling multiple AI providers"""
    
    def __init__(self):
        self._providers = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize all available providers"""
        try:
            from .gemini_provider import GeminiProvider
            from .openai_provider import OpenAIProvider
            from .anthropic_provider import AnthropicProvider
            from .groq_provider import GroqProvider
            
            # Initialize providers (API keys will be loaded from settings)
            from django.conf import settings
            
            if hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY:
                self._providers['gemini'] = GeminiProvider
            
            if hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY:
                self._providers['gpt-4'] = OpenAIProvider
                self._providers['deepseek'] = OpenAIProvider  # DeepSeek uses OpenAI-compatible API
                
            if hasattr(settings, 'ANTHROPIC_API_KEY') and settings.ANTHROPIC_API_KEY:
                self._providers['claude'] = AnthropicProvider
            
            if hasattr(settings, 'GROQ_API_KEY') and settings.GROQ_API_KEY:
                self._providers['groq'] = GroqProvider
                
        except ImportError as e:
            logger.warning(f"Failed to import provider: {e}")
    
    def get_provider(self, model_name: str) -> AIProvider:
        """
        Get provider instance for the specified model
        
        Args:
            model_name: Name of the model (e.g., 'gemini', 'gpt-4', 'claude')
            
        Returns:
            AIProvider instance
            
        Raises:
            ValueError: If model is not supported
        """
        if model_name not in self._providers:
            raise ValueError(f"Model '{model_name}' is not supported. Available models: {list(self._providers.keys())}")
        
        provider_class = self._providers[model_name]
        return provider_class.create_instance(model_name)
    
    def list_available_models(self) -> List[Dict[str, str]]:
        """
        List all available models with their providers
        
        Returns:
            List of dictionaries with 'name', 'provider', and 'display_name' keys
        """
        models = []
        for model_name, provider_class in self._providers.items():
            try:
                provider_instance = provider_class.create_instance(model_name)
                models.append({
                    'name': model_name,
                    'provider': provider_instance.provider_name,
                    'display_name': self._get_display_name(model_name),
                })
            except Exception as e:
                logger.warning(f"Failed to initialize provider for {model_name}: {e}")
        
        return models
    
    def _get_display_name(self, model_name: str) -> str:
        """Get human-readable display name for model"""
        display_names = {
            'gemini': 'Google Gemini',
            'gpt-4': 'OpenAI GPT-4',
            'claude': 'Anthropic Claude',
            'deepseek': 'DeepSeek',
            'llama': 'Meta Llama',
            'groq': 'Groq (Llama 3.3)'
        }
        return display_names.get(model_name, model_name.title())
    
    def is_model_available(self, model_name: str) -> bool:
        """Check if a model is available"""
        return model_name in self._providers


# Global instance
ai_service_manager = AIServiceManager()