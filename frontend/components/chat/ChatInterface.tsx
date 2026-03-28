"use client";

import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar, type ThreadSummary } from "@/components/layout/Sidebar";
import { AssistantChat } from "@/components/chat/AssistantChat";
import {
  listThreads,
  createThread,
  deleteThread,
} from "@/lib/thread-storage";

interface ChatInterfaceProps {
  userId: string;
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cancelRun, setCancelRun] = useState<() => Promise<void>>(async () => {});

  const refreshThreads = useCallback((preferredThreadId?: string | null) => {
    const nextThreads = listThreads();
    setThreads(nextThreads);
    setActiveThreadId((current) => {
      const candidate = preferredThreadId ?? current;
      if (candidate && nextThreads.some((thread) => thread.id === candidate)) {
        return candidate;
      }
      return nextThreads.length > 0 ? nextThreads[0].id : null;
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const existing = listThreads();
      if (existing.length > 0) {
        refreshThreads(existing[0].id);
        return;
      }

      const thread = createThread();
      refreshThreads(thread.id);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshThreads]);

  const handleNewThread = useCallback(() => {
    const thread = createThread();
    refreshThreads(thread.id);
    setSidebarOpen(false);
  }, [refreshThreads]);

  const handleSelectThread = useCallback(
    (id: string) => {
      setActiveThreadId(id);
      setSidebarOpen(false);
    },
    []
  );

  const handleDeleteThread = useCallback(
    (id: string) => {
      deleteThread(id);
      const remaining = listThreads();

      if (remaining.length === 0) {
        const newThread = createThread();
        refreshThreads(newThread.id);
      } else if (activeThreadId === id) {
        refreshThreads(remaining[0].id);
      } else {
        refreshThreads(activeThreadId);
      }
    },
    [activeThreadId, refreshThreads]
  );

  const handleRuntimeStateChange = useCallback(
    (state: { isRunning: boolean; cancelRun: () => Promise<void> }) => {
      setIsRunning(state.isRunning);
      setCancelRun(() => state.cancelRun);
    },
    [],
  );

  const handleStopAll = useCallback(() => {
    void cancelRun();
  }, [cancelRun]);

  return (
    <>
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        canStopAll={isRunning}
        onStopAll={handleStopAll}
      />

      <div className="flex flex-1 flex-col overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <Header
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          canStopAll={isRunning}
          onStopAll={handleStopAll}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          {activeThreadId && (
            <AssistantChat
              key={activeThreadId}
              threadId={activeThreadId}
              userId={userId}
              onThreadUpdate={refreshThreads}
              onRuntimeStateChange={handleRuntimeStateChange}
            />
          )}
        </main>
      </div>
    </>
  );
}
