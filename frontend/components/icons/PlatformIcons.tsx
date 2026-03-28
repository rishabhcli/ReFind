"use client";

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

/** Lookup helper — returns the correct platform icon component */
export function PlatformLogo({ source, size = 16, className }: { source: string } & IconProps) {
  const key = source.toLowerCase();
  switch (key) {
    case "mercari":    return <MercariIcon size={size} className={className} />;
    case "craigslist": return <CraigslistIcon size={size} className={className} />;
    case "goodwill":   return <GoodwillIcon size={size} className={className} />;
    case "offerup":    return <OfferUpIcon size={size} className={className} />;
    case "facebook":   return <FacebookIcon size={size} className={className} />;
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
