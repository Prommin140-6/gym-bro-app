// src/services/exerciseCatalog.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "./firebase";
import type { ActivityKey } from "../utils/met";

const KEY_VERSION = "exerciseCatalog:version";
const KEY_ITEMS = "exerciseCatalog:items";

export type ExerciseCatalogDoc = {
  id: string;
  name?: string;
  desc?: string;
  images?: string[];
  mappedActivityKey?: ActivityKey | string;

  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string;
  instructions?: string[];
  category?: string;
  level?: string;
  force?: string;
  mechanic?: string;
};

type CatalogState = {
  items: ExerciseCatalogDoc[];
  loading: boolean;
  error: string | null;
  version: number;
};

async function readCache(): Promise<{ version: number; items: ExerciseCatalogDoc[] } | null> {
  const [v, raw] = await Promise.all([
    AsyncStorage.getItem(KEY_VERSION),
    AsyncStorage.getItem(KEY_ITEMS),
  ]);
  if (!v || !raw) return null;
  try {
    return { version: Number(v), items: JSON.parse(raw) as ExerciseCatalogDoc[] };
  } catch {
    return null;
  }
}

async function writeCache(version: number, items: ExerciseCatalogDoc[]) {
  await Promise.all([
    AsyncStorage.setItem(KEY_VERSION, String(version)),
    AsyncStorage.setItem(KEY_ITEMS, JSON.stringify(items)),
  ]);
}

async function fetchRemoteVersion(): Promise<number> {
  const metaRef = doc(db, "exercise_catalog_meta", "main");
  const snap = await getDoc(metaRef);
  if (!snap.exists()) return 0;
  return Number(snap.data().version ?? 0);
}

async function fetchAllExercises(): Promise<ExerciseCatalogDoc[]> {
  const colRef = collection(db, "exercise_catalog");
  const qs = await getDocs(colRef);
  return qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ExerciseCatalogDoc[];
}

/**
 * ✅ ใช้ตัวเดียวทั้งแอพ
 * - โหลด cache ก่อน (ถ้ามี)
 * - แล้ว sync Firestore ใน background
 * - มี loading/error/version ชัดเจน
 */
export function useExerciseCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({
    items: [],
    loading: true,
    error: null,
    version: 0,
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1) cache
        const cached = await readCache();
        if (!alive) return;

        if (cached?.items?.length) {
          setState((s) => ({
            ...s,
            items: cached.items,
            version: cached.version,
            loading: true, // ยัง loading ต่อเพื่อ sync
            error: null,
          }));
        }

        // 2) remote version
        const localVersion = cached?.version ?? 0;
        const remoteVersion = await fetchRemoteVersion();

        const shouldFetch = remoteVersion > localVersion || !cached?.items?.length;

        if (!shouldFetch) {
          if (!alive) return;
          setState((s) => ({ ...s, loading: false, error: null, version: localVersion }));
          return;
        }

        // 3) fetch all
        const fresh = await fetchAllExercises();
        if (!alive) return;

        const v = remoteVersion > 0 ? remoteVersion : Math.max(localVersion, 1);

        setState({
          items: fresh,
          loading: false,
          error: null,
          version: v,
        });

        await writeCache(v, fresh);
      } catch (e: any) {
        if (!alive) return;
        const msg = e?.message ? String(e.message) : String(e);
        console.error("[exerciseCatalog] sync failed:", e);

        // ถ้ามีของเดิมอยู่แล้ว ก็ยังให้ใช้ได้ (ไม่ทำให้จอว่าง)
        setState((s) => ({
          ...s,
          loading: false,
          error: msg,
        }));
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/**
 * ✅ คืนรายการท่าตามหมวด (ActivityKey)
 * (return เป็น array เสมอ)
 */
export function useExercisesForActivityKey(activityKey: ActivityKey): ExerciseCatalogDoc[] {
  const { items } = useExerciseCatalog();

  return useMemo(() => {
    return items.filter((x) => String(x.mappedActivityKey) === String(activityKey));
  }, [items, activityKey]);
}
