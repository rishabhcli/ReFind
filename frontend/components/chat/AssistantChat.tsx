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
import {
  FileImage,
  FileText,
  Mic,
  Paperclip,
  Search,
  Send,
  Square,
  X,
} from "lucide-react";
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

const MARKET_SOURCES = [
  {
    label: "Mercari",
    styles: {
      background: "rgba(244, 63, 94, 0.12)",
      borderColor: "rgba(244, 63, 94, 0.28)",
      color: "#fb7185",
    },
  },
  {
    label: "Craigslist",
    styles: {
      background: "rgba(249, 115, 22, 0.12)",
      borderColor: "rgba(249, 115, 22, 0.28)",
      color: "#fb923c",
    },
  },
  {
    label: "Goodwill",
    styles: {
      background: "rgba(16, 185, 129, 0.12)",
      borderColor: "rgba(16, 185, 129, 0.28)",
      color: "#34d399",
    },
  },
  {
    label: "OfferUp",
    styles: {
      background: "rgba(14, 165, 233, 0.12)",
      borderColor: "rgba(14, 165, 233, 0.28)",
      color: "#38bdf8",
    },
  },
  {
    label: "Facebook",
    styles: {
      background: "rgba(139, 92, 246, 0.12)",
      borderColor: "rgba(139, 92, 246, 0.28)",
      color: "#a78bfa",
    },
  },
];

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
            style={{ padding: "28px 28px 168px" }}
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
    <div className="flex w-full justify-end py-3" style={{ maxWidth: "860px" }}>
      <div className="flex w-full max-w-[72%] flex-col items-end gap-2">
        <MessagePrimitive.Attachments>
          {() => <SentAttachmentCard />}
        </MessagePrimitive.Attachments>

        {hasText ? (
          <div
            style={{
              background: "rgba(143, 165, 138, 0.12)",
              border: "1px solid rgba(143, 165, 138, 0.24)",
              borderRadius: "22px 22px 8px 22px",
              padding: "14px 18px",
              width: "100%",
              color: "var(--foreground)",
              fontSize: "15px",
              lineHeight: "1.6",
              boxShadow: "var(--shadow-sm)",
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
    <div className="flex w-full py-3" style={{ maxWidth: "860px" }}>
      <div
        className="prose prose-sm prose-invert"
        style={{
          maxWidth: "82%",
          color: "var(--card-foreground)",
          fontSize: "15px",
          lineHeight: "1.7",
          borderLeft: "2px solid rgba(143, 165, 138, 0.3)",
          paddingLeft: "18px",
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
    <div
      className="mx-auto flex w-full flex-col items-center gap-8 pb-10"
      style={{ maxWidth: "1120px" }}
    >
      <div
        className="flex w-full flex-col items-center gap-4 px-2 text-center"
        style={{ maxWidth: "760px" }}
      >
        <div
          className="brand-mark flex items-center justify-center rounded-[20px]"
          style={{
            width: "62px",
            height: "62px",
          }}
        >
          <Search className="h-7 w-7" />
        </div>

        <div className="flex flex-col gap-3">
          <p
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
            }}
          >
            Live inventory search
          </p>
          <h2
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1.02,
              color: "var(--foreground)",
            }}
          >
            Find anything secondhand.
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "var(--muted-foreground)",
              lineHeight: 1.7,
            }}
          >
            Search Mercari, Craigslist, Goodwill, OfferUp, and Facebook Marketplace in one place.
            Watch real listings move through the feed, then start a focused search when you are ready.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {MARKET_SOURCES.map((source) => (
            <span
              key={source.label}
              style={{
                ...source.styles,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "999px",
                border: `1px solid ${source.styles.borderColor}`,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "999px",
                  background: source.styles.color,
                  display: "inline-block",
                }}
              />
              {source.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", minHeight: "430px", height: "min(54vh, 560px)" }}>
        <DiscoveryScreen layout="embedded" showChatCta={false} />
      </div>

      <SuggestedPrompts />
    </div>
  );
}

function ComposerShell() {
  const attachmentCount = useAuiState((state) => state.composer.attachments.length);

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        padding: "0 20px 20px",
        background: "rgba(15, 17, 19, 0.92)",
        borderTop: "1px solid rgba(35, 42, 49, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <ComposerPrimitive.AttachmentDropzone>
        <div
          className="mx-auto surface-panel-strong"
          style={{
            maxWidth: "920px",
            borderRadius: "28px",
            padding: "14px",
            marginTop: "14px",
          }}
        >
          <ComposerPrimitive.If dictation>
            <div
              style={{
                marginBottom: "10px",
                borderRadius: "16px",
                background: "rgba(143, 165, 138, 0.12)",
                border: "1px solid rgba(143, 165, 138, 0.24)",
                padding: "10px 12px",
                fontSize: "12px",
                color: "var(--card-foreground)",
              }}
            >
              Listening
              <span style={{ marginLeft: "8px", color: "var(--accent-strong)" }}>
                <ComposerPrimitive.DictationTranscript />
              </span>
            </div>
          </ComposerPrimitive.If>

          {attachmentCount > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              <ComposerPrimitive.Attachments>
                {() => <ComposerAttachmentChip />}
              </ComposerPrimitive.Attachments>
            </div>
          ) : null}

          <ComposerPrimitive.Root className="flex items-end gap-3">
            <div
              className="flex items-center gap-2"
              style={{
                padding: "5px",
                borderRadius: "18px",
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <ComposerToolbarButton
                primitive={ComposerPrimitive.AddAttachment}
                title="Attach a photo or file reference"
              >
                <Paperclip className="h-4 w-4" />
              </ComposerToolbarButton>

              <ComposerToolbarButton
                primitive={ComposerPrimitive.Dictate}
                title="Start voice input"
              >
                <Mic className="h-4 w-4" />
              </ComposerToolbarButton>

              <ComposerToolbarButton
                primitive={ComposerPrimitive.StopDictation}
                title="Stop voice input"
                danger
              >
                <Square className="h-4 w-4" />
              </ComposerToolbarButton>
            </div>

            <ComposerPrimitive.Input
              placeholder="Search for a used item, budget, brand, or condition"
              className="focus-ring min-h-[58px] max-h-[180px] flex-1 resize-none rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-[18px] py-4 text-[15px] text-[var(--foreground)] outline-none"
              autoFocus
            />

            <ComposerPrimitive.Cancel
              className="interactive focus-ring flex items-center justify-center rounded-[18px]"
              style={{
                width: "52px",
                height: "52px",
                background: "rgba(201, 111, 98, 0.12)",
                border: "1px solid rgba(201, 111, 98, 0.28)",
                color: "var(--destructive)",
              }}
              title="Stop this run"
            >
              <Square className="h-4 w-4" />
            </ComposerPrimitive.Cancel>

            <ComposerPrimitive.Send
              className="interactive focus-ring flex items-center justify-center rounded-[18px] disabled:opacity-40"
              style={{
                width: "52px",
                height: "52px",
                background: "var(--accent)",
                border: "1px solid rgba(173, 193, 168, 0.28)",
                color: "var(--accent-foreground)",
                boxShadow: "0 12px 24px rgba(143, 165, 138, 0.18)",
              }}
              title="Send"
            >
              <Send className="h-4 w-4" />
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>

          <div
            className="mt-3 flex items-center justify-between gap-4"
            style={{
              padding: "0 2px",
              fontSize: "11px",
              color: "var(--text-dim)",
            }}
          >
            <span>
              ReFind checks secondhand marketplaces and ranks likely value before you message a seller.
            </span>
            <span className="hidden md:inline" style={{ whiteSpace: "nowrap" }}>
              Add photos or files to compare listings faster.
            </span>
          </div>
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </div>
  );
}

function ComposerToolbarButton({
  primitive: Primitive,
  title,
  danger,
  children,
}: {
  primitive: typeof ComposerPrimitive.AddAttachment;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Primitive
      className="interactive focus-ring flex items-center justify-center rounded-[14px]"
      style={{
        width: "42px",
        height: "42px",
        background: danger ? "rgba(201, 111, 98, 0.12)" : "transparent",
        border: `1px solid ${danger ? "rgba(201, 111, 98, 0.24)" : "transparent"}`,
        color: danger ? "var(--destructive)" : "var(--muted-foreground)",
      }}
      title={title}
    >
      {children}
    </Primitive>
  );
}

function ComposerAttachmentChip() {
  return (
    <AttachmentPrimitive.Root
      className="flex items-center gap-3"
      style={{
        minWidth: "0",
        borderRadius: "16px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        padding: "8px 10px",
      }}
    >
      <AttachmentLead />
      <div className="min-w-0 flex-1">
        <div
          className="truncate"
          style={{ fontSize: "12px", color: "var(--foreground)", fontWeight: 600 }}
        >
          <AttachmentPrimitive.Name />
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
          Listing reference
        </div>
      </div>
      <AttachmentPrimitive.Remove
        className="interactive flex items-center justify-center rounded-full"
        style={{
          width: "24px",
          height: "24px",
          color: "var(--muted-foreground)",
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
        borderRadius: "16px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        padding: "8px 10px",
      }}
    >
      <AttachmentLead />
      <div className="min-w-0">
        <div
          className="truncate"
          style={{ fontSize: "12px", color: "var(--foreground)", fontWeight: 600 }}
        >
          <AttachmentPrimitive.Name />
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
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
          borderRadius: "12px",
          objectFit: "cover",
          border: "1px solid var(--border)",
        }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-[14px]"
      style={{
        width: "40px",
        height: "40px",
        background: "rgba(143, 165, 138, 0.12)",
        border: "1px solid rgba(143, 165, 138, 0.2)",
        color: "var(--accent-strong)",
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
