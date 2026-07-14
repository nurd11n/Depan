import { z } from "zod";

const contactFields = {
  name: z.string().min(2).max(120),
  contact: z.string().min(5).max(120),
  email: z.string().email(),
  // honeypot: real users never see/fill this field; bots that autofill every
  // field will. Left unconstrained here so it passes validation either way —
  // the route handler checks it and silently no-ops instead of erroring.
  website: z.string().optional().or(z.literal("")),
};

export const cargoQuoteSchema = z.object({
  type: z.literal("cargo"),
  ...contactFields,
  weightKg: z.coerce.number().positive(),
  cargoType: z.enum(["general", "sensitive"]),
  shippingPref: z.enum(["sea", "air", "unsure"]),
  description: z.string().min(5).max(2000),
});

export const sourcingQuoteSchema = z.object({
  type: z.literal("sourcing"),
  ...contactFields,
  product: z.string().min(2).max(500),
  targetPricePerUnit: z.coerce.number().positive().optional(),
  quantity: z.coerce.number().int().positive(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const quoteSchema = z.discriminatedUnion("type", [
  cargoQuoteSchema,
  sourcingQuoteSchema,
]);

export type CargoQuoteFormInput = z.input<typeof cargoQuoteSchema>;
export type CargoQuoteOutput = z.output<typeof cargoQuoteSchema>;
export type SourcingQuoteFormInput = z.input<typeof sourcingQuoteSchema>;
export type SourcingQuoteOutput = z.output<typeof sourcingQuoteSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;

export const warehouseAddressSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/[^\d]/g, "").length >= 7, "invalid phone"),
  email: z.string().trim().email(),
});

export type WarehouseAddressInput = z.infer<typeof warehouseAddressSchema>;
