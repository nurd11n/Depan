"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  cargoQuoteSchema,
  type CargoQuoteFormInput,
  type CargoQuoteOutput,
} from "@/lib/schemas";

type Status = "idle" | "submitting" | "success" | "error";

export default function QuoteCargo() {
  const t = useTranslations("quoteCargo");
  const tForm = useTranslations("form");
  const [status, setStatus] = useState<Status>("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CargoQuoteFormInput, unknown, CargoQuoteOutput>({
    resolver: zodResolver(cargoQuoteSchema),
    defaultValues: {
      type: "cargo",
      cargoType: "general",
      shippingPref: "unsure",
      website: "",
    },
  });

  async function onSubmit(values: CargoQuoteOutput) {
    setStatus("submitting");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="border border-border bg-midnight-light p-9 sm:p-13">
      <h3 className="font-heading text-2xl font-normal text-cream">{t("title")}</h3>
      <p className="mt-2 text-[11px] text-muted">{t("subtitle")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
        <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...register("website")} />

        <Field label={t("name")} error={errors.name && tForm("required")}>
          <input {...register("name")} className={inputClass} />
        </Field>
        <Field label={t("contact")} error={errors.contact && tForm("required")}>
          <input {...register("contact")} className={inputClass} />
        </Field>
        <Field label={t("email")} error={errors.email && tForm("invalidEmail")}>
          <input type="email" {...register("email")} className={inputClass} />
        </Field>
        <Field label={t("weight")} error={errors.weightKg && tForm("required")}>
          <input type="number" step="0.1" min="0.1" {...register("weightKg")} className={inputClass} />
        </Field>
        <Field label={t("cargoType")}>
          <select {...register("cargoType")} className={inputClass}>
            <option value="general">{t("cargoTypeGeneral")}</option>
            <option value="sensitive">{t("cargoTypeSensitive")}</option>
          </select>
        </Field>
        <Field label={t("shippingPref")}>
          <select {...register("shippingPref")} className={inputClass}>
            <option value="sea">{t("shippingPrefSea")}</option>
            <option value="air">{t("shippingPrefAir")}</option>
            <option value="unsure">{t("shippingPrefUnsure")}</option>
          </select>
        </Field>
        <Field label={t("description")} error={errors.description && tForm("tooShort")}>
          <textarea rows={3} {...register("description")} className={`${inputClass} resize-y`} />
        </Field>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-2 w-full border border-gold py-3.5 text-[10px] font-normal tracking-[0.22em] text-gold uppercase transition-colors hover:bg-gold hover:text-midnight disabled:opacity-60"
        >
          {status === "submitting" ? t("submitting") : t("submit")}
        </button>

        {status === "success" && (
          <p className="border border-gold/30 p-4 text-center text-[12px] tracking-wide text-gold">
            {t("success")}
          </p>
        )}
        {status === "error" && <p className="text-[12px] text-red-400">{t("errorGeneric")}</p>}
      </form>
    </div>
  );
}

const inputClass =
  "w-full appearance-none border border-border bg-midnight px-4 py-3 text-[13px] font-light text-cream outline-none transition-colors focus:border-gold";

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
