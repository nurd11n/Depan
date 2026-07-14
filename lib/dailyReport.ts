import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { CSV_PATH } from "./csvStore";
import { sendDailyWarehouseCsvReport } from "./mailer";

// Server local time, 24h clock. Override via env if the deploy's local time
// zone doesn't match when "end of day" should mean.
const REPORT_HOUR = Number(process.env.DAILY_REPORT_HOUR ?? 23);
const REPORT_MINUTE = Number(process.env.DAILY_REPORT_MINUTE ?? 59);
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function runDailyReport(): Promise<void> {
  if (!existsSync(/* turbopackIgnore: true */ CSV_PATH)) {
    console.log("[dailyReport] No warehouse address CSV yet — nothing to send today.");
    return;
  }

  try {
    const csvContent = await readFile(/* turbopackIgnore: true */ CSV_PATH, "utf8");
    await sendDailyWarehouseCsvReport(csvContent);
  } catch (err) {
    console.error("[dailyReport] Failed to send daily CSV report", err);
  }
}

function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

// Next.js's instrumentation hook can run register() more than once in dev
// (hot reload). Guard with a global flag so we never schedule two timer chains.
const globalForReport = globalThis as unknown as { __dailyReportScheduled?: boolean };

export function scheduleDailyReport(): void {
  if (globalForReport.__dailyReportScheduled) return;
  globalForReport.__dailyReportScheduled = true;

  const delay = msUntilNext(REPORT_HOUR, REPORT_MINUTE);
  console.log(
    `[dailyReport] Scheduled — next run in ${Math.round(delay / 60000)} min (${REPORT_HOUR}:${String(REPORT_MINUTE).padStart(2, "0")} server time, then every 24h).`,
  );

  setTimeout(() => {
    void runDailyReport();
    setInterval(() => void runDailyReport(), ONE_DAY_MS);
  }, delay);
}
