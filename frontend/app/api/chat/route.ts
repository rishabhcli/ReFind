import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { Unkey } from "@unkey/api";
import { authEnabled } from "@/lib/auth-config";

const AGENT_API_URL =
  process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000";

const SESSION_COOKIE = "refind-chat-session";
const RATE_LIMIT_NAME = "chat_requests";
const RATE_LIMIT_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 3_600_000;
const fallbackMap = new Map<string, { start: number; count: number }>();

const hasUnkeyConfig = Boolean(
  process.env.UNKEY_ROOT_KEY && process.env.UNKEY_API_ID,
);

const unkey = hasUnkeyConfig
  ? new Unkey({ rootKey: process.env.UNKEY_ROOT_KEY! })
  : null;

function applyFallbackRateLimit(identifier: string) {
  const now = Date.now();
  const window = fallbackMap.get(identifier);

  if (window && now - window.start < RATE_LIMIT_WINDOW_MS) {
    if (window.count >= RATE_LIMIT_LIMIT) {
      return {
        allowed: false,
        retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - window.start),
      };
    }

    window.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  fallbackMap.set(identifier, { start: now, count: 1 });
  return { allowed: true, retryAfterMs: 0 };
}

async function createSessionKey(userId: string) {
  if (!unkey || !process.env.UNKEY_API_ID) {
    return null;
  }

  const sessionId = randomUUID();
  const created = await unkey.keys.createKey({
    apiId: process.env.UNKEY_API_ID,
    prefix: "chat",
    name: `ReFind chat session ${sessionId.slice(0, 8)}`,
    externalId: userId,
    meta: {
      sessionId,
      userId,
    },
    ratelimits: [
      {
        name: RATE_LIMIT_NAME,
        limit: RATE_LIMIT_LIMIT,
        duration: RATE_LIMIT_WINDOW_MS,
        autoApply: true,
      },
    ],
  });

  return created.data.key;
}

function rateLimitErrorResponse(retryAfterMs: number) {
  return NextResponse.json(
    { error: "Rate limit exceeded. Max 10 requests per hour." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000))),
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const clientHint =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "local";
  let userId = "dev-user";
  if (authEnabled) {
    const { user } = await withAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  }

  let sessionKey = req.cookies.get(SESSION_COOKIE)?.value ?? null;

  if (unkey) {
    try {
      if (!sessionKey) {
        sessionKey = await createSessionKey(userId);
      }

      if (!sessionKey) {
        return NextResponse.json(
          { error: "Unable to initialize rate limiting." },
          { status: 500 },
        );
      }

      const verification = await unkey.keys.verifyKey({
        key: sessionKey,
        tags: ["route=api/chat", `user=${userId}`],
      });
      const verificationData = verification.data;

      if (!verificationData.valid) {
        const retryAfterMs =
          verificationData.ratelimits?.find((limit) => limit.name === RATE_LIMIT_NAME)
            ?.reset ?? RATE_LIMIT_WINDOW_MS;

        if (verificationData.code === "RATE_LIMITED") {
          return rateLimitErrorResponse(retryAfterMs);
        }

        return NextResponse.json(
          { error: "Invalid chat session." },
          { status: 401 },
        );
      }
    } catch (error) {
      console.error("Unkey rate limit error:", error);

      const fallback = applyFallbackRateLimit(`${userId}:${clientHint}`);
      if (!fallback.allowed) {
        return rateLimitErrorResponse(fallback.retryAfterMs);
      }
    }
  } else {
    const fallback = applyFallbackRateLimit(`${userId}:${clientHint}`);
    if (!fallback.allowed) {
      return rateLimitErrorResponse(fallback.retryAfterMs);
    }
  }

  try {
    const body = await req.json();
    let agentRes: Response;
    try {
      agentRes = await fetch(`${AGENT_API_URL}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          user_id: userId,
        }),
      });
    } catch (connErr: unknown) {
      const isRefused =
        connErr instanceof Error &&
        (connErr.message.includes("ECONNREFUSED") ||
          connErr.message.includes("fetch failed"));
      return NextResponse.json(
        {
          error: isRefused
            ? `Backend not reachable at ${AGENT_API_URL}. Start it with: cd backend && python -m backend.main`
            : "Failed to connect to agent backend",
        },
        { status: 503 },
      );
    }

    if (!agentRes.ok || !agentRes.body) {
      return NextResponse.json(
        { error: "Agent backend error" },
        { status: agentRes.status },
      );
    }

    const response = new NextResponse(agentRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    if (sessionKey && req.cookies.get(SESSION_COOKIE)?.value !== sessionKey) {
      response.cookies.set({
        name: SESSION_COOKIE,
        value: sessionKey,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Chat proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
