import { redirect } from "next/navigation";
import { DiscoveryScreen } from "@/components/discovery/DiscoveryScreen";
import { authEnabled } from "@/lib/auth-config";

const hasWorkOS = !!process.env.WORKOS_CLIENT_ID;

export default async function Home() {
  if (!authEnabled) {
    redirect("/chat");
  }

  // If WorkOS is configured, redirect already-authenticated users to chat.
  // Wrapped in try/catch in case middleware isn't covering this route yet.
  if (hasWorkOS) {
    try {
      const { withAuth } = await import("@workos-inc/authkit-nextjs");
      const { user } = await withAuth();
      if (user) redirect("/chat");
    } catch {
      // Middleware not covering this route — fall through to discovery screen
    }
  }

  return <DiscoveryScreen visible={true} />;
}
