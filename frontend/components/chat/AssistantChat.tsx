"use client";

import { useCallback, useRef, useState } from "react";
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { useReFindRuntime } from "@/lib/runtime";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { ToolUIs } from "./ToolUIs";
import { VoiceInput } from "./VoiceInput";
import { Send, Square } from "lucide-react";

interface AssistantChatProps {
  threadId: string;
  userId: string;
  onThreadUpdate?: () => void;
}

export function AssistantChat({
  threadId,
  userId,
  onThreadUpdate,
}: AssistantChatProps) {
  const runtime = useReFindRuntime(threadId, userId, onThreadUpdate);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ToolUIs />
      <div className="flex h-full flex-col">
        <ThreadPrimitive.Root className="flex flex-1 flex-col overflow-hidden">
          <ThreadPrimitive.Viewport className="flex flex-1 flex-col items-center overflow-y-auto scroll-smooth px-4 pt-8">
            <ThreadPrimitive.Empty>
              <SuggestedPrompts />
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />

            <div className="min-h-8 flex-shrink-0" />
          </ThreadPrimitive.Viewport>

          {/* Composer */}
          <ComposerWithVoice />
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
}

function UserMessage() {
  return (
    <div className="flex w-full max-w-2xl justify-end py-2">
      <div className="rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-accent-foreground">
        <MessagePrimitive.Content />
      </div>
    </div>
  );
}

function AssistantMessage() {
  return (
    <div className="flex w-full max-w-2xl py-2">
      <div className="prose prose-sm dark:prose-invert max-w-2xl rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm">
        <MessagePrimitive.Content
          components={{
            Text: MarkdownText,
          }}
        />
      </div>
    </div>
  );
}

function MarkdownText() {
  return <MarkdownTextPrimitive />;
}

function ComposerWithVoice() {
  const [voiceText, setVoiceText] = useState("");

  const handleTranscript = useCallback((text: string) => {
    setVoiceText("");
    // Inject the text into the composer input
    const input = document.querySelector(
      '[data-aui-composer-input], textarea, input[type="text"]'
    ) as HTMLTextAreaElement | null;
    if (input) {
      const nativeSet = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      nativeSet?.call(input, text);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    }
  }, []);

  const handleInterim = useCallback((text: string) => {
    setVoiceText(text);
  }, []);

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      {voiceText && (
        <div className="mx-auto mb-2 max-w-2xl rounded-lg bg-accent/10 px-3 py-1.5 text-xs text-accent">
          🎤 {voiceText}
        </div>
      )}
      <ComposerPrimitive.Root className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border border-border bg-muted px-4 py-2">
        <ComposerPrimitive.Input
          placeholder="Describe what you're looking for..."
          className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        <VoiceInput onTranscript={handleTranscript} onInterim={handleInterim} />
        <ComposerPrimitive.Cancel className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground">
          <Square className="h-4 w-4" />
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send className="rounded-md bg-accent p-1.5 text-accent-foreground hover:opacity-90 disabled:opacity-40">
          <Send className="h-4 w-4" />
        </ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
      <p className="mx-auto mt-1.5 max-w-2xl text-center text-[10px] text-muted-foreground">
        ReFind searches secondhand marketplaces. Always verify listings
        before purchasing.
      </p>
    </div>
  );
}
