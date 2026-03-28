"use client";

import { useState, useCallback } from "react";
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
  const [threads, setThreads] = useState<ThreadSummary[]>(() => listThreads());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    const existing = listThreads();
    return existing.length > 0 ? existing[0].id : createThread().id;
  });

  const refreshThreads = useCallback(() => {
    setThreads(listThreads());
  }, []);

  const handleNewThread = useCallback(() => {
    const thread = createThread();
    setActiveThreadId(thread.id);
    refreshThreads();
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
      refreshThreads();
      if (activeThreadId === id) {
        const remaining = listThreads();
        if (remaining.length > 0) {
          setActiveThreadId(remaining[0].id);
        } else {
          const newThread = createThread();
          setActiveThreadId(newThread.id);
          refreshThreads();
        }
      }
    },
    [activeThreadId, refreshThreads]
  );

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
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen((o) => !o)} />

        <main className="flex flex-1 flex-col overflow-hidden">
          {activeThreadId && (
            <AssistantChat
              key={activeThreadId}
              threadId={activeThreadId}
              userId={userId}
              onThreadUpdate={refreshThreads}
            />
          )}
        </main>
      </div>
    </>
  );
}
