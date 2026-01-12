// src/services/firestoreActivity.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { getDateKey } from "../utils/dateKey";
import type { ActivityKey, Intensity } from "../utils/met";

export type ActivityLog = {
  id: string;
  activityKey: ActivityKey;
  intensity: Intensity;
  minutes: number;
  met: number;
  kcal_burned: number;
  distance_km: number;
  createdAt?: any;
  updatedAt?: any;
};

// ✅ NEW: subscribe activities by dateKey
export function subscribeActivitiesByDateKey(
  uid: string,
  dateKey: string,
  cb: (logs: ActivityLog[]) => void
) {
  const q = query(
    collection(db, "users", uid, "dailyLogs", dateKey, "activities"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const items: ActivityLog[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        activityKey: data.activityKey,
        intensity: data.intensity,
        minutes: Number(data.minutes ?? 0),
        met: Number(data.met ?? 0),
        kcal_burned: Number(data.kcal_burned ?? 0),
        distance_km: Number(data.distance_km ?? 0),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    cb(items);
  });
}

export function subscribeTodayActivities(uid: string, cb: (logs: ActivityLog[]) => void) {
  const dateKey = getDateKey();
  return subscribeActivitiesByDateKey(uid, dateKey, cb);
}

export async function addActivityToToday(params: {
  uid: string;
  activityKey: ActivityKey;
  intensity: Intensity;
  minutes: number;
  met: number;
  kcal_burned: number;
  distance_km?: number;
}) {
  const dateKey = getDateKey();
  await addDoc(collection(db, "users", params.uid, "dailyLogs", dateKey, "activities"), {
    activityKey: params.activityKey,
    intensity: params.intensity,
    minutes: params.minutes,
    met: params.met,
    kcal_burned: params.kcal_burned,
    distance_km: params.distance_km ?? 0,
    createdAt: serverTimestamp(),
  });
}

export async function updateTodayActivity(params: {
  uid: string;
  logId: string;
  intensity: Intensity;
  minutes: number;
  met: number;
  kcal_burned: number;
  distance_km?: number;
}) {
  const dateKey = getDateKey();
  const ref = doc(db, "users", params.uid, "dailyLogs", dateKey, "activities", params.logId);
  await updateDoc(ref, {
    intensity: params.intensity,
    minutes: params.minutes,
    met: params.met,
    kcal_burned: params.kcal_burned,
    distance_km: params.distance_km ?? 0,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTodayActivity(uid: string, logId: string) {
  const dateKey = getDateKey();
  const ref = doc(db, "users", uid, "dailyLogs", dateKey, "activities", logId);
  await deleteDoc(ref);
}
