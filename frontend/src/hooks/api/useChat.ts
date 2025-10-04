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
  getTodaysChats,
  getYesterdaysChats,
  getWeekChats,
} from '../../services/chatService';
import type { PromptRequest } from '../../services/types';

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
 * Hook to get today's chats
 */
export const useTodaysChats = () => {
  return useQuery({
    queryKey: [...CHAT_QUERY_KEYS.history(), 'today'],
    queryFn: getTodaysChats,
  });
};

/**
 * Hook to get yesterday's chats
 */
export const useYesterdaysChats = () => {
  return useQuery({
    queryKey: [...CHAT_QUERY_KEYS.history(), 'yesterday'],
    queryFn: getYesterdaysChats,
  });
};

/**
 * Hook to get this week's chats
 */
export const useWeekChats = () => {
  return useQuery({
    queryKey: [...CHAT_QUERY_KEYS.history(), 'week'],
    queryFn: getWeekChats,
  });
};

/**
 * Hook to send prompt mutation
 */
export const useSendPrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PromptRequest) => sendPrompt(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch chat messages
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.messages(variables.chat_id),
      });

      // Invalidate chat lists to update last message
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.lists(),
      });

      // Invalidate history queries
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.history(),
      });
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
    onSuccess: () => {
      // Invalidate chat lists
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.lists(),
      });
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
    onSuccess: () => {
      // Invalidate all chat-related queries
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.all,
      });
    },
  });
};
