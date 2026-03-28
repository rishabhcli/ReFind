"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { signOut } from "@workos-inc/authkit-nextjs";
import { LogOut, Menu, Sparkles, Square } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
  canStopAll?: boolean;
  onStopAll?: () => void;
}

export function Header({ onToggleSidebar, canStopAll, onStopAll }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header
      className="flex shrink-0 items-center justify-between px-4 md:hidden"
      style={{
        height: "62px",
        background: "rgba(15, 17, 19, 0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        {onToggleSidebar ? (
          <button
            onClick={onToggleSidebar}
            className="interactive focus-ring rounded-xl p-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : null}

        <div className="flex items-center gap-2.5">
          <div
            className="brand-mark flex items-center justify-center rounded-[12px]"
            style={{ width: "30px", height: "30px" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span
            style={{
              fontSize: "19px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--foreground)",
            }}
          >
            ReFind
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {onStopAll ? (
          <button
            type="button"
            onClick={onStopAll}
            disabled={!canStopAll}
            className="interactive focus-ring rounded-xl p-2 disabled:opacity-45"
            style={{
              color: canStopAll ? "var(--destructive)" : "var(--text-dim)",
              background: canStopAll ? "rgba(201, 111, 98, 0.12)" : "transparent",
              border: canStopAll
                ? "1px solid rgba(201, 111, 98, 0.24)"
                : "1px solid transparent",
            }}
            title="Stop all workers"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : null}

        {user ? (
          <>
            <span
              className="hidden sm:block"
              style={{ fontSize: "13px", color: "var(--muted-foreground)" }}
            >
              {user.email}
            </span>
            <form
              action={async () => {
                await signOut();
              }}
            >
              <button
                type="submit"
                className="interactive focus-ring rounded-xl p-2"
                style={{ color: "var(--muted-foreground)" }}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : null}
      </div>
    </header>
  );
}
