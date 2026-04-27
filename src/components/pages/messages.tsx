import { useMemo, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { PageShell } from "./page-shell";

const aiSuggestions = [
  "Yarın saat 14:00 uygun. Ayvacık'ta buluşalım.",
  "Saat 14 yerine 15:30 yapabilir miyiz?",
  "Bir sonraki gün için randevu önereyim mi?",
];

export function MessagesPage() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    sendMessage,
  } = useStore();
  const [filter, setFilter] = useState<"Tümü" | "Okunmamış" | "AI">("Tümü");
  const [draft, setDraft] = useState("");

  const filtered = useMemo(() => {
    if (filter === "Okunmamış") return conversations.filter((c) => c.unread);
    if (filter === "AI") return conversations.filter((c) => c.ai);
    return conversations;
  }, [conversations, filter]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const filters = [
    { label: "Tümü" as const, count: conversations.length },
    {
      label: "Okunmamış" as const,
      count: conversations.filter((c) => c.unread).length,
    },
    {
      label: "AI" as const,
      count: conversations.filter((c) => c.ai).length,
    },
  ];

  const submit = (text?: string) => {
    if (!active) return;
    const value = (text ?? draft).trim();
    if (!value) return;
    sendMessage(active.id, value);
    setDraft("");
  };

  return (
    <PageShell
      eyebrow="Atölye · Mesajlar"
      title={<>Müşteri <span className="font-medium">sohbeti</span></>}
      description="WhatsApp, SMS ve e-posta tek gelen kutusunda. AI yanıt önerileri hazır."
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFilter(f.label)}
                  className={
                    filter === f.label
                      ? "inline-flex items-center gap-1.5 rounded-full border border-foreground/40 bg-foreground/10 px-2.5 py-1 text-[11px] font-medium"
                      : "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/30 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-background/60"
                  }
                >
                  {f.label}
                  <span className="font-mono text-[9.5px] tabular-nums opacity-70">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Bu filtrede sohbet yok.
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveConversation(c.id)}
                  className={
                    c.id === activeConversationId
                      ? "w-full rounded-xl border border-foreground/30 bg-foreground/5 p-3 text-left"
                      : "w-full rounded-xl border border-transparent p-3 text-left transition-colors hover:border-border/40 hover:bg-background/40"
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-stone-700/10 text-xs font-medium text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                        {c.name.charAt(0)}
                      </div>
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      {c.ai && (
                        <Sparkles className="h-3 w-3 flex-none text-stone-700 dark:text-stone-300" />
                      )}
                    </div>
                    <span className="flex-none font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                      {c.time}
                    </span>
                  </div>
                  <p
                    className={
                      c.unread
                        ? "mt-1 truncate text-xs font-medium text-foreground"
                        : "mt-1 truncate text-xs text-muted-foreground"
                    }
                  >
                    {c.last}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="font-serif text-lg font-light">
              {active?.name ?? "Sohbet seç"}
            </CardTitle>
            <CardDescription>
              {active
                ? `${active.messages.length} mesaj · ${active.customerId ?? "—"}`
                : "Sol menüden bir sohbet seç"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 pt-4">
            <div className="flex max-h-[320px] flex-1 flex-col gap-3 overflow-y-auto pr-2">
              {active && active.messages.length > 0 ? (
                active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.mine
                        ? "ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-foreground px-3.5 py-2 text-sm text-background"
                        : "max-w-[75%] rounded-2xl rounded-bl-sm border border-border/40 bg-background/40 px-3.5 py-2 text-sm"
                    }
                  >
                    <p>{m.text}</p>
                    <p
                      className={
                        m.mine
                          ? "mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] opacity-60"
                          : "mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground"
                      }
                    >
                      {m.time}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Henüz mesaj yok.
                </p>
              )}
            </div>

            {active && (
              <>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-stone-700 dark:text-stone-300" />
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                    AI önerileri
                  </span>
                  {aiSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] text-foreground/80 transition-colors hover:bg-background/70"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/50 px-3 py-2 backdrop-blur-md"
                >
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Yanıt yaz…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                  />
                  <button
                    type="submit"
                    aria-label="Gönder"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                    disabled={!draft.trim()}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
