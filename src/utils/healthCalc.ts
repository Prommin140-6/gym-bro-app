// src/utils/healthCalc.ts
export type Sex = "male" | "female";

export type ExerciseStyle =
  | "exercise_everyday" // 6-7 days/week  -> PAL 1.7
  | "exercise_3_5_days_week" // 4-5 days/week -> PAL 1.55
  | "exercise_1_2_days_week" // 1-3 days/week -> PAL 1.375
  | "not_exercise"; // sedentary -> PAL 1.2

export type Goal =
  | "gain_weight"
  | "lose_weight"
  | "maintain_weight"
  | "maintain_muscle";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function calcBMI(heightCm: number, weightKg: number) {
  // BMI = weight / (height_m^2)  (สมการ 3)
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  return round1(bmi);
}

/**
 * BMR (สมการ 1,2) ตามที่คุณให้มา
 * BMRชาย = 80 + 13.7W + 5H - 6.8A
 * BMRหญิง = 85 + 9.6W + 1.8H - 4.7A
 */
export function calcBMR(sex: Sex, heightCm: number, weightKg: number, age: number) {
  const w = Math.max(0, weightKg);
  const h = Math.max(0, heightCm);
  const a = Math.max(0, age);

  const bmr =
    sex === "male"
      ? 80 + 13.7 * w + 5 * h - 6.8 * a
      : 85 + 9.6 * w + 1.8 * h - 4.7 * a;

  return Math.round(bmr);
}

/**
 * HRmax = 220 - age (สมการ 4)
 */
export function calcHRMax(age: number) {
  return Math.max(0, Math.round(220 - Math.max(0, age)));
}

/**
 * FFM (Fat-Free Mass) = weightKg * (1 - bodyFat%)
 */
export function calcFFM(weightKg: number, bodyFatPercent: number) {
  const bf = clamp(bodyFatPercent, 1, 70) / 100;
  return weightKg * (1 - bf);
}

/**
 * REE = 370 + 21.6 * FFM (สมการ 5)
 */
export function calcREEFromFFM(ffmKg: number) {
  return Math.round(370 + 21.6 * Math.max(0, ffmKg));
}

/**
 * PAL ตามตารางที่คุณให้มา:
 * (1) ไม่ออกกำลัง/น้อยมาก -> 1.2
 * (2) 1-3 ครั้ง/สัปดาห์ -> 1.375
 * (3) 4-5 ครั้ง/สัปดาห์ -> 1.55
 * (4) 6-7 ครั้ง/สัปดาห์ -> 1.7
 * (5) วันละ 2 ครั้งขึ้นไป -> 1.9  (ยังไม่มีใน enum ปัจจุบัน)
 */
export function activityMultiplier(style: ExerciseStyle) {
  switch (style) {
    case "exercise_everyday":
      return 1.7; // 6-7 ครั้ง/สัปดาห์
    case "exercise_3_5_days_week":
      return 1.55; // 4-5 ครั้ง/สัปดาห์
    case "exercise_1_2_days_week":
      return 1.375; // 1-3 ครั้ง/สัปดาห์
    case "not_exercise":
    default:
      return 1.2; // ไม่ออก/น้อยมาก
  }
}

/**
 * TDEE = REE * PAL (สมการ 6)
 * (ในกรณีไม่มี bodyfat ให้ใช้ BMR แทน REE เป็น fallback)
 */
export function calcTDEE(reeOrBmr: number, pal: number) {
  return Math.round(Math.max(0, reeOrBmr) * Math.max(0, pal));
}

/**
 * Calorie recommendation จาก TDEE:
 * - lose_weight: deficit 500 kcal/day (ปลอดภัย ใช้งานได้จริง)
 * - gain_weight: surplus 300 kcal/day
 * - maintain_weight: เท่าเดิม
 * - maintain_muscle: เท่าเดิม (หรือ -150 แบบเบา ๆ ก็ได้ แต่ตอนนี้คงไว้ก่อน)
 */
export function recommendedCalories(tdee: number, goal: Goal) {
  let cal = tdee;
  if (goal === "lose_weight") cal = tdee - 500;
  if (goal === "gain_weight") cal = tdee + 300;
  if (goal === "maintain_muscle") cal = tdee;
  if (goal === "maintain_weight") cal = tdee;

  // กันต่ำเกินไป
  cal = Math.max(cal, 1200);
  return Math.round(cal);
}

export function bmiCategoryThai(bmi: number) {
  if (bmi < 18.5) return "น้ำหนักน้อย/ผอม";
  if (bmi < 23) return "ปกติ";
  if (bmi < 25) return "ท้วม/เริ่มอ้วน";
  if (bmi < 30) return "อ้วนระดับ 1";
  return "อ้วนระดับ 2";
}

export function healthAdvice(params: {
  bmi: number;
  goal: Goal;
  exerciseStyle: ExerciseStyle;
}) {
  const { bmi, goal, exerciseStyle } = params;

  const bmiCategory =
    bmi < 18.5
      ? "Underweight"
      : bmi < 23
      ? "Normal"
      : bmi < 25
      ? "Overweight"
      : bmi < 30
      ? "Obese (Class I)"
      : "Obese (Class II)";

  const goalText =
    goal === "lose_weight"
      ? "Focus on gradual fat loss"
      : goal === "gain_weight"
      ? "Focus on quality weight gain"
      : goal === "maintain_muscle"
      ? "Focus on maintaining muscle mass"
      : "Focus on maintaining your current weight";

  const exerciseHint =
    exerciseStyle === "not_exercise"
      ? "Start with walking 20–30 minutes a day, 3–4 days per week"
      : exerciseStyle === "exercise_1_2_days_week"
      ? "Increasing to 3 days per week will improve results"
      : "Maintain consistency and get enough rest";

  return `BMI status: ${bmiCategory}
${goalText}
Advice: ${exerciseHint}
Stay hydrated, sleep 7–8 hours, and hit your protein target`;
}
