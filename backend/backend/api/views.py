import google.generativeai as genai
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
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user"""
    print(f"Registration data received: {request.data}")
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    print(f"Serializer errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """Login user and return tokens"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
@permission_classes([IsAuthenticated])
def available_models(request):
    """Get list of available AI models"""
    try:
        models = ai_service_manager.list_available_models()
        serializer = AIModelSerializer(models, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching available models: {e}")
        return Response({'error': 'Failed to fetch available models'}, status=500)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def prompt_gpt(request):
    chat_id = request.data.get("chat_id")
    content = request.data.get("content")
    model_type = request.data.get("model_type", "gemini")
    language = request.data.get("language", "en")

    if not chat_id:
        return Response({"error": "Chat ID was not provided."}, status=400)

    if not content:
        return Response({"error": "There was no prompt passed."}, status=400)

    # Get or create chat for the authenticated user
    chat, created = Chat.objects.get_or_create(
        id=chat_id, 
        defaults={
            'user': request.user,
            'model_type': model_type,
            'language': language
        }
    )
    
    # Ensure the chat belongs to the current user
    if chat.user != request.user:
        return Response({"error": "Access denied to this chat."}, status=403)

    # Generate title if it's a new chat or doesn't have one
    if created or not chat.title:
        chat.title = createChatTitle(content, model_type)
        chat.model_type = model_type
        chat.language = language
        chat.save()

    # Create user message
    ChatMessage.objects.create(role="user", chat=chat, content=content)

    # Get conversation history
    chat_messages = chat.messages.order_by("created_at")
    openai_messages = [{"role": msg.role, "content": msg.content} for msg in chat_messages]

    try:
        # Use the AI service manager to get the appropriate provider
        provider = ai_service_manager.get_provider(model_type)
        response = provider.generate_response(openai_messages)
        
        if 'error' in response:
            return Response({"error": response['error']}, status=500)
        
        reply = response.get('content', 'Sorry, I could not generate a response.')
        tokens_used = response.get('tokens_used', 0)
        model_used = response.get('model_used', model_type)
        
        # Create assistant message with metadata
        ChatMessage.objects.create(
            role="assistant", 
            content=reply, 
            chat=chat,
            model_used=model_used,
            tokens_used=tokens_used
        )
        
        return Response({
            "reply": reply,
            "chat_id": str(chat.id),
            "model_used": model_used,
            "tokens_used": tokens_used
        }, status=status.HTTP_201_CREATED)
        
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        logger.error(f"AI service error: {e}")
        return Response({"error": f"AI service error: {str(e)}"}, status=500)


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
