export type ActivityIntensity = "light" | "moderate" | "heavy";

export type ActivityKey =
  | "aerobic_exercise"
  | "resistance_training"
  | "flexibility_exercise"
  | "balance_exercise"
  // popular shortcuts
  | "lifting"
  | "aerobic"
  | "swimming"
  | "cycling";

export type ActivityLog = {
  id: string;
  activityKey: ActivityKey;
  name: string; // snapshot label
  intensity: ActivityIntensity;
  minutes: number;
  met: number; // snapshot
  kcal_burned: number; // snapshot
  distance_km?: number;
  createdAt?: any;
};
