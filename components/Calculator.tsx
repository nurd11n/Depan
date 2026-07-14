"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { estimate, type EstimateResult } from "@/lib/calc";
import SectionHeading from "./SectionHeading";

const schema = z.object({
  mode: z.enum(["sea", "air"]),
  seaSpeed: z.enum(["standard", "fast"]),
  sensitivity: z.enum(["general", "sensitive"]),
  actualWeightKg: z.coerce.number().min(0.01),
  lengthCm: z.coerce.number().min(1),
  widthCm: z.coerce.number().min(1),
  heightCm: z.coerce.number().min(1),
  pieces: z.coerce.number().int().min(1),
  isRemoteZip: z.boolean(),
  hasSurchargeCategory: z.boolean(),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const DEFAULT_VALUES: FormInput = {
  mode: "sea",
  seaSpeed: "standard",
  sensitivity: "general",
  actualWeightKg: 20,
  lengthCm: 40,
  widthCm: 30,
  heightCm: 30,
  pieces: 1,
  isRemoteZip: false,
  hasSurchargeCategory: false,
};

const inputClass =
  "w-full appearance-none border border-border bg-midnight px-4 py-3 text-[13px] font-light text-cream outline-none transition-colors focus:border-gold";
const labelClass = "text-[9px] font-normal tracking-[0.22em] text-gold uppercase";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

export default function Calculator() {
  const t = useTranslations("calculator");

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  const values = watch();
  const debouncedValues = useDebouncedValue(values, 300);

  const result: EstimateResult | null = useMemo(() => {
    const parsed = schema.safeParse(debouncedValues);
    if (!parsed.success) return null;
    return estimate(parsed.data);
  }, [debouncedValues]);

  const mode = watch("mode");

  return (
    <div className="border-y border-border bg-midnight-light">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:px-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <p className="mx-auto mt-6 max-w-xl text-center text-[13px] leading-relaxed text-muted">
          {t("subtitle")}
        </p>

        <div id="calculator" className="mt-14 border border-border bg-midnight p-7 sm:p-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelClass}>{t("mode")}</span>
              <select {...register("mode")} className={inputClass}>
                <option value="sea">{t("modeSea")}</option>
                <option value="air">{t("modeAir")}</option>
              </select>
            </label>

            {mode === "sea" ? (
              <label className="flex flex-col gap-2">
                <span className={labelClass}>{t("seaSpeed")}</span>
                <select {...register("seaSpeed")} className={inputClass}>
                  <option value="standard">{t("seaSpeedStandard")}</option>
                  <option value="fast">{t("seaSpeedFast")}</option>
                </select>
              </label>
            ) : (
              <label className="flex flex-col gap-2">
                <span className={labelClass}>{t("sensitivity")}</span>
                <select {...register("sensitivity")} className={inputClass}>
                  <option value="general">{t("sensitivityGeneral")}</option>
                  <option value="sensitive">{t("sensitivitySensitive")}</option>
                </select>
              </label>
            )}

            {mode === "sea" && (
              <label className="flex flex-col gap-2 lg:col-span-2">
                <span className={labelClass}>{t("sensitivity")}</span>
                <select {...register("sensitivity")} className={inputClass}>
                  <option value="general">{t("sensitivityGeneral")}</option>
                  <option value="sensitive">{t("sensitivitySensitive")}</option>
                </select>
              </label>
            )}

            <label className="flex flex-col gap-2">
              <span className={labelClass}>{t("weight")}</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                {...register("actualWeightKg")}
                className={inputClass}
              />
              {errors.actualWeightKg && (
                <span className="text-xs text-red-400">{t("errorWeight")}</span>
              )}
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelClass}>{t("pieces")}</span>
              <input type="number" min="1" step="1" {...register("pieces")} className={inputClass} />
            </label>

            <div className="flex flex-col gap-2 lg:col-span-2">
              <span className={labelClass}>
                {t("length")} × {t("width")} × {t("height")}
              </span>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" min="1" {...register("lengthCm")} className={inputClass} />
                <input type="number" min="1" {...register("widthCm")} className={inputClass} />
                <input type="number" min="1" {...register("heightCm")} className={inputClass} />
              </div>
              {(errors.lengthCm || errors.widthCm || errors.heightCm) && (
                <span className="text-xs text-red-400">{t("errorDimensions")}</span>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <label className="flex items-center gap-2.5 text-[12px] text-muted">
              <input
                type="checkbox"
                {...register("isRemoteZip")}
                className="h-3.5 w-3.5 accent-gold"
              />
              {t("remoteZip")}
            </label>

            <label className="flex items-center gap-2.5 text-[12px] text-muted">
              <input
                type="checkbox"
                {...register("hasSurchargeCategory")}
                className="h-3.5 w-3.5 accent-gold"
              />
              {t("surchargeCategory")}
            </label>
          </div>

          {result && (
            <div className="mt-8 border border-gold/30 bg-[rgba(201,169,110,0.04)] p-8">
              <div className="font-heading text-4xl font-light text-gold sm:text-5xl">
                ${result.cost.toFixed(2)}
              </div>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <ResultItem label={t("resultChargeableWeight")} value={`${result.chargeableKg} kg`} />
                <ResultItem
                  label={t("resultTransit")}
                  value={`${result.transitDays[0]}–${result.transitDays[1]} ${t("resultDays")}`}
                />
                <ResultItem
                  label={t("resultVolumetricWeight")}
                  value={`${result.volumetricKg.toFixed(2)} kg`}
                />
              </div>
              <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 text-[12px] text-muted">
                <BreakdownRow label={t("resultFreight")} value={`$${result.breakdown.freightCost.toFixed(2)}`} />
                {result.breakdown.surcharge > 0 && (
                  <BreakdownRow
                    label={t("resultSurcharge")}
                    value={`$${result.breakdown.surcharge.toFixed(2)}`}
                  />
                )}
                {result.breakdown.remoteZipFee > 0 && (
                  <BreakdownRow
                    label={t("resultRemoteZip")}
                    value={`$${result.breakdown.remoteZipFee.toFixed(2)}`}
                  />
                )}
              </div>
              <p className="mt-5 text-[11px] text-muted">{t("disclaimer")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] tracking-[0.2em] text-muted uppercase">{label}</p>
      <p className="mt-1 text-sm text-cream">{value}</p>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="text-cream">{value}</span>
    </div>
  );
}
