"""Cafeteria Menu MCP Server — port 8002."""

from __future__ import annotations

import re
import time
from datetime import datetime
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

SERVER_NAME = "cafeteria-server"
DATA_DIR = Path(__file__).parent / "data"
MENU_PDF_PATH = DATA_DIR / "menu.pdf"
CACHE_TTL_SECONDS = 60

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
MEALS = ["breakfast", "lunch", "dinner"]

# Weekly menu data used for PDF generation and as fallback structure
WEEKLY_MENU: dict[str, dict[str, list[str]]] = {
    "monday": {
        "breakfast": ["Scrambled Eggs", "Oatmeal (vegan)", "Fresh Fruit", "Coffee & Tea"],
        "lunch": ["Grilled Chicken Sandwich", "Caesar Salad (vegan)", "Tomato Soup", "Iced Tea"],
        "dinner": ["Spaghetti Bolognese", "Margherita Pizza (vegan)", "Garlic Bread", "Brownies"],
    },
    "tuesday": {
        "breakfast": ["Pancakes", "Yogurt Parfait", "Banana Smoothie (vegan)", "Orange Juice"],
        "lunch": ["Burrito Bowl (vegan)", "Chicken Quesadilla", "Nachos", "Lemonade"],
        "dinner": ["Butter Chicken", "Dal Tadka (jain)", "Naan", "Basmati Rice", "Gulab Jamun"],
    },
    "wednesday": {
        "breakfast": ["French Toast", "Granola (gluten-free)", "Mixed Berries", "Hot Chocolate"],
        "lunch": ["Club Sandwich", "Minestrone Soup (vegan)", "Chips", "Soft Drinks"],
        "dinner": ["Grilled Salmon", "Steamed Vegetables (vegan)", "Mashed Potatoes", "Cheesecake"],
    },
    "thursday": {
        "breakfast": ["Bagels with Cream Cheese", "Fruit Salad (vegan)", "Cereal Bar", "Apple Juice"],
        "lunch": ["Pad Thai (vegan)", "Spring Rolls", "Thai Iced Tea", "Mango Sticky Rice"],
        "dinner": ["Beef Stroganoff", "Garden Salad", "Dinner Rolls", "Apple Pie (gluten-free)"],
    },
    "friday": {
        "breakfast": ["Eggs Benedict", "Avocado Toast (vegan)", "Hash Browns", "Fresh Juice"],
        "lunch": ["Fish and Chips", "Coleslaw", "Pea Soup", "Water"],
        "dinner": ["BBQ Ribs", "Corn on the Cob", "Baked Beans (vegan)", "Ice Cream Sundae"],
    },
    "saturday": {
        "breakfast": ["Waffles", "Sausage Links", "Maple Syrup", "Milk"],
        "lunch": ["Margherita Panini (vegan)", "Pasta Salad", "Garlic Knots", "Sparkling Water"],
        "dinner": ["Sushi Platter", "Miso Soup (vegan)", "Edamame", "Green Tea Ice Cream"],
    },
    "sunday": {
        "breakfast": ["Continental Breakfast", "Croissants", "Jam & Butter", "Herbal Tea (vegan)"],
        "lunch": ["Roast Chicken", "Roasted Potatoes", "Green Beans", "Gravy"],
        "dinner": ["Vegetable Lasagna (vegan)", "Garlic Bread", "Caesar Side Salad", "Tiramisu"],
    },
}

_menu_cache: dict[str, Any] | None = None
_cache_timestamp: float = 0.0

app = FastAPI(title="Cafeteria Menu MCP Server")
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


TOOLS: list[dict[str, Any]] = [
    {
        "name": "get_menu",
        "description": (
            "Get the cafeteria menu for a specific day of the week. "
            "Returns breakfast, lunch, and dinner items."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "day": {
                    "type": "string",
                    "description": 'Day of week (monday–sunday) or "today"',
                }
            },
            "required": ["day"],
        },
    },
    {
        "name": "check_dietary_item",
        "description": (
            "Search all days and meals for items matching a dietary tag "
            "(vegan, jain, gluten-free) or food keyword."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": 'Dietary tag or keyword (e.g. "vegan", "pasta")',
                }
            },
            "required": ["query"],
        },
    },
]


def generate_menu_pdf() -> None:
    """Generate menu.pdf programmatically with a weekly menu table."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()

    doc = SimpleDocTemplate(str(MENU_PDF_PATH), pagesize=letter)
    story: list[Any] = []

    story.append(Paragraph("Campus Cafeteria — Weekly Menu", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(
        Paragraph(
            "Dietary tags: (vegan) (jain) (gluten-free)",
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 16))

    for day in DAYS:
        day_title = day.upper()
        story.append(Paragraph(f"=== {day_title} ===", styles["Heading2"]))
        for meal in MEALS:
            items = WEEKLY_MENU[day][meal]
            items_str = ", ".join(items)
            story.append(Paragraph(f"{meal.capitalize()}: {items_str}", styles["Normal"]))
        story.append(Spacer(1, 8))

    # Also add a summary table for visual structure
    table_data = [["Day", "Breakfast", "Lunch", "Dinner"]]
    for day in DAYS:
        row = [day.capitalize()]
        for meal in MEALS:
            row.append("; ".join(WEEKLY_MENU[day][meal]))
        table_data.append(row)

    table = Table(table_data, colWidths=[70, 150, 150, 150])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2D5016")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(Spacer(1, 20))
    story.append(Paragraph("Summary Table", styles["Heading2"]))
    story.append(table)

    doc.build(story)


def _parse_menu_from_pdf() -> dict[str, dict[str, list[str]]]:
    """Parse menu.pdf text into structured day → meal → items dict."""
    menu: dict[str, dict[str, list[str]]] = {day: {meal: [] for meal in MEALS} for day in DAYS}

    with pdfplumber.open(MENU_PDF_PATH) as pdf:
        full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)

    # Parse section headers like "=== MONDAY ===" followed by "Breakfast: item1, item2"
    day_pattern = re.compile(r"===\s*(\w+)\s*===", re.IGNORECASE)
    meal_pattern = re.compile(
        r"^(Breakfast|Lunch|Dinner):\s*(.+)$",
        re.IGNORECASE | re.MULTILINE,
    )

    current_day: str | None = None
    for line in full_text.splitlines():
        day_match = day_pattern.search(line)
        if day_match:
            day_name = day_match.group(1).lower()
            if day_name in menu:
                current_day = day_name
            continue

        meal_match = meal_pattern.match(line.strip())
        if meal_match and current_day:
            meal_name = meal_match.group(1).lower()
            items_raw = meal_match.group(2).strip()
            items = [item.strip() for item in items_raw.split(",") if item.strip()]
            menu[current_day][meal_name] = items

    # Validate parsing — fall back to WEEKLY_MENU if PDF parse yields empty data
    parsed_any = any(any(meal_items for meal_items in day_data.values()) for day_data in menu.values())
    if not parsed_any:
        return {day: {meal: list(items) for meal, items in meals.items()} for day, meals in WEEKLY_MENU.items()}

    return menu


def get_parsed_menu() -> dict[str, dict[str, list[str]]]:
    """Return parsed menu with 60-second TTL cache."""
    global _menu_cache, _cache_timestamp

    now = time.time()
    if _menu_cache is not None and (now - _cache_timestamp) < CACHE_TTL_SECONDS:
        return _menu_cache

    if not MENU_PDF_PATH.exists():
        generate_menu_pdf()

    _menu_cache = _parse_menu_from_pdf()
    _cache_timestamp = now
    return _menu_cache


def _resolve_day(day: str) -> str | None:
    d = day.strip().lower()
    if d == "today":
        return DAYS[datetime.now().weekday()]
    if d in DAYS:
        return d
    return None


def _get_menu(day: str) -> dict[str, Any] | None:
    resolved = _resolve_day(day)
    if resolved is None:
        return None

    menu = get_parsed_menu()
    day_menu = menu.get(resolved, {})
    return {
        "day": resolved,
        "breakfast": day_menu.get("breakfast", []),
        "lunch": day_menu.get("lunch", []),
        "dinner": day_menu.get("dinner", []),
    }


def _check_dietary_item(query: str) -> list[dict[str, Any]]:
    q = query.strip().lower()
    if not q:
        return []

    menu = get_parsed_menu()
    matches: list[dict[str, Any]] = []

    for day, meals in menu.items():
        for meal, items in meals.items():
            for item in items:
                if q in item.lower():
                    matches.append({"day": day, "meal": meal, "item": item})

    return matches


@app.on_event("startup")
def startup() -> None:
    generate_menu_pdf()
    parsed = get_parsed_menu()
    print("=== Cafeteria PDF parsed menu (startup verification) ===")
    for day, meals in parsed.items():
        print(f"  {day.upper()}:")
        for meal, items in meals.items():
            print(f"    {meal}: {items}")
    print("=== End parsed menu ===")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "server": SERVER_NAME}


@app.get("/tools")
def get_tools() -> list[dict[str, Any]]:
    return TOOLS


@app.post("/invoke/{tool_name}", response_model=InvokeResponse)
def invoke_tool(tool_name: str, body: InvokeRequest) -> InvokeResponse:
    try:
        if tool_name == "get_menu":
            day = body.input.get("day", "")
            if not isinstance(day, str) or not day.strip():
                return InvokeResponse(result=None, error="Missing or invalid 'day' parameter.")
            menu = _get_menu(day)
            if menu is None:
                return InvokeResponse(
                    result=None,
                    error=f"Invalid day '{day}'. Use monday–sunday or 'today'.",
                )
            return InvokeResponse(result=menu)

        if tool_name == "check_dietary_item":
            query = body.input.get("query", "")
            if not isinstance(query, str) or not query.strip():
                return InvokeResponse(result=None, error="Missing or invalid 'query' parameter.")
            return InvokeResponse(result=_check_dietary_item(query))

        return InvokeResponse(result=None, error=f"Unknown tool: {tool_name}")
    except Exception as exc:  # noqa: BLE001
        return InvokeResponse(result=None, error=str(exc))
