import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { searchHandbook } from "@/lib/mcp-handlers/handbook";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { tool: string } }
) {
  try {
    const body = await req.json();
    const input = body.input ?? {};

    if (params.tool === "search_handbook") {
      const query = input.query;
      if (!query?.trim()) return NextResponse.json({ result: null, error: "Missing 'query'" });
      return NextResponse.json({ result: searchHandbook(query), error: null });
    }

    return NextResponse.json({ result: null, error: `Unknown tool: ${params.tool}` });
  } catch (e) {
    return NextResponse.json({ result: null, error: String(e) }, { status: 500 });
  }
}
