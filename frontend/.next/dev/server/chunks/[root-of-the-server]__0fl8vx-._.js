module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/trending/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const AGENT_API_URL = ("TURBOPACK compile-time value", "http://localhost:8000") || "http://localhost:8000";
const CATEGORIES = [
    "Electronics",
    "Furniture",
    "Sports"
];
const KEYWORDS = {
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
        /audio/i
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
        /mirror/i
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
        /snowboard/i
    ]
};
function makeFallback(source, id, title, price, location) {
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
        fair_value_high: 0
    };
}
const FALLBACK = {
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
        makeFallback("goodwill", "fb-12", "Electric guitar with amp", 180, "Online")
    ]
};
function classifyListing(listing) {
    for (const category of CATEGORIES){
        if (KEYWORDS[category].some((pattern)=>pattern.test(listing.title))) {
            return category;
        }
    }
    return null;
}
function normalizeTrendingResponse(payload) {
    const buckets = {
        Electronics: [],
        Furniture: [],
        Sports: []
    };
    const leftovers = [];
    for (const listing of payload.listings){
        const category = classifyListing(listing);
        if (category) {
            buckets[category].push(listing);
        } else {
            leftovers.push(listing);
        }
    }
    for (const listing of leftovers){
        const target = CATEGORIES.reduce((smallest, category)=>{
            return buckets[category].length < buckets[smallest].length ? category : smallest;
        }, CATEGORIES[0]);
        buckets[target].push(listing);
    }
    return buckets;
}
async function GET(req) {
    const zip = req.nextUrl.searchParams.get("zip") || "10001";
    try {
        const res = await fetch(`${AGENT_API_URL}/api/trending?zip=${zip}`, {
            next: {
                revalidate: 30
            }
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.listings?.length > 0) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(normalizeTrendingResponse(data), {
                    headers: {
                        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60"
                    }
                });
            }
        }
    } catch  {
    // Fall through to local fallback response.
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(normalizeTrendingResponse(FALLBACK), {
        headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
            "X-ReFind-Fallback": "true"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0fl8vx-._.js.map