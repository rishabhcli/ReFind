"use client";

import { useState } from "react";
import useSWR from "swr";
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
import { collectListingImageSequence } from "@/lib/listing-images";

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

const COLUMN_META: Record<
  Category,
  { icon: typeof Monitor; speed: number; label: string; color: string }
> = {
  Electronics: {
    icon: Monitor,
    speed: 24,
    label: "Cameras, audio, consoles",
    color: "#95a9b8",
  },
  Furniture: {
    icon: Sofa,
    speed: 34,
    label: "Seating, desks, storage",
    color: "#d7a24a",
  },
  Sports: {
    icon: Bike,
    speed: 28,
    label: "Bikes, fitness, outdoor gear",
    color: "#8fa58a",
  },
};

function fetchTrending(url: string) {
  return fetch(url).then(async (res) => {
    if (!res.ok) {
      throw new Error("Unable to load trending listings.");
    }
    return (await res.json()) as TrendingData;
  });
}

function ItemCard({ listing }: { listing: Listing }) {
  const imageSequence = collectListingImageSequence(listing);
  const [imgIndex, setImgIndex] = useState(0);
  const imgSrc = imageSequence[imgIndex] ?? null;
  const showImage = Boolean(imgSrc);

  return (
    <a
      href={listing.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-[22px] border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{
        background: "var(--card-strong)",
        borderColor: "var(--border)",
        textDecoration: "none",
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        {showImage ? (
          <img
            src={imgSrc}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgIndex((current) => current + 1)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ color: "var(--text-dim)" }}
          >
            <ImagePlaceholderIcon size={36} />
          </div>
        )}

        <span
          className="absolute bottom-2 left-2 rounded-lg px-2.5 py-1 text-sm font-extrabold"
          style={{
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(8px)",
            color: "#fbbf24",
          }}
        >
          ${listing.price.toFixed(0)}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <p
          className="line-clamp-2 text-[13px] font-semibold leading-snug"
          style={{ color: "var(--card-foreground)" }}
        >
          {listing.title}
        </p>

        <div className="flex items-center gap-1.5">
          <PlatformLogo source={listing.source} size={16} />
          <span
            className="text-[11px] font-bold capitalize"
            style={{ color: "var(--muted-foreground)" }}
          >
            {listing.source}
          </span>
          {listing.location_text ? (
            <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
              · {listing.location_text}
            </span>
          ) : null}
        </div>
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-[22px] border"
      style={{
        background: "var(--card-strong)",
        borderColor: "var(--border)",
        animation: "skeleton-pulse 1.8s ease-in-out infinite",
      }}
    >
      <div style={{ aspectRatio: "1 / 1", background: "rgba(255,255,255,0.03)" }} />
      <div className="flex flex-col gap-2 p-3">
        <div
          className="h-3 w-3/4 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
        <div
          className="h-3 w-1/2 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
      </div>
    </div>
  );
}

function ScrollColumn({
  category,
  listings,
}: {
  category: Category;
  listings: Listing[];
}) {
  const [paused, setPaused] = useState(false);
  const meta = COLUMN_META[category];
  const Icon = meta.icon;
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
              color: meta.color,
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
              {meta.label}
            </span>
          </div>
        </div>

        {listings.length > 0 ? (
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
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10"
          style={{
            height: 26,
            background: "linear-gradient(to bottom, var(--card-strong), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
          style={{
            height: 26,
            background: "linear-gradient(to top, var(--card-strong), transparent)",
          }}
        />

        {loopItems.length > 0 ? (
          <div
            className="flex flex-col gap-4"
            style={{
              animation: `slot-scroll-up ${meta.speed}s linear infinite`,
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {loopItems.map((listing, index) => (
              <ItemCard key={`${listing.source_item_id}-${index}`} listing={listing} />
            ))}
          </div>
        ) : (
          <div
            className="flex h-full min-h-[240px] items-center justify-center text-center"
            style={{
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
  const { data, isLoading } = useSWR(visible === false ? null : "/api/trending", fetchTrending, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
  });

  if (visible === false) {
    return null;
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ color: "var(--foreground)" }}
    >
      {!isEmbedded ? (
        <nav
          className="flex items-center justify-between px-6"
          style={{
            minHeight: 64,
            borderBottom: "1px solid var(--border)",
            background: "rgba(15,17,19,0.96)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="brand-mark flex items-center justify-center rounded-[14px]"
              style={{ width: 34, height: 34 }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <span
              className="text-lg font-extrabold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              ReFind
            </span>
          </div>

          {showChatCta ? (
            <Link
              href="/chat"
              className="interactive focus-ring flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-bold"
              style={{
                background: "var(--card-strong)",
                border: "1px solid var(--border-strong)",
                color: "var(--foreground)",
                textDecoration: "none",
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Start searching
            </Link>
          ) : null}
        </nav>
      ) : null}

      {!isEmbedded ? (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-4 py-6 text-center">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-dim)" }}
          >
            Live deals
          </p>
          <h1 className="text-4xl font-extrabold tracking-tighter" style={{ lineHeight: 1.05 }}>
            Secondhand finds, refreshed every 30 seconds.
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Real listings from Mercari, Craigslist, Goodwill, OfferUp and more.
            Hover any rail to pause it and inspect the latest items.
          </p>
        </div>
      ) : null}

      <div className="flex flex-1 gap-4 overflow-hidden px-4 pb-4" style={{ minHeight: 0 }}>
        {isLoading ? (
          <>
            {CATEGORIES.map((category) => (
              <div key={category} className="flex flex-1 flex-col gap-3" style={{ minWidth: 0 }}>
                <div
                  className="surface-panel rounded-[22px]"
                  style={{ minHeight: "72px", border: "1px solid var(--border)" }}
                />
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          CATEGORIES.map((category) => (
            <ScrollColumn
              key={category}
              category={category}
              listings={data?.[category] ?? []}
            />
          ))
        )}
      </div>
    </div>
  );
}
