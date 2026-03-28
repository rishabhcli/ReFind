import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { authEnabled } from "@/lib/auth-config";

export default async function ChatPage() {
  if (authEnabled) {
    const { user } = await withAuth({ ensureSignedIn: true });
    if (!user) {
      redirect("/");
    }
    return <ChatInterface userId={user.id} />;
  }

  // Local/dev mode without WorkOS
  return <ChatInterface userId="dev-user" />;
}
