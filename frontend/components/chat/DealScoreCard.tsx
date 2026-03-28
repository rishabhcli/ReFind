"use client";

import type { CSSProperties } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  TrendingUp,
  Loader2,
  ExternalLink,
  MessageCircle,
  MapPin,
  Star,
} from "lucide-react";
import { ToolScrollRail } from "./ToolScrollRail";

// ── score_deal status indicator ──────────────────────────────────
export const ScoreDealUI = makeAssistantToolUI<
  { query?: string },
  { status: string; count?: number }
>({
  toolName: "score_deal",
  render: ({ status, result }) => {
    const isRunning = status.type === "running";
    const count = (result as { count?: number } | undefined)?.count;
    return (
      <ToolScrollRail animate={false}>
        <div
          className="inline-flex items-center gap-2 rounded-full border px-2.5 py-2 text-xs"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: isRunning ? '#7878a0' : '#e2e2f0',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#6366f1' }} />
              Scoring &amp; ranking deals…
            </>
          ) : (
            <>
              <TrendingUp className="h-3.5 w-3.5" style={{ color: '#6366f1' }} />
              {count != null ? `Top ${count} deals ranked` : "Deals ranked"}
            </>
          )}
        </div>
      </ToolScrollRail>
    );
  },
});

// ── Types ─────────────────────────────────────────────────────────

interface ListingCandidate {
  source: string;
  source_item_id: string;
  url: string;
  title: string;
  price: number;
  condition: string;
  image_urls: string[];
  description: string;
  seller_name: string;
  seller_rating: number;
  seller_review_count?: number;
  location_text: string;
  deal_score: number;
  fair_value_low: number;
  fair_value_high: number;
  recommended_offer: number;
  value_gap_pct: number;
  // 7-dimension scores
  score_value_gap?: number;
  score_distance?: number;
  score_condition?: number;
  score_seller_rep?: number;
  score_freshness?: number;
  score_image_quality?: number;
  score_description?: number;
  // Enrichment fields
  full_description?: string;
  condition_notes?: string;
  seller_username?: string;
  shipping_cost?: number;
  pickup_available?: boolean;
  additional_images?: string[];
  payment_notes?: string;
}

const SOURCE_DOT_COLORS: Record<string, string> = {
  ebay:       "#e53238",
  mercari:    "#f43f5e",
  craigslist: "#f97316",
  offerup:    "#38bdf8",
  facebook:   "#8b5cf6",
  goodwill:   "#10b981",
  poshmark:   "#c93c8f",
};

const CONDITION_LABEL: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

function ScoreBar({ value }: { value: number }) {
  const barColor = value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
  const textColor = value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 overflow-hidden" style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', borderRadius: '999px', background: barColor, width: `${value}%`, transition: 'width 500ms ease' }} />
      </div>
      <span style={{ fontSize: '15px', fontWeight: 700, color: textColor, tabularNums: 'tabular-nums' } as CSSProperties}>{Math.round(value)}</span>
    </div>
  );
}

function DimensionBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const barColor = value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5" style={{ fontSize: '10px' }}>
      <span style={{ width: '58px', color: '#5a5a7a', flexShrink: 0 }}>{label} <span style={{ opacity: 0.5 }}>{weight}</span></span>
      <div className="flex-1 overflow-hidden" style={{ height: '4px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ height: '100%', borderRadius: '999px', background: barColor, width: `${value}%`, transition: 'width 400ms ease' }} />
      </div>
      <span style={{ width: '22px', textAlign: 'right', color: '#7878a0', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}</span>
    </div>
  );
}

// ── shortlist_result full deal card ──────────────────────────────

function ShortlistCard({ listing }: { listing: ListingCandidate }) {
  const dotColor = SOURCE_DOT_COLORS[listing.source] ?? "#7878a0";
  const conditionLabel = CONDITION_LABEL[listing.condition] ?? listing.condition;
  const hasFairValue = listing.fair_value_high > 0;
  const hasRecommended = listing.recommended_offer > 0;
  const valueGapPct = Math.round(listing.value_gap_pct * 100);
  const imgSrc = listing.image_urls?.[0];

  const handleDraftMessage = () => {
    const ta = document.querySelector(
      "[data-aui-composer-input]"
    ) as HTMLTextAreaElement | null;
    if (!ta) return;
    const offer = hasRecommended
      ? listing.recommended_offer.toFixed(0)
      : listing.price.toFixed(0);
    const msg = `Draft a message to the seller for "${listing.title}" with an offer of $${offer}`;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    setter?.call(ta, msg);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.focus();
  };

  return (
    <ToolScrollRail animate={false} className="my-2">
      <div
        className="glass w-full overflow-hidden"
        style={{
          maxWidth: '400px',
          borderRadius: '18px',
        }}
      >
      {/* Image */}
      {imgSrc && (
        <div className="relative overflow-hidden" style={{ height: '160px', background: 'rgba(255,255,255,0.02)' }}>
          <img
            src={imgSrc}
            alt={listing.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
          <div className="absolute top-2 left-2">
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(5,5,10,0.6)',
                backdropFilter: 'blur(8px)',
                color: '#e2e2f0',
                border: '1px solid rgba(255,255,255,0.1)',
                textTransform: 'capitalize',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
              {listing.source}
            </span>
          </div>
          {listing.deal_score > 0 && (
            <div className="absolute top-2 right-2" style={{ background: 'rgba(5,5,10,0.6)', backdropFilter: 'blur(8px)', borderRadius: '999px', padding: '4px 10px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: listing.deal_score >= 75 ? '#10b981' : listing.deal_score >= 50 ? '#f59e0b' : '#e2e2f0' }}>
                {listing.deal_score}/100
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '16px 18px' }} className="space-y-3">
        {!imgSrc && (
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e2f0', textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
              {listing.source}
            </span>
          </div>
        )}

        <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#e2e2f0', lineHeight: '1.4' }} className="line-clamp-2">{listing.title}</h3>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>${listing.price.toFixed(0)}</span>
            {hasFairValue && (
              <span style={{ marginLeft: '8px', fontSize: '13px', color: '#7878a0' }}>
                ${listing.fair_value_low.toFixed(0)}–${listing.fair_value_high.toFixed(0)}
              </span>
            )}
          </div>
          {valueGapPct > 0 && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: '999px' }}>
              {valueGapPct}% below
            </span>
          )}
        </div>

        {/* 7-Dimension score bars */}
        {listing.deal_score > 0 && (
          <div className="space-y-1.5">
            <p style={{ fontSize: '11px', color: '#3a3a55', fontWeight: 600 }}>Deal Score: {listing.deal_score.toFixed(0)}/100</p>
            <ScoreBar value={listing.deal_score} />
            {listing.score_value_gap != null && (
              <div className="space-y-0.5 mt-1">
                <DimensionBar label="Value" value={listing.score_value_gap} weight="35%" />
                <DimensionBar label="Distance" value={listing.score_distance ?? 0} weight="20%" />
                <DimensionBar label="Condition" value={listing.score_condition ?? 0} weight="15%" />
                <DimensionBar label="Seller" value={listing.score_seller_rep ?? 0} weight="10%" />
                <DimensionBar label="Freshness" value={listing.score_freshness ?? 0} weight="10%" />
                <DimensionBar label="Photos" value={listing.score_image_quality ?? 0} weight="5%" />
                <DimensionBar label="Description" value={listing.score_description ?? 0} weight="5%" />
              </div>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '12px', color: '#7878a0' }}>
          <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)' }}>{conditionLabel}</span>
          {listing.seller_rating > 0 && listing.seller_name && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" style={{ color: '#f59e0b' }} />
              {listing.seller_rating.toFixed(1)} · {listing.seller_name}
            </span>
          )}
          {listing.location_text && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {listing.location_text}
            </span>
          )}
        </div>

        {/* Recommended offer */}
        {hasRecommended && (
          <div style={{ borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '8px 14px', fontSize: '12px' }}>
            <span style={{ color: '#3a3a55' }}>Suggest offering </span>
            <span style={{ fontWeight: 600, color: '#6366f1', fontSize: '15px' }}>${listing.recommended_offer.toFixed(0)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {listing.url && (
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="interactive focus-ring flex-1 flex items-center justify-center gap-1.5"
              style={{
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#e2e2f0',
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open listing
            </a>
          )}
          <button
            onClick={handleDraftMessage}
            className="interactive focus-ring flex-1 flex items-center justify-center gap-1.5"
            style={{
              borderRadius: '10px',
              border: '1px solid rgba(99,102,241,0.3)',
              background: 'rgba(99,102,241,0.1)',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6366f1',
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Draft message
          </button>
        </div>
      </div>
    </div>
    </ToolScrollRail>
  );
}

export const ShortlistResultUI = makeAssistantToolUI<
  { listing: ListingCandidate },
  Record<string, never>
>({
  toolName: "shortlist_result",
  render: ({ args, status }) => {
    if (status.type === "running" || !args?.listing) {
      return (
        <ToolScrollRail animate={false}>
          <div className="my-2 flex items-center gap-2 rounded-full border px-2.5 py-2 text-xs text-muted-foreground shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading deal…
          </div>
        </ToolScrollRail>
      );
    }
    return <ShortlistCard listing={args.listing} />;
  },
});


interface NegotiateArgs {
  listing_id?: string;
  seller_name?: string;
  opening_message?: string;
  recommended_offer?: number;
  walk_away_price?: number;
  tone?: string;
}

export const NegotiateStrategyUI = makeAssistantToolUI<NegotiateArgs, { status?: string }>({
  toolName: "negotiate_strategy",
  render: ({ args, status }) => {
    const isRunning = status.type === "running";
    if (isRunning || !args) {
      return (
        <ToolScrollRail animate={false}>
          <div className="my-2 flex items-center gap-2 rounded-full border px-2.5 py-2 text-xs text-muted-foreground shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating negotiation strategy…
          </div>
        </ToolScrollRail>
      );
    }
    return (
      <ToolScrollRail animate={false}>
        <div className="glass my-2 w-full" style={{ maxWidth: '440px', borderRadius: '18px', padding: '16px 18px' }}>
          <div className="mb-2 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 500, color: '#e2e2f0' }}>
            <MessageCircle className="h-4 w-4" style={{ color: '#6366f1' }} />
            Negotiation Strategy — {args.seller_name ?? "Seller"}
          </div>
          <div className="mb-2 flex gap-2 flex-wrap" style={{ fontSize: '11px' }}>
            <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              Offer: ${args.recommended_offer?.toFixed(0) ?? "—"}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              Walk-away: ${args.walk_away_price?.toFixed(0) ?? "—"}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: '#7878a0', textTransform: 'capitalize' }}>
              {args.tone ?? "friendly"} tone
            </span>
          </div>
          <div className="mb-3 whitespace-pre-wrap" style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.04)', padding: '12px 14px', fontSize: '12px', color: '#7878a0', border: '1px solid rgba(255,255,255,0.06)' }}>
            {args.opening_message ?? "Preparing message…"}
          </div>
          <div className="flex gap-2">
            <button className="interactive focus-ring" style={{ borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '8px 18px', fontSize: '12px', fontWeight: 500, color: '#10b981' }}>
              Send this message
            </button>
            <button className="interactive focus-ring" style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 18px', fontSize: '12px', fontWeight: 500, color: '#7878a0' }}>
              Edit
            </button>
            <button className="interactive focus-ring" style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 18px', fontSize: '12px', fontWeight: 500, color: '#7878a0' }}>
              Skip
            </button>
          </div>
        </div>
      </ToolScrollRail>
    );
  },
});
