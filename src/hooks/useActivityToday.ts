import { useEffect, useMemo, useState } from "react";
import {
  subscribeTodayActivities,
  type ActivityLog,
} from "../services/firestoreActivity";

import {
  subscribeTodayDailySummary,
  defaultDailySummary,
  type DailySummaryDoc,
} from "../services/firestoreDailySummary";

type Totals = {
  totalBurned: number;      // kcal
  totalDistanceKm: number;  // km
  totalSessions: number;
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function useActivityToday(uid: string | null) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummaryDoc>(defaultDailySummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setActivities([]);
      setDailySummary(defaultDailySummary);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubActs = subscribeTodayActivities(uid, (logs) => {
      setActivities(logs);
      setLoading(false);
    });

    const unsubSummary = subscribeTodayDailySummary(uid, (d) => {
      setDailySummary(d);
    });

    return () => {
      unsubActs();
      unsubSummary();
    };
  }, [uid]);

  const totals = useMemo<Totals>(() => {
    let burned = 0;
    let dist = 0;

    for (const a of activities) {
      burned += Number(a.kcal_burned ?? 0);
      dist += Number(a.distance_km ?? 0);
    }

    return {
      totalBurned: Math.round(burned),
      totalDistanceKm: round1(dist),
      totalSessions: activities.length,
    };
  }, [activities]);

  return { activities, totals, dailySummary, loading };
}
