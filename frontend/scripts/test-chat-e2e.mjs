/**
 * E2E test: POST /api/chat and verify search_book tool fires.
 * Requires: library-server on :8001, Next.js on :3000, GROQ_API_KEY in .env.local
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const CHAT_URL = "http://localhost:3000/api/chat";

async function main() {
  console.log("Posting library question to /api/chat...");

  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: "Is Clean Code available in the library?",
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Chat API returned ${response.status}: ${err}`);
  }

  const body = await response.text();
  const toolCalls = [];
  const toolResults = [];

  for (const line of body.split("\n")) {
    if (line.startsWith("9:")) {
      try {
        const data = JSON.parse(line.slice(2));
        if (data.toolName) toolCalls.push(data.toolName);
      } catch {
        /* skip malformed */
      }
    }
    if (line.startsWith("a:")) {
      try {
        const data = JSON.parse(line.slice(2));
        toolResults.push(data);
      } catch {
        /* skip malformed */
      }
    }
  }

  console.log("Tool calls in stream:", toolCalls.length ? toolCalls.join(", ") : "(none parsed)");
  console.log("Tool results in stream:", toolResults.length);

  if (!toolCalls.includes("search_book")) {
    throw new Error(
      `Expected search_book tool call in stream. Raw response (first 2000 chars):\n${body.slice(0, 2000)}`
    );
  }

  const hasCleanCode = body.toLowerCase().includes("clean code");
  console.log("Response mentions Clean Code:", hasCleanCode);
  console.log("\nE2E test passed — search_book fired correctly via Groq.");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
