"use client";

import type { EventResult } from "@/lib/types";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function EventSkeleton() {
  return (
    <div className="animate-card-in rounded-xl border border-events/20 bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 text-events animate-pulse"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-xs font-semibold text-events uppercase tracking-wider">
          Events
        </span>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-events/10 bg-surface-elevated p-3 space-y-1.5">
          <div className="skeleton h-3 w-3/4 rounded" />
          <div className="skeleton h-2.5 w-1/2 rounded" />
          <div className="skeleton h-2.5 w-1/3 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Date formatting ──────────────────────────────────────────────────────────

function formatEventTime(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const dateStr = start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const startTime = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const endTime = end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} · ${startTime} – ${endTime}`;
  } catch {
    return startIso;
  }
}

// ─── Event Item ───────────────────────────────────────────────────────────────

function EventItem({ event }: { event: EventResult }) {
  return (
    <div className="rounded-lg border border-events/10 bg-surface-elevated p-3 space-y-1">
      <p className="text-sm font-semibold text-white leading-tight">{event.title}</p>
      <p className="text-[10px] font-medium text-events">{event.club}</p>
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
        {/* Clock icon */}
        <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{formatEventTime(event.start_time, event.end_time)}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
        {/* Location pin icon */}
        <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{event.location}</span>
      </div>
    </div>
  );
}

// ─── Calendar icon ────────────────────────────────────────────────────────────

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-4 w-4 text-events"}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface EventCardProps {
  state: "call" | "result";
  result?: any; // Shape varies per tool — runtime narrowed in component
  toolName?: string;
}

export function EventCard({ state, result, toolName }: EventCardProps) {
  if (state === "call") return <EventSkeleton />;

  if (result?.error) {
    return (
      <div className="animate-card-in rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <CalendarIcon />
          <span className="text-xs font-semibold text-events uppercase tracking-wider">Events</span>
        </div>
        <p className="text-xs text-red-400">{result.error}</p>
      </div>
    );
  }

  const events: EventResult[] = Array.isArray(result) ? (result as EventResult[]) : [];

  if (events.length === 0) {
    return (
      <div className="animate-card-in rounded-xl border border-events/20 bg-surface p-4 space-y-2">
        <div className="flex items-center gap-2">
          <CalendarIcon />
          <span className="text-xs font-semibold text-events uppercase tracking-wider">Events</span>
        </div>
        <p className="text-xs text-slate-400">No events found for that query.</p>
      </div>
    );
  }

  return (
    <div className="animate-card-in rounded-xl border-l-2 border-events bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarIcon />
        <span className="text-xs font-semibold text-events uppercase tracking-wider">Events</span>
        <span className="ml-auto text-[10px] text-slate-500">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <EventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
