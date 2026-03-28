"use client";

import Link from "next/link";
import {
  Plus,
  X,
  Trash2,
  Sparkles,
  LayoutGrid,
  MessageSquare,
  Square,
} from "lucide-react";

export interface ThreadSummary {
  id: string;
  title: string;
  updatedAt: number;
}

interface SidebarProps {
  threads: ThreadSummary[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread?: (id: string) => void;
  open: boolean;
  onClose: () => void;
  canStopAll?: boolean;
  onStopAll?: () => void;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  open,
  onClose,
  canStopAll,
  onStopAll,
}: SidebarProps) {
  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300
          md:static md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          width: "272px",
          minWidth: "272px",
          background: "var(--sidebar)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-4"
          style={{ height: "68px", borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="brand-mark flex items-center justify-center rounded-[14px]"
              style={{ width: "34px", height: "34px" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
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
              <span
                className="pulse-green"
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "999px",
                  background: "var(--success)",
                  display: "inline-block",
                }}
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="interactive rounded-xl p-1.5 md:hidden"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 px-3 pt-4 pb-2">
          <button
            onClick={onNewThread}
            className="interactive focus-ring flex w-full items-center gap-2.5 rounded-[18px]"
            style={{
              padding: "12px 14px",
              background: "rgba(143, 165, 138, 0.12)",
              border: "1px solid rgba(143, 165, 138, 0.24)",
              color: "var(--accent-strong)",
              fontSize: "13.5px",
              fontWeight: 700,
            }}
          >
            <Plus className="h-4 w-4" />
            New search
          </button>

          <Link
            href="/discover"
            className="interactive focus-ring flex w-full items-center gap-2.5 rounded-[18px]"
            style={{
              padding: "12px 14px",
              background: "transparent",
              border: "1px solid transparent",
              color: "var(--muted-foreground)",
              fontSize: "13.5px",
              fontWeight: 600,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--card)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            <LayoutGrid className="h-4 w-4" />
            Discover feed
          </Link>
        </div>

        {threads.length > 0 ? (
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <MessageSquare className="h-3.5 w-3.5" style={{ color: "var(--text-dim)" }} />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--text-dim)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Recent
            </span>
          </div>
        ) : null}

        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {threads.length === 0 ? (
            <p
              className="px-4 py-10 text-center"
              style={{ fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.7 }}
            >
              Start a search to create the first thread.
            </p>
          ) : null}

          {threads.map((thread) => {
            const isActive = activeThreadId === thread.id;

            return (
              <div
                key={thread.id}
                className="group flex w-full items-center gap-2"
                style={{
                  padding: "10px 12px",
                  borderRadius: "18px",
                  background: isActive ? "var(--card-strong)" : "transparent",
                  border: isActive ? "1px solid var(--border-strong)" : "1px solid transparent",
                  marginBottom: "4px",
                  boxShadow: isActive ? "var(--shadow-sm)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--card)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
              >
                <button
                  onClick={() => onSelectThread(thread.id)}
                  className="flex flex-1 flex-col truncate text-left"
                >
                  <span
                    className="truncate"
                    style={{
                      color: isActive ? "var(--foreground)" : "var(--card-foreground)",
                      fontSize: "13px",
                      fontWeight: isActive ? 700 : 600,
                      lineHeight: 1.45,
                    }}
                  >
                    {thread.title}
                  </span>
                  <span
                    style={{
                      color: "var(--text-dim)",
                      fontSize: "11px",
                      marginTop: "2px",
                    }}
                  >
                    {timeAgo(thread.updatedAt)}
                  </span>
                </button>

                {onDeleteThread ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                    className="hidden items-center justify-center rounded-xl p-1.5 group-hover:flex interactive"
                    style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--destructive)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--muted-foreground)";
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 12px 12px" }}>
          {onStopAll ? (
            <button
              type="button"
              onClick={onStopAll}
              disabled={!canStopAll}
              className="interactive focus-ring flex w-full items-center justify-center gap-2 rounded-[18px] disabled:opacity-45"
              style={{
                padding: "12px 14px",
                background: canStopAll ? "rgba(201, 111, 98, 0.12)" : "var(--card)",
                border: canStopAll
                  ? "1px solid rgba(201, 111, 98, 0.28)"
                  : "1px solid var(--border)",
                color: canStopAll ? "var(--destructive)" : "var(--muted-foreground)",
                fontSize: "12.5px",
                fontWeight: 700,
              }}
              title="Stop all workers"
            >
              <Square className="h-3.5 w-3.5" />
              Stop all workers
            </button>
          ) : null}

          <div className="flex items-center justify-between px-2 pt-3">
            <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>v0.1.0</span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: "var(--muted-foreground)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "999px",
                  background: "var(--success)",
                  display: "inline-block",
                }}
              />
              Live
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
