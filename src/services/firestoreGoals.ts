import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type GoalsDoc = {
    calorieTarget: number;
    carbTarget: number;
    proteinTarget: number;
    fatTarget: number;
    updatedAt?: any;
};

export const defaultGoals: GoalsDoc = {
    calorieTarget: 2300,
    carbTarget: 300,
    proteinTarget: 150,
    fatTarget: 70,
};

export function subscribeGoals(uid: string, cb: (g: GoalsDoc) => void) {
    const ref = doc(db, "users", uid, "goals", "targets");
    return onSnapshot(ref, (snap) => {
        if (!snap.exists()) return cb(defaultGoals);
        const d = snap.data() as any;
        cb({
            calorieTarget: Number(d.calorieTarget ?? defaultGoals.calorieTarget),
            carbTarget: Number(d.carbTarget ?? defaultGoals.carbTarget),
            proteinTarget: Number(d.proteinTarget ?? defaultGoals.proteinTarget),
            fatTarget: Number(d.fatTarget ?? defaultGoals.fatTarget),
            updatedAt: d.updatedAt,
        });
    });
}

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
