/**
 * Direct in-process tool registry.
 * Used by /api/chat to call MCP handlers WITHOUT making HTTP round-trips.
 * This is necessary on Vercel where serverless functions can't reliably
 * call other functions on the same deployment via HTTP.
 *
 * The individual /api/mcp/* HTTP routes still exist for external demo/testing.
 */

import { LIBRARY_TOOLS, searchBook, checkAvailability } from "./mcp-handlers/library";
import { CAFETERIA_TOOLS, getMenu, checkDietaryItem } from "./mcp-handlers/cafeteria";
import { EVENTS_TOOLS, getUpcomingEvents, searchEvent } from "./mcp-handlers/events";
import { HANDBOOK_TOOLS, searchHandbook } from "./mcp-handlers/handbook";
import type { MCPToolDefinition } from "./types";

type ToolHandler = (input: Record<string, unknown>) => unknown;

/** All tool definitions from every campus server. */
export const ALL_TOOLS: MCPToolDefinition[] = [
  ...LIBRARY_TOOLS,
  ...CAFETERIA_TOOLS,
  ...EVENTS_TOOLS,
  ...HANDBOOK_TOOLS,
] as MCPToolDefinition[];

/** Map of tool name → which "server" owns it (for UI labelling). */
export const TOOL_SERVER_MAP: Record<string, string> = {
  search_book:          "library-server",
  check_availability:   "library-server",
  get_menu:             "cafeteria-server",
  check_dietary_item:   "cafeteria-server",
  get_upcoming_events:  "events-server",
  search_event:         "events-server",
  search_handbook:      "handbook-server",
};

/** Direct in-process handlers — no HTTP involved. */
const TOOL_HANDLERS: Record<string, ToolHandler> = {
  search_book:         (i) => searchBook(i.query as string),
  check_availability:  (i) => checkAvailability(i.book_id as string),
  get_menu:            (i) => getMenu(i.day as string),
  check_dietary_item:  (i) => checkDietaryItem(i.query as string),
  get_upcoming_events: (i) => getUpcomingEvents((i.days_ahead as number) ?? 7),
  search_event:        (i) => searchEvent(i.query as string),
  search_handbook:     (i) => searchHandbook(i.query as string),
};

export function executeTool(
  toolName: string,
  input: Record<string, unknown>
): { result: unknown; error: string | null } {
  const handler = TOOL_HANDLERS[toolName];
  if (!handler) return { result: null, error: `Unknown tool: ${toolName}` };
  try {
    const result = handler(input);
    if (result === null || result === undefined) {
      return { result: null, error: `No result returned by ${toolName}` };
    }
    return { result, error: null };
  } catch (e) {
    return { result: null, error: String(e) };
  }
}
