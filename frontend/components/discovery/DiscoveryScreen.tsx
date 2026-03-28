"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bike,
  MessageCircle,
  Monitor,
  Sofa,
  Sparkles,
} from "lucide-react";
import {
  PlatformLogo,
  ImagePlaceholderIcon,
} from "@/components/icons/PlatformIcons";

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

const COLUMN_CONFIG: Record<
  Category,
  { icon: typeof Monitor; color: string; duration: number; label: string }
> = {
  Electronics: {
    icon: Monitor,
    color: "#95a9b8",
    duration: 24,
    label: "Audio, gaming, cameras",
  },
  Furniture: {
    icon: Sofa,
    color: "#c79f65",
    duration: 34,
    label: "Home pieces under budget",
  },
  Sports: {
    icon: Bike,
    color: "#8fa58a",
    duration: 28,
    label: "Bikes and gear in motion",
  },
};

const SOURCE_STYLES: Record<
  string,
  { background: string; borderColor: string; color: string }
> = {
  mercari: {
    background: "rgba(244, 63, 94, 0.12)",
    borderColor: "rgba(244, 63, 94, 0.28)",
    color: "#fb7185",
  },
  craigslist: {
    background: "rgba(249, 115, 22, 0.12)",
    borderColor: "rgba(249, 115, 22, 0.28)",
    color: "#fb923c",
  },
  offerup: {
    background: "rgba(14, 165, 233, 0.12)",
    borderColor: "rgba(14, 165, 233, 0.28)",
    color: "#38bdf8",
  },
  facebook: {
    background: "rgba(139, 92, 246, 0.12)",
    borderColor: "rgba(139, 92, 246, 0.28)",
    color: "#a78bfa",
  },
  goodwill: {
    background: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.28)",
    color: "#34d399",
  },
};

const CONDITION_LABEL: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

function scoreStyles(score: number) {
  if (score > 75) {
    return {
      background: "rgba(16, 185, 129, 0.18)",
      borderColor: "rgba(16, 185, 129, 0.28)",
      color: "#34d399",
    };
  }

  if (score >= 50) {
    return {
      background: "rgba(245, 158, 11, 0.16)",
      borderColor: "rgba(245, 158, 11, 0.28)",
      color: "#fbbf24",
    };
  }

  return {
    background: "rgba(239, 68, 68, 0.16)",
    borderColor: "rgba(239, 68, 68, 0.28)",
    color: "#fca5a5",
  };
}

function SkeletonCard() {
  return (
    <div
      style={{
        borderRadius: "22px",
        overflow: "hidden",
        background: "var(--card-strong)",
        border: "1px solid var(--border)",
        flexShrink: 0,
        minHeight: "276px",
        animation: "skeleton-pulse 1.8s ease-in-out infinite",
      }}
    >
      <div style={{ height: "156px", background: "rgba(255,255,255,0.03)" }} />
      <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ height: "11px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", width: "76%" }} />
        <div style={{ height: "11px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", width: "58%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ height: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", width: "72px" }} />
          <div style={{ height: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "999px", width: "44px" }} />
        </div>
      </div>
    </div>
  );
}

function SlotCard({ listing }: { listing: Listing }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = !imgError && listing.image_urls?.[0] ? listing.image_urls[0] : null;
  const conditionLabel = CONDITION_LABEL[listing.condition] ?? listing.condition;
  const sourceStyle = SOURCE_STYLES[listing.source] ?? {
    background: "rgba(104, 114, 123, 0.18)",
    borderColor: "rgba(104, 114, 123, 0.3)",
    color: "#c7cdd2",
  };
  const badgeStyle = scoreStyles(listing.deal_score);

  return (
    <a
      href={listing.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        borderRadius: "22px",
        overflow: "hidden",
        background: "var(--card-strong)",
        border: "1px solid var(--border)",
        textDecoration: "none",
        flexShrink: 0,
        boxShadow: "var(--shadow-md)",
        transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.borderColor = "var(--border-strong)";
        el.style.boxShadow = "var(--shadow-lg)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.borderColor = "var(--border)";
        el.style.boxShadow = "var(--shadow-md)";
      }}
    >
      <div
        style={{
          height: "156px",
          background: "rgba(255,255,255,0.02)",
          overflow: "hidden",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={listing.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="flex h-full items-center justify-center"
            style={{ color: "var(--text-dim)" }}
          >
            <ImagePlaceholderIcon size={28} />
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "14px",
          minHeight: "120px",
        }}
      >
        <div
          style={{
            minHeight: "44px",
            fontSize: "13px",
            lineHeight: 1.45,
            color: "var(--card-foreground)",
            fontWeight: 600,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {listing.title}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--amber)",
              letterSpacing: "-0.03em",
            }}
          >
            ${listing.price.toFixed(0)}
          </span>

          {listing.fair_value_high > 0 ? (
            <span
              style={{
                fontSize: "11px",
                color: "var(--muted-foreground)",
                textAlign: "right",
              }}
            >
              fair ${listing.fair_value_low.toFixed(0)}-{listing.fair_value_high.toFixed(0)}
            </span>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "999px",
                border: `1px solid ${sourceStyle.borderColor}`,
                background: sourceStyle.background,
                color: sourceStyle.color,
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <PlatformLogo source={listing.source} size={14} />
              {listing.source}
            </span>

            <span
              className="truncate"
              style={{
                fontSize: "11px",
                color: "var(--muted-foreground)",
              }}
            >
              {conditionLabel}
              {listing.location_text ? ` • ${listing.location_text}` : ""}
            </span>
          </div>

          {listing.deal_score > 0 ? (
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "999px",
                border: `1px solid ${badgeStyle.borderColor}`,
                background: badgeStyle.background,
                color: badgeStyle.color,
                fontSize: "11px",
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              {listing.deal_score}
            </span>
          ) : null}
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
  const Icon = config.icon;
  const [paused, setPaused] = useState(false);

  const copies = listings.length >= 6 ? 2 : listings.length >= 3 ? 3 : 4;
  const loopItems = listings.length > 0
    ? Array.from({ length: copies }, () => listings).flat()
    : [];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div
        className="surface-panel flex items-center justify-between rounded-[22px] px-4 py-3"
        style={{ minHeight: "72px" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-[16px]"
            style={{
              width: "42px",
              height: "42px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              color: config.color,
            }}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex flex-col">
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
              }}
            >
              {category}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--muted-foreground)",
              }}
            >
              {config.label}
            </span>
          </div>
        </div>

        {!loading && listings.length > 0 ? (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text-dim)",
            }}
          >
            {listings.length} live
          </span>
        ) : null}
      </div>

      <div
        className="surface-panel-strong relative flex-1 overflow-hidden rounded-[26px] p-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "22px",
            background: "var(--card-strong)",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "22px",
            background: "var(--card-strong)",
            borderTop: "1px solid rgba(255,255,255,0.03)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        />

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : loopItems.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              animation: `slot-scroll-up ${config.duration}s linear infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {loopItems.map((listing, index) => (
              <SlotCard key={`${listing.source_item_id}-${index}`} listing={listing} />
            ))}
          </div>
        ) : (
          <div
            className="flex h-full items-center justify-center text-center"
            style={{
              minHeight: "220px",
              color: "var(--muted-foreground)",
              fontSize: "12px",
              lineHeight: 1.7,
            }}
          >
            No listings available right now.
          </div>
        )}
      </div>
    </div>
  );
}

function DiscoveryIntro() {
  return (
    <div
      className="mx-auto flex w-full flex-col items-center gap-4 px-4 text-center"
      style={{ maxWidth: "760px" }}
    >
      <div
        className="brand-mark flex items-center justify-center rounded-[20px]"
        style={{ width: "60px", height: "60px" }}
      >
        <Sparkles className="h-6 w-6" />
      </div>

      <div className="flex flex-col gap-3">
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Discovery feed
        </p>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 800,
            letterSpacing: "-0.05em",
            lineHeight: 1.03,
            color: "var(--foreground)",
          }}
        >
          Real secondhand listings, moving in real time.
        </h1>
        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.7,
            color: "var(--muted-foreground)",
          }}
        >
          Browse the live feed, then jump into chat to search for something specific and compare value across marketplaces.
        </p>
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
  const isEmbedded = embedded || layout === "embedded";
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrending = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const res = await fetch("/api/trending");
      if (res.ok) {
        setData(await res.json());
      }
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
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        color: "var(--foreground)",
        opacity: visible === false ? 0 : 1,
        pointerEvents: visible === false ? "none" : "auto",
      }}
    >
      {!isEmbedded ? (
        <nav
          className="flex items-center justify-between px-6"
          style={{
            minHeight: "64px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(15, 17, 19, 0.96)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="brand-mark flex items-center justify-center rounded-[14px]"
              style={{ width: "34px", height: "34px" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.03em",
              }}
            >
              ReFind
            </span>
          </div>

          {showChatCta ? (
            <Link
              href="/chat"
              className="interactive focus-ring flex items-center gap-2 rounded-[16px]"
              style={{
                padding: "10px 16px",
                background: "var(--card-strong)",
                border: "1px solid var(--border-strong)",
                color: "var(--foreground)",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 700,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Start searching
            </Link>
          ) : null}
        </nav>
      ) : null}

      <div
        className="flex flex-1 flex-col"
        style={{
          padding: isEmbedded ? "0" : "28px 24px 24px",
          gap: isEmbedded ? "0" : "24px",
          minHeight: 0,
        }}
      >
        {!isEmbedded ? <DiscoveryIntro /> : null}

        <div
          className="flex flex-1"
          style={{
            minHeight: 0,
          }}
        >
          <div
            className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3"
            style={{
              minHeight: 0,
            }}
          >
            {CATEGORIES.map((category) => (
              <SlotColumn
                key={category}
                category={category}
                listings={data?.[category] ?? []}
                loading={loading}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
