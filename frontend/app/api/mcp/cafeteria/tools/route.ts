import { NextResponse } from "next/server";
import { CAFETERIA_TOOLS } from "@/lib/mcp-handlers/cafeteria";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json(CAFETERIA_TOOLS);
}
