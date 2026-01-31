'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sendMessage, ChatResponse, ChatMessage } from '@/services/chat-api';
import { getUserId, isAuthenticated } from '@/services/auth';
import { Task } from '@/types';

interface ChatKitWrapperProps {
  initialConversationId?: string;
  onTaskCreated: (newTask: Task) => void;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

const ChatKitWrapper = ({ initialConversationId, onTaskCreated, onTaskUpdated, onTaskDeleted }: ChatKitWrapperProps) => {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) {
      return;
    }

    const userId = getUserId();
    if (!userId) {
      router.push('/login');
      return;
    }

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response: ChatResponse = await sendMessage(
        userId,
        userMessage.content,
        conversationId
      );

      // Update conversation ID if it's the first message
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      // Process tool results to update task state
      if (response.tool_results && Array.isArray(response.tool_results)) {
        // First process all tool results to update local state
        response.tool_results.forEach((toolResult: any) => {
          if (toolResult.success && toolResult.call_id) {
            const toolCall = response.tool_calls.find((call: any) => call.id === toolResult.call_id);
            if (toolCall) {
              const { name, arguments: args } = toolCall;

              if (name === 'add_task' && toolResult.result) {
                // Task was created - use same handler as UI
                onTaskCreated(toolResult.result);
              } else if (name === 'update_task' && toolResult.result) {
                // Task was updated - use same handler as UI
                onTaskUpdated(toolResult.result);
              } else if (name === 'complete_task' && toolResult.result) {
                // Task was completed - use same handler as UI
                onTaskUpdated(toolResult.result); // Use update handler for completed tasks
              } else if (name === 'delete_task' && toolResult.result === true) {
                // Task was deleted by ID - use same handler as UI
                onTaskDeleted(args.task_id);
              } else if (name === 'delete_task_by_title' && toolResult.result && typeof toolResult.result === 'object' && toolResult.result.deleted_task) {
                // Task was deleted by title - use same handler as UI
                const deletedTask = toolResult.result.deleted_task;
                onTaskDeleted(deletedTask.id);
              }
            }
          }
        });
      }

      // Add AI response to messages
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            <div className="font-medium text-sm mb-1">
              {msg.role === 'user' ? 'You' : 'AI Assistant'}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
            {msg.timestamp && (
              <div className="text-xs text-gray-500 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="p-4 bg-gray-100 rounded-lg mr-auto max-w-[80%]">
            <div className="font-medium text-sm mb-1">AI Assistant</div>
            <div>Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          placeholder="Type your message here..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatKitWrapper;