import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { authEnabled } from "@/lib/auth-config";

const AGENT_API_URL =
  process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000";

// ── In-memory rate limiter fallback ───────────────────────────────────
// Use this fallback when a production-grade limiter is unavailable. This keeps
// local/dev mode safe while avoiding hard runtime failures.
const useFallbackRateLimit = true;

// Fallback in-memory rate limiter when UNKEY_ROOT_KEY is not set
const fallbackMap = new Map<string, { start: number; count: number }>();

/**
 * Proxies chat requests to the Python agent backend.
 * - Requires WorkOS authentication when auth is enabled
 * - Rate-limited locally (10 req/hour per user)
 * - Streams SSE responses back to the client
 */
export async function POST(req: NextRequest) {
  // Local/dev mode can bypass auth via DEV_AUTH_ENABLED=true.
  let userId = "dev-user";
  if (authEnabled) {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  }

  // ── Rate limit check ──────────────────────────────────────────
  // Keep requests bounded while avoiding hard failures from external providers.
  if (useFallbackRateLimit) {
    const now = Date.now();
    const window = fallbackMap.get(userId);
    if (window && now - window.start < 3_600_000 && window.count >= 10) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 10 requests per hour." },
        { status: 429 },
      );
    }
    if (!window || now - window.start >= 3_600_000) {
      fallbackMap.set(userId, { start: now, count: 1 });
    } else {
      window.count++;
    }
  }

  try {
    const body = await req.json();

    // Forward to agent backend
    const agentRes = await fetch(`${AGENT_API_URL}/api/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        user_id: userId,
      }),
    });

    if (!agentRes.ok || !agentRes.body) {
      return NextResponse.json(
        { error: "Agent backend error" },
        { status: agentRes.status },
      );
    }

    // Stream SSE response back
    return new Response(agentRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
