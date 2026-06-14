# Compliance Checklist

This checklist documents the project's compliance with the official **MARS Open Projects 2026 Web Development Problem Statement 1** requirements.

## 1. System Constraints & Compliance Status

| ID | Requirement | Implementation Detail | Status |
| :--- | :--- | :--- | :--- |
| **C-1** | **Independent MCP Servers** | Implemented 4 independent FastAPI servers: library (8001), cafeteria (8002), events (8003), and handbook (8004). Each has separate configurations and runs in its own python context. | **COMPLIANT** ✅ |
| **C-2** | **Dynamic AI Routing** | Next.js API orchestrator queries all tool schemas in parallel and utilizes Groq (Llama-3.3-70b) to route queries to the correct server(s), supporting multi-server queries in a single turn. | **COMPLIANT** ✅ |
| **C-3** | **Unified Dashboard UI** | Built a responsive, premium two-pane layout. The left pane hosts the Chat Interface with tool-call status chips. The right pane displays a Live Results panel with custom cards for each system. | **COMPLIANT** ✅ |
| **C-4** | **No Single Centralized Database** | Each MCP server is completely decoupled. Library and events load JSON files directly, cafeteria parses `menu.pdf` on-the-fly, and handbook queries a dedicated local policy store. | **COMPLIANT** ✅ |
| **C-5** | **Robust Timeout & Error Handling** | Implemented 3-second tool discovery and 5-second execution timeouts. Offline servers are gracefully ignored and flagged to the LLM so it informs the user rather than failing. | **COMPLIANT** ✅ |
| **C-6** | **Live Health Polling** | The `ServerStatusPanel` checks `/health` endpoints of all registered servers every 10 seconds, calculating round-trip latency and updating status indicators in real time. | **COMPLIANT** ✅ |

---

## 2. Verified Edge Cases Checklist

- [x] **Edge Case 1: Single-System Query** — Tested *"Is Clean Code available?"* -> Library search tool executed and results cards rendered.
- [x] **Edge Case 2: Multi-System Query** — Tested *"What's happening this weekend & anything vegan?"* -> Dispatched events and cafeteria tools in parallel in one turn.
- [x] **Edge Case 3: Empty Results Fallback** — Tested query with no results -> Assistant handles empty lists gracefully without hallucinations.
- [x] **Edge Case 4: Graceful Degradation** — Simulated offline server (killed cafeteria server) -> Other systems continued to operate, and the assistant politely explained the cafeteria system was down.
- [x] **Edge Case 5: Broad Unified Query** — Tested *"Show me everything for today"* -> Triggered and rendered today's menu and events.
- [x] **Edge Case 6: Concurrent Queue Safety** — Validated that submit buttons and textareas are disabled during pending streams to prevent message collisions.
- [x] **Edge Case 7: Quad-System Routing** — Tested query invoking library, cafeteria, events, and handbook in a single turn -> All 4 tools triggered and loaded cards successfully.
