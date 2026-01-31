'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Task } from '@/types';
import { TaskList } from '@/components/TaskList';
import { TaskForm } from '@/components/TaskForm';
import { taskAPI } from '@/services/api';
import { isAuthenticated, getUserId } from '@/services/auth';
import ChatKitWrapper from '@/components/ChatInterface/ChatKitWrapper';

// Inline ChatKitWrapper component
const ChatKitWrapper = ({ onTaskCreated, onTaskUpdated, onTaskDeleted, fetchTasks }: {
  onTaskCreated: (newTask: Task) => void;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  fetchTasks: () => Promise<void>;
}) => {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

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
    const userMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Check authentication before making request
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      const token = localStorage.getItem('jwt_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: inputValue,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, redirect to login
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_id');
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message');
      }

      const data = await response.json();

      // Update conversation ID if it's the first message
      if (!conversationId) {
        setConversationId(data.conversation_id);
      }

      // Process tool results to update task state
      if (data.tool_results && Array.isArray(data.tool_results)) {
        // First process all tool results to update local state
        data.tool_results.forEach((toolResult: any) => {
          if (toolResult.success && toolResult.call_id) {
            const toolCall = data.tool_calls.find((call: any) => call.id === toolResult.call_id);
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
      const aiMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
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
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-600 to-yellow-600 text-white rounded-full shadow-lg hover:from-purple-700 hover:to-yellow-700 flex items-center justify-center text-xl"
      >
        💬
      </button>

      {/* Chat panel - only show when open */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-black/90 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-xl z-50 flex flex-col">
          <div className="p-4 border-b border-purple-500/20 flex justify-between items-center">
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-purple-900/30 ml-auto max-w-[80%]'
                    : 'bg-gray-800/50 mr-auto max-w-[80%]'
                }`}
              >
                <div className="font-medium text-sm mb-1">
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </div>
                <div className="text-white text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.timestamp && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="p-3 bg-gray-800/50 rounded-lg mr-auto max-w-[80%]">
                <div className="font-medium text-sm text-white">AI Assistant</div>
                <div className="text-white text-sm">Thinking...</div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-purple-500/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder="Ask about your tasks..."
                className="flex-1 bg-black/30 border border-purple-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Examples: "Add a task to buy groceries", "Show my tasks", "Complete task X"
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check authentication on initial load
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      const tasks = await taskAPI.getTasks(userId);
      setTasks(tasks);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Token might be expired, redirect to login
        router.push('/login');
      } else {
        setError(err.message || 'Failed to fetch tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    // Update local state immediately with new array to trigger re-render
    setTasks(prev => [...prev, { ...newTask }]);
    // Background sync to ensure data consistency
    setTimeout(() => fetchTasks(), 100);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    // Update local state immediately with new array to trigger re-render
    setTasks(prev =>
      prev.map(task =>
        task.id === updatedTask.id ? { ...updatedTask } : { ...task }
      )
    );
    // Background sync to ensure data consistency
    setTimeout(() => fetchTasks(), 100);
  };

  const handleTaskCompleted = (completedTask: Task) => {
    // Update local state immediately with new array to trigger re-render
    setTasks(prev =>
      prev.map(task =>
        task.id === completedTask.id ? { ...task, completed: true } : { ...task }
      )
    );
    // Background sync to ensure data consistency
    setTimeout(() => fetchTasks(), 100);
  };

  const handleTaskDeleted = (taskId: string) => {
    // Update local state immediately with new array to trigger re-render
    setTasks(prev => prev.filter(task => task.id !== taskId));
    // Background sync to ensure data consistency
    setTimeout(() => fetchTasks(), 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black pt-20 pb-4 sm:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-900/20 to-black/50 border border-purple-500/30 rounded-xl p-8 backdrop-blur-sm">
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-4 sm:mb-6">Loading tasks...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black pt-20 pb-4 sm:pb-8"> {/* Enhanced background with theme colors */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
        <div className="flex-1">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-yellow-400 to-red-500 bg-clip-text text-transparent mb-2">
              My Tasks
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Manage and organize your tasks efficiently
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div className="text-sm text-gray-400">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} total
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm sm:text-base"
            >
              ← Back to Home
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="bg-gradient-to-br from-purple-900/20 to-black/50 border border-purple-500/30 rounded-xl p-6 mb-8 backdrop-blur-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-2">Add New Task</h2>
              <p className="text-gray-400 text-sm mb-4">Create a new task to stay organized</p>
            </div>
            <TaskForm onTaskCreated={handleTaskCreated} />
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-black/50 border border-purple-500/30 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 sm:p-6 border-b border-purple-500/20">
              <h2 className="text-xl font-semibold text-white">Your Tasks</h2>
              <p className="text-gray-400 text-sm">Manage your tasks efficiently</p>
            </div>
            <div className="p-4 sm:p-6">
              <TaskList
                tasks={tasks}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot component */}
      <ChatKitWrapper
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
}