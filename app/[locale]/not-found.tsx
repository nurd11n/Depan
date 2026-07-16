import { getTranslations } from "next-intl/server";
import NotFoundContent from "@/components/NotFoundContent";

// This special file is Next.js's fallback for a route that matches no page
// at all — reachable only via an edge case like a garbage locale segment
// (e.g. /xx/shipping), since every real path under a valid locale is caught
// by app/[locale]/[...catchAll]/page.tsx instead (a normal page, correctly
// localized). Verified live that this file's render gets cached at build
// time and reused across requests regardless of the actual URL — even with
// `dynamic = "force-dynamic"` (which also broke static generation for the
// entire [locale] segment) — so don't rely on it for per-request locale
// detection. It stays as a simple, safe fallback for that rare edge case.
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <NotFoundContent
      eyebrow={t("eyebrow")}
      title={t("title")}
      subtitle={t("subtitle")}
      cta={t("cta")}
    />
  );
}
