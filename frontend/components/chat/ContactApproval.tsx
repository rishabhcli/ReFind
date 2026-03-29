"use client";

import { useState } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { Mail, CheckCircle2, XCircle, Loader2, Edit2 } from "lucide-react";
import { ToolScrollRail } from "./ToolScrollRail";

const NEGOTIATE_ENDPOINT =
  process.env.NEXT_PUBLIC_AGENT_API_URL
    ? `${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/negotiate`
    : "/api/negotiate-proxy";

// ── DraftMessageUI — tool_name: "draft_seller_message" ───────────

export const DraftMessageUI = makeAssistantToolUI<
  {
    listing_title?: string;
    listing_url?: string;
    seller_name?: string;
    offer_price?: number;
    user_name?: string;
    opening_message?: string;
    message?: string;
    recommended_offer?: number;
    walk_away_price?: number;
  },
  {
    seller_name?: string;
    listing_title?: string;
    listing_url?: string;
    message?: string;
    opening_message?: string;
    recommended_offer?: number;
    walk_away_price?: number;
    requires_approval?: boolean;
    status?: string;
  }
>({
  toolName: "draft_seller_message",
  render: ({ args, status, result }) => {
    const isRunning = status.type === "running";
    const resultData = result as {
      message?: string;
      opening_message?: string;
      seller_name?: string;
      listing_title?: string;
      listing_url?: string;
      recommended_offer?: number;
      walk_away_price?: number;
      status?: string;
    } | undefined;

    if (isRunning) {
      return (
        <ToolScrollRail animate={false}>
          <div
            className="glass my-2 w-full"
            style={{
              maxWidth: "440px",
              borderRadius: "18px",
              padding: "16px 18px",
            }}
          >
            <div
              className="flex items-center gap-2"
              style={{ fontSize: "14px", fontWeight: 500, color: "#e2e2f0" }}
            >
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#6366f1" }} />
              Drafting message to seller…
            </div>
          </div>
        </ToolScrollRail>
      );
    }

    const sellerName = resultData?.seller_name ?? args.seller_name ?? "Seller";
    const listingTitle = resultData?.listing_title ?? args.listing_title ?? "Listing";
    const listingUrl = resultData?.listing_url ?? args.listing_url ?? "";
    const message =
      resultData?.message ??
      resultData?.opening_message ??
      args.opening_message ??
      args.message ??
      "";
    const recommendedOffer =
      resultData?.recommended_offer ?? args.recommended_offer;
    const walkAwayPrice = resultData?.walk_away_price ?? args.walk_away_price;

    return (
      <ContactApprovalCard
        sellerName={sellerName}
        listingTitle={listingTitle}
        listingUrl={listingUrl}
        message={message}
        recommendedOffer={recommendedOffer}
        walkAwayPrice={walkAwayPrice}
      />
    );
  },
});

// ── ContactApprovalCard ───────────────────────────────────────────

function ContactApprovalCard({
  sellerName,
  listingTitle,
  listingUrl,
  message,
  recommendedOffer,
  walkAwayPrice,
}: {
  sellerName: string;
  listingTitle: string;
  listingUrl?: string;
  message: string;
  recommendedOffer?: number;
  walkAwayPrice?: number;
}) {
  const [decision, setDecision] = useState<
    "pending" | "editing" | "sending" | "sent" | "declined"
  >("pending");
  const [editedMessage, setEditedMessage] = useState(message);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSend = async (msgToSend: string) => {
    setDecision("sending");
    setSendError(null);
    try {
      const res = await fetch(NEGOTIATE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          listing_url: listingUrl,
          message: msgToSend,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(payload?.error ?? `Server error ${res.status}`);
      }
      setDecision("sent");
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Send failed");
      setDecision("pending");
    }
  };

  if (decision === "sent") {
    return (
      <ToolScrollRail animate={false}>
        <div
          className="my-2 flex w-full items-center gap-2"
          style={{
            maxWidth: "440px",
            borderRadius: "14px",
            border: "1px solid rgba(16,185,129,0.25)",
            background: "rgba(16,185,129,0.08)",
            padding: "12px 16px",
            fontSize: "14px",
            color: "#10b981",
          }}
        >
          <CheckCircle2 className="h-4 w-4" />
          Message sent to {sellerName}
        </div>
      </ToolScrollRail>
    );
  }

  if (decision === "declined") {
    return (
      <ToolScrollRail animate={false}>
        <div
          className="my-2 flex w-full items-center gap-2"
          style={{
            maxWidth: "440px",
            borderRadius: "14px",
            border: "1px solid rgba(239,68,68,0.25)",
            background: "rgba(239,68,68,0.08)",
            padding: "12px 16px",
            fontSize: "14px",
            color: "#ef4444",
          }}
        >
          <XCircle className="h-4 w-4" />
          Skipped negotiation for {sellerName}
        </div>
      </ToolScrollRail>
    );
  }

  return (
    <ToolScrollRail animate={false}>
      <div
        className="glass my-2 w-full"
        style={{ maxWidth: "440px", borderRadius: "18px", padding: "16px 18px" }}
      >
        {/* Header */}
        <div
          className="mb-2 flex items-center gap-2"
          style={{ fontSize: "14px", fontWeight: 500, color: "#e2e2f0" }}
        >
          <Mail className="h-4 w-4" style={{ color: "#6366f1" }} />
          Message to {sellerName} — {listingTitle}
        </div>

        {/* Offer info badges */}
        {(recommendedOffer != null || walkAwayPrice != null) && (
          <div className="mb-2 flex gap-2 flex-wrap" style={{ fontSize: "11px" }}>
            {recommendedOffer != null && (
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "999px",
                  background: "rgba(99,102,241,0.1)",
                  color: "#6366f1",
                }}
              >
                Offer: ${recommendedOffer.toFixed(0)}
              </span>
            )}
            {walkAwayPrice != null && (
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "999px",
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                }}
              >
                Walk-away: ${walkAwayPrice.toFixed(0)}
              </span>
            )}
          </div>
        )}

        {/* Message display or edit textarea */}
        {decision === "editing" ? (
          <textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            rows={6}
            style={{
              display: "block",
              width: "100%",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              padding: "12px 14px",
              fontSize: "12px",
              color: "#e2e2f0",
              border: "1px solid rgba(99,102,241,0.35)",
              outline: "none",
              resize: "vertical",
              marginBottom: "12px",
              fontFamily: "inherit",
              lineHeight: 1.6,
            }}
          />
        ) : (
          <div
            className="mb-3 whitespace-pre-wrap"
            style={{
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              padding: "12px 14px",
              fontSize: "12px",
              color: "#7878a0",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {message || "Drafting message..."}
          </div>
        )}

        {/* Error */}
        {sendError && (
          <div
            className="mb-2"
            style={{
              fontSize: "11px",
              color: "#ef4444",
              padding: "6px 10px",
              borderRadius: "8px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {sendError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {decision === "editing" ? (
            <>
              <button
                onClick={() => void handleSend(editedMessage)}
                className="interactive focus-ring"
                style={{
                  borderRadius: "10px",
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#10b981",
                }}
              >
                Send this message
              </button>
              <button
                onClick={() => setDecision("pending")}
                className="interactive focus-ring"
                style={{
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#7878a0",
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => void handleSend(message)}
                disabled={decision === "sending"}
                className="interactive focus-ring"
                style={{
                  borderRadius: "10px",
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#10b981",
                  opacity: decision === "sending" ? 0.6 : 1,
                }}
              >
                {decision === "sending" ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Sending…
                  </span>
                ) : (
                  "Send this message"
                )}
              </button>
              <button
                onClick={() => setDecision("editing")}
                disabled={decision === "sending"}
                className="interactive focus-ring flex items-center gap-1.5"
                style={{
                  borderRadius: "10px",
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#818cf8",
                }}
              >
                <Edit2 className="h-3 w-3" />
                Edit before sending
              </button>
              <button
                onClick={() => setDecision("declined")}
                disabled={decision === "sending"}
                className="interactive focus-ring"
                style={{
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#7878a0",
                }}
              >
                Skip negotiation
              </button>
            </>
          )}
        </div>
      </div>
    </ToolScrollRail>
  );
}

// ── ContactSellerUI — tool_name: "contact_seller" ─────────────────
// Alias registration in case backend emits "contact_seller" instead of "draft_seller_message"

export const ContactSellerUI = makeAssistantToolUI<
  {
    listing_title?: string;
    listing_url?: string;
    seller_name?: string;
    offer_price?: number;
    opening_message?: string;
    message?: string;
    recommended_offer?: number;
    walk_away_price?: number;
  },
  {
    seller_name?: string;
    listing_title?: string;
    listing_url?: string;
    message?: string;
    opening_message?: string;
    recommended_offer?: number;
    walk_away_price?: number;
    status?: string;
  }
>({
  toolName: "contact_seller",
  render: ({ args, status, result }) => {
    const isRunning = status.type === "running";
    const resultData = result as typeof result | undefined;

    if (isRunning) {
      return (
        <ToolScrollRail animate={false}>
          <div
            className="glass my-2 w-full"
            style={{ maxWidth: "440px", borderRadius: "18px", padding: "16px 18px" }}
          >
            <div
              className="flex items-center gap-2"
              style={{ fontSize: "14px", fontWeight: 500, color: "#e2e2f0" }}
            >
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#6366f1" }} />
              Drafting message to seller…
            </div>
          </div>
        </ToolScrollRail>
      );
    }

    const sellerName = resultData?.seller_name ?? args.seller_name ?? "Seller";
    const listingTitle = resultData?.listing_title ?? args.listing_title ?? "Listing";
    const listingUrl = resultData?.listing_url ?? args.listing_url ?? "";
    const message =
      resultData?.message ??
      resultData?.opening_message ??
      args.opening_message ??
      args.message ??
      "";
    const recommendedOffer = resultData?.recommended_offer ?? args.recommended_offer;
    const walkAwayPrice = resultData?.walk_away_price ?? args.walk_away_price;

    return (
      <ContactApprovalCard
        sellerName={sellerName}
        listingTitle={listingTitle}
        listingUrl={listingUrl}
        message={message}
        recommendedOffer={recommendedOffer}
        walkAwayPrice={walkAwayPrice}
      />
    );
  },
});
