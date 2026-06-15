import booksData from "@/data/books.json";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available_copies: number;
  total_copies: number;
  location: string;
  subjects?: string[];
};

const books = booksData as Book[];

export function searchBook(query: string) {
  const q = query.trim().toLowerCase();
  return books.filter((book) => {
    const haystack = [book.title, book.author, ...(book.subjects ?? []), book.isbn ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  }).map(({ id, title, author, isbn, available_copies, total_copies, location }) => ({
    id, title, author, isbn, available_copies, total_copies, location,
  }));
}

export function checkAvailability(book_id: string) {
  const book = books.find((b) => b.id === book_id);
  if (!book) return null;
  return { id: book.id, title: book.title, available_copies: book.available_copies, total_copies: book.total_copies };
}

export const LIBRARY_TOOLS = [
  {
    name: "search_book",
    description: "Search the library catalog by title, author, or subject keyword and return matching books with availability.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Search term (title, author, or subject)" } },
      required: ["query"],
    },
  },
  {
    name: "check_availability",
    description: "Check how many copies of a specific book are available by book ID.",
    input_schema: {
      type: "object",
      properties: { book_id: { type: "string", description: "The unique book ID (e.g. bk-001)" } },
      required: ["book_id"],
    },
  },
];
