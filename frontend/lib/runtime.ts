"use client";

import { useState, useCallback, useRef } from "react";
import {
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
} from "@assistant-ui/react";
import {
  getMessages,
  saveMessages,
  updateThreadTitle,
  type StoredMessage,
} from "@/lib/thread-storage";

// In production, route through the Next.js proxy (/api/chat) for auth + rate limiting.
// For local dev, you can point directly at the Python backend.
const CHAT_ENDPOINT = "/api/chat";

// ── Helpers ──────────────────────────────────────────────────────

type ContentPart =
  | { type: "text"; text: string }
  | {
      type: "tool-call";
      toolCallId: string;
      toolName: string;
      args: Record<string, unknown>;
      result?: unknown;
    };

function storedToThreadMessages(stored: StoredMessage[]): ThreadMessageLike[] {
  return stored.map((m) => ({
    role: m.role,
    content: [{ type: "text" as const, text: m.content }],
  }));
}

// ── Runtime hook ─────────────────────────────────────────────────

export function useReFindRuntime(
  threadId: string,
  userId: string,
  onThreadUpdate?: () => void,
) {
  const [messages, setMessages] = useState<ThreadMessageLike[]>(() =>
    storedToThreadMessages(getMessages(threadId)),
  );
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Build or update the assistant message from accumulated parts
  const updateAssistant = useCallback(
    (parts: ContentPart[]) => {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        const msg: ThreadMessageLike = {
          role: "assistant",
          content: parts as ThreadMessageLike["content"],
        };
        if (last?.role === "assistant") {
          next[next.length - 1] = msg;
        } else {
          next.push(msg);
        }
        return next;
      });
    },
    [],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const userText =
        message.content
          .filter(
            (c): c is { type: "text"; text: string } => c.type === "text",
          )
          .map((c) => c.text)
          .join("") || "";

      // Add user message
      setMessages((prev) => {
        const next = [
          ...prev,
          { role: "user" as const, content: [{ type: "text" as const, text: userText }] },
        ];
        if (next.filter((m) => m.role === "user").length === 1) {
          updateThreadTitle(threadId, userText);
          onThreadUpdate?.();
        }
        return next;
      });

      setIsRunning(true);
      const controller = new AbortController();
      abortRef.current = controller;

      // Accumulate content parts for the assistant message
      let assistantText = "";
      const toolCalls: Map<
        string,
        { toolCallId: string; toolName: string; args: Record<string, unknown>; result?: unknown }
      > = new Map();

      const buildParts = (): ContentPart[] => {
        const parts: ContentPart[] = [];
        // Tool calls go first so they render as cards above the text
        for (const tc of toolCalls.values()) {
          parts.push({ type: "tool-call", ...tc });
        }
        if (assistantText) {
          parts.push({ type: "text", text: assistantText });
        }
        return parts.length > 0 ? parts : [{ type: "text", text: "" }];
      };

      try {
        const res = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            thread_id: threadId,
            user_id: userId,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Agent API error: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const event = JSON.parse(data);

              if (event.type === "text") {
                assistantText += event.content;
                updateAssistant(buildParts());
              } else if (event.type === "tool_call") {
                toolCalls.set(event.tool_call_id, {
                  toolCallId: event.tool_call_id,
                  toolName: event.tool_name,
                  args: event.args ?? {},
                });
                updateAssistant(buildParts());
              } else if (event.type === "tool_result") {
                const tc = toolCalls.get(event.tool_call_id);
                if (tc) {
                  tc.result = event.result;
                  updateAssistant(buildParts());
                }
              }
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant" as const,
              content: [
                {
                  type: "text" as const,
                  text: "Sorry, something went wrong connecting to the agent. Please try again.",
                },
              ],
            },
          ]);
        }
      } finally {
        setIsRunning(false);
        abortRef.current = null;
        // Persist
        setMessages((prev) => {
          const toStore: StoredMessage[] = prev.map((m) => ({
            role: m.role as "user" | "assistant",
            content:
              Array.isArray(m.content) && m.content[0]?.type === "text"
                ? (m.content[0] as { text: string }).text
                : String(m.content),
            createdAt: Date.now(),
          }));
          saveMessages(threadId, toStore);
          return prev;
        });
      }
    },
    [threadId, userId, onThreadUpdate, updateAssistant],
  );

  const onCancel = useCallback(async () => {
    abortRef.current?.abort();
    setIsRunning(false);
  }, []);

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    onNew,
    onCancel,
    convertMessage: (m) => m,
  });

  return runtime;
}
