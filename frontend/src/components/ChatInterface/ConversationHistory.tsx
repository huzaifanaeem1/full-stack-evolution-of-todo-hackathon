import React from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ConversationHistoryProps {
  messages: Message[];
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ messages }) => {
  return (
    <div className="space-y-4">
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
              {new Date(msg.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationHistory;