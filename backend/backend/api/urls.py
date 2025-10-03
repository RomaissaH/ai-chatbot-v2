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
    
    # Chat endpoints
    path('prompt/', views.prompt_gpt, name='prompt_gpt'),
    path('chat/<str:pk>/messages/', views.get_chat_messages, name='get_chat_messages'),
    path('chats/today/', views.todays_chat, name='todays_chat'),
    path('chats/yesterday/', views.yesterdays_chat, name='yesterdays_chat'),
    path('chats/week/', views.seven_days_chat, name='seven_days_chat'),
]