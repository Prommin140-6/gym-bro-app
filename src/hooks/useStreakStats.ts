import { useEffect, useMemo, useState } from "react";
import {
  collection,
  documentId,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { getDateKey } from "../utils/dateKey";

type DailySummaryLike = {
  restDay?: boolean;
  success?: boolean;
  burnSuccess?: boolean;
  calorieSuccess?: boolean;
};

export type DayDot = {
  date: Date;
  dateKey: string;
  success: boolean;
  restDay: boolean;
};

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function parseDateKey(key: string) {
  return new Date(`${key}T12:00:00`);
}

function diffDays(a: Date, b: Date) {
  const ms = 24 * 60 * 60 * 1000;
  const aa = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bb - aa) / ms);
}

export function useStreakStats(
  uid: string | null,
  opts?: { fetchDays?: number }
) {
  const fetchDays = opts?.fetchDays ?? 420;
  const [docs, setDocs] = useState<Record<string, DailySummaryLike>>({});

  /* ---------- subscribe ---------- */
  useEffect(() => {
    if (!uid) {
      setDocs({});
      return;
    }

    const colRef = collection(db, "users", uid, "daily_summary");

    // ✅ FIX: ไม่มี where(documentId())
    const q = query(
      colRef,
      orderBy(documentId(), "desc"),
      limit(fetchDays)
    );

    return onSnapshot(
      q,
      (snap) => {
        const next: Record<string, DailySummaryLike> = {};
        snap.forEach((d) => (next[d.id] = d.data() as DailySummaryLike));
        setDocs(next);
      },
      (err) => {
        console.error("[useStreakStats] snapshot error", err);
        setDocs({});
      }
    );
  }, [uid, fetchDays]);

  /* ---------- compute ---------- */
  return useMemo(() => {
    const today = new Date();
    const todayKey = getDateKey(today);

    /* ----- last 7 ----- */
    const last7: DayDot[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const key = getDateKey(d);
      const doc = docs[key];
      last7.push({
        date: d,
        dateKey: key,
        success: Boolean(doc?.success),
        restDay: Boolean(doc?.restDay),
      });
    }

    /* ----- current streak ----- */
    const calcCurrent = (field: keyof DailySummaryLike) => {
      let count = 0;
      let cursor = today;

      for (let i = 0; i < fetchDays; i++) {
        const key = getDateKey(cursor);
        const doc = docs[key];

        // ✅ วันนี้ snapshot ยังไม่มา → ข้าม 1 ครั้ง
        if (!doc) {
          if (i === 0) {
            cursor = addDays(cursor, -1);
            continue;
          }
          break;
        }

        if (doc.restDay) {
          cursor = addDays(cursor, -1);
          continue;
        }

        if (!doc[field]) break;

        count++;
        cursor = addDays(cursor, -1);
      }

      return count;
    };

    /* ----- best streak ----- */
    const calcBest = (field: keyof DailySummaryLike) => {
      const keys = Object.keys(docs).sort();
      let best = 0;
      let cur = 0;
      let prev: Date | null = null;

      for (const key of keys) {
        const doc = docs[key];
        const date = parseDateKey(key);

        if (prev && diffDays(prev, date) !== 1) cur = 0;

        if (doc?.restDay) {
          prev = date;
          continue;
        }

        cur = doc?.[field] ? cur + 1 : 0;
        best = Math.max(best, cur);
        prev = date;
      }

      return best;
    };

    return {
      last7,
      currentSuccessStreak: calcCurrent("success"),
      bestFoodStreak: calcBest("calorieSuccess"),
      bestBurnStreak: calcBest("burnSuccess"),
    };
  }, [docs, fetchDays]);
}
