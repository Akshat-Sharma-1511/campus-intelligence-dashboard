/** MCP server registry — Phase 3: all three servers active. */

export interface MCPServerConfig {
  name: string;
  baseUrl: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Accent color key used by Tailwind custom colors */
  accentKey: "library" | "cafeteria" | "events" | "handbook";
}

/** Active servers for the orchestrator. */
export function getActiveServers(): MCPServerConfig[] {
  return [
    {
      name: "library-server",
      label: "Library",
      accentKey: "library",
      baseUrl: process.env.LIBRARY_SERVER_URL ?? "http://localhost:8001",
    },
    {
      name: "cafeteria-server",
      label: "Cafeteria",
      accentKey: "cafeteria",
      baseUrl: process.env.CAFETERIA_SERVER_URL ?? "http://localhost:8002",
    },
    {
      name: "events-server",
      label: "Events",
      accentKey: "events",
      baseUrl: process.env.EVENTS_SERVER_URL ?? "http://localhost:8003",
    },
  ];
}

/** All server configs (for ServerStatusPanel in Phase 4). */
export const ALL_MCP_SERVERS: MCPServerConfig[] = [
  {
    name: "library-server",
    label: "Library",
    accentKey: "library",
    baseUrl: process.env.LIBRARY_SERVER_URL ?? "http://localhost:8001",
  },
  {
    name: "cafeteria-server",
    label: "Cafeteria",
    accentKey: "cafeteria",
    baseUrl: process.env.CAFETERIA_SERVER_URL ?? "http://localhost:8002",
  },
  {
    name: "events-server",
    label: "Events",
    accentKey: "events",
    baseUrl: process.env.EVENTS_SERVER_URL ?? "http://localhost:8003",
  },
];
