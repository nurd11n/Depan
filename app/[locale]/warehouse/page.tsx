import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/pageMeta";
import WarehouseAddress from "@/components/WarehouseAddress";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    subpath: "/warehouse",
    titleKey: "address.title",
    descriptionKey: "address.subtitle",
  });
}

export default async function WarehousePage({
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
      <WarehouseAddress />
    </main>
  );
}
