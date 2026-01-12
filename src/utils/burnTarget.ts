// src/utils/burnTarget.ts
import type { Goal, ExerciseStyle } from "./healthCalc";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * BurnTarget (better personalized)
 * - base percent by exercise style (คนออกกำลังกายเยอะควรมี burn target สูงกว่า)
 * - adjust by goal:
 *    lose_weight: +0.02
 *    gain_weight: -0.02
 *    maintain_*: 0
 *
 * burnTarget = clamp(round(TDEE * percent), 150, 900)
 */
export function burnTargetFromTDEE(tdee: number, goal: Goal, style: ExerciseStyle) {
  const base =
    style === "exercise_everyday"
      ? 0.20
      : style === "exercise_3_5_days_week"
      ? 0.16
      : style === "exercise_1_2_days_week"
      ? 0.13
      : 0.10; // not_exercise

  const adj =
    goal === "lose_weight" ? 0.02 : goal === "gain_weight" ? -0.02 : 0;

  const percent = clamp(base + adj, 0.08, 0.25);

  const raw = Math.round(tdee * percent);
  return clamp(raw, 150, 900);
}

/**
 * Backward compatible (ของเดิม)
 * ถ้ายังมีที่อื่นเรียกใช้ จะยังไม่พัง
 */
export function burnTargetDefaultFromTDEE(tdee: number, goal: Goal) {
  // fallback ใช้แบบกลางๆ (maintain) เพื่อไม่ทำให้ค่าเพี้ยนถ้าไม่รู้ style
  const rawGoal =
    goal === "lose_weight" ? 0.18 : goal === "gain_weight" ? 0.10 : goal === "maintain_muscle" ? 0.14 : 0.13;

  const raw = Math.round(tdee * rawGoal);
  return clamp(raw, 150, 900);
}
