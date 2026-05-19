import { useCallback, useRef, useState } from 'react';

interface UseSSEOptions {
  onDelta?: (text: string) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Consume Server-Sent Events from a POST request that returns text/event-stream.
 * fetch + ReadableStream — EventSource doesn't support POST or custom headers.
 */
export function useSSE(opts: UseSSEOptions = {}) {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (url: string, body: unknown, accessToken?: string | null) => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStreaming(true);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify(body),
          credentials: 'include',
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`SSE failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            // Each SSE event: lines like "event: delta\ndata: {...}"
            const eventMatch = line.match(/^event:\s*(\w+)/m);
            const dataMatch = line.match(/^data:\s*(.+)$/m);
            const event = eventMatch?.[1] || 'message';
            const data = dataMatch?.[1] || '';

            if (event === 'delta') {
              try {
                const parsed = JSON.parse(data);
                opts.onDelta?.(parsed.text || '');
              } catch {
                opts.onDelta?.(data);
              }
            } else if (event === 'done') {
              opts.onDone?.();
            } else if (event === 'error') {
              opts.onError?.(new Error(data));
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          opts.onError?.(err as Error);
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [opts]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { stream, abort, streaming };
}
