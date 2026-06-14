# Cafeteria Menu MCP Server

Independent MCP-style server for the campus cafeteria. Generates and parses `data/menu.pdf` live with a 60-second in-memory cache.

**Port:** 8002

## Tools

| Tool | Description |
|------|-------------|
| `get_menu` | Get breakfast/lunch/dinner for a day (monday–sunday or "today") |
| `check_dietary_item` | Search for vegan/jain/gluten-free items or food keywords |

## Run

```bash
pip install -r requirements.txt
uvicorn main:app --port 8002
```

On startup, the server generates `data/menu.pdf` and prints the parsed menu to stdout for verification.

## Test

```bash
curl http://localhost:8002/health
curl http://localhost:8002/tools
curl -X POST http://localhost:8002/invoke/get_menu \
  -H "Content-Type: application/json" \
  -d '{"input": {"day": "today"}}'
curl -X POST http://localhost:8002/invoke/check_dietary_item \
  -H "Content-Type: application/json" \
  -d '{"input": {"query": "vegan"}}'
```
