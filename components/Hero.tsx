"use client";

import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations("hero");

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
  ];

  return (
    <section
      id="top"
      className="relative overflow-hidden px-6 pb-20 pt-32 text-center sm:px-6 sm:pb-24 sm:pt-40"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(201,169,110,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl">
        <p className="mb-10 text-[10px] font-normal tracking-[0.35em] text-gold uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-[clamp(2.75rem,8vw,5rem)] font-light leading-[0.95] tracking-[0.02em] text-cream">
          {t("title")}
        </h1>
        <div className="mx-auto mt-8 h-px w-16 bg-gold" />
        <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-relaxed tracking-wide text-muted">
          {t("subtitle")}
        </p>

        <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#calculator"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("calculator");
            }}
            className="w-full border border-gold px-9 py-[13px] text-center text-[10px] font-normal tracking-[0.22em] text-gold uppercase transition-colors hover:bg-gold hover:text-midnight sm:w-auto"
          >
            {t("ctaCalculator")}
          </a>
          <a
            href="#quote-cargo"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("quote-cargo");
            }}
            className="w-full bg-gold px-9 py-[13px] text-center text-[10px] font-normal tracking-[0.22em] text-midnight uppercase transition-opacity hover:opacity-85 sm:w-auto"
          >
            {t("ctaQuote")}
          </a>
        </div>

        <dl className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-heading text-3xl font-light text-cream">{stat.value}</dd>
              <dd className="mt-1 text-[10px] tracking-[0.15em] text-muted uppercase">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
