"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import SectionHeading from "./SectionHeading";

const CODE_PATTERN = /^[A-Za-z0-9]{4,32}$/;

export default function Tracking() {
  const t = useTranslations("tracking");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!CODE_PATTERN.test(trimmed)) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/tracking/${trimmed}`);
  }

  return (
    <section id="tracking" className="mx-auto max-w-6xl px-6 py-24 sm:px-12">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <p className="mx-auto mt-6 max-w-xl text-center text-[13px] leading-relaxed text-muted">
        {t("subtitle")}
      </p>

      <div className="mx-auto mt-12 max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(false);
            }}
            placeholder={t("placeholder")}
            className="flex-1 border border-border bg-midnight-light px-5 py-4 text-[14px] font-light text-cream placeholder:text-muted outline-none transition-colors focus:border-gold sm:border-r-0"
          />
          <button
            type="submit"
            className="whitespace-nowrap border border-gold px-8 py-4 text-[10px] font-normal tracking-[0.2em] text-gold uppercase transition-colors hover:bg-gold hover:text-midnight"
          >
            {t("submit")}
          </button>
        </form>

        {error && <p className="mt-3 text-left text-sm text-red-400">{t("invalidCode")}</p>}
      </div>
    </section>
  );
}
