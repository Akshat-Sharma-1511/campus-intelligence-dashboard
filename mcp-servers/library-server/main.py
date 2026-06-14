"""Library Portal MCP Server — port 8001."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

SERVER_NAME = "library-server"
DATA_PATH = Path(__file__).parent / "data" / "books.json"

app = FastAPI(title="Library Portal MCP Server")
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
        "name": "search_book",
        "description": (
            "Search the library catalog by title, author, or subject keyword "
            "and return matching books with availability."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search term (title, author, or subject)",
                }
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
                "book_id": {
                    "type": "string",
                    "description": "The unique book ID (e.g. bk-001)",
                }
            },
            "required": ["book_id"],
        },
    },
]


def _load_books() -> list[dict[str, Any]]:
    with DATA_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def _search_book(query: str) -> list[dict[str, Any]]:
    q = query.strip().lower()
    if not q:
        return []

    results: list[dict[str, Any]] = []
    for book in _load_books():
        haystack = " ".join(
            [
                book["title"],
                book["author"],
                " ".join(book.get("subjects", [])),
                book.get("isbn", ""),
            ]
        ).lower()
        if q in haystack:
            results.append(
                {
                    "id": book["id"],
                    "title": book["title"],
                    "author": book["author"],
                    "isbn": book["isbn"],
                    "available_copies": book["available_copies"],
                    "total_copies": book["total_copies"],
                    "location": book["location"],
                }
            )
    return results


def _check_availability(book_id: str) -> dict[str, Any] | None:
    for book in _load_books():
        if book["id"] == book_id:
            return {
                "id": book["id"],
                "title": book["title"],
                "available_copies": book["available_copies"],
                "total_copies": book["total_copies"],
            }
    return None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "server": SERVER_NAME}


@app.get("/tools")
def get_tools() -> list[dict[str, Any]]:
    return TOOLS


@app.post("/invoke/{tool_name}", response_model=InvokeResponse)
def invoke_tool(tool_name: str, body: InvokeRequest) -> InvokeResponse:
    try:
        if tool_name == "search_book":
            query = body.input.get("query", "")
            if not isinstance(query, str) or not query.strip():
                return InvokeResponse(result=None, error="Missing or invalid 'query' parameter.")
            return InvokeResponse(result=_search_book(query))

        if tool_name == "check_availability":
            book_id = body.input.get("book_id", "")
            if not isinstance(book_id, str) or not book_id.strip():
                return InvokeResponse(result=None, error="Missing or invalid 'book_id' parameter.")
            book = _check_availability(book_id)
            if book is None:
                return InvokeResponse(result=None, error=f"No book found with id '{book_id}'.")
            return InvokeResponse(result=book)

        return InvokeResponse(result=None, error=f"Unknown tool: {tool_name}")
    except Exception as exc:  # noqa: BLE001 — return structured errors to LLM
        return InvokeResponse(result=None, error=str(exc))
