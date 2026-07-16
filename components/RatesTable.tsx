"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AIR_SMALL_PARCEL, AIR_TIERS, SEA_LANES } from "@/lib/rates";
import SectionHeading from "./SectionHeading";

type Tab = "sea" | "air";

export default function RatesTable() {
  const t = useTranslations("rates");
  const [tab, setTab] = useState<Tab>("sea");

  return (
    <section id="rates" className="mx-auto max-w-4xl px-6 py-24 sm:px-12">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <p className="mx-auto mt-6 max-w-xl text-center text-[13px] leading-relaxed text-muted">
        {t("subtitle")}
      </p>

      <div className="mx-auto mt-10 flex w-fit">
        <button
          type="button"
          onClick={() => setTab("sea")}
          className={`border px-8 py-2.5 text-[10px] font-normal tracking-[0.2em] uppercase transition-colors ${
            tab === "sea" ? "border-gold text-gold" : "border-border text-muted"
          }`}
        >
          {t("tabSea")}
        </button>
        <button
          type="button"
          onClick={() => setTab("air")}
          className={`border border-l-0 px-8 py-2.5 text-[10px] font-normal tracking-[0.2em] uppercase transition-colors ${
            tab === "air" ? "border-gold text-gold" : "border-border text-muted"
          }`}
        >
          {t("tabAir")}
        </button>
      </div>

      <div className="relative mt-9">
        {/* Signals horizontal scroll is available on narrow screens — the
            table has a min-width and will overflow below ~560px. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-midnight to-transparent sm:hidden" />
        <div className="overflow-x-auto">
        {tab === "sea" ? (
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-3.5 pr-5 text-[9px] font-normal tracking-[0.22em] text-gold uppercase">
                  {t("colTier")}
                </th>
                <th className="py-3.5 pr-5 text-[9px] font-normal tracking-[0.22em] text-gold uppercase">
                  {t("colGeneral")}
                </th>
                <th className="py-3.5 pr-5 text-[9px] font-normal tracking-[0.22em] text-gold uppercase">
                  {t("colSensitive")}
                </th>
                <th className="py-3.5 text-[9px] font-normal tracking-[0.22em] text-gold uppercase">
                  {t("colTransit")}
                </th>
              </tr>
            </thead>
            <tbody>
              {SEA_LANES.map((lane) =>
                lane.tiers.general.map((tier, i) => (
                  <tr
                    key={`${lane.speed}-${tier.minKg}`}
                    className="border-b border-border transition-colors hover:bg-cream/[0.04]"
                  >
                    <td className="py-4 pr-5 text-cream">
                      {i === 0 && (
                        <span className="mr-2 border border-border px-2 py-0.5 text-[9px] tracking-[0.15em] text-muted uppercase">
                          {lane.speed === "standard" ? t("standardLane") : t("fastLane")}
                        </span>
                      )}
                      {tier.minKg}kg+
                    </td>
                    <td className="py-4 pr-5 text-cream">${tier.pricePerKg.toFixed(2)}</td>
                    <td className="py-4 pr-5 text-cream">
                      ${lane.tiers.sensitive[i].pricePerKg.toFixed(2)}
                    </td>
                    <td className="py-4 text-cream">
                      {lane.transitDays[0]}–{lane.transitDays[1]}d
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-3.5 pr-5 text-[9px] font-normal tracking-[0.22em] text-gold uppercase">
                  {t("colTier")}
                </th>
                <th className="py-3.5 pr-5 text-[9px] font-normal tracking-[0.22em] text-gold uppercase">
                  {t("colGeneral")}
                </th>
                <th className="py-3.5 text-[9px] font-normal tracking-[0.22em] text-gold uppercase">
                  {t("colSensitive")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border transition-colors hover:bg-cream/[0.04]">
                <td className="py-4 pr-5 text-cream">{t("airSmallParcel")}</td>
                <td className="py-4 pr-5 text-cream">
                  ${AIR_SMALL_PARCEL.general.firstHalfKg.toFixed(2)} / $
                  {AIR_SMALL_PARCEL.general.extraHalfKg.toFixed(2)}
                </td>
                <td className="py-4 text-cream">
                  ${AIR_SMALL_PARCEL.sensitive.firstHalfKg.toFixed(2)} / $
                  {AIR_SMALL_PARCEL.sensitive.extraHalfKg.toFixed(2)}
                </td>
              </tr>
              {AIR_TIERS.map((tier) => (
                <tr key={tier.minKg} className="border-b border-border transition-colors hover:bg-cream/[0.04]">
                  <td className="py-4 pr-5 text-cream">
                    {tier.minKg}
                    {tier.maxKg ? `–${tier.maxKg}kg` : "kg+"}
                  </td>
                  <td className="py-4 pr-5 text-cream">${tier.pricePerKg.general.toFixed(2)}/kg</td>
                  <td className="py-4 text-cream">${tier.pricePerKg.sensitive.toFixed(2)}/kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2 text-[11px] text-muted">
        <p>{t("surchargeNote")}</p>
        <p>{t("remoteZipNote")}</p>
      </div>

      <div className="mt-8 border border-border bg-midnight-light p-6">
        <h3 className="text-[10px] font-normal tracking-[0.2em] text-gold uppercase">
          {t("claimsTitle")}
        </h3>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">{t("claimsText")}</p>
      </div>
    </section>
  );
}
