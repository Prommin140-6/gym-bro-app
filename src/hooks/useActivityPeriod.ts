import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "../services/firebase";
import type { DailySummaryDoc } from "../services/firestoreDailySummary";

// ---------- date helpers ----------
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfWeekSun(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun
  x.setDate(x.getDate() - day);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(1);
  return x;
}
function endOfMonth(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setMonth(x.getMonth() + 1, 0); // last day of month
  return x;
}

// ---------- types ----------
export type DayItem = {
  dateKey: string;
  date: Date;
  summary: DailySummaryDoc | null;
};

export function useActivityPeriod(uid: string | null, now = new Date()) {
  const [weekDocs, setWeekDocs] = useState<Record<string, DailySummaryDoc>>({});
  const [monthDocs, setMonthDocs] = useState<Record<string, DailySummaryDoc>>({});
  const [loadingWeek, setLoadingWeek] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(true);

  // --- WEEK range (Sun-Sat) ---
  const weekStart = useMemo(() => startOfWeekSun(now), [now]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weekStartKey = useMemo(() => toDateKey(weekStart), [weekStart]);
  const weekEndKey = useMemo(() => toDateKey(weekEnd), [weekEnd]);

  // --- MONTH range ---
  const monthStart = useMemo(() => startOfMonth(now), [now]);
  const monthEnd = useMemo(() => endOfMonth(now), [now]);
  const monthStartKey = useMemo(() => toDateKey(monthStart), [monthStart]);
  const monthEndKey = useMemo(() => toDateKey(monthEnd), [monthEnd]);

  // --- subscribe WEEK docs ---
  useEffect(() => {
    if (!uid) return;

    setLoadingWeek(true);

    const colRef = collection(db, "users", uid, "daily_summary");
    const q = query(
      colRef,
      where(documentId(), ">=", weekStartKey),
      where(documentId(), "<=", weekEndKey),
      orderBy(documentId(), "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const map: Record<string, DailySummaryDoc> = {};
        snap.forEach((docSnap) => {
          map[docSnap.id] = docSnap.data() as any;
        });
        setWeekDocs(map);
        setLoadingWeek(false);
      },
      (err) => {
        console.warn("[useActivityPeriod] week onSnapshot error:", err);
        setWeekDocs({});
        setLoadingWeek(false);
      }
    );

    return unsub;
  }, [uid, weekStartKey, weekEndKey]);

  // --- subscribe MONTH docs ---
  useEffect(() => {
    if (!uid) return;

    setLoadingMonth(true);

    const colRef = collection(db, "users", uid, "daily_summary");
    const q = query(
      colRef,
      where(documentId(), ">=", monthStartKey),
      where(documentId(), "<=", monthEndKey),
      orderBy(documentId(), "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const map: Record<string, DailySummaryDoc> = {};
        snap.forEach((docSnap) => {
          map[docSnap.id] = docSnap.data() as any;
        });
        setMonthDocs(map);
        setLoadingMonth(false);
      },
      (err) => {
        console.warn("[useActivityPeriod] month onSnapshot error:", err);
        setMonthDocs({});
        setLoadingMonth(false);
      }
    );

    return unsub;
  }, [uid, monthStartKey, monthEndKey]);

  // --- build week 7 days array (Sun-Sat) ---
  const weekDays: DayItem[] = useMemo(() => {
    const out: DayItem[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const key = toDateKey(date);
      out.push({
        dateKey: key,
        date,
        summary: weekDocs[key] ?? null,
      });
    }
    return out;
  }, [weekStart, weekDocs]);

  const weekTotalBurned = useMemo(() => {
    return weekDays.reduce((sum, d) => {
      const v = Number(d.summary?.totalBurnedCalories ?? 0);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);
  }, [weekDays]);

  // ✅ streak: นับติดต่อกันจาก "เมื่อวานย้อนหลัง" จนถึงวันที่ไม่ success
  // - restDay: ไม่นับ และไม่รีเซ็ต (ข้ามไป)
  // - ถ้าไม่ success (และไม่ restDay): รีเซ็ตทันที
  const streak = useMemo(() => {
    // เราจะดูย้อนหลังใน monthDocs เพื่อให้ streak ต่อเนื่องข้ามสัปดาห์ได้
    // แต่ Step2 จะนับง่ายๆก่อน: นับย้อนหลังใน weekDays (พอสำหรับ UI สัปดาห์)
    let s = 0;

    // ไล่จากวันนี้ย้อนกลับ
    const todayKey = toDateKey(now);

    // สร้าง list จาก weekDays ที่ <= today (กันอนาคต)
    const reversed = [...weekDays]
      .filter((x) => x.dateKey <= todayKey)
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));

    for (const item of reversed) {
      const rest = Boolean(item.summary?.restDay ?? false);
      const ok = Boolean(item.summary?.success ?? false);

      if (rest) {
        // ไม่นับ และไม่เริ่มใหม่
        continue;
      }
      if (ok) {
        s += 1;
        continue;
      }
      // ไม่ ok และไม่ rest => รีเซ็ต
      break;
    }

    return s;
  }, [weekDays, now]);

  return {
    loadingWeek,
    loadingMonth,

    weekStartKey,
    weekEndKey,
    monthStartKey,
    monthEndKey,

    weekDays,
    weekTotalBurned,
    streak,

    monthDocs, // key -> summary
  };
}
