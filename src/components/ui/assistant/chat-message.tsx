import { Sparkles } from 'lucide-react';
import { BlockRenderer } from './assistant-blocks';
import type { AssistantChatMessage } from '@/lib/store';

interface Props {
  message: AssistantChatMessage;
  onSuggest: (chip: string) => void;
  onNavigate: (target: 'listings' | 'customers') => void;
}

export function ChatMessage({ message, onSuggest, onNavigate }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-foreground px-3.5 py-2 text-[13px] leading-relaxed text-background">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <div className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-border/60 bg-background/40 backdrop-blur-md">
        <Sparkles className="h-3 w-3 text-stone-700 dark:text-stone-300" />
      </div>
      <div className="flex max-w-[88%] flex-1 flex-col gap-2">
        {message.text && (
          <p className="text-[13.5px] leading-relaxed">{message.text}</p>
        )}
        {message.blocks?.map((block, i) => (
          <BlockRenderer key={i} block={block} onSuggest={onSuggest} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
