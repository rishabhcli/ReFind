import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000";
const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Proxies chat requests to the Python agent backend.
 * - Requires WorkOS authentication (bypassed in dev when no keys configured)
 * - Streams SSE responses back to the client
 */
export async function POST(req: NextRequest) {
  // Auth check — skip in dev if WorkOS is not configured
  let userId = "dev-user";
  if (!IS_DEV || process.env.WORKOS_CLIENT_ID) {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  }

  // Simple in-memory rate limit (per-user, resets each deploy)
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

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { start: number; count: number }>();
