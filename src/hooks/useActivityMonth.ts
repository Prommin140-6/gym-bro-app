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
function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(1);
  return x;
}
function endOfMonth(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  x.setMonth(x.getMonth() + 1, 0); // last day of month
  return x;
}

export function useActivityMonth(uid: string | null, baseDate: Date) {
  const [monthDocs, setMonthDocs] = useState<Record<string, DailySummaryDoc>>({});
  const [loadingMonth, setLoadingMonth] = useState(true);

  const monthStart = useMemo(() => startOfMonth(baseDate), [baseDate]);
  const monthEnd = useMemo(() => endOfMonth(baseDate), [baseDate]);

  const monthStartKey = useMemo(() => toDateKey(monthStart), [monthStart]);
  const monthEndKey = useMemo(() => toDateKey(monthEnd), [monthEnd]);

  useEffect(() => {
    if (!uid) {
      setMonthDocs({});
      setLoadingMonth(false);
      return;
    }

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
        console.warn("[useActivityMonth] month onSnapshot error:", err);
        setMonthDocs({});
        setLoadingMonth(false);
      }
    );

    return unsub;
  }, [uid, monthStartKey, monthEndKey]);

  return { loadingMonth, monthDocs, monthStartKey, monthEndKey };
}
