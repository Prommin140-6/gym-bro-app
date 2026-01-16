import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type UserProfileDoc = {
  // snake_case (รองรับ hook / logic เดิม)
  weight_kg: number;
  height_cm?: number;

  sex?: "male" | "female";
  age?: number;

  // camelCase (ข้อมูลจริงใน Firestore)
  weightKg?: number;
  heightCm?: number;

  exerciseStyle?: string;

  // goal (รองรับทั้ง goal / goalType)
  goalType?: string;
  goal?: string;

  // profile extensions
  firstName?: string | null;
  lastName?: string | null;
  dob?: string | null; // YYYY-MM-DD
  photoURL?: string;
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

    // profile extensions
    firstName: typeof data?.firstName === "string" ? data.firstName : null,
    lastName: typeof data?.lastName === "string" ? data.lastName : null,
    dob: typeof data?.dob === "string" ? data.dob : null,
    photoURL: typeof data?.photoURL === "string" ? data.photoURL : undefined,
  };
}

/**
 * Subscribe profile (robust)
 * Try:
 * 1) users/{uid}
 * 2) users/{uid}/profile/main
 */
export function subscribeUserProfile(
  uid: string,
  cb: (p: UserProfileDoc) => void
) {
  const ref1 = doc(db, "users", uid);

  let unsub2: (() => void) | null = null;

  const unsub1 = onSnapshot(ref1, (snap) => {
    if (snap.exists()) {
      cb(normalizeProfile(snap.data()));
      return;
    }

    // fallback: users/{uid}/profile/main
    if (!unsub2) {
      const ref2 = doc(db, "users", uid, "profile", "main");
      unsub2 = onSnapshot(ref2, (snap2) => {
        if (!snap2.exists()) {
          cb(DEFAULT_PROFILE);
          return;
        }
        cb(normalizeProfile(snap2.data()));
      });
    }
  });

  return () => {
    unsub1();
    if (unsub2) unsub2();
  };
}

/**
 * Update profile (merge)
 * Writes to users/{uid}
 * - Auto-calc age from dob when provided
 * - Backward compatible with manual age
 */
export type UpdateUserProfileInput = {
  sex?: "male" | "female";
  heightCm?: number;
  weightKg?: number;
  age?: number; // fallback สำหรับ user เก่า
  exerciseStyle?: string;
  goal?: string;
  goalType?: string;

  firstName?: string | null;
  lastName?: string | null;
  dob?: string | null; // YYYY-MM-DD

  photoURL?: string;
};

/**
 * Calculate age from DOB (YYYY-MM-DD)
 * Safe for timezone & birthday edge cases
 */
function calcAgeFromDob(dob: string): number {
  const [y, m, d] = dob.split("-").map(Number);
  const today = new Date();

  let age = today.getFullYear() - y;

  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > m ||
    (today.getMonth() + 1 === m && today.getDate() >= d);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export async function updateUserProfile(
  uid: string,
  patch: UpdateUserProfileInput
) {
  const ref = doc(db, "users", uid);

  const payload: UpdateUserProfileInput = { ...patch };

  // Auto-calc age when dob is provided
  if (patch.dob) {
    payload.age = calcAgeFromDob(patch.dob);
  }

  await setDoc(ref, payload, { merge: true });
}
