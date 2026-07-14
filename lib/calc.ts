import {
  AIR_MIN_KG,
  AIR_SMALL_PARCEL,
  AIR_TIERS,
  AIR_TRANSIT_DAYS,
  REMOTE_ZIP_SURCHARGE_PER_PIECE,
  SEA_LANES,
  SEA_MIN_KG,
  SURCHARGE_PER_KG,
  VOLUMETRIC_DIVISOR,
  type CargoSensitivity,
  type SeaSpeed,
  type ShippingMode,
} from "./rates";

export interface EstimateInput {
  mode: ShippingMode;
  seaSpeed?: SeaSpeed;
  sensitivity: CargoSensitivity;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  pieces?: number;
  isRemoteZip?: boolean;
  hasSurchargeCategory?: boolean;
}

export interface EstimateResult {
  volumetricKg: number;
  chargeableKg: number;
  transitDays: [number, number];
  breakdown: {
    freightCost: number;
    surcharge: number;
    remoteZipFee: number;
  };
  cost: number;
  pricePerKgApplied: number | null;
}

function roundUpToKg(kg: number): number {
  return Math.max(0, Math.ceil(kg));
}

function seaCost(
  chargeableKg: number,
  speed: SeaSpeed,
  sensitivity: CargoSensitivity,
): { cost: number; transitDays: [number, number]; pricePerKg: number } {
  const lane = SEA_LANES.find((l) => l.speed === speed);
  if (!lane) throw new Error(`Unknown sea speed: ${speed}`);

  const tiers = lane.tiers[sensitivity];
  const sorted = [...tiers].sort((a, b) => a.minKg - b.minKg);
  let tier = sorted[0];
  for (const t of sorted) {
    if (chargeableKg >= t.minKg) tier = t;
  }

  return {
    cost: chargeableKg * tier.pricePerKg,
    transitDays: lane.transitDays,
    pricePerKg: tier.pricePerKg,
  };
}

function airCost(
  chargeableKg: number,
  sensitivity: CargoSensitivity,
): { cost: number; pricePerKg: number | null } {
  const smallParcelTier = AIR_TIERS[0].minKg; // 10kg boundary

  if (chargeableKg < smallParcelTier) {
    const rate = AIR_SMALL_PARCEL[sensitivity];
    const halfKgUnits = chargeableKg * 2;
    const cost =
      rate.firstHalfKg + Math.max(0, halfKgUnits - 1) * rate.extraHalfKg;
    return { cost, pricePerKg: null };
  }

  const tier =
    AIR_TIERS.find(
      (t) => chargeableKg >= t.minKg && (t.maxKg === null || chargeableKg < t.maxKg),
    ) ?? AIR_TIERS[AIR_TIERS.length - 1];

  const pricePerKg = tier.pricePerKg[sensitivity];
  return { cost: chargeableKg * pricePerKg, pricePerKg };
}

export function estimate(input: EstimateInput): EstimateResult {
  const pieces = input.pieces ?? 1;

  const volumetricKg =
    (input.lengthCm * input.widthCm * input.heightCm) / VOLUMETRIC_DIVISOR;

  const rawChargeable = Math.max(input.actualWeightKg, volumetricKg);
  let chargeableKg = roundUpToKg(rawChargeable);

  const modeMin = input.mode === "sea" ? SEA_MIN_KG : AIR_MIN_KG;
  chargeableKg = Math.max(chargeableKg, modeMin);

  let freightCost: number;
  let transitDays: [number, number];
  let pricePerKgApplied: number | null;

  if (input.mode === "sea") {
    const speed = input.seaSpeed ?? "standard";
    const result = seaCost(chargeableKg, speed, input.sensitivity);
    freightCost = result.cost;
    transitDays = result.transitDays;
    pricePerKgApplied = result.pricePerKg;
  } else {
    const result = airCost(chargeableKg, input.sensitivity);
    freightCost = result.cost;
    transitDays = AIR_TRANSIT_DAYS;
    pricePerKgApplied = result.pricePerKg;
  }

  const surcharge = input.hasSurchargeCategory
    ? chargeableKg * SURCHARGE_PER_KG
    : 0;

  const remoteZipFee = input.isRemoteZip
    ? pieces * REMOTE_ZIP_SURCHARGE_PER_PIECE
    : 0;

  const cost = freightCost + surcharge + remoteZipFee;

  return {
    volumetricKg,
    chargeableKg,
    transitDays,
    breakdown: { freightCost, surcharge, remoteZipFee },
    cost,
    pricePerKgApplied,
  };
}
