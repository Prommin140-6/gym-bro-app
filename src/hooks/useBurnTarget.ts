// src/hooks/useBurnTarget.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../services/firebase";
import { defaultGoals, subscribeGoals, type GoalsDoc } from "../services/firestoreGoals";
import { calcTargets } from "../utils/targets";

type BurnProfile = {
  sex: any; // Sex
  age: number;
  heightCm: number;
  weightKg: number;
  exerciseStyle: any; // ExerciseStyle
  goalType: any; // Goal
};

function diff(a?: number, b?: number) {
  if (typeof a !== "number" || typeof b !== "number") return true;
  return a !== b;
}

export function useBurnTarget(uid: string | null, burnProfile: BurnProfile | null) {
  const [goals, setGoals] = useState<GoalsDoc>(defaultGoals);
  const [loading, setLoading] = useState(true);

  // กันยิง setDoc ซ้ำถี่ ๆ ในกรณี onSnapshot มาทีละ field
  const lastWriteSig = useRef<string>("");

  // 1) subscribe goals
  useEffect(() => {
    if (!uid) return;

    setLoading(true);
    const unsub = subscribeGoals(uid, (g: GoalsDoc) => {
      setGoals(g);
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  // 2) ensure goals doc exists
  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, "users", uid, "goals", "targets");

    (async () => {
      try {
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.log("[useBurnTarget] goals doc missing -> creating users/%s/goals/targets", uid);

          await setDoc(
            ref,
            {
              calorieTarget: defaultGoals.calorieTarget,
              carbTarget: defaultGoals.carbTarget,
              proteinTarget: defaultGoals.proteinTarget,
              fatTarget: defaultGoals.fatTarget,
              burnTarget: defaultGoals.burnTarget,
              customized: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          console.log("[useBurnTarget] created goals doc ✅");
        } else {
          console.log("[useBurnTarget] goals doc exists ✅");
        }
      } catch (e) {
        console.warn("[useBurnTarget] ensure goals doc failed:", e);
      }
    })();
  }, [uid]);

  // 3) recalc targets when profile changes (if not customized)
  useEffect(() => {
    if (!uid) return;

    if (!burnProfile) {
      console.log("[useBurnTarget] burnProfile is null -> skip compute");
      return;
    }

    if (goals.customized) {
      console.log("[useBurnTarget] customized=true -> skip auto targets");
      return;
    }

    const out = calcTargets({
      sex: burnProfile.sex,
      age: Number(burnProfile.age),
      heightCm: Number(burnProfile.heightCm),
      weightKg: Number(burnProfile.weightKg),
      exerciseStyle: burnProfile.exerciseStyle,
      goal: burnProfile.goalType,
    });

    // สร้าง signature จาก profile + ผลลัพธ์ เพื่อกัน loop
    const sig = JSON.stringify({
      p: {
        sex: burnProfile.sex,
        age: Number(burnProfile.age),
        heightCm: Number(burnProfile.heightCm),
        weightKg: Number(burnProfile.weightKg),
        exerciseStyle: burnProfile.exerciseStyle,
        goal: burnProfile.goalType,
      },
      out: {
        calorieTarget: out.calorieTarget,
        carbTarget: out.carbTarget,
        proteinTarget: out.proteinTarget,
        fatTarget: out.fatTarget,
        burnTarget: out.burnTarget,
      },
    });

    // ถ้าเพิ่งเขียนชุดเดียวกันไปแล้ว ไม่ต้องเขียนซ้ำ
    if (lastWriteSig.current === sig) return;

    const needWrite =
      diff(goals.calorieTarget, out.calorieTarget) ||
      diff(goals.carbTarget, out.carbTarget) ||
      diff(goals.proteinTarget, out.proteinTarget) ||
      diff(goals.fatTarget, out.fatTarget) ||
      diff(goals.burnTarget, out.burnTarget);

    console.log("[useBurnTarget] auto targets =", out, "needWrite =", needWrite);

    if (!needWrite) return;

    lastWriteSig.current = sig;

    const ref = doc(db, "users", uid, "goals", "targets");
    setDoc(
      ref,
      {
        calorieTarget: out.calorieTarget,
        carbTarget: out.carbTarget,
        proteinTarget: out.proteinTarget,
        fatTarget: out.fatTarget,
        burnTarget: out.burnTarget,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((e) => console.warn("[useBurnTarget] setDoc targets failed:", e));
  }, [
    uid,
    burnProfile,
    goals.customized,
    goals.calorieTarget,
    goals.carbTarget,
    goals.proteinTarget,
    goals.fatTarget,
    goals.burnTarget,
  ]);

  const burnTarget = useMemo(() => {
    return typeof goals.burnTarget === "number" ? goals.burnTarget : defaultGoals.burnTarget;
  }, [goals.burnTarget]);

  return { burnTarget, loading };
}
