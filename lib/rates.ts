// SINGLE SOURCE OF TRUTH for all pricing. The calculator and the rates
// table both import from here — never hardcode a price in a component.

export type CargoSensitivity = "general" | "sensitive";
export type SeaSpeed = "standard" | "fast";
export type ShippingMode = "sea" | "air";

export interface WeightTier {
  minKg: number;
  pricePerKg: number;
}

export interface SeaLane {
  speed: SeaSpeed;
  transitDays: [number, number];
  tiers: Record<CargoSensitivity, WeightTier[]>;
}

// Sea freight — price/kg by weight tier (USD)
export const SEA_LANES: SeaLane[] = [
  {
    speed: "standard",
    transitDays: [20, 25],
    tiers: {
      general: [
        { minKg: 12, pricePerKg: 4.5 },
        { minKg: 51, pricePerKg: 4.13 },
        { minKg: 100, pricePerKg: 3.75 },
      ],
      sensitive: [
        { minKg: 12, pricePerKg: 5.38 },
        { minKg: 51, pricePerKg: 4.88 },
        { minKg: 100, pricePerKg: 4.38 },
      ],
    },
  },
  {
    speed: "fast",
    transitDays: [14, 18],
    tiers: {
      general: [
        { minKg: 12, pricePerKg: 4.88 },
        { minKg: 51, pricePerKg: 4.5 },
        { minKg: 100, pricePerKg: 4.13 },
      ],
      sensitive: [
        { minKg: 12, pricePerKg: 5.75 },
        { minKg: 51, pricePerKg: 5.38 },
        { minKg: 100, pricePerKg: 4.88 },
      ],
    },
  },
];

// Air freight — transit 5-9 days
export const AIR_TRANSIT_DAYS: [number, number] = [5, 9];

export interface AirSmallParcelRate {
  // 5-10kg billed per 0.5kg
  firstHalfKg: number;
  extraHalfKg: number;
}

export const AIR_SMALL_PARCEL: Record<CargoSensitivity, AirSmallParcelRate> = {
  general: { firstHalfKg: 22.5, extraHalfKg: 8.13 },
  sensitive: { firstHalfKg: 25.0, extraHalfKg: 8.75 },
};

export interface AirWeightTier {
  minKg: number;
  maxKg: number | null;
  pricePerKg: Record<CargoSensitivity, number>;
}

export const AIR_TIERS: AirWeightTier[] = [
  {
    minKg: 10,
    maxKg: 20,
    pricePerKg: { general: 14.13, sensitive: 14.88 },
  },
  {
    minKg: 20,
    maxKg: null,
    pricePerKg: { general: 13.63, sensitive: 14.63 },
  },
];

export const AIR_MIN_KG = 5;
export const SEA_MIN_KG = 12;

// Surcharge +0.38/kg for restricted-adjacent categories
export const SURCHARGE_PER_KG = 0.38;
export const SURCHARGE_CATEGORIES = [
  "essentialOils",
  "aromatherapy",
  "candles",
  "perfume",
  "medicine",
  "supplements",
  "fGoods",
] as const;
export type SurchargeCategory = (typeof SURCHARGE_CATEGORIES)[number];

export const REMOTE_ZIP_SURCHARGE_PER_PIECE = 15;

export const VOLUMETRIC_DIVISOR = 6000;

export const CLAIMS_REFUND_PER_KG = 2.5;
export const CLAIMS_MAX_PER_PIECE_AFTER_CARRIER_PICKUP = 100;
