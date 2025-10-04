from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login_user, name='login'),
    path('auth/logout/', views.logout_user, name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.user_profile, name='user_profile'),
    
    # AI Model endpoints
    path('models/available/', views.available_models, name='available_models'),
    
    # Chat endpoints
    path('prompt/', views.prompt_gpt, name='prompt_gpt'),
    path('chats/', views.user_chats, name='user_chats'),
    path('chats/create/', views.create_chat, name='create_chat'),
    path('chats/<str:pk>/', views.delete_chat, name='delete_chat'),
    path('chats/<str:pk>/messages/', views.get_chat_messages, name='get_chat_messages'),
    
    # Chat history by time period
    path('chats/today/', views.todays_chat, name='todays_chat'),
    path('chats/yesterday/', views.yesterdays_chat, name='yesterdays_chat'),
    path('chats/week/', views.seven_days_chat, name='seven_days_chat'),
]