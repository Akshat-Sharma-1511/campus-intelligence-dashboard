import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { searchBook, checkAvailability } from "@/lib/mcp-handlers/library";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { tool: string } }
) {
  try {
    const body = await req.json();
    const input = body.input ?? {};

    if (params.tool === "search_book") {
      const query = input.query;
      if (!query?.trim()) return NextResponse.json({ result: null, error: "Missing 'query'" });
      return NextResponse.json({ result: searchBook(query), error: null });
    }

    if (params.tool === "check_availability") {
      const book_id = input.book_id;
      if (!book_id?.trim()) return NextResponse.json({ result: null, error: "Missing 'book_id'" });
      const book = checkAvailability(book_id);
      if (!book) return NextResponse.json({ result: null, error: `No book with id '${book_id}'` });
      return NextResponse.json({ result: book, error: null });
    }

    return NextResponse.json({ result: null, error: `Unknown tool: ${params.tool}` });
  } catch (e) {
    return NextResponse.json({ result: null, error: String(e) }, { status: 500 });
  }
}
