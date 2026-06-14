"use client";

import { useChat, type Message } from "ai/react";
import { FormEvent, useRef, useEffect, KeyboardEvent } from "react";
import { TOOL_SERVER_MAP, TOOL_CHIP_LABELS } from "@/lib/types";

// ─── Tool chip icons ──────────────────────────────────────────────────────────

const SYSTEM_ICONS: Record<string, (cls: string) => JSX.Element> = {
  library: (cls) => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  cafeteria: (cls) => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  events: (cls) => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  handbook: (cls) => (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

const ACCENT_CLASSES: Record<string, { border: string; text: string; bg: string }> = {
  library:  { border: "border-library/30",  text: "text-library",  bg: "bg-library/10"  },
  cafeteria:{ border: "border-cafeteria/30",text: "text-cafeteria",bg: "bg-cafeteria/10"},
  events:   { border: "border-events/30",   text: "text-events",   bg: "bg-events/10"   },
  handbook: { border: "border-handbook/30", text: "text-handbook", bg: "bg-handbook/10" },
};

// ─── Tool Call Chip ───────────────────────────────────────────────────────────

function ToolChip({
  toolName,
  state,
}: {
  toolName: string;
  state: "call" | "result";
}) {
  const system = TOOL_SERVER_MAP[toolName] ?? "library";
  const accent = ACCENT_CLASSES[system];
  const label = state === "call"
    ? (TOOL_CHIP_LABELS[toolName] ?? `Calling ${toolName}…`)
    : (TOOL_CHIP_LABELS[toolName]?.replace("…", " ✓") ?? toolName);

  return (
    <div
      className={`mt-2 flex items-center gap-2 rounded-lg border ${accent.border} ${accent.bg} px-3 py-1.5 text-xs`}
    >
      {SYSTEM_ICONS[system]?.(`h-3.5 w-3.5 shrink-0 ${accent.text}`)}
      <span className={`font-medium ${accent.text}`}>{label}</span>
      {state === "call" && (
        <span className="ml-auto flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 w-1 rounded-full ${accent.text.replace("text-", "bg-")} dot-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      )}
      {state === "result" && (
        <span className="ml-auto text-slate-500">done</span>
      )}
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl bg-surface-elevated border border-border px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-slate-500 dot-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] space-y-0 ${
          isUser
            ? "rounded-2xl rounded-tr-sm bg-library/20 text-white border border-library/25 px-4 py-2.5"
            : "rounded-2xl rounded-tl-sm bg-surface-elevated text-slate-100 border border-border px-4 py-2.5"
        }`}
      >
        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Tool call chips */}
        {message.toolInvocations?.map((invocation, idx) => (
          <ToolChip
            key={`${message.id}-chip-${idx}`}
            toolName={invocation.toolName}
            state={invocation.state === "call" ? "call" : "result"}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const suggestions = [
    { text: "Is Clean Code available in the library?", system: "library" as const },
    { text: "What's for lunch today?", system: "cafeteria" as const },
    { text: "Any events this weekend?", system: "events" as const },
    { text: "What's vegan on the menu this week?", system: "cafeteria" as const },
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-6 gap-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated border border-border">
          <svg className="h-7 w-7 text-library" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white">Campus AI Assistant</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          Ask me anything about the library, cafeteria, or campus events.
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        {suggestions.map((s, i) => {
          const accent = ACCENT_CLASSES[s.system];
          return (
            <button
              key={i}
              className={`rounded-lg border ${accent.border} ${accent.bg} px-3 py-2 text-xs text-left text-slate-300 hover:text-white transition-colors cursor-default`}
            >
              <span className={`font-medium ${accent.text} mr-1.5`}>
                {s.system.charAt(0).toUpperCase() + s.system.slice(1)}
              </span>
              {s.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ChatInterface (exported) ─────────────────────────────────────────────────

interface ChatInterfaceProps {
  /** Called on every message change so parent can mirror toolInvocations to ResultPanel */
  onMessagesChange?: (messages: Message[]) => void;
}

export function ChatInterface({ onMessagesChange }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setInput } =
    useChat({ api: "/api/chat" });

  // Notify parent of message changes for Results panel wiring
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  const showTyping =
    isLoading &&
    (messages.length === 0 || messages[messages.length - 1]?.role === "user");

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface overflow-hidden">
      {/* Message history */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        {showTyping && <TypingIndicator />}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 flex items-center gap-2">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error.message}
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={onSubmit}
        id="chat-form"
        className="border-t border-border p-3 flex items-end gap-2"
      >
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          placeholder="Ask about books, menu, events… (Enter to send, Shift+Enter for newline)"
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-library/50 disabled:opacity-50 leading-relaxed"
        />
        <button
          id="chat-send-btn"
          type="submit"
          disabled={isLoading || !input.trim()}
          className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-library text-white hover:bg-library/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Send message"
        >
          {isLoading ? (
            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
