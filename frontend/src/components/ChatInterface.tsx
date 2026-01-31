import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
}

interface ToolCall {
  tool_name: string;
  parameters: Record<string, any>;
  result: Record<string, any>;
}

interface ChatResponse {
  conversation_id: string;
  message_id: string;
  response: string;
  tool_calls: ToolCall[];
  timestamp: string;
  status: string;
}

const ChatInterface = ({ userId }: { userId: string }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare the request
      const requestBody = {
        message: inputValue,
        conversation_id: conversationId || undefined,
        metadata: {
          timestamp: new Date().toISOString(),
          client_info: 'web_client'
        }
      };

      // Make API call to backend
      const response = await axios.post<ChatResponse>(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/${userId}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, // Assuming JWT token is stored in localStorage
          }
        }
      );

      // Update conversation ID if it's the first message
      if (!conversationId) {
        setConversationId(response.data.conversation_id);
      }

      // Add AI response to messages
      const aiMessage: Message = {
        id: response.data.message_id,
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle tool calls if any
      if (response.data.tool_calls && response.data.tool_calls.length > 0) {
        response.data.tool_calls.forEach(toolCall => {
          const toolMessage: Message = {
            id: `tool-${Date.now()}-${Math.random()}`,
            role: 'tool',
            content: `Tool ${toolCall.tool_name} executed with result: ${JSON.stringify(toolCall.result)}`,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, toolMessage]);
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message to UI
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat header */}
      <div className="bg-gray-100 p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Todo AI Assistant</h2>
        <p className="text-sm text-gray-600">Ask me to manage your tasks!</p>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.role === 'tool'
                  ? 'bg-yellow-100 text-gray-800 border border-yellow-300'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <div className="font-medium text-xs mb-1">
                {message.role === 'user'
                  ? 'You'
                  : message.role === 'tool'
                    ? 'System (Tool)'
                    : 'AI Assistant'}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 max-w-[80%]">
              <div className="font-medium text-xs mb-1">AI Assistant</div>
              <div>Thinking...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to add, list, complete, or manage your tasks..."
            className="flex-1 border border-gray-300 rounded-lg p-2 resize-none min-h-[60px] max-h-[120px]"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Examples: "Add a task to buy groceries", "Show me my tasks", "Mark task as complete"
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;