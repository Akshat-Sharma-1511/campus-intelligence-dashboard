"""
Unified Campus MCP Server
Serves all 4 campus microservices (library, cafeteria, events, handbook)
from a single FastAPI application.

Routes are namespaced to maintain the same API contract:
  /library/health      /library/tools      /library/invoke/{tool}
  /cafeteria/health    /cafeteria/tools    /cafeteria/invoke/{tool}
  /events/health       /events/tools       /events/invoke/{tool}
  /handbook/health     /handbook/tools     /handbook/invoke/{tool}

The frontend mcp-registry.ts is updated to append the namespace prefix.
"""

from __future__ import annotations

import json
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import pdfplumber
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

# ─────────────────────────────────────────────────────────────
#  Paths
# ─────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent / "data"
LIBRARY_DATA   = BASE_DIR / "books.json"
CAFETERIA_DATA = BASE_DIR / "menu.pdf"
EVENTS_DATA    = BASE_DIR / "events.json"
HANDBOOK_DATA  = BASE_DIR / "handbook.json"

DAYS  = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
MEALS = ["breakfast", "lunch", "dinner"]

CACHE_TTL_SECONDS = 60
_menu_cache: dict[str, Any] | None = None
_cache_timestamp: float = 0.0

# ─────────────────────────────────────────────────────────────
#  App setup
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="Unified Campus MCP Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class InvokeRequest(BaseModel):
    input: dict[str, Any] = Field(default_factory=dict)


class InvokeResponse(BaseModel):
    result: Any | None = None
    error: str | None = None


# ═════════════════════════════════════════════════════════════
#  LIBRARY
# ═════════════════════════════════════════════════════════════
LIBRARY_TOOLS: list[dict[str, Any]] = [
    {
        "name": "search_book",
        "description": "Search the library catalog by title, author, or subject keyword and return matching books with availability.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search term (title, author, or subject)"}
            },
            "required": ["query"],
        },
    },
    {
        "name": "check_availability",
        "description": "Check how many copies of a specific book are available by book ID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "book_id": {"type": "string", "description": "The unique book ID (e.g. bk-001)"}
            },
            "required": ["book_id"],
        },
    },
]


def _load_books() -> list[dict[str, Any]]:
    with LIBRARY_DATA.open(encoding="utf-8") as f:
        return json.load(f)


def _search_book(query: str) -> list[dict[str, Any]]:
    q = query.strip().lower()
    results = []
    for book in _load_books():
        haystack = " ".join([book["title"], book["author"], " ".join(book.get("subjects", [])), book.get("isbn", "")]).lower()
        if q in haystack:
            results.append({"id": book["id"], "title": book["title"], "author": book["author"],
                             "isbn": book["isbn"], "available_copies": book["available_copies"],
                             "total_copies": book["total_copies"], "location": book["location"]})
    return results


def _check_availability(book_id: str) -> dict[str, Any] | None:
    for book in _load_books():
        if book["id"] == book_id:
            return {"id": book["id"], "title": book["title"],
                    "available_copies": book["available_copies"], "total_copies": book["total_copies"]}
    return None


@app.get("/library/health")
def library_health() -> dict[str, str]:
    return {"status": "ok", "server": "library-server"}


@app.get("/library/tools")
def library_tools() -> list[dict[str, Any]]:
    return LIBRARY_TOOLS


@app.post("/library/invoke/{tool_name}", response_model=InvokeResponse)
def library_invoke(tool_name: str, body: InvokeRequest) -> InvokeResponse:
    try:
        if tool_name == "search_book":
            query = body.input.get("query", "")
            if not isinstance(query, str) or not query.strip():
                return InvokeResponse(error="Missing or invalid 'query' parameter.")
            return InvokeResponse(result=_search_book(query))
        if tool_name == "check_availability":
            book_id = body.input.get("book_id", "")
            if not isinstance(book_id, str) or not book_id.strip():
                return InvokeResponse(error="Missing or invalid 'book_id' parameter.")
            book = _check_availability(book_id)
            if book is None:
                return InvokeResponse(error=f"No book found with id '{book_id}'.")
            return InvokeResponse(result=book)
        return InvokeResponse(error=f"Unknown tool: {tool_name}")
    except Exception as exc:  # noqa: BLE001
        return InvokeResponse(error=str(exc))


# ═════════════════════════════════════════════════════════════
#  CAFETERIA
# ═════════════════════════════════════════════════════════════
WEEKLY_MENU: dict[str, dict[str, list[str]]] = {
    "monday":    {"breakfast": ["Scrambled Eggs", "Oatmeal (vegan)", "Fresh Fruit", "Coffee & Tea"],
                  "lunch":     ["Grilled Chicken Sandwich", "Caesar Salad (vegan)", "Tomato Soup", "Iced Tea"],
                  "dinner":    ["Spaghetti Bolognese", "Margherita Pizza (vegan)", "Garlic Bread", "Brownies"]},
    "tuesday":   {"breakfast": ["Pancakes", "Yogurt Parfait", "Banana Smoothie (vegan)", "Orange Juice"],
                  "lunch":     ["Burrito Bowl (vegan)", "Chicken Quesadilla", "Nachos", "Lemonade"],
                  "dinner":    ["Butter Chicken", "Dal Tadka (jain)", "Naan", "Basmati Rice", "Gulab Jamun"]},
    "wednesday": {"breakfast": ["French Toast", "Granola (gluten-free)", "Mixed Berries", "Hot Chocolate"],
                  "lunch":     ["Club Sandwich", "Minestrone Soup (vegan)", "Chips", "Soft Drinks"],
                  "dinner":    ["Grilled Salmon", "Steamed Vegetables (vegan)", "Mashed Potatoes", "Cheesecake"]},
    "thursday":  {"breakfast": ["Bagels with Cream Cheese", "Fruit Salad (vegan)", "Cereal Bar", "Apple Juice"],
                  "lunch":     ["Pad Thai (vegan)", "Spring Rolls", "Thai Iced Tea", "Mango Sticky Rice"],
                  "dinner":    ["Beef Stroganoff", "Garden Salad", "Dinner Rolls", "Apple Pie (gluten-free)"]},
    "friday":    {"breakfast": ["Eggs Benedict", "Avocado Toast (vegan)", "Hash Browns", "Fresh Juice"],
                  "lunch":     ["Fish and Chips", "Coleslaw", "Pea Soup", "Water"],
                  "dinner":    ["BBQ Ribs", "Corn on the Cob", "Baked Beans (vegan)", "Ice Cream Sundae"]},
    "saturday":  {"breakfast": ["Waffles", "Sausage Links", "Maple Syrup", "Milk"],
                  "lunch":     ["Margherita Panini (vegan)", "Pasta Salad", "Garlic Knots", "Sparkling Water"],
                  "dinner":    ["Sushi Platter", "Miso Soup (vegan)", "Edamame", "Green Tea Ice Cream"]},
    "sunday":    {"breakfast": ["Continental Breakfast", "Croissants", "Jam & Butter", "Herbal Tea (vegan)"],
                  "lunch":     ["Roast Chicken", "Roasted Potatoes", "Green Beans", "Gravy"],
                  "dinner":    ["Vegetable Lasagna (vegan)", "Garlic Bread", "Caesar Side Salad", "Tiramisu"]},
}

CAFETERIA_TOOLS: list[dict[str, Any]] = [
    {
        "name": "get_menu",
        "description": "Get the cafeteria menu for a specific day of the week. Returns breakfast, lunch, and dinner items.",
        "input_schema": {
            "type": "object",
            "properties": {"day": {"type": "string", "description": 'Day of week (monday–sunday) or "today"'}},
            "required": ["day"],
        },
    },
    {
        "name": "check_dietary_item",
        "description": "Search all days and meals for items matching a dietary tag (vegan, jain, gluten-free) or food keyword.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": 'Dietary tag or keyword (e.g. "vegan", "pasta")'}},
            "required": ["query"],
        },
    },
]


def _generate_menu_pdf() -> None:
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(str(CAFETERIA_DATA), pagesize=letter)
    story: list[Any] = []
    story.append(Paragraph("Campus Cafeteria — Weekly Menu", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Dietary tags: (vegan) (jain) (gluten-free)", styles["Normal"]))
    story.append(Spacer(1, 16))
    for day in DAYS:
        story.append(Paragraph(f"=== {day.upper()} ===", styles["Heading2"]))
        for meal in MEALS:
            items = WEEKLY_MENU[day][meal]
            story.append(Paragraph(f"{meal.capitalize()}: {', '.join(items)}", styles["Normal"]))
        story.append(Spacer(1, 8))
    table_data = [["Day", "Breakfast", "Lunch", "Dinner"]]
    for day in DAYS:
        row = [day.capitalize()] + ["; ".join(WEEKLY_MENU[day][meal]) for meal in MEALS]
        table_data.append(row)
    table = Table(table_data, colWidths=[70, 150, 150, 150])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2D5016")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.extend([Spacer(1, 20), Paragraph("Summary Table", styles["Heading2"]), table])
    doc.build(story)


def _parse_menu_from_pdf() -> dict[str, dict[str, list[str]]]:
    menu: dict[str, dict[str, list[str]]] = {day: {meal: [] for meal in MEALS} for day in DAYS}
    with pdfplumber.open(CAFETERIA_DATA) as pdf:
        full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    day_pattern  = re.compile(r"===\s*(\w+)\s*===", re.IGNORECASE)
    meal_pattern = re.compile(r"^(Breakfast|Lunch|Dinner):\s*(.+)$", re.IGNORECASE | re.MULTILINE)
    current_day: str | None = None
    for line in full_text.splitlines():
        day_match = day_pattern.search(line)
        if day_match:
            d = day_match.group(1).lower()
            if d in menu:
                current_day = d
            continue
        meal_match = meal_pattern.match(line.strip())
        if meal_match and current_day:
            meal_name = meal_match.group(1).lower()
            items = [i.strip() for i in meal_match.group(2).split(",") if i.strip()]
            menu[current_day][meal_name] = items
    parsed_any = any(any(v for v in d.values()) for d in menu.values())
    if not parsed_any:
        return {day: {meal: list(items) for meal, items in meals.items()} for day, meals in WEEKLY_MENU.items()}
    return menu


def _get_parsed_menu() -> dict[str, dict[str, list[str]]]:
    global _menu_cache, _cache_timestamp
    now = time.time()
    if _menu_cache is not None and (now - _cache_timestamp) < CACHE_TTL_SECONDS:
        return _menu_cache
    if not CAFETERIA_DATA.exists():
        _generate_menu_pdf()
    _menu_cache = _parse_menu_from_pdf()
    _cache_timestamp = now
    return _menu_cache


def _resolve_day(day: str) -> str | None:
    d = day.strip().lower()
    if d == "today":
        return DAYS[datetime.now().weekday()]
    return d if d in DAYS else None


def _get_menu(day: str) -> dict[str, Any] | None:
    resolved = _resolve_day(day)
    if resolved is None:
        return None
    menu = _get_parsed_menu()
    day_menu = menu.get(resolved, {})
    return {"day": resolved, "breakfast": day_menu.get("breakfast", []),
            "lunch": day_menu.get("lunch", []), "dinner": day_menu.get("dinner", [])}


def _check_dietary_item(query: str) -> list[dict[str, Any]]:
    q = query.strip().lower()
    menu = _get_parsed_menu()
    return [{"day": day, "meal": meal, "item": item}
            for day, meals in menu.items()
            for meal, items in meals.items()
            for item in items if q in item.lower()]


@app.on_event("startup")
def cafeteria_startup() -> None:
    if not CAFETERIA_DATA.exists():
        _generate_menu_pdf()
    _get_parsed_menu()


@app.get("/cafeteria/health")
def cafeteria_health() -> dict[str, str]:
    return {"status": "ok", "server": "cafeteria-server"}


@app.get("/cafeteria/tools")
def cafeteria_tools() -> list[dict[str, Any]]:
    return CAFETERIA_TOOLS


@app.post("/cafeteria/invoke/{tool_name}", response_model=InvokeResponse)
def cafeteria_invoke(tool_name: str, body: InvokeRequest) -> InvokeResponse:
    try:
        if tool_name == "get_menu":
            day = body.input.get("day", "")
            if not isinstance(day, str) or not day.strip():
                return InvokeResponse(error="Missing or invalid 'day' parameter.")
            menu = _get_menu(day)
            if menu is None:
                return InvokeResponse(error=f"Invalid day '{day}'. Use monday–sunday or 'today'.")
            return InvokeResponse(result=menu)
        if tool_name == "check_dietary_item":
            query = body.input.get("query", "")
            if not isinstance(query, str) or not query.strip():
                return InvokeResponse(error="Missing or invalid 'query' parameter.")
            return InvokeResponse(result=_check_dietary_item(query))
        return InvokeResponse(error=f"Unknown tool: {tool_name}")
    except Exception as exc:  # noqa: BLE001
        return InvokeResponse(error=str(exc))


# ═════════════════════════════════════════════════════════════
#  EVENTS
# ═════════════════════════════════════════════════════════════
EVENTS_TOOLS: list[dict[str, Any]] = [
    {
        "name": "get_upcoming_events",
        "description": "Get club events happening within the next N days, sorted by start time.",
        "input_schema": {
            "type": "object",
            "properties": {"days_ahead": {"type": "number", "description": "Number of days ahead to look (default 7)"}},
            "required": [],
        },
    },
    {
        "name": "search_event",
        "description": "Fuzzy search club events by title, club name, or description.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "Search term for event title, club, or description"}},
            "required": ["query"],
        },
    },
]


def _load_events() -> list[dict[str, Any]]:
    with EVENTS_DATA.open(encoding="utf-8") as f:
        return json.load(f)


def _get_upcoming_events(days_ahead: int = 7) -> list[dict[str, Any]]:
    now = datetime.now()
    window_end = now + timedelta(days=days_ahead)
    upcoming = [e for e in _load_events() if now <= datetime.fromisoformat(e["start_time"]) <= window_end]
    upcoming.sort(key=lambda e: e["start_time"])
    return upcoming


def _search_event(query: str) -> list[dict[str, Any]]:
    q = query.strip().lower()
    results = [e for e in _load_events()
               if q in " ".join([e["title"], e["club"], e.get("description", "")]).lower()]
    results.sort(key=lambda e: e["start_time"])
    return results


@app.get("/events/health")
def events_health() -> dict[str, str]:
    return {"status": "ok", "server": "events-server"}


@app.get("/events/tools")
def events_tools() -> list[dict[str, Any]]:
    return EVENTS_TOOLS


@app.post("/events/invoke/{tool_name}", response_model=InvokeResponse)
def events_invoke(tool_name: str, body: InvokeRequest) -> InvokeResponse:
    try:
        if tool_name == "get_upcoming_events":
            days_ahead = body.input.get("days_ahead", 7)
            if not isinstance(days_ahead, (int, float)):
                return InvokeResponse(error="Invalid 'days_ahead' parameter.")
            return InvokeResponse(result=_get_upcoming_events(int(days_ahead)))
        if tool_name == "search_event":
            query = body.input.get("query", "")
            if not isinstance(query, str) or not query.strip():
                return InvokeResponse(error="Missing or invalid 'query' parameter.")
            return InvokeResponse(result=_search_event(query))
        return InvokeResponse(error=f"Unknown tool: {tool_name}")
    except Exception as exc:  # noqa: BLE001
        return InvokeResponse(error=str(exc))


# ═════════════════════════════════════════════════════════════
#  HANDBOOK
# ═════════════════════════════════════════════════════════════
HANDBOOK_TOOLS: list[dict[str, Any]] = [
    {
        "name": "search_handbook",
        "description": "Search the academic handbook for policy details on grading, attendance, course withdrawal, drop/add periods, honors, and academic integrity.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "Keyword to search for in handbook policies"}},
            "required": ["query"],
        },
    }
]


def _load_handbook() -> list[dict[str, str]]:
    if not HANDBOOK_DATA.exists():
        return []
    with HANDBOOK_DATA.open(encoding="utf-8") as f:
        return json.load(f)


def _search_handbook(query: str) -> list[dict[str, str]]:
    q = query.strip().lower()
    return [s for s in _load_handbook() if q in f"{s['section']} {s['text']}".lower()]


@app.get("/handbook/health")
def handbook_health() -> dict[str, str]:
    return {"status": "ok", "server": "handbook-server"}


@app.get("/handbook/tools")
def handbook_tools() -> list[dict[str, Any]]:
    return HANDBOOK_TOOLS


@app.post("/handbook/invoke/{tool_name}", response_model=InvokeResponse)
def handbook_invoke(tool_name: str, body: InvokeRequest) -> InvokeResponse:
    try:
        if tool_name == "search_handbook":
            query = body.input.get("query", "")
            if not isinstance(query, str) or not query.strip():
                return InvokeResponse(error="Missing or invalid 'query' parameter.")
            return InvokeResponse(result=_search_handbook(query))
        return InvokeResponse(error=f"Unknown tool: {tool_name}")
    except Exception as exc:
        return InvokeResponse(error=str(exc))


# ─────────────────────────────────────────────────────────────
#  Root health check
# ─────────────────────────────────────────────────────────────
@app.get("/health")
def root_health() -> dict[str, str]:
    return {"status": "ok", "server": "unified-campus-server"}
