import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";

const hasWorkOS = !!process.env.WORKOS_CLIENT_ID;

const workosProxy = authkitProxy({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ["/", "/api/auth/callback", "/api/auth/sign-in", "/api/auth/sign-up"],
  },
});

// In dev without WorkOS credentials, pass all requests through
export default function proxy(
  request: NextRequest,
  context: Parameters<typeof workosProxy>[1],
) {
  if (!hasWorkOS) {
    return NextResponse.next();
  }
  return workosProxy(request, context);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
