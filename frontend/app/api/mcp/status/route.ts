import { NextResponse } from "next/server";
import { searchBook } from "@/lib/mcp-handlers/library";
import { getMenu } from "@/lib/mcp-handlers/cafeteria";
import { getUpcomingEvents } from "@/lib/mcp-handlers/events";
import { searchHandbook } from "@/lib/mcp-handlers/handbook";

export const dynamic = "force-dynamic";

/**
 * Health check for all 4 embedded MCP servers.
 * Does a direct in-process call to each handler — no HTTP self-calls.
 * Returns online/offline status based on whether the handler executes cleanly.
 */
export async function GET() {
  const checks = [
    {
      name: "library-server",
      label: "Library",
      accentKey: "library",
      check: () => { searchBook("test"); return true; },
    },
    {
      name: "cafeteria-server",
      label: "Cafeteria",
      accentKey: "cafeteria",
      check: () => { getMenu("monday"); return true; },
    },
    {
      name: "events-server",
      label: "Events",
      accentKey: "events",
      check: () => { getUpcomingEvents(7); return true; },
    },
    {
      name: "handbook-server",
      label: "Handbook",
      accentKey: "handbook",
      check: () => { searchHandbook("policy"); return true; },
    },
  ];

  const results = checks.map((srv) => {
    const start = Date.now();
    try {
      srv.check();
      return {
        name: srv.name,
        label: srv.label,
        accentKey: srv.accentKey,
        status: "online" as const,
        latency: Date.now() - start,
      };
    } catch {
      return {
        name: srv.name,
        label: srv.label,
        accentKey: srv.accentKey,
        status: "offline" as const,
      };
    }
  });

  return NextResponse.json(results);
}
