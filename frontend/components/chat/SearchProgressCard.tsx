"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Loader2, CheckCircle2, Globe } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  search_craigslist: "Craigslist",
  search_facebook_marketplace: "Facebook Marketplace",
  search_offerup: "OfferUp",
};

const SOURCE_COLORS: Record<string, string> = {
  search_craigslist: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  search_facebook_marketplace: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  search_offerup: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

/**
 * Shared tool UI for all 3 search tools. Shows a progress badge
 * while the search is running, then a completed badge with result.
 */
function SearchToolUI({
  toolName,
  status,
}: {
  toolName: string;
  args: Record<string, unknown>;
  status: { type: string };
  result?: unknown;
}) {
  const label = SOURCE_LABELS[toolName] ?? toolName;
  const colorClass = SOURCE_COLORS[toolName] ?? "bg-muted text-muted-foreground";
  const isRunning = status.type === "running";

  return (
    <div className="my-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${colorClass}`}>
        {isRunning ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3 w-3" />
        )}
        <Globe className="h-3 w-3" />
        {label}
        {isRunning ? "…" : " ✓"}
      </span>
    </div>
  );
}

// Register a single UI component for each search tool name
export const SearchProgressUI = makeAssistantToolUI<
  { query: string; max_price?: number },
  { status: string; source?: string }
>({
  toolName: "search_craigslist",
  render: (props) => (
    <SearchToolUI
      toolName="search_craigslist"
      args={props.args as Record<string, unknown>}
      status={props.status}
      result={props.result}
    />
  ),
});

// We need separate registrations per tool name.
// Export them all from ToolUIs.tsx by rendering multiple.
// For the hackathon, combine all 3 into a single component below.

export const FBSearchUI = makeAssistantToolUI<
  { query: string; max_price?: number },
  { status: string; source?: string }
>({
  toolName: "search_facebook_marketplace",
  render: (props) => (
    <SearchToolUI
      toolName="search_facebook_marketplace"
      args={props.args as Record<string, unknown>}
      status={props.status}
      result={props.result}
    />
  ),
});

export const OfferUpSearchUI = makeAssistantToolUI<
  { query: string; max_price?: number },
  { status: string; source?: string }
>({
  toolName: "search_offerup",
  render: (props) => (
    <SearchToolUI
      toolName="search_offerup"
      args={props.args as Record<string, unknown>}
      status={props.status}
      result={props.result}
    />
  ),
});
