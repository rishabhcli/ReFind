import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { Unkey } from "@unkey/api";

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000";
const UNKEY_ROOT_KEY = process.env.UNKEY_ROOT_KEY;

// Initialize Unkey client if configured
const unkey = UNKEY_ROOT_KEY ? new Unkey({ rootKey: UNKEY_ROOT_KEY }) : null;

/**
 * Proxies chat requests to the Python agent backend.
 * - WorkOS authentication
 * - Unkey rate limiting (fallback: in-memory)
 * - SSE streaming
 */
export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────
  let userId = "dev-user";
  if (process.env.WORKOS_CLIENT_ID) {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  }

  // ── Rate Limiting (Unkey → fallback in-memory) ─────────
  if (unkey) {
    // Use Unkey ratelimit API
    try {
      const result = await unkey.ratelimit.limit({
        namespace: "refind.chat",
        identifier: userId,
        limit: 20,
        duration: 60000,
      });
      if (result && "success" in result && !result.success) {
        return NextResponse.json(
          { error: "Rate limit exceeded (Unkey). Try again shortly." },
          { status: 429 },
        );
      }
    } catch (err) {
      console.warn("[Unkey] Rate limit check failed, falling through:", err);
    }
  } else {
    // Fallback: in-memory rate limit
    const now = Date.now();
    const userKey = `rate:${userId}`;
    const window = rateLimitMap.get(userKey);
    if (window && now - window.start < 60_000 && window.count >= 20) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 20 requests per minute." },
        { status: 429 },
      );
    }
    if (!window || now - window.start >= 60_000) {
      rateLimitMap.set(userKey, { start: now, count: 1 });
    } else {
      window.count++;
    }
  }

  // ── Proxy to agent backend ─────────────────────────────
  try {
    const body = await req.json();

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

// Fallback in-memory rate limiter
const rateLimitMap = new Map<string, { start: number; count: number }>();
