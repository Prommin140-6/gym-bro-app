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

/**
 * MET table (simple + consistent for MVP)
 * - Aerobic: 4 / 6 / 8
 * - Resistance: 3 / 5 / 6
 * - Flexibility: 2 / 2.5 / 3
 * - Balance: 2 / 2.5 / 3
 * Popular activities map to closest category:
 * - lifting -> resistance
 * - aerobic -> aerobic
 * - swimming -> aerobic (higher base)
 * - cycling -> aerobic (mid-high)
 */

export function metOf(activity: ActivityKey, intensity: Intensity): number {
  const pick = (l: number, m: number, h: number) =>
    intensity === "light" ? l : intensity === "moderate" ? m : h;

  switch (activity) {
    case "aerobic_exercise":
    case "aerobic":
      return pick(4, 6, 8);

    case "resistance_training":
    case "lifting":
      return pick(3, 5, 6);

    case "flexibility_exercise":
      return pick(2, 2.5, 3);

    case "balance_exercise":
      return pick(2, 2.5, 3);

    // Popular with slightly higher realistic MET
    case "swimming":
      return pick(5.5, 7.5, 9);

    case "cycling":
      return pick(4.5, 6.8, 8.5);

    default:
      return pick(3, 5, 6);
  }
}

export function kcalBurned(params: {
  met: number;
  weightKg: number;
  minutes: number;
}) {
  const hours = Math.max(0, params.minutes) / 60;
  const kcal = params.met * Math.max(0, params.weightKg) * hours;
  return Math.round(kcal);
}

export type ActivityItem = {
  key: ActivityKey;
  title: string;
  subtitle?: string;
  group: "popular" | "collection";
  hasDistance?: boolean;
};

export const POPULAR_ACTIVITIES: ActivityItem[] = [
  { key: "lifting", title: "Lifting", subtitle: "Strength training", group: "popular" },
  { key: "aerobic", title: "Aerobic", subtitle: "Cardio session", group: "popular" },
  { key: "swimming", title: "Swimming", subtitle: "Pool swim", group: "popular", hasDistance: true },
  { key: "cycling", title: "Cycling", subtitle: "Bike ride", group: "popular", hasDistance: true },
];

export const COLLECTION_ACTIVITIES: ActivityItem[] = [
  { key: "aerobic_exercise", title: "Aerobic Exercise", subtitle: "Improve endurance", group: "collection" },
  { key: "resistance_training", title: "Resistance Training", subtitle: "Build strength & muscle", group: "collection" },
  { key: "flexibility_exercise", title: "Flexibility Exercise", subtitle: "Stretching & mobility", group: "collection" },
  { key: "balance_exercise", title: "Balance Exercise", subtitle: "Stability & control", group: "collection" },
];
