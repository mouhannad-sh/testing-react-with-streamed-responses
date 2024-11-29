import { useEffect, useState } from 'react';

export interface Message {
  content: string;
  role: 'assistant' | 'user';
}

interface ChatStreamProps {
  streamUrl: string;
}

export function ChatStream({ streamUrl }: ChatStreamProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Message;
        setMessages((prev) => [...prev, data]);
      } catch (error) {
        console.log(error);
        setError('Failed to parse message');
      }
    };

    eventSource.onerror = () => {
      setError('Connection error');
      eventSource.close();
    };

    eventSource.addEventListener('complete', () => {
      setIsLoading(false);
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [streamUrl]);

  if (error) {
    return <div role="alert" className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg ${
            message.role === 'assistant' ? 'bg-blue-100' : 'bg-gray-100'
          }`}
          data-testid="chat-message"
        >
          {message.content}
        </div>
      ))}
      {isLoading && (
        <div role="status" className="animate-pulse">
          Loading...
        </div>
      )}
    </div>
  );
}