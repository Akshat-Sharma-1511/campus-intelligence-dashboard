/** Shared types for MCP tool results — expanded in Phase 3. */

export interface BookResult {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available_copies: number;
  total_copies: number;
  location: string;
}

export interface MenuResult {
  day: string;
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}

/** Result from check_dietary_item — an array of DietaryMatch */
export interface DietaryMatch {
  day: string;
  meal: string;
  item: string;
}

export interface EventResult {
  id: string;
  title: string;
  club: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface MCPInvokeResponse<T = unknown> {
  result: T | null;
  error: string | null;
}

/** Maps tool names to their owning campus system for UI accent coloring. */
export const TOOL_SERVER_MAP: Record<
  string,
  "library" | "cafeteria" | "events" | "handbook"
> = {
  search_book: "library",
  check_availability: "library",
  get_menu: "cafeteria",
  check_dietary_item: "cafeteria",
  get_upcoming_events: "events",
  search_event: "events",
  search_handbook: "handbook",
};

/** Human-readable labels for tool call chips. */
export const TOOL_CHIP_LABELS: Record<string, string> = {
  search_book: "Searching library catalog…",
  check_availability: "Checking book availability…",
  get_menu: "Fetching cafeteria menu…",
  check_dietary_item: "Checking dietary options…",
  get_upcoming_events: "Loading upcoming events…",
  search_event: "Searching events calendar…",
  search_handbook: "Searching academic handbook…",
};
