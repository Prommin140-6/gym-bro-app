import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getDateKey } from "../utils/dateKey";

export type DailySummaryDoc = {
  totalBurnedCalories: number;
  totalDistanceKm: number;

  burnTarget?: number;
  calorieTarget?: number;
  eatenCalories?: number;

  restDay?: boolean;
  burnSuccess?: boolean;
  calorieSuccess?: boolean;
  success?: boolean;

  updatedAt?: any;
};

export const defaultDailySummary: DailySummaryDoc = {
  totalBurnedCalories: 0,
  totalDistanceKm: 0,
  burnTarget: 0,
  calorieTarget: 0,
  eatenCalories: 0,
  restDay: false,
  burnSuccess: false,
  calorieSuccess: false,
  success: false,
};

function normalize(data: any): DailySummaryDoc {
  return {
    totalBurnedCalories: Number(data?.totalBurnedCalories ?? 0),
    totalDistanceKm: Number(data?.totalDistanceKm ?? 0),

    burnTarget: Number(data?.burnTarget ?? 0),
    calorieTarget: Number(data?.calorieTarget ?? 0),
    eatenCalories: Number(data?.eatenCalories ?? 0),

    restDay: Boolean(data?.restDay ?? false),
    burnSuccess: Boolean(data?.burnSuccess ?? false),
    calorieSuccess: Boolean(data?.calorieSuccess ?? false),
    success: Boolean(data?.success ?? false),

    updatedAt: data?.updatedAt,
  };
}

// ✅ NEW: subscribe by dateKey
export function subscribeDailySummaryByDateKey(
  uid: string,
  dateKey: string,
  cb: (d: DailySummaryDoc) => void
) {
  const ref = doc(db, "users", uid, "daily_summary", dateKey);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return cb(defaultDailySummary);
    cb(normalize(snap.data()));
  });
}

export function subscribeTodayDailySummary(uid: string, cb: (d: DailySummaryDoc) => void) {
  const dateKey = getDateKey();
  return subscribeDailySummaryByDateKey(uid, dateKey, cb);
}

export async function upsertTodayDailySummary(uid: string, patch: Partial<DailySummaryDoc>) {
  const dateKey = getDateKey();
  const ref = doc(db, "users", uid, "daily_summary", dateKey);
  await setDoc(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}
