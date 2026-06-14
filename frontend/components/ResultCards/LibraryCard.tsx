"use client";

import type { BookResult } from "@/lib/types";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function LibrarySkeleton() {
  return (
    <div className="animate-card-in rounded-xl border border-library/20 bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        {/* Book icon */}
        <svg
          className="h-4 w-4 text-library animate-pulse"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <span className="text-xs font-semibold text-library uppercase tracking-wider">
          Library
        </span>
      </div>
      <div className="skeleton h-3 w-2/3 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-1/3 rounded" />
    </div>
  );
}

// ─── Dietary tag extraction from item name ────────────────────────────────────

const DIETARY_TAGS = [
  { key: "vegan", label: "Vegan", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { key: "jain", label: "Jain", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  { key: "gluten-free", label: "GF", className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
];

// ─── Book Item ────────────────────────────────────────────────────────────────

function BookItem({ book }: { book: BookResult }) {
  const available = book.available_copies > 0;

  return (
    <div className="rounded-lg border border-library/10 bg-surface-elevated p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white leading-tight">{book.title}</p>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
            available
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-red-500/15 text-red-400 border-red-500/30"
          }`}
        >
          {available ? `${book.available_copies} available` : "Not available"}
        </span>
      </div>
      <p className="text-xs text-slate-400">by {book.author}</p>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
        <span>ISBN: {book.isbn}</span>
        <span>·</span>
        <span>{book.location}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface LibraryCardProps {
  state: "call" | "result";
  /** Raw tool result — shape varies per tool (array of BookResult or single book or null). */
  result?: any; // Runtime-narrowed in the component body
  toolName?: string;
}

export function LibraryCard({ state, result, toolName }: LibraryCardProps) {
  if (state === "call") return <LibrarySkeleton />;

  // Error state
  if (result?.error) {
    return (
      <div className="animate-card-in rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-library"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <span className="text-xs font-semibold text-library uppercase tracking-wider">Library</span>
        </div>
        <p className="text-xs text-red-400">{result.error}</p>
      </div>
    );
  }

  // check_availability returns a single object, search_book returns an array
  const books: BookResult[] = Array.isArray(result)
    ? (result as BookResult[])
    : result
    ? [result as BookResult]
    : [];

  // "No results" empty state
  if (books.length === 0) {
    return (
      <div className="animate-card-in rounded-xl border border-library/20 bg-surface p-4 space-y-2">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-library"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <span className="text-xs font-semibold text-library uppercase tracking-wider">Library</span>
        </div>
        <p className="text-xs text-slate-400">No books found matching your query.</p>
      </div>
    );
  }

  return (
    <div className="animate-card-in rounded-xl border-l-2 border-library bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 text-library"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <span className="text-xs font-semibold text-library uppercase tracking-wider">Library</span>
        <span className="ml-auto text-[10px] text-slate-500">{books.length} result{books.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="space-y-2">
        {books.map((book) => (
          <BookItem key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}
