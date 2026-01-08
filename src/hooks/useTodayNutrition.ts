import { useEffect, useMemo, useState } from "react";
import { onSnapshot, collection, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";
import { getDateKey } from "../utils/dateKey";
import { defaultGoals, subscribeGoals, type GoalsDoc } from "../services/firestoreGoals";

type Totals = {
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function useTodayNutrition(uid: string | null) {
  const [goals, setGoals] = useState<GoalsDoc>(defaultGoals);
  const [totals, setTotals] = useState<Totals>({
    totalCalories: 0,
    totalCarbs: 0,
    totalProtein: 0,
    totalFat: 0,
  });

  useEffect(() => {
    if (!uid) return;

    const unsubGoals = subscribeGoals(uid, setGoals);

    const dateKey = getDateKey();
    const q = query(
      collection(db, "users", uid, "dailyLogs", dateKey, "foods"),
      orderBy("createdAt", "desc")
    );

    const unsubLogs = onSnapshot(q, (snap) => {
      let cals = 0;
      let carbs = 0;
      let protein = 0;
      let fat = 0;

      snap.docs.forEach((d) => {
        const t = (d.data() as any).totals ?? {};
        cals += Number(t.totalCalories ?? 0);
        carbs += Number(t.totalCarbs ?? 0);
        protein += Number(t.totalProtein ?? 0);
        fat += Number(t.totalFat ?? 0);
      });

      setTotals({
        totalCalories: Math.round(cals),
        totalCarbs: round1(carbs),
        totalProtein: round1(protein),
        totalFat: round1(fat),
      });
    });

    return () => {
      unsubGoals();
      unsubLogs();
    };
  }, [uid]);

  const progress = useMemo(() => {
    return {
      calPct: clamp01(totals.totalCalories / Math.max(1, goals.calorieTarget)),
      carbPct: clamp01(totals.totalCarbs / Math.max(1, goals.carbTarget)),
      proteinPct: clamp01(totals.totalProtein / Math.max(1, goals.proteinTarget)),
      fatPct: clamp01(totals.totalFat / Math.max(1, goals.fatTarget)),
    };
  }, [totals, goals]);

  return { goals, totals, progress };
}
