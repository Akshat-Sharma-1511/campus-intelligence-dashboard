import eventsData from "@/data/events.json";

export const dynamic = "force-dynamic";

type CampusEvent = {
  title: string;
  club: string;
  start_time: string;
  end_time: string;
  location: string;
  description?: string;
};

const events = eventsData as CampusEvent[];

export function getUpcomingEvents(daysAhead = 7) {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + daysAhead * 86400000);
  return events
    .filter((e) => {
      const start = new Date(e.start_time);
      return start >= now && start <= windowEnd;
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export function searchEvent(query: string) {
  const q = query.trim().toLowerCase();
  return events
    .filter((e) =>
      [e.title, e.club, e.description ?? ""].join(" ").toLowerCase().includes(q)
    )
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export const EVENTS_TOOLS = [
  {
    name: "get_upcoming_events",
    description: "Get club events happening within the next N days, sorted by start time.",
    input_schema: {
      type: "object",
      properties: { days_ahead: { type: "number", description: "Number of days ahead to look (default 7)" } },
      required: [],
    },
  },
  {
    name: "search_event",
    description: "Fuzzy search club events by title, club name, or description.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Search term for event title, club, or description" } },
      required: ["query"],
    },
  },
];
