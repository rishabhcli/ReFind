import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BLOCKED_HOST_RE =
  /^(localhost|0\.0\.0\.0|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|169\.254(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})$/i;

function isSafeRemoteUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (!url.hostname || BLOCKED_HOST_RE.test(url.hostname) || url.hostname.endsWith(".local")) {
      return null;
    }
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

const IMAGE_PATH_RE = /\.(?:avif|gif|jpe?g|png|svg|webp|bmp)(?:$|\?)/i;

function inferredImageContentType(pathname: string): string {
  const lower = pathname.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".bmp")) return "image/bmp";
  return "image/jpeg";
}

function imageRequestHeaders(): HeadersInit {
  return {
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  };
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  const upstreamUrl = isSafeRemoteUrl(rawUrl);
  if (!upstreamUrl) {
    return NextResponse.json({ error: "Invalid image url." }, { status: 400 });
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: imageRequestHeaders(),
      next: { revalidate: 60 * 60 * 12 },
      redirect: "follow",
    });
  } catch {
    return NextResponse.json({ error: "Unable to fetch image." }, { status: 502 });
  }

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return NextResponse.json(
      { error: "Upstream image request failed." },
      { status: upstreamResponse.status || 502 },
    );
  }

  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  const isImageResponse =
    contentType.toLowerCase().startsWith("image/") ||
    (contentType.toLowerCase() === "application/octet-stream" &&
      IMAGE_PATH_RE.test(upstreamUrl.pathname));
  if (!isImageResponse) {
    return NextResponse.json({ error: "Upstream response is not an image." }, { status: 415 });
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    contentType.toLowerCase() === "application/octet-stream"
      ? inferredImageContentType(upstreamUrl.pathname)
      : contentType,
  );
  headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400",
  );

  const contentLength = upstreamResponse.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new NextResponse(upstreamResponse.body, {
    status: 200,
    headers,
  });
}
