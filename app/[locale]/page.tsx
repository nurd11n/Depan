import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Calculator from "@/components/Calculator";
import Tracking from "@/components/Tracking";
import RatesTable from "@/components/RatesTable";
import WarehouseAddress from "@/components/WarehouseAddress";
import QuoteCargo from "@/components/QuoteCargo";
import QuoteSourcing from "@/components/QuoteSourcing";
import SectionHeading from "@/components/SectionHeading";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("quote");

  return (
    <main className="flex-1">
      <Hero />
      <Services />
      <Calculator />
      <Tracking />
      <RatesTable />
      <WarehouseAddress />

      <div id="quote-cargo" className="border-t border-border bg-midnight-light">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-12">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
          <div className="mt-16 grid grid-cols-1 gap-px md:grid-cols-2">
            <QuoteCargo />
            <QuoteSourcing />
          </div>
        </div>
      </div>
    </main>
  );
}
