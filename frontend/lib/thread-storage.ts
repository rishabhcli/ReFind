import type { CompleteAttachment } from "@assistant-ui/react";
import type { ThreadUserMessagePart } from "@assistant-ui/react";
import type { ThreadSummary } from "@/components/layout/Sidebar";

const STORAGE_KEY = "refind_threads";
const MESSAGES_PREFIX = "refind_msgs_";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: CompleteAttachment[];
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result?: unknown;
    content?: ThreadUserMessagePart[];
  }>;
  createdAt: number;
}

function getThreadIndex(): ThreadSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveThreadIndex(threads: ThreadSummary[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function listThreads(): ThreadSummary[] {
  return getThreadIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createThread(): ThreadSummary {
  const thread: ThreadSummary = {
    id: crypto.randomUUID(),
    title: "New Chat",
    updatedAt: Date.now(),
  };
  const threads = getThreadIndex();
  threads.unshift(thread);
  saveThreadIndex(threads);
  return thread;
}

export function updateThreadTitle(threadId: string, title: string) {
  const threads = getThreadIndex();
  const thread = threads.find((t) => t.id === threadId);
  if (thread) {
    thread.title = title.slice(0, 60);
    thread.updatedAt = Date.now();
    saveThreadIndex(threads);
  }
}

export function deleteThread(threadId: string) {
  const threads = getThreadIndex().filter((t) => t.id !== threadId);
  saveThreadIndex(threads);
  localStorage.removeItem(MESSAGES_PREFIX + threadId);
}

export function getMessages(threadId: string): StoredMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_PREFIX + threadId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMessages(threadId: string, messages: StoredMessage[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MESSAGES_PREFIX + threadId, JSON.stringify(messages));
  // Update the thread timestamp
  const threads = getThreadIndex();
  const thread = threads.find((t) => t.id === threadId);
  if (thread) {
    thread.updatedAt = Date.now();
    saveThreadIndex(threads);
  }
}
