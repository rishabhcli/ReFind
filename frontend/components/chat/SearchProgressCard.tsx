"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ToolScrollRail } from "./ToolScrollRail";

// ── Source config ─────────────────────────────────────────────────

const SOURCE_CONFIG: Record<
  string,
  { label: string; dotColor: string }
> = {
  search_ebay: { label: "eBay", dotColor: "#e53238" },
  search_mercari: { label: "Mercari", dotColor: "#f43f5e" },
  search_craigslist: { label: "Craigslist", dotColor: "#f97316" },
  search_goodwill: { label: "Goodwill", dotColor: "#10b981" },
  search_offerup: { label: "OfferUp", dotColor: "#38bdf8" },
  search_facebook: { label: "Facebook", dotColor: "#8b5cf6" },
  search_facebook_marketplace: { label: "Facebook", dotColor: "#8b5cf6" },
  search_poshmark: { label: "Poshmark", dotColor: "#c93c8f" },
  browser_enricher: { label: "Enriching top deals", dotColor: "#6366f1" },
};

// ── Shared render ─────────────────────────────────────────────────

function SearchToolBadge({
  toolName,
  status,
  result,
}: {
  toolName: string;
  status: { type: string };
  result?: { count?: number; status?: string } | undefined;
}) {
  const config = SOURCE_CONFIG[toolName] ?? {
    label: toolName,
    dotColor: "#7878a0",
  };
  const isRunning = status.type === "running";
  const isError = (result as { status?: string } | undefined)?.status === "error";
  const count = (result as { count?: number } | undefined)?.count;
  const done = !isRunning && !isError;

  return (
    <ToolScrollRail animate={false} className="my-1">
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium shadow-sm shadow-black/20"
      style={{
        borderRadius: '999px',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: 500,
        color: done ? '#10b981' : isError ? '#ef4444' : '#7878a0',
        background: done ? 'rgba(16,185,129,0.08)' : isError ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
        border: done ? '1px solid rgba(16,185,129,0.25)' : isError ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.09)',
        transition: 'background 250ms ease, border 250ms ease, box-shadow 250ms ease',
      }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: config.dotColor, display: 'inline-block' }} />
        {isRunning ? (
          <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#7878a0' }} />
        ) : isError ? (
          <XCircle className="h-3 w-3" style={{ color: '#ef4444' }} />
        ) : (
          <CheckCircle2 className="h-3 w-3" style={{ color: '#10b981' }} />
        )}
        {config.label}
        {!isRunning && count != null && (
          <span style={{ opacity: 0.7 }}>· {count}</span>
        )}
        {isRunning ? "…" : ""}
      </span>
    </ToolScrollRail>
  );
}

// ── One export per tool name (makeAssistantToolUI requires a fixed toolName) ──

type SearchArgs = { query?: string; max_price?: number; zip_code?: string };
type SearchResult = { count?: number; status?: string };

export const MercariSearchUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "search_mercari",
  render: ({ status, result }) => (
    <SearchToolBadge toolName="search_mercari" status={status} result={result} />
  ),
});

export const CraigslistSearchUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "search_craigslist",
  render: ({ status, result }) => (
    <SearchToolBadge toolName="search_craigslist" status={status} result={result} />
  ),
});

// Keep old name for backward compat
export const SearchProgressUI = CraigslistSearchUI;

export const GoodwillSearchUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "search_goodwill",
  render: ({ status, result }) => (
    <SearchToolBadge toolName="search_goodwill" status={status} result={result} />
  ),
});

export const OfferUpSearchUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "search_offerup",
  render: ({ status, result }) => (
    <SearchToolBadge toolName="search_offerup" status={status} result={result} />
  ),
});

export const FacebookSearchUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "search_facebook",
  render: ({ status, result }) => (
    <SearchToolBadge toolName="search_facebook" status={status} result={result} />
  ),
});

export const FBSearchUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "search_facebook_marketplace",
  render: ({ status, result }) => (
    <SearchToolBadge toolName="search_facebook_marketplace" status={status} result={result} />
  ),
});

export const EbaySearchUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "search_ebay",
  render: ({ status, result }) => (
    <SearchToolBadge toolName="search_ebay" status={status} result={result} />
  ),
});

export const PoshmarkSearchUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "search_poshmark",
  render: ({ status, result }) => (
    <SearchToolBadge toolName="search_poshmark" status={status} result={result} />
  ),
});

export const BrowserEnricherUI = makeAssistantToolUI<
  { count?: number },
  { status?: string }
>({
  toolName: "browser_enricher",
  render: ({ status, result }) => (
    <SearchToolBadge toolName="browser_enricher" status={status} result={result} />
  ),
});
