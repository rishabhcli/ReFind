module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:http [external] (node:http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:http", () => require("node:http"));

module.exports = mod;
}),
"[externals]/node:https [external] (node:https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:https", () => require("node:https"));

module.exports = mod;
}),
"[externals]/node:events [external] (node:events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:events", () => require("node:events"));

module.exports = mod;
}),
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:util [external] (node:util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:util", () => require("node:util"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/auth-config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authEnabled",
    ()=>authEnabled,
    "devAuthEnabled",
    ()=>devAuthEnabled,
    "workosConfigured",
    ()=>workosConfigured
]);
const workosConfigured = !!process.env.WORKOS_CLIENT_ID;
const devAuthEnabled = process.env.DEV_AUTH_ENABLED === "true";
const authEnabled = workosConfigured && !devAuthEnabled;
}),
"[project]/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$workos$2d$inc$2f$authkit$2d$nextjs$2f$dist$2f$esm$2f$session$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@workos-inc/authkit-nextjs/dist/esm/session.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$unkey$2f$api$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@unkey/api/dist/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$unkey$2f$api$2f$dist$2f$esm$2f$sdk$2f$sdk$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@unkey/api/dist/esm/sdk/sdk.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-config.ts [app-route] (ecmascript)");
;
;
;
;
;
const AGENT_API_URL = ("TURBOPACK compile-time value", "http://localhost:8000") || "http://localhost:8000";
const SESSION_COOKIE = "refind-chat-session";
const RATE_LIMIT_NAME = "chat_requests";
const RATE_LIMIT_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 3_600_000;
const fallbackMap = new Map();
const hasUnkeyConfig = Boolean(process.env.UNKEY_ROOT_KEY && process.env.UNKEY_API_ID);
const unkey = hasUnkeyConfig ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$unkey$2f$api$2f$dist$2f$esm$2f$sdk$2f$sdk$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Unkey"]({
    rootKey: process.env.UNKEY_ROOT_KEY
}) : null;
function applyFallbackRateLimit(identifier) {
    const now = Date.now();
    const window = fallbackMap.get(identifier);
    if (window && now - window.start < RATE_LIMIT_WINDOW_MS) {
        if (window.count >= RATE_LIMIT_LIMIT) {
            return {
                allowed: false,
                retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - window.start)
            };
        }
        window.count += 1;
        return {
            allowed: true,
            retryAfterMs: 0
        };
    }
    fallbackMap.set(identifier, {
        start: now,
        count: 1
    });
    return {
        allowed: true,
        retryAfterMs: 0
    };
}
async function createSessionKey(userId) {
    if (!unkey || !process.env.UNKEY_API_ID) {
        return null;
    }
    const sessionId = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])();
    const created = await unkey.keys.createKey({
        apiId: process.env.UNKEY_API_ID,
        prefix: "chat",
        name: `ReFind chat session ${sessionId.slice(0, 8)}`,
        externalId: userId,
        meta: {
            sessionId,
            userId
        },
        ratelimits: [
            {
                name: RATE_LIMIT_NAME,
                limit: RATE_LIMIT_LIMIT,
                duration: RATE_LIMIT_WINDOW_MS,
                autoApply: true
            }
        ]
    });
    return created.data.key;
}
function rateLimitErrorResponse(retryAfterMs) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: "Rate limit exceeded. Max 10 requests per hour."
    }, {
        status: 429,
        headers: {
            "Retry-After": String(Math.max(1, Math.ceil(retryAfterMs / 1000)))
        }
    });
}
async function POST(req) {
    const clientHint = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "local";
    let userId = "dev-user";
    if (__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authEnabled"]) {
        const { user } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$workos$2d$inc$2f$authkit$2d$nextjs$2f$dist$2f$esm$2f$session$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["withAuth"])();
        if (!user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unauthorized"
            }, {
                status: 401
            });
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
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Unable to initialize rate limiting."
                }, {
                    status: 500
                });
            }
            const verification = await unkey.keys.verifyKey({
                key: sessionKey,
                tags: [
                    "route=api/chat",
                    `user=${userId}`
                ]
            });
            const verificationData = verification.data;
            if (!verificationData.valid) {
                const retryAfterMs = verificationData.ratelimits?.find((limit)=>limit.name === RATE_LIMIT_NAME)?.reset ?? RATE_LIMIT_WINDOW_MS;
                if (verificationData.code === "RATE_LIMITED") {
                    return rateLimitErrorResponse(retryAfterMs);
                }
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Invalid chat session."
                }, {
                    status: 401
                });
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
        let agentRes;
        try {
            agentRes = await fetch(`${AGENT_API_URL}/api/agent/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...body,
                    user_id: userId
                })
            });
        } catch (connErr) {
            const isRefused = connErr instanceof Error && (connErr.message.includes("ECONNREFUSED") || connErr.message.includes("fetch failed"));
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: isRefused ? `Backend not reachable at ${AGENT_API_URL}. Start it with: cd backend && python -m backend.main` : "Failed to connect to agent backend"
            }, {
                status: 503
            });
        }
        if (!agentRes.ok || !agentRes.body) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Agent backend error"
            }, {
                status: agentRes.status
            });
        }
        const response = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](agentRes.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive"
            }
        });
        if (sessionKey && req.cookies.get(SESSION_COOKIE)?.value !== sessionKey) {
            response.cookies.set({
                name: SESSION_COOKIE,
                value: sessionKey,
                httpOnly: true,
                sameSite: "lax",
                secure: ("TURBOPACK compile-time value", "development") === "production",
                path: "/"
            });
        }
        return response;
    } catch (error) {
        console.error("Chat proxy error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Internal server error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0sx5uph._.js.map