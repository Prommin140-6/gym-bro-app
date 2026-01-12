import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export type UserProfileDoc = {
  // ✅ snake_case (ไว้ให้ hook เดิมของคุณใช้ได้)
  weight_kg: number;
  height_cm?: number;

  sex?: "male" | "female";
  age?: number;

  // ✅ camelCase (ตรงกับ data ใน Firestore ของคุณ)
  weightKg?: number;
  heightCm?: number;

  exerciseStyle?: string;

  // รองรับทั้ง goal/goalType (ของคุณใช้ goal)
  goalType?: string;
  goal?: string;
};

const DEFAULT_PROFILE: UserProfileDoc = {
  weight_kg: 66,
};

function toNum(v: any, fallback?: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProfile(data: any): UserProfileDoc {
  const weightKg = toNum(data?.weightKg ?? data?.weight_kg, DEFAULT_PROFILE.weight_kg)!;
  const heightCm = toNum(data?.heightCm ?? data?.height_cm, undefined);

  const sex = data?.sex as UserProfileDoc["sex"] | undefined;
  const age = data?.age != null ? toNum(data.age, undefined) : undefined;

  const exerciseStyle = data?.exerciseStyle ?? data?.exercise_style;
  const goal = data?.goal;
  const goalType = data?.goalType ?? data?.goal_type ?? goal;

  return {
    // snake_case
    weight_kg: weightKg,
    height_cm: heightCm,

    // camelCase
    weightKg,
    heightCm,

    sex,
    age,
    exerciseStyle,
    goalType,
    goal,
  };
}

/**
 * ✅ Subscribe profile (robust)
 * Try:
 * 1) users/{uid}
 * 2) users/{uid}/profile/main
 */
export function subscribeUserProfile(uid: string, cb: (p: UserProfileDoc) => void) {
  const ref1 = doc(db, "users", uid);

  let unsub2: (() => void) | null = null;

  const unsub1 = onSnapshot(ref1, (snap) => {
    if (snap.exists()) {
      cb(normalizeProfile(snap.data()));
      return;
    }

    // fallback to users/{uid}/profile/main
    if (!unsub2) {
      const ref2 = doc(db, "users", uid, "profile", "main");
      unsub2 = onSnapshot(ref2, (snap2) => {
        if (!snap2.exists()) return cb(DEFAULT_PROFILE);
        cb(normalizeProfile(snap2.data()));
      });
    }
  });

  return () => {
    unsub1();
    if (unsub2) unsub2();
  };
}
