"use client";

/** HandbookCard — Phase 5 bonus. Renders search_handbook results. */

interface HandbookChunk {
  section: string;
  text: string;
}

interface HandbookCardProps {
  state: "call" | "result";
  result?: any; // Shape varies per tool — runtime narrowed in component
  toolName?: string;
}

export function HandbookCard({ state, result }: HandbookCardProps) {
  const bookIcon = (
    <svg
      className="h-4 w-4 text-handbook"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  if (state === "call") {
    return (
      <div className="animate-card-in rounded-xl border border-handbook/20 bg-surface p-4 space-y-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-handbook animate-pulse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-semibold text-handbook uppercase tracking-wider">Handbook</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="skeleton h-2.5 w-1/3 rounded" />
            <div className="skeleton h-2 w-full rounded" />
            <div className="skeleton h-2 w-5/6 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (result?.error) {
    return (
      <div className="animate-card-in rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          {bookIcon}
          <span className="text-xs font-semibold text-handbook uppercase tracking-wider">Handbook</span>
        </div>
        <p className="text-xs text-red-400">{result.error}</p>
      </div>
    );
  }

  const chunks: HandbookChunk[] = Array.isArray(result) ? (result as HandbookChunk[]) : [];

  if (chunks.length === 0) {
    return (
      <div className="animate-card-in rounded-xl border border-handbook/20 bg-surface p-4 space-y-2">
        <div className="flex items-center gap-2">
          {bookIcon}
          <span className="text-xs font-semibold text-handbook uppercase tracking-wider">Handbook</span>
        </div>
        <p className="text-xs text-slate-400">No handbook sections matched your query.</p>
      </div>
    );
  }

  return (
    <div className="animate-card-in rounded-xl border-l-2 border-handbook bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        {bookIcon}
        <span className="text-xs font-semibold text-handbook uppercase tracking-wider">Handbook</span>
        <span className="ml-auto text-[10px] text-slate-500">Top {chunks.length} sections</span>
      </div>
      <div className="space-y-3">
        {chunks.map((chunk, i) => (
          <div key={i} className="rounded-lg border border-handbook/10 bg-surface-elevated p-3 space-y-1">
            <p className="text-xs font-semibold text-handbook">{chunk.section}</p>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{chunk.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
