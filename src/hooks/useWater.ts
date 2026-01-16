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

  const goalCups = useMemo(() => {
    const mlPerCup = targets.mlPerCup || defaultWaterTargets.mlPerCup;
    const goalMl = targets.goalMlPerDay || defaultWaterTargets.goalMlPerDay;

    const cups = goalMl / mlPerCup;
    // อย่างน้อย 1 แก้วต่อวันเสมอ
    return Math.max(1, roundInt(cups));
  }, [targets.goalMlPerDay, targets.mlPerCup]);

  const goalMl = useMemo(() => {
    return (targets.goalMlPerDay || defaultWaterTargets.goalMlPerDay) | 0;
  }, [targets.goalMlPerDay]);

  const todayMl = useMemo(() => {
    const mlPerCup = targets.mlPerCup || defaultWaterTargets.mlPerCup;
    return (todayCups * mlPerCup) | 0;
  }, [todayCups, targets.mlPerCup]);

  const progress01 = useMemo(() => {
    if (goalCups <= 0) return 0;
    return clamp01(todayCups / goalCups);
  }, [todayCups, goalCups]);

  const addCup = useCallback(async () => {
    if (!uid) return;
    await incrementTodayWaterCups(uid, +1);
  }, [uid]);

  const removeCup = useCallback(async () => {
    if (!uid) return;
    await incrementTodayWaterCups(uid, -1);
  }, [uid]);

  const setCups = useCallback(
    async (cups: number) => {
      if (!uid) return;
      const safe = typeof cups === "number" && isFinite(cups) ? Math.max(0, Math.round(cups)) : 0;
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
    todayCups,
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
