import { NextRequest, NextResponse } from "next/server";
import { warehouseAddressSchema } from "@/lib/schemas";
import { assignWarehouseAddress, CsvStoreError } from "@/lib/csvStore";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const submissionsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionsByIp.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  submissionsByIp.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = warehouseAddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { firstName, lastName, phone, email } = parsed.data;

  let assignment;
  try {
    assignment = await assignWarehouseAddress({ firstName, lastName, phone, email });
  } catch (err) {
    if (err instanceof CsvStoreError) {
      console.error("[warehouse-address] csv store error", err.message);
      return NextResponse.json({ error: "Storage unavailable" }, { status: 502 });
    }
    throw err;
  }

  return NextResponse.json({
    code: assignment.code,
    fullAddress: assignment.fullAddress,
    isExisting: assignment.isExisting,
  });
}
