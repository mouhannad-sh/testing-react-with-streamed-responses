import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { setupWorker } from 'msw/browser';
import { http } from 'msw';
import { ChatStream } from '../ChatStream';

// Setup MSW server for mocking EventSource
const server = setupWorker();

beforeAll(() => {
  // Start the interception
  server.start();
});

afterEach(() => {
  // Reset handlers between tests
  server.resetHandlers();
});

afterAll(() => {
  // Clean up
  server.stop();
});

describe('ChatStream', () => {
  it('renders streaming messages correctly', async () => {
    // Mock EventSource behavior
    const messages = [
      { content: 'Hello', role: 'assistant' },
      { content: 'Hi there!', role: 'user' },
    ];


    // Setup mock EventSource endpoint
    server.use(
      http.get('/api/chat-stream', () => {
        const stream = new ReadableStream({
          async start(controller) {
            // Simulate streaming messages
            for (const message of messages) {
              const data = `data: ${JSON.stringify(message)}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            controller.enqueue(new TextEncoder().encode('event: complete\ndata: null\n\n'));
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }),
    );

    render(<ChatStream streamUrl="/api/chat-stream" />);

    // Wait for loading indicator
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for messages to appear
    await waitFor(() => {
      const messageElements = screen.getAllByTestId('chat-message');
      expect(messageElements).toHaveLength(2);
      expect(messageElements[0]).toHaveTextContent('Hello');
      expect(messageElements[1]).toHaveTextContent('Hi there!');
    });

    // Verify loading indicator is removed
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('handles connection errors', async () => {
    server.use(
      http.get('/api/chat-stream', () => {
        return new Response(null, { status: 500 });
      }),
    );

    render(<ChatStream streamUrl="/api/chat-stream" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Connection error');
      
    });
  });

  // it('handles malformed messages', async () => {
  //   server.use(
  //     http.get('/api/chat-stream', () => {
  //       const stream = new ReadableStream({
  //         async start(controller) {
  //           const data = `data: {invalid json}\n\n`;
  //           controller.enqueue(new TextEncoder().encode(data));
  //           await new Promise((resolve) => setTimeout(resolve, 100));
  //           controller.close();
  //         },
  //       });

  //       return new Response(stream, {
  //         headers: {
  //           'Content-Type': 'text/event-stream',
  //           'Cache-Control': 'no-cache',
  //           Connection: 'keep-alive',
  //         },
  //       });
  //     }),
  //   );

  //   render(<ChatStream streamUrl="/api/chat-stream" />);

  //   await waitFor(() => {
  //     expect(screen.getByRole('alert')).toHaveTextContent('Failed to parse message');
  //   });
  // });
});