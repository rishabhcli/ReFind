"use client";

import { Plus, MessageSquare, X, Trash2 } from "lucide-react";

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
}

export function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  open,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform
          md:static md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          <button
            onClick={onNewThread}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Thread list */}
        <nav className="flex-1 overflow-y-auto p-2">
          {threads.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No conversations yet
            </p>
          )}
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                activeThreadId === thread.id
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/50"
              }`}
            >
              <button
                onClick={() => onSelectThread(thread.id)}
                className="flex flex-1 items-center gap-2 truncate"
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{thread.title}</span>
              </button>
              {onDeleteThread && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(thread.id);
                  }}
                  className="hidden rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
