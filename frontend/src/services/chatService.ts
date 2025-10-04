/**
 * Chat API service functions
 */
import { api } from './api';
import type {
  Chat,
  ChatMessage,
  ChatListResponse,
  PromptRequest,
  PromptResponse,
  AIModel,
} from './types';

/**
 * Get user's chats with pagination
 */
export const getUserChats = async (
  page = 1,
  pageSize = 20
): Promise<ChatListResponse> => {
  const response = await api.get(`/chats/?page=${page}&page_size=${pageSize}`);
  return response.data;
};

/**
 * Get messages for a specific chat
 */
export const getChatMessages = async (
  chatId: string
): Promise<ChatMessage[]> => {
  const response = await api.get(`/chats/${chatId}/messages/`);
  return response.data;
};

/**
 * Send a prompt to AI and get response
 */
export const sendPrompt = async (
  promptData: PromptRequest
): Promise<PromptResponse> => {
  const response = await api.post('/prompt/', promptData);
  return response.data;
};

/**
 * Create a new chat
 */
export const createChat = async (chatData: {
  title?: string;
  model_type?: string;
  language?: 'en' | 'ar';
}): Promise<Chat> => {
  const response = await api.post('/chats/create/', chatData);
  return response.data;
};

/**
 * Delete a chat
 */
export const deleteChat = async (chatId: string): Promise<void> => {
  await api.delete(`/chats/${chatId}/`);
};

/**
 * Get available AI models
 */
export const getAvailableModels = async (): Promise<AIModel[]> => {
  const response = await api.get('/models/available/');
  return response.data;
};

/**
 * Get chat history for the last 30 days
 */
export const getChatHistory = async (): Promise<Chat[]> => {
  const response = await api.get('/chats/history/');
  return response.data;
};
