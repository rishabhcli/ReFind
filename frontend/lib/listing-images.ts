"use client";

const PLACEHOLDER_IMAGE_RE =
  /source\.unsplash\.com|placehold\.co|via\.placehold|dummyimage|placeholdit/i;

function isHttpImageUrl(value: string): boolean {
  if (!value || !value.trim()) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isRealListingImageUrl(value: string): boolean {
  return isHttpImageUrl(value) && !PLACEHOLDER_IMAGE_RE.test(value);
}

export function proxiedListingImageUrl(value: string): string {
  return `/api/image?url=${encodeURIComponent(value)}`;
}

export function buildListingImageSequence(urls: string[]): string[] {
  const sequence: string[] = [];
  const seen = new Set<string>();

  for (const url of urls) {
    if (!isRealListingImageUrl(url)) continue;

    for (const candidate of [url, proxiedListingImageUrl(url)]) {
      if (seen.has(candidate)) continue;
      seen.add(candidate);
      sequence.push(candidate);
    }
  }

  return sequence;
}

type ListingImageShape = {
  image_urls?: string[];
  image_url?: string;
  image?: string;
  additional_images?: string[];
};

export function collectListingImageSequence(listing: ListingImageShape): string[] {
  return buildListingImageSequence([
    ...(listing.image_urls ?? []),
    ...(listing.image_url ? [listing.image_url] : []),
    ...(listing.image ? [listing.image] : []),
    ...(listing.additional_images ?? []),
  ]);
}
