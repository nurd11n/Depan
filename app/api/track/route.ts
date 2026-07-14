import { NextRequest, NextResponse } from "next/server";
import { fetchTrackingResult, TrackingUpstreamError } from "@/lib/tracking";

const CODE_PATTERN = /^[A-Za-z0-9]{4,32}$/;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  if (!code || !CODE_PATTERN.test(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  try {
    const rows = await fetchTrackingResult(code);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Mirrors lib/tracking.ts's in-process result cache TTL — lets the
    // browser (and any CDN in front of it) skip the request entirely on an
    // immediate reload instead of round-tripping to our server for data we'd
    // just serve out of that same cache anyway.
    return NextResponse.json(
      { rows },
      { headers: { "Cache-Control": "public, max-age=45" } },
    );
  } catch (err) {
    if (err instanceof TrackingUpstreamError) {
      console.error("[track] upstream error", err.message);
      return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
    }
    console.error("[track] unexpected error", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
