"use client";

import type { ReactElement } from "react";

interface IconProps {
  size?: number;
  className?: string;
}

export function MercariIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" fill="#f43f5e" />
      <path d="M7 16V9.5L10 13l2-5 2 5 3-3.5V16" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CraigslistIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" fill="#f97316" />
      <path d="M8 8h8M8 12h6M8 16h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GoodwillIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" fill="#10b981" />
      <path d="M12 6a3.5 3.5 0 0 1 0 7 3.5 3.5 0 0 1 0-7ZM7.5 18c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function OfferUpIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" fill="#38bdf8" />
      <circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="2" />
      <path d="M12 9v3l2 1.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FacebookIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" fill="#8b5cf6" />
      <path d="M13.5 6H15V9h-1.5c-.28 0-.5.22-.5.5V11h2l-.5 2.5H13v4.5h-2.5V13.5H9V11h1.5V9a3 3 0 0 1 3-3Z" fill="#fff" />
    </svg>
  );
}

export function EbayIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" fill="#3b82f6" />
      <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff" fontFamily="Arial,sans-serif">eBay</text>
    </svg>
  );
}

export function PoshmarkIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" fill="#f43f5e" />
      <path d="M8 16c0-2.2 1.8-4 4-4s4 1.8 4 4M12 7a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Lookup helper — returns the correct platform icon component */
export function PlatformLogo({ source, size = 16, className }: { source: string } & IconProps) {
  const key = source.toLowerCase();
  switch (key) {
    case "mercari":    return <MercariIcon size={size} className={className} />;
    case "craigslist": return <CraigslistIcon size={size} className={className} />;
    case "goodwill":   return <GoodwillIcon size={size} className={className} />;
    case "offerup":    return <OfferUpIcon size={size} className={className} />;
    case "facebook":
    case "facebook marketplace":
    case "facebook_marketplace":
                       return <FacebookIcon size={size} className={className} />;
    case "ebay":       return <EbayIcon size={size} className={className} />;
    case "poshmark":   return <PoshmarkIcon size={size} className={className} />;
    default:           return <GenericSourceIcon size={size} className={className} />;
  }
}

function GenericSourceIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="11" fill="#7878a0" />
      <circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

/** Returns a hex color string for a given platform source key */
export function getPlatformColor(source: string): string {
  const key = source.toLowerCase();
  switch (key) {
    case "mercari":   return "#f43f5e";
    case "craigslist": return "#f97316";
    case "goodwill":  return "#10b981";
    case "offerup":   return "#38bdf8";
    case "facebook":
    case "facebook marketplace":
    case "facebook_marketplace":
                      return "#8b5cf6";
    case "ebay":      return "#3b82f6";
    case "poshmark":  return "#f43f5e";
    default:          return "#7878a0";
  }
}

/** Returns a human-readable display label for a given platform source key */
export function getPlatformLabel(source: string): string {
  const key = source.toLowerCase();
  switch (key) {
    case "mercari":   return "Mercari";
    case "craigslist": return "Craigslist";
    case "goodwill":  return "Goodwill";
    case "offerup":   return "OfferUp";
    case "facebook":
    case "facebook marketplace":
    case "facebook_marketplace":
                      return "Facebook Marketplace";
    case "ebay":      return "eBay";
    case "poshmark":  return "Poshmark";
    case "browser_enricher": return "Reading listing details";
    default:          return source;
  }
}

/** Returns a React element icon for a given platform source key */
export function getPlatformIcon(source: string, size = 16): ReactElement {
  return <PlatformLogo source={source} size={size} />;
}

/* ── Category SVG icons (replace emojis in Discovery Screen) ────── */

export function ElectronicsIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </svg>
  );
}

export function FurnitureIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a2 2 0 0 0-2 2v3h20v-3a2 2 0 0 0-2-2H4Z" />
      <path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <path d="M4 16v2M20 16v2" />
    </svg>
  );
}

export function SportsIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
    </svg>
  );
}

export function MapPinIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function ImagePlaceholderIcon({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
