import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import NotFoundContent from "@/components/NotFoundContent";

// Handles every path under a valid locale that doesn't match a real page
// (the common 404 case — a typo'd or dead link). This is a normal page, so
// unlike the special app/[locale]/not-found.tsx file, it reliably receives
// the correct `locale` param and localizes properly — verified live that
// not-found.tsx's render gets cached at build time and doesn't, even when
// forced dynamic. The one trade-off: as a regular page this returns HTTP
// 200, not a true 404 status.
export default async function CatchAll({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

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
