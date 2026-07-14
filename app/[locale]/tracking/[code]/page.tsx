import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { fetchTrackingResult, TrackingUpstreamError, type TrackingRow } from "@/lib/tracking";

const CODE_PATTERN = /^[A-Za-z0-9]{4,32}$/;
const TRACKING_BASE_URL =
  process.env.TRACKING_BASE_URL ?? "http://175.178.206.118:8082/trackIndex.htm";

// Matches lib/tracking.ts's in-process result cache TTL — Next.js can serve
// the already-rendered page for a repeat hit on the same code instead of
// re-running the Server Component (which would just hit that same cache).
export const revalidate = 45;

export default async function TrackingResultPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("trackingResult");

  if (!CODE_PATTERN.test(code)) {
    notFound();
  }

  let rows: TrackingRow[] = [];
  let upstreamError = false;

  try {
    rows = await fetchTrackingResult(code);
  } catch (err) {
    if (err instanceof TrackingUpstreamError) {
      upstreamError = true;
    } else {
      throw err;
    }
  }

  return (
    <main className="flex-1 px-6 pb-24 pt-32 sm:px-12 sm:pt-40">
      <div className="mx-auto max-w-2xl">
        <p className="text-[10px] font-normal tracking-[0.32em] text-gold uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-light tracking-wide text-cream sm:text-4xl">
          {code}
        </h1>
        <div className="mt-5 h-px w-12 bg-gold" />

        <div className="mt-10">
          {upstreamError && (
            <div className="flex flex-col gap-4 border border-border bg-midnight-light p-7">
              <p className="text-[13px] text-muted">{t("error")}</p>
              <a
                href={TRACKING_BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 border border-gold px-6 py-3 text-[10px] font-normal tracking-[0.2em] text-gold uppercase transition-colors hover:bg-gold hover:text-midnight"
              >
                {t("fallbackCta")}
              </a>
            </div>
          )}

          {!upstreamError && rows.length === 0 && (
            <p className="border border-border bg-midnight-light p-7 text-[13px] text-muted">
              {t("notFound")}
            </p>
          )}

          {!upstreamError && rows.length > 0 && (
            <div className="flex flex-col gap-8">
              {rows.map((row, i) => (
                <dl
                  key={`${row.trackingNumber}-${i}`}
                  className="flex flex-col gap-3 border border-border bg-midnight-light p-7 text-[13px]"
                >
                  <Row label={t("referenceNumber")} value={row.referenceNumber} />
                  <Row label={t("trackingNumber")} value={row.trackingNumber} />
                  <Row label={t("destination")} value={row.destination} />
                  <Row label={t("localTime")} value={row.localTime} />
                  <Row label={t("status")} value={row.status} highlight />
                  <Row label={t("recipient")} value={row.recipient} />
                  {row.proofOfDelivery && (
                    <Row label={t("proofOfDelivery")} value={row.proofOfDelivery} />
                  )}
                </dl>
              ))}

              {rows.map(
                (row, i) =>
                  row.history.length > 0 && (
                    <div key={`history-${row.trackingNumber}-${i}`}>
                      <h2 className="text-[10px] font-normal tracking-[0.22em] text-gold uppercase">
                        {t("history")}
                      </h2>
                      <ol className="mt-4 flex flex-col gap-4 border-l border-border pl-6">
                        {row.history.map((entry, hi) => (
                          <li key={hi} className="relative text-[13px]">
                            <span className="absolute -left-[25px] top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
                            <p className="text-[11px] text-muted">
                              {entry.date}
                              {entry.location && ` · ${entry.location}`}
                            </p>
                            <p className="mt-0.5 text-cream">{entry.description}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ),
              )}
            </div>
          )}
        </div>

        <Link
          href="/#tracking"
          className="mt-10 inline-flex items-center gap-2 text-[11px] font-normal tracking-[0.15em] text-muted uppercase transition-colors hover:text-gold"
        >
          ← {t("back")}
        </Link>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right font-normal ${highlight ? "text-gold" : "text-cream"}`}>
        {value}
      </dd>
    </div>
  );
}
