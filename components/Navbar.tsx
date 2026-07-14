"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

function persistScroll() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("scrollY", String(window.scrollY));
  }
}

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
          <div className="hidden items-center gap-1.5 text-[10px] font-normal tracking-[0.15em] lg:flex">
            {routing.locales.map((l) =>
              l === locale ? (
                <span key={l} className="border border-gold px-3 py-[5px] uppercase text-gold">
                  {l}
                </span>
              ) : (
                <Link
                  key={l}
                  href={pathname}
                  locale={l}
                  onClick={persistScroll}
                  className="border border-transparent px-3 py-[5px] uppercase text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  {l}
                </Link>
              ),
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
            <li className="mt-2 flex gap-4 border-t border-border pt-3">
              {routing.locales.map((l) =>
                l === locale ? (
                  <span key={l} className="text-[11px] font-normal uppercase tracking-[0.2em] text-gold">
                    {l}
                  </span>
                ) : (
                  <Link
                    key={l}
                    href={pathname}
                    locale={l}
                    onClick={() => {
                      persistScroll();
                      setOpen(false);
                    }}
                    className="text-[11px] font-normal uppercase tracking-[0.2em] text-muted hover:text-gold"
                  >
                    {l}
                  </Link>
                ),
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
