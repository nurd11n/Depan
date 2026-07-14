"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links: { id: string; label: string }[] = [
    { id: "services", label: t("services") },
    { id: "calculator", label: t("calculator") },
    { id: "tracking", label: t("tracking") },
    { id: "rates", label: t("rates") },
    { id: "address", label: t("address") },
    { id: "quote-cargo", label: t("contact") },
  ];

  function handleNavClick(id: string) {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  function switchLocale(next: string) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("scrollY", String(window.scrollY));
    }
  }

  const otherLocale = locale === "en" ? "ru" : "en";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-midnight/92 backdrop-blur-md">
      <nav className="flex items-center justify-between px-6 py-[22px] sm:px-12">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="font-heading text-[22px] font-normal tracking-[0.18em] text-cream">
            DAPAN
          </span>
          <span className="-mt-0.5 block text-[9px] font-light tracking-[0.32em] text-gold">
            {t("logoSub")}
          </span>
        </a>

        <ul className="hidden items-center gap-9 lg:flex">
          {links.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => handleNavClick(link.id)}
                className="text-[11px] font-normal uppercase tracking-[0.2em] text-muted transition-colors hover:text-cream"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-[10px] font-normal tracking-[0.15em] lg:flex">
            {locale === "en" ? (
              <span className="border border-gold px-3.5 py-[5px] text-gold">EN</span>
            ) : (
              <Link
                href={pathname}
                locale="en"
                onClick={() => switchLocale("en")}
                className="border border-transparent px-3.5 py-[5px] text-muted transition-colors hover:border-gold hover:text-gold"
              >
                EN
              </Link>
            )}
            {locale === "ru" ? (
              <span className="border border-gold px-3.5 py-[5px] text-gold">RU</span>
            ) : (
              <Link
                href={pathname}
                locale="ru"
                onClick={() => switchLocale("ru")}
                className="border border-transparent px-3.5 py-[5px] text-muted transition-colors hover:border-gold hover:text-gold"
              >
                RU
              </Link>
            )}
          </div>
          <button
            type="button"
            className="text-cream lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {open ? (
                <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-midnight lg:hidden">
          <ul className="flex flex-col gap-1 px-6 py-3">
            {links.map((link) => (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className="block w-full py-2 text-left text-[11px] uppercase tracking-[0.2em] text-muted hover:text-gold"
                >
                  {link.label}
                </button>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href={pathname}
                locale={otherLocale}
                onClick={() => {
                  switchLocale(otherLocale);
                  setOpen(false);
                }}
                className="block py-2 text-[11px] font-normal tracking-[0.2em] text-gold"
              >
                {locale === "en" ? "RU" : "EN"}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
