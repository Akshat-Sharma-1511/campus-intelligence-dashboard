# Library Portal MCP Server

Independent MCP-style server for the campus library catalog. Queries `data/books.json` live on every request.

**Port:** 8001

## Tools

| Tool | Description |
|------|-------------|
| `search_book` | Search by title, author, or subject keyword |
| `check_availability` | Check copy availability by book ID |

## Run

```bash
pip install -r requirements.txt
uvicorn main:app --port 8001
```

## Test

```bash
curl http://localhost:8001/health
curl http://localhost:8001/tools
curl -X POST http://localhost:8001/invoke/search_book \
  -H "Content-Type: application/json" \
  -d '{"input": {"query": "Clean Code"}}'
```
