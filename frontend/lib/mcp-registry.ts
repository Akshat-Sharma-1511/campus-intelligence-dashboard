/**
 * MCP server registry — server-side only.
 *
 * Used by tool-router.ts (called from /api/chat route) to resolve server URLs.
 * NEVER imported by client components — ServerStatusPanel uses /api/mcp/status instead.
 *
 * URL priority:
 *  1. VERCEL_URL (auto-injected by Vercel) → /api/mcp/{namespace} on same deployment
 *  2. UNIFIED_SERVER_URL                   → external unified server
 *  3. Individual LIBRARY/CAFETERIA/etc. env vars → local dev localhost ports
 */

export interface MCPServerConfig {
  name: string;
  baseUrl: string;
  label: string;
  accentKey: "library" | "cafeteria" | "events" | "handbook";
}

function resolveUrl(namespace: string): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/mcp/${namespace}`;
  }
  if (process.env.UNIFIED_SERVER_URL) {
    return `${process.env.UNIFIED_SERVER_URL}/${namespace}`;
  }
  const localPorts: Record<string, string> = {
    library:   process.env.LIBRARY_SERVER_URL   ?? "http://localhost:8001",
    cafeteria: process.env.CAFETERIA_SERVER_URL ?? "http://localhost:8002",
    events:    process.env.EVENTS_SERVER_URL    ?? "http://localhost:8003",
    handbook:  process.env.HANDBOOK_SERVER_URL  ?? "http://localhost:8004",
  };
  return localPorts[namespace];
}

/** Active servers for the orchestrator (server-side only). */
export function getActiveServers(): MCPServerConfig[] {
  return [
    { name: "library-server",   label: "Library",   accentKey: "library",   baseUrl: resolveUrl("library")   },
    { name: "cafeteria-server", label: "Cafeteria", accentKey: "cafeteria", baseUrl: resolveUrl("cafeteria") },
    { name: "events-server",    label: "Events",    accentKey: "events",    baseUrl: resolveUrl("events")    },
    { name: "handbook-server",  label: "Handbook",  accentKey: "handbook",  baseUrl: resolveUrl("handbook")  },
  ];
}
