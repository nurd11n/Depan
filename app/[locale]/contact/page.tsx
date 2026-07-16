import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/pageMeta";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_DISPLAY,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  WHATSAPP_URL,
} from "@/lib/site";
import SectionHeading from "@/components/SectionHeading";
import QuoteCargo from "@/components/QuoteCargo";
import QuoteSourcing from "@/components/QuoteSourcing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    subpath: "/contact",
    titleKey: "quote.title",
    descriptionKey: "footer.tagline",
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations();

  const channels = [
    { label: t("footer.email"), value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    { label: t("footer.phone"), value: CONTACT_PHONE_DISPLAY, href: `tel:${CONTACT_PHONE}` },
    { label: t("footer.whatsapp"), value: CONTACT_PHONE_DISPLAY, href: WHATSAPP_URL },
    { label: t("footer.instagram"), value: `@${INSTAGRAM_HANDLE}`, href: INSTAGRAM_URL },
  ];

  return (
    <main className="flex-1 pt-16">
      <section className="mx-auto max-w-6xl px-6 py-24 sm:px-12">
        <SectionHeading eyebrow={t("quote.eyebrow")} title={t("quote.title")} />

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex flex-col gap-1 border border-border bg-midnight-light p-5 transition-colors hover:border-gold/40"
            >
              <span className="text-[9px] font-normal uppercase tracking-[0.2em] text-gold">
                {c.label}
              </span>
              <span className="truncate text-[12px] text-cream" title={c.value}>
                {c.value}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px md:grid-cols-2">
          <QuoteCargo />
          <QuoteSourcing />
        </div>
      </section>
    </main>
  );
}
