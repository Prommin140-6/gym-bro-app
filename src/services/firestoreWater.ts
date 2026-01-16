// src/services/firestoreWater.ts
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import { getDateKey } from "../utils/dateKey";

/**
 * Water Targets (settings)
 * - goalMlPerDay: daily target in ml (e.g. 2000)
 * - mlPerCup: how much ml per 1 cup (e.g. 250)
 */
export type WaterTargetsDoc = {
  goalMlPerDay: number;
  mlPerCup: number;
  updatedAt?: any;
};

export const defaultWaterTargets: WaterTargetsDoc = {
  goalMlPerDay: 2000,
  mlPerCup: 250,
};

export type WaterDailyDoc = {
  cups: number; // number of cups consumed on that date
  updatedAt?: any;
};

// ---------- helpers: paths ----------
function targetsRef(uid: string) {
  // users/{uid}/water/targets
  return doc(db, "users", uid, "water", "targets");
}

function dailyRef(uid: string, dateKey: string) {
  // users/{uid}/water_daily/{dateKey}
  return doc(db, "users", uid, "water_daily", dateKey);
}

// ---------- Targets (settings) ----------
export function subscribeWaterTargets(
  uid: string,
  onData: (doc: WaterTargetsDoc) => void,
  onError?: (err: unknown) => void
) {
  const ref = targetsRef(uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(defaultWaterTargets);
        return;
      }
      const data = snap.data() as Partial<WaterTargetsDoc>;
      onData({
        goalMlPerDay: typeof data.goalMlPerDay === "number" ? data.goalMlPerDay : defaultWaterTargets.goalMlPerDay,
        mlPerCup: typeof data.mlPerCup === "number" ? data.mlPerCup : defaultWaterTargets.mlPerCup,
        updatedAt: data.updatedAt,
      });
    },
    (err) => onError?.(err)
  );
}

export async function upsertWaterTargets(
  uid: string,
  patch: Partial<Pick<WaterTargetsDoc, "goalMlPerDay" | "mlPerCup">>
) {
  const ref = targetsRef(uid);

  // validate & sanitize
  const goalMlPerDay =
    typeof patch.goalMlPerDay === "number" && isFinite(patch.goalMlPerDay)
      ? Math.max(250, Math.round(patch.goalMlPerDay))
      : undefined;

  const mlPerCup =
    typeof patch.mlPerCup === "number" && isFinite(patch.mlPerCup)
      ? Math.max(50, Math.round(patch.mlPerCup))
      : undefined;

  await setDoc(
    ref,
    {
      ...(goalMlPerDay !== undefined ? { goalMlPerDay } : {}),
      ...(mlPerCup !== undefined ? { mlPerCup } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// ---------- Daily (today) ----------
export function subscribeWaterForDate(
  uid: string,
  dateKey: string,
  onData: (doc: WaterDailyDoc) => void,
  onError?: (err: unknown) => void
) {
  const ref = dailyRef(uid, dateKey);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData({ cups: 0 });
        return;
      }
      const data = snap.data() as Partial<WaterDailyDoc>;
      onData({
        cups: typeof data.cups === "number" ? data.cups : 0,
        updatedAt: data.updatedAt,
      });
    },
    (err) => onError?.(err)
  );
}

export function subscribeWaterToday(
  uid: string,
  onData: (doc: WaterDailyDoc) => void,
  onError?: (err: unknown) => void
) {
  const dateKey = getDateKey(new Date());
  return subscribeWaterForDate(uid, dateKey, onData, onError);
}

/**
 * Set today's cups to an exact value (clamped at >= 0).
 */
export async function setTodayWaterCups(uid: string, cups: number) {
  const dateKey = getDateKey(new Date());
  const ref = dailyRef(uid, dateKey);

  const safeCups =
    typeof cups === "number" && isFinite(cups) ? Math.max(0, Math.round(cups)) : 0;

  await setDoc(
    ref,
    {
      cups: safeCups,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Increment today's cups by delta using a transaction (safe for multi-taps / multi-devices).
 * delta can be +1 or -1.
 */
export async function incrementTodayWaterCups(uid: string, delta: number) {
  const dateKey = getDateKey(new Date());
  const ref = dailyRef(uid, dateKey);

  const d =
    typeof delta === "number" && isFinite(delta) ? Math.round(delta) : 0;
  if (d === 0) return;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? Number((snap.data() as any).cups ?? 0) : 0;
    const next = Math.max(0, current + d);

    if (!snap.exists()) {
      tx.set(ref, { cups: next, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      tx.set(ref, { cups: next, updatedAt: serverTimestamp() }, { merge: true });
    }
  });
}
