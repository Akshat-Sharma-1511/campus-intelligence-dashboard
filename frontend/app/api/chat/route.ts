import { groq } from "@ai-sdk/groq";
import { jsonSchema, streamText, tool, type ToolSet } from "ai";
import { ALL_TOOLS, executeTool } from "@/lib/tool-registry";
import type { MCPToolDefinition } from "@/lib/types";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the AI assistant for a university Campus Intelligence Dashboard.
You have access to tools from independent campus systems: library catalog,
cafeteria menu, club events calendar, and the academic handbook.

Rules:
- For any question that could be answered by a tool, call the relevant tool(s)
  rather than guessing or using prior knowledge.
- If a question could plausibly involve multiple systems (e.g. "what's
  happening on campus today" could mean events AND food), call all relevant
  tools in the same turn.
- If a tool returns an error or a campus system is unavailable, tell the user
  plainly which part of their request you could not fulfill, and still answer
  the parts you could. Never pretend a service is working when it returned an error.
- If a tool returns no results (e.g. no books found, no events on that date),
  say so directly. Never invent books, menu items, events, or policies that
  were not returned by a tool.
- Keep responses concise and conversational. Do not describe your internal
  tool-calling process to the user.`;

function buildAiTools(mcpTools: MCPToolDefinition[]): ToolSet {
  const tools: ToolSet = {};
  for (const toolDef of mcpTools) {
    tools[toolDef.name] = tool({
      description: toolDef.description,
      parameters: jsonSchema(toolDef.input_schema),
      execute: async (input) => {
        const { result, error } = executeTool(
          toolDef.name,
          input as Record<string, unknown>
        );
        if (error) return { error, result: null };
        return result;
      },
    });
  }
  return tools;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const aiTools = buildAiTools(ALL_TOOLS);

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: SYSTEM_PROMPT,
      messages,
      tools: aiTools,
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
