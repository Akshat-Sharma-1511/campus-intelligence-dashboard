import handbookData from "@/data/handbook.json";

export const dynamic = "force-dynamic";

type HandbookSection = { section: string; text: string };

const handbook = handbookData as HandbookSection[];

export function searchHandbook(query: string) {
  const q = query.trim().toLowerCase();
  return handbook.filter((s) =>
    `${s.section} ${s.text}`.toLowerCase().includes(q)
  );
}

export const HANDBOOK_TOOLS = [
  {
    name: "search_handbook",
    description:
      "Search the academic handbook for policy details on grading, attendance, course withdrawal, drop/add periods, honors, and academic integrity.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Keyword to search for in handbook policies" } },
      required: ["query"],
    },
  },
];
