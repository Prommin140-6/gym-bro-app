import { useEffect, useMemo, useRef, useState } from "react";
import { upsertTodayDailySummary } from "../services/firestoreDailySummary";

import { useUserProfile } from "./useUserProfile";
import { useBurnTarget } from "./useBurnTarget";
import { useActivityToday } from "./useActivityToday";
import { useTodayNutrition } from "./useTodayNutrition";

import {
  subscribeGoalsState,
  defaultGoals,
  type GoalsState,
} from "../services/firestoreGoals";

export function useAutoDailySummary(uid: string | null) {
  console.log("[autoDailySummary] hook called uid =", uid);

  const { profile } = useUserProfile(uid);

  const burnProfile = useMemo(() => {
    if (!profile) return null;

    const sex = (profile.sex ?? "male") as any;
    const age = Number(profile.age ?? 22);
    const heightCm = Number((profile as any).heightCm ?? profile.height_cm ?? 170);
    const weightKg = Number((profile as any).weightKg ?? profile.weight_kg ?? 66);
    const exerciseStyle = ((profile as any).exerciseStyle ?? "not_exercise") as any;
    const goalType = ((profile as any).goalType ?? (profile as any).goal ?? "maintain_weight") as any;

    return { sex, age, heightCm, weightKg, exerciseStyle, goalType };
  }, [profile]);

  // ✅ burn target (มาจาก goals+profile ตามระบบเดิมของคุณ)
  const { burnTarget } = useBurnTarget(uid, burnProfile);

  // ✅ today nutrition totals (eatenCalories)
  const { totals: nutritionTotals } = useTodayNutrition(uid);

  // ✅ today activity totals + restDay (อ่านจาก daily_summary)
  const { totals, dailySummary } = useActivityToday(uid);
  const restDay = Boolean(dailySummary?.restDay ?? false);

  // ✅ goalsState เพื่อรู้ว่า goals doc มาแล้วหรือยัง
  const [goalsState, setGoalsState] = useState<GoalsState>({
    exists: false,
    data: defaultGoals,
  });

  useEffect(() => {
    if (!uid) {
      setGoalsState({ exists: false, data: defaultGoals });
      return;
    }
    return subscribeGoalsState(uid, setGoalsState);
  }, [uid]);

  const lastSig = useRef<string>("");

  useEffect(() => {
    if (!uid) return;

    // ✅ กันไม่ให้เขียนค่า default แว้บแรก
    if (!goalsState.exists) {
      console.log("[autoDailySummary] skip (goals doc not exists yet)");
      return;
    }

    const burned = Number(totals.totalBurned ?? 0);
    const distanceKm = Number(totals.totalDistanceKm ?? 0);
    const eatenCalories = Number(nutritionTotals.totalCalories ?? 0);

    const burnT = Number(burnTarget ?? 0);
    const calT = Number(goalsState.data.calorieTarget ?? 0);

    // ✅ target ต้องพร้อมก่อน
    if (burnT <= 0 || calT <= 0) {
      console.log("[autoDailySummary] skip (targets not ready)", { burnT, calT });
      return;
    }

    const burnSuccess = burned >= burnT;
    const calorieSuccess = eatenCalories >= calT;

    // ✅ rule: restDay => success=false (streak จะไปคิดใน week/month)
    const success = restDay ? false : burnSuccess && calorieSuccess;

    const sig = JSON.stringify({
      burned,
      distanceKm,
      eatenCalories,
      burnT,
      calT,
      restDay,
      burnSuccess,
      calorieSuccess,
      success,
    });

    if (sig === lastSig.current) return;
    lastSig.current = sig;

    console.log("[autoDailySummary] tick", {
      burned,
      eatenCalories,
      burnT,
      calT,
      restDay,
      burnSuccess,
      calorieSuccess,
      success,
    });

    upsertTodayDailySummary(uid, {
      totalBurnedCalories: burned,
      totalDistanceKm: distanceKm,

      eatenCalories,

      burnTarget: burnT,
      calorieTarget: calT,

      restDay,
      burnSuccess,
      calorieSuccess,
      success,
    })
      .then(() => console.log("[autoDailySummary] upsert OK ✅"))
      .catch((e) => console.warn("[autoDailySummary] upsert FAILED ❌", e));
  }, [
    uid,
    goalsState.exists,
    goalsState.data.calorieTarget,
    burnTarget,
    totals.totalBurned,
    totals.totalDistanceKm,
    nutritionTotals.totalCalories,
    restDay,
  ]);
}
