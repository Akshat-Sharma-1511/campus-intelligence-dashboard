"""Academic Handbook MCP Server — port 8004."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

SERVER_NAME = "handbook-server"
DATA_PATH = Path(__file__).parent / "data" / "handbook.json"

app = FastAPI(title="Academic Handbook MCP Server")
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
        "name": "search_handbook",
        "description": (
            "Search the academic handbook for policy details on grading, "
            "attendance, course withdrawal, drop/add periods, honors, "
            "and academic integrity."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Keyword to search for in handbook policies",
                }
            },
            "required": ["query"],
        },
    }
]


def _load_handbook() -> list[dict[str, str]]:
    if not DATA_PATH.exists():
        return []
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _search_handbook(query: str) -> list[dict[str, str]]:
    q = query.strip().lower()
    if not q:
        return []

    results = []
    for section in _load_handbook():
        # Match query in section title or body text
        haystack = f"{section['section']} {section['text']}".lower()
        if q in haystack:
            results.append(section)
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
        if tool_name == "search_handbook":
            query = body.input.get("query", "")
            if not isinstance(query, str) or not query.strip():
                return InvokeResponse(result=None, error="Missing or invalid 'query' parameter.")
            return InvokeResponse(result=_search_handbook(query))

        return InvokeResponse(result=None, error=f"Unknown tool: {tool_name}")
    except Exception as exc:
        return InvokeResponse(result=None, error=str(exc))
