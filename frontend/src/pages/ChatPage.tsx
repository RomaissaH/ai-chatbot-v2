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
                className="flex justify-end"
              >
                <div className="max-w-[70%] p-4 rounded-2xl bg-primary text-primary-foreground">
                  {msg.content}
                </div>
              </div>
            ) : msg.content === "Welcome! I'm here to assist you." ? (
              <div
                key={msg.id || `temp-${msg.content.slice(0, 10)}`}
                className="flex items-center justify-center min-h-[60vh] animate-fade-in"
              >
                <div className="text-center space-y-4">
                  <div className="text-6xl animate-bounce">👋</div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Welcome!
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    I'm here to assist you.
                  </p>
                </div>
              </div>
            ) : (
              <div
                key={msg.id || `temp-${msg.content.slice(0, 10)}`}
                className="flex justify-start"
              >
                <div className="max-w-[70%] prose dark:prose-invert bg-muted text-foreground p-4 rounded-2xl shadow">
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.model_used && !msg.isTemporary && (
                    <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                      Model: {msg.model_used}
                      {msg.tokens_used && ` • Tokens: ${msg.tokens_used}`}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] p-4 rounded-2xl bg-muted">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-3xl mx-auto p-4">
            {/* Model Selector - Positioned at inline-start (left in LTR, right in RTL) */}
            <div className="flex justify-start items-center mb-3">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                className="w-auto"
              />
            </div>

            {/* Message Input */}
            <div className="relative">
              <Textarea
                placeholder="Message AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full resize-none min-h-[56px] max-h-[200px] rounded-3xl border border-input/50 bg-background px-5 py-4 pe-12 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent placeholder:text-muted-foreground/60 transition-all"
              />

              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute end-2 bottom-2 p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                <SendHorizonalIcon size={18} />
              </button>
            </div>

            {/* Helper text */}
            <p className="text-xs text-muted-foreground/60 text-center mt-2">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
