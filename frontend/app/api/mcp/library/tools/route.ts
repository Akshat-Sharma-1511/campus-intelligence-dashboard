import { NextResponse } from "next/server";
import { LIBRARY_TOOLS } from "@/lib/mcp-handlers/library";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(LIBRARY_TOOLS);
}
