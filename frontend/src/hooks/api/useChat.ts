/**
 * React Query hooks for chat operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserChats,
  getChatMessages,
  sendPrompt,
  createChat,
  deleteChat,
  getAvailableModels,
  getChatHistory,
} from '../../services/chatService';
import type { PromptRequest, Chat } from '../../services/types';

// Date utility functions
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

const isWithinLastWeek = (date: Date): boolean => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  return date < yesterday && date >= weekAgo;
};

const filterChatsByPeriod = (
  chats: Chat[],
  period: 'today' | 'yesterday' | 'week'
): Chat[] => {
  return chats.filter((chat) => {
    const chatDate = new Date(chat.created_at);
    switch (period) {
      case 'today':
        return isToday(chatDate);
      case 'yesterday':
        return isYesterday(chatDate);
      case 'week':
        return isWithinLastWeek(chatDate);
      default:
        return false;
    }
  });
};

// Query Keys
export const CHAT_QUERY_KEYS = {
  all: ['chats'] as const,
  lists: () => [...CHAT_QUERY_KEYS.all, 'list'] as const,
  list: (page: number) => [...CHAT_QUERY_KEYS.lists(), page] as const,
  details: () => [...CHAT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CHAT_QUERY_KEYS.details(), id] as const,
  messages: (id: string) =>
    [...CHAT_QUERY_KEYS.detail(id), 'messages'] as const,
  history: () => [...CHAT_QUERY_KEYS.all, 'history'] as const,
  models: ['models'] as const,
};

/**
 * Hook to get user's chats
 */
export const useUserChats = (page = 1, pageSize = 20) => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.list(page),
    queryFn: () => getUserChats(page, pageSize),
  });
};

/**
 * Hook to get chat messages
 */
export const useChatMessages = (chatId: string) => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.messages(chatId),
    queryFn: () => getChatMessages(chatId),
    enabled: !!chatId,
  });
};

/**
 * Hook to get available AI models
 */
export const useAvailableModels = () => {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.models,
    queryFn: getAvailableModels,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get chat history and filter by period
 */
export const useChatHistory = () => {
  return useQuery({
    queryKey: [...CHAT_QUERY_KEYS.history()],
    queryFn: async () => {
      try {
        const data = await getChatHistory();
        console.log('Chat history fetched:', data);
        return data;
      } catch (error) {
        console.error('Error fetching chat history:', error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get today's chats
 */
export const useTodaysChats = () => {
  const { data: allChats, ...rest } = useChatHistory();
  const todaysChats = allChats ? filterChatsByPeriod(allChats, 'today') : [];

  return {
    data: todaysChats,
    ...rest,
  };
};

/**
 * Hook to get yesterday's chats
 */
export const useYesterdaysChats = () => {
  const { data: allChats, ...rest } = useChatHistory();
  const yesterdaysChats = allChats
    ? filterChatsByPeriod(allChats, 'yesterday')
    : [];

  return {
    data: yesterdaysChats,
    ...rest,
  };
};

/**
 * Hook to get this week's chats
 */
export const useWeekChats = () => {
  const { data: allChats, ...rest } = useChatHistory();
  const weekChats = allChats ? filterChatsByPeriod(allChats, 'week') : [];

  return {
    data: weekChats,
    ...rest,
  };
};

/**
 * Hook to send prompt mutation
 */
export const useSendPrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PromptRequest) => sendPrompt(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch chat messages for this specific chat
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.messages(variables.chat_id),
      });

      // Only invalidate chat lists to update last message - no need to refetch entire history
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.lists(),
      });

      // Update the specific chat in history cache without refetching everything
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.history(),
        (oldData: Chat[] | undefined) => {
          if (!oldData) return oldData;

          // Update the updated_at timestamp for the chat that was just used
          return oldData.map((chat) =>
            chat.id === variables.chat_id
              ? { ...chat, updated_at: new Date().toISOString() }
              : chat
          );
        }
      );
    },
  });
};

/**
 * Hook to create chat mutation
 */
export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChat,
    onSuccess: (newChat) => {
      // Invalidate chat lists
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.lists(),
      });

      // Add the new chat to the history cache without refetching
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.history(),
        (oldData: Chat[] | undefined) => {
          if (!oldData) return [newChat];
          return [newChat, ...oldData];
        }
      );
    },
  });
};

/**
 * Hook to delete chat mutation
 */
export const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChat,
    onSuccess: (_, deletedChatId) => {
      // Remove the deleted chat from history cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.history(),
        (oldData: Chat[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter((chat) => chat.id !== deletedChatId);
        }
      );

      // Invalidate chat lists and remove specific chat queries
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.lists(),
      });

      // Remove the deleted chat's messages from cache
      queryClient.removeQueries({
        queryKey: CHAT_QUERY_KEYS.messages(deletedChatId),
      });
    },
  });
};
