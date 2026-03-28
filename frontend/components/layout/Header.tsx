"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { signOut } from "@workos-inc/authkit-nextjs";
import { LogOut, Menu, Square } from "lucide-react";

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
        height: '56px',
        background: 'rgba(5,5,10,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="interactive focus-ring rounded-lg p-1.5"
            style={{ color: '#7878a0' }}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <span className="gradient-text" style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          ReFind
        </span>
      </div>

      <div className="flex items-center gap-3">
        {onStopAll ? (
          <button
            type="button"
            onClick={onStopAll}
            disabled={!canStopAll}
            className="interactive focus-ring rounded-lg p-1.5 disabled:opacity-40"
            style={{
              color: canStopAll ? "#ef4444" : "#4b5563",
              background: canStopAll ? "rgba(239,68,68,0.12)" : "transparent",
            }}
            title="Stop all workers"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : null}

        {user ? (
          <>
          <span className="hidden sm:block" style={{ fontSize: '13px', color: '#7878a0' }}>
            {user.email}
          </span>
          <form action={async () => { await signOut(); }}>
            <button
              type="submit"
              className="interactive focus-ring rounded-lg p-1.5"
              style={{ color: '#7878a0' }}
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
