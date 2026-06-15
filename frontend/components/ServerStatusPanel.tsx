"use client";

import { useEffect, useState } from "react";

interface ServerStatus {
  name: string;
  label: string;
  accentKey: string;
  status: "online" | "offline" | "checking";
  latency?: number;
  url?: string;
}

const INITIAL_STATUSES: ServerStatus[] = [
  { name: "library-server",   label: "Library",   accentKey: "library",   status: "checking" },
  { name: "cafeteria-server", label: "Cafeteria", accentKey: "cafeteria", status: "checking" },
  { name: "events-server",    label: "Events",    accentKey: "events",    status: "checking" },
  { name: "handbook-server",  label: "Handbook",  accentKey: "handbook",  status: "checking" },
];

export function ServerStatusPanel() {
  const [statuses, setStatuses] = useState<ServerStatus[]>(INITIAL_STATUSES);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/mcp/status", { cache: "no-store" });
        if (res.ok) {
          const data: ServerStatus[] = await res.json();
          setStatuses(data);
        }
      } catch {
        setStatuses((prev) => prev.map((s) => ({ ...s, status: "offline" as const })));
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface-elevated/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          System Status
        </h3>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {statuses.map((srv) => {
          const isOnline = srv.status === "online";
          const isChecking = srv.status === "checking";

          return (
            <div
              key={srv.name}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-surface/30 px-3 py-2 text-xs transition-all hover:bg-surface/50"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 transition-colors duration-300 ${
                      isOnline
                        ? "bg-emerald-500"
                        : isChecking
                        ? "bg-amber-500 animate-pulse"
                        : "bg-red-500"
                    }`}
                  />
                </span>
                <div>
                  <div className="font-semibold text-slate-200">{srv.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    MCP Server
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`rounded px-1.5 py-0.5 font-medium uppercase text-[9px] ${
                    isOnline
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : isChecking
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {srv.status}
                </span>
                {isOnline && srv.latency !== undefined && (
                  <div className="text-[9px] text-slate-500 mt-0.5">{srv.latency}ms</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
