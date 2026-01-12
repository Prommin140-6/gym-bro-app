// src/utils/targets.ts
import type { Goal, ExerciseStyle, Sex } from "./healthCalc";
import {
  activityMultiplier,
  calcBMR,
  calcFFM,
  calcREEFromFFM,
  calcTDEE,
  recommendedCalories,
} from "./healthCalc";
import { burnTargetFromTDEE } from "./burnTarget";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function round(n: number) {
  return Math.round(n);
}

export type TargetsInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  exerciseStyle: ExerciseStyle;
  goal: Goal;

  // ✅ optional: ถ้ามีจะใช้ REE จาก FFM (แม่นขึ้น)
  bodyFatPercent?: number | null;
};

export type TargetsOutput = {
  reeOrBmr: number;
  tdee: number;

  calorieTarget: number;
  carbTarget: number;
  proteinTarget: number;
  fatTarget: number;

  burnTarget: number;
};

function proteinPerKg(goal: Goal) {
  if (goal === "lose_weight") return 2.0;
  if (goal === "maintain_muscle") return 2.0;
  if (goal === "gain_weight") return 1.8;
  return 1.6;
}

export function calcTargets(input: TargetsInput): TargetsOutput {
  const sex = input.sex;
  const age = Number(input.age);
  const heightCm = Number(input.heightCm);
  const weightKg = Number(input.weightKg);
  const exerciseStyle = input.exerciseStyle;
  const goal = input.goal;

  const pal = activityMultiplier(exerciseStyle);

  // ✅ REE from FFM if bodyFat provided, else fallback BMR
  const reeOrBmr =
    typeof input.bodyFatPercent === "number"
      ? calcREEFromFFM(calcFFM(weightKg, input.bodyFatPercent))
      : calcBMR(sex, heightCm, weightKg, age);

  const tdee = round(calcTDEE(reeOrBmr, pal));

  const calorieTarget = round(recommendedCalories(tdee, goal));

  // Macros: personalized
  const proteinTarget = round(clamp(weightKg * proteinPerKg(goal), 80, 260));
  const fatTarget = round(clamp(weightKg * 0.8, 40, 120));

  const proteinKcal = proteinTarget * 4;
  const fatKcal = fatTarget * 9;
  const remaining = Math.max(0, calorieTarget - proteinKcal - fatKcal);
  const carbTarget = round(clamp(remaining / 4, 0, 650));

  // ✅ BurnTarget ผูกกับ style+goal
  const burnTarget = round(burnTargetFromTDEE(tdee, goal, exerciseStyle));

  return {
    reeOrBmr,
    tdee,
    calorieTarget,
    carbTarget,
    proteinTarget,
    fatTarget,
    burnTarget,
  };
}
