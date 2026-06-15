import { NextResponse } from "next/server";
import { HANDBOOK_TOOLS } from "@/lib/mcp-handlers/handbook";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(HANDBOOK_TOOLS);
}
