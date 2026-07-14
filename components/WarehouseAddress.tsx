"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { warehouseAddressSchema, type WarehouseAddressInput } from "@/lib/schemas";
import SectionHeading from "./SectionHeading";

type Status = "idle" | "submitting" | "success" | "error";

interface AssignmentResult {
  code: string;
  fullAddress: string;
  isExisting: boolean;
}

const inputClass =
  "w-full appearance-none border border-border bg-midnight px-4 py-3 text-[13px] font-light text-cream outline-none transition-colors focus:border-gold";

export default function WarehouseAddress() {
  const t = useTranslations("address");
  const tForm = useTranslations("form");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AssignmentResult | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WarehouseAddressInput>({
    resolver: zodResolver(warehouseAddressSchema),
  });

  async function onSubmit(values: WarehouseAddressInput) {
    setStatus("submitting");
    try {
      const res = await fetch("/api/warehouse-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("request failed");
      const data: AssignmentResult = await res.json();
      setResult(data);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div id="address" className="border-y border-border bg-midnight-light">
      <div className="mx-auto max-w-2xl px-6 py-24 sm:px-12">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <p className="mx-auto mt-6 max-w-xl text-center text-[13px] leading-relaxed text-muted">
          {t("subtitle")}
        </p>

        <div className="mt-14 border border-border bg-midnight p-7 sm:p-14">
          {status === "success" && result ? (
            <div>
              <p className="text-[10px] font-normal tracking-[0.2em] text-gold uppercase">
                {t("resultTitle")}
              </p>
              <p className="mt-3 text-[13px] text-muted">
                {result.isExisting ? t("resultExisting") : t("resultNew")}
              </p>

              <div className="mt-6 whitespace-pre-line border border-border bg-midnight-light p-6 font-mono text-[13px] leading-relaxed text-cream">
                {result.fullAddress}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="mt-4 w-full border border-gold py-3.5 text-[10px] font-normal tracking-[0.22em] text-gold uppercase transition-colors hover:bg-gold hover:text-midnight"
              >
                {copied ? t("copied") : t("copy")}
              </button>

              <div className="mt-10 border-t border-border pt-8">
                <p className="text-[10px] font-normal tracking-[0.2em] text-gold uppercase">
                  {t("guideTitle")}
                </p>
                <ol className="mt-4 flex flex-col gap-3 text-[12px] leading-relaxed text-muted">
                  <li>1. {t("guideStep1")}</li>
                  <li>2. {t("guideStep2")}</li>
                  <li>3. {t("guideStep3")}</li>
                </ol>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("firstName")} error={errors.firstName && tForm("required")}>
                  <input {...register("firstName")} className={inputClass} />
                </Field>
                <Field label={t("lastName")} error={errors.lastName && tForm("required")}>
                  <input {...register("lastName")} className={inputClass} />
                </Field>
              </div>
              <Field label={t("phone")} error={errors.phone && t("errorPhone")}>
                <input type="tel" {...register("phone")} className={inputClass} />
              </Field>
              <Field label={t("email")} error={errors.email && tForm("invalidEmail")}>
                <input type="email" {...register("email")} className={inputClass} />
              </Field>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="mt-2 w-full border border-gold py-3.5 text-[10px] font-normal tracking-[0.22em] text-gold uppercase transition-colors hover:bg-gold hover:text-midnight disabled:opacity-60"
              >
                {status === "submitting" ? t("submitting") : t("submit")}
              </button>

              {status === "error" && (
                <p className="text-[12px] text-red-400">{t("errorGeneric")}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | false;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-[9px] font-normal tracking-[0.2em] text-gold uppercase">
      {label}
      {children}
      {error && <span className="text-[11px] normal-case tracking-normal text-red-400">{error}</span>}
    </label>
  );
}
