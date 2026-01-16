import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";

/**
 * Shape ของ profile ตามที่ใช้จริงในโปรเจค
 * (ไม่เดา – อิงจาก field ที่ถูกอ่านใน EditProfileScreen)
 */
export type UserProfileShape = {
  // profile photo
  photoURL?: string | null;

  // basic info
  sex?: "male" | "female";
  age?: number;

  // body
  heightCm?: number;
  weightKg?: number;

  // fallback (snake_case จากของเก่า)
  height_cm?: number;
  weight_kg?: number;

  // activity / goal
  exerciseStyle?: string;
  exercise_style?: string;
  goal?: string;
  goalType?: string;
};

export function useUserProfile(uid: string | null) {
  const [profile, setProfile] = useState<UserProfileShape>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile({});
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        setProfile((data ?? {}) as UserProfileShape);
        setLoading(false);
      },
      () => {
        setProfile({});
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  return { profile, loading };
}
