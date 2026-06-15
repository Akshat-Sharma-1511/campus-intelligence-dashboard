/** MCP server registry
 *
 * Priority order for resolving server base URLs:
 *  1. VERCEL_URL (auto-injected by Vercel) → uses /api/mcp/* routes on same deployment
 *  2. UNIFIED_SERVER_URL  → external unified server (e.g. Render)
 *  3. Individual LIBRARY_SERVER_URL / CAFETERIA_SERVER_URL / etc. → local dev
 */

export interface MCPServerConfig {
  name: string;
  baseUrl: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Accent color key used by Tailwind custom colors */
  accentKey: "library" | "cafeteria" | "events" | "handbook";
}

function getMcpBase(namespace: string): string {
  // On Vercel: VERCEL_URL is automatically set (without protocol)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/mcp/${namespace}`;
  }
  // External unified server (Render etc.)
  if (process.env.UNIFIED_SERVER_URL) {
    return `${process.env.UNIFIED_SERVER_URL}/${namespace}`;
  }
  // Local dev individual ports — fall through below
  return "";
}

const localPorts: Record<string, string> = {
  library:   process.env.LIBRARY_SERVER_URL   ?? "http://localhost:8001",
  cafeteria: process.env.CAFETERIA_SERVER_URL ?? "http://localhost:8002",
  events:    process.env.EVENTS_SERVER_URL    ?? "http://localhost:8003",
  handbook:  process.env.HANDBOOK_SERVER_URL  ?? "http://localhost:8004",
};

function resolveUrl(namespace: string): string {
  return getMcpBase(namespace) || localPorts[namespace];
}

/** Active servers for the orchestrator. */
export function getActiveServers(): MCPServerConfig[] {
  return [
    { name: "library-server",   label: "Library",   accentKey: "library",   baseUrl: resolveUrl("library")   },
    { name: "cafeteria-server", label: "Cafeteria", accentKey: "cafeteria", baseUrl: resolveUrl("cafeteria") },
    { name: "events-server",    label: "Events",    accentKey: "events",    baseUrl: resolveUrl("events")    },
    { name: "handbook-server",  label: "Handbook",  accentKey: "handbook",  baseUrl: resolveUrl("handbook")  },
  ];
}

/** All server configs (for ServerStatusPanel). */
export const ALL_MCP_SERVERS: MCPServerConfig[] = [
  { name: "library-server",   label: "Library",   accentKey: "library",   baseUrl: resolveUrl("library")   },
  { name: "cafeteria-server", label: "Cafeteria", accentKey: "cafeteria", baseUrl: resolveUrl("cafeteria") },
  { name: "events-server",    label: "Events",    accentKey: "events",    baseUrl: resolveUrl("events")    },
  { name: "handbook-server",  label: "Handbook",  accentKey: "handbook",  baseUrl: resolveUrl("handbook")  },
];
