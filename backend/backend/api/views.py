from google import genai
from django.shortcuts import render, get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models import Chat, ChatMessage
from api.serializers import ChatMessageSerializer, ChatSerializer
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")


# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client()

'''response = client.models.generate_content(
    model="gemini-2.5-flash", contents="Explain how AI works in a few words"
)
print(response.text)'''


now = timezone.now()
today = now.date()
yesterday = today - timedelta(days=1)
seven_days_ago = today - timedelta(days=7)
thirty_days_ago = today - timedelta(days=30)


def createChatTitle(user_message):
    try:
        response = model.generate_content(
            f"Give a short, descriptive title for this conversation in not more than 5 words.\n\nUser: {user_message}"
        )
        title = response.text.strip()
    except Exception:
        title = user_message[:50]
    return title


@api_view(['POST'])
def prompt_gpt(request):
    chat_id = request.data.get("chat_id")
    content = request.data.get("content")

    if not chat_id:
        return Response({"error": "Chat ID was not provided."}, status=400)

    if not content:
        return Response({"error": "There was no prompt passed."}, status=400)

    chat, created = Chat.objects.get_or_create(id=chat_id)
    chat.title = createChatTitle(content)
    chat.save()

    ChatMessage.objects.create(role="user", chat=chat, content=content)

    chat_messages = chat.messages.order_by("created_at")[:10]
    openai_messages = [{"role": msg.role, "content": msg.content} for msg in chat_messages]

    # Build conversation context
    context = "\n".join([f"{m['role']}: {m['content']}" for m in openai_messages])

    try:
        response = model.generate_content(context)
        reply = response.text
    except Exception as e:
        return Response({"error": f"Gemini error: {str(e)}"}, status=500)

    ChatMessage.objects.create(role="assistant", content=reply, chat=chat)
    return Response({"reply": reply}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def get_chat_messages(request, pk):
    chat = get_object_or_404(Chat, id=pk)
    chatmessages = chat.messages.all()
    serializer = ChatMessageSerializer(chatmessages, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def todays_chat(request):
    chats = Chat.objects.filter(created_at__date=today).order_by("-created_at")[:10]
    serializer = ChatSerializer(chats, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def yesterdays_chat(request):
    chats = Chat.objects.filter(created_at__date=yesterday).order_by("-created_at")[:10]
    serializer = ChatSerializer(chats, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def seven_days_chat(request):
    chats = Chat.objects.filter(created_at__lt=yesterday, created_at__gte=seven_days_ago).order_by("-created_at")[:10]
    serializer = ChatSerializer(chats, many=True)
    return Response(serializer.data)
