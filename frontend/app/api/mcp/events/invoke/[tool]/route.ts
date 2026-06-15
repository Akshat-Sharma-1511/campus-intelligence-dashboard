import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getUpcomingEvents, searchEvent } from "@/lib/mcp-handlers/events";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { tool: string } }
) {
  try {
    const body = await req.json();
    const input = body.input ?? {};

    if (params.tool === "get_upcoming_events") {
      const days_ahead = input.days_ahead ?? 7;
      if (typeof days_ahead !== "number") return NextResponse.json({ result: null, error: "Invalid 'days_ahead'" });
      return NextResponse.json({ result: getUpcomingEvents(days_ahead), error: null });
    }

    if (params.tool === "search_event") {
      const query = input.query;
      if (!query?.trim()) return NextResponse.json({ result: null, error: "Missing 'query'" });
      return NextResponse.json({ result: searchEvent(query), error: null });
    }

    return NextResponse.json({ result: null, error: `Unknown tool: ${params.tool}` });
  } catch (e) {
    return NextResponse.json({ result: null, error: String(e) }, { status: 500 });
  }
}
