"""
Simple Google Gemini Provider
"""
import google.generativeai as genai
from django.conf import settings


class GeminiProvider:
    """Simple provider for Google Gemini API"""

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        # Configure Gemini with API key from settings
        api_key = getattr(settings, "GEMINI_API_KEY", None)
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in Django settings.")

        genai.configure(api_key=api_key)

        # Ensure model name starts with 'models/'
        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"

        self.model_name = model_name
        self.model = genai.GenerativeModel(self.model_name)

    def generate_response(self, prompt: str) -> str:
        """Generate a response from Gemini"""
        try:
            response = self.model.generate_content(prompt)
            return getattr(response, "text", "No response generated.")
        except Exception as e:
            return f"Gemini error: {str(e)}"
