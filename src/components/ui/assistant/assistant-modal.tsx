import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { AssistantModulesScreen } from './assistant-modules-screen';
import { AssistantChatScreen } from './assistant-chat-screen';

interface Props {
  open: boolean;
  onClose: () => void;
  onPickModule: (target: string) => void;
}

export function AssistantModal({ open, onClose, onPickModule }: Props) {
  const [mode, setMode] = useState<'modules' | 'chat'>('modules');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!open) {
      setMode('modules');
      setDraft('');
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="assistant-backdrop"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            key="assistant-panel"
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'modules' ? 'Atölye Modülleri' : 'Atölye Asistanı'}
            className="fixed left-1/2 top-1/2 z-50 flex h-[min(640px,calc(100%-3rem))] w-[min(1080px,calc(100%-2rem))] flex-col overflow-hidden rounded-xl border border-border/60 bg-background/70 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.85)] backdrop-blur-2xl backdrop-saturate-150"
            style={{ translateX: '-50%', translateY: '-50%' }}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-stone-300/25 blur-[100px] dark:bg-stone-700/20" />
              <div className="absolute -bottom-[15%] -right-[10%] h-[55%] w-[55%] rounded-full bg-stone-400/20 blur-[110px] dark:bg-stone-600/15" />
              <div className="absolute right-[20%] top-[5%] h-[30%] w-[30%] rounded-full bg-stone-200/20 blur-[90px] dark:bg-stone-800/15" />
            </div>

            <div className="relative flex items-end justify-between gap-6 border-b border-border/60 px-7 pb-4 pt-5">
              <div className="flex items-center gap-3">
                {mode === 'chat' && (
                  <button
                    type="button"
                    onClick={() => setMode('modules')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur-md transition-colors hover:bg-background/70"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Modüller
                  </button>
                )}
                <div>
                  <AnimatePresence mode="wait">
                    <motion.h1
                      key={mode}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="font-serif text-3xl font-light leading-none tracking-tight md:text-[42px]"
                    >
                      {mode === 'modules' ? (
                        <>
                          Nereye{' '}
                          <span className="font-medium text-stone-800 dark:text-stone-200">
                            gidelim?
                          </span>
                        </>
                      ) : (
                        <>
                          Atölye{' '}
                          <span className="font-medium text-stone-800 dark:text-stone-200">
                            asistanı
                          </span>
                        </>
                      )}
                    </motion.h1>
                  </AnimatePresence>
                  <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                    {mode === 'modules'
                      ? 'Modüller · hızlı erişim · ⌘ K'
                      : 'Yapay zekâ · gerçek verilerinden cevaplar'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/40 px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur-md transition-colors hover:bg-background/70"
              >
                <X className="h-3.5 w-3.5" />
                Kapat
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              {mode === 'modules' ? (
                <AssistantModulesScreen
                  draft={draft}
                  onDraftChange={setDraft}
                  onActivateChat={() => setMode('chat')}
                  onPickModule={(target) => {
                    onPickModule(target);
                    onClose();
                  }}
                />
              ) : (
                <AssistantChatScreen
                  initialDraft={draft}
                  onNavigate={(target) => {
                    onPickModule(target);
                    onClose();
                  }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
