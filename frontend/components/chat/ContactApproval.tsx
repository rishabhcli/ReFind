"use client";

import { useState } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { Mail, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const DraftMessageUI = makeAssistantToolUI<
  {
    listing_title?: string;
    seller_name?: string;
    offer_price?: number;
    user_name?: string;
  },
  {
    seller_name?: string;
    listing_title?: string;
    message?: string;
    requires_approval?: boolean;
    status?: string;
  }
>({
  toolName: "draft_seller_message",
  render: ({ args, status, result }) => {
    const isRunning = status.type === "running";
    const resultData = result as {
      message?: string;
      seller_name?: string;
      listing_title?: string;
      status?: string;
    } | undefined;

    if (isRunning) {
      return (
        <div className="glass my-2 w-full" style={{ maxWidth: '440px', borderRadius: '18px', padding: '16px 18px' }}>
          <div className="flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 500, color: '#e2e2f0' }}>
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#6366f1' }} />
            Drafting message to seller…
          </div>
        </div>
      );
    }

    return (
      <ContactApprovalCard
        sellerName={resultData?.seller_name ?? args.seller_name ?? "Seller"}
        listingTitle={resultData?.listing_title ?? args.listing_title ?? "Listing"}
        message={resultData?.message ?? ""}
      />
    );
  },
});

function ContactApprovalCard({
  sellerName,
  listingTitle,
  message,
}: {
  sellerName: string;
  listingTitle: string;
  message: string;
}) {
  const [decision, setDecision] = useState<"pending" | "approved" | "declined">(
    "pending",
  );

  if (decision === "approved") {
    return (
      <div className="my-2 flex w-full items-center gap-2" style={{ maxWidth: '440px', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.08)', padding: '12px 16px', fontSize: '14px', color: '#10b981' }}>
        <CheckCircle2 className="h-4 w-4" />
        Message to {sellerName} approved
      </div>
    );
  }

  if (decision === "declined") {
    return (
      <div className="my-2 flex w-full items-center gap-2" style={{ maxWidth: '440px', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', padding: '12px 16px', fontSize: '14px', color: '#ef4444' }}>
        <XCircle className="h-4 w-4" />
        Message to {sellerName} declined
      </div>
    );
  }

  return (
    <div className="glass my-2 w-full" style={{ maxWidth: '440px', borderRadius: '18px', padding: '16px 18px' }}>
      <div className="mb-2 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 500, color: '#e2e2f0' }}>
        <Mail className="h-4 w-4" style={{ color: '#6366f1' }} />
        Message to {sellerName} — {listingTitle}
      </div>
      <div className="mb-3 whitespace-pre-wrap" style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.04)', padding: '12px 14px', fontSize: '12px', color: '#7878a0', border: '1px solid rgba(255,255,255,0.06)' }}>
        {message || "Drafting message..."}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setDecision("approved")}
          className="interactive focus-ring"
          style={{ borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 18px', fontSize: '12px', fontWeight: 500, color: '#10b981' }}
        >
          Approve & Send
        </button>
        <button
          onClick={() => setDecision("declined")}
          className="interactive focus-ring"
          style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 18px', fontSize: '12px', fontWeight: 500, color: '#7878a0' }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
