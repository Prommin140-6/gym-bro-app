import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type GoalsDoc = {
  burnTarget: number;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  customized: boolean;
  updatedAt?: any;
};

export const defaultGoals: GoalsDoc = {
  burnTarget: 400,
  calorieTarget: 2300,
  proteinTarget: 150,
  carbTarget: 300,
  fatTarget: 70,
  customized: false,
  updatedAt: null,
};

function normalizeGoals(data: any): GoalsDoc {
  return {
    ...defaultGoals,
    ...data,
    burnTarget: Number(data?.burnTarget ?? defaultGoals.burnTarget),
    calorieTarget: Number(data?.calorieTarget ?? defaultGoals.calorieTarget),
    proteinTarget: Number(data?.proteinTarget ?? defaultGoals.proteinTarget),
    carbTarget: Number(data?.carbTarget ?? defaultGoals.carbTarget),
    fatTarget: Number(data?.fatTarget ?? defaultGoals.fatTarget),
    customized: Boolean(data?.customized ?? defaultGoals.customized),
    updatedAt: data?.updatedAt ?? null,
  };
}

/**
 * ✅ Hook เดิมของโปรเจกต์คุณใช้ตัวนี้อยู่: subscribeGoals
 * path: users/{uid}/goals/targets (doc)
 */
export function subscribeGoals(uid: string, cb: (g: GoalsDoc) => void) {
  const ref = doc(db, "users", uid, "goals", "targets");

  console.log("[subscribeGoals] path = users/%s/goals/targets", uid);

  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      console.log("[subscribeGoals] doc not found -> using defaultGoals");
      cb(defaultGoals);
      return;
    }
    const data = normalizeGoals(snap.data());
    console.log("[subscribeGoals] doc found ->", JSON.stringify(data));
    cb(data);
  });
}

/**
 * ✅ upsert goals targets
 */
export async function upsertGoals(uid: string, patch: Partial<GoalsDoc>) {
  const ref = doc(db, "users", uid, "goals", "targets");
  await setDoc(
    ref,
    {
      ...patch,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * ✅ NEW: GoalsState = รู้ว่า "doc มีจริงไหม"
 * ใช้สำหรับกันไม่ให้ autoDailySummary เขียนค่า default (400/2300) ตอน goals ยังโหลดไม่มา
 */
export type GoalsState = {
  exists: boolean;
  data: GoalsDoc;
};

/**
 * ✅ NEW: subscribeGoalsState
 * - exists=false => data=defaultGoals
 * - exists=true  => data=normalizeGoals(doc)
 */
export function subscribeGoalsState(uid: string, cb: (s: GoalsState) => void) {
  const ref = doc(db, "users", uid, "goals", "targets");

  console.log("[subscribeGoalsState] path = users/%s/goals/targets", uid);

  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      cb({ exists: false, data: defaultGoals });
      return;
    }

    cb({
      exists: true,
      data: normalizeGoals(snap.data()),
    });
  });
}
