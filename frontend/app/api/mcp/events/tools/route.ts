import { NextResponse } from "next/server";
import { EVENTS_TOOLS } from "@/lib/mcp-handlers/events";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(EVENTS_TOOLS);
}
