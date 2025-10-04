import { useEffect, useRef, useState } from 'react';
import { SendHorizonalIcon } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelector } from '@/components/ModelSelector';
import { useSendPrompt, useChatMessages } from '@/hooks/api/useChat';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import type { LocalMessage } from '@/services/types';

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [chatID, setChatID] = useState('');
  const { chat_uid } = useParams();

  useEffect(() => {
    if (chat_uid) {
      setChatID(chat_uid);
    } else {
      // Generate a new UUID for new chats
      setChatID(crypto.randomUUID());
    }
  }, [chat_uid]);

  const [messages, setMessages] = useState<LocalMessage[]>([
    {
      role: 'assistant',
      content: "Welcome! I'm here to assist you.",
      isTemporary: true,
      id: -1, // Temporary ID for welcome message
    },
  ]);
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [isLoading, setIsLoading] = useState(false);

  // React Query hooks
  const { data: chatMessages } = useChatMessages(chatID);
  const sendPromptMutation = useSendPrompt();
  const { getErrorMessage } = useErrorHandler();

  // Load chat messages when chat ID changes
  useEffect(() => {
    if (chatID && chatMessages && chatMessages.length > 0) {
      console.log('Loading chat messages:', chatMessages);
      // Convert API messages to LocalMessage format
      const localMessages: LocalMessage[] = chatMessages.map((msg) => ({
        ...msg,
        isTemporary: false,
      }));
      setMessages(localMessages);
    }
  }, [chatID, chatMessages]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.pathname == '/chat' || location.pathname == '/chat/new') {
      setMessages([
        {
          role: 'assistant' as const,
          content: "Welcome! I'm here to assist you.",
          isTemporary: true,
          id: -1, // Temporary ID for welcome message
        },
      ]);

      // setChatID("");
    }
  }, [location.pathname]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    console.log('Sending message:', { chatID, input, selectedModel });

    // Navigate to specific chat URL if we're on a generic chat route
    if (location.pathname === '/chat' || location.pathname === '/chat/new') {
      navigate(`/chat/${chatID}`, { replace: true });
    }

    const newMessage: LocalMessage = {
      role: 'user' as const,
      content: input,
      isTemporary: true,
      id: Date.now(), // Temporary ID
    };
    setMessages((prev) =>
      [...prev, newMessage].filter(
        (p) => p.content !== "Welcome! I'm here to assist you."
      )
    );

    const inputContent = input;
    setInput('');
    setIsLoading(true);

    try {
      console.log('Making API call with:', {
        chat_id: chatID,
        content: inputContent,
        model_type: selectedModel,
      });

      const response = await sendPromptMutation.mutateAsync({
        chat_id: chatID,
        content: inputContent,
        model_type: selectedModel,
        language: 'en', // TODO: Get from user preferences
      });

      console.log('API response received:', response);

      // Add assistant response to messages
      const assistantMessage: LocalMessage = {
        role: 'assistant' as const,
        content: response.reply,
        model_used: response.model_used,
        tokens_used: response.tokens_used,
        isTemporary: true,
        id: Date.now() + 1, // Temporary ID
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = getErrorMessage(error);

      // Add error message to chat
      const errorMessageObj: LocalMessage = {
        role: 'assistant' as const,
        content: `Error: ${errorMessage}`,
        isTemporary: true,
        id: Date.now() + 2, // Temporary ID
      };
      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1">
      <div className="flex flex-col flex-1 bg-background text-foreground">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <div
                key={msg.id || `temp-${msg.content.slice(0, 10)}`}
                className="w-full mx-auto p-4 rounded-xl bg-primary text-primary-foreground self-end"
              >
                {msg.content}
              </div>
            ) : (
              <div
                key={msg.id || `temp-${msg.content.slice(0, 10)}`}
                className="prose dark:prose-invert max-w-none bg-muted text-foreground p-4 rounded-lg shadow mb-4"
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.model_used && !msg.isTemporary && (
                  <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                    Model: {msg.model_used}
                    {msg.tokens_used && ` • Tokens: ${msg.tokens_used}`}
                  </div>
                )}
              </div>
            )
          )}

          {isLoading && (
            <div className="w-full mx-auto p-4 rounded-xl bg-muted">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  AI is thinking...
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4 sticky bottom-0 z-50 bg-background text-foreground">
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Model Selector */}
            <div className="flex justify-start">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                className="w-64"
              />
            </div>

            {/* Message Input */}
            <div className="flex items-center gap-4">
              <Textarea
                placeholder="Send a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 resize-none min-h-[80px] max-h-[200px] rounded-md border border-input bg-muted/40 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 placeholder:text-muted-foreground shadow-sm transition"
              />

              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SendHorizonalIcon size={18} className="cursor-pointer" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
