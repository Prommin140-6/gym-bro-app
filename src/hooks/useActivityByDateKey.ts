import { useEffect, useMemo, useState } from "react";
import type { ActivityLog } from "../services/firestoreActivity";
import { subscribeActivitiesByDateKey } from "../services/firestoreActivity";
import type { DailySummaryDoc } from "../services/firestoreDailySummary";
import { defaultDailySummary, subscribeDailySummaryByDateKey } from "../services/firestoreDailySummary";

export function useActivityByDateKey(uid: string | null, dateKey: string | null) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummaryDoc>(defaultDailySummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !dateKey) {
      setActivities([]);
      setDailySummary(defaultDailySummary);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsub1 = subscribeActivitiesByDateKey(uid, dateKey, (logs) => {
      setActivities(logs);
      setLoading(false);
    });

    const unsub2 = subscribeDailySummaryByDateKey(uid, dateKey, (sum) => {
      setDailySummary(sum);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [uid, dateKey]);

  const totals = useMemo(() => {
    const totalBurned = Number(dailySummary.totalBurnedCalories ?? 0);
    const totalDistanceKm = Number(dailySummary.totalDistanceKm ?? 0);
    return { totalBurned, totalDistanceKm };
  }, [dailySummary]);

  return { activities, dailySummary, totals, loading };
}
