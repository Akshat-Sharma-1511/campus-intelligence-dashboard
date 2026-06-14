# Architecture Sequence Diagram

The diagram below illustrates the unified end-to-end data flow when a user queries the Campus Intelligence Dashboard.

```mermaid
sequenceDiagram
    autonumber
    actor User as Student (Browser)
    participant UI as Next.js UI (Chat + Results)
    participant API as /api/chat Orchestrator
    participant MCP as MCP Servers (FastAPI)
    participant DB as Data Sources (JSON / PDF)

    %% Health Polling Loop
    loop Every 10 Seconds
        UI->>MCP: GET /health (Library, Cafeteria, Events, Handbook)
        MCP-->>UI: Return Health status + latency (latency ms)
        Note over UI: ServerStatusPanel updates status dots dynamically
    end

    %% Chat & Query Flow
    User->>UI: Submit query: "Is there vegan food and what events are on?"
    UI->>API: POST /api/chat (Messages Array)
    
    rect rgb(30, 41, 59)
        Note over API: 1. Tool discovery
        API->>MCP: GET /tools (in parallel, 3s timeout)
        MCP-->>API: Return tool schemas (search_book, check_dietary_item, etc.)
    end

    rect rgb(30, 41, 59)
        Note over API: 2. Routing Decision
        API->>Groq LLM: Send Query + Tool definitions
        Groq LLM-->>API: Return toolCalls: [check_dietary_item, get_upcoming_events]
    end

    rect rgb(30, 41, 59)
        Note over API: 3. Live Tool Execution
        API->>MCP: POST /invoke/check_dietary_item (CORS)
        MCP->>DB: Read & Parse menu.pdf
        DB-->>MCP: Parsed PDF text data
        MCP-->>API: Return dietary matches

        API->>MCP: POST /invoke/get_upcoming_events (CORS)
        MCP->>DB: Read events.json
        DB-->>MCP: Upcoming events array
        MCP-->>API: Return events list
    end

    rect rgb(30, 41, 59)
        Note over API: 4. Streaming Response
        API->>Groq LLM: Feed tool execution results
        Groq LLM-->>API: Return final conversational summary
        API-->>UI: Stream: tool calls, results, and text summary
    end

    Note over UI: Results Panel mounts MenuCard & EventCard;<br/>Chat Panel renders conversational text stream.
    UI-->>User: Display unified dashboard response
```
