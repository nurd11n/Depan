import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

// Builds per-page localized metadata: the page's own title (the layout's
// title template appends "— DAPAN GLOBAL"), description, and canonical +
// hreflang alternates for this exact path across every locale.
export async function buildPageMetadata(opts: {
  locale: string;
  subpath: string; // "" for home, "/shipping", "/contact", …
  titleKey: string; // full dotted message key, e.g. "rates.title"
  descriptionKey?: string;
}): Promise<Metadata> {
  const t = await getTranslations({ locale: opts.locale });
  const title = t(opts.titleKey);
  const description = opts.descriptionKey ? t(opts.descriptionKey) : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/${opts.locale}${opts.subpath}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${opts.subpath}`])),
    },
    openGraph: {
      title,
      description,
      url: `/${opts.locale}${opts.subpath}`,
      siteName: "DAPAN GLOBAL",
      locale: opts.locale,
      type: "website",
    },
  };
}
