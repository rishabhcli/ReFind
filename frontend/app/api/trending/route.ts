import { NextRequest, NextResponse } from "next/server";

const AGENT_API_URL =
  process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:8000";

type TrendingListing = {
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
};

type TrendingResponse = {
  Electronics: TrendingListing[];
  Furniture: TrendingListing[];
  Sports: TrendingListing[];
};

const FALLBACK_TRENDING: TrendingResponse = {
  Electronics: [
    makeFallback("mercari", "electronics-1", "Sony mirrorless camera body", 420, "Mirrorless+Camera", "San Jose, CA"),
    makeFallback("mercari", "electronics-2", "Noise-cancelling wireless headphones", 145, "Headphones", "Oakland, CA"),
    makeFallback("craigslist", "electronics-3", "RTX gaming laptop", 680, "Gaming+Laptop", "San Francisco, CA"),
    makeFallback("goodwill", "electronics-4", "Portable Bluetooth speaker", 55, "Bluetooth+Speaker", "Online"),
    makeFallback("offerup", "electronics-5", "Mechanical keyboard", 70, "Keyboard", "Berkeley, CA"),
    makeFallback("mercari", "electronics-6", "GPS smartwatch", 120, "Smartwatch", "Palo Alto, CA"),
  ],
  Furniture: [
    makeFallback("craigslist", "furniture-1", "Modern sectional sofa", 280, "Sectional+Sofa", "San Francisco, CA"),
    makeFallback("offerup", "furniture-2", "Ergonomic office chair", 95, "Office+Chair", "San Mateo, CA"),
    makeFallback("goodwill", "furniture-3", "Solid wood bookshelf", 88, "Bookshelf", "Online"),
    makeFallback("mercari", "furniture-4", "Mid-century coffee table", 135, "Coffee+Table", "San Bruno, CA"),
    makeFallback("offerup", "furniture-5", "Ceramic table lamp pair", 62, "Table+Lamp", "Redwood City, CA"),
    makeFallback("mercari", "furniture-6", "Six-drawer wood dresser", 210, "Dresser", "San Jose, CA"),
  ],
  Sports: [
    makeFallback("craigslist", "sports-1", "Carbon road bike", 540, "Road+Bike", "San Francisco, CA"),
    makeFallback("offerup", "sports-2", "Adjustable dumbbell set", 160, "Dumbbells", "Daly City, CA"),
    makeFallback("mercari", "sports-3", "Complete golf club set", 225, "Golf+Clubs", "Oakland, CA"),
    makeFallback("goodwill", "sports-4", "Tennis racket bundle", 48, "Tennis+Racket", "Online"),
    makeFallback("goodwill", "sports-5", "Street skateboard complete", 72, "Skateboard", "Berkeley, CA"),
    makeFallback("mercari", "sports-6", "Fitness watch", 110, "Fitness+Watch", "San Jose, CA"),
  ],
};

function makeFallback(
  source: string,
  sourceItemId: string,
  title: string,
  price: number,
  imageText: string,
  locationText: string,
): TrendingListing {
  return {
    source,
    source_item_id: sourceItemId,
    url: "#",
    title,
    price,
    condition: "good",
    image_urls: [
      `https://placehold.co/600x600/111827/e5e7eb/png?text=${imageText}`,
    ],
    location_text: locationText,
    deal_score: 78,
    fair_value_low: Math.max(price - 40, 10),
    fair_value_high: price + 55,
  };
}

function hasContent(data: Partial<TrendingResponse> | null | undefined) {
  if (!data) return false;
  return (
    (data.Electronics?.length ?? 0) > 0 ||
    (data.Furniture?.length ?? 0) > 0 ||
    (data.Sports?.length ?? 0) > 0
  );
}

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get("zip") || "10001";

  try {
    const res = await fetch(`${AGENT_API_URL}/api/trending?zip=${zip}`, {
      next: { revalidate: 30 },
    });

    if (res.ok) {
      const data = (await res.json()) as Partial<TrendingResponse>;
      if (hasContent(data)) {
        return NextResponse.json(data, {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        });
      }
    }
  } catch {
    // Fall through to local fallback response.
  }

  return NextResponse.json(FALLBACK_TRENDING, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      "X-ReFind-Fallback": "true",
    },
  });
}
