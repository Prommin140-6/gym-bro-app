// src/hooks/useWater.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  defaultWaterTargets,
  subscribeWaterTargets,
  subscribeWaterToday,
  upsertWaterTargets,
  setTodayWaterCups,
  incrementTodayWaterCups,
  type WaterTargetsDoc,
  MAX_WATER_CUPS_PER_DAY,
  MIN_WATER_CUPS_PER_DAY,
} from "../services/firestoreWater";

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function roundInt(n: number) {
  return Math.round(n);
}

export type UseWaterResult = {
  targets: WaterTargetsDoc;
  todayCups: number;

  goalCups: number;
  todayMl: number;
  goalMl: number;
  progress01: number;

  addCup: () => Promise<void>;
  removeCup: () => Promise<void>;
  setCups: (cups: number) => Promise<void>;

  saveTargets: (patch: Partial<Pick<WaterTargetsDoc, "goalMlPerDay" | "mlPerCup">>) => Promise<void>;
  resetTargets: () => Promise<void>;
};

export function useWater(uid: string | null): UseWaterResult {
  const [targets, setTargets] = useState<WaterTargetsDoc>(defaultWaterTargets);
  const [todayCups, setTodayCupsState] = useState<number>(0);

  // subscribe targets
  useEffect(() => {
    if (!uid) {
      setTargets(defaultWaterTargets);
      return;
    }
    const unsub = subscribeWaterTargets(uid, setTargets, (err) => {
      console.warn("subscribeWaterTargets error:", err);
    });
    return unsub;
  }, [uid]);

  // subscribe today's cups
  useEffect(() => {
    if (!uid) {
      setTodayCupsState(0);
      return;
    }
    const unsub = subscribeWaterToday(
      uid,
      (d) => setTodayCupsState(typeof d.cups === "number" ? d.cups : 0),
      (err) => {
        console.warn("subscribeWaterToday error:", err);
      }
    );
    return unsub;
  }, [uid]);

  const mlPerCup = useMemo(() => targets.mlPerCup || defaultWaterTargets.mlPerCup, [targets.mlPerCup]);

  // ✅ goal cups ถูก cap ระหว่าง 7-15 แก้ว
  const goalCups = useMemo(() => {
    const goalMl = targets.goalMlPerDay || defaultWaterTargets.goalMlPerDay;
    const cups = goalMl / mlPerCup;

    const rounded = Math.max(1, roundInt(cups));
    return Math.max(MIN_WATER_CUPS_PER_DAY, Math.min(MAX_WATER_CUPS_PER_DAY, rounded));
  }, [targets.goalMlPerDay, mlPerCup]);

  // ✅ goal ml ให้ “สอดคล้องกับ cap 7 แก้ว”
  const goalMl = useMemo(() => {
    return (goalCups * mlPerCup) | 0;
  }, [goalCups, mlPerCup]);

  // ✅ today cups ก็ clamp กันพลาดจากข้อมูลเก่า
  const safeTodayCups = useMemo(() => {
    const v = typeof todayCups === "number" && isFinite(todayCups) ? Math.max(0, Math.round(todayCups)) : 0;
    return Math.min(MAX_WATER_CUPS_PER_DAY, v);
  }, [todayCups]);

  const todayMl = useMemo(() => {
    return (safeTodayCups * mlPerCup) | 0;
  }, [safeTodayCups, mlPerCup]);

  const progress01 = useMemo(() => {
    if (goalCups <= 0) return 0;
    return clamp01(safeTodayCups / goalCups);
  }, [safeTodayCups, goalCups]);

  const addCup = useCallback(async () => {
    if (!uid) return;
    // ฝั่ง service จะ cap ให้อยู่แล้ว
    await incrementTodayWaterCups(uid, +1);
  }, [uid]);

  const removeCup = useCallback(async () => {
    if (!uid) return;
    await incrementTodayWaterCups(uid, -1);
  }, [uid]);

  const setCups = useCallback(
    async (cups: number) => {
      if (!uid) return;
      const safe =
        typeof cups === "number" && isFinite(cups)
          ? Math.max(0, Math.min(MAX_WATER_CUPS_PER_DAY, Math.round(cups)))
          : 0;
      await setTodayWaterCups(uid, safe);
    },
    [uid]
  );

  const saveTargets = useCallback(
    async (patch: Partial<Pick<WaterTargetsDoc, "goalMlPerDay" | "mlPerCup">>) => {
      if (!uid) return;
      await upsertWaterTargets(uid, patch);
    },
    [uid]
  );

  const resetTargets = useCallback(async () => {
    if (!uid) return;
    await upsertWaterTargets(uid, {
      goalMlPerDay: defaultWaterTargets.goalMlPerDay,
      mlPerCup: defaultWaterTargets.mlPerCup,
    });
  }, [uid]);

  return {
    targets,
    todayCups: safeTodayCups,
    goalCups,
    todayMl,
    goalMl,
    progress01,
    addCup,
    removeCup,
    setCups,
    saveTargets,
    resetTargets,
  };
}
