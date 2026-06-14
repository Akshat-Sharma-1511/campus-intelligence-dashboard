/**
 * Phase 2 integration test — verifies MCP tool discovery + invoke chain.
 * Run with library-server on port 8001:
 *   node scripts/test-tool-router.mjs
 */
const LIBRARY_URL = "http://localhost:8001";

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log("1. Health check...");
  const health = await fetchWithTimeout(`${LIBRARY_URL}/health`, {}, 3000);
  if (!health.ok) throw new Error("Library server not reachable");
  console.log("   OK:", await health.json());

  console.log("2. Tool discovery (GET /tools)...");
  const toolsRes = await fetchWithTimeout(`${LIBRARY_URL}/tools`, {}, 3000);
  const tools = await toolsRes.json();
  console.log(`   Found ${tools.length} tools:`, tools.map((t) => t.name).join(", "));
  if (tools.length !== 2) throw new Error("Expected 2 library tools");

  console.log("3. Tool invoke (search_book)...");
  const invokeRes = await fetchWithTimeout(
    `${LIBRARY_URL}/invoke/search_book`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { query: "Clean Code" } }),
    },
    5000
  );
  const invokeBody = await invokeRes.json();
  if (invokeBody.error) throw new Error(invokeBody.error);
  if (!invokeBody.result?.length) throw new Error("No books returned");
  console.log("   OK:", invokeBody.result[0].title, "—", invokeBody.result[0].available_copies, "copies available");

  console.log("4. No-result query...");
  const noResult = await fetchWithTimeout(
    `${LIBRARY_URL}/invoke/search_book`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { query: "Nonexistent Book XYZ" } }),
    },
    5000
  );
  const noResultBody = await noResult.json();
  if (noResultBody.result.length !== 0) throw new Error("Expected empty result");
  console.log("   OK: empty array for unknown book");

  console.log("\nAll Phase 2 MCP integration checks passed.");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
