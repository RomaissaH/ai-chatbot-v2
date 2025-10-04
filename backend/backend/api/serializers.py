from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from api.models import Chat, ChatMessage, CustomUser, UserProfile


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'confirm_password', 'first_name', 'last_name')

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match"})
        
        # Validate password strength
        password = attrs['password']
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = CustomUser.objects.get(email=email)
                user = authenticate(username=user.username, password=password)
                if not user:
                    raise serializers.ValidationError('Invalid credentials')
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must provide email and password')


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')

     

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['ai_summary', 'preferred_model', 'preferred_language', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ChatSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat 
        fields = [
            'id', 'title', 'model_type', 'language', 
            'created_at', 'updated_at', 'message_count', 'last_message'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.get_message_count()
    
    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        if last_msg:
            return {
                'content': last_msg.content[:100] + '...' if len(last_msg.content) > 100 else last_msg.content,
                'role': last_msg.role,
                'created_at': last_msg.created_at
            }
        return None



class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage 
        fields = ['id', 'role', 'content', 'model_used', 'tokens_used', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating messages"""
    class Meta:
        model = ChatMessage 
        fields = ['role', 'content']


class AIModelSerializer(serializers.Serializer):
    """Serializer for available AI models"""
    name = serializers.CharField()
    provider = serializers.CharField()
    display_name = serializers.CharField()
    is_available = serializers.BooleanField(default=True)