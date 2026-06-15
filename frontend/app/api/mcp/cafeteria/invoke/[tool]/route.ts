import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getMenu, checkDietaryItem } from "@/lib/mcp-handlers/cafeteria";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { tool: string } }
) {
  try {
    const body = await req.json();
    const input = body.input ?? {};

    if (params.tool === "get_menu") {
      const day = input.day;
      if (!day?.trim()) return NextResponse.json({ result: null, error: "Missing 'day'" });
      const menu = getMenu(day);
      if (!menu) return NextResponse.json({ result: null, error: `Invalid day '${day}'` });
      return NextResponse.json({ result: menu, error: null });
    }

    if (params.tool === "check_dietary_item") {
      const query = input.query;
      if (!query?.trim()) return NextResponse.json({ result: null, error: "Missing 'query'" });
      return NextResponse.json({ result: checkDietaryItem(query), error: null });
    }

    return NextResponse.json({ result: null, error: `Unknown tool: ${params.tool}` });
  } catch (e) {
    return NextResponse.json({ result: null, error: String(e) }, { status: 500 });
  }
}
