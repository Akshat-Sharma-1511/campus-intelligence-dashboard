<USER_REQUEST>
# HANDOFF PROMPT — Campus Intelligence Dashboard (Phase 3 → 6)
# For: Antigravity AI Coding Assistant
# Project: MARS Open Projects 2026 — Web Dev Problem Statement 1

---

## 0. YOUR ROLE & CONTEXT

You are picking up an in-progress full-stack project as a Principal Full-Stack
Architect. Phases 1 and 2 are already complete and verified. Your job is to
execute Phases 3 through 6 to produce a submission-ready, bug-free project.

Read this entire prompt before writing a single line of code. After reading,
confirm your understanding of what's already built and what you need to build
next, then begin Phase 3 only. Stop and wait for my confirmation between
each phase. Do not skip ahead. Do not declare a phase done if there are
errors, type issues, or console warnings.

---

## 1. WHAT THIS PROJECT IS

A "Unified Campus Intelligence Dashboard with AI Assistant" — a submission for
the MARS Open Projects 2026 Web Development Problem Statement 1.

**Non-negotiable hard constraints from the official problem statement:**
1. Independent MCP (Model Context Protocol) Servers for distinct campus data
   sources — library, cafeteria, club events (and optionally academic handbook).
2. AI Assistant dynamically routes natural-language queries to the correct
   MCP server(s) in real time, including queries needing MULTIPLE servers.
3. Unified dashboard UI surfaces results from multiple sources in one view.
4. NO single giant database — each MCP server owns and queries its own
   independent data source live on every request.
5. (Optional) Authentication / personalization for students.

---

## 2. WHAT IS ALREADY BUILT (Phases 1 & 2 — DO NOT REBUILD)

### Phase 1 — Complete
- Full repo structure exists (see Section 3 below)
- Three FastAPI MCP servers, each in its own `.venv`, each independently
  runnable:
  - `library-server` on port 8001 — serves `books.json`, tools:
    `search_book(query)` and `check_availability(book_id)`
  - `cafeteria-server` on por
<truncated 18292 bytes>
/mcp-registry.ts`.
2. Confirm `route.ts` orchestrator already handles multiple servers correctly
   (it should — the logic is server-agnostic). If any changes are needed,
   make them minimally.
3. Build `ResultCards/LibraryCard.tsx`, `MenuCard.tsx`, `EventCard.tsx` per
   Section 7.
4. Rebuild `app/page.tsx` into the two-pane dashboard layout per Section 7,
   wiring `message.toolInvocations` to the Results pane.
5. Extend `ChatInterface.tsx` with tool-call chips and improved message
   bubbles per Section 7.
6. Test edge cases 1, 2, 3, and 5 from Section 8. Report results.
7. STOP. Wait for my "go".

**Phase 4:**
1. Implement fetch timeouts and graceful error handling throughout `route.ts`
   and `tool-router.ts` (if not already fully done in Phase 2).
2. Build `ServerStatusPanel.tsx` with 10-second health polling per Section 7.
3. Run ALL SIX edge cases from Section 8 including manually killing the
   cafeteria server (edge case 4) and concurrent messages (edge case 6).
4. Final visual polish pass — verify the UI matches the dark-mode design
   spec in Section 7, no generic Tailwind defaults.
5. Report all 6 edge case results explicitly.
6. STOP. Wait for my "go".

**Phase 5 (only if Phases 3-4 complete cleanly):**
Build handbook-server, register it, add HandbookCard, re-run all 7 edge
cases. STOP. Wait for my "go".

**Phase 6:**
Write all documentation per Section 10. Produce the final compliance
checklist. STOP. Report completion.

---

Begin now: read this prompt fully, confirm your understanding of what is
already built vs what you need to build, and start Phase 3.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-06-14T13:06:22+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Claude Sonnet 4.6 (Thinking). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>