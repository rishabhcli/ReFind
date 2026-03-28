"use client";

import Link from "next/link";
import { Plus, X, Trash2, Sparkles, LayoutGrid, MessageSquare, Square } from "lucide-react";

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
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300
          md:static md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          width: "256px",
          minWidth: "256px",
          background: "rgba(8,8,18,0.92)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Logo row */}
        <div
          className="flex items-center justify-between px-4"
          style={{ height: "60px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 3px 10px rgba(99,102,241,0.45)",
                flexShrink: 0,
              }}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="gradient-text"
                style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                ReFind
              </span>
              <span
                className="pulse-green"
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="interactive rounded-lg p-1.5 md:hidden"
            style={{ color: "#4a4a6a" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav links */}
        <div className="px-3 pt-3 pb-1 space-y-1">
          {/* New search button */}
          <button
            onClick={onNewThread}
            className="interactive focus-ring flex w-full items-center gap-2.5"
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#818cf8",
              fontSize: "13.5px",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.18)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.1)";
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
            }}
          >
            <Plus className="h-4 w-4" />
            New search
          </button>

          {/* Discover link */}
          <Link
            href="/discover"
            className="interactive focus-ring flex w-full items-center gap-2.5"
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: "transparent",
              border: "1px solid transparent",
              color: "#4a4a6a",
              fontSize: "13.5px",
              fontWeight: 500,
              textDecoration: "none",
              display: "flex",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLElement).style.color = "#7878a0";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#4a4a6a";
            }}
          >
            <LayoutGrid className="h-4 w-4" />
            Discover trending
          </Link>
        </div>

        {/* Divider + label */}
        {threads.length > 0 && (
          <div
            className="px-4 pt-3 pb-1.5 flex items-center gap-2"
            style={{ borderTop: "none" }}
          >
            <MessageSquare className="h-3 w-3" style={{ color: "#3a3a55" }} />
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#3a3a55", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Recent
            </span>
          </div>
        )}

        {/* Thread list */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2">
          {threads.length === 0 && (
            <p
              className="px-3 py-8 text-center"
              style={{ fontSize: "12px", color: "#3a3a55", lineHeight: "1.6" }}
            >
              Start a search to begin
            </p>
          )}
          {threads.map((thread) => {
            const isActive = activeThreadId === thread.id;
            return (
              <div
                key={thread.id}
                className="group flex w-full items-center gap-2 interactive"
                style={{
                  padding: "9px 12px",
                  borderRadius: "10px",
                  background: isActive ? "rgba(99,102,241,0.1)" : "transparent",
                  border: isActive
                    ? "1px solid rgba(99,102,241,0.2)"
                    : "1px solid transparent",
                  marginBottom: "1px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
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
                    className="truncate block"
                    style={{
                      color: isActive ? "#c4c4f0" : "#8888a8",
                      fontSize: "13px",
                      fontWeight: isActive ? 500 : 400,
                      lineHeight: "1.4",
                    }}
                  >
                    {thread.title}
                  </span>
                  <span style={{ color: "#2e2e48", fontSize: "10.5px", marginTop: "1px" }}>
                    {timeAgo(thread.updatedAt)}
                  </span>
                </button>
                {onDeleteThread && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                    className="hidden rounded-md p-1 group-hover:flex items-center justify-center interactive"
                    style={{ color: "#4a4a6a", flexShrink: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#4a4a6a"; }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {onStopAll ? (
            <div className="px-3 pt-3">
              <button
                type="button"
                onClick={onStopAll}
                disabled={!canStopAll}
                className="interactive focus-ring flex w-full items-center justify-center gap-2 rounded-xl disabled:opacity-40"
                style={{
                  padding: "10px 14px",
                  background: canStopAll ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                  border: canStopAll
                    ? "1px solid rgba(239,68,68,0.3)"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: canStopAll ? "#fca5a5" : "#4a4a6a",
                  fontSize: "12.5px",
                  fontWeight: 500,
                }}
                title="Stop all workers"
              >
                <Square className="h-3.5 w-3.5" />
                Stop all workers
              </button>
            </div>
          ) : null}

          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderTop: onStopAll ? "1px solid rgba(255,255,255,0.03)" : "none" }}
          >
            <span style={{ fontSize: "10.5px", color: "#2e2e48" }}>v0.1.0</span>
            <div
              style={{
                fontSize: "10px",
                color: "#3a3a55",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#10b981",
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
