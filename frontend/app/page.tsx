"use client";

import { useState, useCallback } from "react";
import { type Message } from "ai/react";
import { ChatInterface } from "@/components/ChatInterface";
import { LibraryCard } from "@/components/ResultCards/LibraryCard";
import { MenuCard } from "@/components/ResultCards/MenuCard";
import { EventCard } from "@/components/ResultCards/EventCard";
import { HandbookCard } from "@/components/ResultCards/HandbookCard";
import { TOOL_SERVER_MAP } from "@/lib/types";

// ─── Result Cards dispatcher ──────────────────────────────────────────────────

type ToolInvocation = NonNullable<Message["toolInvocations"]>[number];

function ResultCard({ invocation }: { invocation: ToolInvocation }) {
  const system = TOOL_SERVER_MAP[invocation.toolName];
  // result shape varies per tool — runtime-typed by each Card component
  const result = invocation.state === "result" ? (invocation as any).result : undefined;
  const state = invocation.state === "call" ? "call" : "result";

  switch (system) {
    case "library":
      return <LibraryCard state={state} result={result} toolName={invocation.toolName} />;
    case "cafeteria":
      return <MenuCard state={state} result={result} toolName={invocation.toolName} />;
    case "events":
      return <EventCard state={state} result={result} toolName={invocation.toolName} />;
    case "handbook":
      return <HandbookCard state={state} result={result} toolName={invocation.toolName} />;
    default:
      return null;
  }
}

// ─── Results Panel ────────────────────────────────────────────────────────────

function ResultsPanel({ messages }: { messages: Message[] }) {
  // Collect all tool invocations from all assistant messages, deduplicated by toolCallId
  const seen = new Set<string>();
  const invocations: ToolInvocation[] = [];

  for (const message of messages) {
    if (message.role !== "assistant") continue;
    for (const inv of message.toolInvocations ?? []) {
      const key = (inv as { toolCallId?: string }).toolCallId ?? `${inv.toolName}-${invocations.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        invocations.push(inv);
      }
    }
  }

  if (invocations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-6 gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated border border-border">
          <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400">No results yet</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Results from campus systems will appear here as you chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto h-full pr-1">
      {invocations.map((inv, i) => (
        <ResultCard
          key={`${(inv as { toolCallId?: string }).toolCallId ?? i}`}
          invocation={inv}
        />
      ))}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ isSidebarOpen, onToggle }: { isSidebarOpen: boolean; onToggle: () => void }) {
  return (
    <header className="shrink-0 border-b border-border bg-surface/80 backdrop-blur-sm px-4 md:px-6 py-3.5 z-10">
      <div className="flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-library/20 border border-library/30">
            <svg className="h-4 w-4 text-library" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">
              Campus Intelligence
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Unified AI Dashboard</p>
          </div>
        </div>

        {/* System tags */}
        <div className="hidden md:flex items-center gap-2">
          {[
            { label: "Library", key: "library", color: "bg-library" },
            { label: "Cafeteria", key: "cafeteria", color: "bg-cafeteria" },
            { label: "Events", key: "events", color: "bg-events" },
          ].map(({ label, color }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full bg-surface-elevated border border-border px-3 py-1 text-xs text-slate-300"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>

        {/* Mobile results toggle */}
        <button
          id="results-drawer-toggle"
          onClick={onToggle}
          className="md:hidden flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          aria-label="Toggle results panel"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          Results
          {isSidebarOpen ? (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          ) : (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMessagesChange = useCallback((msgs: Message[]) => {
    setMessages(msgs);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header isSidebarOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((v) => !v)} />

      {/* Two-pane body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Chat (full on mobile, 60% on desktop) */}
        <main className="flex flex-1 flex-col overflow-hidden md:max-w-none p-3 md:p-4">
          <ChatInterface onMessagesChange={handleMessagesChange} />
        </main>

        {/* Right — Results panel */}
        {/* Desktop: always visible sidebar */}
        <aside className="hidden md:flex w-80 lg:w-96 shrink-0 flex-col border-l border-border bg-surface overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Live Results
            </h2>
          </div>
          <div className="flex-1 overflow-hidden p-3">
            <ResultsPanel messages={messages} />
          </div>
        </aside>

        {/* Mobile: bottom drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Drawer */}
            <div className="relative flex flex-col max-h-[70vh] rounded-t-2xl bg-surface border-t border-border overflow-hidden animate-card-in">
              {/* Handle */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Results</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                  aria-label="Close drawer"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <ResultsPanel messages={messages} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
