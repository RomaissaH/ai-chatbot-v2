import google.generativeai as genai
#import google.generativeai as genai
import os

from django.shortcuts import render, get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from api.models import Chat, ChatMessage, CustomUser, UserProfile
from api.serializers import (
    ChatMessageSerializer, ChatSerializer, UserRegistrationSerializer, 
    UserLoginSerializer, UserSerializer, UserProfileSerializer, AIModelSerializer
)
from api.services.ai_service import ai_service_manager
from api.utils.error_messages import ErrorMessages, get_user_language
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
import logging

from api.services.gemini_provider2 import GeminiProvider


logger = logging.getLogger(__name__)

# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user"""
    user_language = get_user_language(request)
    print(f"Registration data received: {request.data}")
    
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"User registration error: {e}")
            error_response = ErrorMessages.create_error_response('server_error', user_language)
            return Response(error_response, status=500)
    else:
        print(f"Serializer errors: {serializer.errors}")
        # Check for specific validation errors
        if 'email' in serializer.errors and any('already exists' in str(error) for error in serializer.errors['email']):
            error_response = ErrorMessages.create_error_response('user_already_exists', user_language)
        else:
            error_response = ErrorMessages.create_error_response('validation_error', user_language, details=serializer.errors)
        return Response(error_response, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login user and return tokens"""
    user_language = get_user_language(request)
    serializer = UserLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Login error: {e}")
            error_response = ErrorMessages.create_error_response('server_error', user_language)
            return Response(error_response, status=500)
    else:
        error_response = ErrorMessages.create_error_response('invalid_credentials', user_language)
        return Response(error_response, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def logout_user(request):
    """Logout user by blacklisting the refresh token"""
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def user_profile(request):
    """Get current user profile"""
    user_serializer = UserSerializer(request.user)
    
    # Get or create user profile
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    profile_serializer = UserProfileSerializer(profile)
    
    return Response({
        'user': user_serializer.data,
        'profile': profile_serializer.data
    })


# Chat and AI Views
now = timezone.now()
today = now.date()
yesterday = today - timedelta(days=1)
seven_days_ago = today - timedelta(days=7)
thirty_days_ago = today - timedelta(days=30)

def build_gemini_history(chat):
    messages = chat.messages.order_by("created_at")[:10]  # last 10 messages
    history = "\n".join([f"{m.role.capitalize()}: {m.content}" for m in messages])
    if "Assistant:" not in history:
        history = "Assistant: You are a helpful assistant.\n" + history
    return history


def createChatTitle(user_message, model_name='gemini'):
    """Generate a chat title using AI"""
    try:
        provider = ai_service_manager.get_provider(model_name)
        messages = [{
            'role': 'user',
            'content': f"Give a short, descriptive title for this conversation in not more than 5 words.\n\nUser: {user_message}"
        }]
        response = provider.generate_response(messages)
        title = response.get('content', '').strip()
        if not title:
            title = user_message[:50]
    except Exception as e:
        logger.warning(f"Failed to generate title: {e}")
        title = user_message[:50]
    return title


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([AllowAny])  # Allow anyone to see available models
def available_models(request):
    """Get list of available AI models"""
    try:
        models = ai_service_manager.list_available_models()
        serializer = AIModelSerializer(models, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching available models: {e}")
        language = get_user_language(request)
        error_response = ErrorMessages.create_error_response('model_fetch_failed', language)
        return Response(error_response, status=500)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def prompt_gpt(request):
    try:
        logger.info(f"=== CHAT REQUEST START ===")
        logger.info(f"Received chat request from user: {request.user.username if request.user else 'Anonymous'}")
        logger.info(f"Request data: {request.data}")
        
        chat_id = request.data.get("chat_id")
        content = request.data.get("content")
        model_type = request.data.get("model_type", "gemini")
        language = request.data.get("language", "en")

        # Basic validation first
        if not chat_id:
            return Response({'error': 'Chat ID is required.'}, status=400)

        if not content:
            return Response({'error': 'Message content is required.'}, status=400)

        # Get user's preferred language
        user_language = get_user_language(request)
        logger.info(f"User language detected: {user_language}")
        
    except Exception as e:
        logger.error(f"CRITICAL ERROR in prompt_gpt initial setup: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Exception args: {e.args}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return Response({'error': f'Server error during initialization: {str(e)}'}, status=500)

    # Get or create chat for the authenticated user
    try:
        logger.info("Starting chat processing...")
        
        chat, created = Chat.objects.get_or_create(
            id=chat_id, 
            defaults={
                'user': request.user,
                'model_type': model_type,
                'language': language
            }
        )
        logger.info(f"Chat {'created' if created else 'retrieved'}: {chat.id}")
    except Exception as e:
        logger.error(f"Error creating/retrieving chat: {e}")
        return Response({'error': f'Chat creation error: {str(e)}'}, status=500)
    
    # Ensure the chat belongs to the current user
    if chat.user != request.user:
        return Response({'error': 'Access denied to this chat.'}, status=403)

    # Generate title if it's a new chat or doesn't have one
    if created or not chat.title:
        chat.title = createChatTitle(content, model_type)
        chat.model_type = model_type
        chat.language = language
        chat.save()

    # Create user message
    try:
        user_message = ChatMessage.objects.create(role="user", chat=chat, content=content)
        logger.info(f"User message created: {user_message.id}")
    except Exception as e:
        logger.error(f"Error creating user message: {e}")
        return Response({'error': f'Message creation error: {str(e)}'}, status=500)

    # Get conversation history
    try:
        chat_messages = chat.messages.order_by("created_at")
        openai_messages = [{"role": msg.role, "content": msg.content} for msg in chat_messages]
        logger.info(f"Retrieved {len(openai_messages)} messages for context")
    except Exception as e:
        logger.error(f"Error retrieving chat messages: {e}")
        return Response({'error': f'Message retrieval error: {str(e)}'}, status=500)

    try:
        # Use the AI service manager to get the appropriate provider
        logger.info(f"Getting provider for model: {model_type}")
        provider = ai_service_manager.get_provider(model_type)
        logger.info(f"Provider obtained: {provider.__class__.__name__}")
        
        logger.info(f"Sending {len(openai_messages)} messages to AI provider")
        response = provider.generate_response(openai_messages)
        logger.info(f"AI provider response received: {response.keys() if isinstance(response, dict) else 'Invalid response'}")
        
        if 'error' in response:
            error_msg = response['error']
            logger.error(f"AI service returned error: {error_msg}")
            return Response({'error': f'AI service error: {error_msg}'}, status=500)
        
        reply = response.get('content', 'Sorry, I could not generate a response.')
        tokens_used = response.get('tokens_used', 0)
        model_used = response.get('model_used', model_type)
        
        # Create assistant message with metadata
        try:
            assistant_message = ChatMessage.objects.create(
                role="assistant", 
                content=reply, 
                chat=chat,
                model_used=model_used,
                tokens_used=tokens_used
            )
            logger.info(f"Assistant message created: {assistant_message.id}")
        except Exception as e:
            logger.error(f"Error creating assistant message: {e}")
            # Still return the response even if message saving fails
        
        response_data = {
            "reply": reply,
            "chat_id": str(chat.id),
            "model_used": model_used,
            "tokens_used": tokens_used
        }
        logger.info(f"Sending response: {response_data}")
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except ValueError as e:
        # Model not supported error
        logger.warning(f"Model not supported: {e}")
        return Response({'error': f'Model not supported: {str(e)}'}, status=400)
    except Exception as e:
        logger.error(f"CRITICAL ERROR in chat processing: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return Response({'error': f'Chat processing error: {str(e)}'}, status=500)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_chat_messages(request, pk):
    chat = get_object_or_404(Chat, id=pk, user=request.user)
    chatmessages = chat.messages.all()
    serializer = ChatMessageSerializer(chatmessages, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def user_chats(request):
    """Get all chats for the authenticated user with pagination"""
    page_size = int(request.GET.get('page_size', 20))
    page = int(request.GET.get('page', 1))
    
    chats = Chat.objects.filter(user=request.user).order_by('-updated_at')
    
    # Simple pagination
    start = (page - 1) * page_size
    end = start + page_size
    paginated_chats = chats[start:end]
    
    serializer = ChatSerializer(paginated_chats, many=True)
    
    return Response({
        'chats': serializer.data,
        'total': chats.count(),
        'page': page,
        'page_size': page_size,
        'has_next': chats.count() > end
    })


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def todays_chat(request):
    chats = Chat.objects.filter(
        user=request.user, 
        created_at__date=today
    ).order_by("-updated_at")[:10]
    serializer = ChatSerializer(chats, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def yesterdays_chat(request):
    chats = Chat.objects.filter(
        user=request.user, 
        created_at__date=yesterday
    ).order_by("-updated_at")[:10]
    serializer = ChatSerializer(chats, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def seven_days_chat(request):
    chats = Chat.objects.filter(
        user=request.user,
        created_at__lt=yesterday, 
        created_at__gte=seven_days_ago
    ).order_by("-updated_at")[:10]
    serializer = ChatSerializer(chats, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_chat(request):
    """Create a new chat for the user"""
    data = request.data.copy()
    data['user'] = request.user.id
    
    serializer = ChatSerializer(data=data)
    if serializer.is_valid():
        chat = serializer.save(user=request.user)
        return Response(ChatSerializer(chat).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def delete_chat(request, pk):
    """Delete a chat (only if it belongs to the user)"""
    chat = get_object_or_404(Chat, id=pk, user=request.user)
    chat.delete()
    return Response({'message': 'Chat deleted successfully'}, status=204)

@api_view(["POST"])
@permission_classes([AllowAny])  # Allow testing without auth
def chat_with_gemini(request):
    """
    Simple endpoint to send a message to Gemini AI
    """
    message = request.data.get("message", "")
    if not message:
        return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

    gemini = GeminiProvider()  # default model
    reply = gemini.generate_response(message)

    return Response({
        "reply": reply
    })