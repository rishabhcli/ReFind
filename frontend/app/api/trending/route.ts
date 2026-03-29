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

type TrendingApiResponse = {
  listings: TrendingListing[];
};

type TrendingBuckets = {
  Electronics: TrendingListing[];
  Furniture: TrendingListing[];
  Sports: TrendingListing[];
};

type Category = keyof TrendingBuckets;

const CATEGORIES: Category[] = ["Electronics", "Furniture", "Sports"];
const KEYWORDS: Record<Category, RegExp[]> = {
  Electronics: [
    /camera/i,
    /monitor/i,
    /keyboard/i,
    /speaker/i,
    /headphones/i,
    /console/i,
    /nintendo/i,
    /playstation/i,
    /xbox/i,
    /iphone/i,
    /laptop/i,
    /tablet/i,
    /macbook/i,
    /tv/i,
    /audio/i,
  ],
  Furniture: [
    /sofa/i,
    /sectional/i,
    /couch/i,
    /chair/i,
    /table/i,
    /desk/i,
    /dresser/i,
    /bed/i,
    /bookshelf/i,
    /cabinet/i,
    /lamp/i,
    /ottoman/i,
    /stool/i,
    /mirror/i,
  ],
  Sports: [
    /bike/i,
    /bicycle/i,
    /helmet/i,
    /camping/i,
    /tent/i,
    /dumbbell/i,
    /weights?/i,
    /golf/i,
    /soccer/i,
    /basketball/i,
    /baseball/i,
    /fitness/i,
    /exercise/i,
    /ski/i,
    /snowboard/i,
  ],
};

function makeFallback(
  source: string,
  id: string,
  title: string,
  price: number,
  location: string,
): TrendingListing {
  return {
    source,
    source_item_id: id,
    url: "#",
    title,
    price,
    condition: "good",
    image_urls: [],
    location_text: location,
    deal_score: 0,
    fair_value_low: 0,
    fair_value_high: 0,
  };
}

const FALLBACK: TrendingApiResponse = {
  listings: [
    makeFallback("mercari", "fb-1", "Sony mirrorless camera body", 420, "San Jose, CA"),
    makeFallback("craigslist", "fb-2", "Modern sectional sofa", 280, "San Francisco, CA"),
    makeFallback("goodwill", "fb-3", "Vintage leather jacket", 45, "Online"),
    makeFallback("offerup", "fb-4", "Nintendo Switch OLED bundle", 230, "Oakland, CA"),
    makeFallback("mercari", "fb-5", "Noise-cancelling headphones", 145, "Palo Alto, CA"),
    makeFallback("craigslist", "fb-6", "Carbon road bike", 540, "Berkeley, CA"),
    makeFallback("goodwill", "fb-7", "Cast iron skillet set", 32, "Online"),
    makeFallback("mercari", "fb-8", "Mechanical keyboard RGB", 70, "San Mateo, CA"),
    makeFallback("offerup", "fb-9", "Camping tent 4-person", 95, "Daly City, CA"),
    makeFallback("craigslist", "fb-10", "Adjustable dumbbell set", 160, "San Jose, CA"),
    makeFallback("mercari", "fb-11", "Vinyl record player", 120, "Oakland, CA"),
    makeFallback("goodwill", "fb-12", "Electric guitar with amp", 180, "Online"),
  ],
};

function classifyListing(listing: TrendingListing): Category | null {
  for (const category of CATEGORIES) {
    if (KEYWORDS[category].some((pattern) => pattern.test(listing.title))) {
      return category;
    }
  }

  return null;
}

function normalizeTrendingResponse(payload: TrendingApiResponse): TrendingBuckets {
  const buckets: TrendingBuckets = {
    Electronics: [],
    Furniture: [],
    Sports: [],
  };
  const leftovers: TrendingListing[] = [];

  for (const listing of payload.listings) {
    const category = classifyListing(listing);

    if (category) {
      buckets[category].push(listing);
    } else {
      leftovers.push(listing);
    }
  }

  for (const listing of leftovers) {
    const target = CATEGORIES.reduce((smallest, category) => {
      return buckets[category].length < buckets[smallest].length ? category : smallest;
    }, CATEGORIES[0]);
    buckets[target].push(listing);
  }

  return buckets;
}

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get("zip") || "10001";

  try {
    const res = await fetch(`${AGENT_API_URL}/api/trending?zip=${zip}`, {
      next: { revalidate: 30 },
    });

    if (res.ok) {
      const data = (await res.json()) as TrendingApiResponse;
      if (data?.listings?.length > 0) {
        return NextResponse.json(normalizeTrendingResponse(data), {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        });
      }
    }
  } catch {
    // Fall through to local fallback response.
  }

  return NextResponse.json(normalizeTrendingResponse(FALLBACK), {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      "X-ReFind-Fallback": "true",
    },
  });
}
