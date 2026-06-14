"""Club Events / Calendar MCP Server — port 8003."""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

SERVER_NAME = "events-server"
DATA_PATH = Path(__file__).parent / "data" / "events.json"

app = FastAPI(title="Club Events MCP Server")
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
        "name": "get_upcoming_events",
        "description": (
            "Get club events happening within the next N days, sorted by start time."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "days_ahead": {
                    "type": "number",
                    "description": "Number of days ahead to look (default 7)",
                }
            },
            "required": [],
        },
    },
    {
        "name": "search_event",
        "description": "Fuzzy search club events by title, club name, or description.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search term for event title, club, or description",
                }
            },
            "required": ["query"],
        },
    },
]


def _load_events() -> list[dict[str, Any]]:
    with DATA_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def _parse_iso(dt_str: str) -> datetime:
    return datetime.fromisoformat(dt_str)


def _get_upcoming_events(days_ahead: int = 7) -> list[dict[str, Any]]:
    now = datetime.now()
    window_end = now + timedelta(days=days_ahead)

    upcoming: list[dict[str, Any]] = []
    for event in _load_events():
        start = _parse_iso(event["start_time"])
        if now <= start <= window_end:
            upcoming.append(event)

    upcoming.sort(key=lambda e: e["start_time"])
    return upcoming


def _search_event(query: str) -> list[dict[str, Any]]:
    q = query.strip().lower()
    if not q:
        return []

    results: list[dict[str, Any]] = []
    for event in _load_events():
        haystack = " ".join(
            [event["title"], event["club"], event.get("description", "")]
        ).lower()
        if q in haystack:
            results.append(event)

    results.sort(key=lambda e: e["start_time"])
    return results


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "server": SERVER_NAME}


@app.get("/tools")
def get_tools() -> list[dict[str, Any]]:
    return TOOLS


@app.post("/invoke/{tool_name}", response_model=InvokeResponse)
def invoke_tool(tool_name: str, body: InvokeRequest) -> InvokeResponse:
    try:
        if tool_name == "get_upcoming_events":
            days_ahead = body.input.get("days_ahead", 7)
            if not isinstance(days_ahead, (int, float)):
                return InvokeResponse(result=None, error="Invalid 'days_ahead' parameter.")
            days_ahead = int(days_ahead)
            if days_ahead < 0:
                return InvokeResponse(result=None, error="'days_ahead' must be non-negative.")
            return InvokeResponse(result=_get_upcoming_events(days_ahead))

        if tool_name == "search_event":
            query = body.input.get("query", "")
            if not isinstance(query, str) or not query.strip():
                return InvokeResponse(result=None, error="Missing or invalid 'query' parameter.")
            return InvokeResponse(result=_search_event(query))

        return InvokeResponse(result=None, error=f"Unknown tool: {tool_name}")
    except Exception as exc:  # noqa: BLE001
        return InvokeResponse(result=None, error=str(exc))
