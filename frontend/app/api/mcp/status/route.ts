import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SERVERS = [
  { name: "library-server",   label: "Library",   namespace: "library",   accentKey: "library"   },
  { name: "cafeteria-server", label: "Cafeteria", namespace: "cafeteria", accentKey: "cafeteria" },
  { name: "events-server",    label: "Events",    namespace: "events",    accentKey: "events"    },
  { name: "handbook-server",  label: "Handbook",  namespace: "handbook",  accentKey: "handbook"  },
] as const;

/** Build the base URL for a given namespace — server-side only */
function getHealthUrl(namespace: string): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/mcp/${namespace}/health`;
  }
  if (process.env.UNIFIED_SERVER_URL) {
    return `${process.env.UNIFIED_SERVER_URL}/${namespace}/health`;
  }
  const localPorts: Record<string, string> = {
    library:   process.env.LIBRARY_SERVER_URL   ?? "http://localhost:8001",
    cafeteria: process.env.CAFETERIA_SERVER_URL ?? "http://localhost:8002",
    events:    process.env.EVENTS_SERVER_URL    ?? "http://localhost:8003",
    handbook:  process.env.HANDBOOK_SERVER_URL  ?? "http://localhost:8004",
  };
  return `${localPorts[namespace]}/health`;
}

export async function GET() {
  const results = await Promise.all(
    SERVERS.map(async (srv) => {
      const url = getHealthUrl(srv.namespace);
      const start = Date.now();
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(3000),
          cache: "no-store",
        });
        const latency = Date.now() - start;
        if (res.ok) {
          const data = await res.json();
          if (data.status === "ok") {
            return { ...srv, status: "online" as const, latency, url };
          }
        }
        return { ...srv, status: "offline" as const, url };
      } catch {
        return { ...srv, status: "offline" as const, url };
      }
    })
  );

  return NextResponse.json(results);
}
