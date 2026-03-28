"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { signOut } from "@workos-inc/authkit-nextjs";
import { Search, LogOut, Menu } from "lucide-react";

export function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { user } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-md p-1.5 hover:bg-muted md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Search className="h-5 w-5 text-accent" />
        <span className="text-lg font-semibold tracking-tight">ReFind</span>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:block">
            {user.email}
          </span>
          <form action={async () => { await signOut(); }}>
            <button
              type="submit"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
