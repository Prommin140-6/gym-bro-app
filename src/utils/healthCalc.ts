export type Sex = "male" | "female";

export type ExerciseStyle =
  | "exercise_everyday"
  | "exercise_3_5_days_week"
  | "exercise_1_2_days_week"
  | "not_exercise";

export type Goal =
  | "gain_weight"
  | "lose_weight"
  | "maintain_weight"
  | "maintain_muscle";

export function calcBMI(heightCm: number, weightKg: number) {
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  return round1(bmi);
}

// Mifflin-St Jeor
export function calcBMR(sex: Sex, heightCm: number, weightKg: number, age: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === "male" ? base + 5 : base - 161;
  return Math.round(bmr);
}

export function activityMultiplier(style: ExerciseStyle) {
  switch (style) {
    case "exercise_everyday":
      return 1.725; // very active
    case "exercise_3_5_days_week":
      return 1.55; // moderately active
    case "exercise_1_2_days_week":
      return 1.375; // lightly active
    case "not_exercise":
    default:
      return 1.2; // sedentary
  }
}

export function calcTDEE(bmr: number, multiplier: number) {
  return Math.round(bmr * multiplier);
}

/**
 * แนะนำแคล/วันตาม goal
 * - lose_weight: -400 kcal/day
 * - gain_weight: +300 kcal/day
 * - maintain_weight: เท่าเดิม
 * - maintain_muscle: ใกล้เดิม (หรือ -150 แบบเบา ๆ) -> เลือก "เดิม" ให้ปลอดภัยสุด
 */
export function recommendedCalories(tdee: number, goal: Goal) {
  let cal = tdee;
  if (goal === "lose_weight") cal = tdee - 400;
  if (goal === "gain_weight") cal = tdee + 300;
  if (goal === "maintain_muscle") cal = tdee; // คงไว้ก่อน
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

export function healthAdviceThai(params: {
  bmi: number;
  goal: Goal;
  exerciseStyle: ExerciseStyle;
}) {
  const { bmi, goal, exerciseStyle } = params;
  const bmiCat = bmiCategoryThai(bmi);

  const goalText =
    goal === "lose_weight"
      ? "โฟกัสลดน้ำหนักแบบค่อยเป็นค่อยไป"
      : goal === "gain_weight"
      ? "โฟกัสเพิ่มน้ำหนักแบบคุณภาพ"
      : goal === "maintain_muscle"
      ? "โฟกัสรักษามวลกล้ามเนื้อ"
      : "โฟกัสคงน้ำหนัก";

  const exerciseHint =
    exerciseStyle === "not_exercise"
      ? "เริ่มจากเดิน 20–30 นาที/วัน 3–4 วัน/สัปดาห์ก่อน แล้วค่อยเพิ่ม"
      : exerciseStyle === "exercise_1_2_days_week"
      ? "เพิ่มเป็น 3 วัน/สัปดาห์จะเห็นผลชัดขึ้น"
      : "รักษาความสม่ำเสมอและพักผ่อนให้พอ";

  return `สถานะ BMI: ${bmiCat}\n${goalText}\nคำแนะนำ: ${exerciseHint}\nดื่มน้ำให้พอ นอน 7–8 ชม. และเน้นโปรตีนให้ถึงเป้า`;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
