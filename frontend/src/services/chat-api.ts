import { getAuthToken as getToken } from '@/services/auth';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  conversation_id?: string;
  message: string;
}

export interface ChatResponse {
  conversation_id: string;
  response: string;
  tool_calls: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  tool_results: Array<{
    call_id: string;
    result: any;
    success: boolean;
  }>;
}

/**
 * Send a message to the chat API
 */
export const sendMessage = async (userId: string, message: string, conversationId?: string): Promise<ChatResponse> => {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      message: message,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to send message');
  }

  const data: ChatResponse = await response.json();
  return data;
};

/**
 * Get conversation history
 */
export const getConversationHistory = async (userId: string, conversationId: string): Promise<{ history: ChatMessage[] }> => {
  const token = getToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/${userId}/${conversationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch conversation history');
  }

  const data = await response.json();
  return data;
};