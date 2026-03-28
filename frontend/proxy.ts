import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";
import { authEnabled } from "@/lib/auth-config";

const workosProxy = authkitProxy({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ["/", "/api/auth/callback", "/api/auth/sign-in", "/api/auth/sign-up"],
  },
});

// In local/dev mode with DEV_AUTH_ENABLED=true, pass all requests through.
export default function proxy(
  request: NextRequest,
  context: Parameters<typeof workosProxy>[1],
) {
  if (!authEnabled) {
    return NextResponse.next();
  }
  return workosProxy(request, context);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
