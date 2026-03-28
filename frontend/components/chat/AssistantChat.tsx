"use client";

import { useEffect } from "react";
import {
  AssistantRuntimeProvider,
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { FileImage, FileText, Mic, Paperclip, Send, Square, X } from "lucide-react";
import { useReFindRuntime } from "@/lib/runtime";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { ToolUIs } from "./ToolUIs";
import { DiscoveryScreen } from "@/components/discovery/DiscoveryScreen";

interface AssistantChatProps {
  threadId: string;
  userId: string;
  onThreadUpdate?: () => void;
  onRuntimeStateChange?: (state: {
    isRunning: boolean;
    cancelRun: () => Promise<void>;
  }) => void;
}

export function AssistantChat({
  threadId,
  userId,
  onThreadUpdate,
  onRuntimeStateChange,
}: AssistantChatProps) {
  const { runtime, isRunning, cancelRun } = useReFindRuntime(
    threadId,
    userId,
    onThreadUpdate,
  );

  useEffect(() => {
    onRuntimeStateChange?.({ isRunning, cancelRun });

    return () => {
      onRuntimeStateChange?.({
        isRunning: false,
        cancelRun: async () => {},
      });
    };
  }, [isRunning, cancelRun, onRuntimeStateChange]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ToolUIs />
      <div className="flex h-full flex-col" style={{ position: "relative" }}>
        <ThreadPrimitive.Root className="flex flex-1 flex-col overflow-hidden">
          <ThreadPrimitive.Viewport
            className="flex flex-1 flex-col items-center overflow-y-auto scroll-smooth"
            style={{ padding: "24px 28px" }}
          >
            <ThreadPrimitive.Empty>
              <DiscoveryHero />
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />

            <div className="min-h-8 flex-shrink-0" />
          </ThreadPrimitive.Viewport>

          <ComposerShell />
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
}

function UserMessage() {
  const hasText = useAuiState((state) =>
    state.message.content.some(
      (part) => part.type === "text" && part.text.trim().length > 0,
    ),
  );

  return (
    <div className="flex w-full justify-end py-3" style={{ maxWidth: "760px" }}>
      <div className="flex w-full max-w-[68%] flex-col items-end gap-2">
        <MessagePrimitive.Attachments>
          {() => <SentAttachmentCard />}
        </MessagePrimitive.Attachments>

        {hasText ? (
          <div
            style={{
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: "18px 18px 4px 18px",
              padding: "12px 18px",
              width: "100%",
              color: "#e2e2f0",
              fontSize: "15px",
              lineHeight: "1.6",
            }}
          >
            <MessagePrimitive.Content />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AssistantMessage() {
  return (
    <div className="flex w-full py-3" style={{ maxWidth: "760px" }}>
      <div
        className="prose prose-sm prose-invert"
        style={{
          maxWidth: "88%",
          color: "#e2e2f0",
          fontSize: "15px",
          lineHeight: "1.7",
          borderLeft: "2px solid rgba(99,102,241,0.25)",
          paddingLeft: "16px",
        }}
      >
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

function DiscoveryHero() {
  return (
    <div className="flex w-full flex-col gap-6" style={{ width: "100%" }}>
      {/* Slot-machine discovery panel — fills available height */}
      <div style={{ width: "100%", height: "calc(100vh - 260px)", minHeight: "400px" }}>
        <DiscoveryScreen layout="embedded" showChatCta={false} />
      </div>
      {/* Suggested prompts below the columns */}
      <SuggestedPrompts />
    </div>
  );
}

function ComposerShell() {
  const attachmentCount = useAuiState((state) => state.composer.attachments.length);

  return (
    <div style={{ position: "sticky", bottom: 0, zIndex: 10 }}>
      <div
        className="composer-fade pointer-events-none"
        style={{
          height: "64px",
          marginBottom: "-64px",
          position: "relative",
          zIndex: 1,
        }}
      />

      <ComposerPrimitive.AttachmentDropzone style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            background: "rgba(5,5,10,0.8)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: "14px 20px",
          }}
        >
          <div className="mx-auto" style={{ maxWidth: "760px" }}>
            <ComposerPrimitive.If dictation>
              <div
                style={{
                  marginBottom: "8px",
                  borderRadius: "10px",
                  background: "rgba(99,102,241,0.1)",
                  padding: "6px 12px",
                  fontSize: "12px",
                  color: "#c7d2fe",
                }}
              >
                Listening...
                <span style={{ marginLeft: "6px", color: "#818cf8" }}>
                  <ComposerPrimitive.DictationTranscript />
                </span>
              </div>
            </ComposerPrimitive.If>

            {attachmentCount > 0 ? (
              <div className="mb-2 flex flex-wrap gap-2">
                <ComposerPrimitive.Attachments>
                  {() => <ComposerAttachmentChip />}
                </ComposerPrimitive.Attachments>
              </div>
            ) : null}

            <ComposerPrimitive.Root className="flex items-end gap-2">
              <ComposerPrimitive.AddAttachment
                className="interactive focus-ring flex items-center justify-center rounded-full"
                style={{
                  width: "42px",
                  height: "42px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#cbd5e1",
                }}
                title="Attach a photo or file reference"
              >
                <Paperclip className="h-4 w-4" />
              </ComposerPrimitive.AddAttachment>

              <ComposerPrimitive.Dictate
                className="interactive focus-ring flex items-center justify-center rounded-full"
                style={{
                  width: "42px",
                  height: "42px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#cbd5e1",
                }}
                title="Start voice input"
              >
                <Mic className="h-4 w-4" />
              </ComposerPrimitive.Dictate>

              <ComposerPrimitive.StopDictation
                className="interactive focus-ring flex items-center justify-center rounded-full"
                style={{
                  width: "42px",
                  height: "42px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444",
                }}
                title="Stop voice input"
              >
                <Square className="h-4 w-4" />
              </ComposerPrimitive.StopDictation>

              <ComposerPrimitive.Input
                placeholder="Find me anything secondhand..."
                className="flex-1 resize-none bg-transparent outline-none focus-ring"
                style={{
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "12px 22px",
                  fontSize: "15px",
                  color: "#e2e2f0",
                }}
                autoFocus
              />

              <ComposerPrimitive.Cancel
                className="interactive focus-ring flex items-center justify-center rounded-full"
                style={{
                  width: "42px",
                  height: "42px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444",
                }}
                title="Stop this run"
              >
                <Square className="h-4 w-4" />
              </ComposerPrimitive.Cancel>

              <ComposerPrimitive.Send
                className="interactive focus-ring flex items-center justify-center rounded-full disabled:opacity-40"
                style={{
                  width: "42px",
                  height: "42px",
                  background: "#6366f1",
                  color: "#ffffff",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.5)",
                }}
                title="Send"
              >
                <Send className="h-4 w-4" />
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
          </div>

          <p
            className="mx-auto mt-1.5 text-center"
            style={{ maxWidth: "760px", fontSize: "10px", color: "#3a3a55" }}
          >
            ReFind searches secondhand marketplaces. Attach photos or files to use
            them as listing references, then verify listings before purchasing.
          </p>
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </div>
  );
}

function ComposerAttachmentChip() {
  return (
    <AttachmentPrimitive.Root
      className="flex items-center gap-3"
      style={{
        minWidth: "0",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "8px 10px",
      }}
    >
      <AttachmentLead />
      <div className="min-w-0 flex-1">
        <div
          className="truncate"
          style={{ fontSize: "12px", color: "#e2e2f0", fontWeight: 500 }}
        >
          <AttachmentPrimitive.Name />
        </div>
        <div style={{ fontSize: "11px", color: "#7878a0" }}>
          Listing reference
        </div>
      </div>
      <AttachmentPrimitive.Remove
        className="interactive flex items-center justify-center rounded-full"
        style={{
          width: "24px",
          height: "24px",
          color: "#94a3b8",
        }}
        title="Remove attachment"
      >
        <X className="h-3.5 w-3.5" />
      </AttachmentPrimitive.Remove>
    </AttachmentPrimitive.Root>
  );
}

function SentAttachmentCard() {
  const attachment = useAuiState((state) => state.attachment);
  const isImage = attachment?.type === "image";

  return (
    <AttachmentPrimitive.Root
      className="flex items-center gap-3"
      style={{
        alignSelf: "flex-end",
        maxWidth: "100%",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "8px 10px",
      }}
    >
      <AttachmentLead />
      <div className="min-w-0">
        <div
          className="truncate"
          style={{ fontSize: "12px", color: "#e2e2f0", fontWeight: 500 }}
        >
          <AttachmentPrimitive.Name />
        </div>
        <div style={{ fontSize: "11px", color: "#7878a0" }}>
          {isImage ? "Image reference" : "File reference"}
        </div>
      </div>
    </AttachmentPrimitive.Root>
  );
}

function AttachmentLead() {
  const attachment = useAuiState((state) => state.attachment);
  const imagePart = attachment?.content?.find((part) => part.type === "image");

  if (imagePart?.type === "image") {
    return (
      <img
        src={imagePart.image}
        alt={attachment?.name ?? "Attachment"}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          objectFit: "cover",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-xl"
      style={{
        width: "40px",
        height: "40px",
        background: "rgba(99,102,241,0.14)",
        color: "#a5b4fc",
      }}
    >
      {attachment?.type === "image" ? (
        <FileImage className="h-4 w-4" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
    </div>
  );
}
