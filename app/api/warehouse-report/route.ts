import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { CSV_PATH } from "@/lib/csvStore";

// Token-protected download of the full warehouse-address CSV, so the file can
// be retrieved from a browser even though it lives inside a Docker named
// volume (not on the host filesystem). Disabled unless ADMIN_EXPORT_TOKEN is
// set, and requires ?token= to match it — the CSV holds customer PII.
export async function GET(req: NextRequest) {
  const expected = process.env.ADMIN_EXPORT_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "Export disabled" }, { status: 404 });
  }

  const provided = req.nextUrl.searchParams.get("token");
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!existsSync(/* turbopackIgnore: true */ CSV_PATH)) {
    return NextResponse.json({ error: "No data yet" }, { status: 404 });
  }

  let content: string;
  try {
    content = await readFile(/* turbopackIgnore: true */ CSV_PATH, "utf8");
  } catch (err) {
    console.error("[warehouse-report] read failed", err);
    return NextResponse.json({ error: "Could not read file" }, { status: 500 });
  }

  const dateLabel = new Date().toISOString().slice(0, 10);
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="warehouse-addresses-${dateLabel}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
