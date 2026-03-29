import { NextRequest, NextResponse } from "next/server";
import { authEnabled } from "@/lib/auth-config";

/**
 * Next.js middleware (proxy.ts is the Next 16 convention for middleware.ts).
 *
 * When auth is disabled (DEV_AUTH_ENABLED=true or WORKOS_CLIENT_ID unset),
 * we return NextResponse.next() immediately WITHOUT importing the WorkOS SDK.
 *
 * Importing @workos-inc/authkit-nextjs at the module level registers global
 * server-action interceptors that call withAuth() on every POST request,
 * causing a "not covered by middleware" error even when we never explicitly
 * call withAuth() ourselves. Lazy import inside the function prevents this.
 */
export default async function proxy(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
): Promise<NextResponse> {
  if (!authEnabled) {
    return NextResponse.next();
  }

  // Only load WorkOS when auth is actually enabled — prevents module-level
  // side-effects (interceptor registration) from running in dev/demo mode.
  const { authkitProxy } = await import("@workos-inc/authkit-nextjs");
  const workosProxy = authkitProxy({
    middlewareAuth: {
      enabled: true,
      unauthenticatedPaths: [
        "/",
        "/api/auth/callback",
        "/api/auth/sign-in",
        "/api/auth/sign-up",
      ],
    },
  });

  return workosProxy(request, context) as Promise<NextResponse>;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)" ],
};
