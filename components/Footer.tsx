"use client";

import { useTranslations } from "next-intl";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_DISPLAY,
  INSTAGRAM_URL,
  WHATSAPP_URL,
} from "@/lib/site";

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="flex flex-wrap items-start justify-between gap-8 border-t border-border px-6 py-16 sm:px-12">
        <div>
          <p className="font-heading text-2xl font-light tracking-[0.15em] text-cream">
            {tNav("logo")}
          </p>
          <span className="mt-0.5 block text-[9px] tracking-[0.3em] text-gold">
            {tNav("logoSub")}
          </span>
          <p className="mt-4 max-w-xs text-[10px] tracking-wide text-muted">{t("tagline")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[9px] font-normal uppercase tracking-[0.22em] text-gold">
            {t("contactTitle")}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[12px] tracking-wide text-muted transition-colors hover:text-cream"
          >
            {CONTACT_EMAIL}
          </a>
          <a
            href={`tel:${CONTACT_PHONE}`}
            className="text-[12px] tracking-wide text-muted transition-colors hover:text-cream"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
          <div className="mt-1 flex gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit border border-border px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-muted transition-colors hover:border-gold hover:text-gold"
            >
              {t("whatsapp")}
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit border border-border px-5 py-2.5 text-[10px] uppercase tracking-[0.15em] text-muted transition-colors hover:border-gold hover:text-gold"
            >
              {t("instagram")}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 py-6 text-center text-[10px] tracking-wide text-muted sm:px-12">
        <p>{t("rights", { year })}</p>
        <p className="mt-1">{t("license")}</p>
      </div>
    </footer>
  );
}
