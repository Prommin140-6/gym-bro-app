// src/hooks/useAutoAchievements.ts
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  documentId,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { Alert } from "react-native";
import { db } from "../services/firebase";
import { getDateKey } from "../utils/dateKey";
import {
  ACHIEVEMENT_DEFS,
  subscribeAchievements,
  unlockAchievement,
  type AchievementDoc,
} from "../services/firestoreAchievements";

type DailySummaryLike = {
  restDay?: boolean;
  success?: boolean;
  burnSuccess?: boolean;
  calorieSuccess?: boolean;
};

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function useAutoAchievements(uid: string | null, opts?: { fetchDays?: number }) {
  const fetchDays = opts?.fetchDays ?? 420;

  const [dailyDocs, setDailyDocs] = useState<Record<string, DailySummaryLike>>({});
  const [ach, setAch] = useState<Record<string, AchievementDoc>>({});

  // กัน Alert ซ้ำ
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  /* ---------- subscribe daily_summary ---------- */
  useEffect(() => {
    if (!uid) {
      setDailyDocs({});
      return;
    }

    const colRef = collection(db, "users", uid, "daily_summary");
    const q = query(colRef, orderBy(documentId(), "desc"), limit(fetchDays));

    return onSnapshot(q, (snap) => {
      const out: Record<string, DailySummaryLike> = {};
      snap.forEach((d) => {
        out[d.id] = d.data() as DailySummaryLike;
      });
      setDailyDocs(out);
    });
  }, [uid, fetchDays]);

  /* ---------- subscribe achievements ---------- */
  useEffect(() => {
    if (!uid) {
      setAch({});
      prevUnlockedRef.current = new Set();
      return;
    }
    return subscribeAchievements(uid, (docs) => {
      setAch(docs);
    });
  }, [uid]);

  const streaks = useMemo(() => {
    // calcCurrent แบบเดียวกับ useStreakStats (ข้าม restDay, วันนี้ไม่ผ่านให้ดูย้อนหลัง)
    const calcCurrent = (field: keyof DailySummaryLike) => {
      const docs = dailyDocs;
      const today = new Date();
      const todayKey = getDateKey(today);
      const todayDoc = docs[todayKey];

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

      let startCursor: Date;

      if (todayDoc && !todayDoc.restDay && Boolean((todayDoc as any)[field] ?? false)) {
        startCursor = new Date(today);
      } else {
        const last = findLastNonRestDay(addDays(today, -1));
        if (!last) return 0;
        const ok = Boolean((last.doc as any)?.[field] ?? false);
        if (!ok) return 0;
        startCursor = last.date;
      }

      let count = 0;
      let cursor = new Date(startCursor);

      for (let i = 0; i < fetchDays; i++) {
        const key = getDateKey(cursor);
        const doc = docs[key];

        if (doc?.restDay) {
          cursor = addDays(cursor, -1);
          continue;
        }

        const ok = Boolean((doc as any)?.[field] ?? false);
        if (!ok) break;

        count++;
        cursor = addDays(cursor, -1);
      }

      return count;
    };

    return {
      burn: calcCurrent("burnSuccess"),
      calorie: calcCurrent("calorieSuccess"),
      fire: calcCurrent("success"),
      todayKey: getDateKey(new Date()),
    };
  }, [dailyDocs, fetchDays]);

  /* ---------- unlock evaluator ---------- */
  useEffect(() => {
    if (!uid) return;

    const run = async () => {
      const current = {
        burn: streaks.burn,
        calorie: streaks.calorie,
        fire: streaks.fire,
      };

      // unlock tiers ตาม current streak
      for (const def of ACHIEVEMENT_DEFS) {
        const have = ach[def.id];
        if (have?.unlocked) continue;

        const s = current[def.type];
        if (s >= def.targetDays) {
          await unlockAchievement(uid, def, { lastEvaluatedDateKey: streaks.todayKey });
        }
      }
    };

    // กันรันถี่เกินแบบง่ายๆ (dailyDocs เปลี่ยนทีเดียวก็พอ)
    run().catch(() => {});
  }, [uid, streaks.burn, streaks.calorie, streaks.fire, streaks.todayKey, ach]);

  /* ---------- toast/alert when newly unlocked ---------- */
  useEffect(() => {
    if (!uid) return;

    const prev = prevUnlockedRef.current;
    const now = new Set<string>();

    for (const def of ACHIEVEMENT_DEFS) {
      const d = ach[def.id];
      if (d?.unlocked) now.add(def.id);
    }

    // หา newly unlocked
    const newly: string[] = [];
    for (const id of now) {
      if (!prev.has(id)) newly.push(id);
    }

    if (newly.length > 0) {
      // แจ้งทีละอันแบบอ่านง่าย
      for (const id of newly) {
        const def = ACHIEVEMENT_DEFS.find((x) => x.id === id);
        if (!def) continue;
        Alert.alert("Achievement Unlocked!", `${def.title}\n${def.description}`);
      }
    }

    prevUnlockedRef.current = now;
  }, [uid, ach]);

  return { streaks, achievements: ach };
}
