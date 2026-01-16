// src/utils/met.ts

// --------------------
// Types
// --------------------
export type Intensity = "light" | "moderate" | "heavy";

export type ActivityKey =
  | "lifting"
  | "aerobic"
  | "swimming"
  | "cycling"
  | "aerobic_exercise"
  | "resistance_training"
  | "flexibility_exercise"
  | "balance_exercise";

export type ActivityItem = {
  key: ActivityKey;
  title: string;
  subtitle: string;
  group: "popular" | "collection";
  hasDistance?: boolean;
};

// --------------------
// Labels
// --------------------
export const ACTIVITY_LABEL: Record<ActivityKey, string> = {
  lifting: "Lifting",
  aerobic: "Aerobic",
  swimming: "Swimming",
  cycling: "Cycling",
  aerobic_exercise: "Aerobic Exercise",
  resistance_training: "Resistance Training",
  flexibility_exercise: "Flexibility Exercise",
  balance_exercise: "Balance Exercise",
};

// --------------------
// Activity lists
// --------------------
export const POPULAR_ACTIVITIES: ActivityItem[] = [
  {
    key: "lifting",
    title: "Lifting",
    subtitle: "Strength training",
    group: "popular",
  },
  {
    key: "aerobic",
    title: "Aerobic",
    subtitle: "Cardio session",
    group: "popular",
  },
  {
    key: "swimming",
    title: "Swimming",
    subtitle: "Pool swim",
    group: "popular",
    hasDistance: true,
  },
  {
    key: "cycling",
    title: "Cycling",
    subtitle: "Bike ride",
    group: "popular",
    hasDistance: true,
  },
];

export const COLLECTION_ACTIVITIES: ActivityItem[] = [
  {
    key: "aerobic_exercise",
    title: "Aerobic Exercise",
    subtitle: "Improve endurance",
    group: "collection",
  },
  {
    key: "resistance_training",
    title: "Resistance Training",
    subtitle: "Build strength & muscle",
    group: "collection",
  },
  {
    key: "flexibility_exercise",
    title: "Flexibility Exercise",
    subtitle: "Stretching & mobility",
    group: "collection",
  },
  {
    key: "balance_exercise",
    title: "Balance Exercise",
    subtitle: "Stability & control",
    group: "collection",
  },
];

// --------------------
// MET values
// --------------------
const MET_TABLE: Record<
  ActivityKey,
  { light: number; moderate: number; heavy: number }
> = {
  lifting: { light: 3.5, moderate: 5.0, heavy: 6.5 },
  aerobic: { light: 4.0, moderate: 7.0, heavy: 9.0 },
  swimming: { light: 5.0, moderate: 8.0, heavy: 10.0 },
  cycling: { light: 4.0, moderate: 7.5, heavy: 10.0 },
  aerobic_exercise: { light: 4.5, moderate: 7.5, heavy: 10.0 },
  resistance_training: { light: 3.5, moderate: 5.0, heavy: 6.0 },
  flexibility_exercise: { light: 2.0, moderate: 2.5, heavy: 3.0 },
  balance_exercise: { light: 2.5, moderate: 3.0, heavy: 3.5 },
};

// --------------------
// Helpers
// --------------------
export function metOf(key: ActivityKey, intensity: Intensity): number {
  const row = MET_TABLE[key];
  if (!row) return 0;

  const v = row[intensity];
  return Number.isFinite(v) ? v : 0;
}

// kcal/min = MET × 3.5 × weight(kg) / 200
export function kcalBurned(
  weightKg: number,
  minutes: number,
  met: number
): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return 0;
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  if (!Number.isFinite(met) || met <= 0) return 0;

  const kcal = (met * 3.5 * weightKg * minutes) / 200;
  return Math.round(kcal);
}
