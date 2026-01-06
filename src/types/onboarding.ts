import type { Sex, ExerciseStyle, Goal } from "../utils/healthCalc";

export type OnboardingDraft = {
  // step1
  email: string;
  password: string;
  confirmPassword: string;

  // step2
  sex: Sex | null;
  heightCm: string;
  weightKg: string;
  age: string;

  // step3
  bodyFatPercent: number | null;

  // step4
  exerciseStyle: ExerciseStyle | null;

  // step5
  goal: Goal | null;
};

export const defaultDraft: OnboardingDraft = {
  email: "",
  password: "",
  confirmPassword: "",

  sex: null,
  heightCm: "",
  weightKg: "",
  age: "",

  bodyFatPercent: null,
  exerciseStyle: null,
  goal: null,
};
