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
      // ✅ RULE SUMMARY
      // 1) ถ้าวันนี้ผ่านแล้ว => นับ streak รวมวันนี้
      // 2) ถ้าวันนี้ยังไม่ผ่าน/ไม่มี doc/หรือวันนี้ restDay => ให้ดูย้อนหลังจาก "เมื่อวาน"
      //    - ถ้าเมื่อวานเป็น restDay => ข้ามไปวันก่อนหน้า (streak คงเดิม)
      //    - ถ้าวันล่าสุดที่ไม่ใช่ restDay ไม่ผ่าน => streak = 0 ทันที
      //    - ถ้าวันล่าสุดที่ไม่ใช่ restDay ผ่าน => เริ่มนับจากวันนั้น (เช่นเมื่อวาน/วันก่อน)
      // 3) ระหว่างนับ streak: restDay = ข้าม ไม่บวก ไม่รีเซ็ต

      const today = new Date();

      const findLastNonRestDay = (start: Date) => {
        let cursor = new Date(start);
        for (let i = 0; i < fetchDays; i++) {
          const key = getDateKey(cursor);
          const doc = docs[key];
          if (doc && !doc.restDay) return { key, date: cursor, doc };
          cursor = addDays(cursor, -1);
        }
        return null;
      };

      // 1) ถ้าวันนี้ผ่านจริง => start จากวันนี้
      const todayKey = getDateKey(today);
      const todayDoc = docs[todayKey];

      let startCursor: Date;

      if (todayDoc && !todayDoc.restDay && Boolean(todayDoc[field] ?? false)) {
        startCursor = new Date(today);
      } else {
        // 2) วันนี้ยังไม่ผ่าน => หาวันล่าสุดที่ไม่ใช่ restDay (เริ่มจากเมื่อวาน)
        const last = findLastNonRestDay(addDays(today, -1));
        if (!last) return 0;

        const ok = Boolean(last.doc?.[field] ?? false);
        if (!ok) return 0;

        startCursor = last.date;
      }

      // 3) นับ streak ต่อเนื่องย้อนหลัง (ข้าม restDay)
      let count = 0;
      let cursor = new Date(startCursor);

      for (let i = 0; i < fetchDays; i++) {
        const key = getDateKey(cursor);
        const doc = docs[key];
        if (!doc) break;

        if (doc.restDay) {
          cursor = addDays(cursor, -1);
          continue;
        }

        const ok = Boolean(doc[field] ?? false);
        if (!ok) break;

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
