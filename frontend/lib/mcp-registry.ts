/** MCP server registry — Unified server mode.
 *
 *  In production a single "unified-server" hosts all 4 campus services
 *  under namespaced routes (/library/*, /cafeteria/*, /events/*, /handbook/*).
 *  The UNIFIED_SERVER_URL env var points to that single Render deployment.
 *  Falls back to individual localhost ports for local development.
 */

export interface MCPServerConfig {
  name: string;
  baseUrl: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Accent color key used by Tailwind custom colors */
  accentKey: "library" | "cafeteria" | "events" | "handbook";
}

const UNIFIED = process.env.UNIFIED_SERVER_URL;

/** Active servers for the orchestrator. */
export function getActiveServers(): MCPServerConfig[] {
  return [
    {
      name: "library-server",
      label: "Library",
      accentKey: "library",
      baseUrl: UNIFIED
        ? `${UNIFIED}/library`
        : (process.env.LIBRARY_SERVER_URL ?? "http://localhost:8001"),
    },
    {
      name: "cafeteria-server",
      label: "Cafeteria",
      accentKey: "cafeteria",
      baseUrl: UNIFIED
        ? `${UNIFIED}/cafeteria`
        : (process.env.CAFETERIA_SERVER_URL ?? "http://localhost:8002"),
    },
    {
      name: "events-server",
      label: "Events",
      accentKey: "events",
      baseUrl: UNIFIED
        ? `${UNIFIED}/events`
        : (process.env.EVENTS_SERVER_URL ?? "http://localhost:8003"),
    },
    {
      name: "handbook-server",
      label: "Handbook",
      accentKey: "handbook",
      baseUrl: UNIFIED
        ? `${UNIFIED}/handbook`
        : (process.env.HANDBOOK_SERVER_URL ?? "http://localhost:8004"),
    },
  ];
}

/** All server configs (for ServerStatusPanel). */
export const ALL_MCP_SERVERS: MCPServerConfig[] = [
  {
    name: "library-server",
    label: "Library",
    accentKey: "library",
    baseUrl: UNIFIED
      ? `${UNIFIED}/library`
      : (process.env.LIBRARY_SERVER_URL ?? "http://localhost:8001"),
  },
  {
    name: "cafeteria-server",
    label: "Cafeteria",
    accentKey: "cafeteria",
    baseUrl: UNIFIED
      ? `${UNIFIED}/cafeteria`
      : (process.env.CAFETERIA_SERVER_URL ?? "http://localhost:8002"),
  },
  {
    name: "events-server",
    label: "Events",
    accentKey: "events",
    baseUrl: UNIFIED
      ? `${UNIFIED}/events`
      : (process.env.EVENTS_SERVER_URL ?? "http://localhost:8003"),
  },
  {
    name: "handbook-server",
    label: "Handbook",
    accentKey: "handbook",
    baseUrl: UNIFIED
      ? `${UNIFIED}/handbook`
      : (process.env.HANDBOOK_SERVER_URL ?? "http://localhost:8004"),
  },
];
