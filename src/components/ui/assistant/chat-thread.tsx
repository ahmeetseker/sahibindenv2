import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { ChatMessage } from './chat-message';
import type { AssistantChatMessage } from '@/lib/store';

interface Props {
  messages: AssistantChatMessage[];
  isThinking: boolean;
  onSuggest: (chip: string) => void;
  onNavigate: (target: 'listings' | 'customers') => void;
}

export function ChatThread({ messages, isThinking, onSuggest, onNavigate }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isThinking]);

  return (
    <div role="log" aria-live="polite" className="flex h-full flex-col gap-4 overflow-y-auto px-5 py-5">
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} onSuggest={onSuggest} onNavigate={onNavigate} />
      ))}
      {isThinking && (
        <div className="flex gap-2.5">
          <div className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-border/60 bg-background/40 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-stone-700 dark:text-stone-300" />
          </div>
          <div className="flex items-center gap-1 px-1 py-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-500/70 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-500/70 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-stone-500/70 [animation-delay:300ms]" />
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
