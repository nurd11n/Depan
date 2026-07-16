"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorBoundary");

  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pt-16 sm:px-12">
      <div className="mx-auto max-w-xl py-24 text-center">
        <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-gold">
          {t("eyebrow")}
        </p>
        <div className="mx-auto mb-5 mt-4 h-px w-12 bg-gold" />
        <h1 className="font-heading text-3xl font-light tracking-wide text-cream sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-[13px] leading-relaxed text-muted">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full border border-gold px-9 py-[13px] text-[10px] font-normal tracking-[0.22em] text-gold uppercase transition-colors hover:bg-gold hover:text-midnight sm:w-auto"
          >
            {t("retry")}
          </button>
          <Link
            href="/"
            className="w-full bg-gold px-9 py-[13px] text-center text-[10px] font-normal tracking-[0.22em] text-midnight uppercase transition-opacity hover:opacity-85 sm:w-auto"
          >
            {t("home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
