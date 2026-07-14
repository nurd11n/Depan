import * as cheerio from "cheerio";

const DEFAULT_TRACKING_BASE_URL = "http://175.178.206.118:8082/trackIndex.htm";

// Confirmed from a live Network-tab capture: POST body is `documentCode=<code>`
// (application/x-www-form-urlencoded), and the server requires a JSESSIONID
// cookie obtained from an initial GET to the same URL before the POST works.
const DOCUMENT_CODE_FIELD = "documentCode";

// The upstream already writes most status/history text in English — it just
// prefixes a Chinese category word or bracketed phrase directly onto the
// front (e.g. "签收Delivered, Left at front door...", or
// "【已提柜】Cabinet picked up"). Rather than guessing translations for
// specific phrases, strip any leading run of CJK ideographs / CJK
// punctuation (brackets, fullwidth comma, etc.) and whitespace, and leave
// whatever follows — which is already English — untouched.
const CJK_PREFIX_PATTERN = /^(?:[　-〿＀-￯一-鿿]+\s*)+/;

// Stable UI column labels for the results table, captured directly from the
// live site's DOM (not user data, so safe to hardcode).
const HEADER_FIELD_MAP: Record<string, Exclude<keyof TrackingRow, "history">> = {
  "参考号": "referenceNumber",
  "跟踪号码": "trackingNumber",
  "目的地": "destination",
  "当地时间": "localTime",
  "最新状态": "status",
  "收件人": "recipient",
  "签收单": "proofOfDelivery",
};

export interface TrackingHistoryEntry {
  date: string;
  location: string;
  description: string;
}

export interface TrackingRow {
  referenceNumber: string;
  trackingNumber: string;
  destination: string;
  localTime: string;
  status: string;
  recipient: string;
  proofOfDelivery: string;
  history: TrackingHistoryEntry[];
}

export class TrackingUpstreamError extends Error {}

// Two shapes observed live: a bare CJK word directly against English
// ("签收Delivered...") and a bracketed Chinese clause that can itself
// contain dates/ASCII punctuation before the closing bracket
// ("【预计到港时间 2026-06-24】Expected arrival time: 2026-06-24" — the
// embedded date defeats a pure-CJK-character-class strip). For the
// bracketed shape, cut at the first "】" instead of trying to character-match
// everything inside it. Only accept whichever result comes out
// Latin-starting and non-empty — some events are Chinese-only with no
// English counterpart at all (e.g. "到达收货点"), and blanking those would
// silently drop real information, so fall back to the untouched original.
function stripChineseLeadIn(raw: string): string {
  const text = raw.trim();
  const bracketEnd = text.indexOf("】");
  const candidate =
    bracketEnd !== -1
      ? text.slice(bracketEnd + 1).trim()
      : text.replace(CJK_PREFIX_PATTERN, "").trim();

  return candidate && /^[A-Za-z0-9]/.test(candidate) ? candidate : text;
}

function cellValue(el: cheerio.Cheerio<import("domhandler").Element>): string {
  const title = el.attr("title");
  if (title && title.trim()) return title.trim();

  const img = el.find("img").first();
  if (img.length) return img.attr("src")?.trim() ?? "";

  const link = el.find("a").first();
  if (link.length) return link.attr("href")?.trim() ?? "";

  return el.text().trim();
}

// The history block's heading is literally "【<trackingNumber>】追踪信息"
// ("Tracking information"); pull the bracketed number back out to match it
// to the right waybill row.
const HISTORY_HEADING_PATTERN = /【([^】]+)】/;

function parseHistoryBlocks(
  $: cheerio.CheerioAPI,
): Map<string, TrackingHistoryEntry[]> {
  const byTrackingNumber = new Map<string, TrackingHistoryEntry[]>();

  $(".men_li").each((_, block) => {
    // "men_li" sits inside a "difmeam" wrapper alongside the "div_ck"
    // heading div that names which waybill this history belongs to.
    const heading = $(block).siblings(".div_ck").first().text();
    const match = heading.match(HISTORY_HEADING_PATTERN);
    if (!match) return;
    const trackingNumber = match[1].trim();

    const entries: TrackingHistoryEntry[] = $(block)
      .find("table tr")
      .toArray()
      .map((tr) => {
        const cells = $(tr).find("td").toArray().map((td) => $(td).text().trim());
        return {
          date: cells[0] ?? "",
          location: cells[1] ?? "",
          description: stripChineseLeadIn(cells[2] ?? ""),
        };
      })
      .filter((entry) => entry.date || entry.description);

    byTrackingNumber.set(trackingNumber, entries);
  });

  return byTrackingNumber;
}

export function parseTrackingHtml(html: string): TrackingRow[] {
  const $ = cheerio.load(html);
  const container = $(".menu_.clearfix").first();
  if (container.length === 0) return [];

  const rowGroups = container.children("ul.clearfix").toArray();
  if (rowGroups.length < 2) return [];

  const [headerRow, ...dataRows] = rowGroups;
  const headerLabels = $(headerRow)
    .children("li")
    .toArray()
    .map((li) => $(li).text().trim());

  const historyByTrackingNumber = parseHistoryBlocks($);
  const results: TrackingRow[] = [];

  for (const row of dataRows) {
    const cells = $(row).children("li").toArray();
    const partial: Partial<TrackingRow> = {};

    cells.forEach((cell, i) => {
      const label = headerLabels[i];
      const field = label ? HEADER_FIELD_MAP[label] : undefined;
      if (!field) return;
      const value = cellValue($(cell));
      partial[field] = field === "status" ? stripChineseLeadIn(value) : value;
    });

    if (partial.trackingNumber || partial.referenceNumber) {
      results.push({
        referenceNumber: partial.referenceNumber ?? "",
        trackingNumber: partial.trackingNumber ?? "",
        destination: partial.destination ?? "",
        localTime: partial.localTime ?? "",
        status: partial.status ?? "",
        recipient: partial.recipient ?? "",
        proofOfDelivery: partial.proofOfDelivery ?? "",
        history: historyByTrackingNumber.get(partial.trackingNumber ?? "") ?? [],
      });
    }
  }

  return results;
}

function extractSessionCookie(res: Response): string | null {
  const getSetCookie = (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = getSetCookie ? getSetCookie.call(res.headers) : [];
  const sessionCookie = cookies.find((c) => c.trim().toLowerCase().startsWith("jsessionid"));
  return sessionCookie ? sessionCookie.split(";")[0] : null;
}

// The upstream issues a fresh JSESSIONID per GET, but the session itself is
// valid for a while. Reusing it across lookups turns "2 slow round-trips to
// a flaky bare-IP server" into "1" for every query after the first, which is
// where nearly all of this route's latency lives.
const SESSION_TTL_MS = 8 * 60 * 1000;
let cachedSession: { cookie: string | null; expiresAt: number } | null = null;

async function getSessionCookie(baseUrl: string): Promise<string | null> {
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession.cookie;
  }

  const sessionRes = await fetch(baseUrl, {
    method: "GET",
    signal: AbortSignal.timeout(8000),
  });
  if (!sessionRes.ok) {
    throw new TrackingUpstreamError(`Session GET failed: ${sessionRes.status}`);
  }

  const cookie = extractSessionCookie(sessionRes);
  cachedSession = { cookie, expiresAt: Date.now() + SESSION_TTL_MS };
  return cookie;
}

async function queryTrackingHtml(baseUrl: string, code: string, cookie: string | null) {
  return fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(cookie ? { Cookie: cookie } : {}),
      Referer: baseUrl,
      Origin: new URL(baseUrl).origin,
    },
    body: new URLSearchParams({ [DOCUMENT_CODE_FIELD]: code }).toString(),
    signal: AbortSignal.timeout(8000),
  });
}

// Short-lived cache for parsed results: a page reload or a double-submit for
// the same code shouldn't cost another two-request round-trip to an upstream
// that's already shown itself to be slow/flaky.
const RESULT_TTL_MS = 60 * 1000;
const resultCache = new Map<string, { rows: TrackingRow[]; expiresAt: number }>();

export async function fetchTrackingResult(code: string): Promise<TrackingRow[]> {
  const cached = resultCache.get(code);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.rows;
  }

  const baseUrl = process.env.TRACKING_BASE_URL ?? DEFAULT_TRACKING_BASE_URL;

  let postRes: Response;
  try {
    const cookie = await getSessionCookie(baseUrl);
    postRes = await queryTrackingHtml(baseUrl, code, cookie);

    // The cached session may have expired server-side even though our TTL
    // hasn't elapsed yet — refresh once and retry before giving up.
    if (!postRes.ok) {
      cachedSession = null;
      const freshCookie = await getSessionCookie(baseUrl);
      postRes = await queryTrackingHtml(baseUrl, code, freshCookie);
    }

    if (!postRes.ok) {
      throw new TrackingUpstreamError(`Query POST failed: ${postRes.status}`);
    }
  } catch (err) {
    if (err instanceof TrackingUpstreamError) throw err;
    throw new TrackingUpstreamError("Could not reach tracking backend");
  }

  const html = await postRes.text();
  const rows = parseTrackingHtml(html);

  if (rows.length > 0) {
    resultCache.set(code, { rows, expiresAt: Date.now() + RESULT_TTL_MS });
  }

  return rows;
}
