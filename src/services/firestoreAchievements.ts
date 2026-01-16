// src/services/firestoreAchievements.ts
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type AchievementType = "burn" | "calorie" | "fire";
export type TargetDays = 7 | 14 | 21 | 30;

export type AchievementDoc = {
  id: string;
  type: AchievementType;
  targetDays: TargetDays;

  unlocked: boolean;
  unlockedAt: any | null;

  lastEvaluatedDateKey?: string;
};

export const ACHIEVEMENT_DEFS: Array<{
  id: string;
  type: AchievementType;
  targetDays: TargetDays;
  title: string;
  description: string;
}> = [
  // Burn
  {
    id: "burn_7",
    type: "burn",
    targetDays: 7,
    title: "Burn Streak 7",
    description: "เผาผลาญถึงเป้าต่อเนื่อง 7 วัน",
  },
  {
    id: "burn_14",
    type: "burn",
    targetDays: 14,
    title: "Burn Streak 14",
    description: "เผาผลาญถึงเป้าต่อเนื่อง 14 วัน",
  },
  {
    id: "burn_21",
    type: "burn",
    targetDays: 21,
    title: "Burn Streak 21",
    description: "เผาผลาญถึงเป้าต่อเนื่อง 21 วัน",
  },
  {
    id: "burn_30",
    type: "burn",
    targetDays: 30,
    title: "Burn Streak 30",
    description: "เผาผลาญถึงเป้าต่อเนื่อง 30 วัน",
  },

  // Calorie
  {
    id: "calorie_7",
    type: "calorie",
    targetDays: 7,
    title: "Food Streak 7",
    description: "กินถึงเป้าต่อเนื่อง 7 วัน",
  },
  {
    id: "calorie_14",
    type: "calorie",
    targetDays: 14,
    title: "Food Streak 14",
    description: "กินถึงเป้าต่อเนื่อง 14 วัน",
  },
  {
    id: "calorie_21",
    type: "calorie",
    targetDays: 21,
    title: "Food Streak 21",
    description: "กินถึงเป้าต่อเนื่อง 21 วัน",
  },
  {
    id: "calorie_30",
    type: "calorie",
    targetDays: 30,
    title: "Food Streak 30",
    description: "กินถึงเป้าต่อเนื่อง 30 วัน",
  },

  // Fire (burn + calorie success ทุกวัน)
  {
    id: "fire_7",
    type: "fire",
    targetDays: 7,
    title: "Fire Streak 7",
    description: "ทำสำเร็จทั้งกิน+เผาต่อเนื่อง 7 วัน",
  },
  {
    id: "fire_14",
    type: "fire",
    targetDays: 14,
    title: "Fire Streak 14",
    description: "ทำสำเร็จทั้งกิน+เผาต่อเนื่อง 14 วัน",
  },
  {
    id: "fire_21",
    type: "fire",
    targetDays: 21,
    title: "Fire Streak 21",
    description: "ทำสำเร็จทั้งกิน+เผาต่อเนื่อง 21 วัน",
  },
  {
    id: "fire_30",
    type: "fire",
    targetDays: 30,
    title: "Fire Streak 30",
    description: "ทำสำเร็จทั้งกิน+เผาต่อเนื่อง 30 วัน",
  },
];

function normalize(d: any): AchievementDoc {
  return {
    id: String(d?.id ?? ""),
    type: (d?.type ?? "burn") as AchievementType,
    targetDays: (d?.targetDays ?? 7) as TargetDays,
    unlocked: Boolean(d?.unlocked ?? false),
    unlockedAt: d?.unlockedAt ?? null,
    lastEvaluatedDateKey: d?.lastEvaluatedDateKey,
  };
}

export function subscribeAchievements(
  uid: string,
  cb: (docs: Record<string, AchievementDoc>) => void
) {
  const colRef = collection(db, "users", uid, "achievements");
  return onSnapshot(colRef, (snap) => {
    const out: Record<string, AchievementDoc> = {};
    snap.forEach((docSnap) => {
      const data = normalize(docSnap.data());
      const id = docSnap.id;
      out[id] = { ...data, id: data.id || id };
    });
    cb(out);
  });
}

export async function unlockAchievement(
  uid: string,
  def: (typeof ACHIEVEMENT_DEFS)[number],
  patch?: { lastEvaluatedDateKey?: string }
) {
  const ref = doc(db, "users", uid, "achievements", def.id);
  await setDoc(
    ref,
    {
      id: def.id,
      type: def.type,
      targetDays: def.targetDays,
      unlocked: true,
      unlockedAt: serverTimestamp(),
      ...(patch?.lastEvaluatedDateKey
        ? { lastEvaluatedDateKey: patch.lastEvaluatedDateKey }
        : {}),
    },
    { merge: true }
  );
}

/**
 * สร้าง "Achievement เริ่มต้น" ให้ครบชุด (ยังไม่ปลดล็อค)
 * - ทำครั้งแรกหลัง login เพื่อให้ Firestore มี docs ครบสำหรับทำ UI/ทดสอบ
 * - จะสร้างเฉพาะ docs ที่ยังไม่มี เพื่อไม่ทับของที่ปลดล็อคแล้ว
 */
export async function ensureAchievementsInitialized(uid: string) {
  const colRef = collection(db, "users", uid, "achievements");

  // อ่านว่ามี doc อะไรอยู่แล้วบ้าง (กันทับ unlocked ที่ปลดแล้ว)
  const snap = await getDocs(colRef);
  const existing = new Set<string>();
  snap.forEach((d) => existing.add(d.id));

  const tasks: Promise<any>[] = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (existing.has(def.id)) continue;

    const ref = doc(db, "users", uid, "achievements", def.id);
    tasks.push(
      setDoc(
        ref,
        {
          id: def.id,
          type: def.type,
          targetDays: def.targetDays,
          unlocked: false,
          unlockedAt: null,
        },
        { merge: true }
      )
    );
  }

  await Promise.all(tasks);
}
