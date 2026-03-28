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
        <div className="my-2 w-full max-w-md rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
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
      <div className="my-2 flex w-full max-w-md items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
        <CheckCircle2 className="h-4 w-4" />
        Message to {sellerName} approved
      </div>
    );
  }

  if (decision === "declined") {
    return (
      <div className="my-2 flex w-full max-w-md items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
        <XCircle className="h-4 w-4" />
        Message to {sellerName} declined
      </div>
    );
  }

  return (
    <div className="my-2 w-full max-w-md rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Mail className="h-4 w-4 text-accent" />
        Message to {sellerName} — {listingTitle}
      </div>
      <div className="mb-3 whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        {message || "Drafting message..."}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setDecision("approved")}
          className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          Approve & Send
        </button>
        <button
          onClick={() => setDecision("declined")}
          className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
