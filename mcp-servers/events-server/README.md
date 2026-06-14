# Club Events MCP Server

Independent MCP-style server for campus club events. Queries `data/events.json` live on every request.

**Port:** 8003

## Tools

| Tool | Description |
|------|-------------|
| `get_upcoming_events` | Events within the next N days (default 7), sorted by start time |
| `search_event` | Fuzzy search by title, club, or description |

## Run

```bash
pip install -r requirements.txt
uvicorn main:app --port 8003
```

## Test

```bash
curl http://localhost:8003/health
curl http://localhost:8003/tools
curl -X POST http://localhost:8003/invoke/get_upcoming_events \
  -H "Content-Type: application/json" \
  -d '{"input": {"days_ahead": 7}}'
curl -X POST http://localhost:8003/invoke/search_event \
  -H "Content-Type: application/json" \
  -d '{"input": {"query": "hackathon"}}'
```
