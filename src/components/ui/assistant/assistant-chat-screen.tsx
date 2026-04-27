import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { classify } from '@/lib/assistant/engine';
import type { StoreSnapshot } from '@/lib/assistant/intents';
import { replies } from '@/lib/assistant/replies';
import { ChatSidebar } from './chat-sidebar';
import { ChatThread } from './chat-thread';
import { ChatComposer } from './chat-composer';

interface Props {
  initialDraft?: string;
  onNavigate: (target: 'listings' | 'customers') => void;
}

export function AssistantChatScreen({ initialDraft, onNavigate }: Props) {
  const {
    assistantSessions,
    activeAssistantSessionId,
    profile,
    listings,
    customers,
    transactions,
    events,
    conversations,
    startAssistantSession,
    setActiveAssistantSession,
    appendAssistantMessage,
    deleteAssistantSession,
  } = useStore();

  const [isThinking, setIsThinking] = useState(false);
  const draftConsumedRef = useRef(false);

  useEffect(() => {
    if (!activeAssistantSessionId) {
      const id = startAssistantSession();
      const greeting = replies.greeting();
      appendAssistantMessage(id, {
        role: 'assistant',
        text: `Merhaba ${profile.name.split(' ')[0]}, ne arıyoruz?`,
        blocks: [{ kind: 'suggest', chips: greeting.chips }],
        intent: 'greeting',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAssistantSessionId]);

  const activeSession = assistantSessions.find((s) => s.id === activeAssistantSessionId);

  const handleSubmit = (text: string) => {
    if (!activeAssistantSessionId) return;
    const sid = activeAssistantSessionId;
    appendAssistantMessage(sid, { role: 'user', text });
    setIsThinking(true);

    const snapshot: StoreSnapshot = { listings, customers, transactions, events, conversations };
    const delay = 350 + Math.random() * 350;
    window.setTimeout(() => {
      const response = classify(text, snapshot);
      appendAssistantMessage(sid, {
        role: 'assistant',
        text: response.text,
        blocks: response.blocks,
        intent: response.intent,
      });
      setIsThinking(false);
    }, delay);
  };

  const handleSuggest = (chip: string) => {
    handleSubmit(chip);
  };

  const handleCreate = () => {
    const id = startAssistantSession();
    const greeting = replies.greeting();
    appendAssistantMessage(id, {
      role: 'assistant',
      text: `Merhaba ${profile.name.split(' ')[0]}, ne arıyoruz?`,
      blocks: [{ kind: 'suggest', chips: greeting.chips }],
      intent: 'greeting',
    });
  };

  const draftToShow = !draftConsumedRef.current ? initialDraft : '';
  useEffect(() => {
    if (initialDraft) draftConsumedRef.current = true;
  }, [initialDraft]);

  return (
    <div className="flex h-full">
      <ChatSidebar
        sessions={assistantSessions}
        activeId={activeAssistantSessionId}
        onSelect={setActiveAssistantSession}
        onCreate={handleCreate}
        onDelete={deleteAssistantSession}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ChatThread
            messages={activeSession?.messages ?? []}
            isThinking={isThinking}
            onSuggest={handleSuggest}
            onNavigate={onNavigate}
          />
        </div>
        <ChatComposer initialText={draftToShow} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
