"use client";

import { useEffect, useState } from "react";
import { ALL_MCP_SERVERS, type MCPServerConfig } from "@/lib/mcp-registry";

interface ServerStatus extends MCPServerConfig {
  status: "online" | "offline" | "checking";
  latency?: number;
}

export function ServerStatusPanel() {
  const [statuses, setStatuses] = useState<ServerStatus[]>(() =>
    ALL_MCP_SERVERS.map((srv) => ({
      ...srv,
      status: "checking",
    }))
  );

  useEffect(() => {
    const checkHealth = async () => {
      const promises = ALL_MCP_SERVERS.map(async (srv) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const start = Date.now();
        try {
          const res = await fetch(`${srv.baseUrl}/health`, {
            signal: controller.signal,
            mode: "cors",
            headers: { Accept: "application/json" },
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "ok") {
              return {
                ...srv,
                status: "online" as const,
                latency: Date.now() - start,
              };
            }
          }
          return { ...srv, status: "offline" as const };
        } catch {
          clearTimeout(timer);
          return { ...srv, status: "offline" as const };
        }
      });

      const results = await Promise.all(promises);
      setStatuses(results);
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
                    {srv.baseUrl.replace("http://localhost:", "Port ")}
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
