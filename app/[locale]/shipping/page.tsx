import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/pageMeta";
import Calculator from "@/components/Calculator";
import RatesTable from "@/components/RatesTable";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    subpath: "/shipping",
    titleKey: "rates.title",
    descriptionKey: "rates.subtitle",
  });
}

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <main className="flex-1 pt-16">
      <Calculator />
      <RatesTable />
    </main>
  );
}
