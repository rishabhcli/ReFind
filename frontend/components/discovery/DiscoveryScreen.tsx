"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Zap } from "lucide-react";

interface Listing {
  source: string;
  source_item_id: string;
  url: string;
  title: string;
  price: number;
  condition: string;
  image_urls: string[];
  location_text: string;
  deal_score: number;
  fair_value_low: number;
  fair_value_high: number;
}

interface TrendingData {
  Electronics: Listing[];
  Furniture: Listing[];
  Sports: Listing[];
}

const CATEGORIES = ["Electronics", "Furniture", "Sports"] as const;
type Category = (typeof CATEGORIES)[number];

const COLUMN_CONFIG: Record<Category, { emoji: string; color: string; duration: number }> = {
  Electronics: { emoji: "⚡",  color: "#818cf8", duration: 28 },
  Furniture:   { emoji: "🛋️", color: "#fbbf24", duration: 38 },
  Sports:      { emoji: "🚴", color: "#34d399", duration: 22 },
};

const SOURCE_COLORS: Record<string, string> = {
  mercari: "#f43f5e", craigslist: "#f97316",
  offerup: "#38bdf8", facebook: "#8b5cf6", goodwill: "#10b981",
};

const CONDITION_LABEL: Record<string, string> = {
  new: "New", like_new: "Like New", good: "Good", fair: "Fair", poor: "Poor",
};

function SkeletonCard() {
  return (
    <div style={{ borderRadius: "14px", overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
      <div style={{ height: "130px", background: "rgba(255,255,255,0.05)" }} />
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "7px" }}>
        <div style={{ height: "9px", background: "rgba(255,255,255,0.05)", borderRadius: "5px", width: "75%" }} />
        <div style={{ height: "14px", background: "rgba(255,255,255,0.05)", borderRadius: "5px", width: "40%" }} />
        <div style={{ height: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", width: "48px" }} />
      </div>
    </div>
  );
}

function SlotCard({ listing }: { listing: Listing }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = !imgError && listing.image_urls?.[0] ? listing.image_urls[0] : null;
  const dotColor = SOURCE_COLORS[listing.source] ?? "#7878a0";
  const condLabel = CONDITION_LABEL[listing.condition] ?? listing.condition;

  return (
    <a
      href={listing.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block", borderRadius: "14px", overflow: "hidden",
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        textDecoration: "none", flexShrink: 0, transition: "border-color 180ms, transform 180ms",
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(255,255,255,0.2)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(255,255,255,0.08)";
        el.style.transform = "translateY(0)";
      }}
    >
      <div style={{ height: "130px", background: "rgba(255,255,255,0.03)", overflow: "hidden", position: "relative" }}>
        {imgSrc
          ? <img src={imgSrc} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setImgError(true)} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", color: "rgba(255,255,255,0.08)" }}>🖼️</div>
        }
        <div style={{ position: "absolute", top: "7px", left: "7px" }}>
          <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "999px", background: "rgba(5,5,10,0.7)", backdropFilter: "blur(8px)", color: "#e2e2f0", border: "1px solid rgba(255,255,255,0.1)", textTransform: "capitalize", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: dotColor, display: "inline-block" }} />
            {listing.source}
          </span>
        </div>
        {listing.deal_score > 0 && (
          <div style={{ position: "absolute", top: "7px", right: "7px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px", background: "rgba(5,5,10,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", color: listing.deal_score >= 75 ? "#10b981" : listing.deal_score >= 50 ? "#f59e0b" : "#e2e2f0" }}>
              {listing.deal_score}/100
            </span>
          </div>
        )}
      </div>
      <div style={{ padding: "10px 12px 11px" }}>
        <p style={{ fontSize: "12px", color: "#c4c4e0", lineHeight: "1.45", marginBottom: "6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
          {listing.title}
        </p>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#f59e0b" }}>${listing.price.toFixed(0)}</span>
          {listing.fair_value_high > 0 && (
            <span style={{ fontSize: "10px", color: "#4a4a6a" }}>
              ~${listing.fair_value_low.toFixed(0)}&ndash;${listing.fair_value_high.toFixed(0)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
          {listing.condition && (
            <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)", color: "#6a6a8a" }}>{condLabel}</span>
          )}
          {listing.location_text && (
            <span style={{ fontSize: "10px", color: "#4a4a6a" }}>📍 {listing.location_text}</span>
          )}
        </div>
      </div>
    </a>
  );
}

function SlotColumn({
  category,
  listings,
  loading,
}: {
  category: Category;
  listings: Listing[];
  loading: boolean;
}) {
  const config = COLUMN_CONFIG[category];
  const [paused, setPaused] = useState(false);
  const copies = listings.length >= 6 ? 2 : listings.length >= 3 ? 3 : 4;
  const loopItems = listings.length > 0
    ? Array.from({ length: copies }, () => listings).flat()
    : [];

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, padding: "0 2px" }}>
        <span style={{ fontSize: "13px" }}>{config.emoji}</span>
        <span style={{ fontSize: "10.5px", fontWeight: 700, color: config.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {category}
        </span>
        {!loading && listings.length > 0 && (
          <span style={{ fontSize: "10px", color: "#3a3a55" }}>{listings.length}</span>
        )}
      </div>
      <div
        style={{ flex: 1, overflow: "hidden", position: "relative", borderRadius: "10px" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "56px", background: "linear-gradient(to bottom, rgba(5,5,10,1) 0%, transparent 100%)", zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "56px", background: "linear-gradient(to top, rgba(5,5,10,1) 0%, transparent 100%)", zIndex: 2, pointerEvents: "none" }} />
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : loopItems.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              paddingBottom: "10px",
              animation: `slot-scroll-up ${config.duration}s linear infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {loopItems.map((listing, i) => (
              <SlotCard key={`${listing.source_item_id}-${i}`} listing={listing} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "160px", fontSize: "11px", color: "#3a3a55", textAlign: "center", lineHeight: "1.6" }}>
            No listings available right now.
          </div>
        )}
      </div>
    </div>
  );
}

export function DiscoveryScreen({
  visible,
  embedded,
  layout,
  showChatCta = true,
}: {
  visible?: boolean;
  embedded?: boolean;
  layout?: string;
  showChatCta?: boolean;
}) {
  // layout="embedded" is an alias for embedded={true}
  const isEmbedded = embedded || layout === "embedded";
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrending = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/trending");
      if (res.ok) setData(await res.json());
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
    intervalRef.current = setInterval(() => fetchTrending(true), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", color: "#e2e2f0", opacity: visible === false ? 0 : 1, pointerEvents: visible === false ? "none" : "auto" }}>
      {!isEmbedded && (
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: "56px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(5,5,10,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(99,102,241,0.45)" }}>
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="gradient-text" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.025em" }}>ReFind</span>
          </div>
          {showChatCta && (
            <Link
              href="/chat"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "999px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", padding: "8px 18px", fontSize: "13px", fontWeight: 600, color: "#fff", textDecoration: "none", boxShadow: "0 4px 14px rgba(99,102,241,0.45)" }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Start searching
            </Link>
          )}
        </nav>
      )}
      {isEmbedded && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 4px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#3a3a55", letterSpacing: "0.06em" }}>TRENDING NOW</span>
            <span className="pulse-green" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          </div>
          <span style={{ fontSize: "10px", color: "#2e2e48" }}>Live · 30s refresh</span>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", gap: isEmbedded ? "10px" : "14px", padding: isEmbedded ? "0 14px" : "14px 24px 0", overflow: "hidden", minHeight: 0 }}>
        {CATEGORIES.map((cat) => (
          <SlotColumn
            key={cat}
            category={cat}
            listings={data?.[cat] ?? []}
            loading={loading}
          />
        ))}
      </div>
      {!isEmbedded && showChatCta && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexShrink: 0 }}>
          <span style={{ fontSize: "12px", color: "#3a3a55" }}>Not finding what you want?</span>
          <Link href="/chat" style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: "#818cf8", textDecoration: "none" }}>
            <MessageCircle className="h-3 w-3" />
            Let AI search for you
          </Link>
        </div>
      )}
    </div>
  );
}
