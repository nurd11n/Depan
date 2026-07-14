export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { CSV_PATH } = await import("./lib/csvStore");
    console.log(`[csvStore] Warehouse address CSV path: ${CSV_PATH}`);

    const { scheduleDailyReport } = await import("./lib/dailyReport");
    scheduleDailyReport();
  }
}
