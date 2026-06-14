import { getActiveServers } from "./mcp-registry";
import type { MCPToolDefinition, MCPInvokeResponse } from "./types";

const TOOLS_FETCH_TIMEOUT_MS = 3_000;
const INVOKE_TIMEOUT_MS = 5_000;

export interface ToolOwner {
  serverName: string;
  baseUrl: string;
}

export interface AggregatedToolsResult {
  tools: MCPToolDefinition[];
  toolOwners: Map<string, ToolOwner>;
  unavailableServers: string[];
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchToolsFromServer(
  server: { name: string; baseUrl: string }
): Promise<{ tools: MCPToolDefinition[]; error?: string }> {
  try {
    const response = await fetchWithTimeout(
      `${server.baseUrl}/tools`,
      { method: "GET", headers: { Accept: "application/json" } },
      TOOLS_FETCH_TIMEOUT_MS
    );
    if (!response.ok) {
      return { tools: [], error: `${server.name} returned HTTP ${response.status}` };
    }
    const tools = (await response.json()) as MCPToolDefinition[];
    return { tools };
  } catch {
    return { tools: [], error: `${server.name} unreachable` };
  }
}

/** Fetch /tools from every active MCP server in parallel. */
export async function fetchAllTools(): Promise<AggregatedToolsResult> {
  const servers = getActiveServers();
  const results = await Promise.all(
    servers.map(async (server) => ({
      server,
      ...(await fetchToolsFromServer(server)),
    }))
  );

  const tools: MCPToolDefinition[] = [];
  const toolOwners = new Map<string, ToolOwner>();
  const unavailableServers: string[] = [];

  for (const { server, tools: serverTools, error } of results) {
    if (error || serverTools.length === 0) {
      unavailableServers.push(server.name);
      continue;
    }
    for (const toolDef of serverTools) {
      tools.push(toolDef);
      toolOwners.set(toolDef.name, {
        serverName: server.name,
        baseUrl: server.baseUrl,
      });
    }
  }

  return { tools, toolOwners, unavailableServers };
}

/** POST /invoke/{tool_name} on the owning server. */
export async function invokeToolOnServer(
  baseUrl: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<MCPInvokeResponse> {
  try {
    const response = await fetchWithTimeout(
      `${baseUrl}/invoke/${toolName}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      },
      INVOKE_TIMEOUT_MS
    );
    if (!response.ok) {
      return {
        result: null,
        error: `HTTP ${response.status} from ${baseUrl}/invoke/${toolName}`,
      };
    }
    return (await response.json()) as MCPInvokeResponse;
  } catch {
    return {
      result: null,
      error: `Timeout or network error calling ${toolName}`,
    };
  }
}

/** Look up owner and invoke — used by the chat orchestrator execute handlers. */
export async function invokeTool(
  toolName: string,
  input: Record<string, unknown>,
  toolOwners: Map<string, ToolOwner>
): Promise<MCPInvokeResponse> {
  const owner = toolOwners.get(toolName);
  if (!owner) {
    return { result: null, error: `No server registered for tool: ${toolName}` };
  }
  return invokeToolOnServer(owner.baseUrl, toolName, input);
}

/** Invoke multiple tools in parallel (same LLM turn). */
export async function invokeToolsParallel(
  calls: Array<{ toolName: string; input: Record<string, unknown> }>,
  toolOwners: Map<string, ToolOwner>
): Promise<MCPInvokeResponse[]> {
  return Promise.all(calls.map((c) => invokeTool(c.toolName, c.input, toolOwners)));
}
