import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# Create your models here.

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.username


class UserProfile(models.Model):
    """User profile for AI-generated summaries and preferences"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="profile")
    ai_summary = models.TextField(blank=True, null=True, help_text="AI-generated summary of user interactions")
    preferred_model = models.CharField(max_length=50, blank=True, null=True, help_text="User's preferred AI model")
    preferred_language = models.CharField(max_length=5, choices=[('en', 'English'), ('ar', 'Arabic')], default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.username}"


class Chat(models.Model):
    MODEL_CHOICES = [
        ('gemini', 'Google Gemini'),
        ('deepseek', 'DeepSeek'),
        ('llama', 'Meta Llama'),
        ('gpt-4', 'OpenAI GPT-4'),
        ('claude', 'Anthropic Claude'),
    ]
    
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('ar', 'Arabic'),
    ]

    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="chats")
    title = models.CharField(max_length=255, blank=True, null=True)  # Optional, for UI display
    model_type = models.CharField(max_length=50, choices=MODEL_CHOICES, default='gemini')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title or f"Chat {self.id}"

    def get_message_count(self):
        """Return the number of messages in this chat"""
        return self.messages.count()

    def get_last_message(self):
        """Return the last message in this chat"""
        return self.messages.order_by('-created_at').first()


class ChatMessage(models.Model):

    ROLES = (
        ("assistant", "Assistant"),
        ("user", "User"),
        ("system", "System")  # Added for system messages
    )

    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=15, choices=ROLES)
    content = models.TextField()
    model_used = models.CharField(max_length=50, blank=True, null=True, help_text="Specific model used for this message")
    tokens_used = models.IntegerField(blank=True, null=True, help_text="Number of tokens used for this message")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"
